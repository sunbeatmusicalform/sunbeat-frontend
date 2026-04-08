import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada.");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

// Mapeia price_id → plan_id interno do Sunbeat
function resolvePlanId(priceId: string): string | null {
  if (priceId === process.env.STRIPE_PRICE_ID_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return "pro";
  return null;
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const supabase = createSupabaseAdmin();
  const customerId = subscription.customer as string;
  const status = subscription.status;

  // Descobre o price_id do primeiro item da assinatura
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const planId = priceId ? resolvePlanId(priceId) : null;

  // Workspace slug vem do metadata da assinatura
  const workspaceSlug =
    subscription.metadata?.workspace_slug ?? null;

  if (!workspaceSlug) {
    console.warn("[webhook] Assinatura sem workspace_slug no metadata:", subscription.id);
    // Tenta pelo customer_id
    const { data: ws } = await supabase
      .from("workspaces")
      .select("slug")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (!ws) {
      console.error("[webhook] Workspace não encontrado para customer:", customerId);
      return;
    }

    await updateWorkspace(supabase, ws.slug, subscription.id, status, planId);
    return;
  }

  await updateWorkspace(supabase, workspaceSlug, subscription.id, status, planId);
}

async function updateWorkspace(
  supabase: ReturnType<typeof import("@/lib/supabase/admin").createSupabaseAdmin>,
  workspaceSlug: string,
  subscriptionId: string,
  status: string,
  planId: string | null
) {
  const patch: Record<string, string | null> = {
    stripe_subscription_id: subscriptionId,
    stripe_subscription_status: status,
  };

  // Atualiza o plano ativo apenas se status for ativo
  if (planId && (status === "active" || status === "trialing")) {
    patch.plan_id = planId;
  }

  // Se cancelado/expirado, volta para free
  if (status === "canceled" || status === "unpaid" || status === "past_due") {
    patch.plan_id = "free";
  }

  const { error } = await supabase
    .from("workspaces")
    .update(patch)
    .eq("slug", workspaceSlug);

  if (error) {
    console.error("[webhook] Erro ao atualizar workspace:", workspaceSlug, error);
  } else {
    console.log(`[webhook] Workspace ${workspaceSlug} atualizado: plan=${patch.plan_id ?? "sem alteração"} status=${status}`);
  }
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET não configurado.");
    return NextResponse.json({ ok: false, error: "Webhook não configurado." }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Assinatura do webhook ausente." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[webhook] Falha na verificação da assinatura:", err);
    return NextResponse.json(
      { ok: false, error: "Assinatura do webhook inválida." },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.CheckoutSession;
        // Se a sessão criou uma assinatura, ela já será tratada pelo subscription.created
        // Aqui apenas logamos
        console.log("[webhook] Checkout concluído:", session.id, "workspace:", session.metadata?.workspace_slug);
        break;
      }

      default:
        // Evento não tratado — ignorar silenciosamente
        break;
    }

    return NextResponse.json({ ok: true, received: true });
  } catch (err) {
    console.error("[webhook] Erro ao processar evento:", event.type, err);
    return NextResponse.json(
      { ok: false, error: "Erro interno ao processar evento." },
      { status: 500 }
    );
  }
}
