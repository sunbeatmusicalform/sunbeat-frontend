# Release Intake Submit Parity

This document describes the isolated submit parity adapter for the release intake schema candidate.

## Goal

Prove that schema candidate values can produce a submit payload candidate shaped like the active `release_intake` submit contract, without calling real submit, backend, Supabase, upload, Airtable, Drive, email or AI services.

This is not runtime activation. `/intake/atabaque` remains owned by the active `lib/form-engine` renderer and submit flow.

## Scope

Included:

- pure submit adapter in `lib/form-schema/release-intake.submit-adapter.ts`;
- non-sensitive schema fixtures;
- local harness with assertions;
- documentation of preserved, excluded and pending fields.

Not included:

- calling `/api/submissions`;
- changing `buildWorkflowSubmitPayload`;
- changing draft/autosave;
- changing upload;
- changing workflow registry or active renderers;
- changing Airtable, Drive, email, backend, SQL, secrets, deploy or billing.

## Files Audited

Read-only runtime files:

- `components/release-intake/ReleaseIntakePage.tsx`
- `app/api/submissions/route.ts`
- `lib/form-engine/submission-payload.ts`
- `lib/form-engine/types.ts`
- `lib/form-engine/track-types.ts`

Schema files:

- `lib/form-schema/release-intake.schema.ts`
- `lib/form-schema/release-intake.runtime-map.ts`
- `lib/form-schema/release-intake.parity.ts`
- `lib/form-schema/release-intake.draft-adapter.ts`
- `lib/form-schema/release-intake.draft-adapter.fixtures.ts`

## Active Submit Shape

The active runtime builds submit payloads through `buildWorkflowSubmitPayload`, which delegates to `buildReleaseIntakeSubmitPayload`.

The active shape contains:

- `draft_token`;
- `workspace_slug`;
- `workflow_type`;
- `identification`;
- `project`;
- `tracks[]`;
- optional `marketing`;
- `meta`.

The active submit flow then posts that payload to `/api/submissions`, whose route proxies to the backend and can include Supabase auth context. PR21 does not import or call that route.

## Payload Candidate Shape

`releaseIntakeSchemaValuesToSubmitPayloadCandidate(input, options)` returns:

```ts
{
  draft_token,
  workspace_slug,
  workflow_type,
  identification,
  project,
  tracks,
  marketing,
  meta
}
```

The candidate mirrors active normalization where safe:

- trims required strings;
- lowercases `submitter_email`;
- normalizes release dates to `YYYY-MM-DD`;
- converts empty optional strings to `undefined`;
- keeps yes/no values only when they are `yes` or `no`;
- serializes `isrc_code` only when `has_isrc === "yes"`;
- omits empty marketing object.

The candidate uses adapter-only types instead of the real `ReleaseIntakeSubmitPayload` type because upload refs are intentionally excluded from submit payloads. PR22 adds an upload manifest candidate, but does not serialize file refs into submit.

## Covered Fields

The submit candidate preserves:

- `identification.submitter_name`;
- `identification.submitter_email`;
- `identification.project_title`;
- `identification.release_type`;
- `project.release_date`;
- `project.genre`;
- `project.explicit_content`;
- `project.tiktok_snippet`;
- `project.cover_link`;
- `project.promo_assets_link`;
- `project.presskit_link`;
- `project.has_video_asset`;
- `project.video_link`;
- `project.video_release_date`;
- `tracks[].local_id`;
- `tracks[].order_number`;
- `tracks[].title`;
- `tracks[].primary_artists`;
- `tracks[].featured_artists`;
- `tracks[].interpreters`;
- `tracks[].authors`;
- `tracks[].publishers`;
- `tracks[].producers_musicians`;
- `tracks[].phonographic_producer`;
- `tracks[].has_isrc`;
- `tracks[].isrc_code`;
- `tracks[].explicit_content`;
- `tracks[].tiktok_snippet`;
- `tracks[].lyrics`;
- runtime marketing fields except `marketing.additional_files`.

## Excluded Visual-Only Fields

These fields are excluded from the submit candidate:

- `assets.cover_file`;
- `assets.cover_specs`;
- `tracks[].audio_file`;
- `tracks[].validations`;
- `review`.

They remain available in schema values for preview and parity reporting, but they do not enter submit payload candidates.

## Upload Parity Manifest

The active submit payload can include:

- `project.cover_file`;
- `tracks[].audio_file`;
- `marketing.additional_files`.

PR21 intentionally excludes those refs. PR22 describes them in an isolated upload manifest candidate, preserving `UploadedFileRef` metadata, upload kind, draft-token requirement, buckets and per-track file paths without connecting real upload or submit.

## Pending Decisions

The summary reports these decisions:

- `project.primary_artist`: schema has a project display field, while active submit uses `tracks[].primary_artists`;
- `tracks[].is_focus_track`: schema v0 does not expose focus selection, so the candidate derives first track as focus;
- `tracks[].track_status`: schema v0 does not model runtime track status, so the candidate emits `draft`;
- `tracks[].duration`: schema can hold duration, but active submit has no duration path.

Computed blockers such as duplicate ISRC and cover specs are summarized but are not serialized into the candidate payload.

## Harness

`release-intake.submit-adapter.harness.ts` exports `releaseIntakeSubmitAdapterHarnessResult`.

The harness verifies:

- project and identification fields are preserved;
- `presskit_link` stays a string;
- marketing/video fields are preserved;
- per-track primary artists are preserved;
- ISRC code is preserved when `has_isrc` is `yes`;
- `tracks[].audio_file` is excluded;
- `assets.cover_file` and `assets.cover_specs` are excluded;
- summary lists visual-only exclusions;
- summary lists upload parity pending;
- summary lists pending decisions;
- computed blockers stay out of payload;
- minimal schema values can produce a candidate.

## Why It Is Not Runtime Yet

This adapter is a proof layer. It is not imported by `/intake/atabaque`, active renderers, workflow registry, submit handlers or API routes.

Before real submit activation:

- compare candidate output against `buildReleaseIntakeSubmitPayload` with controlled fixtures;
- connect upload manifest output to submit only in a future opt-in PR after upload runtime review;
- decide focus-track and track-status policy;
- decide how computed blockers become real submit blockers;
- verify Airtable, Drive and email downstream expectations;
- keep activation behind explicit opt-in.

## Atabaque Checklist

- `/intake/atabaque` unchanged.
- Workflow registry unchanged.
- Active renderer unchanged.
- Draft/autosave unchanged.
- Submit handler unchanged.
- Upload unchanged.
- Airtable unchanged.
- Drive unchanged.
- Email unchanged.
- Backend unchanged.
- SQL, secrets, deploy and billing unchanged.

See `docs/release-intake-upload-parity.md` for the isolated upload manifest candidate proof.

See `docs/release-intake-integration-readiness.md` for the opt-in readiness matrix, rollback plan and activation checklist.
