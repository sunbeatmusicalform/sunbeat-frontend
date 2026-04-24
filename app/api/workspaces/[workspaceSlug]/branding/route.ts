import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  canAccessWorkspace,
  listAccessibleWorkspacesForUser,
} from "@/lib/workspace-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function authorizeWorkspaceEditorAccess(workspaceSlug: string) {
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

  if (!canAccessWorkspace({ workspaceSlug, workspaces })) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Workspace não disponível para este usuário." },
        { status: 403 }
      ),
    };
  }

  return { user };
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await context.params;
  const access = await authorizeWorkspaceEditorAccess(workspaceSlug);
  if ("response" in access) return access.response;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("workspace_branding")
    .select("*")
    .eq("workspace_slug", workspaceSlug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, branding: data });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await context.params;
  const access = await authorizeWorkspaceEditorAccess(workspaceSlug);
  if ("response" in access) return access.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload inválido." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();

  // Build a selective patch — only include fields that are explicitly present in the body
  const patch: Record<string, unknown> = {};

  if ("workspace_name" in body) {
    patch.workspace_name = normalizeText(body.workspace_name) ?? workspaceSlug;
  }
  if ("slogan" in body) patch.slogan = normalizeText(body.slogan);
  if ("form_title" in body) patch.form_title = normalizeText(body.form_title);
  if ("intro_text" in body) patch.intro_text = normalizeText(body.intro_text);
  if ("success_message" in body) {
    patch.success_message = normalizeText(body.success_message);
  }
  if ("logo_url" in body) patch.logo_url = normalizeText(body.logo_url);
  if ("banner_url" in body) patch.banner_url = normalizeText(body.banner_url);
  if ("social_image_url" in body) {
    patch.social_image_url = normalizeText(body.social_image_url);
  }
  if ("social_title" in body) {
    patch.social_title = normalizeText(body.social_title);
  }
  if ("social_description" in body) {
    patch.social_description = normalizeText(body.social_description);
  }
  if ("submission_email_enabled" in body) {
    patch.submission_email_enabled = normalizeBoolean(
      body.submission_email_enabled,
      true
    );
  }
  if ("public_edit_allowed" in body) {
    patch.public_edit_allowed = normalizeBoolean(
      body.public_edit_allowed,
      false
    );
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { ok: false, error: "Nenhum campo para atualizar." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("workspace_branding")
    .upsert(
      { workspace_slug: workspaceSlug, ...patch },
      { onConflict: "workspace_slug" }
    )
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, branding: data });
}
