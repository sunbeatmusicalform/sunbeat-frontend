import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export async function POST(req: Request) {
  let body: {
    name?: string;
    email?: string;
    password?: string;
    workspace_name?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Corpo inválido." }, { status: 400 });
  }

  const { name, email, password, workspace_name } = body;

  if (!name?.trim() || !email?.trim() || !password || !workspace_name?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Todos os campos são obrigatórios." },
      { status: 422 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "A senha deve ter pelo menos 8 caracteres." },
      { status: 422 }
    );
  }

  const admin = createSupabaseAdmin();
  const normalizedEmail = email.trim().toLowerCase();
  const workspaceSlug = slugify(workspace_name.trim());

  if (!workspaceSlug || workspaceSlug.length < 2) {
    return NextResponse.json(
      { ok: false, error: "Nome do workspace inválido. Use letras e números." },
      { status: 422 }
    );
  }

  // Check if workspace slug already taken
  const { data: existingWorkspace } = await admin
    .from("workspaces")
    .select("slug")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (existingWorkspace) {
    return NextResponse.json(
      {
        ok: false,
        error: `O workspace "${workspaceSlug}" já existe. Escolha outro nome.`,
        field: "workspace_name",
      },
      { status: 409 }
    );
  }

  // Create user with admin API (auto-confirms email for immediate access)
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name.trim(),
      workspace_slug: workspaceSlug,
    },
  });

  if (userError) {
    if (userError.message.toLowerCase().includes("already")) {
      return NextResponse.json(
        { ok: false, error: "Este e-mail já está cadastrado. Faça login.", field: "email" },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, error: userError.message }, { status: 400 });
  }

  const userId = userData.user.id;

  // Create workspace record
  const { error: wsError } = await admin.from("workspaces").insert({
    slug: workspaceSlug,
    name: workspace_name.trim(),
    plan_id: "starter",
    owner_email: normalizedEmail,
  });

  if (wsError) {
    // Rollback user creation
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { ok: false, error: "Erro ao criar workspace. Tente novamente." },
      { status: 500 }
    );
  }

  // Create workspace_users membership
  const { error: memberError } = await admin.from("workspace_users").insert({
    workspace_slug: workspaceSlug,
    user_id: userId,
    role: "owner",
  });

  if (memberError) {
    // Workspace was created — don't roll back, just log
    console.error("workspace_users insert error:", memberError);
  }

  // Also create a minimal workspace_branding record so dashboard loads
  await admin.from("workspace_branding").insert({
    workspace_slug: workspaceSlug,
    workspace_name: workspace_name.trim(),
  }).maybeSingle();

  return NextResponse.json({
    ok: true,
    workspace_slug: workspaceSlug,
  });
}
