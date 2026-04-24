import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { sanitizeWorkspaceSlug } from "@/lib/tenant";
import {
  canAccessWorkspace,
  listAccessibleWorkspacesForUser,
} from "@/lib/workspace-access";

type BillingWorkspaceAuthorization =
  | { workspaceSlug: string }
  | { response: NextResponse };

export async function authorizeBillingWorkspaceAccess(
  workspaceSlug: unknown
): Promise<BillingWorkspaceAuthorization> {
  const normalizedWorkspaceSlug = sanitizeWorkspaceSlug(workspaceSlug);

  if (!normalizedWorkspaceSlug) {
    return {
      response: NextResponse.json(
        { ok: false, error: "workspace_slug é obrigatório." },
        { status: 400 }
      ),
    };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Autenticação necessária." },
        { status: 401 }
      ),
    };
  }

  const workspaces = await listAccessibleWorkspacesForUser({
    userId: user.id,
    email: user.email ?? null,
    metadataWorkspaceSlug: user.user_metadata?.workspace_slug,
  });

  if (!canAccessWorkspace({ workspaceSlug: normalizedWorkspaceSlug, workspaces })) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Workspace não disponível para este usuário." },
        { status: 403 }
      ),
    };
  }

  return { workspaceSlug: normalizedWorkspaceSlug };
}
