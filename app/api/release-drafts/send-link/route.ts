import { NextResponse } from "next/server";
import {
  getBackendApiBaseUrl,
  getErrorMessage,
  parseJsonSafely,
} from "@/lib/server/backend-api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiBaseUrl = getBackendApiBaseUrl();

    const res = await fetch(`${apiBaseUrl}/release-drafts/send-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await res.text();
    const data = parseJsonSafely(text);

    if (data !== null) {
      return NextResponse.json(data, {
        status: res.status,
      });
    }

    return NextResponse.json(
      {
        ok: res.ok,
        message: text || "Failed to send draft link email",
      },
      { status: res.status }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(error, "Failed to send draft link email"),
      },
      { status: 500 }
    );
  }
}
