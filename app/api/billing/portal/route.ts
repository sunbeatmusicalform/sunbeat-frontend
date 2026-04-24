import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { authorizeBillingWorkspaceAccess } from "@/lib/billing/auth";
import {
  resolveBillingSettingsUrl,
  resolveMarket,
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
      workspace_slug?: unknown;
      return_url?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Payload inválido." },
        { status: 400 }
      );
    }

    const requestedReturnUrl =
      typeof body.return_url === "string" ? body.return_url : null;
    const access = await authorizeBillingWorkspaceAccess(body.workspace_slug);
    if ("response" in access) {
      return access.response;
    }

    const workspaceSlug = access.workspaceSlug;
    const supabase = createSupabaseAdmin();
    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .select("slug, stripe_customer_id")
      .eq("slug", workspaceSlug)
      .maybeSingle();

    if (wsError || !ws) {
      return NextResponse.json(
        { ok: false, error: "Workspace não encontrado." },
        { status: 404 }
      );
    }

    const customerId = ws.stripe_customer_id as string | null;
    if (!customerId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nenhuma assinatura ativa encontrada para este workspace.",
        },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const market = resolveMarket(req.headers.get("host") ?? "");
    const returnUrl = resolveBillingSettingsUrl({
      workspaceSlug,
      market,
      requestedUrl: requestedReturnUrl,
    });

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ ok: true, url: portalSession.url });
  } catch (err) {
    console.error("[billing/portal] Erro:", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Erro interno ao criar sessão do portal.",
      },
      { status: 500 }
    );
  }
}
