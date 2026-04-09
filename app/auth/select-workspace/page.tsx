import { Suspense } from "react";

import SelectWorkspacePageClient from "./page-client";

function SelectWorkspacePageFallback() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F4F1EA] px-4 py-12">
      <div className="w-full max-w-xl rounded-[32px] border border-black/8 bg-white p-8 shadow-[0_22px_60px_rgba(0,0,0,0.05)] sm:p-10">
        <div className="text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#111111]">
            Sunbeat
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#111111]">
            Escolha seu workspace
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#5E5A54]">
            Carregando opcoes de acesso...
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 py-8 text-sm text-[#6A6660]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#111111] border-t-transparent" />
          Carregando workspaces...
        </div>
      </div>
    </main>
  );
}

export default function SelectWorkspacePage() {
  return (
    <Suspense fallback={<SelectWorkspacePageFallback />}>
      <SelectWorkspacePageClient />
    </Suspense>
  );
}
