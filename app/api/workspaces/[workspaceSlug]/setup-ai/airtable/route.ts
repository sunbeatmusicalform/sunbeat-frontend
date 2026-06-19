import { NextResponse } from "next/server";

import { getBackendApiBaseUrl } from "@/lib/server/backend-api";
import { isInternalAdminUser } from "@/lib/internal-admin";
import {
  createSetupAIActionAudit,
  updateSetupAIActionAudit,
} from "@/lib/setup-ai/action-audit";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  canAccessWorkspace,
  listAccessibleWorkspacesForUser,
} from "@/lib/workspace-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SetupAIAirtableOperation = "read" | "preview_patch" | "apply_patch";

type SetupAIAirtableRequestBody = {
  operation?: SetupAIAirtableOperation;
  workflow_type?: string;
  confirm_apply?: boolean;
  airtable_sync_enabled?: boolean;
  airtable?: Record<string, unknown> | null;
};

async function authorizeWorkspaceConfigAccess(workspaceSlug: string) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Autenticacao necessaria." },
        { status: 401 }
      ),
    };
  }

  const workspaces = await listAccessibleWorkspacesForUser({
    userId: user.id,
    email: user.email ?? null,
    metadataWorkspaceSlug: user.user_metadata?.workspace_slug,
  });

  if (!canAccessWorkspace({ workspaceSlug, workspaces })) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Workspace nao disponivel para este usuario." },
        { status: 403 }
      ),
    };
  }

  return { user };
}

function getInternalAdminToken() {
  return (
    process.env.BACKEND_INTERNAL_ADMIN_TOKEN?.trim() ||
    process.env.INTERNAL_ADMIN_TOKEN?.trim() ||
    ""
  );
}

function isSetupAIApplyEnabled() {
  return process.env.SUNBEAT_SETUP_AI_APPLY_ENABLED === "true";
}

function normalizeWorkflowType(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOperation(value: unknown): SetupAIAirtableOperation | null {
  if (
    value === "read" ||
    value === "preview_patch" ||
    value === "apply_patch"
  ) {
    return value;
  }

  return null;
}

function hasPatchFields(body: SetupAIAirtableRequestBody) {
  return (
    "airtable_sync_enabled" in body ||
    (body.airtable != null && Object.keys(body.airtable).length > 0)
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await context.params;
  const access = await authorizeWorkspaceConfigAccess(workspaceSlug);
  if ("response" in access) {
    return access.response;
  }

  let body: SetupAIAirtableRequestBody;
  try {
    body = (await request.json()) as SetupAIAirtableRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload invalido." },
      { status: 400 }
    );
  }

  const operation = normalizeOperation(body.operation);
  const workflowType = normalizeWorkflowType(body.workflow_type);

  if (!operation) {
    return NextResponse.json(
      { ok: false, error: "Operacao invalida." },
      { status: 400 }
    );
  }

  if (!workflowType) {
    return NextResponse.json(
      { ok: false, error: "workflow_type e obrigatorio." },
      { status: 400 }
    );
  }

  if (operation !== "read" && !hasPatchFields(body)) {
    return NextResponse.json(
      {
        ok: false,
        error: "preview/apply exige airtable_sync_enabled ou airtable.",
      },
      { status: 400 }
    );
  }

  if (operation === "read" && hasPatchFields(body)) {
    return NextResponse.json(
      { ok: false, error: "read nao aceita patch." },
      { status: 400 }
    );
  }

  if (operation === "apply_patch") {
    if (!isSetupAIApplyEnabled()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Aplicacao real de Setup AI esta desativada neste ambiente.",
        },
        { status: 403 }
      );
    }

    if (body.confirm_apply !== true) {
      return NextResponse.json(
        { ok: false, error: "apply_patch exige confirm_apply=true." },
        { status: 400 }
      );
    }

    if (!isInternalAdminUser(access.user)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Aplicacao real ainda esta limitada a administradores internos.",
        },
        { status: 403 }
      );
    }
  }

  let backendBase: string;
  try {
    backendBase = getBackendApiBaseUrl();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Backend URL not configured" },
      { status: 503 }
    );
  }

  const adminToken = getInternalAdminToken();
  if (!adminToken) {
    return NextResponse.json(
      { ok: false, error: "Internal admin token not configured" },
      { status: 503 }
    );
  }

  const upstreamPayload: Record<string, unknown> = {
    operation,
    workspace_slug: workspaceSlug,
    workflow_type: workflowType,
  };

  if (operation === "apply_patch") {
    upstreamPayload.confirm_apply = true;
  }
  if ("airtable_sync_enabled" in body) {
    upstreamPayload.airtable_sync_enabled = body.airtable_sync_enabled;
  }
  if (body.airtable != null) {
    upstreamPayload.airtable = body.airtable;
  }

  const auditStart = await createSetupAIActionAudit({
    workspaceSlug,
    workflowType,
    operation,
    status: operation === "apply_patch" ? "requested" : "requested",
    actionType: "configure_airtable",
    requestedByUserId: access.user.id,
    requestedByEmail: access.user.email ?? null,
    requestPayload: upstreamPayload,
  });

  if (operation === "apply_patch" && !auditStart.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Auditoria de Setup AI indisponivel; apply_patch foi bloqueado.",
        audit_error: auditStart.error,
      },
      { status: 503 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${backendBase}/internal/config/setup-ai/airtable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Token": adminToken,
      },
      body: JSON.stringify(upstreamPayload),
    });
  } catch (error: unknown) {
    if (auditStart.id) {
      await updateSetupAIActionAudit({
        id: auditStart.id,
        status: "failed",
        errorMessage:
          error instanceof Error
            ? error.message
            : "Could not reach config backend",
        dryRun: operation !== "apply_patch",
        confirmed: operation === "apply_patch",
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not reach config backend",
      },
      { status: 502 }
    );
  }

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    const detail = data as { detail?: { message?: string } | string };
    const message =
      typeof detail.detail === "string"
        ? detail.detail
        : detail.detail?.message;

    if (auditStart.id) {
      await updateSetupAIActionAudit({
        id: auditStart.id,
        status: "failed",
        backendResponse: data,
        errorMessage: message ?? "Setup AI Airtable action failed",
        dryRun: operation !== "apply_patch",
        confirmed: operation === "apply_patch",
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: message ?? "Setup AI Airtable action failed",
      },
      { status: upstream.status }
    );
  }

  if (auditStart.id) {
    await updateSetupAIActionAudit({
      id: auditStart.id,
      status: "succeeded",
      backendResponse: data,
      dryRun: operation !== "apply_patch",
      confirmed: operation === "apply_patch",
    });
  }

  return NextResponse.json({
    ok: true,
    data,
    audit_id: auditStart.id,
    audit_warning: auditStart.ok ? null : auditStart.error,
  });
}
