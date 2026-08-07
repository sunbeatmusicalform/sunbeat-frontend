
CREATE TABLE IF NOT EXISTS public.workspace_plan_overrides (
  id                      uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_slug          text        NOT NULL UNIQUE,

  -- Storage
  audio_upload_mb         integer,
  cover_upload_mb         integer,

  -- Submissions
  max_submissions_month   integer,

  -- IA
  ai_enabled              boolean,
  ai_monthly_budget_brl   numeric(10,2),
  ai_overage_policy       text
    CHECK (ai_overage_policy IN ('block', 'notify', 'allow')),
  ai_gemini_reserve_brl   numeric(10,2),

  -- Workflows
  max_workflows           integer,
  enabled_workflow_types  text[],

  -- Integracoes
  airtable_enabled        boolean,
  gdrive_enabled          boolean,
  gsheets_enabled         boolean,
  notion_enabled          boolean,

  -- Suporte e contrato
  support_tier            text
    CHECK (support_tier IN ('community', 'email', 'priority', 'dedicated')),
  sla_response_hours      integer,

  -- Valores contratuais (operacao interna — nunca expor na IA)
  monthly_value_brl       numeric(10,2),
  setup_fee_paid_brl      numeric(10,2),
  contract_start_date     date,
  contract_end_date       date,
  billing_cycle           text DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual', 'custom')),

  -- Rastreabilidade interna (nunca expor na IA)
  internal_notes          text,
  configured_by           text,
  contract_reference      text,

  -- Timestamps
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Índice para lookup rápido no read-model e ai_gateway
CREATE INDEX IF NOT EXISTS workspace_plan_overrides_slug_idx
  ON public.workspace_plan_overrides (workspace_slug);

-- RLS desabilitado — tabela interna, acesso via service role
ALTER TABLE public.workspace_plan_overrides DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.workspace_plan_overrides IS
  'Override de entitlements por workspace. Complementa o plano base sem substituí-lo. Campos sensíveis (monthly_value_brl, setup_fee_paid_brl, internal_notes, contract_reference) nunca devem ser expostos ao workspace_context da IA.';

COMMENT ON COLUMN public.workspace_plan_overrides.monthly_value_brl IS 'SENSÍVEL — nunca expor ao workspace_context da IA';
COMMENT ON COLUMN public.workspace_plan_overrides.setup_fee_paid_brl IS 'SENSÍVEL — nunca expor ao workspace_context da IA';
COMMENT ON COLUMN public.workspace_plan_overrides.internal_notes IS 'SENSÍVEL — nunca expor ao workspace_context da IA';
COMMENT ON COLUMN public.workspace_plan_overrides.contract_reference IS 'SENSÍVEL — nunca expor ao workspace_context da IA';
;
