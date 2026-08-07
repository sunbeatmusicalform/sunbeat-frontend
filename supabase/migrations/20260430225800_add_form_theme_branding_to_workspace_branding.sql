
-- Frente B: theme + branding columns for multi-tenant form customization
ALTER TABLE workspace_branding
  ADD COLUMN IF NOT EXISTS form_bg_color   text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS primary_color   text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS badge_url       text DEFAULT NULL;

COMMENT ON COLUMN workspace_branding.form_bg_color IS 'CSS color value for the form page background (e.g. #ebdbba). Null = use platform default.';
COMMENT ON COLUMN workspace_branding.primary_color  IS 'CSS color value for primary action elements (buttons, active stepper). Null = use platform default (#0f172a).';
COMMENT ON COLUMN workspace_branding.badge_url       IS 'URL for a small badge/icon shown in form chips and header. Distinct from logo_url.';
;
