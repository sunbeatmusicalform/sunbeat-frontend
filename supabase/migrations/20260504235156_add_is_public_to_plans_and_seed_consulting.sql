
-- 1a. Adicionar is_public aos planos (todos os existentes são públicos)
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- 1b. Garantir que os planos existentes permanecem públicos
UPDATE public.plans SET is_public = true
  WHERE id IN ('free', 'starter', 'pro', 'enterprise');

-- 1c. Criar plano consulting (interno — nunca aparece em listagem pública)
INSERT INTO public.plans (
  id, name, price_monthly,
  max_submissions, max_forms, max_team_members,
  audio_upload_mb, cover_upload_mb, submissions_month,
  ai_enabled, airtable_enabled, gdrive_enabled,
  gsheets_enabled, notion_enabled,
  custom_branding, white_label,
  support_level, is_public, is_active,
  features
) VALUES (
  'consulting',
  'Consulting',
  0,
  NULL, NULL, 50,
  200, 100, NULL,
  true, true, true,
  true, true,
  true, true,
  'dedicated', false, true,
  '["Plano interno de consultoria","Capacidades configuradas por workspace","Suporte dedicado","Limites definidos no override por workspace"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
;
