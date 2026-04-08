import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { billingCatalog, resolveMarket, type Market, type BillingTier } from "@/lib/billing/catalog";

export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada.");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      plan_id,
      workspace_slug,
      market: marketOverride,
      success_url,
      cancel_url,
    } = body as {
      plan_id: string;
      workspace_slug: string;
      market?: Market;
      success_url?: string;
      cancel_url?: string;
    };

    if (!plan_id || !workspace_slug) {
      return NextResponse.json(
        { ok: false, error: "plan_id e workspace_slug são obrigatórios." },
        { status: 400 }
      );
    }

    // Resolve market: from body override OR from the request's Host header
    const host = req.headers.get("host") ?? "";
    const market: Market = marketOverride ?? resolveMarket(host);
    const marketConfig = billingCatalog[market];

    // Resolve Stripe price ID for this plan + market
    const priceIds = marketConfig.priceIds();
    const priceId = priceIds[plan_id as BillingTier];

    if (!priceId) {
      return NextResponse.json(
        {
          ok: false,
          error: `Plano inválido ou price_id não configurado: ${plan_id} (market: ${market})`,
        },
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
        metadata: {
          workspace_slug,
          market,
          domain: marketConfig.domain,
        },
      });
      customerId = customer.id;

      await supabase
        .from("workspaces")
        .update({ stripe_customer_id: customerId })
        .eq("slug", workspace_slug);
    }

    // Build return URLs — prefer the subdomain app URL
    const baseUrl = `https://${workspace_slug}.sunbeat.pro`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url:
        success_url ??
        `${baseUrl}/app/settings/plan?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancel_url ?? `${baseUrl}/app/settings/plan?checkout=cancelled`,
      metadata: {
        workspace_slug,
        plan_id,
        market,
        logical_plan: plan_id,
        billing_tier_type: "self_serve",
      },
      subscription_data: {
        metadata: {
          workspace_slug,
          plan_id,
          market,
          logical_plan: plan_id,
          domain: marketConfig.domain,
        },
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
