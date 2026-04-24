"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

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

function isSelfServePlan(val: string | null): val is SelfServePlan {
  return SELF_SERVE_PLANS.includes(val as SelfServePlan);
}

export default function SignupPageClient() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const searchParams = useSearchParams();
  const rawPlan = searchParams.get("plan");
  const planIntent: SelfServePlan | null = isSelfServePlan(rawPlan) ? rawPlan : null;

  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [workspaceSlug, setWorkspaceSlug] = useState<string>("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    workspace_name: "",
  });

  const preview = slugPreview(form.workspace_name);

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

    try {
      // 1. Create user + workspace via API
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.ok) {
        if (data.field === "workspace_name" || data.field === "email") {
          setFieldError(data.error);
        } else {
          setError(data.error || "Erro ao criar conta. Tente novamente.");
        }
        setLoading(false);
        return;
      }

      // 2. Auto-login with email+password
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (loginError) {
        // Signup succeeded but auto-login failed — show success with manual link
        setWorkspaceSlug(data.workspace_slug);
        setStep("success");
        setLoading(false);
        return;
      }

      // 3. Get session tokens and redirect to subdomain via session-restore
      //    Tokens go in the URL hash (not query params) to keep them off server logs.
      const { data: sessionData } = await supabase.auth.getSession();
      const slug = data.workspace_slug;

      if (sessionData?.session) {
        const { access_token, refresh_token } = sessionData.session;
        const nextPath = planIntent
          ? `/app/settings/plan?plan_intent=${planIntent}`
          : "/app/settings/plan";
        const hash = [
          `at=${encodeURIComponent(access_token)}`,
          `rt=${encodeURIComponent(refresh_token)}`,
          `next=${encodeURIComponent(nextPath)}`,
        ].join("&");
        // Preserve the market domain the user signed up from (sunbeat.pro or sunbeat.com.br)
        const signupDomain = window.location.hostname.endsWith(".sunbeat.com.br")
          ? "sunbeat.com.br"
          : "sunbeat.pro";
        window.location.href = `https://${slug}.${signupDomain}/auth/session-restore#${hash}`;
        // setLoading stays true intentionally — page will navigate away
        return;
      }

      // Fallback: show success with manual link
      setWorkspaceSlug(slug);
      setStep("success");
    } catch {
      setError("Erro de conexão. Tente novamente.");
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
            Workspace criado!
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#5E5A54]">
            Seu workspace <strong>{workspaceSlug}.sunbeat.pro</strong> está pronto.
            Acesse o dashboard para configurar seus formulários.
          </p>
          <a
            href={`https://${workspaceSlug}.sunbeat.pro/login?next=/app/settings/plan${planIntent ? `?plan_intent=${planIntent}` : ""}`}
            className="mt-8 inline-flex w-full items-center justify-center rounded-full py-3.5 text-sm font-semibold"
            style={{ backgroundColor: '#111111', color: '#ffffff' }}
          >
            Acessar workspace →
          </a>
          <p className="mt-3 text-xs text-[#9A9590]">
            Você será redirecionado para a página de planos após o login.
          </p>
          <p className="mt-2 text-xs text-[#9A9590]">
            URL:{" "}
            <code className="rounded bg-[#F4F1EA] px-1.5 py-0.5 text-[#393733]">
              {workspaceSlug}.sunbeat.pro
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
            <img src="/sunbeat-logan-transparent-black.ico" alt="Sunbeat" className="h-7 w-7 object-contain" />
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[#111111]">Sunbeat</div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#6A6660]">Criar sua conta</div>
          </div>
        </div>

        <div className="rounded-[32px] border border-black/8 bg-white p-8 shadow-[0_22px_60px_rgba(0,0,0,0.05)] sm:p-10">
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
            Comece agora
          </h1>
          <p className="mt-2 text-sm leading-7 text-[#5E5A54]">
            Crie seu workspace e comece a receber lançamentos de forma organizada.
          </p>

          {planIntent && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-black/8 bg-[#F9F7F2] px-4 py-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#111111]">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#ffffff" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#111111]">
                  Plano {PLAN_LABELS[planIntent]} selecionado
                </p>
                <p className="text-[11px] leading-5 text-[#6A6660]">
                  Após criar seu workspace você será direcionado para ativá-lo.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Nome */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]">
                Seu nome
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
                E-mail
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm text-[#111111] outline-none placeholder:text-[#9A9590] focus:border-black/30 focus:ring-2 focus:ring-black/5 transition"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]">
                Senha
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm text-[#111111] outline-none placeholder:text-[#9A9590] focus:border-black/30 focus:ring-2 focus:ring-black/5 transition"
              />
            </div>

            {/* Nome do workspace */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]">
                Nome da empresa / label
              </label>
              <input
                name="workspace_name"
                type="text"
                required
                placeholder="Ex: Sun7 Records"
                value={form.workspace_name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm text-[#111111] outline-none placeholder:text-[#9A9590] focus:border-black/30 focus:ring-2 focus:ring-black/5 transition"
              />
              {preview && (
                <p className="mt-1.5 text-xs text-[#9A9590]">
                  Seu endereço:{" "}
                  <span className="font-medium text-[#5E5A54]">{preview}.sunbeat.pro</span>
                </p>
              )}
              {fieldError && (
                <p className="mt-1.5 text-xs text-red-500">{fieldError}</p>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition disabled:opacity-60"
              style={{ backgroundColor: '#111111', color: '#ffffff' }}
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Criando workspace...
                </>
              ) : (
                "Criar minha conta"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6A6660]">
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-[#111111] underline underline-offset-2">
              Entrar
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[#9A9590]">
          Ao criar sua conta você concorda com os{" "}
          <Link href="/legal/terms" className="underline">Termos de Uso</Link>
          {" "}e a{" "}
          <Link href="/legal/privacy" className="underline">Política de Privacidade</Link>.
        </p>
      </div>
    </div>
  );
}
