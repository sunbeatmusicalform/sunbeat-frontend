
-- Add public_edit_allowed flag to workspace_branding for true multi-tenancy
ALTER TABLE workspace_branding
  ADD COLUMN IF NOT EXISTS public_edit_allowed boolean NOT NULL DEFAULT false;

-- Atabaque is the only workspace that allows public editing
UPDATE workspace_branding
SET public_edit_allowed = true
WHERE workspace_slug = 'atabaque';

-- Make social_image_url for atabaque an absolute URL (needed for WhatsApp/social crawlers)
UPDATE workspace_branding
SET social_image_url = 'https://sunbeat.pro/atabaque-og.png'
WHERE workspace_slug = 'atabaque'
  AND (social_image_url = '/atabaque-og.png' OR social_image_url IS NULL);
;
