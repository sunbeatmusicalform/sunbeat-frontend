import type { BillingTier } from "@/lib/billing/catalog";

export const FREE_ASSET_RETENTION_DAYS = 60;

export type PlanProductCapabilities = {
  maxActiveWorkflows: number | null;
  enabledWorkflowTypes: string[] | null;
  assetRetentionDays: number | null;
};

const CAPABILITIES: Record<BillingTier, PlanProductCapabilities> = {
  free: {
    maxActiveWorkflows: 1,
    enabledWorkflowTypes: ["release_intake"],
    assetRetentionDays: FREE_ASSET_RETENTION_DAYS,
  },
  starter: {
    maxActiveWorkflows: 2,
    enabledWorkflowTypes: ["release_intake", "rights_clearance"],
    assetRetentionDays: null,
  },
  pro: {
    maxActiveWorkflows: 5,
    enabledWorkflowTypes: [
      "release_intake",
      "rights_clearance",
      "company_registry",
      "people_registry",
    ],
    assetRetentionDays: null,
  },
  enterprise: {
    maxActiveWorkflows: null,
    enabledWorkflowTypes: null,
    assetRetentionDays: null,
  },
  enterprise_core: {
    maxActiveWorkflows: null,
    enabledWorkflowTypes: null,
    assetRetentionDays: null,
  },
  enterprise_ops: {
    maxActiveWorkflows: null,
    enabledWorkflowTypes: null,
    assetRetentionDays: null,
  },
  enterprise_distribution: {
    maxActiveWorkflows: null,
    enabledWorkflowTypes: null,
    assetRetentionDays: null,
  },
};

export function getPlanProductCapabilities(
  planId: string
): PlanProductCapabilities {
  return (
    CAPABILITIES[planId as BillingTier] ?? {
      maxActiveWorkflows: 1,
      enabledWorkflowTypes: ["release_intake"],
      assetRetentionDays: FREE_ASSET_RETENTION_DAYS,
    }
  );
}

export function isWorkflowAllowedForPlan(
  planId: string,
  workflowType: string
) {
  const allowed = getPlanProductCapabilities(planId).enabledWorkflowTypes;
  return allowed === null || allowed.includes(workflowType);
}
