export type ReleaseIntakeReadinessStatus =
  | "ready_candidate"
  | "needs_runtime_adapter"
  | "needs_opt_in_guard"
  | "blocked";

export type ReleaseIntakeReadinessRisk = "low" | "medium" | "high";

export type ReleaseIntakeReadinessArea =
  | "schema_coverage"
  | "renderer_preview"
  | "draft_parity"
  | "submit_parity"
  | "upload_parity"
  | "feature_flag"
  | "atabaque_default"
  | "workspace_tenant_guard"
  | "rollback"
  | "smoke_tests"
  | "airtable"
  | "drive"
  | "email"
  | "mobile_responsiveness"
  | "observability_logs";

export type ReleaseIntakeReadinessEntry = {
  area: ReleaseIntakeReadinessArea;
  status: ReleaseIntakeReadinessStatus;
  evidence: readonly string[];
  risk: ReleaseIntakeReadinessRisk;
  nextPr: string;
  acceptanceCriteria: readonly string[];
};

export type ReleaseIntakeOptInGuardrail = {
  id: string;
  requirement: string;
  reason: string;
};

export type ReleaseIntakeActivationChecklistItem = {
  id: string;
  category:
    | "routing"
    | "draft"
    | "submit"
    | "upload"
    | "integration"
    | "ui"
    | "ops";
  item: string;
  requiredBefore: "internal_opt_in" | "atabaque_opt_in" | "general_rollout";
};

export type ReleaseIntakeRollbackStep = {
  order: number;
  action: string;
  verification: string;
};

export type ReleaseIntakeFutureIntegrationTouchpoint = {
  area: string;
  futureFiles: readonly string[];
  requiredGuards: readonly string[];
  forbiddenInReadinessPr: readonly string[];
};

export const releaseIntakeIntegrationReadiness = [
  {
    area: "schema_coverage",
    status: "ready_candidate",
    evidence: [
      "lib/form-schema/release-intake.schema.ts",
      "docs/release-intake-schema-parity.md",
      "draft, submit and upload adapter harnesses cover the current candidate shape",
    ],
    risk: "medium",
    nextPr: "Schema gap review for marketing visibility and conditionals.",
    acceptanceCriteria: [
      "Candidate keeps the four-step release intake shape.",
      "Known visual-only and runtime-only gaps remain documented.",
      "No runtime payload contract changes are required for the candidate to render.",
    ],
  },
  {
    area: "renderer_preview",
    status: "ready_candidate",
    evidence: [
      "components/form-renderer/*",
      "app/dev/schema-renderer/release-intake/page.tsx",
      "production dev routes call notFound()",
    ],
    risk: "medium",
    nextPr: "Internal opt-in renderer experiment behind explicit guard.",
    acceptanceCriteria: [
      "Preview renders all four steps.",
      "Preview remains dev/internal only until a guarded runtime PR exists.",
      "No default renderer selection changes.",
    ],
  },
  {
    area: "draft_parity",
    status: "ready_candidate",
    evidence: [
      "lib/form-schema/release-intake.draft-adapter.ts",
      "lib/form-schema/release-intake.draft-adapter.harness.ts",
      "docs/release-intake-draft-adapter.md",
    ],
    risk: "high",
    nextPr: "Draft runtime bridge prototype behind opt-in guard.",
    acceptanceCriteria: [
      "Runtime draft save/resume remains unchanged without the guard.",
      "Adapter preserves matched fields and reports visual-only fields.",
      "Edit-mode hydration is tested before Atabaque opt-in.",
    ],
  },
  {
    area: "submit_parity",
    status: "ready_candidate",
    evidence: [
      "lib/form-schema/release-intake.submit-adapter.ts",
      "lib/form-schema/release-intake.submit-adapter.harness.ts",
      "docs/release-intake-submit-parity.md",
    ],
    risk: "high",
    nextPr: "Submit bridge comparison against buildWorkflowSubmitPayload.",
    acceptanceCriteria: [
      "Candidate payload matches active submit expectations for matched fields.",
      "Computed blockers have an explicit product/runtime decision.",
      "No real submit is called until smoke and rollback are approved.",
    ],
  },
  {
    area: "upload_parity",
    status: "ready_candidate",
    evidence: [
      "lib/form-schema/release-intake.upload-adapter.ts",
      "lib/form-schema/release-intake.upload-adapter.harness.ts",
      "docs/release-intake-upload-parity.md",
    ],
    risk: "high",
    nextPr: "Upload bridge preserving active signed-upload behavior.",
    acceptanceCriteria: [
      "Manifest preserves cover, per-track audio and optional asset metadata.",
      "No File, Blob, signed upload token or storage write is produced by schema code.",
      "Active upload route remains the source of upload policy.",
    ],
  },
  {
    area: "feature_flag",
    status: "needs_opt_in_guard",
    evidence: ["No real feature flag exists yet by design."],
    risk: "high",
    nextPr: "Create default-false opt-in guard without enabling Atabaque.",
    acceptanceCriteria: [
      "Default false in all environments.",
      "Workspace allowlist required.",
      "No env or settings mutation in readiness-only PRs.",
    ],
  },
  {
    area: "atabaque_default",
    status: "needs_opt_in_guard",
    evidence: [
      "app/intake/[workspaceSlug]/page.tsx still renders ReleaseIntakePage",
      "lib/form-engine/workflow-registry.ts still maps release_intake to the active renderer",
    ],
    risk: "high",
    nextPr: "Guarded renderer selection experiment for a non-production workspace.",
    acceptanceCriteria: [
      "/intake/atabaque without a guard renders the active flow.",
      "Fallback to active renderer is deterministic.",
      "Atabaque activation requires human approval and full smoke.",
    ],
  },
  {
    area: "workspace_tenant_guard",
    status: "needs_opt_in_guard",
    evidence: ["No workspace rollout guard exists for schema runtime activation."],
    risk: "high",
    nextPr: "Workspace allowlist and internal-only query override design.",
    acceptanceCriteria: [
      "Guard checks workspace and workflow explicitly.",
      "Atabaque is excluded until manually allowlisted.",
      "Query overrides are dev/internal only and cannot publish runtime behavior.",
    ],
  },
  {
    area: "rollback",
    status: "ready_candidate",
    evidence: ["This readiness manifest and docs define rollback steps."],
    risk: "medium",
    nextPr: "Implement rollback switch only with the opt-in guard PR.",
    acceptanceCriteria: [
      "Disabling the guard returns every workspace to the active renderer.",
      "No data contract changes are required to roll back.",
      "Rollback smoke confirms draft, edit, upload and submit on the active flow.",
    ],
  },
  {
    area: "smoke_tests",
    status: "needs_runtime_adapter",
    evidence: [
      "Previous PRs validated dev preview and /intake/atabaque smoke manually.",
    ],
    risk: "high",
    nextPr: "Formal smoke script or manual checklist before opt-in.",
    acceptanceCriteria: [
      "/intake/atabaque default smoke passes without the schema guard.",
      "Preview smoke passes with no real submit/upload calls.",
      "Console and server logs have no critical errors.",
    ],
  },
  {
    area: "airtable",
    status: "needs_runtime_adapter",
    evidence: ["Submit parity is isolated and Airtable sync is not touched."],
    risk: "high",
    nextPr: "Airtable downstream payload review before any real submit bridge.",
    acceptanceCriteria: [
      "Airtable receives the same approved payload shape.",
      "No sync behavior changes without dedicated review.",
      "Rollback does not require Airtable cleanup.",
    ],
  },
  {
    area: "drive",
    status: "needs_runtime_adapter",
    evidence: ["Upload parity reports Drive mapping as pending."],
    risk: "high",
    nextPr: "Drive file placement and naming review for uploaded refs.",
    acceptanceCriteria: [
      "Drive mapping is explicit for cover, audio and assets.",
      "Existing Drive sync remains unchanged without opt-in.",
      "Fallback renderer uses the current Drive behavior.",
    ],
  },
  {
    area: "email",
    status: "needs_runtime_adapter",
    evidence: ["Submit parity does not change email payloads or Resend behavior."],
    risk: "high",
    nextPr: "Email summary parity review after submit bridge candidate.",
    acceptanceCriteria: [
      "Email content remains unchanged without opt-in.",
      "Schema submit bridge preserves required email fields.",
      "No Resend route or template changes are bundled with activation.",
    ],
  },
  {
    area: "mobile_responsiveness",
    status: "needs_runtime_adapter",
    evidence: ["Renderer preview exists, but runtime mobile opt-in has not been tested."],
    risk: "medium",
    nextPr: "Mobile preview smoke before internal opt-in.",
    acceptanceCriteria: [
      "Four-step renderer fits mobile viewport.",
      "Footer navigation and upload placeholders remain usable.",
      "No active Atabaque mobile regression without opt-in.",
    ],
  },
  {
    area: "observability_logs",
    status: "needs_runtime_adapter",
    evidence: ["No runtime logs are emitted by schema code yet."],
    risk: "medium",
    nextPr: "Opt-in instrumentation plan without sensitive payload logging.",
    acceptanceCriteria: [
      "Activation logs identify renderer selection without PII.",
      "Rollback events are visible.",
      "No draft, submit or uploaded file contents are logged.",
    ],
  },
] as const satisfies readonly ReleaseIntakeReadinessEntry[];

export const releaseIntakeOptInGuardrails = [
  {
    id: "default_false",
    requirement: "Any schema runtime flag must default to false.",
    reason: "Readiness does not authorize activation for Atabaque or any workspace.",
  },
  {
    id: "workspace_allowlist",
    requirement: "Activation must require an explicit workspace allowlist.",
    reason: "Tenant rollout must be deliberate and reversible.",
  },
  {
    id: "workflow_match",
    requirement: "Guard must match workflow_type === release_intake.",
    reason: "Rights, company and people workflows are out of scope.",
  },
  {
    id: "active_renderer_fallback",
    requirement: "Fallback must render the current ReleaseIntakePage.",
    reason: "Rollback must be a guard change, not a code migration.",
  },
  {
    id: "human_approval",
    requirement: "Atabaque opt-in requires human approval after smoke.",
    reason: "Atabaque is the protected production runtime.",
  },
  {
    id: "no_publish_action",
    requirement: "Setup AI or schema preview cannot publish runtime changes.",
    reason: "Irreversible actions require a separate human-gated path.",
  },
] as const satisfies readonly ReleaseIntakeOptInGuardrail[];

export const releaseIntakeActivationChecklist = [
  {
    id: "default-route-unchanged",
    category: "routing",
    item: "/intake/atabaque without opt-in renders the active renderer.",
    requiredBefore: "internal_opt_in",
  },
  {
    id: "preview-loads",
    category: "ui",
    item: "/dev/schema-renderer/release-intake loads in development.",
    requiredBefore: "internal_opt_in",
  },
  {
    id: "draft-save-resume",
    category: "draft",
    item: "Active draft save and resume continue to work.",
    requiredBefore: "atabaque_opt_in",
  },
  {
    id: "edit-token",
    category: "draft",
    item: "Existing edit-token hydration continues to work.",
    requiredBefore: "atabaque_opt_in",
  },
  {
    id: "upload-current-flow",
    category: "upload",
    item: "Current cover, audio and asset upload flow continues to work.",
    requiredBefore: "atabaque_opt_in",
  },
  {
    id: "submit-current-flow",
    category: "submit",
    item: "Current submit flow continues to build the approved payload.",
    requiredBefore: "atabaque_opt_in",
  },
  {
    id: "airtable-drive-email",
    category: "integration",
    item: "Airtable, Drive and email behavior are verified with approved test data.",
    requiredBefore: "atabaque_opt_in",
  },
  {
    id: "mobile-smoke",
    category: "ui",
    item: "Mobile viewport smoke covers step navigation and review state.",
    requiredBefore: "atabaque_opt_in",
  },
  {
    id: "console-server-errors",
    category: "ops",
    item: "Console and server logs have no critical errors.",
    requiredBefore: "atabaque_opt_in",
  },
  {
    id: "rollback-smoke",
    category: "ops",
    item: "Disable guard and confirm fallback to active renderer.",
    requiredBefore: "general_rollout",
  },
] as const satisfies readonly ReleaseIntakeActivationChecklistItem[];

export const releaseIntakeRollbackPlan = [
  {
    order: 1,
    action: "Disable the schema renderer opt-in guard or remove the workspace from the allowlist.",
    verification: "/intake/atabaque renders the active ReleaseIntakePage.",
  },
  {
    order: 2,
    action: "Confirm active draft, upload and submit paths still use lib/form-engine.",
    verification: "No schema bridge code appears in runtime logs or network calls.",
  },
  {
    order: 3,
    action: "Keep schema docs/adapters in place as inactive candidate artifacts.",
    verification: "No database, storage or integration cleanup is required.",
  },
] as const satisfies readonly ReleaseIntakeRollbackStep[];

export const releaseIntakeFutureIntegrationTouchpoints = [
  {
    area: "renderer_selection",
    futureFiles: [
      "app/intake/[workspaceSlug]/page.tsx",
      "components/release-intake/ReleaseIntakePage.tsx",
      "lib/form-engine/workflow-registry.ts",
    ],
    requiredGuards: ["default_false", "workspace_allowlist", "active_renderer_fallback"],
    forbiddenInReadinessPr: ["renderer swap", "workflow registry mutation"],
  },
  {
    area: "draft_bridge",
    futureFiles: [
      "components/release-intake/ReleaseIntakePage.tsx",
      "lib/form-engine/submission-payload.ts",
      "app/api/release-drafts/save/route.ts",
    ],
    requiredGuards: ["workspace_allowlist", "active_renderer_fallback"],
    forbiddenInReadinessPr: ["draft save calls", "autosave contract changes"],
  },
  {
    area: "submit_bridge",
    futureFiles: [
      "components/release-intake/ReleaseIntakePage.tsx",
      "lib/form-engine/submission-payload.ts",
      "app/api/submissions/route.ts",
    ],
    requiredGuards: ["human_approval", "active_renderer_fallback"],
    forbiddenInReadinessPr: ["real submit calls", "backend contract changes"],
  },
  {
    area: "upload_bridge",
    futureFiles: [
      "components/release-intake/ReleaseIntakePage.tsx",
      "app/api/uploads/route.ts",
      "lib/server/storage-files.ts",
    ],
    requiredGuards: ["workspace_allowlist", "active_renderer_fallback"],
    forbiddenInReadinessPr: ["signed upload URL creation", "storage writes"],
  },
  {
    area: "integration_review",
    futureFiles: [
      "Airtable services",
      "Google Drive services",
      "Resend/email services",
    ],
    requiredGuards: ["human_approval"],
    forbiddenInReadinessPr: ["Airtable sync changes", "Drive sync changes", "email changes"],
  },
] as const satisfies readonly ReleaseIntakeFutureIntegrationTouchpoint[];
