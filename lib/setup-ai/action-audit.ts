import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type SetupAIActionAuditOperation =
  | "read"
  | "preview_patch"
  | "apply_patch";

export type SetupAIActionAuditStatus =
  | "requested"
  | "succeeded"
  | "failed"
  | "blocked";

type JsonRecord = Record<string, unknown>;

export type CreateSetupAIActionAuditArgs = {
  workspaceSlug: string;
  workflowType: string;
  operation: SetupAIActionAuditOperation;
  status: SetupAIActionAuditStatus;
  actionType?: string;
  requestedByUserId?: string | null;
  requestedByEmail?: string | null;
  requestPayload?: JsonRecord;
  backendResponse?: unknown;
  errorMessage?: string | null;
  dryRun?: boolean | null;
  confirmed?: boolean | null;
};

export type UpdateSetupAIActionAuditArgs = {
  id: string;
  status: SetupAIActionAuditStatus;
  backendResponse?: unknown;
  errorMessage?: string | null;
  dryRun?: boolean | null;
  confirmed?: boolean | null;
};

export type SetupAIActionAuditEntry = {
  id: string;
  workspace_slug: string;
  workflow_type: string;
  surface: string;
  action_type: string;
  operation: SetupAIActionAuditOperation;
  status: SetupAIActionAuditStatus;
  requested_by_email: string | null;
  error_message: string | null;
  dry_run: boolean | null;
  confirmed: boolean | null;
  created_at: string;
  completed_at: string | null;
};

export type ListSetupAIActionAuditArgs = {
  workspaceSlug: string;
  limit?: number | null;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return String(error || "");
}

function safeJson(value: unknown) {
  if (value === undefined) {
    return null;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as unknown;
  } catch {
    return { serialization_error: true };
  }
}

export async function createSetupAIActionAudit(
  args: CreateSetupAIActionAuditArgs
) {
  try {
    const workspaceSlug = cleanText(args.workspaceSlug);
    const workflowType = cleanText(args.workflowType);

    if (!workspaceSlug || !workflowType) {
      return {
        ok: false as const,
        id: null,
        error: "workspaceSlug and workflowType are required for audit.",
      };
    }

    const admin = createSupabaseAdmin();
    const completedAt =
      args.status === "requested" ? null : new Date().toISOString();
    const { data, error } = await admin
      .from("setup_ai_action_audit")
      .insert({
        workspace_slug: workspaceSlug,
        workflow_type: workflowType,
        surface: "app_setup_copilot",
        action_type: cleanText(args.actionType) || "configure_airtable",
        operation: args.operation,
        status: args.status,
        requested_by_user_id: args.requestedByUserId ?? null,
        requested_by_email: args.requestedByEmail ?? null,
        request_payload: safeJson(args.requestPayload) ?? {},
        backend_response: safeJson(args.backendResponse),
        error_message: args.errorMessage ?? null,
        dry_run: args.dryRun ?? null,
        confirmed: args.confirmed ?? null,
        completed_at: completedAt,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false as const, id: null, error: error.message };
    }

    return {
      ok: true as const,
      id: cleanText((data as { id?: unknown } | null)?.id) || null,
      error: null,
    };
  } catch (error: unknown) {
    return { ok: false as const, id: null, error: getErrorMessage(error) };
  }
}

export async function updateSetupAIActionAudit(
  args: UpdateSetupAIActionAuditArgs
) {
  try {
    const id = cleanText(args.id);
    if (!id) {
      return { ok: false as const, error: "audit id is required." };
    }

    const admin = createSupabaseAdmin();
    const { error } = await admin
      .from("setup_ai_action_audit")
      .update({
        status: args.status,
        backend_response: safeJson(args.backendResponse),
        error_message: args.errorMessage ?? null,
        dry_run: args.dryRun ?? null,
        confirmed: args.confirmed ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { ok: false as const, error: error.message };
    }

    return { ok: true as const, error: null };
  } catch (error: unknown) {
    return { ok: false as const, error: getErrorMessage(error) };
  }
}

export async function listSetupAIActionAudit(
  args: ListSetupAIActionAuditArgs
) {
  try {
    const workspaceSlug = cleanText(args.workspaceSlug);
    if (!workspaceSlug) {
      return {
        ok: false as const,
        entries: [],
        error: "workspaceSlug is required.",
      };
    }

    const limit = Math.min(Math.max(Math.trunc(Number(args.limit) || 12), 1), 50);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("setup_ai_action_audit")
      .select(
        [
          "id",
          "workspace_slug",
          "workflow_type",
          "surface",
          "action_type",
          "operation",
          "status",
          "requested_by_email",
          "error_message",
          "dry_run",
          "confirmed",
          "created_at",
          "completed_at",
        ].join(", ")
      )
      .eq("workspace_slug", workspaceSlug)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { ok: false as const, entries: [], error: error.message };
    }

    return {
      ok: true as const,
      entries: (data ?? []) as unknown as SetupAIActionAuditEntry[],
      error: null,
    };
  } catch (error: unknown) {
    return { ok: false as const, entries: [], error: getErrorMessage(error) };
  }
}
