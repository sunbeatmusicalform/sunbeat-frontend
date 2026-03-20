import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/server/backend-api";
import { buildFileAccessUrls } from "@/lib/server/storage-files";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type UploadKind = "cover" | "audio" | "asset";

const UPLOAD_RULES: Record<
  UploadKind,
  {
    folder: string;
    maxSizeBytes: number;
    allowedExtensions: string[];
    allowedMimeTypes: string[];
  }
> = {
  cover: {
    folder: "cover",
    maxSizeBytes: 50 * 1024 * 1024,
    allowedExtensions: [".jpg", ".jpeg", ".png"],
    allowedMimeTypes: ["image/jpeg", "image/png"],
  },
  audio: {
    folder: "audio",
    maxSizeBytes: 100 * 1024 * 1024,
    allowedExtensions: [".wav", ".mp3"],
    allowedMimeTypes: ["audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3"],
  },
  asset: {
    folder: "assets",
    maxSizeBytes: 50 * 1024 * 1024,
    allowedExtensions: [".jpg", ".jpeg", ".png", ".pdf", ".zip"],
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
    ],
  },
};

function sanitizeSegment(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function sanitizeFileName(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function getFileExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  if (index < 0) return "";
  return fileName.slice(index).toLowerCase();
}

function resolveUploadBucket(kind: UploadKind) {
  if (kind === "cover") {
    return process.env.SUPABASE_COVERS_BUCKET?.trim() || "sunbeat-covers";
  }

  if (kind === "audio") {
    return process.env.SUPABASE_AUDIO_BUCKET?.trim() || "sunbeat-audio";
  }

  return (
    process.env.SUPABASE_ASSETS_BUCKET?.trim() ||
    process.env.SUPABASE_COVERS_BUCKET?.trim() ||
    "sunbeat-covers"
  );
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
    const body = await req.json();

    const kind = body?.kind;
    const fileName = String(body?.fileName || "");
    const mimeType = String(body?.mimeType || "").toLowerCase();
    const fileSize = Number(body?.fileSize || 0);
    const workspaceSlug = String(body?.workspaceSlug || "atabaque");
    const draftToken = String(body?.draftToken || "");
    const trackLocalId = String(body?.trackLocalId || "");

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

    if (kind !== "cover" && kind !== "audio" && kind !== "asset") {
      return NextResponse.json(
        { ok: false, message: "Tipo de upload inválido." },
        { status: 400 }
      );
    }

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

    if (fileSize > rules.maxSizeBytes) {
      return NextResponse.json(
        {
          ok: false,
          message: `Arquivo excede o limite de ${Math.round(
            rules.maxSizeBytes / (1024 * 1024)
          )} MB.`,
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();
    const bucket = resolveUploadBucket(kind);
    const safeWorkspaceSlug = sanitizeSegment(workspaceSlug || "atabaque");
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

    return NextResponse.json({
      ok: true,
      file_id: `${bucket}:${storagePath}`,
      file_name: fileName,
      storage_bucket: bucket,
      storage_path: storagePath,
      public_url: fileLinks.previewUrl,
      download_url: fileLinks.downloadUrl,
      mime_type: mimeType || null,
      size_bytes: fileSize || null,
      signed_upload_token: signedUploadToken,
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