import "server-only";

import { billingCatalog, type Market } from "@/lib/billing/catalog";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type BillingConfigurationStatus = {
  enabled: boolean;
  stripeSecret: boolean;
  webhookSecret: boolean;
  starterPrice: boolean;
  proPrice: boolean;
  ready: boolean;
};

export function getBillingConfigurationStatus(
  market: Market
): BillingConfigurationStatus {
  const priceIds = billingCatalog[market].priceIds();
  const status = {
    enabled: process.env.PAID_SELF_SERVICE_ENABLED !== "false",
    stripeSecret: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    webhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
    starterPrice: Boolean(priceIds.starter?.trim()),
    proPrice: Boolean(priceIds.pro?.trim()),
  };

  return {
    ...status,
    ready: Object.values(status).every(Boolean),
  };
}

export async function hasBillingEventStore(): Promise<boolean> {
  try {
    const { error } = await createSupabaseAdmin()
      .from("stripe_webhook_events")
      .select("event_id")
      .limit(1);

    return !error;
  } catch {
    return false;
  }
}
