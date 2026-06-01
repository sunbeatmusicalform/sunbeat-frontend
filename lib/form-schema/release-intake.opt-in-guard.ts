export const RELEASE_INTAKE_SCHEMA_OPT_IN_WORKFLOW_TYPE = "release_intake";
export const RELEASE_INTAKE_SCHEMA_OPT_IN_PROTECTED_WORKSPACE = "atabaque";

export type ReleaseIntakeOptInDecisionInput = {
  workspaceSlug: string;
  workflowType: string;
  globalEnabled?: boolean;
  allowedWorkspaces?: readonly string[];
  atabaqueApproved?: boolean;
};

export type ReleaseIntakeOptInDecisionReason =
  | "global_disabled"
  | "workflow_mismatch"
  | "workspace_not_allowlisted"
  | "atabaque_requires_manual_approval"
  | "allowed";

export type ReleaseIntakeOptInDecision = {
  useSchemaRenderer: boolean;
  reason: ReleaseIntakeOptInDecisionReason;
};

function normalizeWorkspaceSlug(value: string) {
  return value.trim().toLowerCase();
}

function normalizeWorkflowType(value: string) {
  return value.trim();
}

function isWorkspaceAllowlisted(
  workspaceSlug: string,
  allowedWorkspaces: readonly string[] | undefined
) {
  if (!allowedWorkspaces?.length) return false;

  const normalizedWorkspaceSlug = normalizeWorkspaceSlug(workspaceSlug);

  return allowedWorkspaces
    .map((allowedWorkspace) => normalizeWorkspaceSlug(allowedWorkspace))
    .includes(normalizedWorkspaceSlug);
}

export function decideReleaseIntakeSchemaOptIn(
  input: ReleaseIntakeOptInDecisionInput
): ReleaseIntakeOptInDecision {
  if (input.globalEnabled !== true) {
    return { useSchemaRenderer: false, reason: "global_disabled" };
  }

  if (
    normalizeWorkflowType(input.workflowType) !==
    RELEASE_INTAKE_SCHEMA_OPT_IN_WORKFLOW_TYPE
  ) {
    return { useSchemaRenderer: false, reason: "workflow_mismatch" };
  }

  if (!isWorkspaceAllowlisted(input.workspaceSlug, input.allowedWorkspaces)) {
    return {
      useSchemaRenderer: false,
      reason: "workspace_not_allowlisted",
    };
  }

  if (
    normalizeWorkspaceSlug(input.workspaceSlug) ===
      RELEASE_INTAKE_SCHEMA_OPT_IN_PROTECTED_WORKSPACE &&
    input.atabaqueApproved !== true
  ) {
    return {
      useSchemaRenderer: false,
      reason: "atabaque_requires_manual_approval",
    };
  }

  return { useSchemaRenderer: true, reason: "allowed" };
}
