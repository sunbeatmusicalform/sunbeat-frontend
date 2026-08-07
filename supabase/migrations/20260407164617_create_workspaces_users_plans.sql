
-- ============================================================
-- PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plans (
  id              text PRIMARY KEY,                  -- 'free' | 'starter' | 'pro' | 'enterprise'
  name            text NOT NULL,
  price_monthly   numeric(10,2) NOT NULL DEFAULT 0,
  max_submissions integer,                           -- NULL = unlimited
  max_forms       integer,                           -- NULL = unlimited
  max_team_members integer NOT NULL DEFAULT 1,
  features        jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.plans (id, name, price_monthly, max_submissions, max_forms, max_team_members, features) VALUES
  ('free',       'Free',       0,      50,   1, 1,  '["Intake público","Rascunho","E-mail de resumo"]'::jsonb),
  ('starter',    'Starter',    97,     300,  2, 2,  '["Tudo do Free","Rights clearance","Dashboard de edição","Suporte por e-mail"]'::jsonb),
  ('pro',        'Pro',        247,    2000, 5, 5,  '["Tudo do Starter","Airtable sync","Múltiplos formulários","Branding customizado","Suporte prioritário"]'::jsonb),
  ('enterprise', 'Enterprise', 0,      NULL, NULL, 20, '["Tudo do Pro","Volume ilimitado","Onboarding dedicado","SLA","Contrato personalizado"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- WORKSPACES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  slug            text PRIMARY KEY,
  name            text NOT NULL,
  plan_id         text NOT NULL DEFAULT 'starter' REFERENCES public.plans(id),
  owner_email     text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Seed existing workspace
INSERT INTO public.workspaces (slug, name, plan_id, owner_email)
VALUES ('atabaque', 'Atabaque', 'pro', 'contatofelipefonsek@gmail.com')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- WORKSPACE_USERS  (user ↔ workspace membership)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspace_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_slug  text NOT NULL REFERENCES public.workspaces(slug) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','admin','member')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_slug, user_id)
);

-- RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_users ENABLE ROW LEVEL SECURITY;

-- Plans: anyone can read
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT USING (true);

-- Workspaces: only members can read their own workspace
CREATE POLICY "workspaces_member_read" ON public.workspaces
  FOR SELECT USING (
    slug IN (
      SELECT workspace_slug FROM public.workspace_users
      WHERE user_id = auth.uid()
    )
  );

-- Workspaces: only owners can update
CREATE POLICY "workspaces_owner_update" ON public.workspaces
  FOR UPDATE USING (
    slug IN (
      SELECT workspace_slug FROM public.workspace_users
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- workspace_users: members can read their own rows
CREATE POLICY "workspace_users_self_read" ON public.workspace_users
  FOR SELECT USING (user_id = auth.uid());

-- workspace_users: service role can insert (used during signup)
CREATE POLICY "workspace_users_service_insert" ON public.workspace_users
  FOR INSERT WITH CHECK (true);

-- Updated_at trigger for workspaces
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS workspaces_updated_at ON public.workspaces;
CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
;
