import { NextResponse } from "next/server";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { listRegisteredWorkflows, resolveWorkflowIdentity } from "@/lib/form-engine/workflow-registry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const WORKSPACE_SETTINGS_STEP_KEY = "__workspace_settings__";
const WORKSPACE_SECURITY_STEP_KEY = "__workspace_security__";
const LEGACY_EDITOR_WORKFLOW_TYPE = "release_intake";
const LEGACY_EDITOR_FORM_VERSION = "legacy_v1";
const FIELD_OVERRIDE_SELECT_WITH_SCOPE =
  "id, workspace_slug, workflow_type, form_version, step_key, field_key, label_override, helper_text_override, placeholder_override, is_required, is_visible, sort_order, created_at, updated_at";
const FIELD_OVERRIDE_SELECT_LEGACY =
  "id, workspace_slug, step_key, field_key, label_override, helper_text_override, placeholder_override, is_required, is_visible, sort_order, created_at, updated_at";

type WorkspaceFieldOverride = {
  workspace_slug?: string | null;
  workflow_type?: string | null;
  form_version?: string | null;
  step_key?: string | null;
  field_key?: string | null;
  label_override?: string | null;
  helper_text_override?: string | null;
  placeholder_override?: string | null;
  is_required?: boolean | null;
  is_visible?: boolean | null;
  sort_order?: number | null;
  created_at?: string | null;
};

function isSettingsOrSecurityStep(stepKey?: string | null) {
  return (
    stepKey === WORKSPACE_SETTINGS_STEP_KEY ||
    stepKey === WORKSPACE_SECURITY_STEP_KEY
  );
}

function hasMissingWorkflowScopeColumns(error: unknown) {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";

  return (
    message.includes(
      "column workspace_field_overrides.workflow_type does not exist"
    ) ||
    message.includes(
      "column workspace_field_overrides.form_version does not exist"
    )
  );
}

async function loadWorkspaceFieldOverrides(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  workspaceSlug: string
) {
  const scopedResult = await supabase
    .from("workspace_field_overrides")
    .select(FIELD_OVERRIDE_SELECT_WITH_SCOPE)
    .eq("workspace_slug", workspaceSlug)
    .order("step_key", { ascending: true })
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (!scopedResult.error) {
    return {
      rows: (scopedResult.data ?? []) as WorkspaceFieldOverride[],
      error: null,
      supportsWorkflowScopeColumns: true,
    };
  }

  if (!hasMissingWorkflowScopeColumns(scopedResult.error)) {
    return {
      rows: null,
      error: scopedResult.error,
      supportsWorkflowScopeColumns: true,
    };
  }

  const legacyResult = await supabase
    .from("workspace_field_overrides")
    .select(FIELD_OVERRIDE_SELECT_LEGACY)
    .eq("workspace_slug", workspaceSlug)
    .order("step_key", { ascending: true })
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  return {
    rows: (legacyResult.data ?? []) as WorkspaceFieldOverride[],
    error: legacyResult.error,
    supportsWorkflowScopeColumns: false,
  };
}

function matchesWorkflowScope(
  fieldOverride: WorkspaceFieldOverride,
  resolvedWorkflow: ReturnType<typeof resolveWorkflowIdentity>
) {
  const workflowType = String(fieldOverride.workflow_type || "").trim();
  if (workflowType && workflowType !== resolvedWorkflow.workflowType) {
    return false;
  }

  const formVersion = String(fieldOverride.form_version || "").trim();
  if (formVersion && formVersion !== resolvedWorkflow.formVersion) {
    return false;
  }

  return true;
}

function getWorkflowScopePriority(
  fieldOverride: WorkspaceFieldOverride,
  resolvedWorkflow: ReturnType<typeof resolveWorkflowIdentity>
) {
  let priority = 0;

  const workflowType = String(fieldOverride.workflow_type || "").trim();
  if (workflowType === resolvedWorkflow.workflowType) {
    priority += 2;
  }

  const formVersion = String(fieldOverride.form_version || "").trim();
  if (formVersion === resolvedWorkflow.formVersion) {
    priority += 1;
  }

  return priority;
}

function dedupeFieldOverrides(
  fieldOverrides: WorkspaceFieldOverride[],
  resolvedWorkflow: ReturnType<typeof resolveWorkflowIdentity>
) {
  const selected = new Map<
    string,
    {
      item: WorkspaceFieldOverride;
      priority: number;
      index: number;
    }
  >();

  fieldOverrides.forEach((item, index) => {
    if (!matchesWorkflowScope(item, resolvedWorkflow)) {
      return;
    }

    const dedupeKey = `${item.step_key ?? ""}:${item.field_key ?? ""}`;
    const candidate = {
      item,
      priority: getWorkflowScopePriority(item, resolvedWorkflow),
      index,
    };
    const existing = selected.get(dedupeKey);

    if (
      !existing ||
      candidate.priority > existing.priority ||
      (candidate.priority === existing.priority &&
        candidate.index > existing.index)
    ) {
      selected.set(dedupeKey, candidate);
    }
  });

  return Array.from(selected.values())
    .map((entry) => entry.item)
    .sort((a, b) => {
      const stepComparison = String(a.step_key || "").localeCompare(
        String(b.step_key || "")
      );
      if (stepComparison !== 0) {
        return stepComparison;
      }

      const sortOrderComparison =
        (a.sort_order ?? 9999) - (b.sort_order ?? 9999);
      if (sortOrderComparison !== 0) {
        return sortOrderComparison;
      }

      return String(a.created_at || "").localeCompare(String(b.created_at || ""));
    });
}

function filterWorkflowFieldOverrides(args: {
  fieldOverrides: WorkspaceFieldOverride[];
  resolvedWorkflow: ReturnType<typeof resolveWorkflowIdentity>;
  supportsWorkflowScopeColumns: boolean;
}) {
  const baseRows = args.fieldOverrides.filter(
    (fieldOverride) => !isSettingsOrSecurityStep(fieldOverride.step_key)
  );

  if (!args.supportsWorkflowScopeColumns) {
    const isLegacyReleaseIntake =
      args.resolvedWorkflow.workflowType === LEGACY_EDITOR_WORKFLOW_TYPE &&
      args.resolvedWorkflow.formVersion === LEGACY_EDITOR_FORM_VERSION;

    if (!isLegacyReleaseIntake) {
      return [];
    }
  }

  return dedupeFieldOverrides(baseRows, args.resolvedWorkflow);
}

export async function GET(
  req: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await context.params;
  const url = new URL(req.url);
  const resolvedWorkflow = resolveWorkflowIdentity({
    workspaceSlug,
    workflowType: url.searchParams.get("workflow_type"),
    formVersion: url.searchParams.get("form_version"),
  });

  try {
    const supabase = createSupabaseAdmin();

    const [{ data: branding, error: brandingError }, fieldOverridesResult] =
      await Promise.all([
        supabase
          .from("workspace_branding")
          .select("*")
          .eq("workspace_slug", workspaceSlug)
          .maybeSingle(),
        loadWorkspaceFieldOverrides(supabase, workspaceSlug),
      ]);

    if (brandingError) {
      throw brandingError;
    }

    if (fieldOverridesResult.error) {
      throw fieldOverridesResult.error;
    }

    const scopedFieldOverrides = filterWorkflowFieldOverrides({
      fieldOverrides: fieldOverridesResult.rows ?? [],
      resolvedWorkflow,
      supportsWorkflowScopeColumns:
        fieldOverridesResult.supportsWorkflowScopeColumns,
    });

    return NextResponse.json(
      {
        ok: true,
        workspace_slug: workspaceSlug,
        workflow_type: resolvedWorkflow.workflowType,
        form_version: resolvedWorkflow.formVersion,
        workflow_status: resolvedWorkflow.status,
        available_workflows: listRegisteredWorkflows(),
        branding: branding ?? null,
        field_overrides: scopedFieldOverrides,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Could not load workflow config";

    return NextResponse.json(
      { ok: false, error: message },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}

// ── PUT: save field overrides for a specific workflow type ──────────────────
export async function PUT(
  req: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await context.params;

  try {
    const body = await req.json() as {
      workflow_type?: string;
      form_version?: string;
      overrides?: Array<{
        step_key: string;
        field_key: string;
        label_override?: string | null;
        helper_text_override?: string | null;
        is_required?: boolean;
        is_visible?: boolean;
        sort_order?: number | null;
      }>;
    };

    const resolvedWorkflow = resolveWorkflowIdentity({
      workspaceSlug,
      workflowType: body.workflow_type,
      formVersion: body.form_version,
    });
    const overrides = Array.isArray(body.overrides) ? body.overrides : [];

    const supabase = createSupabaseAdmin();
    const fieldOverridesResult = await loadWorkspaceFieldOverrides(
      supabase,
      workspaceSlug
    );

    if (fieldOverridesResult.error) {
      return NextResponse.json(
        { ok: false, error: fieldOverridesResult.error.message },
        { status: 500 }
      );
    }

    if (!fieldOverridesResult.supportsWorkflowScopeColumns) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Este workspace ainda usa schema legado sem workflow_type/form_version. O save por workflow foi bloqueado para evitar mistura ambigua entre intake e rights clearance.",
        },
        { status: 409 }
      );
    }

    // Delete existing overrides for this workflow_type + workspace
    const { error: deleteError } = await supabase
      .from("workspace_field_overrides")
      .delete()
      .eq("workspace_slug", workspaceSlug)
      .eq("workflow_type", resolvedWorkflow.workflowType);

    if (deleteError) {
      return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 });
    }

    if (overrides.length > 0) {
      const rows = overrides.map((override) => ({
        workspace_slug: workspaceSlug,
        workflow_type: resolvedWorkflow.workflowType,
        form_version: resolvedWorkflow.formVersion,
        step_key: override.step_key,
        field_key: override.field_key,
        label_override: override.label_override ?? null,
        helper_text_override: override.helper_text_override ?? null,
        is_required: typeof override.is_required === "boolean" ? override.is_required : null,
        is_visible: typeof override.is_visible === "boolean" ? override.is_visible : null,
        sort_order: override.sort_order ?? null,
      }));

      const { error: insertError } = await supabase
        .from("workspace_field_overrides")
        .insert(rows);

      if (insertError) {
        return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not save workflow config";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
