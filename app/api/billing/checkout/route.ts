import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { authorizeBillingWorkspaceAccess } from "@/lib/billing/auth";
import {
  billingCatalog,
  isSelfServePlan,
  resolveBillingSettingsUrl,
  resolveMarket,
  shouldUseBillingPortal,
  type Market,
  type BillingTier,
} from "@/lib/billing/catalog";

export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada.");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function POST(req: Request) {
  try {
    let body: {
      plan_id?: unknown;
      workspace_slug?: unknown;
      market?: unknown;
      success_url?: unknown;
      cancel_url?: unknown;
      request_id?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Payload inválido." },
        { status: 400 }
      );
    }

    const planId =
      typeof body.plan_id === "string" ? body.plan_id.trim() : "";
    const requestedMarket: Market | null =
      body.market === "global" || body.market === "brazil" ? body.market : null;
    const requestId =
      typeof body.request_id === "string" ? body.request_id.trim() : "";

    if (!planId || !isSelfServePlan(planId as BillingTier)) {
      return NextResponse.json(
        { ok: false, error: "Plano indisponível para contratação self-service." },
        { status: 400 }
      );
    }

    if (body.market != null && !requestedMarket) {
      return NextResponse.json(
        { ok: false, error: "Mercado inválido." },
        { status: 400 }
      );
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
      return NextResponse.json(
        { ok: false, error: "Identificador da tentativa inválido." },
        { status: 400 }
      );
    }

    const access = await authorizeBillingWorkspaceAccess(body.workspace_slug);
    if ("response" in access) return access.response;

    const workspaceSlug = access.workspaceSlug;
    const host = req.headers.get("host") ?? "";
    const hostMarket = resolveMarket(host);

    if (requestedMarket && requestedMarket !== hostMarket) {
      return NextResponse.json(
        { ok: false, error: "Mercado incompatível com o domínio atual." },
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
          error: `Price ID não configurado para ${planId} (${market}).`,
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .select("slug, owner_email, stripe_customer_id, stripe_subscription_id, stripe_subscription_status")
      .eq("slug", workspaceSlug)
      .maybeSingle();

    if (wsError || !ws) {
      return NextResponse.json(
        { ok: false, error: "Workspace não encontrado." },
        { status: 404 }
      );
    }

    if (shouldUseBillingPortal({
      subscriptionId: ws.stripe_subscription_id,
      status: ws.stripe_subscription_status,
    })) {
      return NextResponse.json(
        {
          ok: false,
          error: "Este workspace já possui uma assinatura. Use o portal para alterar o plano.",
          code: "subscription_already_active",
        },
        { status: 409 }
      );
    }

    const stripe = getStripe();

    // Reutiliza ou cria o customer no Stripe
    let customerId = ws.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          email: ws.owner_email ?? undefined,
          metadata: {
            workspace_slug: workspaceSlug,
            market,
            domain: marketConfig.domain,
          },
        },
        { idempotencyKey: `workspace-customer:${workspaceSlug}` }
      );
      customerId = customer.id;

      const { error: customerUpdateError } = await supabase
        .from("workspaces")
        .update({ stripe_customer_id: customerId })
        .eq("slug", workspaceSlug);

      if (customerUpdateError) {
        throw new Error(`Falha ao vincular Stripe customer: ${customerUpdateError.message}`);
      }
    }

    const successUrl = resolveBillingSettingsUrl({
      workspaceSlug,
      market,
      requestedUrl:
        typeof body.success_url === "string" ? body.success_url : null,
      checkoutStatus: "success",
      includeSessionId: true,
    });
    const cancelUrl = resolveBillingSettingsUrl({
      workspaceSlug,
      market,
      requestedUrl: typeof body.cancel_url === "string" ? body.cancel_url : null,
      checkoutStatus: "cancelled",
    });

    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        client_reference_id: `${workspaceSlug}:${requestId}`,
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
      },
      { idempotencyKey: `checkout:${workspaceSlug}:${requestId}` }
    );

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("[billing/checkout] Erro:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Não foi possível iniciar o checkout. Tente novamente.",
      },
      { status: 500 }
    );
  }
}
