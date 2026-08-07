import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getBackendApiBaseUrl } from "@/lib/server/backend-api";
import { loadWorkspaceConfigReadModel } from "@/lib/workspace-config/read-model";
import {
  canAccessWorkspace,
  listAccessibleWorkspacesForUser,
} from "@/lib/workspace-access";
import {
  buildSetupCopilotStructuredMessage,
  inferSetupCopilotProposal,
  parseSetupCopilotProposal,
  stripSetupCopilotProposalBlock,
} from "@/lib/ai/setup-copilot";

export const dynamic = "force-dynamic";

// Safely condense the config-read-model into a context string for the system prompt.
// We redact sensitive integration keys and keep only the structural/setup data.
function buildWorkspaceContextString(config: unknown): string {
  try {
    const c = config as Record<string, unknown>;

    const safe = {
      scope: c.scope,
      workspaceSettings: c.workspaceSettings,
      publicExperience: (() => {
        const pe = c.publicExperience as Record<string, unknown> | undefined;
        if (!pe) return pe;
        // Strip any potential secrets from public experience
        const { ...rest } = pe;
        return rest;
      })(),
      workflowSettings: c.workflowSettings,
      accessAndGovernance: c.accessAndGovernance,
      // billingAndEntitlements: expor apenas entitlements, nunca contractInfo (sensível)
      billingAndEntitlements: (() => {
        const be = c.billingAndEntitlements as Record<string, unknown> | undefined;
        if (!be || be["state"] !== "loaded") return be;
        // Redactar contractInfo — contém monthly_value_brl, setup_fee_paid_brl, etc.
        const safeEntitlements = { ...be };
        delete safeEntitlements.contractInfo;
        return safeEntitlements;
      })(),
      // Omit integrationSettings (may contain sensitive tokens)
      // Omit diagnostics (internal infra detail)
    };

    return JSON.stringify(safe, null, 2);
  } catch {
    return "{}";
  }
}

export async function POST(req: Request) {
  // 1. Auth: require logged-in user
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  // 2. Parse request body
  let body: { message?: string; workspaceSlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const message = (body.message ?? "").trim();
  const workspaceSlug = (body.workspaceSlug ?? "").trim();

  if (!message) {
    return NextResponse.json(
      { ok: false, error: "message is required" },
      { status: 400 }
    );
  }

  if (!workspaceSlug) {
    return NextResponse.json(
      { ok: false, error: "workspaceSlug is required" },
      { status: 400 }
    );
  }

  const accessibleWorkspaces = await listAccessibleWorkspacesForUser({
    userId: user.id,
    email: user.email ?? null,
    metadataWorkspaceSlug: user.user_metadata?.workspace_slug,
  });

  if (!canAccessWorkspace({ workspaceSlug, workspaces: accessibleWorkspaces })) {
    return NextResponse.json(
      { ok: false, error: "Workspace not available for this user" },
      { status: 403 }
    );
  }

  // 3. Load workspace context and fail closed when billing state is unavailable.
  let workspaceContextString: string;
  try {
    const config = await loadWorkspaceConfigReadModel({ workspaceSlug });
    if (
      config.billingAndEntitlements.state !== "loaded" ||
      !config.billingAndEntitlements.entitlements.aiEnabled
    ) {
      return NextResponse.json(
        { ok: false, error: "AI is not included in this workspace plan" },
        { status: 403 }
      );
    }
    workspaceContextString = buildWorkspaceContextString(config);
  } catch (error) {
    console.error("[ai/copilot] Failed to load workspace entitlements:", error);
    return NextResponse.json(
      { ok: false, error: "Workspace entitlements are unavailable" },
      { status: 503 }
    );
  }

  const structuredMessage = buildSetupCopilotStructuredMessage(message);

  // 4. Forward to backend /ai/copilot
  let backendBase: string;
  try {
    backendBase = getBackendApiBaseUrl();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Backend URL not configured" },
      { status: 503 }
    );
  }

  const copilotSecret =
    process.env.BACKEND_INTERNAL_ADMIN_TOKEN?.trim() ||
    process.env.INTERNAL_ADMIN_TOKEN?.trim() ||
    process.env.AI_COPILOT_SECRET?.trim() ||
    "";

  let upstream: Response;
  try {
    upstream = await fetch(`${backendBase}/ai/copilot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: structuredMessage,
        workspace_context: workspaceContextString,
        workspace_slug: workspaceSlug,
        secret: copilotSecret || null,
      }),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Could not reach AI backend",
      },
      { status: 502 }
    );
  }

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          (data as { detail?: { message?: string } })?.detail?.message ??
          "AI copilot request failed",
      },
      { status: upstream.status }
    );
  }

  const rawText = (data as { text?: string }).text ?? "";
  const parsedProposal = parseSetupCopilotProposal({
    text: rawText,
    workspaceSlug,
    userMessage: message,
  });
  const fallbackProposal =
    parsedProposal ??
    inferSetupCopilotProposal({
      userMessage: message,
      workspaceSlug,
    });

  return NextResponse.json({
    ok: true,
    text: stripSetupCopilotProposalBlock(rawText),
    proposal: fallbackProposal,
    used_fallback: (data as { used_fallback?: boolean }).used_fallback ?? false,
    provider: (data as { provider?: string }).provider ?? "",
    model: (data as { model?: string }).model ?? "",
    budget_alert: (data as { budget_alert?: unknown }).budget_alert ?? null,
  });
}
