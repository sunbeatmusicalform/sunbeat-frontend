import { NextResponse } from "next/server";

import { sanitizeWorkspaceSlug } from "@/lib/tenant";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";

type BillingWorkspaceAuthorization =
  | { workspaceSlug: string; userId: string }
  | { response: NextResponse };

const BILLING_ROLES = new Set(["owner", "admin"]);

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

  const admin = createSupabaseAdmin();
  const [{ data: workspace, error: workspaceError }, { data: membership }] =
    await Promise.all([
      admin
        .from("workspaces")
        .select("slug, owner_email")
        .eq("slug", normalizedWorkspaceSlug)
        .maybeSingle(),
      admin
        .from("workspace_users")
        .select("role")
        .eq("workspace_slug", normalizedWorkspaceSlug)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (workspaceError || !workspace) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Workspace não encontrado." },
        { status: 404 }
      ),
    };
  }

  const normalizedUserEmail = String(user.email || "").trim().toLowerCase();
  const normalizedOwnerEmail = String(workspace.owner_email || "")
    .trim()
    .toLowerCase();
  const isOwnerEmail =
    Boolean(normalizedUserEmail) && normalizedUserEmail === normalizedOwnerEmail;
  const hasBillingRole = BILLING_ROLES.has(
    String(membership?.role || "").trim().toLowerCase()
  );

  if (!isOwnerEmail && !hasBillingRole) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Sem permissão para gerenciar a assinatura deste workspace." },
        { status: 403 }
      ),
    };
  }

  return { workspaceSlug: normalizedWorkspaceSlug, userId: user.id };
}
