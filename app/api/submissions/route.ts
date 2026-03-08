import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getTenantFromHost } from "@/lib/tenant";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { ok: false, error: "NEXT_PUBLIC_API_URL is not set" },
      { status: 500 }
    );
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const tenant = getTenantFromHost(host);

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  const base = apiUrl.replace(/\/+$/, "");

  const upstream = await fetch(`${base}/submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(tenant?.value ? { "X-Tenant-Value": tenant.value } : {}),
      ...(tenant?.type ? { "X-Tenant-Type": tenant.type } : {}),
      ...(user?.id ? { "X-User-Id": user.id } : {}),
      ...(user?.email ? { "X-User-Email": user.email } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const text = await upstream.text();

  try {
    const json = JSON.parse(text);
    return NextResponse.json(json, { status: upstream.status });
  } catch {
    return new NextResponse(text, { status: upstream.status });
  }
}