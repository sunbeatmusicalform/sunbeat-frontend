/**
 * Sunbeat Billing Catalog
 *
 * Two-market structure:
 *   - "global"  → sunbeat.pro  → USD
 *   - "brazil"  → sunbeat.com.br → BRL
 *
 * Each market maps logical plan keys to Stripe price IDs (env vars),
 * display prices, and locale formatting config.
 *
 * New env vars required for BRL market:
 *   STRIPE_PRICE_ID_STARTER_BRL
 *   STRIPE_PRICE_ID_PRO_BRL
 *
 * Existing USD vars (kept for backwards compat):
 *   STRIPE_PRICE_ID_STARTER   (alias for STRIPE_PRICE_ID_STARTER_USD)
 *   STRIPE_PRICE_ID_PRO       (alias for STRIPE_PRICE_ID_PRO_USD)
 */

export type Market = "global" | "brazil";
export type BillingTier = "free" | "starter" | "pro" | "enterprise";

export type BillingTierType =
  | "self_serve"          // user can buy online
  | "sales_led"           // contact sales
  | "internal_commercial"; // not shown on public pricing

export interface PlanDefinition {
  id: BillingTier;
  logicalKey: string;      // stable key, never changes even if display name does
  labelPt: string;         // Portuguese display name
  labelEn: string;         // English display name
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
  enterprise: {
    id: "enterprise",
    logicalKey: "enterprise",
    labelPt: "Enterprise",
    labelEn: "Enterprise",
    tierType: "sales_led",
    visibleOnPublicPricing: true,
    visibleOnDashboard: true,
  },
};

export interface EnterpriseTierDef {
  id: string;
  labelPt: string;
  labelEn: string;
  descriptionPt: string;
  descriptionEn: string;
  tierType: BillingTierType;
}

/** Enterprise sub-tiers — sales-led, shown on public pricing but not in dashboard upgrade flow */
export const enterpriseTiers: EnterpriseTierDef[] = [
  {
    id: "enterprise_core",
    labelPt: "Enterprise Core",
    labelEn: "Enterprise Core",
    descriptionPt: "Para labels com volume alto e times internos dedicados.",
    descriptionEn: "For high-volume labels with dedicated internal teams.",
    tierType: "sales_led",
  },
  {
    id: "enterprise_ops",
    labelPt: "Enterprise Ops",
    labelEn: "Enterprise Ops",
    descriptionPt: "Operação completa com todos os subprodutos de IA e integrações.",
    descriptionEn: "Full operation with all AI sub-products and integrations.",
    tierType: "sales_led",
  },
  {
    id: "enterprise_distribution",
    labelPt: "Enterprise Distribution",
    labelEn: "Enterprise Distribution",
    descriptionPt: "White label completo — sua marca, seu domínio, sua operação.",
    descriptionEn: "Full white label — your brand, your domain, your operation.",
    tierType: "internal_commercial",
  },
];

export interface MarketConfig {
  currency: "USD" | "BRL";
  domain: string;
  locale: string;
  symbol: string;
  /** Stripe price IDs for self-serve plans (resolved at runtime from env) */
  priceIds: () => Partial<Record<BillingTier, string | undefined>>;
  /** Display prices for public UI (not from Stripe, purely presentational) */
  displayPrices: Record<BillingTier, number>;
  /** Stripe metadata tag sent on checkout sessions */
  marketTag: string;
}

export const billingCatalog: Record<Market, MarketConfig> = {
  global: {
    currency: "USD",
    domain: "sunbeat.pro",
    locale: "en-US",
    symbol: "$",
    priceIds: () => ({
      starter: process.env.STRIPE_PRICE_ID_STARTER_USD ?? process.env.STRIPE_PRICE_ID_STARTER,
      pro:     process.env.STRIPE_PRICE_ID_PRO_USD     ?? process.env.STRIPE_PRICE_ID_PRO,
    }),
    displayPrices: {
      free:       0,
      starter:   19,
      pro:       49,
      enterprise: 0,
    },
    marketTag: "global_usd",
  },
  brazil: {
    currency: "BRL",
    domain: "sunbeat.com.br",
    locale: "pt-BR",
    symbol: "R$",
    priceIds: () => ({
      starter: process.env.STRIPE_PRICE_ID_STARTER_BRL,
      pro:     process.env.STRIPE_PRICE_ID_PRO_BRL,
    }),
    displayPrices: {
      free:       0,
      starter:   97,
      pro:      247,
      enterprise: 0,
    },
    marketTag: "brazil_brl",
  },
};

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
 * Given a Stripe price ID, returns the logical plan key and market.
 * Used in the webhook to map incoming price IDs back to plan_id.
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

/**
 * Format a display price for the given market.
 */
export function formatPrice(market: Market, planId: BillingTier): string {
  const config = billingCatalog[market];
  const price = config.displayPrices[planId] ?? 0;
  if (planId === "enterprise") return "Custom";
  if (price === 0) return config.currency === "BRL" ? "Grátis" : "Free";
  return `${config.symbol}${price}`;
}
