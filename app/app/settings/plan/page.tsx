import { headers } from "next/headers";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getTenantFromHost } from "@/lib/tenant";
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

// USD prices per plan — source of truth for display
const USD_PRICES: Record<string, number> = {
  free: 0,
  starter: 19,
  pro: 49,
  enterprise: 0,
};

export const metadata = { title: "Plano — Sunbeat" };

export default async function PlanPage() {
  const host = (await headers()).get("host") ?? "";
  const workspaceSlug = getTenantFromHost(host) ?? "atabaque";

  let currentPlanId = "pro";
  let currentPlanName = "Pro";
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
      currentPlanId = ws.plan_id;
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
    if (current) currentPlanName = current.name;
  } catch {
    // graceful fallback
  }

  const planColors: Record<string, { bg: string; text: string; badge: string }> = {
    free:       { bg: "#F3F4F6", text: "#374151", badge: "#6B7280" },
    starter:    { bg: "#EFF6FF", text: "#1D4ED8", badge: "#2563EB" },
    pro:        { bg: "#F5F3FF", text: "#6D28D9", badge: "#7C3AED" },
    enterprise: { bg: "#111111", text: "#FFFFFF", badge: "#111111" },
  };

  function fmt(n: number | null) {
    if (n === null || n === 0) return "Unlimited";
    return n.toLocaleString("en-US");
  }

  function fmtMB(n: number | null) {
    if (!n) return "—";
    return `${n} MB`;
  }

  function fmtPrice(id: string) {
    const price = USD_PRICES[id] ?? 0;
    if (id === "enterprise") return "Custom";
    if (price === 0) return "Free";
    return `$${price}/mo`;
  }

  const features = [
    { key: "submissions_month" as const, label: "Submissions/mo", render: (p: PlanRow) => fmt(p.submissions_month) },
    { key: "max_forms" as const, label: "Forms", render: (p: PlanRow) => fmt(p.max_forms) },
    { key: "audio_upload_mb" as const, label: "Audio upload", render: (p: PlanRow) => fmtMB(p.audio_upload_mb) },
    { key: "cover_upload_mb" as const, label: "Cover upload", render: (p: PlanRow) => fmtMB(p.cover_upload_mb) },
    { key: "ai_enabled" as const, label: "AI (Lyric Engine)", render: (p: PlanRow) => p.ai_enabled ? "✓" : "—" },
    { key: "airtable_enabled" as const, label: "Native Airtable", render: (p: PlanRow) => p.airtable_enabled ? "✓" : "—" },
    { key: "gdrive_enabled" as const, label: "Google Drive", render: (p: PlanRow) => p.gdrive_enabled ? "✓" : "—" },
    { key: "gsheets_enabled" as const, label: "Google Sheets", render: (p: PlanRow) => p.gsheets_enabled ? "✓" : "—" },
    { key: "notion_enabled" as const, label: "Notion", render: (p: PlanRow) => p.notion_enabled ? "✓" : "—" },
    { key: "custom_branding" as const, label: "Custom branding", render: (p: PlanRow) => p.custom_branding ? "✓" : "—" },
    { key: "white_label" as const, label: "White label", render: (p: PlanRow) => p.white_label ? "✓" : "—" },
    { key: "support_level" as const, label: "Support", render: (p: PlanRow) => p.support_level ?? "Email" },
  ];

  // Hardcoded fallback if DB is empty
  if (plans.length === 0) {
    plans = [
      { id: "free",       name: "Free",       submissions_month: 50,   max_forms: 1,    audio_upload_mb: 10,  cover_upload_mb: 5,   ai_enabled: false, airtable_enabled: false, gdrive_enabled: false, gsheets_enabled: false, notion_enabled: false, custom_branding: false, white_label: false, support_level: "Email" },
      { id: "starter",    name: "Starter",    submissions_month: 500,  max_forms: 2,    audio_upload_mb: 50,  cover_upload_mb: 20,  ai_enabled: false, airtable_enabled: true,  gdrive_enabled: false, gsheets_enabled: false, notion_enabled: false, custom_branding: false, white_label: false, support_level: "Priority email" },
      { id: "pro",        name: "Pro",        submissions_month: 2000, max_forms: 5,    audio_upload_mb: 100, cover_upload_mb: 50,  ai_enabled: true,  airtable_enabled: true,  gdrive_enabled: true,  gsheets_enabled: true,  notion_enabled: false, custom_branding: true,  white_label: false, support_level: "Chat + Email" },
      { id: "enterprise", name: "Enterprise", submissions_month: null, max_forms: null, audio_upload_mb: 200, cover_upload_mb: 100, ai_enabled: true,  airtable_enabled: true,  gdrive_enabled: true,  gsheets_enabled: true,  notion_enabled: true,  custom_branding: true,  white_label: true,  support_level: "Dedicated SLA" },
    ];
  }

  const colors = planColors[currentPlanId] ?? planColors.pro;

  // Plans eligible for self-serve upgrade
  const upgradeablePlans = new Set(["starter", "pro"]);

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
            Current plan: {currentPlanName}
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#111111]">
            Your Sunbeat plan
          </h1>
          <p className="mt-2 text-sm leading-7 text-[#5F5A53]">
            Review your current plan features and compare available options.
            Upgrade anytime — changes take effect immediately.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const pc = planColors[plan.id] ?? planColors.pro;
            const price = USD_PRICES[plan.id] ?? 0;
            const canUpgrade = upgradeablePlans.has(plan.id) && !isCurrent;

            return (
              <div
                key={plan.id}
                className="rounded-[28px] border p-6 transition"
                style={{
                  borderColor: isCurrent ? pc.badge : "rgba(0,0,0,0.08)",
                  backgroundColor: isCurrent ? pc.bg : "#FFFFFF",
                  boxShadow: isCurrent ? `0 0 0 2px ${pc.badge}22` : "0 14px 34px rgba(0,0,0,0.04)",
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
                      Current
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <span className="text-2xl font-semibold tracking-tight text-[#111111]">
                    {plan.id === "free" ? "Free" : plan.id === "enterprise" ? "Custom" : `$${price}`}
                  </span>
                  {price > 0 && (
                    <span className="ml-1 text-xs text-[#7A746A]">/mo</span>
                  )}
                </div>

                <ul className="mt-4 space-y-2 text-[13px] text-[#5F5A53]">
                  <li><span className="font-medium text-[#111111]">{fmt(plan.submissions_month)}</span> submissions/mo</li>
                  <li><span className="font-medium text-[#111111]">{fmt(plan.max_forms)}</span> forms</li>
                  <li>Audio up to <span className="font-medium text-[#111111]">{fmtMB(plan.audio_upload_mb)}</span></li>
                  {plan.ai_enabled && <li className="text-[#7C3AED] font-medium">✓ AI — Lyric Engine</li>}
                  {plan.airtable_enabled && <li className="font-medium">✓ Native Airtable</li>}
                  {plan.notion_enabled && <li className="font-medium">✓ Notion</li>}
                  {plan.white_label && <li className="font-medium">✓ White label</li>}
                </ul>

                {/* Upgrade button */}
                {canUpgrade && (
                  <UpgradeButton
                    planId={plan.id}
                    workspaceSlug={workspaceSlug}
                    className="mt-5 w-full rounded-2xl py-2 text-sm font-semibold transition disabled:opacity-60"
                    style={{ backgroundColor: pc.badge, color: "#ffffff" }}
                  >
                    Upgrade to {plan.name}
                  </UpgradeButton>
                )}

                {/* Enterprise contact */}
                {plan.id === "enterprise" && !isCurrent && (
                  <Link
                    href="/"
                    className="mt-5 block w-full rounded-2xl py-2 text-center text-sm font-semibold"
                    style={{ backgroundColor: "#111111", color: "#ffffff" }}
                  >
                    Contact us
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <div className="mt-12">
          <h2 className="mb-6 text-lg font-semibold tracking-[-0.03em] text-[#111111]">
            Full comparison
          </h2>
          <div className="overflow-x-auto rounded-[28px] border border-black/8 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/6">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#8D867B]">
                    Feature
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
                            current
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
                  <h3 className="font-semibold text-[#111111]">Manage your subscription</h3>
                  <p className="mt-1 text-sm text-[#5F5A53]">
                    Update payment method, view invoices, or cancel your plan via the Stripe portal.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-[#111111]">Need a different plan?</h3>
                  <p className="mt-1 text-sm text-[#5F5A53]">
                    Contact the Sunbeat team and we&apos;ll set up the right plan for your operation.
                  </p>
                </>
              )}
            </div>
            {hasSubscription ? (
              <ManageSubscriptionButton
                workspaceSlug={workspaceSlug}
                className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: "#111111", color: "#ffffff" }}
              />
            ) : (
              <Link
                href="/"
                className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold"
                style={{ backgroundColor: "#111111", color: "#ffffff" }}
              >
                Talk to Sunbeat
              </Link>
            )}
          </div>
        </div>

        {/* Back */}
        <div className="mt-6">
          <Link
            href="/app"
            className="text-sm font-medium text-[#6E685E] underline underline-offset-2"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
