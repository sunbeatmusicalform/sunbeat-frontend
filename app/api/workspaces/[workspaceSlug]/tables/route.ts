import { NextResponse } from "next/server";

import { isSunbeatTablesEnabled } from "@/lib/features/sunbeat-tables";
import { loadOperationalTablesReadModel } from "@/lib/tables/read-model";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  canAccessWorkspace,
  listAccessibleWorkspacesForUser,
} from "@/lib/workspace-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function authorizeWorkspaceReadAccess(workspaceSlug: string) {
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
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await context.params;
  if (!isSunbeatTablesEnabled(workspaceSlug)) {
    return NextResponse.json(
      { ok: false, error: "Sunbeat Tables nao esta habilitado." },
      { status: 404 }
    );
  }

  const access = await authorizeWorkspaceReadAccess(workspaceSlug);
  if ("response" in access) {
    return access.response;
  }

  const url = new URL(request.url);

  try {
    const data = await loadOperationalTablesReadModel({
      workspaceSlug,
      workflowType: url.searchParams.get("workflow_type"),
      query: url.searchParams.get("q"),
      limit: parseLimit(url.searchParams.get("limit")),
    });

    return NextResponse.json(
      { ok: true, data },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar Sunbeat Tables.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}
