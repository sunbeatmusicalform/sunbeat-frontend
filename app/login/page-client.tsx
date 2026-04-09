"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import {
  buildWorkspaceUrl,
  getTenantFromHost,
  isSunbeatRootHost,
  sanitizeWorkspaceSlug,
} from "@/lib/tenant";

const OTP_LENGTH = 8;

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/")) {
    return "/app";
  }

  return next;
}

export default function LoginPageClient() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = safeNextPath(searchParams.get("next"));
  const workspaceHint = useMemo(
    () =>
      sanitizeWorkspaceSlug(
        searchParams.get("workspace") ?? searchParams.get("workspace_slug")
      ),
    [searchParams]
  );
  const authErrorMessage = useMemo(() => {
    const error = searchParams.get("error");

    switch (error) {
      case "otp_failed":
        return "O link de acesso expirou ou nao pode ser validado. Solicite um novo codigo.";
      case "workspace_required":
        return "Entramos na sua conta, mas nao foi possivel identificar o workspace. Use a URL do seu workspace para continuar.";
      case "session_transfer_failed":
        return "Nao foi possivel transferir a sessao para o workspace. Tente novamente pelo link do seu workspace.";
      default:
        return null;
    }
  }, [searchParams]);

  function getCurrentHostWorkspaceSlug() {
    if (typeof window === "undefined") {
      return null;
    }

    const tenant = getTenantFromHost(window.location.host);
    return tenant?.type === "subdomain" ? tenant.value : null;
  }

  function getWorkspaceSlugForAuth(userWorkspaceSlug?: unknown) {
    return (
      getCurrentHostWorkspaceSlug() ??
      workspaceHint ??
      sanitizeWorkspaceSlug(userWorkspaceSlug)
    );
  }

  function buildOtpRedirectUrl() {
    const redirectUrl = new URL("/auth/callback", window.location.origin);
    redirectUrl.searchParams.set("next", redirectTo);

    const workspaceSlug = getWorkspaceSlugForAuth();
    if (workspaceSlug) {
      redirectUrl.searchParams.set("workspace", workspaceSlug);
    }

    return redirectUrl.toString();
  }

  async function completeAuthRedirect() {
    const currentHost =
      typeof window !== "undefined" ? window.location.host : "";
    const shouldTransferSessionToWorkspace =
      isSunbeatRootHost(currentHost) && redirectTo.startsWith("/app");

    if (!shouldTransferSessionToWorkspace) {
      router.push(redirectTo);
      router.refresh();
      return null;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const workspaceSlug = getWorkspaceSlugForAuth(
      user?.user_metadata?.workspace_slug
    );

    if (!workspaceSlug) {
      await supabase.auth.signOut();
      return "Entramos na sua conta, mas nao foi possivel identificar o workspace. Use a URL do seu workspace para continuar.";
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session?.access_token || !session.refresh_token) {
      await supabase.auth.signOut();
      return "Nao foi possivel preparar a sessao do workspace. Tente novamente.";
    }

    const restoreUrl = new URL(
      buildWorkspaceUrl(workspaceSlug, "/auth/session-restore")
    );
    restoreUrl.hash = [
      `at=${encodeURIComponent(session.access_token)}`,
      `rt=${encodeURIComponent(session.refresh_token)}`,
      `next=${encodeURIComponent(redirectTo)}`,
    ].join("&");

    window.location.href = restoreUrl.toString();
    return null;
  }

  // Login mode: "otp" (default, used by existing clients) or "password" (self-serve)
  const [loginMode, setLoginMode] = useState<"otp" | "password">("otp");

  // Password login state
  const [pwEmail, setPwEmail] = useState("");
  const [pwPassword, setPwPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErr, setPwErr] = useState<string | null>(null);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setPwLoading(true);
    setPwErr(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: pwEmail.trim().toLowerCase(),
      password: pwPassword,
    });
    setPwLoading(false);
    if (error) {
      setPwErr("E-mail ou senha incorretos.");
      return;
    }
    const redirectError = await completeAuthRedirect();
    if (redirectError) {
      setPwErr(redirectError);
    }
  }

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
      const firstEmpty = otpDigits.findIndex((digit) => !digit);
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
        emailRedirectTo: buildOtpRedirectUrl(),
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
    setMsg("Codigo enviado com sucesso. Confira a sua caixa de entrada.");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setErr(null);
    setMsg(null);

    const token = otp.trim();

    if (token.length < 6) {
      setVerifying(false);
      setErr("Digite o codigo completo antes de continuar.");
      return;
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    setVerifying(false);

    if (error) {
      setErr("Codigo invalido ou expirado. Solicite um novo codigo.");
      return;
    }

    const redirectError = await completeAuthRedirect();
    if (redirectError) {
      setErr(redirectError);
    }
  }

  async function handleResendCode() {
    setSending(true);
    setErr(null);
    setMsg(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: buildOtpRedirectUrl(),
      },
    });

    setSending(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setMsg("Novo codigo enviado.");
  }

  function updateDigit(index: number, value: string) {
    const cleanValue = value.replace(/\D/g, "");

    if (!cleanValue) {
      const next = [...otpDigits];
      next[index] = "";
      setOtpDigits(next);
      return;
    }

    const chars = cleanValue.slice(0, OTP_LENGTH).split("");
    const next = [...otpDigits];

    for (let i = 0; i < chars.length; i += 1) {
      const target = index + i;
      if (target < OTP_LENGTH) {
        next[target] = chars[i];
      }
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

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) {
      return;
    }

    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, index) => {
      next[index] = char;
    });

    setOtpDigits(next);

    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  return (
    <main className="min-h-screen bg-[#F4F1EA] text-[#111111]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[0.98fr_1.02fr] lg:items-center lg:px-8">
        <section className="max-w-2xl">
          <Link href="/" className="inline-flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.04)]">
              <img
                src="/sunbeat-logan-transparent-black.ico"
                alt="Sunbeat"
                className="h-7 w-7 object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.26em] text-[#111111]">
                Sunbeat
              </div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#7A746A]">
                Client access
              </div>
            </div>
          </Link>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A746A]">
            <span className="h-2 w-2 rounded-full bg-[#111111]" />
            Acesso por codigo via e-mail
          </div>

          <h1 className="mt-8 text-[3.2rem] font-semibold leading-[0.92] tracking-[-0.07em] text-[#111111] sm:text-[4.2rem]">
            Entre no workspace
            <span className="block text-[#6E685E]">sem atrito.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-[#5F5A53]">
            O acesso interno da Sunbeat usa codigo de uso unico enviado por
            e-mail. Simples para entrar, seguro para operar e ideal para os
            clientes que controlam intake, drafts e revisoes.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <InfoCard
              title="Sem senha fixa"
              text="O codigo chega por e-mail e evita atrito para a equipe."
            />
            <InfoCard
              title="Entrada segura"
              text="Acesso pensado para operacao, revisao e configuracao do intake."
            />
          </div>
        </section>

        <section className="rounded-[32px] border border-black/8 bg-white p-7 shadow-[0_22px_54px_rgba(0,0,0,0.05)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-[#F8F5EF]">
                <img
                  src="/sunbeat-logan-transparent-black.ico"
                  alt="Sunbeat"
                  className="h-7 w-7 object-contain"
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#111111]">Sunbeat</div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
                  Login do workspace
                </h2>
              </div>
            </div>
          </div>

          {authErrorMessage && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {authErrorMessage}
            </div>
          )}

          {/* Mode switcher */}
          <div className="mt-6 flex rounded-2xl border border-black/8 bg-[#F8F5EF] p-1">
            <button
              type="button"
              onClick={() => setLoginMode("otp")}
              className="flex-1 rounded-xl py-2 text-xs font-semibold tracking-[0.1em] uppercase transition"
              style={loginMode === "otp" ? { backgroundColor: '#111111', color: '#ffffff' } : { color: '#8D867B' }}
            >
              Código por e-mail
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("password")}
              className="flex-1 rounded-xl py-2 text-xs font-semibold tracking-[0.1em] uppercase transition"
              style={loginMode === "password" ? { backgroundColor: '#111111', color: '#ffffff' } : { color: '#8D867B' }}
            >
              E-mail e senha
            </button>
          </div>

          {/* Password login form */}
          {loginMode === "password" && (
            <form onSubmit={handlePasswordLogin} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D867B]">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={pwEmail}
                  onChange={(e) => { setPwEmail(e.target.value); setPwErr(null); }}
                  placeholder="voce@empresa.com"
                  className="mt-3 h-12 w-full rounded-2xl border border-black/10 bg-[#F8F5EF] px-4 text-sm text-[#111111] outline-none placeholder:text-[#9A9388] focus:border-black/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D867B]">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={pwPassword}
                  onChange={(e) => { setPwPassword(e.target.value); setPwErr(null); }}
                  placeholder="Sua senha"
                  className="mt-3 h-12 w-full rounded-2xl border border-black/10 bg-[#F8F5EF] px-4 text-sm text-[#111111] outline-none placeholder:text-[#9A9388] focus:border-black/20"
                />
              </div>
              {pwErr && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {pwErr}
                </div>
              )}
              <button
                type="submit"
                disabled={pwLoading}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: '#111111', color: '#ffffff' }}
              >
                {pwLoading ? "Entrando..." : "Entrar"}
              </button>
              <p className="text-center text-sm text-[#6F695F]">
                Não tem conta?{" "}
                <Link href="/signup" className="font-semibold text-[#111111] underline underline-offset-2">
                  Criar workspace
                </Link>
              </p>
            </form>
          )}

          {loginMode === "otp" && step === "email" ? (
            <form onSubmit={handleSendCode} className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D867B]">
                E-mail de trabalho
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                className="mt-3 h-12 w-full rounded-2xl border border-black/10 bg-[#F8F5EF] px-4 text-sm text-[#111111] outline-none placeholder:text-[#9A9388] focus:border-black/20"
              />

              <button
                type="submit"
                disabled={sending}
                className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: '#111111', color: '#ffffff' }}
              >
                {sending ? "Enviando codigo..." : "Enviar codigo de acesso"}
              </button>

              <p className="mt-4 text-sm leading-7 text-[#6F695F]">
                Voce vai receber um codigo de acesso unico por e-mail.
              </p>
            </form>
          ) : loginMode === "otp" ? (
            <form onSubmit={handleVerifyCode} className="mt-8">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D867B]">
                    Codigo enviado para
                  </div>
                  <div className="mt-2 text-sm font-medium text-[#111111]">{email}</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtpDigits(Array(OTP_LENGTH).fill(""));
                    setErr(null);
                    setMsg(null);
                  }}
                  className="rounded-2xl border border-black/10 bg-[#F8F5EF] px-4 py-2 text-sm font-medium text-[#111111]"
                >
                  Alterar
                </button>
              </div>

              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D867B]">
                Digite o codigo
              </label>

              <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-8">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] = element;
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => updateDigit(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="h-14 rounded-2xl border border-black/10 bg-[#F8F5EF] text-center text-xl font-semibold tracking-[0.08em] text-[#111111] outline-none focus:border-black/20"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: '#111111', color: '#ffffff' }}
              >
                {verifying ? "Entrando..." : "Entrar no workspace"}
              </button>

              <div className="mt-4 flex flex-col gap-3 text-sm text-[#6F695F] sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={sending}
                  className="text-left font-medium text-[#111111] disabled:opacity-50"
                >
                  {sending ? "Reenviando..." : "Reenviar codigo"}
                </button>
                <span>Suporta codigos de 6 a 8 digitos.</span>
              </div>
            </form>
          ) : null}

          {loginMode === "otp" && err ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          ) : null}

          {loginMode === "otp" && msg ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {msg}
            </div>
          ) : null}

          <div className="mt-8 border-t border-black/8 pt-5 text-xs text-[#8D867B]">
            Acesso seguro com Supabase Auth · Sunbeat
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-black/8 bg-white p-5 shadow-[0_14px_34px_rgba(0,0,0,0.04)]">
      <div className="h-2 w-14 rounded-full bg-[#111111]" />
      <h3 className="mt-4 text-sm font-semibold text-[#111111]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#605A52]">{text}</p>
    </div>
  );
}
