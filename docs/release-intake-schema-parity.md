# Release Intake Schema Parity

This document audits the gap between the active `release_intake` runtime and the schema candidate introduced for the redesign preview.

## Executive Summary

The candidate schema remains a preview layer, not the active Atabaque runtime. PR20 closes the data-loss gaps found by the draft adapter proof for presskit, project marketing/video fields, per-track primary artists, per-track audio metadata and computed blockers.

The active runtime still owns `/intake/atabaque`, draft/autosave, submit, upload, Airtable, Drive and email. This parity layer is declarative and isolated.

## Scope

Included:

- field-by-field parity notes;
- runtime path notes for draft, submit, edit mode and upload;
- visual-only signal classification;
- adapter map updates for PR20 fields;
- documentation of fields still waiting for submit, upload or opt-in activation.

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
- `app/api/submissions/route.ts`
- `app/api/submissions/edit/[editToken]/route.ts`
- `app/api/uploads/route.ts`

Schema preview sources:

- `lib/form-schema/types.ts`
- `lib/form-schema/release-intake.schema.ts`
- `lib/form-schema/release-intake.runtime-map.ts`
- `lib/form-schema/release-intake.parity.ts`
- `lib/form-schema/release-intake.draft-adapter.ts`
- `components/form-renderer/*`
- `app/dev/schema-renderer/release-intake/page.tsx`

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

PR20 keeps the four-step preview shape but fills the adapter/schema data model for:

- `assets.presskit_link` as a string URL, including empty string;
- `project.tiktok_snippet`;
- `project.has_video_asset`;
- `project.video_link`;
- `project.video_release_date`;
- `tracks[].primary_artists`;
- `tracks[].audio_file` as visual-only schema metadata;
- `assets.cover_file` metadata with width, height, dpi, status and preview;
- `assets.cover_specs` as computed visual-only values;
- `tracks[].validations` as computed visual-only values.

`visibleWhen` is intentionally omitted because Form Schema Engine v0 does not support conditionals yet.

## Parity Table

The complete typed source of truth is `lib/form-schema/release-intake.parity.ts`.

| Schema field | Candidate step | Runtime path | Status | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| `submitter_name` | `project` | `identification.submitter_name` | matched | low | Direct match. |
| `submitter_email` | `project` | `identification.submitter_email` | matched | low | Direct match; submit lowercases. |
| `project_title` | `project` | `identification.project_title` | matched | low | Direct match. |
| `primary_artist` | `project` | `tracks[].primary_artists` | partial | medium | Display/AI field only; per-track artists are modeled separately. |
| `release_type` | `project` | `identification.release_type` | matched | low | Direct match. |
| `release_date` | `project` | `project.release_date` | matched | low | Direct match; submit normalizes date. |
| `genre` | `project` | `project.genre` | matched | low | Direct match. |
| `tiktok_snippet` | `project` | `project.tiktok_snippet` | matched | low | Round-trips as string. |
| `has_video_asset` | `project` | `project.has_video_asset` | matched | medium | Round-trips; conditional UI remains TODO. |
| `video_link` | `project` | `project.video_link` | matched | medium | Round-trips as string. |
| `video_release_date` | `project` | `project.video_release_date` | matched | medium | Round-trips as text datetime. |
| `project_notes` | `project` | `marketing.general_notes` | partial | medium | Probable alias only; needs product decision. |
| `marketing.*` | `project` | `marketing` | partial | medium | Adapter preserves values; visible schema has no dedicated marketing step. |
| `tracks` | `tracks` | `tracks[]` | partial | high | Core fields round-trip; profile/focus policy remains. |
| `tracks.title` | `tracks` | `tracks[].title` | matched | low | Direct match. |
| `tracks.duration` | `tracks` | n/a | missing_in_runtime | low | Visual-only candidate field. |
| `tracks.primary_artists` | `tracks` | `tracks[].primary_artists` | matched | low | Per-track source of truth. |
| `tracks.featured_artists` | `tracks` | `tracks[].featured_artists` | matched | low | Direct match. |
| `tracks.interpreters` | `tracks` | `tracks[].interpreters` | matched | low | Direct match. |
| `tracks.authors` | `tracks` | `tracks[].authors` | matched | low | Direct match. |
| `tracks.publishers` | `tracks` | `tracks[].publishers` | matched | low | Direct match. |
| `tracks.producers_musicians` | `tracks` | `tracks[].producers_musicians` | matched | low | Direct match. |
| `tracks.phonographic_producer` | `tracks` | `tracks[].phonographic_producer` | matched | medium | Runtime validation policy unchanged. |
| `tracks.has_isrc` | `tracks` | `tracks[].has_isrc` | matched | low | Preserved for submit parity. |
| `tracks.isrc_code` | `tracks` | `tracks[].isrc_code` | matched | low | Value round-trips; duplicate check is computed only. |
| `tracks.explicit_content` | `tracks` | `tracks[].explicit_content` | matched | low | Direct match. |
| `tracks.tiktok_snippet` | `tracks` | `tracks[].tiktok_snippet` | matched | low | Direct match. |
| `tracks.audio_file` | `tracks` | `tracks[].audio_file` | visual_only | high | Schema preserves metadata; patch excludes it until upload parity. |
| `tracks.lyrics` | `tracks` | `tracks[].lyrics` | matched | low | Direct match. |
| `tracks.validations` | `tracks` | computed from track fields | visual_only | high | Computed ISRC/audio/credit validation bundle. |
| `assets.cover_file` | `assets` | `project.cover_file` | visual_only | high | Metadata drives visual specs; patch excludes file refs until upload parity. |
| `assets.cover_specs` | `assets` | computed from `project.cover_file` | visual_only | high | Computed resolution/DPI/status specs. |
| `cover_link` | `assets` | `project.cover_link` | matched | low | Direct fallback link. |
| `promo_assets_link` | `assets` | `project.promo_assets_link` | matched | low | Direct match. |
| `presskit_link` | `assets` | `project.presskit_link` | matched | low | String URL preserved; no boolean reduction. |
| `review` | `review` | n/a | visual_only | low | Runtime review is derived and not submitted. |

## Gaps Resolved In PR20

- `presskit_link` is now a string URL in schema values and patch output.
- Project marketing/video fields round-trip: `tiktok_snippet`, `has_video_asset`, `video_link`, `video_release_date`.
- `project.primary_artist` is separated from `tracks[].primary_artists`.
- `tracks[].primary_artists` round-trips per track.
- Per-track `audio_file` metadata survives in schema values while staying out of patches.
- Duplicate ISRC derives `tracks[].validations.err` with `isrc_duplicate`.
- Cover metadata derives `assets.cover_specs`, including 1500x1500 blocker and 3000x3000 OK states.

## Remaining Critical Gaps

- Submit parity has not been implemented, so computed blockers do not block real submit.
- Upload parity has not been implemented, so cover/audio file refs stay visual-only in patches.
- The visible four-step schema still has no dedicated marketing step for the full runtime marketing object.
- Active profile-management fields and focus-track policy remain out of schema UI.
- Conditional rendering for video fields waits on a future `visibleWhen` or equivalent schema feature.

## Visual-Only Fields And Signals

The following fields are intentionally visual-only:

- `assets.cover_file`
- `assets.cover_specs`
- `tracks[].audio_file`
- `tracks[].validations`
- `review`

These signals remain preview-only:

- artist match AI suggestion;
- date conflict warning;
- duplicate ISRC blocker;
- cover spec blocker;
- missing presskit warning;
- audit hints for Airtable, Drive, email and human review.

No visual signal calls AI, upload, draft, submit, Airtable, Drive or email.

## Adapter Map

`lib/form-schema/release-intake.runtime-map.ts` is a declarative map from candidate schema fields to active runtime payload paths.

It is intentionally not imported by `/intake/atabaque`, the workflow registry, active renderers, API routes or integration services.

The map identifies:

- direct mappings;
- derived mappings;
- computed schema-only fields;
- visual-only upload fields;
- remaining runtime-only fields;
- active draft, submit, edit and upload surfaces that must be preserved.

## Fields Waiting For Submit Parity

- `tracks[].validations`
- duplicate ISRC blocker enforcement;
- cover spec blocker enforcement;
- project/track explicit validation decisions;
- active Airtable/Drive/email payload assumptions;
- final normalization against `buildWorkflowSubmitPayload`.

## Fields Waiting For Upload Parity

- `assets.cover_file`
- `assets.cover_specs`
- `tracks[].audio_file`
- `marketing.additional_files`
- image dimension validation location: client, upload route or backend.

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

1. Add submit parity tests against `buildReleaseIntakeSubmitPayload`.
2. Add upload parity for cover, per-track audio and additional files.
3. Decide whether to expose the full marketing object in a schema step or keep it adapter-only.
4. Add conditional rendering support before hiding video fields behind `has_video_asset`.
5. Only then consider an opt-in preview flag for a non-production workspace.

See `docs/release-intake-draft-adapter.md` for the isolated draft adapter round-trip proof.
