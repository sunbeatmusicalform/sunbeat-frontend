# Sunbeat Tables — pilot boundary

Sunbeat Tables is the operational reading layer of the Sunbeat portal. It is not
an embedded Airtable clone and it does not replace the workspace's source of
truth. The first market pilot gives authenticated tenants a consistent way to
inspect projects, release stages and operational demands while the existing
integrations continue to own persistence.

## Product behavior in this pilot

- Three music-specific modules: Projects, Stages and Demands.
- Tenant-scoped data returned by the existing portal API.
- Dense grid, search, quick views and record detail drawer.
- Lightweight diagnostics derived from deadlines, asset status and sync state.
- Source and read-only state shown explicitly in the interface.
- Selected quick view stored locally under a workspace-specific key.
- External automation state exposed without enabling or dispatching anything.

There are no edit, import, schema-builder or bulk-action controls in this
release. Those capabilities require an authorization and audit design of their
own before they can be offered safely.

## Clean-room implementation

NocoDB is useful product research for interaction patterns such as compact
tables, saved views, filters and record details. Its current Sustainable Use
License is not compatible with copying its source into a commercial,
multi-customer Sunbeat product. This implementation was written from the
Sunbeat data contract and existing design system without importing NocoDB code,
packages or assets.

## Automation boundary

An external automation engine may receive minimal, signed domain events after
explicit QA activation. Sunbeat remains responsible for tenant authorization,
entitlements, validation, idempotency and audit state. External flows perform
approved side effects only; they never become the source of business truth.

## Next review gate

Before enabling write operations or a production scheduler, validate the
complete path in an isolated QA workspace, including replay, timeout, retry,
dead-letter inspection and rollback evidence. The managed Atabaque workspace is
outside this pilot.
