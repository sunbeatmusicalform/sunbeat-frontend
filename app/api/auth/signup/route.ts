import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendSignupConfirmationEmail } from "@/lib/email/signup-confirmation";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import {
  buildWorkspaceUrl,
  resolveWorkspaceBaseDomain,
} from "@/lib/tenant";

export const dynamic = "force-dynamic";

const TERMS_VERSION = "sunbeat-terms-2026-08-07";
const PRIVACY_VERSION = "sunbeat-privacy-2026-08-07";
const RESERVED_WORKSPACE_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "academy",
  "help",
  "mail",
  "start",
  "status",
  "support",
  "www",
]);

function json(
  body: Record<string, unknown>,
  init?: { status?: number }
) {
  return NextResponse.json(body, {
    ...init,
    headers: { "Cache-Control": "no-store" },
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

async function rollbackProvisioning(args: {
  admin: ReturnType<typeof createSupabaseAdmin>;
  userId: string;
  workspaceSlug: string;
}) {
  const { admin, userId, workspaceSlug } = args;

  await admin
    .from("workspace_branding")
    .delete()
    .eq("workspace_slug", workspaceSlug);
  await admin
    .from("workspace_users")
    .delete()
    .eq("workspace_slug", workspaceSlug)
    .eq("user_id", userId);
  await admin.from("workspaces").delete().eq("slug", workspaceSlug);
  await admin.auth.admin.deleteUser(userId);
}

async function sendSupabaseMagicLink(args: {
  email: string;
  redirectTo: string;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return { ok: false as const, reason: "missing_configuration" as const };
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await authClient.auth.signInWithOtp({
    email: args.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: args.redirectTo,
    },
  });

  if (error) {
    console.error("[auth/signup] Supabase magic-link fallback failed:", error);
    return { ok: false as const, reason: "provider_error" as const };
  }

  return { ok: true as const };
}

export async function POST(req: Request) {
  if (process.env.SELF_SERVICE_SIGNUP_ENABLED === "false") {
    return json(
      { ok: false, error: "Novos cadastros estão temporariamente fechados." },
      { status: 503 }
    );
  }

  let body: {
    name?: string;
    email?: string;
    workspace_name?: string;
    turnstile_token?: string;
    plan_intent?: string;
    terms_accepted?: boolean;
    company_website?: string;
    form_started_at?: number;
  };

  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Corpo inválido." }, { status: 400 });
  }

  const {
    name,
    email,
    workspace_name,
    turnstile_token,
    plan_intent,
    terms_accepted,
    company_website,
    form_started_at,
  } = body;

  if (!name?.trim() || !email?.trim() || !workspace_name?.trim()) {
    return json(
      { ok: false, error: "Todos os campos são obrigatórios." },
      { status: 422 }
    );
  }

  if (terms_accepted !== true) {
    return json(
      { ok: false, error: "Confirme os Termos de Uso e a Política de Privacidade." },
      { status: 422 }
    );
  }

  const elapsedMs = Date.now() - Number(form_started_at || 0);
  if (company_website?.trim() || elapsedMs < 1_200 || elapsedMs > 2 * 60 * 60 * 1000) {
    return json(
      { ok: false, error: "Não foi possível validar o formulário. Recarregue a página." },
      { status: 422 }
    );
  }

  if (process.env.TURNSTILE_SECRET_KEY?.trim()) {
    if (!turnstile_token?.trim()) {
      return json(
        { ok: false, error: "Conclua a verificação de segurança." },
        { status: 422 }
      );
    }

    const remoteIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip");
    const captcha = await verifyTurnstileToken({
      token: turnstile_token.trim(),
      remoteIp,
      expectedAction: "signup",
    });

    if (!captcha.ok) {
      return json(
        {
          ok: false,
          error:
            captcha.reason === "unavailable"
              ? "A verificação de segurança está indisponível. Tente novamente."
              : "A verificação de segurança expirou ou não foi aceita. Tente novamente.",
        },
        { status: captcha.reason === "unavailable" ? 503 : 422 }
      );
    }
  }

  const admin = createSupabaseAdmin();
  const normalizedEmail = email.trim().toLowerCase();
  const workspaceSlug = slugify(workspace_name.trim());
  const normalizedPlanIntent =
    plan_intent === "starter" || plan_intent === "pro" ? plan_intent : null;

  if (!workspaceSlug || workspaceSlug.length < 2) {
    return json(
      { ok: false, error: "Nome do workspace inválido. Use letras e números." },
      { status: 422 }
    );
  }

  if (RESERVED_WORKSPACE_SLUGS.has(workspaceSlug)) {
    return json(
      {
        ok: false,
        error: `O endereço "${workspaceSlug}" é reservado. Escolha outro nome.`,
        field: "workspace_name",
      },
      { status: 409 }
    );
  }

  // Check if workspace slug already taken
  const { data: existingWorkspace } = await admin
    .from("workspaces")
    .select("slug")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (existingWorkspace) {
    return json(
      {
        ok: false,
        error: `O workspace "${workspaceSlug}" já existe. Escolha outro nome.`,
        field: "workspace_name",
      },
      { status: 409 }
    );
  }

  const workspaceDomain = resolveWorkspaceBaseDomain(req.headers.get("host"));
  const callbackUrl = new URL(
    buildWorkspaceUrl(workspaceSlug, "/auth/callback", { domain: workspaceDomain })
  );
  callbackUrl.searchParams.set("workspace", workspaceSlug);
  callbackUrl.searchParams.set(
    "next",
    normalizedPlanIntent
      ? `/app/settings/plan?plan_intent=${normalizedPlanIntent}`
      : "/app"
  );
  const acceptedAt = new Date().toISOString();
  const generatedPassword = `${crypto.randomUUID()}-${crypto.randomUUID()}`;

  // Generate an unconfirmed user and a one-time confirmation link.
  const { data: userData, error: userError } =
    await admin.auth.admin.generateLink({
      type: "signup",
      email: normalizedEmail,
      password: generatedPassword,
      options: {
        redirectTo: callbackUrl.toString(),
        data: {
          full_name: name.trim(),
          workspace_slug: workspaceSlug,
          self_service: true,
          signup_market: workspaceDomain === "sunbeat.com.br" ? "brazil" : "global",
          asset_retention_days: 60,
          terms_accepted_at: acceptedAt,
          terms_version: TERMS_VERSION,
          privacy_version: PRIVACY_VERSION,
        },
      },
    });

  if (userError || !userData.user || !userData.properties?.action_link) {
    if (userError?.message.toLowerCase().includes("already")) {
      return json(
        { ok: false, error: "Este e-mail já está cadastrado. Faça login.", field: "email" },
        { status: 409 }
      );
    }
    console.error("[auth/signup] user creation error:", userError);
    return json(
      { ok: false, error: "Não foi possível criar a conta. Revise os dados e tente novamente." },
      { status: 400 }
    );
  }

  const userId = userData.user.id;
  const confirmationUrl = userData.properties.action_link;

  // Create workspace record
  const { error: wsError } = await admin.from("workspaces").insert({
    slug: workspaceSlug,
    name: workspace_name.trim(),
    plan_id: "free",
    owner_email: normalizedEmail,
  });

  if (wsError) {
    await admin.auth.admin.deleteUser(userId);
    return json(
      { ok: false, error: "Erro ao criar workspace. Tente novamente." },
      { status: 500 }
    );
  }

  const { error: memberError } = await admin.from("workspace_users").insert({
    workspace_slug: workspaceSlug,
    user_id: userId,
    role: "owner",
  });

  if (memberError) {
    console.error("[auth/signup] membership creation error:", memberError);
    await rollbackProvisioning({ admin, userId, workspaceSlug });
    return json(
      { ok: false, error: "Não foi possível concluir a criação do workspace. Tente novamente." },
      { status: 500 }
    );
  }

  const { error: brandingError } = await admin
    .from("workspace_branding")
    .insert({
      workspace_slug: workspaceSlug,
      workspace_name: workspace_name.trim(),
      enabled_workflows: ["release_intake"],
    });

  if (brandingError) {
    console.error("[auth/signup] branding creation error:", brandingError);
    await rollbackProvisioning({ admin, userId, workspaceSlug });
    return json(
      { ok: false, error: "Não foi possível concluir a configuração inicial. Tente novamente." },
      { status: 500 }
    );
  }

  let emailDelivery: "resend" | "supabase_magic_link" = "resend";
  const confirmationEmail = await sendSignupConfirmationEmail({
    email: normalizedEmail,
    name: name.trim(),
    workspaceName: workspace_name.trim(),
    confirmationUrl,
    locale: workspaceDomain === "sunbeat.com.br" ? "pt-BR" : "en",
  });

  if (!confirmationEmail.ok) {
    const fallbackEmail = await sendSupabaseMagicLink({
      email: normalizedEmail,
      redirectTo: callbackUrl.toString(),
    });

    if (!fallbackEmail.ok) {
      await rollbackProvisioning({ admin, userId, workspaceSlug });
      return json(
        { ok: false, error: "Não foi possível enviar o magic link. Tente novamente." },
        { status: 503 }
      );
    }

    emailDelivery = "supabase_magic_link";
  }

  return json({
    ok: true,
    workspace_slug: workspaceSlug,
    requires_email_confirmation: true,
    email_delivery: emailDelivery,
  });
}
