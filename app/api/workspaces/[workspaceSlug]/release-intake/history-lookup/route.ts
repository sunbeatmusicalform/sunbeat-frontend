import { NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getErrorMessage,
  parseJsonSafely,
} from "@/lib/server/backend-api";
import {
  isReleaseIntakeSubmitterHistoryField,
  type ReleaseIntakeSubmitterHistoryField,
  type ReleaseIntakeSubmitterHistoryLookupItem,
  type ReleaseIntakeSubmitterHistoryLookupResponse,
} from "@/lib/form-engine/submitter-history-lookup";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MIN_QUERY_LENGTH = 2;
const MAX_LIMIT = 10;

function boundedLimit(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return MAX_LIMIT;
  return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

function emptyResponse() {
  return { ok: true, items: [] } satisfies ReleaseIntakeSubmitterHistoryLookupResponse;
}

function sanitizeLookupItem(
  value: unknown,
  expectedField: ReleaseIntakeSubmitterHistoryField
): ReleaseIntakeSubmitterHistoryLookupItem | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;
  const suggestion = String(item.value || "").trim();
  const field = String(item.field || "").trim();
  const count = Number(item.count);
  const lastUsedAt = item.lastUsedAt == null ? null : String(item.lastUsedAt).trim();

  if (
    !suggestion ||
    field !== expectedField ||
    item.source !== "submitter_history" ||
    !Number.isFinite(count) ||
    count < 1
  ) {
    return null;
  }

  return {
    value: suggestion,
    field: expectedField,
    source: "submitter_history",
    count,
    lastUsedAt: lastUsedAt || null,
  };
}

function sanitizeLookupResponse(
  value: unknown,
  limit: number,
  expectedField: ReleaseIntakeSubmitterHistoryField
) {
  const data =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const items = Array.isArray(data.items) ? data.items : [];

  return {
    ok: true,
    items: items
      .map((item) => sanitizeLookupItem(item, expectedField))
      .filter(
        (item): item is ReleaseIntakeSubmitterHistoryLookupItem => Boolean(item)
      )
      .slice(0, limit),
  } satisfies ReleaseIntakeSubmitterHistoryLookupResponse;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await context.params;
  const url = new URL(req.url);
  const field = (url.searchParams.get("field") ?? "").trim();
  const query = (url.searchParams.get("query") ?? "").trim();
  const draftToken = (url.searchParams.get("draftToken") ?? "").trim();
  const editToken = (url.searchParams.get("editToken") ?? "").trim();
  const limit = boundedLimit(url.searchParams.get("limit"));

  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };

  if (
    query.length < MIN_QUERY_LENGTH ||
    !isReleaseIntakeSubmitterHistoryField(field) ||
    Boolean(draftToken) === Boolean(editToken)
  ) {
    return NextResponse.json(emptyResponse(), { headers });
  }

  let base: string;

  try {
    base = getBackendApiBaseUrl();
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "Servico indisponivel."),
      },
      { status: 500, headers }
    );
  }

  const upstreamUrl = new URL("/release-intake/history-lookup", base);
  upstreamUrl.searchParams.set("workspace_slug", workspaceSlug);
  upstreamUrl.searchParams.set("field", field);
  upstreamUrl.searchParams.set("query", query);
  upstreamUrl.searchParams.set("limit", String(limit));
  if (draftToken) upstreamUrl.searchParams.set("draft_token", draftToken);
  if (editToken) upstreamUrl.searchParams.set("edit_token", editToken);

  let upstream: Response;

  try {
    upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "Nao foi possivel conectar ao servidor."),
      },
      { status: 503, headers }
    );
  }

  const text = await upstream.text();
  const data = parseJsonSafely(text);

  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, error: "Submitter history lookup unavailable." },
      { status: upstream.status, headers }
    );
  }

  return NextResponse.json(sanitizeLookupResponse(data, limit, field), { headers });
}
