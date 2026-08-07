import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { authorizeBillingWorkspaceAccess } from "@/lib/billing/auth";
import { getStripe } from "@/lib/billing/stripe";
import { applyStripeSubscriptionSnapshot } from "@/lib/billing/subscription-sync";

export const dynamic = "force-dynamic";

function stripeId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

export async function POST(req: Request) {
  let body: { session_id?: unknown; workspace_slug?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload inválido." },
      { status: 400 }
    );
  }

  const sessionId =
    typeof body.session_id === "string" ? body.session_id.trim() : "";
  if (!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) {
    return NextResponse.json(
      { ok: false, error: "Sessão de checkout inválida." },
      { status: 400 }
    );
  }

  const access = await authorizeBillingWorkspaceAccess(body.workspace_slug);
  if ("response" in access) return access.response;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
    const workspaceSlug = access.workspaceSlug;

    if (
      session.mode !== "subscription" ||
      session.status !== "complete" ||
      !["paid", "no_payment_required"].includes(session.payment_status) ||
      session.metadata?.workspace_slug !== workspaceSlug ||
      !session.client_reference_id?.startsWith(`${workspaceSlug}:`)
    ) {
      return NextResponse.json(
        { ok: false, error: "O checkout ainda não foi concluído." },
        { status: 409 }
      );
    }

    const sessionSubscription = session.subscription;
    if (!sessionSubscription) {
      throw new Error("Checkout concluído sem assinatura Stripe.");
    }

    const subscription: Stripe.Subscription =
      typeof sessionSubscription === "string"
        ? await stripe.subscriptions.retrieve(sessionSubscription)
        : sessionSubscription;
    const sessionCustomerId = stripeId(session.customer);
    const subscriptionCustomerId = stripeId(subscription.customer);

    if (!sessionCustomerId || sessionCustomerId !== subscriptionCustomerId) {
      return NextResponse.json(
        { ok: false, error: "A assinatura não corresponde ao checkout." },
        { status: 409 }
      );
    }

    const result = await applyStripeSubscriptionSnapshot(
      subscription,
      Math.floor(Date.now() / 1000),
      workspaceSlug
    );

    return NextResponse.json({
      ok: true,
      plan_id: result.planId,
      subscription_status: result.status,
      applied: result.applied,
    });
  } catch (error) {
    console.error("[billing/checkout/confirm] Erro:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Não foi possível confirmar a assinatura. Tente novamente em instantes.",
      },
      { status: 500 }
    );
  }
}
