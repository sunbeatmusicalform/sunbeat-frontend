import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildFileDownloadPath,
  createSignedStorageUrl,
  decodeStoragePath,
  getFileNameFromStoragePath,
  guessMimeTypeFromFileName,
  isAllowedStorageBucket,
  recordFileMetric,
} from "@/lib/server/storage-files";

export const dynamic = "force-dynamic";

function getPreviewKind(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  return "generic";
}

export default async function FilePreviewPage({
  params,
}: {
  params: Promise<{ bucket: string; storagePath: string[] }>;
}) {
  const { bucket, storagePath: rawStoragePath } = await params;
  const storagePath = decodeStoragePath(rawStoragePath);

  if (!bucket || !storagePath || !isAllowedStorageBucket(bucket)) {
    notFound();
  }

  const fileName = getFileNameFromStoragePath(storagePath);
  const mimeType = guessMimeTypeFromFileName(fileName);
  const previewKind = getPreviewKind(mimeType);

  await recordFileMetric({
    bucket,
    storagePath,
    fileName,
    mimeType,
    kind: "view",
  }).catch(() => null);

  let signedPreviewUrl: string | null = null;

  try {
    signedPreviewUrl = await createSignedStorageUrl({
      bucket,
      storagePath,
    });
  } catch {
    notFound();
  }

  const downloadPath = buildFileDownloadPath(bucket, storagePath);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.10)]">
          <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Arquivo Sunbeat
                </div>
                <h1 className="mt-3 break-all text-2xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 sm:text-4xl">
                  {fileName}
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                  Use esta pagina para pre-visualizar o arquivo e baixar a
                  versao original.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3">
                <Link
                  href={downloadPath}
                  className="inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition"
                  style={{ backgroundColor: "#0f172a", borderWidth: "1px", borderStyle: "solid", borderColor: "#0f172a", color: "#ffffff" }}
                >
                  Baixar arquivo
                </Link>
                <a
                  href={signedPreviewUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-900 transition hover:border-slate-900"
                >
                  Abrir original
                </a>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-6">
              {previewKind === "image" ? (
                <img
                  src={signedPreviewUrl ?? ""}
                  alt={fileName}
                  className="mx-auto max-h-[70vh] w-auto rounded-2xl object-contain shadow-[0_20px_45px_rgba(15,23,42,0.12)]"
                />
              ) : null}

              {previewKind === "audio" ? (
                <div className="mx-auto flex min-h-[240px] max-w-2xl flex-col items-center justify-center rounded-[24px] bg-slate-950 px-6 py-10 text-center text-white">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Previa de audio
                  </div>
                  <div className="mt-3 break-all text-2xl font-semibold tracking-[-0.03em]">
                    {fileName}
                  </div>
                  <audio className="mt-6 w-full" controls src={signedPreviewUrl ?? ""}>
                    Seu navegador nao suporta reproducao de audio.
                  </audio>
                </div>
              ) : null}

              {previewKind === "pdf" ? (
                <iframe
                  title={fileName}
                  src={signedPreviewUrl ?? ""}
                  className="h-[75vh] w-full rounded-2xl border border-slate-200 bg-white"
                />
              ) : null}

              {previewKind === "generic" ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Arquivo protegido
                  </div>
                  <div className="mt-3 break-all text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    {fileName}
                  </div>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                    Este formato nao possui preview embutido nesta pagina. Use
                    o botao de download para baixar o arquivo original.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
