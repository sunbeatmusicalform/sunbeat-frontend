import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  buildWorkspaceUrl,
  isSunbeatRootHost,
  sanitizeWorkspaceSlug,
} from "@/lib/tenant";

function safeNext(next: string | null) {
  // Prevent open-redirects. Only allow internal paths.
  if (!next) return "/app";
  if (!next.startsWith("/")) return "/app";
  return next;
}

function buildLoginRedirectUrl(args: {
  origin: string;
  next: string;
  error?: string;
  workspaceSlug?: string | null;
}) {
  const redirect = new URL("/login", args.origin);
  redirect.searchParams.set("next", args.next);

  if (args.error) {
    redirect.searchParams.set("error", args.error);
  }

  if (args.workspaceSlug) {
    redirect.searchParams.set("workspace", args.workspaceSlug);
  }

  return redirect;
}

function buildSessionRestoreRedirect(args: {
  workspaceSlug: string;
  next: string;
  accessToken: string;
  refreshToken: string;
}) {
  const redirect = new URL(
    buildWorkspaceUrl(args.workspaceSlug, "/auth/session-restore")
  );

  redirect.hash = [
    `at=${encodeURIComponent(args.accessToken)}`,
    `rt=${encodeURIComponent(args.refreshToken)}`,
    `next=${encodeURIComponent(args.next)}`,
  ].join("&");

  return redirect;
}

async function resolveWorkspaceSlugForAuth(args: {
  userId?: string | null;
  email?: string | null;
  workspaceHint?: string | null;
  metadataWorkspaceSlug?: unknown;
}) {
  const workspaceHint = sanitizeWorkspaceSlug(args.workspaceHint);
  if (workspaceHint) {
    return workspaceHint;
  }

  const metadataWorkspaceSlug = sanitizeWorkspaceSlug(
    args.metadataWorkspaceSlug
  );
  if (metadataWorkspaceSlug) {
    return metadataWorkspaceSlug;
  }

  const admin = createSupabaseAdmin();

  if (args.userId) {
    const { data, error } = await admin
      .from("workspace_users")
      .select("workspace_slug")
      .eq("user_id", args.userId)
      .limit(1);

    if (!error) {
      const membership = Array.isArray(data) ? data[0] : data;
      const membershipSlug = sanitizeWorkspaceSlug(
        membership?.workspace_slug
      );

      if (membershipSlug) {
        return membershipSlug;
      }
    }
  }

  const normalizedEmail = String(args.email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const { data, error } = await admin
    .from("workspaces")
    .select("slug")
    .eq("owner_email", normalizedEmail)
    .limit(1);

  if (error) {
    return null;
  }

  const workspace = Array.isArray(data) ? data[0] : data;
  return sanitizeWorkspaceSlug(workspace?.slug);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const workspaceHint = sanitizeWorkspaceSlug(
    url.searchParams.get("workspace") ??
      url.searchParams.get("workspace_slug")
  );

  // Sem code: volta pro login
  if (!code) {
    const redirect = buildLoginRedirectUrl({
      origin: url.origin,
      next,
      workspaceSlug: workspaceHint,
    });
    return NextResponse.redirect(redirect);
  }

  const res = new NextResponse(null, { status: 302 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const redirect = buildLoginRedirectUrl({
      origin: url.origin,
      next,
      error: "otp_failed",
      workspaceSlug: workspaceHint,
    });
    return NextResponse.redirect(redirect);
  }

  let redirect = new URL(next, url.origin);
  const shouldTransferSessionToWorkspace =
    isSunbeatRootHost(url.hostname) && next.startsWith("/app");

  if (shouldTransferSessionToWorkspace) {
    const workspaceSlug = await resolveWorkspaceSlugForAuth({
      userId: data.user?.id ?? data.session?.user?.id ?? null,
      email: data.user?.email ?? data.session?.user?.email ?? null,
      workspaceHint,
      metadataWorkspaceSlug: data.user?.user_metadata?.workspace_slug,
    });

    if (
      workspaceSlug &&
      data.session?.access_token &&
      data.session?.refresh_token
    ) {
      redirect = buildSessionRestoreRedirect({
        workspaceSlug,
        next,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      });
    } else {
      await supabase.auth.signOut();
      redirect = buildLoginRedirectUrl({
        origin: url.origin,
        next,
        error: workspaceSlug ? "session_transfer_failed" : "workspace_required",
        workspaceSlug,
      });
    }
  }

  res.headers.set("Location", redirect.toString());
  return res;
}
