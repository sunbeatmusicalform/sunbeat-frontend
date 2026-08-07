
CREATE INDEX IF NOT EXISTS idx_workspace_field_overrides_workspace_scope
  ON public.workspace_field_overrides (
    workspace_slug,
    workflow_type,
    form_version,
    step_key,
    field_key
  );
;
