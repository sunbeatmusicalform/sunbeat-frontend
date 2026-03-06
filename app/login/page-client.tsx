"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPageClient() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = useMemo(() => {
    return searchParams.get("next") || "/app";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setSending(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: undefined,
      },
    });

    setSending(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setMsg("Código enviado para seu e-mail.");
    setStep("code");
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setVerifying(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    setVerifying(false);

    if (error) {
      setErr(error.message);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  async function handleResendCode() {
    setErr(null);
    setMsg(null);
    setSending(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: undefined,
      },
    });

    setSending(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setMsg("Código reenviado com sucesso.");
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-2">
          <div className="hidden rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur lg:block">
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">
              Sunbeat
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">
              Premium music infrastructure
            </h1>
            <p className="mt-4 max-w-md text-white/70">
              Acesse seu ambiente da Sunbeat com login por código de 6 dígitos
              enviado ao seu e-mail.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">
              Login
            </p>

            <h2 className="mt-4 text-3xl font-semibold">
              Entrar na Sunbeat
            </h2>

            <p className="mt-3 text-sm text-white/60">
              Use seu e-mail para receber um código de acesso.
            </p>

            {step === "email" ? (
              <form onSubmit={handleSendCode} className="mt-8 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@empresa.com"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black disabled:opacity-60"
                >
                  {sending ? "Enviando..." : "Enviar código"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="mt-8 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white/60 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Código de 6 dígitos
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="123456"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black disabled:opacity-60"
                >
                  {verifying ? "Validando..." : "Entrar"}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setErr(null);
                      setMsg(null);
                    }}
                    className="text-white/70 hover:text-white"
                  >
                    Alterar e-mail
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
    </div>
  );
}