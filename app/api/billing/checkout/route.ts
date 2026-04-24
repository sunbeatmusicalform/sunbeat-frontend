import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { authorizeBillingWorkspaceAccess } from "@/lib/billing/auth";
import {
  billingCatalog,
  resolveBillingSettingsUrl,
  resolveMarket,
  type BillingTier,
  type Market,
} from "@/lib/billing/catalog";

export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada.");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

function normalizeMarket(value: unknown): Market | null {
  return value === "global" || value === "brazil" ? value : null;
}

export async function POST(req: Request) {
  try {
    let body: {
      plan_id?: unknown;
      workspace_slug?: unknown;
      market?: unknown;
      success_url?: unknown;
      cancel_url?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Payload inválido." },
        { status: 400 }
      );
    }

    const planId = typeof body.plan_id === "string" ? body.plan_id.trim() : "";
    const requestedMarket = normalizeMarket(body.market);
    const requestedSuccessUrl =
      typeof body.success_url === "string" ? body.success_url : null;
    const requestedCancelUrl =
      typeof body.cancel_url === "string" ? body.cancel_url : null;

    if (!planId) {
      return NextResponse.json(
        { ok: false, error: "plan_id é obrigatório." },
        { status: 400 }
      );
    }

    const access = await authorizeBillingWorkspaceAccess(body.workspace_slug);
    if ("response" in access) {
      return access.response;
    }

    if (body.market != null && !requestedMarket) {
      return NextResponse.json(
        { ok: false, error: "market inválido." },
        { status: 400 }
      );
    }

    const workspaceSlug = access.workspaceSlug;
    const host = req.headers.get("host") ?? "";
    const hostMarket = resolveMarket(host);

    if (requestedMarket && requestedMarket !== hostMarket) {
      return NextResponse.json(
        { ok: false, error: "market incompatível com o domínio atual." },
        { status: 400 }
      );
    }

    const market = requestedMarket ?? hostMarket;
    const marketConfig = billingCatalog[market];
    const priceIds = marketConfig.priceIds();
    const priceId = priceIds[planId as BillingTier];

    if (!priceId) {
      return NextResponse.json(
        {
          ok: false,
          error: `Plano inválido ou price_id não configurado: ${planId} (market: ${market})`,
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();
    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .select("slug, owner_email, stripe_customer_id")
      .eq("slug", workspaceSlug)
      .maybeSingle();

    if (wsError || !ws) {
      return NextResponse.json(
        { ok: false, error: "Workspace não encontrado." },
        { status: 404 }
      );
    }

    const stripe = getStripe();

    let customerId = ws.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: ws.owner_email ?? undefined,
        metadata: {
          workspace_slug: workspaceSlug,
          market,
          domain: marketConfig.domain,
        },
      });
      customerId = customer.id;

      await supabase
        .from("workspaces")
        .update({ stripe_customer_id: customerId })
        .eq("slug", workspaceSlug);
    }

    const successUrl = resolveBillingSettingsUrl({
      workspaceSlug,
      market,
      requestedUrl: requestedSuccessUrl,
      checkoutStatus: "success",
      includeSessionId: true,
    });
    const cancelUrl = resolveBillingSettingsUrl({
      workspaceSlug,
      market,
      requestedUrl: requestedCancelUrl,
      checkoutStatus: "cancelled",
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        workspace_slug: workspaceSlug,
        plan_id: planId,
        market,
        logical_plan: planId,
        billing_tier_type: "self_serve",
      },
      subscription_data: {
        metadata: {
          workspace_slug: workspaceSlug,
          plan_id: planId,
          market,
          logical_plan: planId,
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
        error:
          err instanceof Error
            ? err.message
            : "Erro interno ao criar sessão de checkout.",
      },
      { status: 500 }
    );
  }
}
