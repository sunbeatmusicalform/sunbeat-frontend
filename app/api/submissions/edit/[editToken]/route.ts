import { NextResponse } from "next/server";
import { getBackendApiBaseUrl, parseJsonSafely } from "@/lib/server/backend-api";

export async function GET(
  _req: Request,
  context: { params: Promise<{ editToken: string }> }
) {
  const { editToken } = await context.params;
  const apiBaseUrl = getBackendApiBaseUrl();

  const res = await fetch(`${apiBaseUrl}/submissions/edit/${editToken}`, {
    method: "GET",
    cache: "no-store",
  });

  const text = await res.text();
  const data = parseJsonSafely(text);

  return NextResponse.json(data, {
    status: res.status,
  });
}
