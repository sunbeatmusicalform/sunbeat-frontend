-- Sunbeat self-service billing foundation.
-- Review in a non-production Supabase project before applying anywhere.

begin;

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  object_id text,
  workspace_slug text,
  status text not null default 'processing'
    check (status in ('processing', 'processed', 'failed')),
  attempt_count integer not null default 1,
  stripe_created_at bigint not null,
  processing_started_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;

alter table public.workspaces
  add column if not exists stripe_last_event_created_at bigint not null default 0,
  add column if not exists stripe_price_id text,
  add column if not exists stripe_market text,
  add column if not exists billing_reconciled_at timestamptz;

create or replace function public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_object_id text,
  p_stripe_created_at bigint
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_id text;
begin
  insert into public.stripe_webhook_events (
    event_id,
    event_type,
    object_id,
    stripe_created_at
  ) values (
    p_event_id,
    p_event_type,
    p_object_id,
    p_stripe_created_at
  )
  on conflict (event_id) do update
    set status = 'processing',
        attempt_count = public.stripe_webhook_events.attempt_count + 1,
        processing_started_at = now(),
        last_error = null,
        updated_at = now()
    where public.stripe_webhook_events.status = 'failed'
       or (
         public.stripe_webhook_events.status = 'processing'
         and public.stripe_webhook_events.processing_started_at < now() - interval '5 minutes'
       )
  returning event_id into claimed_id;

  return claimed_id is not null;
end;
$$;

revoke all on function public.claim_stripe_webhook_event(text, text, text, bigint)
  from public, anon, authenticated;
grant execute on function public.claim_stripe_webhook_event(text, text, text, bigint)
  to service_role;

create or replace function public.apply_stripe_subscription_event(
  p_workspace_slug text,
  p_customer_id text,
  p_subscription_id text,
  p_subscription_status text,
  p_price_id text,
  p_plan_id text,
  p_market text,
  p_event_created_at bigint
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_rows integer;
  next_plan_id text;
begin
  next_plan_id := case
    when p_subscription_status in ('active', 'trialing') then p_plan_id
    when p_subscription_status in ('canceled', 'unpaid', 'incomplete_expired', 'paused') then 'free'
    else null
  end;

  update public.workspaces
     set stripe_customer_id = p_customer_id,
         stripe_subscription_id = p_subscription_id,
         stripe_subscription_status = p_subscription_status,
         stripe_price_id = p_price_id,
         stripe_market = p_market,
         stripe_last_event_created_at = p_event_created_at,
         billing_reconciled_at = now(),
         plan_id = coalesce(next_plan_id, plan_id)
   where slug = p_workspace_slug
     and (stripe_customer_id is null or stripe_customer_id = p_customer_id)
     and stripe_last_event_created_at <= p_event_created_at;

  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
end;
$$;

revoke all on function public.apply_stripe_subscription_event(
  text, text, text, text, text, text, text, bigint
) from public, anon, authenticated;
grant execute on function public.apply_stripe_subscription_event(
  text, text, text, text, text, text, text, bigint
) to service_role;

commit;
