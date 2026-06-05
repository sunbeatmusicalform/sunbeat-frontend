import { NextResponse } from "next/server";

import {
  getBackendApiBaseUrl,
  getErrorMessage,
  parseJsonSafely,
} from "@/lib/server/backend-api";
import type {
  PeopleRegistryLookupItem,
  PeopleRegistryLookupResponse,
} from "@/lib/people-registry/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MIN_QUERY_LENGTH = 2;
const MAX_LIMIT = 10;

function boundedLimit(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return MAX_LIMIT;
  return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

function isLookupConfidence(value: unknown): value is "exact" | "partial" {
  return value === "exact" || value === "partial";
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function sanitizeLookupItem(value: unknown): PeopleRegistryLookupItem | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;
  const id = String(item.id || "").trim();
  const displayName = String(item.displayName || "").trim();
  const confidence = item.confidence;

  if (!id || !displayName || !isLookupConfidence(confidence)) {
    return null;
  }

  return {
    id,
    displayName,
    roles: toStringArray(item.roles),
    source: "people_registry",
    confidence,
  };
}

function sanitizeLookupResponse(value: unknown, limit: number) {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const items = Array.isArray(data.items) ? data.items : [];

  return {
    ok: true,
    items: items
      .map(sanitizeLookupItem)
      .filter((item): item is PeopleRegistryLookupItem => Boolean(item))
      .slice(0, limit),
  } satisfies PeopleRegistryLookupResponse;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await context.params;
  const url = new URL(req.url);
  const query = (url.searchParams.get("query") ?? "").trim();
  const roles = (url.searchParams.get("roles") ?? "").trim();
  const limit = boundedLimit(url.searchParams.get("limit"));

  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ ok: true, items: [] }, { headers });
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

  const upstreamUrl = new URL("/people-registry/lookup", base);
  upstreamUrl.searchParams.set("workspace_slug", workspaceSlug);
  upstreamUrl.searchParams.set("query", query);
  upstreamUrl.searchParams.set("limit", String(limit));
  if (roles) {
    upstreamUrl.searchParams.set("roles", roles);
  }

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
      { ok: false, error: "People lookup unavailable." },
      { status: upstream.status, headers }
    );
  }

  return NextResponse.json(sanitizeLookupResponse(data, limit), { headers });
}
