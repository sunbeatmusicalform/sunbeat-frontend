
-- 1. Migrar Atabaque para plano consulting
UPDATE public.workspaces
  SET plan_id = 'consulting'
  WHERE slug = 'atabaque';

-- 2. Registrar override com entitlements contratuais da Atabaque
INSERT INTO public.workspace_plan_overrides (
  workspace_slug,
  -- IA
  ai_enabled,
  ai_monthly_budget_brl,
  ai_overage_policy,
  ai_gemini_reserve_brl,
  -- Integracoes
  airtable_enabled,
  gdrive_enabled,
  gsheets_enabled,
  notion_enabled,
  -- Workflows
  enabled_workflow_types,
  -- Storage (igual ao Enterprise)
  audio_upload_mb,
  cover_upload_mb,
  -- Submissions ilimitadas
  max_submissions_month,
  -- Suporte
  support_tier,
  sla_response_hours,
  -- Contrato (preencher com valores reais via admin settings futuramente)
  monthly_value_brl,
  setup_fee_paid_brl,
  billing_cycle,
  contract_start_date,
  -- Rastreabilidade
  internal_notes,
  configured_by
) VALUES (
  'atabaque',
  true,
  30.00,
  'notify',
  4.50,
  true,
  true,
  true,
  false,
  ARRAY['release_intake', 'rights_clearance', 'company_registry'],
  200,
  100,
  NULL,
  'dedicated',
  4,
  NULL,
  NULL,
  'monthly',
  '2026-01-01',
  'Primeiro cliente efetivo da Atabaque. Consultoria ativa. Workflows: release_intake, rights_clearance, company_registry. Valores contratuais a preencher.',
  'felipefonseca5@gmail.com'
)
ON CONFLICT (workspace_slug) DO NOTHING;
;
