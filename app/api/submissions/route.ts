import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getTenantFromHost } from "@/lib/tenant";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getWorkspaceEntitlements } from "@/lib/billing/entitlements";
import { sanitizeWorkspaceSlug } from "@/lib/tenant";
import {
  getBackendApiBaseUrl,
  getErrorMessage,
  parseJsonSafely,
} from "@/lib/server/backend-api";

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  let base: string;

  try {
    base = getBackendApiBaseUrl();
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "Backend API URL is not set") },
      { status: 500 }
    );
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const tenant = getTenantFromHost(host);
  const bodyRecord =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const payloadWorkspaceSlug = sanitizeWorkspaceSlug(
    bodyRecord.workspace_slug ?? bodyRecord.client_slug
  );
  const tenantWorkspaceSlug =
    tenant?.type === "subdomain" ? sanitizeWorkspaceSlug(tenant.value) : null;
  const workspaceSlug = tenantWorkspaceSlug ?? payloadWorkspaceSlug;

  if (
    !workspaceSlug ||
    (tenantWorkspaceSlug && payloadWorkspaceSlug && tenantWorkspaceSlug !== payloadWorkspaceSlug)
  ) {
    return NextResponse.json(
      { ok: false, error: "Workspace inválido para esta submissão." },
      { status: 400 }
    );
  }

  try {
    const entitlements = await getWorkspaceEntitlements(workspaceSlug);
    const workflowType =
      typeof bodyRecord.workflow_type === "string" && bodyRecord.workflow_type.trim()
        ? bodyRecord.workflow_type.trim()
        : "release_intake";

    if (
      entitlements.enabledWorkflowTypes !== null &&
      !entitlements.enabledWorkflowTypes.includes(workflowType)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Este workflow não está incluído no plano do workspace.",
          code: "workflow_not_in_plan",
        },
        { status: 403 }
      );
    }

    if (entitlements.maxSubmissionsMonth != null) {
      const now = new Date();
      const monthStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
      ).toISOString();
      const admin = createSupabaseAdmin();
      const { count, error } = await admin
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("client_slug", workspaceSlug)
        .not("submitted_at", "is", null)
        .gte("submitted_at", monthStart);

      if (error) throw error;
      if ((count ?? 0) >= entitlements.maxSubmissionsMonth) {
        return NextResponse.json(
          {
            ok: false,
            error: "Limite mensal de submissões atingido para este workspace.",
            code: "monthly_submission_limit_reached",
          },
          { status: 429 }
        );
      }
    }
  } catch (error) {
    console.error("[submissions] Falha ao validar entitlements:", error);
    return NextResponse.json(
      { ok: false, error: "Não foi possível validar os limites do workspace." },
      { status: 503 }
    );
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  let upstream: Response;

  try {
    upstream = await fetch(`${base}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Value": workspaceSlug,
        "X-Tenant-Type": "subdomain",
        ...(user?.id ? { "X-User-Id": user.id } : {}),
        ...(user?.email ? { "X-User-Email": user.email } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "Could not reach submissions backend"),
      },
      { status: 502 }
    );
  }

  const text = await upstream.text();
  const json = parseJsonSafely(text);

  if (json !== null) {
    return NextResponse.json(json, { status: upstream.status });
  }

  return NextResponse.json(
    {
      ok: upstream.ok,
      error: text || "Submission request failed",
    },
    { status: upstream.status }
  );
}
