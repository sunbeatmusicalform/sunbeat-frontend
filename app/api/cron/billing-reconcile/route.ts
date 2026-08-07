import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { applyStripeSubscriptionSnapshot } from "@/lib/billing/subscription-sync";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type WorkspaceBillingRow = {
  slug: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
};

function batchSize() {
  const parsed = Number.parseInt(process.env.BILLING_RECONCILE_BATCH_SIZE ?? "100", 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 500) : 100;
}

async function findSubscription(row: WorkspaceBillingRow) {
  const stripe = getStripe();

  if (row.stripe_subscription_id) {
    return stripe.subscriptions.retrieve(row.stripe_subscription_id);
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: row.stripe_customer_id,
    status: "all",
    limit: 10,
  });

  const priority: Stripe.Subscription.Status[] = [
    "active",
    "trialing",
    "past_due",
    "unpaid",
    "incomplete",
    "paused",
    "incomplete_expired",
    "canceled",
  ];

  return subscriptions.data.sort((left, right) => {
    const statusDifference = priority.indexOf(left.status) - priority.indexOf(right.status);
    return statusDifference || right.created - left.created;
  })[0] ?? null;
}

async function reconcileWorkspace(row: WorkspaceBillingRow, observedAt: number) {
  const supabase = createSupabaseAdmin();
  const subscription = await findSubscription(row);

  if (!subscription) {
    const { error } = await supabase
      .from("workspaces")
      .update({ billing_reconciled_at: new Date().toISOString() })
      .eq("slug", row.slug)
      .eq("stripe_customer_id", row.stripe_customer_id);

    if (error) throw new Error(`Falha ao registrar reconciliação: ${error.message}`);
    return { workspaceSlug: row.slug, status: "no_subscription" };
  }

  return applyStripeSubscriptionSnapshot(subscription, observedAt, row.slug);
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("workspaces")
    .select("slug, stripe_customer_id, stripe_subscription_id")
    .not("stripe_customer_id", "is", null)
    .order("billing_reconciled_at", { ascending: true, nullsFirst: true })
    .limit(batchSize());

  if (error) {
    console.error("[billing/reconcile] Falha ao listar workspaces:", error);
    return NextResponse.json({ ok: false, error: "Falha ao iniciar reconciliação." }, { status: 500 });
  }

  const rows = (data ?? []) as WorkspaceBillingRow[];
  const observedAt = Math.floor(Date.now() / 1000);
  const results: PromiseSettledResult<unknown>[] = [];

  for (let index = 0; index < rows.length; index += 5) {
    const chunk = rows.slice(index, index + 5);
    results.push(
      ...(await Promise.allSettled(
        chunk.map((row) => reconcileWorkspace(row, observedAt))
      ))
    );
  }

  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  );
  failures.forEach((failure) =>
    console.error("[billing/reconcile] Workspace não reconciliado:", failure.reason)
  );

  return NextResponse.json({
    ok: failures.length === 0,
    checked: rows.length,
    reconciled: results.length - failures.length,
    failed: failures.length,
  });
}
