"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { buildWorkspaceUrl } from "@/lib/tenant";

type WorkspaceOption = {
  slug: string;
  name: string;
};

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/")) {
    return "/app";
  }

  return next;
}

export default function SelectWorkspacePage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirectingSlug, setIsRedirectingSlug] = useState<string | null>(
    null
  );

  useEffect(() => {
    let mounted = true;

    async function redirectToWorkspace(workspaceSlug: string) {
      try {
        setIsRedirectingSlug(workspaceSlug);

        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;

        if (!session?.access_token || !session.refresh_token) {
          throw new Error(
            "Sua sessao no host raiz expirou. Faca login novamente."
          );
        }

        const redirect = new URL(
          buildWorkspaceUrl(workspaceSlug, "/auth/session-restore")
        );
        redirect.hash = [
          `at=${encodeURIComponent(session.access_token)}`,
          `rt=${encodeURIComponent(session.refresh_token)}`,
          `next=${encodeURIComponent(nextPath)}`,
        ].join("&");

        window.location.href = redirect.toString();
      } catch (redirectError) {
        if (!mounted) {
          return;
        }

        setError(
          redirectError instanceof Error
            ? redirectError.message
            : "Nao foi possivel transferir a sessao para o workspace."
        );
        setIsRedirectingSlug(null);
      }
    }

    async function loadWorkspaces() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/auth/workspaces", {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          ok: boolean;
          workspaces?: WorkspaceOption[];
          error?: string;
        };

        if (!mounted) {
          return;
        }

        if (!response.ok || !data.ok) {
          throw new Error(
            data.error ||
              "Nao foi possivel identificar os workspaces da sua conta."
          );
        }

        const nextWorkspaces = Array.isArray(data.workspaces)
          ? data.workspaces
          : [];

        if (nextWorkspaces.length === 1) {
          await redirectToWorkspace(nextWorkspaces[0].slug);
          return;
        }

        setWorkspaces(nextWorkspaces);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Nao foi possivel carregar seus workspaces."
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadWorkspaces();

    return () => {
      mounted = false;
    };
  }, [nextPath, supabase]);

  async function handleSelectWorkspace(workspaceSlug: string) {
    try {
      setError(null);
      setIsRedirectingSlug(workspaceSlug);

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session?.access_token || !session.refresh_token) {
        throw new Error("Sua sessao expirou. Faca login novamente.");
      }

      const redirect = new URL(
        buildWorkspaceUrl(workspaceSlug, "/auth/session-restore")
      );
      redirect.hash = [
        `at=${encodeURIComponent(session.access_token)}`,
        `rt=${encodeURIComponent(session.refresh_token)}`,
        `next=${encodeURIComponent(nextPath)}`,
      ].join("&");

      window.location.href = redirect.toString();
    } catch (selectError) {
      setError(
        selectError instanceof Error
          ? selectError.message
          : "Nao foi possivel acessar o workspace selecionado."
      );
      setIsRedirectingSlug(null);
    }
  }

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
            Sua conta tem acesso a mais de um workspace. Escolha para onde
            continuar.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 flex flex-col items-center gap-3 py-8 text-sm text-[#6A6660]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#111111] border-t-transparent" />
            Carregando workspaces...
          </div>
        ) : workspaces.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            Nenhum workspace foi encontrado para esta conta.
          </div>
        ) : (
          <div className="mt-8 grid gap-3">
            {workspaces.map((workspace) => (
              <button
                key={workspace.slug}
                type="button"
                onClick={() => handleSelectWorkspace(workspace.slug)}
                disabled={Boolean(isRedirectingSlug)}
                className="flex items-center justify-between rounded-[24px] border border-black/8 bg-[#F8F5EF] px-5 py-4 text-left transition hover:border-black/12 hover:bg-[#F0EDE6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div>
                  <div className="text-sm font-semibold text-[#111111]">
                    {workspace.name}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[#7A746A]">
                    {workspace.slug}.sunbeat.pro
                  </div>
                </div>
                <span className="text-sm font-semibold text-[#111111]">
                  {isRedirectingSlug === workspace.slug ? "Abrindo..." : "Entrar"}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-[#6A6660]">
          <button
            type="button"
            onClick={() => router.push(`/login?next=${encodeURIComponent(nextPath)}`)}
            className="font-semibold text-[#111111] underline underline-offset-2"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    </main>
  );
}
