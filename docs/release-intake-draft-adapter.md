# Release Intake Draft Adapter

This document describes the isolated draft adapter added after the release intake schema parity audit.

## Goal

Prove a local round-trip between the active release intake draft shape and the schema candidate values:

```txt
runtime draft/form values -> schema candidate values -> runtime draft patch
```

The adapter is not connected to `/intake/atabaque`, autosave, submit, upload, Airtable, Drive, email, backend or any production workflow.

## Files

- `lib/form-schema/release-intake.draft-adapter.ts`
- `lib/form-schema/release-intake.draft-adapter.fixtures.ts`
- `lib/form-schema/release-intake.draft-adapter.harness.ts`

## Exported API

- `runtimeDraftToReleaseIntakeSchemaValues(input)`
- `releaseIntakeSchemaValuesToRuntimeDraftPatch(input)`
- `summarizeReleaseIntakeRoundTrip(input)`
- `runReleaseIntakeDraftAdapterHarness()`

All functions are pure and local. They do not call `fetch`, Supabase, upload, draft save, submit, AI, Airtable, Drive or email.

## Preserved Fields

The adapter preserves these matched fields in the round-trip patch:

- `identification.submitter_name`
- `identification.submitter_email`
- `identification.project_title`
- `identification.release_type`
- `project.release_date`
- `project.genre`
- `project.cover_file`
- `project.promo_assets_link`
- `tracks[].title`
- `tracks[].authors`
- `tracks[].isrc_code`
- `tracks[].audio_file`, carried by `trackLocalId`
- `marketing.general_notes`, mapped through `project_notes`

## Partial Fields

- `primary_artist`: the schema candidate has one project-level field, while the runtime has `tracks[].primary_artists`.
- `audio_files`: the schema candidate has an aggregate upload field, while the runtime has `tracks[].audio_file`.
- `project_notes`: currently maps only to `marketing.general_notes`; the rest of marketing is not represented.

## Lost Or Not Restored

- `project.presskit_link` becomes `presskit_available` in schema values and cannot be restored from the boolean.
- Most runtime marketing fields are not represented in the candidate schema.
- Runtime video metadata, cover fallback link, explicit flags, track credits, profile status, lyrics and additional files remain outside this adapter patch.

The adapter reports these losses through `summarizeReleaseIntakeRoundTrip(input)` instead of hiding them.

## Visual-Only Signals

The harness fixture includes duplicate ISRC and low-spec cover examples. These are reported as visual-only or needs-decision issues. They do not enter the runtime draft patch and do not block any real submit.

## Harness

No Jest or Vitest runner is configured in `sunbeat-web`, so this PR does not add a dependency. Instead, `release-intake.draft-adapter.harness.ts` exports a small typechecked harness result that verifies:

- matched identification fields are preserved;
- matched project fields are preserved;
- track title, authors and ISRC are preserved;
- audio metadata is carried by track ID;
- presskit link loss is reported;
- track-level primary artist loss is reported;
- visual-only review/blockers do not enter the runtime patch.

## Why It Is Not Runtime Yet

This adapter is a local proof, not a runtime migration. It still exposes material gaps from the parity audit:

- schema candidate does not model the full marketing section;
- schema candidate does not model per-track primary artists;
- schema candidate does not model presskit URL;
- schema candidate does not model all active track credit fields;
- visual blockers are not active runtime validation.

## Next PR Checklist

Before connecting anything to runtime:

- add missing schema fields or explicit carryover policy for marketing;
- decide whether `primary_artist` should be per-project or per-track;
- add a real `presskit_link` schema field if the URL must round-trip;
- add submit parity tests against `buildReleaseIntakeSubmitPayload`;
- add upload parity for cover, per-track audio and additional files;
- keep activation behind explicit opt-in and verify `/intake/atabaque` remains unchanged.

