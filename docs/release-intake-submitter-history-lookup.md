# Release Intake submitter history lookup proxy

## Summary

This proxy defines the frontend-facing contract for a second read-only suggestion
source for `release_intake`: sanitized values previously used by the same submitter
in the same workspace.

It does not add UI and is not imported by `ReleaseIntakePage`.

## Route

```http
GET /api/workspaces/atabaque/release-intake/history-lookup?field=primary_artists&query=ana&limit=5&draftToken=...
```

`editToken` can be used instead of `draftToken`. The proxy returns an empty safe
response if neither token is present or if both are present.

The proxy forwards the token to the backend as `draft_token` or `edit_token`. It
does not accept or forward `submitterEmail`.

## Sanitized response

Only these fields are exposed to the browser:

```ts
type ReleaseIntakeSubmitterHistoryLookupItem = {
  value: string;
  field: ReleaseIntakeSubmitterHistoryField;
  source: "submitter_history";
  count: number;
  lastUsedAt: string | null;
};
```

The proxy drops any upstream item with an unexpected field, source, missing value,
or invalid count.

## Allowed fields

The allowed fields are exported from
`lib/form-engine/submitter-history-lookup.ts`.

## Non-goals

This does not change `/intake/atabaque`, `ReleaseIntakePage`, submit, payload,
draft/autosave, upload, edit mode, Airtable, Drive, email, workflow registry, or
schema renderer behavior.
