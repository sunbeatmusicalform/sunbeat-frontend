// app/api/people-registry/invites/route.ts
// Proxy server-side para listagem/criacao interna de convites de People Registry.

import { NextResponse } from "next/server";
import {
  getBackendApiBaseUrl,
  getBackendInternalAdminHeaders,
  getErrorMessage,
} from "@/lib/server/backend-api";
import { authorizeWorkspaceUser } from "@/lib/server/workspace-route-access";

async function resolveBackendBase() {
  try {
    return {
      ok: true as const,
      base: getBackendApiBaseUrl(),
      adminHeaders: getBackendInternalAdminHeaders(),
    };
  } catch (error: unknown) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          ok: false,
          status: "error",
          error: { message: getErrorMessage(error, "Serviço indisponível.") },
        },
        { status: 500 }
      ),
    };
  }
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const workspaceSlug = url.searchParams.get("workspace_slug")?.trim() ?? "";
  if (!workspaceSlug) {
    return NextResponse.json(
      { ok: false, status: "error", error: { message: "Workspace obrigatório." } },
      { status: 400 }
    );
  }

  const access = await authorizeWorkspaceUser(workspaceSlug);
  if ("response" in access) return access.response;

  const backend = await resolveBackendBase();
  if (!backend.ok) return backend.response;

  const upstreamUrl = new URL(`${backend.base}/people-registry/invites`);
  url.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.set(key, value);
  });

  try {
    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json", ...backend.adminHeaders },
    });
    return proxyJson(upstream);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        error: {
          message: getErrorMessage(error, "Não foi possível conectar ao servidor."),
        },
      },
      { status: 503 }
    );
  }
}

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, status: "error", error: { message: "Payload inválido." } },
      { status: 400 }
    );
  }

  const workspaceSlug =
    body && typeof body === "object" && "workspace_slug" in body
      ? String(body.workspace_slug || "").trim()
      : "";
  if (!workspaceSlug) {
    return NextResponse.json(
      { ok: false, status: "error", error: { message: "Workspace obrigatório." } },
      { status: 400 }
    );
  }

  const access = await authorizeWorkspaceUser(workspaceSlug);
  if ("response" in access) return access.response;

  const backend = await resolveBackendBase();
  if (!backend.ok) return backend.response;

  let upstream: Response;
  try {
    upstream = await fetch(`${backend.base}/people-registry/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...backend.adminHeaders },
      body: JSON.stringify(body),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        error: {
          message: getErrorMessage(error, "Não foi possível conectar ao servidor."),
        },
      },
      { status: 503 }
    );
  }

  return proxyJson(upstream);
}
