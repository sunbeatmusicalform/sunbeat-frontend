# Form Schema Engine v0

This document describes the isolated Form Schema Engine v0 preview for the Sunbeat release intake redesign.

## Scope

The v0 engine adds a schema contract, a common renderer and a dev-only release intake preview. It does not replace the active Atabaque runtime and it does not connect to submit, draft, upload, Airtable, Google Drive, email, Supabase Storage, SQL, billing or backend services.

The preview routes are:

- `/dev/schema-renderer`
- `/dev/schema-renderer/release-intake`

Both routes call `notFound()` in production.

## Claude Design handoff

The implementation uses `sunbeat_handoff_release_intake_v0.md` as the technical source and the standalone `project/ui_kits/atabaque-intake/index.html` as a visual reference. The standalone HTML was not copied into the app: no Babel runtime, UMD globals, `window.*` data sharing, CDN scripts or prototype CSS were imported.

The renderer preserves the handoff shape:

- four steps: Projeto, Faixas, Capa & assets, Revisao;
- sticky stage header;
- step progress;
- card-based step layout;
- field helper, validation and AI signal surfaces;
- warning, danger, success and AI tones;
- duplicate ISRC as a blocking danger signal;
- cover below 3000x3000 as a blocking danger signal;
- date conflict and missing presskit as non-blocking warnings;
- final review with blockers, warnings, OK rows and inactive destination hints;
- submit disabled in preview.

## Schema support

`lib/form-schema/types.ts` defines the v0 contract:

- `FormSchema`
- `FormStep`
- `FormField`
- `FieldKind`
- `ValidationRule`
- `AISignalSpec`
- `IntegrationAuditHint`
- `SchemaRendererMode`

Supported field kinds in the v0 renderer:

- `text`
- `textarea`
- `select`
- `date`
- `boolean`
- `repeater`
- `upload`
- `review`

The renderer is intentionally small. It renders local values, local navigation and visual validation states only.

### Relationship with `lib/form-engine`

`lib/form-schema` is an experimental v0 schema contract and preview renderer layer. It runs in parallel to the existing `lib/form-engine` runtime and does not replace workflow registry entries, active renderers, submit/draft/upload behavior, or any Atabaque production flow.

## Release intake candidate

`lib/form-schema/release-intake.schema.ts` defines a candidate release intake schema with four steps:

1. Projeto
2. Faixas
3. Capa & assets
4. Revisao

`lib/form-schema/mock-release-intake-data.ts` provides non-sensitive mock values and a static pre-submit summary. The mock includes:

- one duplicated ISRC blocker;
- one cover-spec blocker;
- one date warning;
- one missing presskit warning;
- local upload placeholders;
- static audit hints for Airtable, Drive, email and human review.

## What is out of scope

This PR does not implement:

- real schema execution;
- real validation engines;
- real AI calls;
- real autosave or draft persistence;
- real upload;
- real submit;
- real Airtable, Drive, email or storage sync;
- Setup AI publish;
- workflow registry changes;
- `/intake/atabaque` migration;
- any renderer swap for active workflows.

## Atabaque protection

The active Atabaque route remains untouched. The preview does not import the active `/intake/[workspaceSlug]` page, release-intake renderer, workflow registry, backend modules or integration services.

The only CSS import is the isolated foundation token file in dev preview pages, matching the existing foundation sandbox pattern. No new tokens are imported globally into active runtime surfaces.

## Next steps for runtime binding

Before connecting this schema to a real workflow, a separate PR should:

1. map schema fields to the active Atabaque data contract;
2. validate draft, submit, upload and edit-token contracts;
3. add a read-only runtime adapter behind an explicit feature flag;
4. verify the full diff against `/intake/atabaque`, registry and renderer files;
5. keep irreversible actions gated by a human approval step.

See `docs/release-intake-schema-parity.md` for the first field-level parity audit and adapter map notes.

See `docs/release-intake-draft-adapter.md` for the isolated draft adapter round-trip proof.

See `docs/release-intake-submit-parity.md` for the isolated submit payload candidate proof.

See `docs/release-intake-upload-parity.md` for the isolated upload manifest candidate proof.

See `docs/release-intake-integration-readiness.md` for the opt-in readiness matrix, rollback plan and activation checklist.
