"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const next = searchParams.get("next") || "/app";

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setErr(null);
    setMsg(null);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        setErr(error.message);
        return;
      }

      setEmail(cleanEmail);
      setStep("otp");
      setMsg("Código enviado. Confira sua caixa de entrada e spam.");
    } catch (error) {
      setErr("Não foi possível enviar o código agora.");
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setErr(null);
    setMsg(null);

    try {
      const cleanToken = token.replace(/\D/g, "");

      if (cleanToken.length !== 6) {
        setErr("Digite o código de 6 dígitos.");
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: cleanToken,
        type: "email",
      });

      if (error) {
        setErr(error.message);
        return;
      }

      router.replace(next);
      router.refresh();
    } catch (error) {
      setErr("Não foi possível validar o código.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendCode() {
    setSending(true);
    setErr(null);
    setMsg(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        setErr(error.message);
        return;
      }

      setMsg("Novo código enviado.");
    } catch (error) {
      setErr("Não foi possível reenviar o código.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <h1 className="text-2xl font-semibold">Entrar na Sunbeat</h1>
          <p className="mt-2 text-sm text-white/60">
            Acesse com código de 6 dígitos enviado para seu email.
          </p>

          {step === "email" ? (
            <form onSubmit={handleSendCode} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/80">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/30"
                />
              </div>

              <button
                type="submit"
                disabled={sending || !email.trim()}
                className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black disabled:opacity-60"
              >
                {sending ? "Enviando..." : "Enviar código"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="mt-6 space-y-4">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
                Código enviado para <span className="font-medium text-white">{email}</span>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/80">Código</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center text-2xl tracking-[0.35em] text-white outline-none placeholder:text-white/20"
                />
              </div>

              <button
                type="submit"
                disabled={verifying || token.length !== 6}
                className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black disabled:opacity-60"
              >
                {verifying ? "Validando..." : "Entrar"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setToken("");
                    setMsg(null);
                    setErr(null);
                  }}
                  className="text-white/70 hover:text-white"
                >
                  Trocar email
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={sending}
                  className="text-white/70 hover:text-white disabled:opacity-50"
                >
                  {sending ? "Reenviando..." : "Reenviar código"}
                </button>
              </div>
            </form>
          )}

          {err && <p className="mt-4 text-sm text-red-300">{err}</p>}
          {msg && <p className="mt-4 text-sm text-green-300">{msg}</p>}

          <p className="mt-6 text-xs text-white/40">
            Depois do login, você será direcionado para:{" "}
            <span className="font-mono text-white/60">{next}</span>
          </p>
        </div>
      </div>
    </div>
  );
}