
-- Add upload + feature columns
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS audio_upload_mb   integer,
  ADD COLUMN IF NOT EXISTS cover_upload_mb   integer,
  ADD COLUMN IF NOT EXISTS submissions_month integer,
  ADD COLUMN IF NOT EXISTS ai_enabled        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS airtable_enabled  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gdrive_enabled    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gsheets_enabled   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notion_enabled    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_branding   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS white_label       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_level     text NOT NULL DEFAULT 'community';

-- Update plans in place (no delete needed)
UPDATE public.plans SET
  submissions_month = 50, max_forms = 1, max_team_members = 1,
  audio_upload_mb = 10, cover_upload_mb = 5,
  ai_enabled = false, airtable_enabled = false,
  gdrive_enabled = false, gsheets_enabled = false, notion_enabled = false,
  custom_branding = false, white_label = false, support_level = 'community',
  features = '["Intake público sem login","Rascunho automático","E-mail de resumo","1 formulário","50 submissões/mês","Upload: áudio 10MB, capa 5MB"]'::jsonb
WHERE id = 'free';

UPDATE public.plans SET
  price_monthly = 97,
  submissions_month = 500, max_forms = 2, max_team_members = 2,
  audio_upload_mb = 50, cover_upload_mb = 20,
  ai_enabled = false, airtable_enabled = true,
  gdrive_enabled = false, gsheets_enabled = false, notion_enabled = false,
  custom_branding = false, white_label = false, support_level = 'email',
  features = '["Tudo do Free","2 formulários (intake + rights clearance)","500 submissões/mês","Upload: áudio 50MB, capa 20MB","Airtable nativo (sync bidirecional)","Field mapping visual","Dashboard de edição de campos","2 usuários","Suporte por e-mail"]'::jsonb
WHERE id = 'starter';

UPDATE public.plans SET
  price_monthly = 247,
  submissions_month = 2000, max_forms = 5, max_team_members = 5,
  audio_upload_mb = 100, cover_upload_mb = 50,
  ai_enabled = true, airtable_enabled = true,
  gdrive_enabled = true, gsheets_enabled = true, notion_enabled = false,
  custom_branding = true, white_label = false, support_level = 'priority',
  features = '["Tudo do Starter","5 formulários","2000 submissões/mês","Upload: áudio 100MB, capa 50MB","Lyric Engine (IA para letras)","Google Drive nativo","Google Sheets nativo","Branding customizado","5 usuários","Suporte prioritário (< 24h)"]'::jsonb
WHERE id = 'pro';

UPDATE public.plans SET
  price_monthly = 0,
  submissions_month = NULL, max_forms = NULL, max_team_members = 20,
  audio_upload_mb = 200, cover_upload_mb = 100,
  ai_enabled = true, airtable_enabled = true,
  gdrive_enabled = true, gsheets_enabled = true, notion_enabled = true,
  custom_branding = true, white_label = true, support_level = 'dedicated',
  features = '["Tudo do Pro","Submissões ilimitadas","Formulários ilimitados","Upload: áudio 200MB, capa 100MB","Todos os subprodutos de IA (Lyric Engine + futuros)","Notion nativo","White label completo","20+ usuários","Onboarding dedicado","SLA contratual","Contrato personalizado"]'::jsonb
WHERE id = 'enterprise';
;
