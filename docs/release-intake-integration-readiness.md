# Release Intake Integration Readiness

This document consolidates the release intake schema foundation, renderer preview, draft parity, submit parity and upload parity into a future activation plan.

It is a readiness plan only. It does not activate the schema renderer, does not create a real feature flag, does not alter `/intake/atabaque`, and does not connect real draft, submit, upload, Airtable, Drive, email, backend, SQL, secrets, deploy or billing behavior.

## Executive Summary

The release intake redesign is ready as a candidate system, not as production runtime.

Ready candidate layers:

- visual foundation and isolated components;
- Form Schema Engine v0 contract;
- dev-only schema renderer preview;
- release_intake candidate schema;
- field parity map and runtime map;
- isolated draft adapter and harness;
- isolated submit payload candidate and harness;
- isolated upload manifest candidate and harness;
- documented visual blockers and computed fields.

Still not runtime:

- renderer selection;
- real draft/autosave bridge;
- real submit bridge;
- real upload bridge;
- feature flag or workspace allowlist;
- Atabaque activation;
- Airtable, Drive and email parity through real integrations;
- rollout observability and rollback switch.

The typed source of truth for this document is `lib/form-schema/release-intake.integration-readiness.ts`.

## Readiness Matrix

| Area | Status | Evidence | Risk | Next PR | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- |
| Schema coverage | ready_candidate | `release-intake.schema.ts`, schema parity doc, adapter harnesses | medium | Schema gap review for marketing visibility and conditionals | Four-step candidate stays intact; known gaps remain documented; no runtime payload change required to render. |
| Renderer preview | ready_candidate | `components/form-renderer/*`, `/dev/schema-renderer/release-intake`, production `notFound()` guard | medium | Internal opt-in renderer experiment behind explicit guard | Preview renders four steps; remains dev/internal until guarded runtime PR; no default renderer change. |
| Draft parity | ready_candidate | `release-intake.draft-adapter.ts`, draft harness, draft doc | high | Draft runtime bridge prototype behind opt-in guard | Active draft save/resume unchanged without guard; matched fields preserved; edit-mode hydration tested before Atabaque opt-in. |
| Submit parity | ready_candidate | `release-intake.submit-adapter.ts`, submit harness, submit doc | high | Submit bridge comparison against `buildWorkflowSubmitPayload` | Candidate payload matches active expectations; computed blockers get explicit decision; no real submit until smoke/rollback approved. |
| Upload parity | ready_candidate | `release-intake.upload-adapter.ts`, upload harness, upload doc | high | Upload bridge preserving active signed-upload behavior | Manifest preserves cover/audio/assets metadata; no File/Blob/token/storage write; active upload route owns policy. |
| Feature flag | needs_opt_in_guard | No real flag exists by design | high | Default-false opt-in guard without enabling Atabaque | Default false; workspace allowlist required; no env/settings mutation in readiness PR. |
| `/intake/atabaque` default | needs_opt_in_guard | Active route renders `ReleaseIntakePage`; registry maps `release_intake` to active renderer | high | Guarded renderer selection experiment for non-production workspace | Default route renders active flow; fallback is deterministic; Atabaque requires human approval and full smoke. |
| Workspace/tenant guard | needs_opt_in_guard | No rollout guard exists yet | high | Workspace allowlist and internal-only query override design | Guard checks workspace/workflow explicitly; Atabaque excluded until allowlisted; query overrides cannot publish runtime. |
| Rollback | ready_candidate | This doc and typed manifest define rollback | medium | Implement rollback switch with opt-in guard PR | Disabling guard returns to active renderer; no data contract change required; rollback smoke covers draft/edit/upload/submit. |
| Smoke tests | needs_runtime_adapter | Prior PRs manually validated dev preview and `/intake/atabaque` smoke | high | Formal smoke script or manual checklist before opt-in | Default Atabaque smoke passes; preview smoke passes; no critical console/server errors. |
| Airtable | needs_runtime_adapter | Submit parity is isolated; sync unchanged | high | Downstream payload review before real submit bridge | Airtable receives approved payload shape; no sync change without review; rollback needs no Airtable cleanup. |
| Drive | needs_runtime_adapter | Upload parity reports Drive mapping as pending | high | Drive file placement and naming review | Mapping explicit for cover/audio/assets; existing sync unchanged without opt-in; fallback uses current behavior. |
| Email | needs_runtime_adapter | Submit parity does not alter email/Resend behavior | high | Email summary parity review after submit bridge candidate | Email unchanged without opt-in; bridge preserves required fields; no Resend/template changes bundled with activation. |
| Mobile/responsiveness | needs_runtime_adapter | Preview exists; runtime mobile opt-in not tested | medium | Mobile preview smoke before internal opt-in | Four-step renderer fits mobile; footer/upload placeholders usable; no active Atabaque mobile regression without opt-in. |
| Observability/logs | needs_runtime_adapter | Schema runtime emits no logs yet | medium | Opt-in instrumentation plan without sensitive payload logging | Logs identify renderer selection without PII; rollback visible; no draft/submit/file contents logged. |

## Opt-In Plan

Future activation should be staged as separate PRs. The recommended guard model is:

- default false for every environment;
- explicit workspace allowlist;
- explicit `workflow_type === "release_intake"` check;
- no activation for `rights_clearance`, `company_registry` or `people_registry`;
- Atabaque excluded until human approval after full smoke;
- active renderer fallback for every failure or disabled guard;
- dev/internal query override only if it cannot publish runtime behavior;
- no `.env`, settings or deployment mutation in readiness-only work.

This PR intentionally does not create that flag. The next implementation PR should create the smallest possible default-false guard and prove that disabled behavior renders the current runtime.

## Future Integration Touchpoints

All items below are future work. They are not changed by this readiness PR.

| Area | Future files likely touched | Required guards | Explicitly forbidden here |
| --- | --- | --- | --- |
| Renderer selection | `app/intake/[workspaceSlug]/page.tsx`, `components/release-intake/ReleaseIntakePage.tsx`, `lib/form-engine/workflow-registry.ts` | default false, workspace allowlist, active renderer fallback | renderer swap, workflow registry mutation |
| Draft bridge | `ReleaseIntakePage.tsx`, `lib/form-engine/submission-payload.ts`, `/api/release-drafts/save` | workspace allowlist, active renderer fallback | draft save calls, autosave contract changes |
| Submit bridge | `ReleaseIntakePage.tsx`, `lib/form-engine/submission-payload.ts`, `/api/submissions` | human approval, active renderer fallback | real submit calls, backend contract changes |
| Upload bridge | `ReleaseIntakePage.tsx`, `/api/uploads`, `lib/server/storage-files.ts` | workspace allowlist, active renderer fallback | signed upload URL creation, storage writes |
| Integration review | Airtable services, Google Drive services, Resend/email services | human approval | sync changes, Drive changes, email changes |

## Smoke Checklist Before Activation

Minimum smoke before any internal opt-in:

- `/intake/atabaque` without opt-in renders the active renderer;
- `/dev/schema-renderer/release-intake` loads in development;
- schema preview shows all four steps;
- no real submit button is enabled in preview;
- no real upload request is made by preview/schema code;
- console and server logs have no critical errors.

Minimum smoke before any Atabaque opt-in:

- current draft save works;
- current draft resume works;
- current edit token hydration works;
- current cover upload works;
- current track audio upload works;
- current submit flow works with approved test data;
- Airtable sync behavior is reviewed;
- Drive sync behavior is reviewed;
- email behavior is reviewed;
- mobile step navigation works;
- rollback smoke passes by disabling the opt-in guard.

No readiness PR should execute real customer submit/upload/integration actions.

## Rollback Plan

Rollback must be a guard operation, not a migration.

1. Disable the schema renderer opt-in guard or remove the workspace from the allowlist.
2. Confirm `/intake/atabaque` renders the active `ReleaseIntakePage`.
3. Confirm active draft, upload and submit paths still use `lib/form-engine`.
4. Leave schema docs/adapters in place as inactive candidate artifacts.
5. Confirm no database, storage, Airtable, Drive or email cleanup is required.

If rollback requires data repair, the activation PR was too broad.

## PR Sequence Recommendation

1. Opt-in guard implementation with default false and no workspace enabled.
2. Renderer selection experiment for a non-production workspace.
3. Draft bridge proof with edit-mode hydration smoke.
4. Upload bridge proof preserving current signed-upload behavior.
5. Submit bridge proof against `buildWorkflowSubmitPayload`.
6. Integration review for Airtable, Drive and email.
7. Atabaque opt-in experiment only after human approval and full smoke.

## Atabaque Protection

For this readiness layer:

- `/intake/atabaque` is not changed;
- workflow registry is not changed;
- active renderers are not changed;
- draft/autosave is not changed;
- submit is not changed;
- edit mode is not changed;
- upload is not changed;
- Airtable is not changed;
- Drive is not changed;
- email is not changed;
- backend is not changed;
- SQL, secrets, deploy and billing are not changed.
