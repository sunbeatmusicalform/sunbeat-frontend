import "server-only";

import Stripe from "stripe";
import { resolvePlanFromPriceId } from "@/lib/billing/catalog";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type SubscriptionSyncResult = {
  workspaceSlug: string;
  subscriptionId: string;
  status: Stripe.Subscription.Status;
  planId: string | null;
  applied: boolean;
};

export async function applyStripeSubscriptionSnapshot(
  subscription: Stripe.Subscription,
  observedAt: number,
  expectedWorkspaceSlug?: string | null
): Promise<SubscriptionSyncResult> {
  const supabase = createSupabaseAdmin();
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const resolved = priceId ? resolvePlanFromPriceId(priceId) : null;
  const planId = resolved?.planId ?? null;
  const market = resolved?.market ?? subscription.metadata?.market ?? null;

  if ((status === "active" || status === "trialing") && !planId) {
    throw new Error(
      `Price ID não reconhecido para assinatura ativa: ${priceId ?? "ausente"}`
    );
  }

  let workspaceSlug =
    expectedWorkspaceSlug ?? subscription.metadata?.workspace_slug ?? null;

  if (workspaceSlug) {
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("slug, stripe_customer_id")
      .eq("slug", workspaceSlug)
      .maybeSingle();

    if (error || !workspace || workspace.stripe_customer_id !== customerId) {
      throw new Error("Assinatura não corresponde ao Stripe customer do workspace.");
    }
  } else {
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("slug")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (error || !workspace) {
      throw new Error(`Workspace não encontrado para Stripe customer ${customerId}.`);
    }

    workspaceSlug = workspace.slug;
  }

  const { data: applied, error } = await supabase.rpc(
    "apply_stripe_subscription_event",
    {
      p_workspace_slug: workspaceSlug,
      p_customer_id: customerId,
      p_subscription_id: subscription.id,
      p_subscription_status: status,
      p_price_id: priceId,
      p_plan_id: planId,
      p_market: market,
      p_event_created_at: observedAt,
    }
  );

  if (error) {
    throw new Error(`Falha ao aplicar estado Stripe: ${error.message}`);
  }

  return {
    workspaceSlug,
    subscriptionId: subscription.id,
    status,
    planId,
    applied: Boolean(applied),
  };
}
