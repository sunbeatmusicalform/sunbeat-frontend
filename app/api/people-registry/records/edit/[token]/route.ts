// app/api/people-registry/records/edit/[token]/route.ts
// Proxy server-side para GET + PATCH /people-registry/records/edit/{token} no backend Fly

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
      { ok: false, status: "error", error: { message: getErrorMessage(error, "Serviço indisponível.") } },
      { status: 500 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/people-registry/records/edit/${encodeURIComponent(token)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, status: "error", error: { message: getErrorMessage(error, "Não foi possível conectar ao servidor.") } },
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

export async function PATCH(req: Request, { params }: RouteContext) {
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
      { ok: false, status: "error", error: { message: getErrorMessage(error, "Serviço indisponível.") } },
      { status: 500 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/people-registry/records/edit/${encodeURIComponent(token)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, status: "error", error: { message: getErrorMessage(error, "Não foi possível conectar ao servidor.") } },
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
