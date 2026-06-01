import {
  decideReleaseIntakeSchemaOptIn,
  type ReleaseIntakeOptInDecision,
} from "./release-intake.opt-in-guard";

export type ReleaseIntakeOptInGuardHarnessAssertion = {
  name: string;
  passed: boolean;
  detail: string;
};

export type ReleaseIntakeOptInGuardHarnessResult = {
  ok: boolean;
  assertions: ReleaseIntakeOptInGuardHarnessAssertion[];
};

function assertHarness(
  name: string,
  decision: ReleaseIntakeOptInDecision,
  expected: ReleaseIntakeOptInDecision,
  detail: string
): ReleaseIntakeOptInGuardHarnessAssertion {
  return {
    name,
    passed:
      decision.useSchemaRenderer === expected.useSchemaRenderer &&
      decision.reason === expected.reason,
    detail,
  };
}

export function runReleaseIntakeOptInGuardHarness(): ReleaseIntakeOptInGuardHarnessResult {
  const assertions = [
    assertHarness(
      "global-missing-is-disabled",
      decideReleaseIntakeSchemaOptIn({
        workspaceSlug: "internal-demo",
        workflowType: "release_intake",
        allowedWorkspaces: ["internal-demo"],
      }),
      { useSchemaRenderer: false, reason: "global_disabled" },
      "Absent globalEnabled keeps the schema renderer disabled."
    ),
    assertHarness(
      "global-false-is-disabled",
      decideReleaseIntakeSchemaOptIn({
        workspaceSlug: "internal-demo",
        workflowType: "release_intake",
        globalEnabled: false,
        allowedWorkspaces: ["internal-demo"],
      }),
      { useSchemaRenderer: false, reason: "global_disabled" },
      "Explicit false globalEnabled keeps the schema renderer disabled."
    ),
    assertHarness(
      "workflow-mismatch-falls-back",
      decideReleaseIntakeSchemaOptIn({
        workspaceSlug: "internal-demo",
        workflowType: "rights_clearance",
        globalEnabled: true,
        allowedWorkspaces: ["internal-demo"],
      }),
      { useSchemaRenderer: false, reason: "workflow_mismatch" },
      "Only release_intake can pass this guard."
    ),
    assertHarness(
      "missing-allowlist-falls-back",
      decideReleaseIntakeSchemaOptIn({
        workspaceSlug: "internal-demo",
        workflowType: "release_intake",
        globalEnabled: true,
      }),
      { useSchemaRenderer: false, reason: "workspace_not_allowlisted" },
      "A workspace allowlist is required."
    ),
    assertHarness(
      "workspace-outside-allowlist-falls-back",
      decideReleaseIntakeSchemaOptIn({
        workspaceSlug: "internal-demo",
        workflowType: "release_intake",
        globalEnabled: true,
        allowedWorkspaces: ["another-workspace"],
      }),
      { useSchemaRenderer: false, reason: "workspace_not_allowlisted" },
      "Workspace must be explicitly allowlisted."
    ),
    assertHarness(
      "atabaque-needs-manual-approval",
      decideReleaseIntakeSchemaOptIn({
        workspaceSlug: "atabaque",
        workflowType: "release_intake",
        globalEnabled: true,
        allowedWorkspaces: ["atabaque"],
      }),
      {
        useSchemaRenderer: false,
        reason: "atabaque_requires_manual_approval",
      },
      "Atabaque cannot pass without explicit human approval."
    ),
    assertHarness(
      "atabaque-can-pass-only-after-approval",
      decideReleaseIntakeSchemaOptIn({
        workspaceSlug: "atabaque",
        workflowType: "release_intake",
        globalEnabled: true,
        allowedWorkspaces: ["atabaque"],
        atabaqueApproved: true,
      }),
      { useSchemaRenderer: true, reason: "allowed" },
      "Atabaque can only pass when allowlisted and approved."
    ),
    assertHarness(
      "non-atabaque-allowlisted-workspace-can-pass",
      decideReleaseIntakeSchemaOptIn({
        workspaceSlug: "internal-demo",
        workflowType: "release_intake",
        globalEnabled: true,
        allowedWorkspaces: ["internal-demo"],
      }),
      { useSchemaRenderer: true, reason: "allowed" },
      "A non-Atabaque allowlisted release_intake workspace can pass."
    ),
  ];

  return {
    ok: assertions.every((assertion) => assertion.passed),
    assertions,
  };
}

export const releaseIntakeOptInGuardHarnessResult =
  runReleaseIntakeOptInGuardHarness();
