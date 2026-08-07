"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { WorkspaceBaseDomain } from "@/lib/tenant";
import TurnstileWidget from "@/components/auth/TurnstileWidget";

type Step = "form" | "success";

function slugPreview(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

const SELF_SERVE_PLANS = ["starter", "pro"] as const;
type SelfServePlan = typeof SELF_SERVE_PLANS[number];

const PLAN_LABELS: Record<SelfServePlan, string> = {
  starter: "Starter",
  pro: "Pro",
};

const SIGNUP_COPY = {
  en: {
    accountLabel: "Create your account",
    title: "Start now",
    intro: "Create your workspace and start receiving releases in one organized flow.",
    closed: "New signups are temporarily closed while we complete self-service security configuration.",
    securityRequired: "Complete the security verification before continuing.",
    termsRequired: "Confirm the Terms of Use and Privacy Policy.",
    connectionError: "Connection error. Please try again.",
    genericError: "We could not create your account. Please try again.",
    selectedPlan: (plan: string) => `${plan} plan selected`,
    selectedPlanBody: "After creating your workspace, you will be directed to activate it.",
    name: "Your name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    workspaceName: "Company / label name",
    workspacePlaceholder: "Example: Sun7 Records",
    address: "Your address:",
    legalPrefix: "I have read and accept the",
    terms: "Terms of Use",
    and: "and",
    privacy: "Privacy Policy",
    creating: "Creating workspace...",
    create: "Create my account",
    signupsClosed: "Signups closed",
    existing: "Already have an account?",
    login: "Sign in",
    legalFooter: "By creating your account, you agree to the",
    verifyTitle: "Check your email",
    magicLinkPrefix: "We sent a magic link to",
    magicLinkSuffix: "After confirming, you can access the workspace",
    goToLogin: "Go to sign in",
    confirmationNote: "The workspace will only be available after email confirmation.",
  },
  "pt-BR": {
    accountLabel: "Criar sua conta",
    title: "Comece agora",
    intro: "Crie seu workspace e comece a receber lançamentos de forma organizada.",
    closed: "Novos cadastros estão fechados enquanto concluímos a configuração de segurança do self-service.",
    securityRequired: "Conclua a verificação de segurança antes de continuar.",
    termsRequired: "Confirme os Termos de Uso e a Política de Privacidade.",
    connectionError: "Erro de conexão. Tente novamente.",
    genericError: "Erro ao criar conta. Tente novamente.",
    selectedPlan: (plan: string) => `Plano ${plan} selecionado`,
    selectedPlanBody: "Após criar seu workspace você será direcionado para ativá-lo.",
    name: "Seu nome",
    email: "E-mail",
    emailPlaceholder: "seu@email.com",
    workspaceName: "Nome da empresa / label",
    workspacePlaceholder: "Ex: Sun7 Records",
    address: "Seu endereço:",
    legalPrefix: "Li e aceito os",
    terms: "Termos de Uso",
    and: "e a",
    privacy: "Política de Privacidade",
    creating: "Criando workspace...",
    create: "Criar minha conta",
    signupsClosed: "Cadastros fechados",
    existing: "Já tem conta?",
    login: "Entrar",
    legalFooter: "Ao criar sua conta você concorda com os",
    verifyTitle: "Verifique seu e-mail",
    magicLinkPrefix: "Enviamos um magic link para",
    magicLinkSuffix: "Depois de confirmar, você poderá acessar o workspace",
    goToLogin: "Ir para o login",
    confirmationNote: "O workspace só será acessível depois da confirmação do e-mail.",
  },
} as const;

function isSelfServePlan(val: string | null): val is SelfServePlan {
  return SELF_SERVE_PLANS.includes(val as SelfServePlan);
}

export default function SignupPageClient({
  workspaceDomain,
  signupEnabled,
  turnstileSiteKey,
}: {
  workspaceDomain: WorkspaceBaseDomain;
  signupEnabled: boolean;
  turnstileSiteKey: string | null;
}) {
  const searchParams = useSearchParams();
  const locale = workspaceDomain === "sunbeat.com.br" ? "pt-BR" : "en";
  const copy = SIGNUP_COPY[locale];
  const rawPlan = searchParams.get("plan");
  const planIntent: SelfServePlan | null = isSelfServePlan(rawPlan) ? rawPlan : null;

  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [workspaceSlug, setWorkspaceSlug] = useState<string>("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaVersion, setCaptchaVersion] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formStartedAt] = useState(() => Date.now());

  const [form, setForm] = useState({
    name: "",
    email: "",
    workspace_name: "",
    company_website: "",
  });

  const preview = slugPreview(form.workspace_name);
  const handleTurnstileToken = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  function resetCaptcha() {
    setTurnstileToken(null);
    setCaptchaVersion((version) => version + 1);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setFieldError(null);
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldError(null);

    if (!signupEnabled || (turnstileSiteKey && !turnstileToken)) {
      setError(
        signupEnabled
          ? copy.securityRequired
          : copy.closed
      );
      setLoading(false);
      return;
    }

    if (!termsAccepted) {
      setError(copy.termsRequired);
      setLoading(false);
      return;
    }

    try {
      // 1. Create user + workspace via API
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          plan_intent: planIntent,
          turnstile_token: turnstileToken,
          terms_accepted: termsAccepted,
          form_started_at: formStartedAt,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        if (data.field === "workspace_name" || data.field === "email") {
          setFieldError(data.error);
        } else {
          setError(data.error || copy.genericError);
        }
        resetCaptcha();
        setLoading(false);
        return;
      }

      setWorkspaceSlug(data.workspace_slug);
      setStep("success");
    } catch {
      setError(copy.connectionError);
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F1EA] px-4">
        <div className="w-full max-w-md rounded-[32px] border border-black/8 bg-white p-10 shadow-[0_24px_60px_rgba(0,0,0,0.06)] text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#111111]">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ffffff' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
            {copy.verifyTitle}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#5E5A54]">
            {copy.magicLinkPrefix} <strong>{form.email}</strong>.{" "}
            {copy.magicLinkSuffix}{" "}
            <strong>{workspaceSlug}.{workspaceDomain}</strong>.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex w-full items-center justify-center rounded-full py-3.5 text-sm font-semibold"
            style={{ backgroundColor: '#111111', color: '#ffffff' }}
          >
            {copy.goToLogin}
          </Link>
          <p className="mt-3 text-xs text-[#9A9590]">
            {copy.confirmationNote}
          </p>
          <p className="mt-2 text-xs text-[#9A9590]">
            URL:{" "}
            <code className="rounded bg-[#F4F1EA] px-1.5 py-0.5 text-[#393733]">
              {workspaceSlug}.{workspaceDomain}
            </code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F1EA] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
            <Image
              src="/sunbeat-logan-transparent-black.ico"
              alt="Sunbeat"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[#111111]">Sunbeat</div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#6A6660]">{copy.accountLabel}</div>
          </div>
        </div>

        <div className="rounded-[32px] border border-black/8 bg-white p-8 shadow-[0_22px_60px_rgba(0,0,0,0.05)] sm:p-10">
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm leading-7 text-[#5E5A54]">
            {copy.intro}
          </p>

          {!signupEnabled && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              {copy.closed}
            </div>
          )}

          {planIntent && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-black/8 bg-[#F9F7F2] px-4 py-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#111111]">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#ffffff" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#111111]">
                  {copy.selectedPlan(PLAN_LABELS[planIntent])}
                </p>
                <p className="text-[11px] leading-5 text-[#6A6660]">
                  {copy.selectedPlanBody}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Nome */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]">
                {copy.name}
              </label>
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Felipe Fonseca"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm text-[#111111] outline-none placeholder:text-[#9A9590] focus:border-black/30 focus:ring-2 focus:ring-black/5 transition"
              />
            </div>

            {/* E-mail */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]">
                {copy.email}
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={copy.emailPlaceholder}
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm text-[#111111] outline-none placeholder:text-[#9A9590] focus:border-black/30 focus:ring-2 focus:ring-black/5 transition"
              />
            </div>

            {/* Nome do workspace */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]">
                {copy.workspaceName}
              </label>
              <input
                name="workspace_name"
                type="text"
                required
                placeholder={copy.workspacePlaceholder}
                value={form.workspace_name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm text-[#111111] outline-none placeholder:text-[#9A9590] focus:border-black/30 focus:ring-2 focus:ring-black/5 transition"
              />
              {preview && (
                <p className="mt-1.5 text-xs text-[#9A9590]">
                  {copy.address}{" "}
                  <span className="font-medium text-[#5E5A54]">{preview}.{workspaceDomain}</span>
                </p>
              )}
              {fieldError && (
                <p className="mt-1.5 text-xs text-red-500">{fieldError}</p>
              )}
            </div>

            <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
              <label htmlFor="company_website">Website</label>
              <input
                id="company_website"
                name="company_website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.company_website}
                onChange={handleChange}
              />
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-black/8 bg-[#F9F7F2] px-4 py-3">
              <input
                id="signup-legal-acceptance"
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => {
                  setTermsAccepted(event.target.checked);
                  setError(null);
                }}
                className="mt-1 h-4 w-4 accent-[#111111]"
                required
              />
              <span className="text-xs leading-5 text-[#6A6660]">
                <label htmlFor="signup-legal-acceptance" className="cursor-pointer">
                  {copy.legalPrefix}{" "}
                </label>
                <Link href="/legal/terms" target="_blank" className="font-semibold text-[#111111] underline">
                  {copy.terms}
                </Link>{" "}
                {copy.and}{" "}
                <Link href="/legal/privacy" target="_blank" className="font-semibold text-[#111111] underline">
                  {copy.privacy}
                </Link>.
              </span>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {signupEnabled && turnstileSiteKey && (
              <TurnstileWidget
                key={captchaVersion}
                siteKey={turnstileSiteKey}
                onTokenChange={handleTurnstileToken}
              />
            )}

            <button
              type="submit"
              disabled={
                loading ||
                !signupEnabled ||
                !termsAccepted ||
                Boolean(turnstileSiteKey && !turnstileToken)
              }
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition disabled:opacity-60"
              style={{ backgroundColor: '#111111', color: '#ffffff' }}
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {copy.creating}
                </>
              ) : (
                signupEnabled ? copy.create : copy.signupsClosed
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6A6660]">
            {copy.existing}{" "}
            <Link href="/login" className="font-semibold text-[#111111] underline underline-offset-2">
              {copy.login}
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[#9A9590]">
          {copy.legalFooter}{" "}
          <Link href="/legal/terms" className="underline">{copy.terms}</Link>
          {" "}{copy.and}{" "}
          <Link href="/legal/privacy" className="underline">{copy.privacy}</Link>.
        </p>
      </div>
    </div>
  );
}
