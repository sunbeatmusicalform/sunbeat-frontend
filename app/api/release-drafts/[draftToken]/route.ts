import { NextResponse } from "next/server";
import {
  getBackendApiBaseUrl,
  getErrorMessage,
  parseJsonSafely,
} from "@/lib/server/backend-api";

export async function GET(
  _req: Request,
  context: { params: Promise<{ draftToken: string }> }
) {
  try {
    const { draftToken } = await context.params;
    const apiBaseUrl = getBackendApiBaseUrl();

    const res = await fetch(`${apiBaseUrl}/release-drafts/${draftToken}`, {
      method: "GET",
      cache: "no-store",
    });

    const text = await res.text();
    const data = parseJsonSafely(text);

    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(error, "Failed to load draft"),
      },
      { status: 500 }
    );
  }
}
