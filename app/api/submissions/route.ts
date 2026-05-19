import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getTenantFromHost } from "@/lib/tenant";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  getBackendApiBaseUrl,
  getErrorMessage,
  parseJsonSafely,
} from "@/lib/server/backend-api";

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  let base: string;

  try {
    base = getBackendApiBaseUrl();
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "Backend API URL is not set") },
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

  let upstream: Response;

  try {
    upstream = await fetch(`${base}/submissions`, {
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
      cache: "no-store",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "Could not reach submissions backend"),
      },
      { status: 502 }
    );
  }

  const text = await upstream.text();
  const json = parseJsonSafely(text);

  if (json !== null) {
    return NextResponse.json(json, { status: upstream.status });
  }

  return NextResponse.json(
    {
      ok: upstream.ok,
      error: text || "Submission request failed",
    },
    { status: upstream.status }
  );
}
