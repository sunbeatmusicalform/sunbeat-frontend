import Link from "next/link";
import {
  billingCatalog,
  formatPrice,
  type Market,
} from "@/lib/billing/catalog";

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
  description: string;
  cta: string;
  href: string;
  highlight: boolean;
  features: string[];
  badge: string | null;
  accentColor: string;
  bgColor: string;
}

const plansConfig: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    description: "Para começar a testar o fluxo de lançamento.",
    cta: "Começar grátis",
    href: "/signup",
    highlight: false,
    features: [
      "50 submissões/mês",
      "1 formulário",
      "Upload: áudio 10 MB, capa 5 MB",
      "Rascunho automático",
      "E-mail de resumo",
    ],
    badge: null,
    accentColor: "#6B7280",
    bgColor: "#F9F9F9",
  },
  {
    id: "starter",
    name: "Starter",
    description: "Para labels e managers que precisam de mais controle.",
    cta: "Criar workspace",
    href: "/signup",
    highlight: false,
    features: [
      "500 submissões/mês",
      "2 formulários",
      "Upload: áudio 50 MB, capa 20 MB",
      "Airtable nativo (sync bidirecional)",
      "Field mapping visual",
      "Suporte por e-mail prioritário",
    ],
    badge: "Mais popular",
    accentColor: "#2563EB",
    bgColor: "#EFF6FF",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para operações completas com IA e integrações avançadas.",
    cta: "Criar workspace",
    href: "/signup",
    highlight: true,
    features: [
      "2.000 submissões/mês",
      "5 formulários",
      "Upload: áudio 100 MB, capa 50 MB",
      "IA — Lyric Engine",
      "Google Drive + Sheets nativos",
      "Branding customizado",
      "Suporte chat + e-mail",
    ],
    badge: "Mais recursos",
    accentColor: "#7C3AED",
    bgColor: "#F5F3FF",
  },
];

interface Props {
  market: Market;
}

export default function MarketingHome({ market }: Props) {
  const isBrazil = market === "brazil";
  const marketConfig = billingCatalog[market];

  // Title changes by market: Brazil shows BRL, global shows USD
  const pricingTitle = isBrazil
    ? "Simples. Transparente. BRL."
    : "Simple. Transparent. USD.";

  const pricingSubtitle = isBrazil
    ? "Comece grátis e faça upgrade quando sua operação crescer. Sem surpresas, sem contratos longos."
    : "Start free and upgrade as your operation grows. No surprises, no long-term contracts.";

  // Market indicator pill text
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
            {pricingTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-[#5E5A54]">
            {pricingSubtitle}
          </p>
          {/* Market indicator */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white px-3 py-1 text-[11px] text-[#8D867B]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: isBrazil ? "#16A34A" : "#2563EB" }}
            />
            {marketNote}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {plansConfig.map((plan) => {
            // Price label comes from billingCatalog — never hardcoded
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
                {plan.badge && (
                  <div
                    className="mb-4 inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{
                      backgroundColor: plan.accentColor + "18",
                      color: plan.accentColor,
                    }}
                  >
                    {plan.badge}
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

                <p className="mt-2 text-sm leading-6 text-[#5E5A54]">{plan.description}</p>

                {/* Features */}
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
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
                  {plan.cta} →
                </Link>
              </div>
            );
          })}
        </div>

        {/* Enterprise row */}
        <div className="mt-5 rounded-[28px] border border-black/8 bg-[#111111] px-8 py-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Enterprise
              </div>
              <h3 className="mt-1 text-lg font-semibold" style={{ color: "#ffffff" }}>
                {isBrazil
                  ? "Operação ilimitada com SLA dedicado"
                  : "Unlimited operation with dedicated SLA"}
              </h3>
              <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                {isBrazil
                  ? "Submissões ilimitadas · White label · Notion nativo · Onboarding dedicado · Contrato personalizado"
                  : "Unlimited submissions · White label · Native Notion · Dedicated onboarding · Custom contract"}
              </p>
            </div>
            <Link
              href="/contact"
              className="shrink-0 inline-flex items-center justify-center rounded-2xl border px-6 py-3 text-sm font-semibold transition"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "#ffffff" }}
            >
              {isBrazil ? "Falar com a equipe →" : "Talk to the team →"}
            </Link>
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
