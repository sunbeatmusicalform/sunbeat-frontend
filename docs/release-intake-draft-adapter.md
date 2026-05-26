# Release Intake Draft Adapter

This document describes the isolated draft adapter used to prove local round-trip behavior between the active release intake draft shape and the schema candidate values.

## Goal

Prove a local round-trip:

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
- `toSchema(input)`
- `releaseIntakeSchemaValuesToRuntimeDraftPatch(input)`
- `toPatch(input)`
- `deriveReleaseIntakeCoverSpecs(coverFile)`
- `summarizeReleaseIntakeRoundTrip(input)`
- `runReleaseIntakeDraftAdapterHarness()`
- `VISUAL_ONLY_FIELDS`

All functions are pure and local. They do not call `fetch`, Supabase, upload, draft save, submit, AI, Airtable, Drive or email.

## Preserved Fields

The adapter preserves these matched fields in the round-trip patch:

- `identification.submitter_name`
- `identification.submitter_email`
- `identification.project_title`
- `identification.release_type`
- `project.release_date`
- `project.genre`
- `project.explicit_content`
- `project.tiktok_snippet`
- `project.has_video_asset`
- `project.video_link`
- `project.video_release_date`
- `project.cover_link`
- `project.promo_assets_link`
- `project.presskit_link`
- `tracks[].title`
- `tracks[].primary_artists`
- `tracks[].featured_artists`
- `tracks[].interpreters`
- `tracks[].authors`
- `tracks[].publishers`
- `tracks[].producers_musicians`
- `tracks[].phonographic_producer`
- `tracks[].has_isrc`
- `tracks[].isrc_code`
- `tracks[].explicit_content`
- `tracks[].tiktok_snippet`
- `tracks[].lyrics`
- runtime marketing fields except `marketing.additional_files`

## Project Artist Versus Track Artists

`project.primary_artist` remains a display/AI-suggestion field in schema values. It is derived from the first populated `tracks[].primary_artists` value for preview purposes.

`tracks[].primary_artists` is the runtime source of truth. PR20 preserves it per track and includes it in the runtime draft patch, so a second track can keep a different artist list without being overwritten by `project.primary_artist`.

## Presskit Link

`assets.presskit_link` is a string URL in schema values. Empty presskit state is represented as an empty string, not a boolean.

`toPatch(toSchema(input)).values.project.presskit_link` preserves both URL strings and empty strings.

## Marketing And Video Fields

The adapter preserves these PR20 project fields:

- `project.tiktok_snippet`
- `project.has_video_asset`
- `project.video_link`
- `project.video_release_date`

The current schema engine does not support `visibleWhen`, so `video_link` and `video_release_date` remain always present in schema values. Conditional UI is a future renderer feature.

The adapter also carries runtime marketing fields through `schemaValues.marketing` so the round-trip does not drop the runtime marketing object. The visible four-step FormSchema still does not include a dedicated marketing step.

## Visual-Only Fields

`VISUAL_ONLY_FIELDS` currently contains:

- `assets.cover_file`
- `assets.cover_specs`
- `tracks[].audio_file`

These fields can exist in schema values for preview, audit and blocker derivation. They are intentionally excluded from runtime patch output until upload parity exists.

## ISRC Duplicate Derivation

`toSchema(input)` scans non-empty `tracks[].isrc_code` values. When the same code appears more than once, each affected schema track receives:

```ts
validations.err.includes("isrc_duplicate")
```

This is computed schema-only metadata. It does not change active submit validation and it is not serialized into runtime draft patches.

## Cover Specs Derivation

`toSchema(input)` converts runtime cover metadata into `assets.cover_file` and then derives `assets.cover_specs`:

- resolution: minimum `3000x3000`;
- DPI: minimum `300`;
- status: expected `validated`.

A `1500x1500` cover derives a blocking resolution spec. A `3000x3000` cover derives an OK resolution spec.

`assets.cover_file` and `assets.cover_specs` remain out of the runtime patch.

## Harness

No Jest or Vitest runner is configured in `sunbeat-web`, so this PR does not add a dependency. Instead, `release-intake.draft-adapter.harness.ts` exports a small typechecked harness result.

The harness verifies:

- presskit URL survives round-trip as a string;
- empty presskit survives as an empty string, not a boolean;
- `tiktok_snippet`, `has_video_asset`, `video_link` and `video_release_date` survive round-trip;
- runtime marketing fields survive the patch;
- `tracks[].primary_artists` is preserved per track and not overwritten by `project.primary_artist`;
- patch output includes `tracks[].primary_artists`;
- `tracks[].audio_file` survives in schema values but not patch output;
- duplicate ISRC derives `isrc_duplicate`;
- unique ISRC does not derive `isrc_duplicate`;
- 1500x1500 cover derives a blocking resolution spec;
- 3000x3000 cover derives an OK resolution spec;
- `cover_file` and `cover_specs` stay out of patch output;
- `VISUAL_ONLY_FIELDS` names the excluded visual fields;
- PR20 scoped fields round-trip without lost-field issues.

## Why It Is Not Runtime Yet

This adapter is a local proof, not a runtime migration. It still leaves several decisions for later PRs:

- submit parity must decide whether computed blockers block real submit;
- upload parity must decide how cover/audio refs and image dimensions are validated;
- the full marketing object needs a visible schema/product policy;
- active profile-management fields need schema policy;
- conditional rendering needs an engine feature such as `visibleWhen`;
- Airtable, Drive and email expectations must be verified before activation.

## Next PR Checklist

Before connecting anything to runtime:

- add submit parity tests against `buildReleaseIntakeSubmitPayload`;
- add upload parity for cover, per-track audio and additional files;
- decide how computed blockers become submit blockers;
- decide whether marketing gets a schema step or remains adapter-only;
- keep activation behind explicit opt-in and verify `/intake/atabaque` remains unchanged.
