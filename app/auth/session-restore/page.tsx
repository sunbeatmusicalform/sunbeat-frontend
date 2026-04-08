"use client";

/**
 * /auth/session-restore
 *
 * Receives Supabase tokens in the URL hash (never in query params, to keep
 * them out of server logs) and uses them to set a session on the current
 * domain (typically a workspace subdomain like slug.sunbeat.pro).
 *
 * Hash format: #at=<access_token>&rt=<refresh_token>&next=<path>
 *
 * Used by the signup flow: after account creation on sunbeat.pro, the user
 * is sent here on their new subdomain so the session cookie is set correctly
 * before redirecting to /app/settings/plan.
 */

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function SessionRestorePage() {
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1); // strip leading '#'
    const params = new URLSearchParams(hash);

    const at = params.get("at");
    const rt = params.get("rt");
    const next = params.get("next") ?? "/app";

    if (!at || !rt) {
      setErrorMsg("Token de sessão ausente. Por favor, faça login novamente.");
      setStatus("error");
      return;
    }

    const supabase = createSupabaseBrowser();

    supabase.auth
      .setSession({ access_token: at, refresh_token: rt })
      .then((result: { data: unknown; error: { message: string } | null }) => {
        if (result.error) {
          setErrorMsg("Não foi possível restaurar a sessão. Por favor, faça login.");
          setStatus("error");
          return;
        }
        // Small delay so cookies are committed before navigation
        setTimeout(() => {
          window.location.replace(next);
        }, 150);
      });
  }, []);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F1EA] px-4">
        <div className="w-full max-w-sm rounded-[28px] border border-black/8 bg-white p-8 text-center shadow-[0_18px_48px_rgba(0,0,0,0.06)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium text-[#111111]">
            {errorMsg ?? "Algo deu errado."}
          </p>
          <a
            href="/login"
            className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-2xl text-sm font-semibold"
            style={{ backgroundColor: "#111111", color: "#ffffff" }}
          >
            Fazer login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F1EA]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "#111111", borderTopColor: "transparent" }}
        />
        <p className="text-sm text-[#5E5A54]">Acessando workspace…</p>
      </div>
    </div>
  );
}
