ALTER TABLE workspace_branding
  ADD COLUMN IF NOT EXISTS social_image_url TEXT,
  ADD COLUMN IF NOT EXISTS social_title TEXT,
  ADD COLUMN IF NOT EXISTS social_description TEXT;

COMMENT ON COLUMN workspace_branding.social_image_url IS 'URL da imagem usada no preview social (WhatsApp, Twitter, etc.). Distinta do logo exibido dentro da UI.';
COMMENT ON COLUMN workspace_branding.social_title IS 'Título customizado para o preview social. Se nulo, usa workspace_name.';
COMMENT ON COLUMN workspace_branding.social_description IS 'Descrição customizada para o preview social. Se nulo, usa slogan ou fallback padrão.';;
