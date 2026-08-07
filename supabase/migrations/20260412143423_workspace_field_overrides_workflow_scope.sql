
ALTER TABLE public.workspace_field_overrides
  ADD COLUMN IF NOT EXISTS workflow_type text;

ALTER TABLE public.workspace_field_overrides
  ADD COLUMN IF NOT EXISTS form_version text;
;
