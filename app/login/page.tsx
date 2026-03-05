"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const sp = useSearchParams();

  const next = sp.get("next") || "/app";

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      next
    )}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);

    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/30 p-6">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="mt-2 text-white/70 text-sm">
          Receba um magic link no seu e-mail para acessar o Sunbeat.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block text-sm text-white/70">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
          />

          <button
            type="submit"
            disabled={loading || sent}
            className="w-full rounded-xl bg-white text-black px-4 py-3 font-medium disabled:opacity-60"
          >
            {sent ? "Link enviado ✅" : loading ? "Enviando..." : "Enviar link"}
          </button>

          <p className="text-xs text-white/50">
            Depois do login, você será direcionado para: <span className="font-mono">{next}</span>
          </p>

          {err && (
            <p className="text-sm text-red-300">
              {err}
            </p>
          )}
          {sent && !err && (
            <p className="text-sm text-green-200">
              Confira sua caixa de entrada (e spam). Se o link expirar, é só pedir outro.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
