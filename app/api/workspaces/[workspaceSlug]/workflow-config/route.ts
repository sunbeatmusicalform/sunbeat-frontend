import { NextResponse } from "next/server";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { listRegisteredWorkflows, resolveWorkflowIdentity } from "@/lib/form-engine/workflow-registry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type WorkspaceFieldOverride = {
  workflow_type?: string | null;
  form_version?: string | null;
  step_key?: string | null;
  field_key?: string | null;
  sort_order?: number | null;
  created_at?: string | null;
};

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

    const [{ data: branding, error: brandingError }, { data: fieldOverrides, error: fieldOverridesError }] =
      await Promise.all([
        supabase
          .from("workspace_branding")
          .select("*")
          .eq("workspace_slug", workspaceSlug)
          .maybeSingle(),
        supabase
          .from("workspace_field_overrides")
          .select("*")
          .eq("workspace_slug", workspaceSlug)
          .neq("step_key", "__workspace_settings__")
          .neq("step_key", "__workspace_security__")
          .order("step_key", { ascending: true })
          .order("sort_order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: true }),
      ]);

    if (brandingError) {
      throw brandingError;
    }

    if (fieldOverridesError) {
      throw fieldOverridesError;
    }

    const scopedFieldOverrides = dedupeFieldOverrides(
      fieldOverrides ?? [],
      resolvedWorkflow
    );

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
