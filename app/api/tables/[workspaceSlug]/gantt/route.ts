import { NextResponse } from "next/server";
import {
  getBackendApiBaseUrl,
  getBackendInternalAdminHeaders,
  getErrorMessage,
} from "@/lib/server/backend-api";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  canAccessWorkspace,
  listAccessibleWorkspacesForUser,
} from "@/lib/workspace-access";

type RouteContext = { params: Promise<{ workspaceSlug: string }> };

async function requireWorkspaceUser(workspaceSlug: string) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { ok: false, error: { message: "Não autenticado." } },
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
        { ok: false, error: { message: "Workspace não disponível para este usuário." } },
        { status: 403 }
      ),
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return { user, accessToken: session?.access_token ?? null };
}

async function proxyJson(upstream: Response) {
  const text = await upstream.text();

  try {
    const json = JSON.parse(text);
    return NextResponse.json(json, { status: upstream.status });
  } catch {
    return new NextResponse(text, { status: upstream.status });
  }
}

export async function GET(req: Request, { params }: RouteContext) {
  const { workspaceSlug } = await params;
  const access = await requireWorkspaceUser(workspaceSlug);
  if ("response" in access) {
    return access.response;
  }

  let base: string;
  let adminHeaders: Record<string, string>;
  try {
    base = getBackendApiBaseUrl();
    adminHeaders = getBackendInternalAdminHeaders();
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: getErrorMessage(error, "Serviço indisponível.") },
      },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const upstreamUrl = new URL(`${base}/tables/${encodeURIComponent(workspaceSlug)}/gantt`);
  const limit = url.searchParams.get("limit");
  if (limit) upstreamUrl.searchParams.set("limit", limit);

  try {
    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...adminHeaders,
        ...(access.accessToken ? { Authorization: `Bearer ${access.accessToken}` } : {}),
      },
      cache: "no-store",
    });
    return proxyJson(upstream);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: getErrorMessage(error, "Não foi possível conectar ao servidor."),
        },
      },
      { status: 503 }
    );
  }
}
