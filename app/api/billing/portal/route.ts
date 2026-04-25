import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { billingCatalog, resolveMarket } from "@/lib/billing/catalog";

export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada.");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workspace_slug, return_url } = body as {
      workspace_slug: string;
      return_url?: string;
    };

    if (!workspace_slug) {
      return NextResponse.json(
        { ok: false, error: "workspace_slug é obrigatório." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .select("slug, stripe_customer_id")
      .eq("slug", workspace_slug)
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
        { ok: false, error: "Nenhuma assinatura ativa encontrada para este workspace." },
        { status: 400 }
      );
    }

    // Resolve market from the Host header so the return URL uses the correct domain
    const host = req.headers.get("host") ?? "";
    const market = resolveMarket(host);
    const { domain } = billingCatalog[market];
    const defaultReturnUrl = `https://${workspace_slug}.${domain}/app/settings/plan`;

    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url ?? defaultReturnUrl,
    });

    return NextResponse.json({ ok: true, url: portalSession.url });
  } catch (err) {
    console.error("[billing/portal] Erro:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Erro interno ao criar sessão do portal.",
      },
      { status: 500 }
    );
  }
}
