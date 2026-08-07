# Self-service security rollout

This runbook separates the Free magic-link launch from paid billing. The Free flow works
with the existing Supabase Auth email provider; paid checkout stays gated until Stripe is
configured and tested.

## Application gates

Required Vercel environment variables for Free signup:

- the existing Supabase URL, anon key and service-role key

Recommended production variables:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`
- `RESEND_API_KEY` plus `RESEND_AUTH_FROM_EMAIL` (preferred) or `RESEND_FROM_EMAIL`
- `CRON_SECRET` (random secret used by Vercel to authenticate billing reconciliation)

`SELF_SERVICE_SIGNUP_ENABLED=false` is the emergency kill switch. When it is unset or
enabled, signup uses a honeypot, a minimum form-completion time and mandatory email
confirmation. Turnstile is enforced when both keys are configured. Resend provides the
branded message when configured; otherwise Supabase Auth delivers the same magic link.

Configure the Turnstile widget for these hostnames before enabling signup:

- `sunbeat.pro`
- `sunbeat.com.br`
- the preview hostname used for the controlled test

The Supabase Auth redirect allow list must accept workspace login URLs on both canonical domains. Verify the exact wildcard syntax in the Supabase dashboard before testing confirmation links.

## Vercel Firewall rate limit

Do not publish a blocking rule immediately. Start in log mode and review legitimate traffic first.

Suggested initial draft for `POST /api/auth/signup`:

```bash
vercel firewall rules add "Observe self-service signup rate" \
  --condition '{"type":"path","op":"eq","value":"/api/auth/signup"}' \
  --condition '{"type":"method","op":"eq","value":"POST"}' \
  --action log \
  --yes
```

After publishing the log-only rule and observing the controlled test, replace it with a generous rate limit such as 10 attempts per 10 minutes per IP. Keep preview enforcement ahead of production enforcement and inspect `vercel firewall diff` before every publish.

The production publish remains a manual infrastructure gate. Application code does not assume the firewall rule already exists.

## Stripe billing state

Before deploying the webhook or reconciliation route, review and apply
`docs/supabase/stripe_billing_event_idempotency.sql` in a non-production Supabase project.
The application deliberately fails closed if this migration is missing.

The daily `/api/cron/billing-reconcile` job is configured for 04:17 UTC. It checks the
least recently reconciled Stripe customers first, in batches of 100. Override the batch
with `BILLING_RECONCILE_BATCH_SIZE` (maximum 500) only after measuring function duration.

Subscription policy:

- `active` and `trialing`: apply the purchased plan.
- `past_due` and `incomplete`: retain the current plan as a grace state.
- `unpaid`, `canceled`, `incomplete_expired` and `paused`: return to Free.

Confirm Stripe sends these events to `/api/billing/webhook` in sandbox:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Controlled acceptance test

1. Confirm signup closes when `SELF_SERVICE_SIGNUP_ENABLED=false`.
2. When Turnstile is configured, confirm missing or replayed tokens are rejected.
3. Confirm Resend failure falls back to Supabase Auth magic-link delivery.
4. Create a sandbox account and verify that it cannot sign in before email confirmation.
5. Confirm the email link lands on the correct `.com.br` or `.pro` workspace.
6. Confirm the user becomes the `owner` in `workspace_users`.
7. Confirm the workspace and branding rows exist exactly once.
8. Confirm duplicate email and duplicate slug attempts do not create orphan rows.
9. Confirm the selected Starter/Pro intent survives confirmation and login.
10. Review Vercel Firewall logs before enabling an enforced rate limit.
11. Replay the same Stripe event and confirm `attempt_count` does not reapply a processed event.
12. Deliver an older subscription event after a newer one and confirm it cannot overwrite state.
13. Exercise `past_due`, recovery, cancellation and deletion in Stripe test clocks.
14. Run the reconciliation endpoint with `CRON_SECRET` and confirm drift is corrected.
