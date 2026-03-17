import { NextResponse } from "next/server";
import {
  createSignedStorageUrl,
  decodeStoragePath,
  getFileNameFromStoragePath,
  guessMimeTypeFromFileName,
  isAllowedStorageBucket,
  recordFileMetric,
} from "@/lib/server/storage-files";

export async function GET(
  _req: Request,
  context: { params: Promise<{ bucket: string; storagePath: string[] }> }
) {
  const { bucket, storagePath: rawStoragePath } = await context.params;
  const storagePath = decodeStoragePath(rawStoragePath);

  if (!bucket || !storagePath || !isAllowedStorageBucket(bucket)) {
    return NextResponse.json(
      { ok: false, message: "Arquivo não encontrado." },
      { status: 404 }
    );
  }

  const fileName = getFileNameFromStoragePath(storagePath);
  const mimeType = guessMimeTypeFromFileName(fileName);

  await recordFileMetric({
    bucket,
    storagePath,
    fileName,
    mimeType,
    kind: "download",
  }).catch(() => null);

  try {
    const signedUrl = await createSignedStorageUrl({
      bucket,
      storagePath,
      downloadFileName: fileName,
    });

    if (!signedUrl) {
      return NextResponse.json(
        { ok: false, message: "Arquivo não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.redirect(signedUrl, 307);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Falha ao preparar download.",
      },
      { status: 500 }
    );
  }
}
