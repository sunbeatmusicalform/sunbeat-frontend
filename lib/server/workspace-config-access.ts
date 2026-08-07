import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import { sanitizeWorkspaceSlug } from "@/lib/tenant";

const CONFIGURATOR_ROLES = new Set(["owner", "admin"]);

export async function authorizeWorkspaceConfigurator(workspaceSlugInput: string) {
  const workspaceSlug = sanitizeWorkspaceSlug(workspaceSlugInput);
  if (!workspaceSlug) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Workspace inválido." },
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

  const admin = createSupabaseAdmin();
  const [{ data: membership, error: membershipError }, { data: workspace, error: workspaceError }] =
    await Promise.all([
      admin
        .from("workspace_users")
        .select("role")
        .eq("workspace_slug", workspaceSlug)
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("workspaces")
        .select("owner_email")
        .eq("slug", workspaceSlug)
        .maybeSingle(),
    ]);

  if (membershipError || workspaceError) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Não foi possível validar as permissões do workspace." },
        { status: 503 }
      ),
    };
  }

  const role = String(membership?.role || "").trim().toLowerCase();
  const ownerEmail = String(workspace?.owner_email || "").trim().toLowerCase();
  const userEmail = String(user.email || "").trim().toLowerCase();
  const canConfigure = CONFIGURATOR_ROLES.has(role) || Boolean(userEmail && userEmail === ownerEmail);

  if (!canConfigure) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Apenas owners e admins podem configurar este workspace." },
        { status: 403 }
      ),
    };
  }

  return { user, workspaceSlug, role: role || "owner" };
}
