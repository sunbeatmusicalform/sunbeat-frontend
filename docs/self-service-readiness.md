# Sunbeat self-service readiness

Status of this branch: the Free self-service foundation is implemented. Paid billing
remains gated on the Stripe migration and end-to-end sandbox acceptance below.

## Gate 1 — sandbox infrastructure

- [ ] Create or select a non-production Supabase project.
- [ ] Review and apply `docs/supabase/stripe_billing_event_idempotency.sql`.
- [ ] Configure the Supabase Auth redirect allow list for both Sunbeat domains and preview.
- [ ] Configure Stripe test products/prices for Starter and Pro in USD and BRL.
- [ ] Configure a Stripe sandbox webhook at `/api/billing/webhook`.
- [ ] Configure Turnstile for both canonical domains and preview (recommended before a
      broader launch; the honeypot, minimum form time and email confirmation remain active).
- [ ] Configure a verified Resend sender for branded account confirmation (recommended;
      Supabase Auth sends the magic link when Resend is unavailable).
- [ ] Add the variables listed in `docs/self-service-security-rollout.md` to preview.

Exit criterion: a preview deployment creates an unconfirmed user without leaving orphan
workspace rows, and `SELF_SERVICE_SIGNUP_ENABLED=false` closes both the page and API.

## Gate 2 — controlled end-to-end test

- [ ] Create a new account in each market (`.pro` and `.com.br`).
- [ ] Confirm the email and validate tenant-preserving login.
- [ ] Complete the dashboard onboarding checklist.
- [ ] Purchase Starter with a Stripe test card.
- [ ] Confirm webhook idempotency and the correct plan/price/market in Supabase.
- [ ] Open the customer portal and exercise upgrade, downgrade and cancellation.
- [ ] Exercise `past_due`, recovery and failed-payment terminal states with test clocks.
- [ ] Run authenticated daily reconciliation and intentionally repair one drifted row.
- [ ] Verify Free/Starter/Pro AI, Airtable, upload and monthly submission behavior.
- [ ] Confirm an owner/admin can manage billing and an ordinary member cannot.

Exit criterion: all scenarios have evidence (request ID, Stripe event ID, workspace slug,
expected state and observed state), with no manual database correction.

## Gate 3 — operational hardening

- [x] Enforce workflow and monthly submission limits in the backend for self-service
      workspaces without changing legacy workspaces.
- [x] Validate the uploaded object's real byte size and content type after direct upload.
- [x] Remove Free assets after 60 days while retaining metadata and audit history.
- [ ] Decide and document the exact grace period and customer communication for `past_due`.
- [ ] Add structured alerts for signup rollback failures, webhook failures, reconciliation
      failures and repeated payment failures.
- [ ] Add an operator procedure for account deletion, workspace recovery and billing support.

Exit criterion: bypassing the web UI cannot bypass paid limits, and operational failures
produce an actionable alert with a recovery procedure.

## Gate 4 — limited beta

- [ ] Launch Free with `SELF_SERVICE_SIGNUP_ENABLED` unset or enabled; set it to `false`
      only as an emergency kill switch.
- [ ] Run 3–5 invited customers through preview/sandbox-like production validation.
- [ ] Publish a log-only signup firewall rule and review legitimate traffic.
- [ ] Enable a generous enforced signup rate limit after observation.
- [ ] Enable production signup for a small window and monitor signup, confirmation,
      checkout, webhook and first-submission conversion.

Exit criterion: invited customers complete onboarding and payment without manual product
intervention; support and rollback paths have been exercised at least once.
