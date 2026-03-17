import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/server/backend-api";
import { buildFileAccessUrls } from "@/lib/server/storage-files";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

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
    maxSizeBytes: 15 * 1024 * 1024,
    allowedExtensions: [".jpg", ".jpeg", ".png"],
    allowedMimeTypes: ["image/jpeg", "image/png"],
  },
  audio: {
    folder: "audio",
    maxSizeBytes: 150 * 1024 * 1024,
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

function getStorageErrorMessage(message: string | null | undefined, bucket: string) {
  const safeMessage = message?.trim();
  if (!safeMessage) {
    return "Falha ao enviar arquivo para o storage.";
  }

  if (/bucket not found/i.test(safeMessage)) {
    return `Bucket de upload não encontrado: ${bucket}.`;
  }

  return safeMessage;
}

function getRequestOrigin(req: Request) {
  const url = new URL(req.url);
  const protocol = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;

  return `${protocol}://${host}`;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const kind = formData.get("kind");
    const workspaceSlug = String(formData.get("workspaceSlug") || "atabaque");
    const draftToken = String(formData.get("draftToken") || "");
    const trackLocalId = String(formData.get("trackLocalId") || "");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, message: "Arquivo não enviado." },
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
    const extension = getFileExtension(file.name);
    const mimeType = file.type.toLowerCase();

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

    if (file.size > rules.maxSizeBytes) {
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
    const safeFileName = sanitizeFileName(file.name);
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
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          ok: false,
          message: getStorageErrorMessage(uploadError.message, bucket),
        },
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
      file_name: file.name,
      storage_bucket: bucket,
      storage_path: storagePath,
      public_url: fileLinks.previewUrl,
      download_url: fileLinks.downloadUrl,
      mime_type: file.type || null,
      size_bytes: file.size,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(error, "Falha no upload."),
      },
      { status: 500 }
    );
  }
}
