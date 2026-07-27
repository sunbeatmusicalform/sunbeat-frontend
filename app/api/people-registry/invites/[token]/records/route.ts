// app/api/people-registry/invites/[token]/records/route.ts
// Proxy server-side para POST /people-registry/invites/{token}/records no backend Fly.

import { NextResponse } from "next/server";
import {
  getBackendApiBaseUrl,
  getErrorMessage,
} from "@/lib/server/backend-api";

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

  let base: string;
  try {
    base = getBackendApiBaseUrl();
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
    upstream = await fetch(`${base}/people-registry/invites/${encodeURIComponent(token)}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
