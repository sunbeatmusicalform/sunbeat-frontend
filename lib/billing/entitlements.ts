import "server-only";

import type { BillingEntitlements } from "@/lib/workspace-config/types";
import { loadWorkspaceConfigReadModel } from "@/lib/workspace-config/read-model";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlanProductCapabilities } from "@/lib/billing/plan-capabilities";

export async function getWorkspaceEntitlements(
  workspaceSlug: string
): Promise<BillingEntitlements> {
  const config = await loadWorkspaceConfigReadModel({ workspaceSlug });
  const billing = config.billingAndEntitlements;

  if (billing.state !== "loaded") {
    throw new Error("Entitlements do workspace não estão disponíveis.");
  }

  return billing.entitlements;
}

export async function isWorkspaceWorkflowEnabled(
  workspaceSlug: string,
  workflowType: string
) {
  const supabase = createSupabaseAdmin();
  const [{ data: workspace, error: workspaceError }, { data: override }] =
    await Promise.all([
      supabase
        .from("workspaces")
        .select("plan_id")
        .eq("slug", workspaceSlug)
        .maybeSingle(),
      supabase
        .from("workspace_plan_overrides")
        .select("enabled_workflow_types")
        .eq("workspace_slug", workspaceSlug)
        .maybeSingle(),
    ]);

  if (workspaceError || !workspace) return false;
  const overrideTypes = override?.enabled_workflow_types;
  const enabled = Array.isArray(overrideTypes)
    ? overrideTypes.filter((value): value is string => typeof value === "string")
    : getPlanProductCapabilities(String(workspace.plan_id || "free"))
        .enabledWorkflowTypes;
  return enabled === null || enabled.includes(workflowType);
}
