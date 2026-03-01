import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) {
    return NextResponse.json(
      { ok: false, error: "NEXT_PUBLIC_API_URL is not set" },
      { status: 500 }
    )
  }

  // garante que não duplica barras
  const base = apiUrl.replace(/\/+$/, "")

  const upstream = await fetch(`${base}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  const text = await upstream.text()

  // tenta devolver JSON; se não for, devolve texto puro
  try {
    const json = JSON.parse(text)
    return NextResponse.json(json, { status: upstream.status })
  } catch {
    return new NextResponse(text, { status: upstream.status })
  }
}