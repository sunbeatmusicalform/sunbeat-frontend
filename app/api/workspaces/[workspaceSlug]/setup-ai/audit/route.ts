import { NextResponse } from "next/server";

import { listSetupAIActionAudit } from "@/lib/setup-ai/action-audit";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  canAccessWorkspace,
  listAccessibleWorkspacesForUser,
} from "@/lib/workspace-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function authorizeWorkspaceAuditAccess(workspaceSlug: string) {
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

function parseLimit(value: string | null) {
  if (!value) {
    return 12;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 12;
}

function isMissingAuditTable(error: string) {
  const normalized = error.toLowerCase();
  return (
    normalized.includes("setup_ai_action_audit") &&
    (normalized.includes("does not exist") ||
      normalized.includes("could not find") ||
      normalized.includes("schema cache"))
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await context.params;
  const access = await authorizeWorkspaceAuditAccess(workspaceSlug);
  if ("response" in access) {
    return access.response;
  }

  const url = new URL(request.url);
  const result = await listSetupAIActionAudit({
    workspaceSlug,
    limit: parseLimit(url.searchParams.get("limit")),
  });

  if (!result.ok) {
    if (isMissingAuditTable(result.error)) {
      return NextResponse.json(
        {
          ok: true,
          data: [],
          warning:
            "Tabela de auditoria setup_ai_action_audit ainda nao foi criada.",
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }

    return NextResponse.json(
      { ok: false, error: result.error },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }

  return NextResponse.json(
    { ok: true, data: result.entries },
    {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
