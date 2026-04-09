/**
 * MarketingHome
 *
 * Market-aware home page component.
 * Receives `market` prop from a Server Component that reads the host header.
 *
 * sunbeat.com.br → market "brazil" → Portuguese / commercial / BRL
 * sunbeat.pro    → market "global" → English  / institutional / USD
 *
 * Copy source of truth: sunbeat_direcao_reposicionamento_site.pdf
 * Billing source of truth: lib/billing/catalog.ts
 *
 * Guardrails:
 * - Do NOT reduce Sunbeat to a form tool.
 * - Do NOT promise formal integrations with Spotify, DSPs, Zapier, Make or Airtable.
 * - Do NOT link or reference sunbeat.ai in this phase.
 * - Do NOT treat AI as a finished product or specialist replacement.
 * - Do NOT mirror .com.br and .pro literally; emphasis must differ.
 */

import Link from "next/link";
import {
  billingCatalog,
  formatPrice,
  type Market,
} from "@/lib/billing/catalog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Copy {
  // Nav
  navPlans: string;
  navLogin: string;
  navCta: string;
  // Hero
  heroTag: string;
  heroTitle: string;
  heroTitleAlt: string; // second line (muted)
  heroSub: string;
  heroPrimary: string;
  heroSecondary: string;
  // Problem block
  problemTag: string;
  problemTitle: string;
  problemSub: string;
  // How it works
  howTag: string;
  howTitle: string;
  howSub: string;
  howStep1: string; howStep1Sub: string;
  howStep2: string; howStep2Sub: string;
  howStep3: string; howStep3Sub: string;
  howStep4: string; howStep4Sub: string;
  // AI / Copilotos
  aiTag: string;
  aiTitle: string;
  aiSub: string;
  aiBullets: string[];
  // Integrations
  intTag: string;
  intTitle: string;
  intSub: string;
  intNote: string;
  // Pricing
  pricingTag: string;
  pricingTitle: string;
  pricingSub: string;
  pricingMarketNote: string;
  pricingEnterprise: string;
  pricingEnterpriseFrom: string;
  pricingEnterpriseSub: string;
  pricingEnterpriseCta: string;
  pricingSeeFull: string;
  perMonth: string;
  free: string;
  buyOnline: string;
  planCtas: { free: string; paid: string };
  // Final CTA
  ctaTitle: string;
  ctaSub: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

// ─── Copy by domain ───────────────────────────────────────────────────────────

const COPY: Record<Market, Copy> = {
  brazil: {
    // Nav
    navPlans: "Planos",
    navLogin: "Entrar",
    navCta: "Criar conta",
    // Hero — camada comercial brasileira, PT lidera
    heroTag: "Gestão inteligente para mercados criativos",
    heroTitle: "Gestão inteligente",
    heroTitleAlt: "para mercados criativos.",
    heroSub:
      "Transforme formulários, briefing e entrada de demandas em workflow, contexto operacional e execução organizada para equipes criativas.",
    heroPrimary: "Começar grátis",
    heroSecondary: "Falar com vendas",
    // Problem
    problemTag: "O problema",
    problemTitle: "Seu formulário recebe pedidos. Sua operação ainda perde contexto, prazo e padrão.",
    problemSub:
      "A entrada de demandas existe. O que falta é o que vem depois: estrutura, visibilidade, fluxo e execução coordenada.",
    // How it works
    howTag: "Como funciona",
    howTitle: "Da entrada à execução organizada.",
    howSub: "A Sunbeat organiza a entrada, distribui o fluxo e conecta a operação com contexto e automação.",
    howStep1: "Receba",
    howStep1Sub: "Intake estruturado com schema configurável por operação.",
    howStep2: "Padronize",
    howStep2Sub: "Dados, assets e briefings em um padrão único e rastreável.",
    howStep3: "Acompanhe",
    howStep3Sub: "Visibilidade operacional do fluxo em tempo real.",
    howStep4: "Opere",
    howStep4Sub: "Automação, copilotos de IA e integrações conectados à operação.",
    // AI / Copilotos
    aiTag: "Sunbeat AI",
    aiTitle: "Copilotos para cada etapa da operação.",
    aiSub:
      "A camada de IA da Sunbeat é construída para apoiar operação, não substituir especialistas. Copilotos que orientam, sugerem e automatizam onde faz sentido.",
    aiBullets: [
      "Copiloto de setup e configuração de intake",
      "Orientação em briefings e demandas incompletas",
      "Sugestões de próximos passos operacionais",
      "Automações ativadas por contexto do fluxo",
    ],
    // Integrations
    intTag: "Integrações",
    intTitle: "Conectado ao ecossistema da sua operação.",
    intSub:
      "A Sunbeat foi construída para operar junto com as ferramentas que sua equipe já usa. Conecte o fluxo de intake com o restante da operação.",
    intNote:
      "Integrações disponíveis variam conforme o plano. Airtable disponível nos planos Starter e acima.",
    // Pricing
    pricingTag: "Planos e preços",
    pricingTitle: "Simples. Transparente. BRL.",
    pricingSub: "Comece grátis. Faça upgrade quando sua operação crescer.",
    pricingMarketNote: "Preços em BRL · sunbeat.com.br",
    pricingEnterprise: "Enterprise",
    pricingEnterpriseFrom: "A partir de R$\u00a0990/mês",
    pricingEnterpriseSub:
      "Para operações de grande escala. Submissões ilimitadas, SLA dedicado, onboarding e contrato personalizado.",
    pricingEnterpriseCta: "Falar com vendas →",
    pricingSeeFull: "Ver todos os detalhes de planos →",
    perMonth: "/mês",
    free: "Grátis",
    buyOnline: "Compra online · sem vendedor",
    planCtas: { free: "Começar grátis", paid: "Criar workspace" },
    // Final CTA
    ctaTitle: "Pronto para organizar sua operação?",
    ctaSub:
      "Crie seu workspace em menos de um minuto. Sem cartão de crédito para começar.",
    ctaPrimary: "Começar grátis",
    ctaSecondary: "Falar com vendas",
  },

  global: {
    // Nav
    navPlans: "Pricing",
    navLogin: "Log in",
    navCta: "Get started",
    // Hero — institutional / software / workflow, EN leads
    heroTag: "Intelligent infrastructure for creative markets",
    heroTitle: "Intelligent intake, workflow",
    heroTitleAlt: "and operations for creative teams.",
    heroSub:
      "Sunbeat is the infrastructure layer that turns forms, briefs and incoming work into structured workflows, operational visibility and scalable execution.",
    heroPrimary: "Start free",
    heroSecondary: "View pricing",
    // Problem
    problemTag: "The problem",
    problemTitle: "Incoming work has a form. Operations still lose context, timing and consistency.",
    problemSub:
      "The intake exists. What's missing is what comes next: structure, visibility, workflow and coordinated execution.",
    // How it works
    howTag: "How it works",
    howTitle: "From incoming work to structured execution.",
    howSub:
      "Sunbeat organizes intake, routes workflow and connects operations with context and automation.",
    howStep1: "Capture",
    howStep1Sub: "Structured intake with configurable schema per operation.",
    howStep2: "Standardize",
    howStep2Sub: "Data, assets and briefs in a single, traceable standard.",
    howStep3: "Track",
    howStep3Sub: "Real-time operational visibility across the workflow.",
    howStep4: "Operate",
    howStep4Sub: "Automation, AI copilots and integrations connected to operations.",
    // AI / Copilotos
    aiTag: "Sunbeat AI",
    aiTitle: "Copilots for every stage of your operation.",
    aiSub:
      "Sunbeat's AI layer is built to support operations — not replace specialists. Copilots that guide, suggest and automate where it makes sense.",
    aiBullets: [
      "Setup and intake configuration copilot",
      "Guidance on incomplete briefs and incoming requests",
      "Next-step suggestions based on workflow context",
      "Automations triggered by operational signals",
    ],
    // Integrations
    intTag: "Integrations",
    intTitle: "Built to connect with your operational stack.",
    intSub:
      "Sunbeat is designed to work alongside the tools your team already uses. Connect your intake workflow with the rest of your operation.",
    intNote:
      "Available integrations vary by plan. Airtable available on Starter and above.",
    // Pricing
    pricingTag: "Pricing",
    pricingTitle: "Simple. Transparent. USD.",
    pricingSub: "Start free. Upgrade as your operation scales.",
    pricingMarketNote: "Prices in USD · sunbeat.pro",
    pricingEnterprise: "Enterprise",
    pricingEnterpriseFrom: "From US$\u00a0199/month",
    pricingEnterpriseSub:
      "For large-scale operations. Unlimited submissions, dedicated SLA, onboarding and custom contract.",
    pricingEnterpriseCta: "Talk to sales →",
    pricingSeeFull: "See full plan details →",
    perMonth: "/mo",
    free: "Free",
    buyOnline: "Buy online · no sales call",
    planCtas: { free: "Start for free", paid: "Create workspace" },
    // Final CTA
    ctaTitle: "Ready to structure your operation?",
    ctaSub:
      "Create your workspace in under a minute. No credit card required.",
    ctaPrimary: "Start free",
    ctaSecondary: "Talk to sales",
  },
};

// ─── Self-serve plan display config ──────────────────────────────────────────

interface PlanConfig {
  id: "free" | "starter" | "pro";
  name: string;
  descriptionPt: string;
  descriptionEn: string;
  featuresPt: string[];
  featuresEn: string[];
  badge: string | null;
  badgeEn: string | null;
  accentColor: string;
  bgColor: string;
  highlight: boolean;
}

const PLANS: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    descriptionPt: "Para começar a testar o fluxo de intake sem compromisso.",
    descriptionEn: "Start testing your intake workflow with no commitment.",
    featuresPt: ["50 submissões/mês", "1 formulário de intake", "Upload: áudio 10 MB, capa 5 MB", "Rascunho automático", "E-mail de resumo"],
    featuresEn: ["50 submissions/mo", "1 intake form", "Upload: audio 10 MB, cover 5 MB", "Auto-draft on submission", "Summary email per submission"],
    badge: null, badgeEn: null,
    accentColor: "#6B7280", bgColor: "#F9F9F9", highlight: false,
  },
  {
    id: "starter",
    name: "Starter",
    descriptionPt: "Para equipes com operação regular de intake e workflow.",
    descriptionEn: "For teams with a steady intake and workflow operation.",
    featuresPt: ["500 submissões/mês", "2 formulários", "Upload: áudio 50 MB, capa 20 MB", "Airtable nativo (sync bidirecional)", "Field mapping visual", "Suporte por e-mail prioritário"],
    featuresEn: ["500 submissions/mo", "2 forms", "Upload: audio 50 MB, cover 20 MB", "Native Airtable (2-way sync)", "Visual field mapping", "Priority email support"],
    badge: "Mais popular", badgeEn: "Most popular",
    accentColor: "#2563EB", bgColor: "#EFF6FF", highlight: false,
    // plan param passed to signup so intent is preserved through the funnel
    signupHref: "/signup?plan=starter",
  },
  {
    id: "pro",
    name: "Pro",
    descriptionPt: "Para operações completas com IA, automações e branding.",
    descriptionEn: "For full operations with AI, automations and custom branding.",
    featuresPt: ["2.000 submissões/mês", "5 formulários", "Upload: áudio 100 MB, capa 50 MB", "IA — Lyric Engine", "Google Drive nativo", "Branding customizado", "Suporte chat + e-mail"],
    featuresEn: ["2,000 submissions/mo", "5 forms", "Upload: audio 100 MB, cover 50 MB", "AI — Lyric Engine", "Native Google Drive", "Custom branding", "Chat + email support"],
    badge: "Mais recursos", badgeEn: "Most powerful",
    accentColor: "#7C3AED", bgColor: "#F5F3FF", highlight: true,
    signupHref: "/signup?plan=pro",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  market: Market;
}

export default function MarketingHome({ market }: Props) {
  const isBrazil = market === "brazil";
  const c = COPY[market];
  const marketConfig = billingCatalog[market];

  return (
    <main className="min-h-screen bg-[#F4F1EA] text-[#111111]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),transparent_38%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-black/8" />

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
              <img src="/sunbeat-logan-transparent-black.ico" alt="Sunbeat" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[#111111]">Sunbeat</div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#6A6660]">
                {isBrazil ? "Infraestrutura para mercados criativos" : "Infrastructure for creative markets"}
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <Link href="#pricing" className="rounded-full px-4 py-2 text-sm font-medium text-[#6A6660] hover:bg-black/5 hover:text-[#111111] transition">
              {c.navPlans}
            </Link>
            <Link href="/login" className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111111]">
              {c.navLogin}
            </Link>
            <Link href="/signup" className="rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold transition hover:bg-[#1D1D1D]" style={{ color: "#ffffff" }}>
              {c.navCta}
            </Link>
          </nav>

          <Link href="/signup" className="inline-flex rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold sm:hidden" style={{ color: "#ffffff" }}>
            {c.navCta}
          </Link>
        </header>

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8 lg:pb-24 lg:pt-10">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              {/* Tag pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6A6660]">
                <span className="h-2 w-2 rounded-full bg-[#111111]" />
                {c.heroTag}
              </div>

              {/* Headline */}
              <h1 className="mt-8 max-w-3xl text-[3rem] font-semibold leading-[1.0] tracking-[-0.06em] text-[#111111] sm:text-[4.2rem] lg:text-[5rem]">
                {c.heroTitle}
                <span className="block" style={{ color: "rgba(17,17,17,0.50)" }}>
                  {c.heroTitleAlt}
                </span>
              </h1>

              {/* Subheadline */}
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5E5A54]">
                {c.heroSub}
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className="inline-flex items-center justify-center rounded-full bg-[#111111] px-6 py-3.5 text-sm font-semibold" style={{ color: "#ffffff" }}>
                  {c.heroPrimary}
                </Link>
                <Link href={isBrazil ? "/contact" : "#pricing"} className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold text-[#111111]">
                  {c.heroSecondary}
                </Link>
              </div>

              {/* Institutional phrase — subtle, below CTAs */}
              <p className="mt-5 text-xs text-[#9B948D]">
                {isBrazil
                  ? "Infraestrutura inteligente de intake, workflow e operação para mercados criativos."
                  : "Sunbeat is an intelligent infrastructure for intake, workflow and operations across creative markets."}
              </p>
            </div>

            <div className="relative">
              <div className="rounded-[40px] border border-black/8 bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.04)] sm:p-10">
                <div className="flex min-h-[400px] items-center justify-center rounded-[30px] border border-black/6 bg-[#FAF8F2] px-8 py-10">
                  <img src="/logo-black-large.png" alt="Sunbeat" className="h-auto w-full max-w-[340px] object-contain" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Problem block ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
        <div className="rounded-[32px] border border-black/8 bg-white px-10 py-10 shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B948D]">
            {c.problemTag}
          </div>
          <h2 className="mt-4 max-w-3xl text-2xl font-semibold leading-[1.3] tracking-[-0.03em] text-[#111111] sm:text-3xl">
            {c.problemTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#5E5A54]">
            {c.problemSub}
          </p>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6A6660]">
            <span className="h-2 w-2 rounded-full bg-[#111111]" />
            {c.howTag}
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[#111111] sm:text-4xl">
            {c.howTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#5E5A54]">
            {c.howSub}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: "01", title: c.howStep1, sub: c.howStep1Sub },
            { step: "02", title: c.howStep2, sub: c.howStep2Sub },
            { step: "03", title: c.howStep3, sub: c.howStep3Sub },
            { step: "04", title: c.howStep4, sub: c.howStep4Sub },
          ].map(({ step, title, sub }) => (
            <div
              key={step}
              className="rounded-[28px] border border-black/8 bg-white p-7 shadow-[0_10px_28px_rgba(0,0,0,0.03)]"
            >
              <div className="text-[11px] font-bold tracking-[0.2em] text-[#C5C0BA]">{step}</div>
              <div className="mt-3 text-lg font-semibold text-[#111111]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[#5E5A54]">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Operational layer (Ecosystem + Capabilities) ───────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Who it's for */}
          <div className="rounded-[32px] border border-black/8 bg-white px-8 py-8 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6A6660]">
              {isBrazil ? "Para quem" : "Who it's for"}
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#111111]">
              {isBrazil
                ? "Para toda equipe criativa que opera com escala."
                : "For every creative team that operates at scale."}
            </h2>
            <p className="mt-4 text-base leading-7 text-[#5E5A54]">
              {isBrazil
                ? "A Sunbeat foi construída para qualquer operação que recebe demandas, precisa rastrear contexto e exige execução coordenada — independente do setor criativo."
                : "Sunbeat is built for any operation that receives incoming work, needs to track context and requires coordinated execution — regardless of the creative sector."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {[
                isBrazil ? "Labels" : "Labels",
                isBrazil ? "Managers" : "Managers",
                isBrazil ? "Distribuidoras" : "Distributors",
                isBrazil ? "Agências criativas" : "Creative agencies",
                isBrazil ? "Times de produção" : "Production teams",
                isBrazil ? "Operações musicais" : "Music operations",
              ].map((item) => (
                <div key={item} className="rounded-full border border-black/8 bg-[#F8F6F1] px-4 py-2.5 text-sm font-medium text-[#393733]">
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Operational capabilities */}
          <div
            className="rounded-[32px] border border-black/8 px-8 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
            style={{ backgroundColor: "#111111" }}
          >
            <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.65)" }}>
              {isBrazil ? "Camada operacional" : "Operational layer"}
            </div>
            <div className="mt-6 grid gap-3">
              {(isBrazil ? [
                "Intake configurável por operação e tenant",
                "Schema de metadados por tipo de demanda",
                "Rascunho automático e continuidade de fluxo",
                "Dashboard de edição de campos e regras",
                "Sincronização com ferramentas operacionais",
                "Visibilidade em tempo real do pipeline",
              ] : [
                "Configurable intake per operation and tenant",
                "Metadata schema per demand type",
                "Auto-draft and flow continuity",
                "Field and rules editor dashboard",
                "Sync with operational tools",
                "Real-time pipeline visibility",
              ]).map((item) => (
                <div
                  key={item}
                  className="rounded-2xl px-4 py-3 text-sm leading-6"
                  style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.85)" }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI / Copilotos ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="rounded-[32px] border border-black/8 bg-[#111111] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.45)" }}>
                {c.aiTag}
              </div>
              <h2 className="mt-3 text-2xl font-semibold leading-[1.3]" style={{ color: "#ffffff" }}>
                {c.aiTitle}
              </h2>
              <p className="mt-3 text-sm leading-7" style={{ color: "rgba(255,255,255,0.65)" }}>
                {c.aiSub}
              </p>
            </div>
            <ul className="grid gap-3">
              {c.aiBullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-3 rounded-2xl px-5 py-3.5 text-sm leading-6"
                  style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.82)" }}
                >
                  <span style={{ color: "rgba(255,255,255,0.30)", flexShrink: 0 }}>→</span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Integrations ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
        <div className="rounded-[32px] border border-black/8 bg-white px-8 py-8 shadow-[0_14px_40px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6A6660]">
            {c.intTag}
          </div>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111]">
                {c.intTitle}
              </h2>
              <p className="mt-3 text-base leading-7 text-[#5E5A54]">
                {c.intSub}
              </p>
              <p className="mt-4 text-xs leading-6 text-[#9B948D]">
                {c.intNote}
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-3">
              {["Airtable", "Google Drive", "Google Sheets", isBrazil ? "Automações" : "Automations", "Webhooks", "API"].map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-black/8 bg-[#F8F6F1] px-4 py-2.5 text-sm font-medium text-[#393733]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing (resumido) ─────────────────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6A6660]">
            <span className="h-2 w-2 rounded-full bg-[#111111]" />
            {c.pricingTag}
          </div>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[#111111] sm:text-5xl">
            {c.pricingTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[#5E5A54]">
            {c.pricingSub}
          </p>
          {/* Market indicator */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white px-3 py-1 text-[11px] text-[#8D867B]">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: isBrazil ? "#16A34A" : "#2563EB" }} />
            {c.pricingMarketNote}
          </div>
        </div>

        {/* Self-serve cards — Free / Starter / Pro */}
        <div className="grid gap-5 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const priceLabel = formatPrice(market, plan.id);
            const price = marketConfig.displayPrices[plan.id];

            return (
              <div
                key={plan.id}
                className="relative flex flex-col rounded-[32px] border p-7"
                style={{
                  borderColor: plan.highlight ? plan.accentColor + "50" : "rgba(0,0,0,0.08)",
                  backgroundColor: plan.highlight ? plan.bgColor : "#FFFFFF",
                  boxShadow: plan.highlight
                    ? `0 0 0 2px ${plan.accentColor}22, 0 20px 48px rgba(0,0,0,0.06)`
                    : "0 14px 34px rgba(0,0,0,0.04)",
                }}
              >
                {(isBrazil ? plan.badge : plan.badgeEn) && (
                  <div className="mb-4 inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{ backgroundColor: plan.accentColor + "18", color: plan.accentColor }}>
                    {isBrazil ? plan.badge : plan.badgeEn}
                  </div>
                )}

                <div className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] w-fit"
                  style={{ backgroundColor: plan.accentColor + "14", color: plan.accentColor }}>
                  {plan.name}
                </div>

                <div className="mt-5">
                  <span className="text-3xl font-semibold tracking-tight text-[#111111]">
                    {priceLabel}
                  </span>
                  {price > 0 && (
                    <span className="ml-1 text-sm text-[#7A746A]">{c.perMonth}</span>
                  )}
                </div>

                <p className="mt-2 text-sm leading-6 text-[#5E5A54]">
                  {isBrazil ? plan.descriptionPt : plan.descriptionEn}
                </p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {(isBrazil ? plan.featuresPt : plan.featuresEn).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#393733]">
                      <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: plan.accentColor }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.signupHref ?? "/signup"}
                  className="mt-7 inline-flex w-full items-center justify-center rounded-2xl py-3 text-sm font-semibold transition"
                  style={
                    plan.highlight
                      ? { backgroundColor: plan.accentColor, color: "#ffffff" }
                      : { backgroundColor: "transparent", color: plan.accentColor, border: `1.5px solid ${plan.accentColor}40` }
                  }
                >
                  {plan.id === "free" ? c.planCtas.free : c.planCtas.paid} →
                </Link>

                {plan.id !== "free" && (
                  <p className="mt-3 text-center text-[10px] text-[#B5B0A8]">{c.buyOnline}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Enterprise — single condensed card (detail on /pricing) */}
        <div className="mt-5 rounded-[28px] border border-black/8 bg-[#111111] px-8 py-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.45)" }}>
                {c.pricingEnterprise}
              </div>
              <div className="mt-1 text-lg font-semibold" style={{ color: "#ffffff" }}>
                {c.pricingEnterpriseFrom}
              </div>
              <p className="mt-1 max-w-lg text-sm leading-6" style={{ color: "rgba(255,255,255,0.60)" }}>
                {c.pricingEnterpriseSub}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl border px-6 py-3 text-sm font-semibold"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: "#ffffff" }}
              >
                {c.pricingEnterpriseCta}
              </Link>
              <Link href="/pricing" className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.40)" }}>
                {c.pricingSeeFull}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="rounded-[40px] border border-black/8 bg-white px-10 py-14 text-center shadow-[0_24px_60px_rgba(0,0,0,0.04)]">
          <h2 className="text-4xl font-semibold tracking-[-0.05em] text-[#111111] sm:text-5xl">
            {c.ctaTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[#5E5A54]">
            {c.ctaSub}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup" className="inline-flex items-center justify-center rounded-full bg-[#111111] px-8 py-3.5 text-sm font-semibold" style={{ color: "#ffffff" }}>
              {c.ctaPrimary}
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-black/10 bg-[#F4F1EA] px-8 py-3.5 text-sm font-semibold text-[#111111]">
              {c.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
