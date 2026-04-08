import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada.");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

const PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_ID_STARTER,
  pro: process.env.STRIPE_PRICE_ID_PRO,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plan_id, workspace_slug, success_url, cancel_url } = body as {
      plan_id: string;
      workspace_slug: string;
      success_url?: string;
      cancel_url?: string;
    };

    if (!plan_id || !workspace_slug) {
      return NextResponse.json(
        { ok: false, error: "plan_id e workspace_slug são obrigatórios." },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[plan_id];
    if (!priceId) {
      return NextResponse.json(
        { ok: false, error: `Plano inválido ou price_id não configurado: ${plan_id}` },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .select("slug, owner_email, stripe_customer_id")
      .eq("slug", workspace_slug)
      .maybeSingle();

    if (wsError || !ws) {
      return NextResponse.json(
        { ok: false, error: "Workspace não encontrado." },
        { status: 404 }
      );
    }

    const stripe = getStripe();

    // Reutiliza ou cria o customer no Stripe
    let customerId = ws.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: ws.owner_email ?? undefined,
        metadata: { workspace_slug },
      });
      customerId = customer.id;

      await supabase
        .from("workspaces")
        .update({ stripe_customer_id: customerId })
        .eq("slug", workspace_slug);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.sunbeat.pro";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url:
        success_url ??
        `${appUrl}/app/settings/plan?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancel_url ?? `${appUrl}/app/settings/plan?checkout=cancelled`,
      metadata: { workspace_slug, plan_id },
      subscription_data: {
        metadata: { workspace_slug, plan_id },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("[billing/checkout] Erro:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Erro interno ao criar sessão de checkout.",
      },
      { status: 500 }
    );
  }
}
