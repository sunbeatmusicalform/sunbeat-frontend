import { headers } from "next/headers";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantFromHost } from "@/lib/tenant";
import { billingCatalog, resolveMarket, formatPrice, isSelfServePlan, planDefinitions, type Market, type BillingTier } from "@/lib/billing/catalog";
import { UpgradeButton, ManageSubscriptionButton } from "./BillingButtons";

type PlanRow = {
  id: string;
  name: string;
  submissions_month: number | null;
  max_forms: number | null;
  audio_upload_mb: number | null;
  cover_upload_mb: number | null;
  ai_enabled: boolean;
  airtable_enabled: boolean;
  gdrive_enabled: boolean;
  gsheets_enabled: boolean;
  notion_enabled: boolean;
  custom_branding: boolean;
  white_label: boolean;
  support_level: string | null;
};

export const metadata = { title: "Plano — Sunbeat" };

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ plan_intent?: string }>;
}) {
  const host = (await headers()).get("host") ?? "";
  const { plan_intent: rawPlanIntent } = await searchParams;

  // Resolve workspace slug from subdomain
  const tenantRaw = getTenantFromHost(host);
  const workspaceSlug: string =
    (typeof tenantRaw === "string" ? tenantRaw : tenantRaw?.value) ?? "atabaque";

  // Resolve market (USD vs BRL) from hostname
  const market: Market = resolveMarket(host);
  const marketConfig = billingCatalog[market];
  const isBrazil = market === "brazil";

  // plan_intent: passed from signup when user selected a plan before creating workspace.
  // Kept separate from plan_id — it's a funnel signal, not a billing state.
  // Only valid for self-serve tiers (starter, pro). Never enterprise or free.
  const planIntent =
    rawPlanIntent && isSelfServePlan(rawPlanIntent as BillingTier)
      ? (rawPlanIntent as BillingTier)
      : null;

  let currentPlanId: BillingTier = "free";
  let currentPlanName = "Free";
  let hasSubscription = false;
  let plans: PlanRow[] = [];

  try {
    const admin = createSupabaseAdmin();

    const { data: ws } = await admin
      .from("workspaces")
      .select("plan_id, stripe_customer_id")
      .eq("slug", workspaceSlug)
      .maybeSingle();

    if (ws) {
      currentPlanId = ws.plan_id as BillingTier;
      hasSubscription = !!ws.stripe_customer_id;
    }

    const { data: planRows } = await admin
      .from("plans")
      .select(
        "id, name, submissions_month, max_forms, audio_upload_mb, cover_upload_mb, ai_enabled, airtable_enabled, gdrive_enabled, gsheets_enabled, notion_enabled, custom_branding, white_label, support_level"
      )
      .order("price_monthly", { ascending: true });

    if (planRows) plans = planRows as PlanRow[];

    const current = plans.find((p) => p.id === currentPlanId);
    if (current) {
      currentPlanName = current.name;
    } else {
      // Fallback for enterprise sub-tiers not in the DB plans table
      const def = planDefinitions[currentPlanId];
      if (def) currentPlanName = isBrazil ? def.labelPt : def.labelEn;
    }
  } catch {
    // graceful fallback
  }

  const planColors: Record<string, { bg: string; text: string; badge: string }> = {
    free:                    { bg: "#F3F4F6", text: "#374151",  badge: "#6B7280" },
    starter:                 { bg: "#EFF6FF", text: "#1D4ED8",  badge: "#2563EB" },
    pro:                     { bg: "#F5F3FF", text: "#6D28D9",  badge: "#7C3AED" },
    enterprise:              { bg: "#111111", text: "#FFFFFF",  badge: "#111111" },
    enterprise_core:         { bg: "#111111", text: "#FFFFFF",  badge: "#111111" },
    enterprise_ops:          { bg: "#111111", text: "#FFFFFF",  badge: "#111111" },
    enterprise_distribution: { bg: "#0A0A0A", text: "#FFFFFF",  badge: "#333333" },
  };

  /**
   * Tier ordering for upgrade/downgrade detection.
   * Higher number = higher tier.
   */
  const TIER_ORDER: Partial<Record<BillingTier, number>> = {
    free: 0,
    starter: 1,
    pro: 2,
    enterprise: 3,         // legacy alias — same level as enterprise_core
    enterprise_core: 3,
    enterprise_ops: 4,
    enterprise_distribution: 5,
  };

  function fmt(n: number | null) {
    if (n === null || n === 0) return isBrazil ? "Ilimitado" : "Unlimited";
    return n.toLocaleString(marketConfig.locale);
  }

  function fmtMB(n: number | null) {
    if (!n) return "—";
    return `${n} MB`;
  }

  // Hardcoded fallback if DB is empty
  if (plans.length === 0) {
    plans = [
      { id: "free",       name: "Free",       submissions_month: 50,   max_forms: 1,    audio_upload_mb: 10,  cover_upload_mb: 5,   ai_enabled: false, airtable_enabled: false, gdrive_enabled: false, gsheets_enabled: false, notion_enabled: false, custom_branding: false, white_label: false, support_level: "Email" },
      { id: "starter",    name: "Starter",    submissions_month: 500,  max_forms: 2,    audio_upload_mb: 50,  cover_upload_mb: 20,  ai_enabled: false, airtable_enabled: true,  gdrive_enabled: false, gsheets_enabled: false, notion_enabled: false, custom_branding: false, white_label: false, support_level: isBrazil ? "E-mail prioritário" : "Priority email" },
      { id: "pro",        name: "Pro",        submissions_month: 2000, max_forms: 5,    audio_upload_mb: 100, cover_upload_mb: 50,  ai_enabled: true,  airtable_enabled: true,  gdrive_enabled: true,  gsheets_enabled: true,  notion_enabled: false, custom_branding: true,  white_label: false, support_level: isBrazil ? "Chat + E-mail" : "Chat + Email" },
      { id: "enterprise", name: "Enterprise", submissions_month: null, max_forms: null, audio_upload_mb: 200, cover_upload_mb: 100, ai_enabled: true,  airtable_enabled: true,  gdrive_enabled: true,  gsheets_enabled: true,  notion_enabled: true,  custom_branding: true,  white_label: true,  support_level: isBrazil ? "SLA dedicado" : "Dedicated SLA" },
    ];
  }

  const features = [
    { key: "submissions_month" as const, label: isBrazil ? "Submissões/mês" : "Submissions/mo", render: (p: PlanRow) => fmt(p.submissions_month) },
    { key: "max_forms" as const, label: isBrazil ? "Formulários" : "Forms", render: (p: PlanRow) => fmt(p.max_forms) },
    { key: "audio_upload_mb" as const, label: isBrazil ? "Upload de áudio" : "Audio upload", render: (p: PlanRow) => fmtMB(p.audio_upload_mb) },
    { key: "cover_upload_mb" as const, label: isBrazil ? "Upload de capa" : "Cover upload", render: (p: PlanRow) => fmtMB(p.cover_upload_mb) },
    { key: "ai_enabled" as const, label: "AI — Lyric Engine", render: (p: PlanRow) => p.ai_enabled ? "✓" : "—" },
    { key: "airtable_enabled" as const, label: "Airtable", render: (p: PlanRow) => p.airtable_enabled ? "✓" : "—" },
    { key: "gdrive_enabled" as const, label: "Google Drive", render: (p: PlanRow) => p.gdrive_enabled ? "✓" : "—" },
    { key: "gsheets_enabled" as const, label: "Google Sheets", render: (p: PlanRow) => p.gsheets_enabled ? "✓" : "—" },
    { key: "notion_enabled" as const, label: "Notion", render: (p: PlanRow) => p.notion_enabled ? "✓" : "—" },
    { key: "custom_branding" as const, label: isBrazil ? "Branding customizado" : "Custom branding", render: (p: PlanRow) => p.custom_branding ? "✓" : "—" },
    { key: "white_label" as const, label: "White label", render: (p: PlanRow) => p.white_label ? "✓" : "—" },
    { key: "support_level" as const, label: isBrazil ? "Suporte" : "Support", render: (p: PlanRow) => p.support_level ?? "Email" },
  ];

  const colors = planColors[currentPlanId] ?? planColors.pro;

  // Plans eligible for self-serve upgrade — derived from catalog, not hardcoded
  // isSelfServePlan returns true for starter + pro; excludes free and all enterprise tiers

  // Labels
  const labels = {
    currentPlan: isBrazil ? "Plano atual" : "Current plan",
    yourPlan: isBrazil ? "Seu plano Sunbeat" : "Your Sunbeat plan",
    subtitle: isBrazil
      ? "Veja os recursos do seu plano atual e compare as opções disponíveis. Upgrade é imediato via checkout. Para reduzir o plano, use o portal de assinatura."
      : "Review your current plan features and compare available options. Upgrades are immediate via checkout. To downgrade, use the subscription portal.",
    fullComparison: isBrazil ? "Comparação completa" : "Full comparison",
    feature: isBrazil ? "Recurso" : "Feature",
    current: isBrazil ? "atual" : "current",
    upgradeBtn: (name: string) => isBrazil ? `Fazer upgrade para ${name}` : `Upgrade to ${name}`,
    contactUs: isBrazil ? "Falar com a equipe" : "Contact us",
    manageTitle: isBrazil ? "Gerenciar assinatura" : "Manage your subscription",
    manageDesc: isBrazil
      ? "Atualize sua forma de pagamento, veja faturas ou cancele seu plano pelo portal do Stripe."
      : "Update payment method, view invoices, or cancel your plan via the Stripe portal.",
    needDifferent: isBrazil ? "Precisa de outro plano?" : "Need a different plan?",
    needDifferentDesc: isBrazil
      ? "Entre em contato com a equipe Sunbeat e encontraremos o plano certo para sua operação."
      : "Contact the Sunbeat team and we'll set up the right plan for your operation.",
    talkToSunbeat: isBrazil ? "Falar com a Sunbeat" : "Talk to Sunbeat",
    manageBtn: isBrazil ? "Gerenciar assinatura" : "Manage subscription",
    backToDashboard: isBrazil ? "← Voltar ao dashboard" : "← Back to dashboard",
  };

  return (
    <main className="min-h-screen bg-[#F4F1EA] text-[#111111]">
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">

        {/* Header */}
        <div className="mb-10">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ backgroundColor: colors.bg, color: colors.badge }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.badge }} />
            {labels.currentPlan}: {currentPlanName}
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#111111]">
            {labels.yourPlan}
          </h1>
          <p className="mt-2 text-sm leading-7 text-[#5F5A53]">
            {labels.subtitle}
          </p>
        </div>

        {/* Plan intent banner — shown when arriving from pricing → signup funnel */}
        {planIntent && (
          <div className="mb-8 flex items-start gap-4 rounded-[20px] border border-black/8 bg-white px-6 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111111]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#ffffff" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111]">
                {isBrazil
                  ? `Workspace criado! Ativando plano ${planIntent === "starter" ? "Starter" : "Pro"}…`
                  : `Workspace created! Activating ${planIntent === "starter" ? "Starter" : "Pro"} plan…`}
              </p>
              <p className="mt-0.5 text-[13px] text-[#5F5A53]">
                {isBrazil
                  ? "Você está sendo redirecionado ao checkout do Stripe para concluir sua assinatura."
                  : "You're being redirected to Stripe checkout to complete your subscription."}
              </p>
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isIntent = planIntent === plan.id;
            const pc = planColors[plan.id] ?? planColors.pro;
            const currentTierLevel = TIER_ORDER[currentPlanId] ?? 0;
            const thisTierLevel = TIER_ORDER[plan.id as BillingTier] ?? 0;
            const isUpgrade = thisTierLevel > currentTierLevel;
            const isDowngrade = isSelfServePlan(plan.id as BillingTier) && !isCurrent && !isUpgrade;
            const canUpgrade = isSelfServePlan(plan.id as BillingTier) && !isCurrent && isUpgrade;
            const priceLabel = formatPrice(market, plan.id as BillingTier);

            return (
              <div
                key={plan.id}
                className="rounded-[28px] border p-6 transition"
                style={{
                  borderColor: isIntent ? pc.badge : isCurrent ? pc.badge : "rgba(0,0,0,0.08)",
                  backgroundColor: isIntent ? pc.bg : isCurrent ? pc.bg : "#FFFFFF",
                  boxShadow: isIntent
                    ? `0 0 0 3px ${pc.badge}33, 0 14px 34px rgba(0,0,0,0.08)`
                    : isCurrent
                    ? `0 0 0 2px ${pc.badge}22`
                    : "0 14px 34px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{ backgroundColor: `${pc.badge}18`, color: pc.badge }}
                  >
                    {plan.name}
                  </div>
                  {isCurrent && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em]"
                      style={{ backgroundColor: pc.badge, color: "#fff" }}
                    >
                      {labels.current}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <span className="text-2xl font-semibold tracking-tight text-[#111111]">
                    {priceLabel}
                  </span>
                  {marketConfig.displayPrices[plan.id as BillingTier] > 0 && (
                    <span className="ml-1 text-xs text-[#7A746A]">/mês</span>
                  )}
                </div>

                <ul className="mt-4 space-y-2 text-[13px] text-[#5F5A53]">
                  <li><span className="font-medium text-[#111111]">{fmt(plan.submissions_month)}</span> {isBrazil ? "submissões/mês" : "submissions/mo"}</li>
                  <li><span className="font-medium text-[#111111]">{fmt(plan.max_forms)}</span> {isBrazil ? "formulários" : "forms"}</li>
                  <li>{isBrazil ? "Áudio até" : "Audio up to"} <span className="font-medium text-[#111111]">{fmtMB(plan.audio_upload_mb)}</span></li>
                  {plan.ai_enabled && <li className="font-medium" style={{ color: "#7C3AED" }}>✓ AI — Lyric Engine</li>}
                  {plan.airtable_enabled && <li className="font-medium">✓ Airtable</li>}
                  {plan.notion_enabled && <li className="font-medium">✓ Notion</li>}
                  {plan.white_label && <li className="font-medium">✓ White label</li>}
                </ul>

                {/* Upgrade button */}
                {canUpgrade && (() => {
                  const isIntent = planIntent === plan.id;
                  return (
                    <UpgradeButton
                      planId={plan.id}
                      workspaceSlug={workspaceSlug}
                      market={market}
                      autoCheckout={isIntent}
                      className="mt-5 w-full rounded-2xl py-2 text-sm font-semibold transition disabled:opacity-60"
                      style={{ backgroundColor: pc.badge, color: "#ffffff" }}
                    >
                      {isIntent
                        ? (isBrazil ? `Ativar plano ${plan.name}` : `Activate ${plan.name} plan`)
                        : labels.upgradeBtn(plan.name)}
                    </UpgradeButton>
                  );
                })()}

                {/* Downgrade — redirect to portal, not checkout */}
                {isDowngrade && hasSubscription && (
                  <ManageSubscriptionButton
                    workspaceSlug={workspaceSlug}
                    className="mt-5 w-full rounded-2xl border border-black/10 py-2 text-sm font-medium text-[#5F5A53] transition hover:bg-[#F8F5EF]"
                  >
                    {isBrazil ? `Reduzir para ${plan.name} (via portal)` : `Downgrade to ${plan.name} (via portal)`}
                  </ManageSubscriptionButton>
                )}
                {isDowngrade && !hasSubscription && null}

                {/* Enterprise contact */}
                {plan.id === "enterprise" && !isCurrent && (
                  <Link
                    href={isBrazil ? "https://sunbeat.com.br/contato" : "/contact"}
                    className="mt-5 block w-full rounded-2xl py-2 text-center text-sm font-semibold"
                    style={{ backgroundColor: "#111111", color: "#ffffff" }}
                  >
                    {labels.contactUs}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <div className="mt-12">
          <h2 className="mb-6 text-lg font-semibold tracking-[-0.03em] text-[#111111]">
            {labels.fullComparison}
          </h2>
          <div className="overflow-x-auto rounded-[28px] border border-black/8 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/6">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#8D867B]">
                    {labels.feature}
                  </th>
                  {plans.map((plan) => {
                    const isCurrent = plan.id === currentPlanId;
                    const pc = planColors[plan.id] ?? planColors.pro;
                    return (
                      <th
                        key={plan.id}
                        className="px-4 py-4 text-center text-xs font-bold uppercase tracking-[0.14em]"
                        style={{ color: isCurrent ? pc.badge : "#8D867B" }}
                      >
                        {plan.name}
                        {isCurrent && (
                          <span
                            className="ml-1.5 rounded-full px-1.5 py-0.5 text-[9px]"
                            style={{ backgroundColor: `${pc.badge}18`, color: pc.badge }}
                          >
                            {labels.current}
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, fi) => (
                  <tr
                    key={feature.key}
                    className={fi % 2 === 0 ? "bg-white" : "bg-[#FAFAF8]"}
                  >
                    <td className="px-6 py-3.5 text-[#5F5A53]">{feature.label}</td>
                    {plans.map((plan) => {
                      const isCurrent = plan.id === currentPlanId;
                      const pc = planColors[plan.id] ?? planColors.pro;
                      const val = feature.render(plan);
                      const isDash = val === "—";
                      return (
                        <td
                          key={plan.id}
                          className="px-4 py-3.5 text-center font-medium"
                          style={{
                            color: isDash
                              ? "#D1CEC9"
                              : isCurrent ? pc.badge : "#111111",
                          }}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-[28px] border border-black/8 bg-white p-7">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {hasSubscription ? (
                <>
                  <h3 className="font-semibold text-[#111111]">{labels.manageTitle}</h3>
                  <p className="mt-1 text-sm text-[#5F5A53]">{labels.manageDesc}</p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-[#111111]">{labels.needDifferent}</h3>
                  <p className="mt-1 text-sm text-[#5F5A53]">{labels.needDifferentDesc}</p>
                </>
              )}
            </div>
            {hasSubscription ? (
              <ManageSubscriptionButton
                workspaceSlug={workspaceSlug}
                className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: "#111111", color: "#ffffff" }}
              >
                {labels.manageBtn}
              </ManageSubscriptionButton>
            ) : (
              <Link
                href={isBrazil ? "https://sunbeat.com.br/contato" : "/contact"}
                className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold"
                style={{ backgroundColor: "#111111", color: "#ffffff" }}
              >
                {labels.talkToSunbeat}
              </Link>
            )}
          </div>
        </div>

        {/* Market indicator (subtle) */}
        <div className="mt-4 text-right">
          <span className="text-[11px] text-[#9A9590]">
            {isBrazil
              ? `Preços em BRL · sunbeat.com.br`
              : `Prices in USD · sunbeat.pro`}
          </span>
        </div>

        {/* Back */}
        <div className="mt-4">
          <Link
            href="/app"
            className="text-sm font-medium text-[#6E685E] underline underline-offset-2"
          >
            {labels.backToDashboard}
          </Link>
        </div>
      </div>
    </main>
  );
}
