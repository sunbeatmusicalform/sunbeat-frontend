import { NextResponse } from "next/server";
import {
  getBackendApiBaseUrl,
  getBackendInternalAdminHeaders,
  getErrorMessage,
} from "@/lib/server/backend-api";
import { createSupabaseServer } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ workspaceSlug: string }> };

async function requireUser() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
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
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { message: "Não autenticado." } },
      { status: 401 }
    );
  }

  const { workspaceSlug } = await params;
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
      headers: { "Content-Type": "application/json", ...adminHeaders },
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
