/**
 * MarketingHome — MVP redesign
 *
 * Market-aware home page component.
 * sunbeat.com.br → market "brazil" → Portuguese / commercial / BRL
 * sunbeat.pro    → market "global" → English  / institutional / USD
 *
 * Copy source: Sunbeat Public Home — Redesign & Copy Handoff.pdf (§4/§5)
 * Billing source: lib/billing/catalog.ts (CANONICAL — not the PDF prices)
 *
 * MVP sections:
 * 1. Unified warm nav
 * 2. Hero + ProductWindow placeholder (no real screenshot in /public yet)
 * 3. Trust/credibility strip
 * 4. Problem
 * 5. Operating layer ("Not a form builder" dark panel)
 * 6. How it works
 * 7. AI copilots (re-skinned, governance note added)
 * 8. Integrations (re-skinned warm)
 * 9. Pricing teaser (warm accents, 3 compact tiers → /pricing)
 * 10. Final CTA
 * 11. Structured footer
 *
 * Guardrails:
 * - No sunbeat.ai reference.
 * - No DSP / Zapier / Make claims.
 * - No claim that release_intake redesign is live.
 * - AI framed as governed copilot — suggests/validates, humans confirm.
 * - Music is a strong lead case, never the ceiling.
 * - Pricing from lib/billing/catalog.ts, not the PDF.
 */

import Link from "next/link";
import Footer from "@/components/marketing/Footer";
import {
  billingCatalog,
  formatPrice,
  type Market,
} from "@/lib/billing/catalog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Copy {
  // Nav
  navHowItWorks: string;
  navPlatform: string;
  navIntegrations: string;
  navSecurity: string;
  navPricing: string;
  navLogin: string;
  navCta: string;
  // Hero
  heroEyebrow: string;
  heroTitle: string;
  heroSub: string;
  heroPrimary: string;
  heroSecondary: string;
  heroSupportLine: string;
  // Trust strip
  trustLabel: string;
  trustItems: string[];
  // Problem
  problemEyebrow: string;
  problemTitle: string;
  problemSub: string;
  problemFailures: { title: string; body: string }[];
  // Operating layer
  opEyebrow: string;
  opPullquote: string;
  opBody: string;
  opCapabilities: string[];
  // How it works
  howEyebrow: string;
  howTitle: string;
  howSub: string;
  howStep1: string; howStep1Sub: string;
  howStep2: string; howStep2Sub: string;
  howStep3: string; howStep3Sub: string;
  howStep4: string; howStep4Sub: string;
  // AI copilots
  aiEyebrow: string;
  aiTitle: string;
  aiSub: string;
  aiBullets: string[];
  aiGovernance: string;
  // Integrations
  intEyebrow: string;
  intTitle: string;
  intSub: string;
  intNote: string;
  // Pricing teaser
  pricingEyebrow: string;
  pricingTitle: string;
  pricingSub: string;
  pricingMarketNote: string;
  pricingEnterprise: string;
  pricingEnterpriseFrom: string;
  pricingEnterpriseSub: string;
  pricingEnterpriseCta: string;
  pricingSeeFull: string;
  perMonth: string;
  buyOnline: string;
  planCtas: { free: string; paid: string };
  // Final CTA
  ctaTitle: string;
  ctaSub: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

// ─── Copy map ─────────────────────────────────────────────────────────────────

const COPY: Record<Market, Copy> = {
  global: {
    // Nav
    navHowItWorks: "How it works",
    navPlatform: "Platform",
    navIntegrations: "Integrations",
    navSecurity: "Security",
    navPricing: "Pricing",
    navLogin: "Log in",
    navCta: "Get started",
    // Hero
    heroEyebrow: "Intelligent infrastructure for creative markets",
    heroTitle: "Organize creative requests and connect them to your team's workflow.",
    heroSub:
      "Receive briefs, files and requests in one place. Sunbeat organizes tasks, tracks status and connects the flow with Airtable, Google Drive, Notion, Gmail, Google Workspace, Slack, Asana and Google Sheets.",
    heroPrimary: "Start free →",
    heroSecondary: "View pricing",
    heroSupportLine:
      "Built for creative teams that need to organize requests, files, approvals and delivery in one clear flow.",
    // Trust strip
    trustLabel: "Built for operations that…",
    trustItems: [
      "receive requests & briefs",
      "handle files & metadata",
      "need to ship on a deadline",
    ],
    // Problem
    problemEyebrow: "The problem",
    problemTitle:
      "Incoming work has a form. Your operation still loses context, timing and consistency.",
    problemSub:
      "The intake exists. What's missing is everything after it — structure, visibility, a workflow that doesn't live in someone's head.",
    problemFailures: [
      {
        title: "Scattered intake",
        body: "Requests arrive over email, DMs and spreadsheets, with no single source of truth.",
      },
      {
        title: "Inconsistent data",
        body: "Missing credits, wrong codes, mismatched files — caught late and fixed by hand.",
      },
      {
        title: "No visibility",
        body: "Nobody can answer \"where is this?\" without pinging three people.",
      },
    ],
    // Operating layer
    opEyebrow: "The platform",
    opPullquote: "Not a form builder. An operating layer for creative work.",
    opBody:
      "Sunbeat doesn't stop at collecting answers. It turns intake into structured operational context, workflow continuity, automation and execution visibility — so the work moves, not just the form.",
    opCapabilities: [
      "Configurable intake per operation & tenant",
      "Metadata schema per request type",
      "Auto-draft & resume-by-link continuity",
      "Validation & field-rules dashboard",
      "Sync with your operational tools",
      "Real-time pipeline visibility",
    ],
    // How it works
    howEyebrow: "How it works",
    howTitle: "From incoming work to structured execution.",
    howSub:
      "Sunbeat captures the request, standardizes the data, tracks the flow and connects it to the rest of your operation.",
    howStep1: "01 Capture",
    howStep1Sub:
      "Structured intake with a schema you configure per operation — not a generic form.",
    howStep2: "02 Standardize",
    howStep2Sub:
      "Data, assets and briefs in a single, traceable standard your team can trust.",
    howStep3: "03 Track",
    howStep3Sub:
      "Real-time operational visibility — status, owners and blockers across the pipeline.",
    howStep4: "04 Operate",
    howStep4Sub:
      "Automation, AI copilots and integrations connected to the work.",
    // AI copilots
    aiEyebrow: "Sunbeat AI",
    aiTitle: "Copilots that suggest and validate. People confirm.",
    aiSub:
      "Sunbeat's AI layer supports your operation — it doesn't replace your specialists. It catches issues, drafts the boring parts and proposes next steps, governed by a human at every irreversible step.",
    aiBullets: [
      "Setup & intake configuration copilot",
      "Guidance on incomplete briefs & requests",
      "Next-step suggestions from workflow context",
      "Automations triggered by operational signals",
    ],
    aiGovernance:
      "Governed by design. AI never makes an irreversible change on its own. It drafts, flags and proposes — a person reviews and confirms before anything ships.",
    // Integrations
    intEyebrow: "Integrations",
    intTitle: "Built to connect with your operational stack.",
    intSub:
      "Sunbeat works alongside the tools your team already uses, so structured intake flows straight into the rest of your operation.",
    intNote:
      "Available integrations vary by plan — Airtable on Starter and above; native Google Drive on Pro.",
    // Pricing
    pricingEyebrow: "Pricing — Simple, transparent, in USD.",
    pricingTitle: "Start free. Upgrade as your operation scales.",
    pricingSub: "Buy online — no sales call required.",
    pricingMarketNote: "Prices in USD · sunbeat.pro",
    pricingEnterprise: "Enterprise",
    pricingEnterpriseFrom: "From US$ 199/month",
    pricingEnterpriseSub:
      "For large-scale operations. Unlimited submissions, dedicated SLA, onboarding and custom contract.",
    pricingEnterpriseCta: "Talk to sales →",
    pricingSeeFull: "See full plan details →",
    perMonth: "/mo",
    buyOnline: "Buy online · no sales call",
    planCtas: { free: "Start for free", paid: "Create workspace" },
    // Final CTA
    ctaTitle: "Ready to structure your operation?",
    ctaSub:
      "Create your workspace in under a minute. No credit card required to start.",
    ctaPrimary: "Start free →",
    ctaSecondary: "Talk to sales",
  },

  brazil: {
    // Nav
    navHowItWorks: "Como funciona",
    navPlatform: "Plataforma",
    navIntegrations: "Integrações",
    navSecurity: "Segurança",
    navPricing: "Planos",
    navLogin: "Entrar",
    navCta: "Criar conta",
    // Hero
    heroEyebrow: "Infraestrutura inteligente para mercados criativos",
    heroTitle:
      "Organize demandas criativas e conecte tudo ao seu fluxo de trabalho.",
    heroSub:
      "Receba briefings, arquivos e pedidos em um só lugar. A Sunbeat organiza tarefas, acompanha status e conecta o fluxo com Airtable, Google Drive, Slack, Asana e Google Sheets.",
    heroPrimary: "Começar grátis →",
    heroSecondary: "Ver planos",
    heroSupportLine:
      "Ideal para equipes criativas que precisam organizar pedidos, arquivos, aprovações e entregas em um só fluxo.",
    // Trust strip
    trustLabel: "Feita para operações que…",
    trustItems: [
      "recebem pedidos e briefings",
      "lidam com arquivos e metadados",
      "precisam entregar no prazo",
    ],
    // Problem
    problemEyebrow: "O problema",
    problemTitle:
      "Seu formulário recebe pedidos. Sua operação ainda perde contexto, prazo e padrão.",
    problemSub:
      "A entrada de demandas existe. O que falta é tudo o que vem depois — estrutura, visibilidade e um fluxo que não vive só na cabeça de alguém.",
    problemFailures: [
      {
        title: "Entrada espalhada",
        body: "Pedidos chegam por e-mail, DM e planilha, sem fonte única de verdade.",
      },
      {
        title: "Dados inconsistentes",
        body: "Créditos faltando, códigos errados, arquivos trocados — descobertos tarde e corrigidos na mão.",
      },
      {
        title: "Sem visibilidade",
        body: "Ninguém responde \"onde está isso?\" sem chamar três pessoas.",
      },
    ],
    // Operating layer
    opEyebrow: "A plataforma",
    opPullquote:
      "Não é um criador de formulários. É uma camada operacional para trabalho criativo.",
    opBody:
      "A Sunbeat não para na coleta de respostas. Ela transforma intake em contexto operacional estruturado, continuidade de workflow, automação e visibilidade de execução — para o trabalho andar, não só o formulário.",
    opCapabilities: [
      "Intake configurável por operação e tenant",
      "Schema de metadados por tipo de demanda",
      "Rascunho automático e continuidade por link",
      "Dashboard de validação e regras de campo",
      "Sincronização com suas ferramentas operacionais",
      "Visibilidade do pipeline em tempo real",
    ],
    // How it works
    howEyebrow: "Como funciona",
    howTitle: "Da entrada de demandas à execução organizada.",
    howSub:
      "A Sunbeat captura a solicitação, padroniza os dados, acompanha o fluxo e conecta ao restante da sua operação.",
    howStep1: "01 Receba",
    howStep1Sub:
      "Intake estruturado com schema configurável por operação — não um formulário genérico.",
    howStep2: "02 Padronize",
    howStep2Sub:
      "Dados, assets e briefings em um padrão único e rastreável em que o time confia.",
    howStep3: "03 Acompanhe",
    howStep3Sub:
      "Visibilidade operacional em tempo real — status, responsáveis e bloqueios no pipeline.",
    howStep4: "04 Opere",
    howStep4Sub:
      "Automação, copilotos de IA e integrações conectados ao trabalho.",
    // AI copilots
    aiEyebrow: "Sunbeat AI",
    aiTitle: "Copilotos que sugerem e validam. Pessoas confirmam.",
    aiSub:
      "A camada de IA da Sunbeat apoia sua operação — não substitui seus especialistas. Ela detecta problemas, rascunha as partes chatas e propõe próximos passos, com um humano no comando de cada etapa irreversível.",
    aiBullets: [
      "Copiloto de setup e configuração de intake",
      "Orientação em briefings e pedidos incompletos",
      "Sugestões de próximos passos pelo contexto do fluxo",
      "Automações ativadas por sinais operacionais",
    ],
    aiGovernance:
      "Governada por princípio. A IA nunca faz uma mudança irreversível sozinha. Ela rascunha, alerta e propõe — uma pessoa revisa e confirma antes de qualquer envio.",
    // Integrations
    intEyebrow: "Integrações",
    intTitle: "Conectada ao ecossistema da sua operação.",
    intSub:
      "A Sunbeat opera junto com as ferramentas que seu time já usa, para o intake estruturado fluir diretamente para o restante da operação.",
    intNote:
      "Integrações disponíveis variam conforme o plano — Airtable a partir do Starter; Google Drive nativo no Pro.",
    // Pricing
    pricingEyebrow: "Planos — Simples. Transparente. BRL.",
    pricingTitle: "Comece grátis. Faça upgrade quando a operação crescer.",
    pricingSub: "Compra online · sem vendedor.",
    pricingMarketNote: "Preços em BRL · sunbeat.com.br",
    pricingEnterprise: "Enterprise",
    pricingEnterpriseFrom: "A partir de R$ 990/mês",
    pricingEnterpriseSub:
      "Para operações de grande escala. Submissões ilimitadas, SLA dedicado, onboarding e contrato personalizado.",
    pricingEnterpriseCta: "Falar com vendas →",
    pricingSeeFull: "Ver todos os detalhes de planos →",
    perMonth: "/mês",
    buyOnline: "Compra online · sem vendedor",
    planCtas: { free: "Começar grátis", paid: "Criar workspace" },
    // Final CTA
    ctaTitle: "Pronto para organizar sua operação?",
    ctaSub:
      "Crie seu workspace em menos de um minuto. Sem cartão de crédito para começar.",
    ctaPrimary: "Começar grátis →",
    ctaSecondary: "Falar com vendas",
  },
};

// ─── Plan display config ──────────────────────────────────────────────────────

interface PlanConfig {
  id: "free" | "starter" | "pro";
  name: string;
  descriptionPt: string;
  descriptionEn: string;
  featuresPt: string[];
  featuresEn: string[];
  badge: string | null;
  badgeEn: string | null;
  highlight: boolean;
  signupHref?: string;
}

const PLANS: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    descriptionPt: "Para começar a testar o fluxo de intake sem compromisso.",
    descriptionEn: "Start testing your intake workflow with no commitment.",
    featuresPt: [
      "50 submissões/mês",
      "1 formulário de intake",
      "Upload: áudio 10 MB, capa 5 MB",
      "Rascunho automático",
      "E-mail de resumo",
    ],
    featuresEn: [
      "50 submissions/mo",
      "1 intake form",
      "Upload: audio 10 MB, cover 5 MB",
      "Auto-draft on submission",
      "Summary email per submission",
    ],
    badge: null,
    badgeEn: null,
    highlight: false,
  },
  {
    id: "starter",
    name: "Starter",
    descriptionPt: "Para equipes com operação regular de intake e workflow.",
    descriptionEn: "For teams with a steady intake and workflow operation.",
    featuresPt: [
      "500 submissões/mês",
      "2 formulários",
      "Upload: áudio 50 MB, capa 20 MB",
      "Airtable nativo (sync bidirecional)",
      "Field mapping visual",
      "Suporte por e-mail prioritário",
    ],
    featuresEn: [
      "500 submissions/mo",
      "2 forms",
      "Upload: audio 50 MB, cover 20 MB",
      "Native Airtable (2-way sync)",
      "Visual field mapping",
      "Priority email support",
    ],
    badge: "Mais popular",
    badgeEn: "Most popular",
    highlight: false,
    signupHref: "/signup?plan=starter",
  },
  {
    id: "pro",
    name: "Pro",
    descriptionPt: "Para operações completas com IA, automações e branding.",
    descriptionEn: "For full operations with AI, automations and custom branding.",
    featuresPt: [
      "2.000 submissões/mês",
      "5 formulários",
      "Upload: áudio 100 MB, capa 50 MB",
      "IA — Copiloto de setup e intake",
      "Google Drive nativo",
      "Branding customizado",
      "Suporte chat + e-mail",
    ],
    featuresEn: [
      "2,000 submissions/mo",
      "5 forms",
      "Upload: audio 100 MB, cover 50 MB",
      "AI — Setup & intake copilot",
      "Native Google Drive",
      "Custom branding",
      "Chat + email support",
    ],
    badge: "Mais recursos",
    badgeEn: "Most powerful",
    highlight: true,
    signupHref: "/signup?plan=pro",
  },
];

// ─── Integration pills ────────────────────────────────────────────────────────

const INTEGRATIONS = ["Airtable", "Google Drive", "Google Sheets", "Webhooks", "API"];
const INTEGRATIONS_PT = ["Airtable", "Google Drive", "Google Sheets", "Webhooks", "API", "Automações"];
const INTEGRATIONS_EN = [...INTEGRATIONS, "Automations"];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  market: Market;
}

export default function MarketingHome({ market }: Props) {
  const isBrazil = market === "brazil";
  const c = COPY[market];
  const marketConfig = billingCatalog[market];

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#111111]">

      {/* ── 1. Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-black/8 bg-[#F4F1EA]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/8 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
              <img
                src="/sunbeat-logan-transparent-black.ico"
                alt="Sunbeat"
                className="h-5 w-5 object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#111111]">
                Sunbeat
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#8D867B]">
                {isBrazil
                  ? "Infraestrutura para mercados criativos"
                  : "Infrastructure for creative markets"}
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {[
              { label: c.navHowItWorks, href: "/how-it-works" },
              { label: c.navPlatform, href: "/product" },
              { label: c.navIntegrations, href: "/product#integrations" },
              { label: c.navSecurity, href: "/security" },
              { label: c.navPricing, href: "/pricing" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-[#6A6660] hover:bg-black/5 hover:text-[#111111] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#111111] sm:inline-flex"
            >
              {c.navLogin}
            </Link>
            <Link
              href="/signup"
              className="inline-flex rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold hover:bg-[#1D1D1D] transition-colors"
              style={{ color: "#ffffff" }}
            >
              {c.navCta}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── 2. Hero ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 pb-16 pt-14 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            {/* Left: copy */}
            <div>
              {/* Eyebrow pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6A6660]">
                <span className="h-2 w-2 rounded-full bg-[#FBBF24]" />
                {c.heroEyebrow}
              </div>

              {/* Headline */}
              <h1 className="mt-6 text-[2.8rem] font-semibold leading-[1.05] tracking-[-0.05em] text-[#111111] sm:text-[3.6rem] lg:text-[4.2rem]">
                {c.heroTitle}
              </h1>

              {/* Subheadline */}
              <p className="mt-5 max-w-xl text-lg leading-8 text-[#5E5A54]">
                {c.heroSub}
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-[#111111] px-7 py-3.5 text-sm font-semibold transition hover:bg-[#1D1D1D]"
                  style={{ color: "#ffffff" }}
                >
                  {c.heroPrimary}
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-7 py-3.5 text-sm font-semibold text-[#111111]"
                >
                  {c.heroSecondary}
                </Link>
              </div>

              {/* Support line */}
              <p className="mt-5 text-xs leading-6 text-[#9B948D]">
                {c.heroSupportLine}
              </p>
            </div>

            {/* Right: ProductWindow placeholder
                NOTE: No real product screenshot exists in /public yet.
                Using a styled browser-frame placeholder that represents the
                operational workspace. Replace with an optimized PNG/WebP when
                a screenshot is approved. */}
            <div className="relative">
              <div
                className="overflow-hidden rounded-[24px] border border-black/8 bg-white shadow-[0_24px_60px_rgba(20,16,10,0.08)]"
                aria-hidden="true"
              >
                {/* Window titlebar */}
                <div className="flex items-center gap-2 border-b border-black/6 bg-[#F8F4EC] px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-black/12" />
                  <span className="h-3 w-3 rounded-full bg-black/12" />
                  <span className="h-3 w-3 rounded-full bg-black/12" />
                  <div className="mx-3 flex-1 rounded-full bg-black/6 px-4 py-1 text-[11px] text-[#9B948D]">
                    app.sunbeat.pro / submissions
                  </div>
                </div>

                {/* Window body — structured content representation */}
                <div className="p-5">
                  {/* Header row */}
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9B948D]">
                        {isBrazil ? "Entradas e rascunhos" : "Submissions"}
                      </div>
                    </div>
                    <div className="rounded-full bg-[#111111] px-4 py-1.5 text-[11px] font-semibold text-white">
                      {isBrazil ? "Nova submissão" : "New submission"}
                    </div>
                  </div>

                  {/* Stat row */}
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {[
                      { label: isBrazil ? "Total" : "Total", value: "12" },
                      { label: isBrazil ? "Rascunhos" : "Drafts", value: "3" },
                      { label: isBrazil ? "Pendentes" : "Pending", value: "2" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-black/6 bg-[#F8F6F1] px-3 py-2.5"
                      >
                        <div className="text-xs text-[#9B948D]">{s.label}</div>
                        <div className="mt-0.5 text-xl font-semibold text-[#111111]">
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Submission rows */}
                  <div className="space-y-2">
                    {[
                      { name: "Lucas Martins", status: isBrazil ? "Em análise" : "In review", dot: "#16A34A" },
                      { name: "Mabele Lin", status: isBrazil ? "Rascunho" : "Draft", dot: "#FBBF24" },
                      { name: "Gil Rouah", status: isBrazil ? "Enviado" : "Submitted", dot: "#111111" },
                      { name: "Andressa R.", status: isBrazil ? "Pendente" : "Pending", dot: "#9B948D" },
                    ].map((row) => (
                      <div
                        key={row.name}
                        className="flex items-center justify-between rounded-xl border border-black/6 bg-white px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-[#F8F6F1]" />
                          <span className="text-sm font-medium text-[#111111]">
                            {row.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: row.dot }}
                          />
                          <span className="text-xs text-[#5E5A54]">{row.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Trust / credibility strip ────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
          <div className="flex flex-col items-start gap-4 rounded-[24px] border border-black/8 bg-white px-8 py-6 sm:flex-row sm:items-center sm:gap-8 shadow-[0_8px_24px_rgba(20,16,10,0.04)]">
            <div className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-[#9B948D]">
              {c.trustLabel}
            </div>
            <div className="flex flex-wrap gap-3">
              {c.trustItems.map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-black/8 bg-[#F8F6F1] px-4 py-2 text-sm font-medium text-[#393733]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Problem ──────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="rounded-[32px] border border-black/8 bg-white px-8 py-10 shadow-[0_14px_40px_rgba(20,16,10,0.04)] sm:px-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9B948D]">
              {c.problemEyebrow}
            </div>
            <h2 className="mt-4 max-w-3xl text-2xl font-semibold leading-[1.3] tracking-[-0.03em] text-[#111111] sm:text-3xl">
              {c.problemTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#5E5A54]">
              {c.problemSub}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {c.problemFailures.map((f) => (
                <div
                  key={f.title}
                  className="rounded-[20px] border border-black/6 bg-[#F8F6F1] px-5 py-5"
                >
                  <div className="text-sm font-semibold text-[#111111]">{f.title}</div>
                  <p className="mt-2 text-sm leading-6 text-[#5E5A54]">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Operating layer — "Not a form builder" ───────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div
            className="rounded-[32px] p-8 sm:p-10"
            style={{
              backgroundColor: "#111111",
              boxShadow: "0 20px 60px rgba(0,0,0,0.14)",
            }}
          >
            {/* Eyebrow */}
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {c.opEyebrow}
            </div>

            <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
              {/* Pull-quote + body */}
              <div>
                <p
                  className="text-2xl font-semibold leading-[1.25] tracking-[-0.03em] sm:text-3xl"
                  style={{ color: "#ffffff" }}
                >
                  {c.opPullquote}
                </p>
                <p
                  className="mt-5 text-base leading-7"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  {c.opBody}
                </p>
              </div>

              {/* Capability grid */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                {c.opCapabilities.map((cap) => (
                  <div
                    key={cap}
                    className="rounded-2xl px-4 py-3.5 text-sm leading-6"
                    style={{
                      border: "1px solid rgba(255,255,255,0.10)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.82)",
                    }}
                  >
                    {cap}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. How it works ─────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6A6660]">
              <span className="h-2 w-2 rounded-full bg-[#111111]" />
              {c.howEyebrow}
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[#111111] sm:text-4xl">
              {c.howTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-[#5E5A54]">
              {c.howSub}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: c.howStep1, sub: c.howStep1Sub },
              { title: c.howStep2, sub: c.howStep2Sub },
              { title: c.howStep3, sub: c.howStep3Sub },
              { title: c.howStep4, sub: c.howStep4Sub },
            ].map(({ title, sub }) => (
              <div
                key={title}
                className="rounded-[28px] border border-black/8 bg-white p-7 shadow-[0_10px_28px_rgba(20,16,10,0.03)]"
              >
                <div className="text-xs font-semibold text-[#111111]">{title}</div>
                <p className="mt-2 text-sm leading-6 text-[#5E5A54]">{sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 7. AI copilots ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div
            className="rounded-[32px] p-8 sm:p-10"
            style={{
              backgroundColor: "#1A1714",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            }}
          >
            {/* Eyebrow */}
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.40)" }}
            >
              {c.aiEyebrow}
            </div>

            <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              {/* Left: title + body */}
              <div>
                <h2
                  className="text-2xl font-semibold leading-[1.3] tracking-[-0.03em]"
                  style={{ color: "#ffffff" }}
                >
                  {c.aiTitle}
                </h2>
                <p
                  className="mt-3 text-base leading-7"
                  style={{ color: "rgba(255,255,255,0.60)" }}
                >
                  {c.aiSub}
                </p>

                {/* Governance note */}
                <div
                  className="mt-6 rounded-2xl px-5 py-4 text-sm leading-6"
                  style={{
                    border: "1px solid rgba(251,191,36,0.20)",
                    backgroundColor: "rgba(251,191,36,0.06)",
                    color: "rgba(255,255,255,0.70)",
                  }}
                >
                  <span style={{ color: "#FBBF24", fontWeight: 600 }}>
                    {isBrazil ? "Governada por princípio." : "Governed by design."}
                  </span>{" "}
                  {c.aiGovernance.replace(
                    isBrazil ? "Governada por princípio. " : "Governed by design. ",
                    ""
                  )}
                </div>
              </div>

              {/* Right: bullets */}
              <ul className="mt-2 grid gap-2.5">
                {c.aiBullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-3 rounded-2xl px-5 py-3.5 text-sm leading-6"
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.80)",
                    }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.28)", flexShrink: 0 }}>
                      →
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── 8. Integrations ─────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="rounded-[32px] border border-black/8 bg-white px-8 py-8 shadow-[0_14px_40px_rgba(20,16,10,0.03)] sm:px-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9B948D]">
              {c.intEyebrow}
            </div>
            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111]">
                  {c.intTitle}
                </h2>
                <p className="mt-3 text-base leading-7 text-[#5E5A54]">
                  {c.intSub}
                </p>
                <p className="mt-4 text-xs leading-6 text-[#9B948D]">{c.intNote}</p>
              </div>
              <div className="flex flex-wrap items-start gap-2.5">
                {(isBrazil ? INTEGRATIONS_PT : INTEGRATIONS_EN).map((item) => (
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

        {/* ── 9. Pricing teaser ───────────────────────────────────────────── */}
        <section id="pricing" className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-14">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6A6660]">
              <span className="h-2 w-2 rounded-full bg-[#111111]" />
              {c.pricingEyebrow}
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[#111111] sm:text-4xl">
              {c.pricingTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-[#5E5A54]">
              {c.pricingSub}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white px-3 py-1.5 text-[11px] text-[#8D867B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
              {c.pricingMarketNote}
            </div>
          </div>

          {/* 3 compact plan cards — warm accents only */}
          <div className="grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => {
              const priceLabel = formatPrice(market, plan.id);
              const price = marketConfig.displayPrices[plan.id];
              const badge = isBrazil ? plan.badge : plan.badgeEn;

              return (
                <div
                  key={plan.id}
                  className="relative flex flex-col rounded-[28px] border border-black/8 bg-white p-6"
                  style={{
                    boxShadow: plan.highlight
                      ? "0 0 0 2px rgba(17,17,17,0.12), 0 20px 48px rgba(20,16,10,0.06)"
                      : "0 10px 28px rgba(20,16,10,0.04)",
                  }}
                >
                  {badge && (
                    <div className="mb-3 inline-flex w-fit rounded-full bg-[#111111]/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#393733]">
                      {badge}
                    </div>
                  )}

                  <div className="rounded-full border border-black/10 bg-[#F8F6F1] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#393733] w-fit">
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

                  <ul className="mt-5 flex-1 space-y-2">
                    {(isBrazil ? plan.featuresPt : plan.featuresEn).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-[#393733]">
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#111111]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.signupHref ?? "/signup"}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-black/10 bg-[#111111] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D1D1D]"
                    style={
                      plan.highlight
                        ? { backgroundColor: "#111111", color: "#ffffff" }
                        : {
                            backgroundColor: "transparent",
                            color: "#111111",
                            borderColor: "rgba(0,0,0,0.12)",
                          }
                    }
                  >
                    {plan.id === "free" ? c.planCtas.free : c.planCtas.paid} →
                  </Link>

                  {plan.id !== "free" && (
                    <p className="mt-2 text-center text-[10px] text-[#B5B0A8]">
                      {c.buyOnline}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Enterprise strip */}
          <div
            className="mt-4 rounded-[24px] px-8 py-6"
            style={{ backgroundColor: "#111111" }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  {c.pricingEnterprise}
                </div>
                <div
                  className="mt-1 text-lg font-semibold"
                  style={{ color: "#ffffff" }}
                >
                  {c.pricingEnterpriseFrom}
                </div>
                <p
                  className="mt-1 max-w-lg text-sm leading-6"
                  style={{ color: "rgba(255,255,255,0.58)" }}
                >
                  {c.pricingEnterpriseSub}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl border px-6 py-2.5 text-sm font-semibold"
                  style={{ borderColor: "rgba(255,255,255,0.20)", color: "#ffffff" }}
                >
                  {c.pricingEnterpriseCta}
                </Link>
                <Link
                  href="/pricing"
                  className="text-[11px] text-center"
                  style={{ color: "rgba(255,255,255,0.38)" }}
                >
                  {c.pricingSeeFull}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── 10. Final CTA ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
          <div className="rounded-[40px] border border-black/8 bg-white px-10 py-16 text-center shadow-[0_24px_60px_rgba(20,16,10,0.04)]">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#111111] sm:text-4xl">
              {c.ctaTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#5E5A54]">
              {c.ctaSub}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-[#111111] px-8 py-3.5 text-sm font-semibold hover:bg-[#1D1D1D] transition"
                style={{ color: "#ffffff" }}
              >
                {c.ctaPrimary}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-[#F4F1EA] px-8 py-3.5 text-sm font-semibold text-[#111111]"
              >
                {c.ctaSecondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── 11. Footer ──────────────────────────────────────────────────────── */}
      <Footer market={market} />
    </div>
  );
}
