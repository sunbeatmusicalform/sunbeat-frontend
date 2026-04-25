/**
 * Sunbeat Billing Catalog
 * ───────────────────────
 * Single source of truth for all pricing decisions.
 *
 * Architecture: hostname → market → logical plan → Stripe price ID
 *
 * Two markets, each with separate Stripe products (different tax/commercial rules):
 *   "global"  → sunbeat.pro      → USD
 *   "brazil"  → sunbeat.com.br   → BRL
 *
 * Five logical plans (self-serve + sales-led):
 *   free                 self_serve
 *   starter              self_serve
 *   pro                  self_serve
 *   enterprise_core      sales_led
 *   enterprise_ops       sales_led
 *   enterprise_distribution  internal_commercial
 *
 * Note: "enterprise" (no suffix) is kept as a legacy alias so existing
 * workspace rows with plan_id="enterprise" don't break. It is NOT
 * shown on public pricing and does NOT have a Stripe price ID.
 *
 * ─── Required Vercel env vars ───────────────────────────────────────────────
 *
 *  USD / global (sunbeat.pro)
 *    STRIPE_PRICE_ID_STARTER                  Sunbeat Starter Global
 *    STRIPE_PRICE_ID_PRO                      Sunbeat Pro Global
 *    STRIPE_PRICE_ID_ENTERPRISE_CORE          Sunbeat Enterprise Core Global
 *    STRIPE_PRICE_ID_ENTERPRISE_OPS           Sunbeat Enterprise Ops Global
 *    STRIPE_PRICE_ID_ENTERPRISE_DISTRIBUTION  Sunbeat Enterprise Distribution Global
 *
 *  BRL / brazil (sunbeat.com.br)
 *    STRIPE_PRICE_ID_STARTER_BRL                  Sunbeat Starter BR
 *    STRIPE_PRICE_ID_PRO_BRL                      Sunbeat Pro BR
 *    STRIPE_PRICE_ID_ENTERPRISE_CORE_BRL          Sunbeat Enterprise Core BR
 *    STRIPE_PRICE_ID_ENTERPRISE_OPS_BRL           Sunbeat Enterprise Ops BR
 *    STRIPE_PRICE_ID_ENTERPRISE_DISTRIBUTION_BRL  Sunbeat Enterprise Distribution BR
 *
 *  Shared
 *    STRIPE_SECRET_KEY
 *    STRIPE_WEBHOOK_SECRET
 * ────────────────────────────────────────────────────────────────────────────
 */

// ─── Core types ──────────────────────────────────────────────────────────────

import { buildWorkspaceUrl, type WorkspaceBaseDomain } from "@/lib/tenant";

export type Market = "global" | "brazil";

/**
 * Stable logical plan keys. Never use display names as plan keys.
 * "enterprise" (no suffix) is a legacy alias only — kept for DB compatibility.
 */
export type BillingTier =
  | "free"
  | "starter"
  | "pro"
  | "enterprise"               // legacy alias — do NOT use for new subscriptions
  | "enterprise_core"
  | "enterprise_ops"
  | "enterprise_distribution";

export type BillingTierType =
  | "self_serve"           // user can buy online without contacting sales
  | "sales_led"            // requires sales contact; price is shown publicly
  | "internal_commercial"; // commercial/white-label; price NOT shown publicly

export type BillingCheckoutStatus = "success" | "cancelled";

// ─── Plan definitions ────────────────────────────────────────────────────────

export interface PlanDefinition {
  id: BillingTier;
  logicalKey: BillingTier;     // stable billing key (same as id; kept explicit)
  labelPt: string;
  labelEn: string;
  tierType: BillingTierType;
  visibleOnPublicPricing: boolean;
  visibleOnDashboard: boolean;
}

export const planDefinitions: Record<BillingTier, PlanDefinition> = {
  free: {
    id: "free",
    logicalKey: "free",
    labelPt: "Free",
    labelEn: "Free",
    tierType: "self_serve",
    visibleOnPublicPricing: true,
    visibleOnDashboard: true,
  },
  starter: {
    id: "starter",
    logicalKey: "starter",
    labelPt: "Starter",
    labelEn: "Starter",
    tierType: "self_serve",
    visibleOnPublicPricing: true,
    visibleOnDashboard: true,
  },
  pro: {
    id: "pro",
    logicalKey: "pro",
    labelPt: "Pro",
    labelEn: "Pro",
    tierType: "self_serve",
    visibleOnPublicPricing: true,
    visibleOnDashboard: true,
  },
  // Legacy — kept for DB backwards compat only
  enterprise: {
    id: "enterprise",
    logicalKey: "enterprise",
    labelPt: "Enterprise",
    labelEn: "Enterprise",
    tierType: "sales_led",
    visibleOnPublicPricing: false, // handled via enterprise_core/ops/distribution
    visibleOnDashboard: true,
  },
  enterprise_core: {
    id: "enterprise_core",
    logicalKey: "enterprise_core",
    labelPt: "Enterprise Core",
    labelEn: "Enterprise Core",
    tierType: "sales_led",
    visibleOnPublicPricing: true,
    visibleOnDashboard: true,
  },
  enterprise_ops: {
    id: "enterprise_ops",
    logicalKey: "enterprise_ops",
    labelPt: "Enterprise Ops",
    labelEn: "Enterprise Ops",
    tierType: "sales_led",
    visibleOnPublicPricing: true,
    visibleOnDashboard: true,
  },
  enterprise_distribution: {
    id: "enterprise_distribution",
    logicalKey: "enterprise_distribution",
    labelPt: "Enterprise Distribution",
    labelEn: "Enterprise Distribution",
    tierType: "internal_commercial",
    visibleOnPublicPricing: true,   // shown, but price is "Custom"
    visibleOnDashboard: true,
  },
};

// ─── Enterprise tier display definitions ─────────────────────────────────────

export interface EnterpriseTierDef {
  id: string;
  logicalKey: BillingTier;       // maps to planDefinitions key + Stripe price ID
  labelPt: string;
  labelEn: string;
  descriptionPt: string;
  descriptionEn: string;
  tierType: BillingTierType;
  /**
   * Whether the price is shown on public pricing pages.
   * false = "Custom" / "Consulte" is shown instead.
   */
  showPricePublicly: boolean;
}

/** Enterprise sub-tiers displayed in the Enterprise section of public pricing. */
export const enterpriseTiers: EnterpriseTierDef[] = [
  {
    id: "enterprise_core",
    logicalKey: "enterprise_core",
    labelPt: "Enterprise Core",
    labelEn: "Enterprise Core",
    descriptionPt: "Para labels com volume alto e times internos dedicados.",
    descriptionEn: "For high-volume labels with dedicated internal teams.",
    tierType: "sales_led",
    showPricePublicly: true,
  },
  {
    id: "enterprise_ops",
    logicalKey: "enterprise_ops",
    labelPt: "Enterprise Ops",
    labelEn: "Enterprise Ops",
    descriptionPt: "Operação completa com todos os subprodutos de IA e integrações.",
    descriptionEn: "Full operation with all AI sub-products and integrations.",
    tierType: "sales_led",
    showPricePublicly: true,
  },
  {
    id: "enterprise_distribution",
    logicalKey: "enterprise_distribution",
    labelPt: "Enterprise Distribution",
    labelEn: "Enterprise Distribution",
    descriptionPt: "White label completo — sua marca, seu domínio, sua operação.",
    descriptionEn: "Full white label — your brand, your domain, your operation.",
    tierType: "internal_commercial",
    showPricePublicly: false, // Distribution pricing is commercial-only
  },
];

// ─── Market config ────────────────────────────────────────────────────────────

export interface MarketConfig {
  currency: "USD" | "BRL";
  domain: WorkspaceBaseDomain;
  locale: string;
  symbol: string;
  /**
   * Stripe price IDs resolved at runtime from env vars.
   * Keys are logical plan keys. Only self-serve + sales-led plans have IDs here.
   * "free" and legacy "enterprise" intentionally have no price ID.
   */
  priceIds: () => Partial<Record<BillingTier, string | undefined>>;
  /**
   * Display prices for public UI — purely presentational, not from Stripe.
   * 0 = free / not applicable. "enterprise_distribution" uses 0 → shown as "Custom".
   */
  displayPrices: Record<BillingTier, number>;
  /** Stripe metadata tag recorded on checkout sessions and subscriptions. */
  marketTag: string;
}

export const billingCatalog: Record<Market, MarketConfig> = {
  global: {
    currency: "USD",
    domain: "sunbeat.pro",
    locale: "en-US",
    symbol: "$",
    priceIds: () => ({
      // Self-serve (STRIPE_PRICE_ID_STARTER also accepted as legacy alias)
      starter:                process.env.STRIPE_PRICE_ID_STARTER,
      pro:                    process.env.STRIPE_PRICE_ID_PRO,
      // Sales-led — price IDs exist for sales team + webhook resolution
      enterprise_core:        process.env.STRIPE_PRICE_ID_ENTERPRISE_CORE,
      enterprise_ops:         process.env.STRIPE_PRICE_ID_ENTERPRISE_OPS,
      enterprise_distribution: process.env.STRIPE_PRICE_ID_ENTERPRISE_DISTRIBUTION,
    }),
    displayPrices: {
      free:                    0,
      starter:                19,
      pro:                    49,
      enterprise:              0,   // legacy, not displayed
      enterprise_core:        199,
      enterprise_ops:         499,
      enterprise_distribution: 999, // shown only to sales / not shown publicly
    },
    marketTag: "global_usd",
  },
  brazil: {
    currency: "BRL",
    domain: "sunbeat.com.br",
    locale: "pt-BR",
    symbol: "R$\u00a0",  // non-breaking space after R$
    priceIds: () => ({
      // Env vars take precedence; fallbacks are the known live BRL price IDs.
      // Price IDs are not secrets — they are visible in Stripe checkout URLs.
      starter:                process.env.STRIPE_PRICE_ID_STARTER_BRL                  ?? "price_1TK69w837oCj1xtD9EpC8HNc",
      pro:                    process.env.STRIPE_PRICE_ID_PRO_BRL                      ?? "price_1TK6EX837oCj1xtDsLvTjfMV",
      enterprise_core:        process.env.STRIPE_PRICE_ID_ENTERPRISE_CORE_BRL          ?? "price_1TK6FN837oCj1xtD0WFtuoLY",
      enterprise_ops:         process.env.STRIPE_PRICE_ID_ENTERPRISE_OPS_BRL           ?? "price_1TK6Gg837oCj1xtDAmJe8wIX",
      enterprise_distribution: process.env.STRIPE_PRICE_ID_ENTERPRISE_DISTRIBUTION_BRL ?? "price_1TK6IK837oCj1xtDy1HDzeuM",
    }),
    displayPrices: {
      free:                    0,
      starter:                97,
      pro:                   247,
      enterprise:              0,   // legacy
      enterprise_core:        990,
      enterprise_ops:        2490,
      enterprise_distribution: 4900,
    },
    marketTag: "brazil_brl",
  },
};

// ─── Utility functions ────────────────────────────────────────────────────────

/**
 * Resolves the market from a hostname string.
 * Defaults to "global" if no match.
 */
export function resolveMarket(host: string): Market {
  const h = host.split(":")[0].toLowerCase();
  if (h === "sunbeat.com.br" || h.endsWith(".sunbeat.com.br")) return "brazil";
  return "global";
}

/**
 * Given a Stripe price ID (from a webhook event), returns the logical plan
 * key and market. Searches all markets and all tiers.
 *
 * Works for both self-serve and sales-led enterprise price IDs.
 * Returns null if the price ID is not registered in the catalog
 * (e.g. the env var is missing — log a warning and fallback gracefully).
 */
export function resolvePlanFromPriceId(
  priceId: string
): { planId: BillingTier; market: Market } | null {
  for (const [market, config] of Object.entries(billingCatalog) as [Market, MarketConfig][]) {
    const ids = config.priceIds();
    for (const [planKey, id] of Object.entries(ids) as [BillingTier, string | undefined][]) {
      if (id && id === priceId) {
        return { planId: planKey, market };
      }
    }
  }
  return null;
}

type BuildBillingSettingsUrlArgs = {
  workspaceSlug: string;
  market: Market;
  checkoutStatus?: BillingCheckoutStatus;
  includeSessionId?: boolean;
};

export function buildBillingSettingsUrl(
  args: BuildBillingSettingsUrlArgs
): string {
  const domain = billingCatalog[args.market].domain;
  const url = new URL(
    buildWorkspaceUrl(args.workspaceSlug, "/app/settings/plan", { domain })
  );

  if (args.checkoutStatus) {
    url.searchParams.set("checkout", args.checkoutStatus);
  }

  if (args.includeSessionId) {
    url.searchParams.set("session_id