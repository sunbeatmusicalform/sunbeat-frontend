# Release Intake Schema Parity

This document audits the gap between the active `release_intake` runtime and the schema candidate introduced for the redesign preview.

## Executive Summary

The schema candidate is directionally aligned with the Claude Design four-step flow, but it is not payload-complete for the active Atabaque runtime.

The current runtime stores release intake data in a nested `identification`, `project`, `tracks` and `marketing` contract. The candidate schema covers the main project fields, a small track repeater, cover/audio placeholders and review signals. The largest gaps are marketing, per-track credits, per-track upload shape, video/project metadata and runtime-only fields used by draft, submit and edit hydration.

This PR adds a typed parity map and a declarative runtime adapter map only. It does not activate the schema renderer, register a workflow, call APIs, change `/intake/atabaque`, or alter draft/submit/upload.

## Scope

Included:

- field-by-field parity audit;
- runtime path notes for draft, submit, edit mode and upload;
- visual-only signal classification;
- adapter map for future runtime work.

Not included:

- runtime adapter execution;
- draft migration;
- submit migration;
- upload migration;
- workflow registry changes;
- active renderer changes;
- Airtable, Drive, email, backend, SQL, billing or deploy changes.

## Files Audited

Read-only runtime sources:

- `app/intake/[workspaceSlug]/page.tsx`
- `components/release-intake/ReleaseIntakePage.tsx`
- `lib/form-engine/atabaque-template.ts`
- `lib/form-engine/types.ts`
- `lib/form-engine/track-types.ts`
- `lib/form-engine/submission-payload.ts`
- `lib/form-engine/workflow-registry.ts`
- `app/api/release-drafts/save/route.ts`
- `app/api/release-drafts/[draftToken]/route.ts`
- `app/api/release-drafts/send-link/route.ts`
- `app/api/submissions/route.ts`
- `app/api/submissions/edit/[editToken]/route.ts`
- `app/api/uploads/route.ts`

Schema preview sources:

- `lib/form-schema/types.ts`
- `lib/form-schema/release-intake.schema.ts`
- `lib/form-schema/mock-release-intake-data.ts`
- `components/form-renderer/*`
- `app/dev/schema-renderer/release-intake/page.tsx`
- `docs/form-schema-engine-v0.md`

## Active Runtime Shape

The active `release_intake` runtime remains in `lib/form-engine` and is rendered by `components/release-intake/ReleaseIntakePage.tsx`.

Active steps:

1. `intro`
2. `identification`
3. `release`
4. `tracks`
5. `marketing`
6. `review_submit`

Active payload sections:

- `identification`
- `project`
- `tracks[]`
- `marketing`
- `meta`

Active draft uses `buildWorkflowDraftPayload` and `/api/release-drafts/save`.

Active submit uses `buildWorkflowSubmitPayload` and `/api/submissions`.

Active upload uses `/api/uploads`, signed Supabase upload URLs and `UploadedFileRef`.

Active edit mode hydrates from `/api/submissions/edit/[editToken]`.

## Candidate Schema Shape

Candidate schema steps:

1. `project`
2. `tracks`
3. `assets`
4. `review`

Candidate field groups:

- project/contact basics;
- a small track repeater;
- mock cover and audio upload placeholders;
- review summary;
- visual AI/warn/danger/success signals.

## Parity Table

The complete typed source of truth is `lib/form-schema/release-intake.parity.ts`.

| Schema field | Candidate step | Runtime path | Status | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| `submitter_name` | `project` | `identification.submitter_name` | matched | low | Direct match. |
| `submitter_email` | `project` | `identification.submitter_email` | matched | low | Direct match; submit lowercases. |
| `project_title` | `project` | `identification.project_title` | matched | low | Direct match. |
| `primary_artist` | `project` | `tracks[].primary_artists` | partial | high | Candidate is project-level; runtime is per-track. |
| `release_type` | `project` | `identification.release_type` | matched | low | Direct match; runtime also drives track count. |
| `release_date` | `project` | `project.release_date` | matched | low | Direct match; submit normalizes date. |
| `genre` | `project` | `project.genre` | matched | low | Direct match. |
| `project_notes` | `project` | `marketing.general_notes` | partial | medium | Probable alias only; needs product decision. |
| `tracks` | `tracks` | `tracks[]` | partial | high | Candidate repeater only covers a subset. |
| `tracks.title` | `tracks` | `tracks[].title` | matched | low | Direct match. |
| `tracks.duration` | `tracks` | n/a | missing_in_runtime | low | Visual-only candidate field. |
| `tracks.isrc_code` | `tracks` | `tracks[].isrc_code` | matched | low | Runtime also needs `tracks[].has_isrc`. |
| `tracks.authors` | `tracks` | `tracks[].authors` | matched | low | Direct match. |
| `cover_file` | `assets` | `project.cover_file` | matched | medium | Path matches; upload contract must stay intact. |
| `audio_files` | `assets` | `tracks[].audio_file` | partial | high | Candidate aggregate vs runtime per-track files. |
| `promo_assets_link` | `assets` | `project.promo_assets_link` | matched | low | Direct match. |
| `presskit_available` | `assets` | `project.presskit_link` | partial | medium | Candidate boolean vs runtime link. |
| `review` | `review` | n/a | visual_only | low | Runtime review is derived and not submitted. |

## Critical Gaps

- Per-track artist model: the candidate has `primary_artist`, but runtime requires `tracks[].primary_artists`.
- ISRC model: the candidate has `tracks.isrc_code`, but runtime also requires `tracks[].has_isrc` and can require `tracks[].phonographic_producer`.
- Audio upload model: the candidate has aggregate `audio_files`, while runtime uploads and stores `tracks[].audio_file`.
- Marketing section: the candidate does not model active marketing fields, including `marketing_focus`, `marketing_objectives` and `additional_files`.
- Presskit model: the candidate has `presskit_available`, while runtime stores `project.presskit_link`.
- Cover validation: candidate shows a 3000x3000 blocker, but active upload validation currently checks file type and size, not dimensions.
- Duplicate ISRC blocker: candidate shows a visual blocker, but active runtime validation does not enforce duplicate ISRC checks.

## Non-Critical Gaps

- `tracks.duration` exists only in the candidate preview.
- `project_notes` could map to `marketing.general_notes`, but the semantics are not confirmed.
- Runtime project fields `tiktok_snippet`, `cover_link`, video metadata and per-track optional credits are absent from the candidate.
- Runtime internal fields like `tracks[].track_status` and derived `tracks[].order_number` need adapter policy rather than direct UI fields.

## Visual-Only Fields And Signals

These remain preview-only until a future runtime decision:

- artist match AI suggestion;
- date conflict warning;
- duplicate ISRC blocker;
- cover spec blocker;
- missing presskit warning;
- review summary field;
- audit hints for Airtable, Drive, email and human review.

No visual signal currently calls AI, upload, draft, submit, Airtable, Drive or email.

## Adapter Map

`lib/form-schema/release-intake.runtime-map.ts` adds a declarative map from candidate schema fields to the active runtime payload paths.

It is intentionally not imported by `/intake/atabaque`, the workflow registry, active renderers, API routes or integration services.

The map identifies:

- direct mappings;
- derived mappings;
- aggregate mappings;
- missing runtime paths;
- runtime-only fields that must be modeled before activation;
- active draft, submit, edit and upload surfaces that must be preserved.

## Gaps Before Draft Connection

Before any draft adapter is connected:

- preserve the full nested `ReleaseIntakeFormValues` shape;
- preserve `current_step` and `progress_percent` behavior;
- preserve `draft_token`;
- preserve runtime-only fields that are not in the candidate schema;
- prove round-trip hydration from existing `/api/release-drafts/[draftToken]`.

## Gaps Before Submit Connection

Before any submit adapter is connected:

- match `ReleaseIntakeSubmitPayload`;
- preserve submit normalization for email, date, optional strings and yes/no fields;
- preserve track order and local IDs;
- preserve marketing optional object behavior;
- decide how schema blockers become submit blockers;
- verify downstream Airtable, Drive and email expectations without changing those integrations in the same PR.

## Gaps Before Upload Connection

Before any upload adapter is connected:

- keep `/api/uploads` as the only upload preparation route;
- keep signed upload behavior;
- preserve `UploadedFileRef`;
- map cover files to `project.cover_file`;
- map audio files per track to `tracks[].audio_file`;
- map additional files to `marketing.additional_files`;
- decide whether image dimension validation belongs client-side, upload route, or backend.

## Atabaque Activation Checklist

Before any schema runtime activation:

- `/intake/atabaque` remains unchanged until an explicit opt-in PR;
- workflow registry renderer remains `release_intake`;
- active submit contract is validated end to end;
- active draft/autosave contract is validated end to end;
- edit mode hydration round-trips existing submissions;
- upload paths and buckets are unchanged;
- Airtable mapping impact is reviewed;
- Drive folder/file behavior is reviewed;
- email summary behavior is reviewed;
- backend receives the same payload shape or an approved versioned contract;
- no SQL, secrets, deploy or billing files are changed as part of activation.

## Recommended Next Steps

1. Add candidate schema fields for runtime-only project and track fields without activating runtime.
2. Add a draft adapter proof that round-trips mock `ReleaseIntakeFormValues`.
3. Add submit parity tests against `buildReleaseIntakeSubmitPayload`.
4. Add upload parity notes for cover, per-track audio and additional files.
5. Only then consider an opt-in preview flag for a non-production workspace.

See `docs/release-intake-draft-adapter.md` for the isolated draft adapter round-trip proof.

