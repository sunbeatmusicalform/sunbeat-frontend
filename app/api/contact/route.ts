import { NextResponse } from "next/server";
import { getBackendApiBaseUrl, getErrorMessage } from "@/lib/server/backend-api";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  let base: string;
  try {
    base = getBackendApiBaseUrl();
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "Backend API URL não configurada.") },
      { status: 500 }
    );
  }

  try {
    const upstream = await fetch(`${base}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: data?.detail || data?.error || "Erro ao processar contato." },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ ok: true, ...data });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "Erro de conexão com o servidor.") },
      { status: 502 }
    );
  }
}
