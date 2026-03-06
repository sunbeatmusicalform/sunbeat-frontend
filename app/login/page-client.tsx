"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

const OTP_LENGTH = 8;

export default function LoginPageClient() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("next") || "/app";

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otp = otpDigits.join("");

  useEffect(() => {
    if (step === "otp") {
      const firstEmpty = otpDigits.findIndex((d) => !d);
      const targetIndex = firstEmpty === -1 ? OTP_LENGTH - 1 : firstEmpty;
      inputRefs.current[targetIndex]?.focus();
    }
  }, [step, otpDigits]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setErr(null);
    setMsg(null);

    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          redirectTo
        )}`,
      },
    });

    setSending(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setEmail(normalizedEmail);
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setStep("otp");
    setMsg("Código enviado para seu e-mail.");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setErr(null);
    setMsg(null);

    const token = otp.trim();

    if (token.length < 6) {
      setVerifying(false);
      setErr("Digite o código completo.");
      return;
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    setVerifying(false);

    if (error) {
      setErr("Código inválido ou expirado. Solicite um novo código.");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleResendCode() {
    setSending(true);
    setErr(null);
    setMsg(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          redirectTo
        )}`,
      },
    });

    setSending(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setMsg("Novo código enviado.");
  }

  function updateDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const next = [...otpDigits];
      next[index] = "";
      setOtpDigits(next);
      return;
    }

    const chars = clean.slice(0, OTP_LENGTH).split("");
    const next = [...otpDigits];

    for (let i = 0; i < chars.length; i++) {
      const target = index + i;
      if (target < OTP_LENGTH) next[target] = chars[i];
    }

    setOtpDigits(next);

    const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (otpDigits[index]) {
        const next = [...otpDigits];
        next[index] = "";
        setOtpDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...otpDigits];
        next[index - 1] = "";
        setOtpDigits(next);
      }
      return;
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      return;
    }

    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });

    setOtpDigits(next);

    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,196,0,0.14),transparent_22%),radial-gradient(circle_at_20%_20%,rgba(255,160,0,0.10),transparent_18%),radial-gradient(circle_at_80%_15%,rgba(79,70,229,0.16),transparent_22%),linear-gradient(180deg,#050816_0%,#071226_55%,#040814_100%)]" />
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="absolute right-16 top-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute left-10 bottom-10 h-52 w-52 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_85%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="hidden lg:block">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
              <SunbeatLogo />
              <span className="text-sm font-medium text-white/90">Sunbeat</span>
            </div>

            <h1 className="max-w-xl text-5xl font-semibold leading-[1.02] tracking-tight">
              Premium music infrastructure for teams that ship.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-white/70">
              Acesse sua área com autenticação por código. Experiência simples,
              rápida e com padrão visual de produto global.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-2 gap-4">
              <FeatureCard
                title="Fast access"
                text="Login por código enviado ao e-mail em segundos."
              />
              <FeatureCard
                title="Secure session"
                text="Fluxo pronto para SSR com Supabase."
              />
              <FeatureCard
                title="Premium UX"
                text="Interface limpa, responsiva e orientada a conversão."
              />
              <FeatureCard
                title="Ops-ready"
                text="Pensado para labels, managers e operações musicais."
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-yellow-300/20 via-white/5 to-transparent blur-2xl" />

            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                  <SunbeatLogo />
                </div>

                <div>
                  <p className="text-sm font-medium text-white/60">Sunbeat</p>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Entrar na plataforma
                  </h2>
                </div>
              </div>

              {step === "email" ? (
                <form onSubmit={handleSendCode} className="animate-[fadeIn_.35s_ease]">
                  <label className="mb-2 block text-sm text-white/70">E-mail</label>

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@empresa.com"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#0a1020] px-4 text-white placeholder:text-white/35 outline-none transition focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/20"
                  />

                  <button
                    type="submit"
                    disabled={sending}
                    className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#facc15] px-4 text-sm font-semibold text-[#111827] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? "Enviando..." : "Enviar código"}
                  </button>

                  <p className="mt-4 text-sm leading-6 text-white/45">
                    Você receberá um código de acesso para entrar na Sunbeat.
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="animate-[fadeIn_.35s_ease]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-white/55">Código enviado para</p>
                      <p className="text-sm font-medium text-white/90">{email}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setOtpDigits(Array(OTP_LENGTH).fill(""));
                        setErr(null);
                        setMsg(null);
                      }}
                      className="text-sm text-white/60 transition hover:text-white"
                    >
                      Alterar
                    </button>
                  </div>

                  <label className="mb-3 block text-sm text-white/70">
                    Digite o código
                  </label>

                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => updateDigit(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="h-14 rounded-2xl border border-white/10 bg-[#0a1020] text-center text-xl font-semibold tracking-[0.08em] text-white outline-none transition focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/20"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={verifying}
                    className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-white text-sm font-semibold text-[#0b1220] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {verifying ? "Entrando..." : "Entrar"}
                  </button>

                  <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={sending}
                      className="text-white/65 transition hover:text-white disabled:opacity-50"
                    >
                      {sending ? "Reenviando..." : "Reenviar código"}
                    </button>

                    <span className="text-white/35">Aceita 6 a 8 dígitos</span>
                  </div>
                </form>
              )}

              {err && (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {err}
                </div>
              )}

              {msg && (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {msg}
                </div>
              )}

              <div className="mt-8 border-t border-white/10 pt-5 text-xs text-white/35">
                Secure access powered by Supabase Auth · Sunbeat
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
      <div className="mb-2 h-2 w-16 rounded-full bg-gradient-to-r from-yellow-300 to-amber-500" />
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-white/55">{text}</p>
    </div>
  );
}

function SunbeatLogo() {
  return (
    <div className="relative flex h-6 w-6 items-center justify-center">
      <div className="absolute h-6 w-6 rounded-full bg-yellow-300/90 blur-[1px]" />
      <div className="absolute h-3 w-3 rounded-full bg-[#0b1220]" />
      <div className="absolute h-8 w-8 rounded-full border border-yellow-300/35" />
    </div>
  );
}