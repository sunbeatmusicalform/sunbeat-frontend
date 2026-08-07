import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/server/backend-api";
import {
  buildFileAccessUrls,
  createSignedStorageUrl,
} from "@/lib/server/storage-files";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getWorkspaceEntitlements } from "@/lib/billing/entitlements";
import { sanitizeWorkspaceSlug } from "@/lib/tenant";
import {
  getFileExtension,
  isUploadKind,
  resolveUploadBucket,
  UPLOAD_RULES,
} from "@/lib/storage/upload-policy";
import { createUploadVerificationGrant } from "@/lib/security/upload-verification";

export const runtime = "nodejs";

function sanitizeSegment(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function sanitizeFileName(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function getRequestOrigin(req: Request) {
  const url = new URL(req.url);
  const protocol =
    req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;

  return `${protocol}://${host}`;
}

export async function POST(req: Request) {
  try {
    const body: {
      kind?: unknown;
      fileName?: unknown;
      mimeType?: unknown;
      fileSize?: unknown;
      workspaceSlug?: unknown;
      draftToken?: unknown;
      trackLocalId?: unknown;
    } = await req.json();

    const rawKind = body.kind;
    const fileName = String(body.fileName || "");
    const mimeType = String(body.mimeType || "").toLowerCase();
    const fileSize = Number(body.fileSize || 0);
    const workspaceSlug = String(body.workspaceSlug || "");
    const draftToken = String(body.draftToken || "");
    const trackLocalId = String(body.trackLocalId || "");

    if (!fileName) {
      return NextResponse.json(
        { ok: false, message: "Nome do arquivo é obrigatório." },
        { status: 400 }
      );
    }

    if (!draftToken) {
      return NextResponse.json(
        { ok: false, message: "draftToken é obrigatório para upload." },
        { status: 400 }
      );
    }

    const normalizedWorkspaceSlug = sanitizeWorkspaceSlug(workspaceSlug);
    if (!normalizedWorkspaceSlug || normalizedWorkspaceSlug !== workspaceSlug.trim().toLowerCase()) {
      return NextResponse.json(
        { ok: false, message: "Workspace inválido." },
        { status: 400 }
      );
    }

    if (!isUploadKind(rawKind)) {
      return NextResponse.json(
        { ok: false, message: "Tipo de upload inválido." },
        { status: 400 }
      );
    }

    const kind = rawKind;
    const rules = UPLOAD_RULES[kind];
    const extension = getFileExtension(fileName);

    if (!rules.allowedExtensions.includes(extension)) {
      return NextResponse.json(
        {
          ok: false,
          message: `Formato inválido. Permitidos: ${rules.allowedExtensions.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (mimeType && !rules.allowedMimeTypes.includes(mimeType)) {
      return NextResponse.json(
        { ok: false, message: "O tipo MIME do arquivo não é permitido." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json(
        { ok: false, message: "Tamanho do arquivo inválido." },
        { status: 400 }
      );
    }

    let planLimitBytes = rules.maxSizeBytes;
    try {
      const entitlements = await getWorkspaceEntitlements(normalizedWorkspaceSlug);
      if (kind === "audio") {
        planLimitBytes = Math.min(planLimitBytes, entitlements.audioUploadMb * 1024 * 1024);
      } else if (kind === "cover") {
        planLimitBytes = Math.min(planLimitBytes, entitlements.coverUploadMb * 1024 * 1024);
      }
    } catch (error) {
      console.error("[uploads] Falha ao carregar entitlements:", error);
      return NextResponse.json(
        { ok: false, message: "Não foi possível validar o limite do plano." },
        { status: 503 }
      );
    }

    if (fileSize > planLimitBytes) {
      return NextResponse.json(
        {
          ok: false,
          message: `Arquivo excede o limite de ${Math.round(
            planLimitBytes / (1024 * 1024)
          )} MB.`,
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();
    const bucket = resolveUploadBucket(kind);
    const safeWorkspaceSlug = sanitizeSegment(normalizedWorkspaceSlug);
    const safeDraftToken = sanitizeSegment(draftToken);
    const safeTrackLocalId = sanitizeSegment(trackLocalId);
    const safeFileName = sanitizeFileName(fileName);
    const uniqueName = `${Date.now()}-${safeFileName}`;

    const pathParts = [
      safeWorkspaceSlug,
      "drafts",
      safeDraftToken,
      rules.folder,
      kind === "audio" && safeTrackLocalId ? safeTrackLocalId : null,
      uniqueName,
    ].filter(Boolean);

    const storagePath = pathParts.join("/");

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(storagePath);

    const signedUploadToken = data?.token ?? null;

    if (error || !signedUploadToken) {
      return NextResponse.json(
        { ok: false, message: error?.message || "Falha ao gerar upload assinado." },
        { status: 500 }
      );
    }

    const origin = getRequestOrigin(req);
    const fileLinks = buildFileAccessUrls({
      origin,
      bucket,
      storagePath,
    });

    const previewSignedUrl = await createSignedStorageUrl({
      bucket,
      storagePath,
    }).catch(() => null);
    const verificationToken = createUploadVerificationGrant({
      bucket,
      storagePath,
      workspaceSlug: normalizedWorkspaceSlug,
      kind,
    });

    return NextResponse.json({
      ok: true,
      file_id: `${bucket}:${storagePath}`,
      file_name: fileName,
      storage_bucket: bucket,
      storage_path: storagePath,
      public_url: fileLinks.previewUrl,
      download_url: fileLinks.downloadUrl,
      preview_signed_url: previewSignedUrl,
      mime_type: mimeType || null,
      size_bytes: fileSize || null,
      signed_upload_token: signedUploadToken,
      verification_token: verificationToken,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(error, "Falha ao preparar upload."),
      },
      { status: 500 }
    );
  }
}
