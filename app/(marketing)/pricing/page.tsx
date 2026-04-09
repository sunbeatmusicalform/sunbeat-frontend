/**
 * /pricing
 *
 * Public pricing page — market-aware via hostname.
 *
 * Source of truth:  lib/billing/catalog.ts
 * Market resolution: hostname → resolveMarket() → billingCatalog[market]
 *
 * sunbeat.pro      → market "global" → USD prices, English copy
 * sunbeat.com.br   → market "brazil" → BRL prices, Portuguese copy
 *
 * This page is a DISPLAY LAYER only.
 * It does not define prices or plan keys — those live in billingCatalog.
 * Adding a new plan or changing a price requires only catalog.ts changes.
 */

import { headers } from "next/headers";
import Link from "next/link";
import {
  billingCatalog,
  planDefinitions,
  enterpriseTiers,
  resolveMarket,
  formatPrice,
  type Market,
  type BillingTier,
  type BillingTierType,
} from "@/lib/billing/catalog";

// ---------------------------------------------------------------------------
// generateMetadata — market-specific page title
// ---------------------------------------------------------------------------
export async function generateMetadata() {
  const host = (await headers()).get("host") ?? "";
  const market = resolveMarket(host);
  return {
    title: market === "brazil" ? "Planos — Sunbeat" : "Pricing — Sunbeat",
  };
}

// ---------------------------------------------------------------------------
// Per-plan display data (features + copy) — two languages, no prices
// Prices always come from billingCatalog[market].displayPrices
// ---------------------------------------------------------------------------
interface PlanDisplay {
  id: BillingTier;
  accentColor: string;
  bgColor: string;
  highlight: boolean;
  badgePt: string | null;
  badgeEn: string | null;
  descriptionPt: string;
  descriptionEn: string;
  featuresPt: string[];
  featuresEn: string[];
  ctaPt: string;
  ctaEn: string;
  href: string;
}

// Only self-serve plans have display entries here; enterprise tiers are
// rendered separately via the enterpriseTiers array from the catalog.
const planDisplay: Partial<Record<BillingTier, PlanDisplay>> = {
  free: {
    id: "free",
    accentColor: "#6B7280",
    bgColor: "#F9F9F9",
    highlight: false,
    badgePt: null,
    badgeEn: null,
    descriptionPt: "Para começar a testar o fluxo de lançamento sem compromisso.",
    descriptionEn: "Start testing your release workflow with no commitment.",
    featuresPt: [
      "50 submissões/mês",
      "1 formulário de intake",
      "Upload: áudio 10 MB, capa 5 MB",
      "Rascunho automático",
      "E-mail de resumo por submissão",
    ],
    featuresEn: [
      "50 submissions/mo",
      "1 intake form",
      "Upload: audio 10 MB, cover 5 MB",
      "Auto-draft on submission",
      "Summary email per submission",
    ],
    ctaPt: "Começar grátis",
    ctaEn: "Start for free",
    href: "/signup",
  },
  starter: {
    id: "starter",
    accentColor: "#2563EB",
    bgColor: "#EFF6FF",
    highlight: false,
    badgePt: "Mais popular",
    badgeEn: "Most popular",
    descriptionPt: "Para labels e managers com operação regular de lançamentos.",
    descriptionEn: "For labels and managers with a steady release operation.",
    featuresPt: [
      "500 submissões/mês",
      "2 formulários",
      "Upload: áudio 50 MB, capa 20 MB",
      "Airtable nativo (sync bidirecional)",
      "Field mapping visual",
      "Dashboard de edição de campos",
      "Suporte por e-mail prioritário",
    ],
    featuresEn: [
      "500 submissions/mo",
      "2 forms",
      "Upload: audio 50 MB, cover 20 MB",
      "Native Airtable (2-way sync)",
      "Visual field mapping",
      "Field editor dashboard",
      "Priority email support",
    ],
    ctaPt: "Criar workspace",
    ctaEn: "Create workspace",
    href: "/signup",
  },
  pro: {
    id: "pro",
    accentColor: "#7C3AED",
    bgColor: "#F5F3FF",
    highlight: true,
    badgePt: "Mais recursos",
    badgeEn: "Most powerful",
    descriptionPt: "Para operações completas com IA, integrações avançadas e branding.",
    descriptionEn: "For full operations with AI, advanced integrations, and branding.",
    featuresPt: [
      "2.000 submissões/mês",
      "5 formulários",
      "Upload: áudio 100 MB, capa 50 MB",
      "IA — Lyric Engine",
      "Google Drive nativo",
      "Google Sheets nativo",
      "Branding customizado",
      "Suporte chat + e-mail",
    ],
    featuresEn: [
      "2,000 submissions/mo",
      "5 forms",
      "Upload: audio 100 MB, cover 50 MB",
      "AI — Lyric Engine",
      "Native Google Drive",
      "Native Google Sheets",
      "Custom branding",
      "Chat + email support",
    ],
    ctaPt: "Criar workspace",
    ctaEn: "Create workspace",
    href: "/signup",
  },
  // Enterprise is handled separately via the dark section + enterpriseTiers
  enterprise: {
    id: "enterprise",
    accentColor: "#111111",
    bgColor: "#111111",
    highlight: false,
    badgePt: null,
    badgeEn: null,
    descriptionPt: "",
    descriptionEn: "",
    featuresPt: [],
    featuresEn: [],
    ctaPt: "Falar com a equipe",
    ctaEn: "Talk to sales",
    href: "/contact",
  },
};

// Features per enterprise tier — display only, no billing keys
interface EnterpriseTierDisplay {
  id: string;
  featuresPt: string[];
  featuresEn: string[];
}

const enterpriseTierDisplay: Record<string, EnterpriseTierDisplay> = {
  enterprise_core: {
    id: "enterprise_core",
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
    id: "enterprise_ops",
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
    id: "enterprise_distribution",
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

// CTA labels per tierType
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

// FAQ data — market-aware
function getFaqs(isBrazil: boolean) {
  if (isBrazil) {
    return [
      {
        q: "Preciso de cartão de crédito para começar?",
        a: "Não. O plano Free não exige pagamento. Você só precisa de um cartão ao fazer upgrade para Starter ou Pro.",
      },
      {
        q: "Posso mudar de plano depois?",
        a: "Sim. Você pode fazer upgrade a qualquer momento pelo dashboard. O cancelamento também é imediato pelo portal de assinatura.",
      },
      {
        q: "Os preços são em BRL?",
        a: "Sim. sunbeat.com.br opera em BRL. Para o mercado global, acesse sunbeat.pro com preços em USD.",
      },
      {
        q: "Como funciona o Enterprise?",
        a: "Os tiers Enterprise são configurados via contrato com a equipe Sunbeat. Entre em contato para discutir sua operação.",
      },
    ];
  }
  return [
    {
      q: "Do I need a credit card to start?",
      a: "No. The Free plan requires no payment. You only need a card when upgrading to Starter or Pro.",
    },
    {
      q: "Can I change plans later?",
      a: "Yes. You can upgrade at any time from the dashboard. Cancellation is also instant via the subscription portal.",
    },
    {
      q: "Are prices in USD?",
      a: "Yes. sunbeat.pro operates in USD. For the Brazilian market, visit sunbeat.com.br with BRL pricing.",
    },
    {
      q: "How does Enterprise work?",
      a: "Enterprise tiers are set up via contract with the Sunbeat team. Contact us to discuss your operation.",
    },
  ];
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function PricingPage() {
  const host = (await headers()).get("host") ?? "";
  const market: Market = resolveMarket(host);
  const marketConfig = billingCatalog[market];
  const isBrazil = market === "brazil";

  // Self-serve plans visible on public pricing, ordered: free → starter → pro
  const selfServePlans: BillingTier[] = (["free", "starter", "pro"] as BillingTier[]).filter(
    (id) => planDefinitions[id].visibleOnPublicPricing
  );

  const faqs = getFaqs(isBrazil);

  // UI strings
  const ui = {
    headerSubtitle: isBrazil ? "Planos e preços" : "Pricing",
    login: isBrazil ? "Entrar" : "Log in",
    signup: isBrazil ? "Criar conta" : "Get started",
    heroTitle: isBrazil ? "Simples. Transparente." : "Simple. Transparent.",
    heroSub: isBrazil
      ? `Comece grátis, faça upgrade quando precisar. Preços em ${marketConfig.currency} para o mercado ${isBrazil ? "brasileiro" : "global"}.`
      : `Start free, upgrade when you need it. Prices in ${marketConfig.currency} for the global market.`,
    perMonth: isBrazil ? "/mês" : "/mo",
    enterpriseTag: isBrazil ? "Enterprise" : "Enterprise",
    enterpriseTitle: isBrazil ? "Para operações de grande escala" : "For large-scale operations",
    enterpriseSub: isBrazil
      ? "Sales-led · Contrato personalizado · Onboarding dedicado"
      : "Sales-led · Custom contract · Dedicated onboarding",
    enterpriseCta: isBrazil ? "Falar com a equipe →" : "Talk to the team →",
    faqTitle: isBrazil ? "Perguntas frequentes" : "Frequently asked questions",
    bottomTitle: isBrazil ? "Comece agora, sem cartão." : "Start now, no card required.",
    bottomSub: isBrazil
      ? "Crie seu workspace em menos de um minuto e veja como a Sunbeat transforma a sua operação."
      : "Create your workspace in under a minute and see how Sunbeat transforms your operation.",
    bottomCta1: isBrazil ? "Criar workspace grátis" : "Create free workspace",
    bottomCta2: isBrazil ? "Falar com a equipe" : "Talk to the team",
    marketNote: isBrazil
      ? `Preços em BRL · ${marketConfig.domain}`
      : `Prices in USD · ${marketConfig.domain}`,
    internalCommercialTag: isBrazil ? "White-label / Distribuição" : "White-label / Distribution",
    salesLedTag: isBrazil ? "Sales-led" : "Sales-led",
  };

  return (
    <main className="min-h-screen bg-[#F4F1EA] text-[#111111]">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
            <img src="/sunbeat-logan-transparent-black.ico" alt="Sunbeat" className="h-7 w-7 object-contain" />
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[#111111]">Sunbeat</div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#6A6660]">{ui.headerSubtitle}</div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111111] sm:inline-flex"
          >
            {ui.login}
          </Link>
          <Link
            href="/signup"
            className="inline-flex rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold"
            style={{ color: "#ffffff" }}
          >
            {ui.signup}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pb-20 pt-4 lg:px-8">

        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-semibold tracking-[-0.06em] text-[#111111] sm:text-6xl">
            {ui.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-[#5E5A54]">
            {ui.heroSub}
          </p>
          {/* Market indicator */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white px-3 py-1 text-[11px] text-[#8D867B]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: isBrazil ? "#16A34A" : "#2563EB" }}
            />
            {ui.marketNote}
          </div>
        </div>

        {/* Self-serve plan cards */}
        <div className="grid gap-5 sm:grid-cols-3">
          {selfServePlans.map((planId) => {
            const def = planDefinitions[planId];
            const display = planDisplay[planId];
            if (!display) return null; // enterprise tiers are not self-serve
            const priceLabel = formatPrice(market, planId);
            const price = marketConfig.displayPrices[planId];

            return (
              <div
                key={planId}
                className="relative flex flex-col rounded-[32px] border p-8"
                style={{
                  borderColor: display.highlight
                    ? display.accentColor + "50"
                    : "rgba(0,0,0,0.08)",
                  backgroundColor: display.highlight ? display.bgColor : "#FFFFFF",
                  boxShadow: display.highlight
                    ? `0 0 0 2px ${display.accentColor}22, 0 24px 56px rgba(0,0,0,0.07)`
                    : "0 14px 34px rgba(0,0,0,0.04)",
                }}
              >
                {/* Badge (e.g. "Most popular") */}
                {(isBrazil ? display.badgePt : display.badgeEn) && (
                  <div
                    className="mb-4 inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{
                      backgroundColor: display.accentColor + "18",
                      color: display.accentColor,
                    }}
                  >
                    {isBrazil ? display.badgePt : display.badgeEn}
                  </div>
                )}

                {/* Plan name pill */}
                <div
                  className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] w-fit"
                  style={{
                    backgroundColor: display.accentColor + "14",
                    color: display.accentColor,
                  }}
                >
                  {isBrazil ? def.labelPt : def.labelEn}
                </div>

                {/* Price — from billingCatalog[market].displayPrices */}
                <div className="mt-5">
                  <span className="text-4xl font-semibold tracking-tight text-[#111111]">
                    {priceLabel}
                  </span>
                  {price > 0 && (
                    <span className="ml-1 text-sm text-[#7A746A]">{ui.perMonth}</span>
                  )}
                </div>

                {/* Description */}
                <p className="mt-2 text-sm leading-6 text-[#5E5A54]">
                  {isBrazil ? display.descriptionPt : display.descriptionEn}
                </p>

                {/* Features */}
                <ul className="mt-6 flex-1 space-y-3">
                  {(isBrazil ? display.featuresPt : display.featuresEn).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#393733]">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ color: display.accentColor }}
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
                  href={display.href}
                  className="mt-8 inline-flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-semibold transition"
                  style={
                    display.highlight
                      ? { backgroundColor: display.accentColor, color: "#ffffff" }
                      : { border: `1.5px solid ${display.accentColor}40`, color: display.accentColor }
                  }
                >
                  {isBrazil ? display.ctaPt : display.ctaEn} →
                </Link>

                {/* tierType indicator — subtle, for transparency */}
                {def.tierType === "self_serve" && (
                  <p className="mt-3 text-center text-[10px] text-[#B5B0A8]">
                    {isBrazil ? "Compra online · sem vendedor" : "Buy online · no sales call"}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Enterprise section */}
        <div className="mt-10">
          <div className="rounded-[32px] border border-black/8 bg-[#111111] p-8">
            {/* Enterprise header */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  {ui.enterpriseTag}
                </div>
                <h2 className="mt-1 text-2xl font-semibold" style={{ color: "#ffffff" }}>
                  {ui.enterpriseTitle}
                </h2>
                <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>
                  {ui.enterpriseSub}
                </p>
              </div>
              <Link
                href="/contact"
                className="shrink-0 inline-flex items-center justify-center self-start rounded-2xl border px-6 py-3 text-sm font-semibold"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: "#ffffff" }}
              >
                {ui.enterpriseCta}
              </Link>
            </div>

            {/* Enterprise sub-tier cards — sourced from enterpriseTiers in catalog */}
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
                    <div className="mb-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]"
                      style={{
                        backgroundColor: isInternal
                          ? "rgba(255,255,255,0.10)"
                          : "rgba(255,255,255,0.06)",
                        color: isInternal
                          ? "rgba(255,255,255,0.70)"
                          : "rgba(255,255,255,0.45)",
                      }}
                    >
                      {isInternal ? ui.internalCommercialTag : ui.salesLedTag}
                    </div>

                    <div className="text-sm font-semibold" style={{ color: "#ffffff" }}>
                      {isBrazil ? tier.labelPt : tier.labelEn}
                    </div>

                    {/* Price — from billingCatalog[market].displayPrices via formatPrice */}
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
                          ? {
                              border: "1px solid rgba(255,255,255,0.14)",
                              color: "rgba(255,255,255,0.65)",
                            }
                          : {
                              border: "1px solid rgba(255,255,255,0.22)",
                              color: "rgba(255,255,255,0.90)",
                            }
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

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="mb-8 text-center text-3xl font-semibold tracking-[-0.04em] text-[#111111]">
            {ui.faqTitle}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="rounded-[24px] border border-black/8 bg-white p-7 shadow-[0_10px_28px_rgba(0,0,0,0.03)]"
              >
                <h3 className="text-sm font-semibold text-[#111111]">{item.q}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5E5A54]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-[40px] border border-black/8 bg-white px-10 py-14 text-center shadow-[0_24px_60px_rgba(0,0,0,0.04)]">
          <h2 className="text-4xl font-semibold tracking-[-0.05em] text-[#111111]">
            {ui.bottomTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-[#5E5A54]">
            {ui.bottomSub}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-[#111111] px-8 py-3.5 text-sm font-semibold"
              style={{ color: "#ffffff" }}
            >
              {ui.bottomCta1}
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-[#F4F1EA] px-8 py-3.5 text-sm font-semibold text-[#111111]"
            >
              {ui.bottomCta2}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
