ALTER TABLE workspace_branding
  ADD COLUMN IF NOT EXISTS enabled_workflows text[] DEFAULT NULL;

COMMENT ON COLUMN workspace_branding.enabled_workflows IS
  'NULL = todos os workflows habilitados (backward-compatible). Array explícito = apenas os workflows listados estão ativos para este tenant.';
;
