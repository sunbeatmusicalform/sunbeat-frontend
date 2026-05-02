// lib/workspace-config/workflow-access.ts
// Enforcement guard for enabled_workflows per tenant.
//
// Semantics:
//   - enabled_workflows = NULL  → ALL workflows enabled (backward-compatible default)
//   - enabled_workflows = []    → treated as null (all enabled — normalized at write time)
//   - enabled_workflows = [...]  → only listed workflow types are active
//
// Usage: call from public-route layout.tsx (Server Component only).
// Zero impact on submit/edit flows — purely a gate at the route level.

import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Returns true if the workflow is accessible for the given workspace.
 * Falls back to true on any DB error to avoid blocking legitimate traffic.
 */
export async function isWorkflowEnabledForWorkspace(
  workspaceSlug: string,
  workflowType: string
): Promise<boolean> {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("workspace_branding")
      .select("enabled_workflows")
      .eq("workspace_slug", workspaceSlug)
      .maybeSingle();

    // No row at all → workspace uses defaults → all enabled
    if (error || !data) return true;

    // NULL → all workflows enabled (explicit default semantics)
    if (data.enabled_workflows === null) return true;

    // Array present → check membership
    if (Array.isArray(data.enabled_workflows)) {
      return (data.enabled_workflows as string[]).includes(workflowType);
    }

    // Fallback: allow
    return true;
  } catch {
    // Never block on infra error — fail open
    return true;
  }
}
