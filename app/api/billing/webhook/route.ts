import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/billing/stripe";
import { applyStripeSubscriptionSnapshot } from "@/lib/billing/subscription-sync";

export const dynamic = "force-dynamic";

function getStripeObjectId(event: Stripe.Event) {
  const object = event.data.object as { id?: string };
  return typeof object.id === "string" ? object.id : null;
}

async function claimWebhookEvent(event: Stripe.Event) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.rpc("claim_stripe_webhook_event", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_object_id: getStripeObjectId(event),
    p_stripe_created_at: event.created,
  });

  if (error) {
    throw new Error(`Falha ao registrar evento Stripe: ${error.message}`);
  }

  return Boolean(data);
}

async function completeWebhookEvent(eventId: string, workspaceSlug?: string | null) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("stripe_webhook_events")
    .update({
      status: "processed",
      workspace_slug: workspaceSlug ?? null,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("event_id", eventId);

  if (error) throw new Error(`Falha ao concluir evento Stripe: ${error.message}`);
}

async function failWebhookEvent(eventId: string, error: unknown) {
  const supabase = createSupabaseAdmin();
  const message = error instanceof Error ? error.message.slice(0, 500) : "Erro desconhecido";
  await supabase
    .from("stripe_webhook_events")
    .update({
      status: "failed",
      last_error: message,
      updated_at: new Date().toISOString(),
    })
    .eq("event_id", eventId);
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
    const claimed = await claimWebhookEvent(event);
    if (!claimed) {
      return NextResponse.json({ ok: true, received: true, duplicate: true });
    }

    let workspaceSlug: string | null = null;

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const eventSubscription = event.data.object as Stripe.Subscription;
        const currentSubscription = await getStripe().subscriptions.retrieve(
          eventSubscription.id
        );
        const result = await applyStripeSubscriptionSnapshot(
          currentSubscription,
          event.created
        );
        workspaceSlug = result.workspaceSlug;
        console.log("[webhook] Estado de assinatura processado:", result);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        workspaceSlug = session.metadata?.workspace_slug ?? null;
        console.log(
          "[webhook] Checkout concluído:",
          session.id,
          "workspace:", session.metadata?.workspace_slug,
          "market:", session.metadata?.market ?? "global"
        );
        break;
      }

      default:
        break;
    }

    await completeWebhookEvent(event.id, workspaceSlug);
    return NextResponse.json({ ok: true, received: true });
  } catch (err) {
    await failWebhookEvent(event.id, err);
    console.error("[webhook] Erro ao processar evento:", event.type, err);
    return NextResponse.json(
      { ok: false, error: "Erro interno ao processar evento." },
      { status: 500 }
    );
  }
}
