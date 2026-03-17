import { NextResponse } from "next/server";
import { getBackendApiBaseUrl, getErrorMessage } from "@/lib/server/backend-api";

export async function GET(
  _req: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await context.params;

  let base: string;

  try {
    base = getBackendApiBaseUrl();
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "Backend API URL is not set") },
      { status: 500 }
    );
  }
  const upstream = await fetch(
    `${base}/workspaces/${workspaceSlug}/release-intake-config`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const text = await upstream.text();

  try {
    const json = JSON.parse(text);
    return NextResponse.json(json, { status: upstream.status });
  } catch {
    return new NextResponse(text, { status: upstream.status });
  }
}
