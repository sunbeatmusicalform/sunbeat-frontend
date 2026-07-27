// app/api/people-registry/invites/[token]/email/route.ts
// Proxy autenticado para disparo de e-mail do link inteligente de cadastro.

import { NextResponse } from "next/server";
import {
  getBackendApiBaseUrl,
  getBackendInternalAdminHeaders,
  getErrorMessage,
} from "@/lib/server/backend-api";
import { authorizeWorkspaceUser } from "@/lib/server/workspace-route-access";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(req: Request, { params }: RouteContext) {
  const { token } = await params;

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

  let base: string;
  let adminHeaders: Record<string, string>;
  try {
    base = getBackendApiBaseUrl();
    adminHeaders = getBackendInternalAdminHeaders();
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        error: { message: getErrorMessage(error, "Serviço indisponível.") },
      },
      { status: 500 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/people-registry/invites/${encodeURIComponent(token)}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders },
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

  const text = await upstream.text();
  try {
    const json = JSON.parse(text);
    return NextResponse.json(json, { status: upstream.status });
  } catch {
    return new NextResponse(text, { status: upstream.status });
  }
}
