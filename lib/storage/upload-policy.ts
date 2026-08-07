export type UploadKind = "cover" | "audio" | "asset";

export type UploadRule = {
  folder: string;
  maxSizeBytes: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
};

export const UPLOAD_RULES: Record<UploadKind, UploadRule> = {
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

export function isUploadKind(value: unknown): value is UploadKind {
  return value === "cover" || value === "audio" || value === "asset";
}

export function getFileExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  if (index < 0) return "";
  return fileName.slice(index).toLowerCase();
}

export function resolveUploadBucket(kind: UploadKind) {
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
