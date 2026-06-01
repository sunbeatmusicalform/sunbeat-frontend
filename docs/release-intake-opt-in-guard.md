# Release Intake Opt-In Guard Design

This document defines the default-false guard design for a future release intake schema renderer opt-in.

This is design and preparation only. It does not activate runtime behavior, does not create an environment flag, does not change `/intake/atabaque`, does not change workflow registry entries, and does not connect real draft, submit or upload behavior.

## Goal

The future guard should make schema renderer activation explicit, narrow and reversible:

- default false;
- explicit workspace allowlist;
- explicit `workflow_type === "release_intake"` match;
- deterministic fallback to the active renderer;
- Atabaque excluded until human approval after smoke;
- schema preview and Setup AI cannot publish runtime changes.

## Current Status

The active runtime still works this way:

- `/intake/[workspaceSlug]` renders `components/release-intake/ReleaseIntakePage.tsx`;
- `release_intake` resolves through `lib/form-engine/workflow-registry.ts`;
- the dev schema preview remains isolated under `/dev/schema-renderer/release-intake`;
- production preview routes still call `notFound()`;
- no active route imports the opt-in guard helper.

## Decision Flow

Future runtime wiring should follow this fallback-first flow:

1. If the global guard is not explicitly enabled, use the active renderer.
2. If the workflow is not `release_intake`, use the active renderer.
3. If the workspace is not allowlisted, use the active renderer.
4. If the workspace is `atabaque` and there is no human approval after smoke, use the active renderer.
5. Only if every check passes, allow a future schema renderer opt-in.

The helper in `lib/form-schema/release-intake.opt-in-guard.ts` encodes the same constraints as a pure decision function. It receives all inputs explicitly and reads no env, cookies, headers, database state or runtime config.

## Helper Contract

`decideReleaseIntakeSchemaOptIn(input)` accepts:

```ts
{
  workspaceSlug: string;
  workflowType: string;
  globalEnabled?: boolean;
  allowedWorkspaces?: readonly string[];
  atabaqueApproved?: boolean;
}
```

It returns:

```ts
{
  useSchemaRenderer: boolean;
  reason:
    | "global_disabled"
    | "workflow_mismatch"
    | "workspace_not_allowlisted"
    | "atabaque_requires_manual_approval"
    | "allowed";
}
```

Required behavior:

- absent or false `globalEnabled` returns `global_disabled`;
- non-`release_intake` workflows return `workflow_mismatch`;
- non-allowlisted workspaces return `workspace_not_allowlisted`;
- `atabaque` requires `atabaqueApproved === true`;
- only an enabled, allowlisted, approved `release_intake` input returns `allowed`.

## Rollback Plan

Rollback for any future activation should be a guard change, not a migration:

1. Disable the global guard or remove the workspace from the allowlist.
2. Confirm `/intake/atabaque` renders the active `ReleaseIntakePage`.
3. Confirm draft, submit and upload paths still use the active runtime.
4. Leave schema docs/adapters in place as inactive candidate artifacts.
5. Confirm no storage, database, Airtable, Drive or email cleanup is required.

## Smoke Checklist Before Any Activation

Before internal opt-in:

- `/intake/atabaque` without the guard renders the active flow;
- `/dev/schema-renderer/release-intake` loads in development;
- no active route imports the guard helper;
- no real draft, submit or upload call is made by schema preview code;
- console/server logs have no critical errors.

Before Atabaque opt-in:

- human approval is recorded outside code;
- current draft save and resume pass;
- current edit token hydration passes;
- current cover/audio/asset upload passes;
- current submit passes with approved test data;
- Airtable, Drive and email impact is reviewed;
- mobile smoke passes;
- disabling the guard restores the active renderer.

## Out Of Scope

This PR does not:

- create a real feature flag;
- read `.env`;
- read cookies or headers;
- read database/config state;
- alter `/intake/atabaque`;
- alter workflow registry;
- alter active renderers;
- connect draft, submit or upload;
- touch Airtable, Drive, email, backend, SQL, secrets, deploy, billing, robots or sitemap.
