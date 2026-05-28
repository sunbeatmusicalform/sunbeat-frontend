# Release Intake Upload Parity

This document describes the isolated upload parity adapter for the release intake schema candidate.

## Goal

Build a local upload manifest candidate from schema values:

```txt
schema candidate values -> upload manifest candidate
```

The manifest is metadata-only. It does not call the upload route, create signed upload URLs, save files, save draft, submit, call AI, or touch Airtable, Drive, email, backend, SQL, secrets, deploy or billing.

`/intake/atabaque` remains owned by the active `lib/form-engine` runtime and renderer.

## Files

- `lib/form-schema/release-intake.upload-adapter.ts`
- `lib/form-schema/release-intake.upload-adapter.fixtures.ts`
- `lib/form-schema/release-intake.upload-adapter.harness.ts`

## Exported API

- `releaseIntakeSchemaValuesToUploadManifestCandidate(input, options)`
- `toUploadManifest(input, options)`
- `summarizeReleaseIntakeUploadParity(input, options)`
- `releaseIntakeUploadManifestContainsRuntimeBinary(manifest)`
- `RELEASE_INTAKE_UPLOAD_RUNTIME_TARGETS`
- `runReleaseIntakeUploadAdapterHarness()`

All functions are pure and local. They do not import hooks, components, API clients, upload services, storage services, Supabase clients, Airtable, Drive, email or AI modules.

## Manifest Candidate Shape

The adapter returns:

```ts
{
  generatedFrom: "release_intake_schema_upload_parity_v0",
  cover,
  trackAudio,
  marketingAdditionalFiles,
  excluded,
  pendingRuntimeIntegration
}
```

The manifest can describe:

- `cover`: metadata from `assets.cover_file`;
- `trackAudio[]`: metadata from each `tracks[].audio_file`;
- `marketingAdditionalFiles[]`: optional runtime-only fixture metadata supplied explicitly to the adapter;
- `excluded[]`: fields that do not produce upload candidates;
- `pendingRuntimeIntegration[]`: upload, storage, Drive and submit work that remains future scope.

## Preserved Metadata

Cover metadata:

- file id and name;
- display size and size bytes when available;
- MIME type when available;
- storage bucket/path when available;
- public/download URLs when available;
- width, height, DPI, status and preview flag.

Track audio metadata:

- file id and name;
- display size and size bytes when available;
- MIME type when available;
- storage bucket/path when available;
- public/download URLs when available;
- `trackLocalId`, track id, order and title.

Marketing additional files:

- only included when explicit metadata is passed to the adapter;
- mapped as `asset`;
- kept out of schema values because the current candidate does not model `marketing.additional_files`.

## Visual-Only And Computed Fields

`assets.cover_specs` are derived from cover metadata. Resolution, DPI and status blockers are visual/computed only and are not upload request payload.

The adapter reports:

- `requires_upload_runtime`
- `requires_storage_policy`
- `requires_drive_mapping`
- `requires_submit_integration`
- `visual_only_metadata`

These statuses are review aids. They are not runtime behavior.

## Active Runtime Reference

The active upload route expects upload metadata such as:

- upload kind: `cover`, `audio` or `asset`;
- file name;
- MIME type;
- file size;
- workspace slug;
- draft token;
- `trackLocalId` for audio.

The PR22 adapter mirrors those categories declaratively through `RELEASE_INTAKE_UPLOAD_RUNTIME_TARGETS`, but it never calls the route and never creates real file references.

## Harness Coverage

`runReleaseIntakeUploadAdapterHarness()` checks that:

- a cover manifest candidate is created when cover metadata exists;
- cover name, dimensions, DPI, status and preview metadata are preserved;
- a 1500x1500 cover derives a blocking resolution spec;
- per-track audio candidates include `trackLocalId`;
- audio name and size metadata are preserved;
- a track without audio does not create an upload candidate;
- marketing additional files can be carried when supplied explicitly;
- upload runtime, storage policy, Drive mapping and submit integration are pending;
- the manifest contains no `File` or `Blob`;
- no signed upload token or backend upload handle is produced;
- minimal schema values produce no upload candidates.

## Still Out Of Scope

- real upload execution;
- signed upload URLs;
- storage bucket writes;
- upload progress;
- replacing `/api/uploads`;
- saving uploaded refs to real draft;
- serializing uploaded refs to real submit;
- Drive file placement;
- Airtable or email impact;
- opt-in activation in `/intake/atabaque`.

## Checklist Before Runtime Activation

- confirm active upload bucket policy remains unchanged;
- confirm file limits and MIME rules are enforced by the runtime;
- confirm `draftToken` and `trackLocalId` paths are preserved;
- confirm uploaded refs round-trip through draft/autosave;
- confirm submit payload accepts uploaded refs without changing unrelated fields;
- confirm Drive and email behavior with uploaded refs;
- keep activation behind a separate explicit opt-in PR.
