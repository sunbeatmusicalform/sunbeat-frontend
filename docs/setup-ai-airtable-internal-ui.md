# Setup AI Airtable internal UI

This frontend surface is intentionally narrow. It consumes the backend
`POST /internal/config/setup-ai/airtable` endpoint through an internal Next.js
proxy and supports only structured operations for `company_registry` and
`people_registry`.

Supported operations:

- `read`
- `preview_patch`
- `apply_patch`

Guardrails:

- No free-form chat or natural language orchestration is introduced here.
- The browser never receives `X-Admin-Token`; the Next.js API route forwards it
  server-side from `INTERNAL_ADMIN_TOKEN`.
- `preview_patch` is used before writes and does not persist data.
- `apply_patch` requires explicit confirmation in the UI and backend.
- `merge_keys` and `field_map` remain metadata-only in this phase. Sync
  services keep their existing runtime behavior.
- Writes remain scoped to
  `workspace_workflow_settings.extra_settings.airtable` plus the existing
  top-level `airtable_sync_enabled` flag.

This keeps the future Setup AI aligned with the same source of truth already
validated for the Atabaque baseline, without creating a parallel configuration
layer.
