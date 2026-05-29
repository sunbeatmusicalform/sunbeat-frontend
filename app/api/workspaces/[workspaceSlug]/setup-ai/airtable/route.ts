import { NextResponse } from "next/server";

import {
  isSetupAiAirtableOperation,
  isSetupAiAirtableWorkflow,
} from "@/lib/setup-ai/airtable-config";
import { isInternalAdminUser } from "@/lib/internal-admin";
import {
  getBackendApiBaseUrl,
  parseJsonSafely,
} from "@/lib/server/backend-api";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

function getStringField(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await context.params;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonResponse({ ok: false, error: "Authentication required" }, 401);
  }

  if (!isInternalAdminUser(user)) {
    return jsonResponse({ ok: false, error: "Internal admin access required" }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse({ ok: false, error: "Invalid request body" }, 400);
  }

  const bodyRecord = body as Record<string, unknown>;
  const operation = getStringField(bodyRecord, "operation");
  const workflowType = getStringField(bodyRecord, "workflow_type");

  if (!isSetupAiAirtableOperation(operation)) {
    return jsonResponse({ ok: false, error: "Unsupported operation" }, 400);
  }

  if (!isSetupAiAirtableWorkflow(workflowType)) {
    return jsonResponse({ ok: false, error: "Unsupported workflow_type" }, 400);
  }

  let backendBase: string;
  try {
    backendBase = getBackendApiBaseUrl();
  } catch {
    return jsonResponse({ ok: false, error: "Backend URL not configured" }, 503);
  }

  const adminToken = process.env.INTERNAL_ADMIN_TOKEN?.trim();
  if (!adminToken) {
    return jsonResponse(
      { ok: false, error: "Internal admin token not configured" },
      503
    );
  }

  const upstreamPayload = {
    ...bodyRecord,
    operation,
    workflow_type: workflowType,
    workspace_slug: workspaceSlug,
  };

  let upstream: Response;
  try {
    upstream = await fetch(`${backendBase}/internal/config/setup-ai/airtable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Token": adminToken,
      },
      body: JSON.stringify(upstreamPayload),
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not reach backend setup AI Airtable endpoint",
      },
      502
    );
  }

  const text = await upstream.text();
  const data = parseJsonSafely(text) ?? {
    ok: false,
    error: text || "Setup AI Airtable request failed",
  };

  return jsonResponse(data, upstream.status);
}
