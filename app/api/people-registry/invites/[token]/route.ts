// app/api/people-registry/invites/[token]/route.ts
// Proxy server-side para GET /people-registry/invites/{token} no backend Fly.

import { NextResponse } from "next/server";
import {
  getBackendApiBaseUrl,
  getErrorMessage,
} from "@/lib/server/backend-api";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { token } = await params;

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
    upstream = await fetch(`${base}/people-registry/invites/${encodeURIComponent(token)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
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
