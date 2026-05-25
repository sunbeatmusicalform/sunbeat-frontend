# Sunbeat foundation redesign

This foundation is an isolated implementation layer for future workflow UI. It
does not replace the active Atabaque runtime, does not change public routes and
does not call live integrations.

## Scope

- Tokens: `lib/foundation/tokens.css`, scoped under `.sbf-root`.
- Types: `lib/foundation/types.ts`.
- Components: `components/foundation/*`.
- Sandbox: `app/dev/foundation/page.tsx`.
- The sandbox uses static mocks only and returns `notFound()` in production.

## Guardrails

- No active workflow route is modified.
- No submit, draft, edit mode, upload, Airtable, Google Drive, Resend/email or
  Supabase Storage code is imported by the foundation.
- No global layout imports the new token file.
- No workflow registry or renderer is changed.
- No public asset or tenant-specific copy is used as a default.
- AI surfaces are advisory: they can suggest, validate, explain and show a draft
  diff, but publish, runtime apply, rollback and live sync require a human gate.

## Usage

Import the token file only inside an isolated route or prototype surface:

```tsx
import "@/lib/foundation/tokens.css";
```

Wrap the surface with `.sbf-root` so every variable and component style remains
scoped:

```tsx
<main className="sbf-root">
  <Card title="Example">...</Card>
</main>
```

The components are presentational and deterministic. Any future runtime adapter
must provide data and handlers from outside this foundation, with separate
review before connecting live workflows or integrations.
