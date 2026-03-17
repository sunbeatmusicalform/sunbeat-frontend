import { createSupabaseAdmin } from "@/lib/supabase/admin";

const FILE_ACCESS_STATS_TABLE = "file_access_stats";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const EXTENSION_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".txt": "text/plain",
};

export type FileMetricKind = "view" | "download";

export type FileAccessStats = {
  file_key: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  access_count: number;
  download_count: number;
  last_accessed_at: string | null;
  last_downloaded_at: string | null;
  created_at?: string;
  updated_at?: string;
};

function trimEnv(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function nowIso() {
  return new Date().toISOString();
}

function buildFileKey(bucket: string, storagePath: string) {
  return `${bucket}:${storagePath}`;
}

function isMissingStatsTableError(message: string | null | undefined) {
  const safeMessage = message?.toLowerCase() ?? "";
  return (
    safeMessage.includes("relation") && safeMessage.includes("does not exist")
  ) || safeMessage.includes("could not find the table");
}

export function resolveAllowedStorageBuckets() {
  return new Set(
    [
      trimEnv(process.env.SUPABASE_COVERS_BUCKET),
      trimEnv(process.env.SUPABASE_AUDIO_BUCKET),
      trimEnv(process.env.SUPABASE_ASSETS_BUCKET),
      "sunbeat-covers",
      "sunbeat-audio",
    ].filter(Boolean) as string[]
  );
}

export function isAllowedStorageBucket(bucket: string) {
  return resolveAllowedStorageBuckets().has(bucket);
}

export function encodeStoragePath(storagePath: string) {
  return storagePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function decodeStoragePath(segments: string[]) {
  return segments.map((segment) => decodeURIComponent(segment)).join("/");
}

export function getFileNameFromStoragePath(storagePath: string) {
  const parts = storagePath.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "arquivo";
}

export function getFileExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  if (index < 0) return "";
  return fileName.slice(index).toLowerCase();
}

export function guessMimeTypeFromFileName(fileName: string) {
  return EXTENSION_MIME_TYPES[getFileExtension(fileName)] ?? "application/octet-stream";
}

export function buildFileViewPath(bucket: string, storagePath: string) {
  return `/files/${encodeURIComponent(bucket)}/${encodeStoragePath(storagePath)}`;
}

export function buildFileDownloadPath(bucket: string, storagePath: string) {
  return `/files/${encodeURIComponent(bucket)}/download/${encodeStoragePath(storagePath)}`;
}

export function buildAbsoluteAppUrl(origin: string, path: string) {
  return new URL(path, origin).toString();
}

export function buildFileAccessUrls(args: {
  origin: string;
  bucket: string;
  storagePath: string;
}) {
  const previewPath = buildFileViewPath(args.bucket, args.storagePath);
  const downloadPath = buildFileDownloadPath(args.bucket, args.storagePath);

  return {
    previewPath,
    downloadPath,
    previewUrl: buildAbsoluteAppUrl(args.origin, previewPath),
    downloadUrl: buildAbsoluteAppUrl(args.origin, downloadPath),
  };
}

export async function createSignedStorageUrl(args: {
  bucket: string;
  storagePath: string;
  downloadFileName?: string;
}) {
  const supabase = createSupabaseAdmin();
  const options = args.downloadFileName ? { download: args.downloadFileName } : undefined;

  const { data, error } = await supabase.storage
    .from(args.bucket)
    .createSignedUrl(args.storagePath, SIGNED_URL_TTL_SECONDS, options);

  if (error) {
    throw new Error(error.message || "Falha ao gerar URL assinada.");
  }

  return data?.signedUrl ?? null;
}

export async function getFileAccessStats(args: {
  bucket: string;
  storagePath: string;
}) {
  const supabase = createSupabaseAdmin();
  const fileKey = buildFileKey(args.bucket, args.storagePath);

  const { data, error } = await supabase
    .from(FILE_ACCESS_STATS_TABLE)
    .select("*")
    .eq("file_key", fileKey)
    .maybeSingle<FileAccessStats>();

  if (error) {
    if (isMissingStatsTableError(error.message)) {
      return null;
    }

    throw new Error(error.message || "Falha ao consultar métricas do arquivo.");
  }

  return data ?? undefined;
}

export async function recordFileMetric(args: {
  bucket: string;
  storagePath: string;
  fileName?: string | null;
  mimeType?: string | null;
  kind: FileMetricKind;
}) {
  const existing = await getFileAccessStats({
    bucket: args.bucket,
    storagePath: args.storagePath,
  }).catch((error) => {
    if (isMissingStatsTableError(error instanceof Error ? error.message : null)) {
      return null;
    }

    throw error;
  });

  if (existing === null) {
    return null;
  }

  const currentTimestamp = nowIso();
  const nextRow: FileAccessStats = {
    file_key: buildFileKey(args.bucket, args.storagePath),
    storage_bucket: args.bucket,
    storage_path: args.storagePath,
    file_name: args.fileName ?? existing?.file_name ?? null,
    mime_type: args.mimeType ?? existing?.mime_type ?? null,
    access_count:
      (existing?.access_count ?? 0) + (args.kind === "view" ? 1 : 0),
    download_count:
      (existing?.download_count ?? 0) + (args.kind === "download" ? 1 : 0),
    last_accessed_at:
      args.kind === "view"
        ? currentTimestamp
        : existing?.last_accessed_at ?? null,
    last_downloaded_at:
      args.kind === "download"
        ? currentTimestamp
        : existing?.last_downloaded_at ?? null,
    created_at: existing?.created_at ?? currentTimestamp,
    updated_at: currentTimestamp,
  };

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from(FILE_ACCESS_STATS_TABLE)
    .upsert(nextRow, { onConflict: "file_key" });

  if (error) {
    if (isMissingStatsTableError(error.message)) {
      return null;
    }

    throw new Error(error.message || "Falha ao registrar acesso do arquivo.");
  }

  return nextRow;
}
