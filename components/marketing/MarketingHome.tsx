import Link from "next/link";
import {
  billingCatalog,
  enterpriseTiers,
  formatPrice,
  type Market,
  type BillingTierType,
} from "@/lib/billing/catalog";

// ─── Static data ──────────────────────────────────────────────────────────────

const ecosystem = [
  "Artistas",
  "Labels",
  "Managers",
  "Empresas",
  "Times criativos",
  "Times operacionais",
];

const capabilities = [
  "Intake público sem login",
  "Rascunho para continuar depois",
  "Resumo automático por e-mail",
  "Sincronização com Airtable",
  "Dashboard para ajustar campos e regras do intake",
];

interface PlanConfig {
  id: "free" | "starter" | "pro";
  name: string;
  descriptionPt: string;
  descriptionEn: string;
  ctaPt: string;
  ctaEn: string;
  href: string;
  highlight: boolean;
  featuresPt: string[];
  featuresEn: string[];
  badge: string | null;
  badgeEn: string | null;
  accentColor: string;
  bgColor: string;
}

const plansConfig: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    descriptionPt: "Para começar a testar o fluxo de lançamento.",
    descriptionEn: "Start testing your release workflow with no commitment.",
    ctaPt: "Começar grátis",
    ctaEn: "Start for free",
    href: "/signup",
    highlight: false,
    featuresPt: [
      "50 submissões/mês",
      "1 formulário",
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
    accentColor: "#6B7280",
    bgColor: "#F9F9F9",
  },
  {
    id: "starter",
    name: "Starter",
    descriptionPt: "Para labels e managers que precisam de mais controle.",
    descriptionEn: "For labels and managers with a steady release operation.",
    ctaPt: "Criar workspace",
    ctaEn: "Create workspace",
    href: "/signup",
    highlight: false,
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
    accentColor: "#2563EB",
    bgColor: "#EFF6FF",
  },
  {
    id: "pro",
    name: "Pro",
    descriptionPt: "Para operações completas com IA e integrações avançadas.",
    descriptionEn: "For full operations with AI, advanced integrations, and branding.",
    ctaPt: "Criar workspace",
    ctaEn: "Create workspace",
    href: "/signup",
    highlight: true,
    featuresPt: [
      "2.000 submissões/mês",
      "5 formulários",
      "Upload: áudio 100 MB, capa 50 MB",
      "IA — Lyric Engine",
      "Google Drive + Sheets nativos",
      "Branding customizado",
      "Suporte chat + e-mail",
    ],
    featuresEn: [
      "2,000 submissions/mo",
      "5 forms",
      "Upload: audio 100 MB, cover 50 MB",
      "AI — Lyric Engine",
      "Native Google Drive + Sheets",
      "Custom branding",
      "Chat + email support",
    ],
    badge: "Mais recursos",
    badgeEn: "Most powerful",
    accentColor: "#7C3AED",
    bgColor: "#F5F3FF",
  },
];

// Features per enterprise tier
const enterpriseTierDisplay: Record<string, { featuresPt: string[]; featuresEn: string[] }> = {
  enterprise_core: {
    featuresPt: [
      "Submissões ilimitadas",
      "Formulários ilimitados",
      "SLA contratual",
      "Onboarding dedicado",
      "Usuários ilimitados",
    ],
    featuresEn: [
      "Unlimited submissions",
      "Unlimited forms",
      "Contractual SLA",
      "Dedicated onboarding",
      "Unlimited users",
    ],
  },
  enterprise_ops: {
    featuresPt: [
      "Tudo do Core",
      "Todos os produtos IA",
      "Notion nativo",
      "20+ usuários",
      "Suporte dedicado",
    ],
    featuresEn: [
      "Everything in Core",
      "All AI products",
      "Native Notion",
      "20+ users",
      "Dedicated support",
    ],
  },
  enterprise_distribution: {
    featuresPt: [
      "Tudo do Ops",
      "White label completo",
      "Domínio customizado",
      "Contrato personalizado",
      "Revenue share disponível",
    ],
    featuresEn: [
      "Everything in Ops",
      "Full white label",
      "Custom domain",
      "Custom contract",
      "Revenue share available",
    ],
  },
};

function getEnterpriseCta(tierType: BillingTierType, isBrazil: boolean) {
  if (tierType === "internal_commercial") {
    return {
      label: isBrazil ? "Contato comercial →" : "Commercial inquiry →",
      href: isBrazil ? "mailto:comercial@sunbeat.com.br" : "mailto:partnerships@sunbeat.pro",
      subtle: true,
    };
  }
  return {
    label: isBrazil ? "Falar com vendas →" : "Talk to sales →",
    href: "/contact",
    subtle: false,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  market: Market;
}

export default function MarketingHome({ market }: Props) {
  const isBrazil = market === "brazil";
  const marketConfig = billingCatalog[market];

  const marketNote = isBrazil
    ? `Preços em BRL · ${marketConfig.domain}`
    : `Prices in USD · ${marketConfig.domain}`;

  return (
    <main className="min-h-screen bg-[#F4F1EA] text-[#111111]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),transparent_38%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-black/8" />

        {/* ── Header ── */}
        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
              <img
                src="/sunbeat-logan-transparent-black.ico"
                alt="Sunbeat"
                className="h-7 w-7 object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[#111111]">
                Sunbeat
              </div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#6A6660]">
                Shine Brighter, Work Smarter
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="#pricing"
              className="rounded-full px-4 py-2 text-sm font-medium text-[#6A6660] hover:bg-black/5 hover:text-[#111111] transition"
            >
              {isBrazil ? "Planos" : "Pricing"}
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111111]"
            >
              {isBrazil ? "Entrar" : "Log in"}
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold transition hover:bg-[#1D1D1D]"
              style={{ color: "#ffffff" }}
            >
              {isBrazil ? "Criar conta" : "Get started"}
            </Link>
          </nav>

          {/* Mobile */}
          <Link
            href="/signup"
            className="inline-flex rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold sm:hidden"
            style={{ color: "#ffffff" }}
          >
            {isBrazil ? "Criar conta" : "Get started"}
          </Link>
        </header>

        {/* ── Hero ── */}
        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8 lg:pb-24 lg:pt-10">
          <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6A6660]">
                <span className="h-2 w-2 rounded-full bg-[#111111]" />
                {isBrazil ? "Infraestrutura para lançamentos" : "Release infrastructure"}
              </div>

              <h1 className="mt-8 max-w-4xl text-[3.4rem] font-semibold leading-[0.9] tracking-[-0.07em] text-[#111111] sm:text-[4.8rem] lg:text-[5.6rem]">
                {isBrazil ? (
                  <>
                    A base sólida
                    <span className="block" style={{ color: "rgba(17,17,17,0.55)" }}>
                      por trás do lançamento.
                    </span>
                  </>
                ) : (
                  <>
                    The solid foundation
                    <span className="block" style={{ color: "rgba(17,17,17,0.55)" }}>
                      behind every release.
                    </span>
                  </>
                )}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5E5A54]">
                {isBrazil
                  ? "Cada lançamento carrega um sonho. A Sunbeat existe para dar estrutura, direção e processo a esse momento — para que artistas, labels e managers possam entregar com clareza e confiança."
                  : "Every release carries a vision. Sunbeat gives it structure, direction, and process — so artists, labels, and managers can deliver with clarity and confidence."}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-[#111111] px-6 py-3.5 text-sm font-semibold"
                  style={{ color: "#ffffff" }}
                >
                  {isBrazil ? "Criar workspace grátis" : "Create free workspace"}
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold text-[#111111]"
                >
                  {isBrazil ? "Ver planos" : "See pricing"}
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[40px] border border-black/8 bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.04)] sm:p-10">
                <div className="flex min-h-[420px] items-center justify-center rounded-[30px] border border-black/6 bg-[#FAF8F2] px-8 py-10">
                  <img
                    src="/logo-black-large.png"
                    alt="Sunbeat"
                    className="h-auto w-full max-w-[380px] object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Ecosystem + Capabilities ── */}
      <section className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] border border-black/8 bg-white px-8 py-8 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6A6660]">
              {isBrazil ? "Ecossistema" : "Ecosystem"}
            </div>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#111111]">
              {isBrazil
                ? "Para todos os times por trás do lançamento."
                : "For every team behind the release."}
            </h2>
            <p className="mt-4 text-base leading-8 text-[#5E5A54]">
              {isBrazil
                ? "A Sunbeat organiza a entrada de metadados e assets para quem precisa operar com clareza — do primeiro envio até a continuidade do fluxo interno."
                : "Sunbeat organizes metadata and asset intake for teams that need to operate with clarity — from the first submission to the internal workflow."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {ecosystem.map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-black/8 bg-[#F8F6F1] px-4 py-2.5 text-sm font-medium text-[#393733]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-[32px] border border-black/8 px-8 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
            style={{ backgroundColor: "#111111" }}
          >
            <div
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              {isBrazil ? "Funcionalidades" : "Features"}
            </div>
            <div className="mt-6 grid gap-3">
              {capabilities.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl px-4 py-3 text-sm leading-6"
                  style={{
                    border: "1px solid rgba(255,255,255,0.10)",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
            <p
              className="mt-6 text-sm leading-7"
              style={{ color: "rgba(255,255,255,0.70)" }}
            >
              {isBrazil
                ? "Clientes podem editar o intake via dashboard, ajustar campos, helper texts e obrigatoriedade — enquanto o formulário público continua simples para quem preenche e o time recebe tudo organizado no fluxo operacional."
                : "Clients can edit the intake via dashboard, adjust fields, helper texts, and required fields — while the public form stays simple for submitters and the team receives everything organized in the operational flow."}
            </p>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6A6660]">
            <span className="h-2 w-2 rounded-full bg-[#111111]" />
            {isBrazil ? "Planos e preços" : "Pricing"}
          </div>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[#111111] sm:text-5xl">
            {isBrazil ? "Simples. Transparente. BRL." : "Simple. Transparent. USD."}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-[#5E5A54]">
            {isBrazil
              ? "Comece grátis e faça upgrade quando sua operação crescer. Sem surpresas, sem contratos longos."
              : "Start free and upgrade as your operation grows. No surprises, no long-term contracts."}
          </p>
          {/* Market indicator pill */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white px-3 py-1 text-[11px] text-[#8D867B]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: isBrazil ? "#16A34A" : "#2563EB" }}
            />
            {marketNote}
          </div>
        </div>

        {/* Self-serve plan cards */}
        <div className="grid gap-5 sm:grid-cols-3">
          {plansConfig.map((plan) => {
            const priceLabel = formatPrice(market, plan.id);
            const price = marketConfig.displayPrices[plan.id];

            return (
              <div
                key={plan.id}
                className="relative flex flex-col rounded-[32px] border p-7 transition"
                style={{
                  borderColor: plan.highlight ? plan.accentColor + "50" : "rgba(0,0,0,0.08)",
                  backgroundColor: plan.highlight ? plan.bgColor : "#FFFFFF",
                  boxShadow: plan.highlight
                    ? `0 0 0 2px ${plan.accentColor}22, 0 20px 48px rgba(0,0,0,0.06)`
                    : "0 14px 34px rgba(0,0,0,0.04)",
                }}
              >
                {/* Badge */}
                {(isBrazil ? plan.badge : plan.badgeEn) && (
                  <div
                    className="mb-4 inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{
                      backgroundColor: plan.accentColor + "18",
                      color: plan.accentColor,
                    }}
                  >
                    {isBrazil ? plan.badge : plan.badgeEn}
                  </div>
                )}

                {/* Plan name */}
                <div
                  className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] w-fit"
                  style={{
                    backgroundColor: plan.accentColor + "14",
                    color: plan.accentColor,
                  }}
                >
                  {plan.name}
                </div>

                {/* Price — from billingCatalog[market] */}
                <div className="mt-5">
                  <span className="text-3xl font-semibold tracking-tight text-[#111111]">
                    {priceLabel}
                  </span>
                  {price > 0 && (
                    <span className="ml-1 text-sm text-[#7A746A]">
                      {isBrazil ? "/mês" : "/mo"}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm leading-6 text-[#5E5A54]">
                  {isBrazil ? plan.descriptionPt : plan.descriptionEn}
                </p>

                {/* Features */}
                <ul className="mt-6 flex-1 space-y-2.5">
                  {(isBrazil ? plan.featuresPt : plan.featuresEn).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#393733]">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ color: plan.accentColor }}
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

                {/* CTA */}
                <Link
                  href={plan.href}
                  className="mt-7 inline-flex w-full items-center justify-center rounded-2xl py-3 text-sm font-semibold transition"
                  style={
                    plan.highlight
                      ? { backgroundColor: plan.accentColor, color: "#ffffff" }
                      : {
                          backgroundColor: "transparent",
                          color: plan.accentColor,
                          border: `1.5px solid ${plan.accentColor}40`,
                        }
                  }
                >
                  {isBrazil ? plan.ctaPt : plan.ctaEn} →
                </Link>

                {/* Self-serve indicator */}
                <p className="mt-3 text-center text-[10px] text-[#B5B0A8]">
                  {plan.id !== "free"
                    ? isBrazil ? "Compra online · sem vendedor" : "Buy online · no sales call"
                    : ""}
                </p>
              </div>
            );
          })}
        </div>

        {/* Enterprise section — full 3-tier cards, same as /pricing */}
        <div className="mt-10">
          <div className="rounded-[32px] border border-black/8 bg-[#111111] p-8">
            {/* Enterprise header */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  Enterprise
                </div>
                <h3 className="mt-1 text-2xl font-semibold" style={{ color: "#ffffff" }}>
                  {isBrazil ? "Para operações de grande escala" : "For large-scale operations"}
                </h3>
                <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>
                  {isBrazil
                    ? "Sales-led · Contrato personalizado · Onboarding dedicado"
                    : "Sales-led · Custom contract · Dedicated onboarding"}
                </p>
              </div>
              <Link
                href="/contact"
                className="shrink-0 inline-flex items-center justify-center self-start rounded-2xl border px-6 py-3 text-sm font-semibold"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: "#ffffff" }}
              >
                {isBrazil ? "Falar com a equipe →" : "Talk to the team →"}
              </Link>
            </div>

            {/* Enterprise sub-tier cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              {enterpriseTiers.map((tier) => {
                const display = enterpriseTierDisplay[tier.id];
                const cta = getEnterpriseCta(tier.tierType, isBrazil);
                const isInternal = tier.tierType === "internal_commercial";

                return (
                  <div
                    key={tier.id}
                    className="flex flex-col rounded-2xl p-5"
                    style={{
                      border: isInternal
                        ? "1px solid rgba(255,255,255,0.18)"
                        : "1px solid rgba(255,255,255,0.10)",
                      backgroundColor: isInternal
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(255,255,255,0.04)",
                    }}
                  >
                    {/* Tier type badge */}
                    <div
                      className="mb-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]"
                      style={{
                        backgroundColor: isInternal
                          ? "rgba(255,255,255,0.10)"
                          : "rgba(255,255,255,0.06)",
                        color: isInternal
                          ? "rgba(255,255,255,0.70)"
                          : "rgba(255,255,255,0.45)",
                      }}
                    >
                      {isInternal
                        ? isBrazil ? "White-label / Distribuição" : "White-label / Distribution"
                        : "Sales-led"}
                    </div>

                    <div className="text-sm font-semibold" style={{ color: "#ffffff" }}>
                      {isBrazil ? tier.labelPt : tier.labelEn}
                    </div>

                    {/* Price */}
                    <div className="mt-1.5 flex items-baseline gap-1">
                      {tier.showPricePublicly ? (
                        <>
                          <span className="text-xl font-semibold tracking-tight" style={{ color: "#ffffff" }}>
                            {formatPrice(market, tier.logicalKey)}
                          </span>
                          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                            {isBrazil ? "/mês" : "/mo"}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.50)" }}>
                          {isBrazil ? "Consulte" : "Custom pricing"}
                        </span>
                      )}
                    </div>

                    <p
                      className="mt-2 flex-1 text-xs leading-5"
                      style={{ color: "rgba(255,255,255,0.58)" }}
                    >
                      {isBrazil ? tier.descriptionPt : tier.descriptionEn}
                    </p>

                    {/* Features */}
                    {display && (
                      <ul className="mt-3 space-y-1.5">
                        {(isBrazil ? display.featuresPt : display.featuresEn).map((f) => (
                          <li
                            key={f}
                            className="flex items-center gap-2 text-xs"
                            style={{ color: "rgba(255,255,255,0.72)" }}
                          >
                            <span style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Per-tier CTA */}
                    <Link
                      href={cta.href}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl py-2 text-xs font-semibold transition"
                      style={
                        cta.subtle
                          ? { border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.65)" }
                          : { border: "1px solid rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.90)" }
                      }
                    >
                      {cta.label}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="rounded-[40px] border border-black/8 bg-white px-10 py-14 text-center shadow-[0_24px_60px_rgba(0,0,0,0.04)]">
          <h2 className="text-4xl font-semibold tracking-[-0.05em] text-[#111111] sm:text-5xl">
            {isBrazil
              ? "Pronto para organizar seus lançamentos?"
              : "Ready to organize your releases?"}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-8 text-[#5E5A54]">
            {isBrazil
              ? "Crie seu workspace em menos de um minuto. Sem cartão de crédito para começar."
              : "Create your workspace in under a minute. No credit card required to start."}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-[#111111] px-8 py-3.5 text-sm font-semibold"
              style={{ color: "#ffffff" }}
            >
              {isBrazil ? "Criar workspace grátis" : "Create free workspace"}
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-[#F4F1EA] px-8 py-3.5 text-sm font-semibold text-[#111111]"
            >
              {isBrazil ? "Falar com a equipe" : "Talk to the team"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
