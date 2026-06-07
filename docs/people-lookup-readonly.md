# People Lookup Read-Only

This contract is the safe foundation for future assistive suggestions in public forms such as Atabaque `release_intake`.

## Endpoint

```http
GET /api/workspaces/[workspaceSlug]/people-lookup?query=&roles=&limit=
```

The frontend route proxies a backend read-only endpoint and sanitizes the response again before returning it to the browser.

## Response

Only these fields are allowed:

```json
{
  "ok": true,
  "items": [
    {
      "id": "people_lookup_...",
      "displayName": "Artist Name",
      "roles": ["artista"],
      "source": "people_registry",
      "confidence": "exact"
    }
  ]
}
```

The `id` is an opaque lookup id, not an Airtable id and not an edit token.

## Guardrails

- Query is scoped by workspace.
- Short queries return an empty list.
- Limit is bounded server-side.
- Roles are optional filters.
- The endpoint is read-only.
- No Airtable, Drive, email, submit, draft, upload or edit-mode behavior is called.
- The active Atabaque `release_intake` UI does not consume this endpoint yet.

## Prohibited Fields

The public response must not include document ids, email, phone, address, banking fields, internal notes, contracts, financial values, raw payload, Airtable ids or edit tokens.
