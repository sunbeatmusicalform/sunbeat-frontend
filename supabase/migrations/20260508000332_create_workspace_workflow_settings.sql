
-- workspace_workflow_settings
-- Configuracao operacional por workspace + workflow type.
-- Uma linha por par (workspace_slug, workflow_type).
-- Fallback: se nao existir linha, o servico usa defaults hardcoded que
-- reproduzem o comportamento atual de cada workflow.
CREATE TABLE IF NOT EXISTS public.workspace_workflow_settings (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_slug           TEXT        NOT NULL,
    workflow_type            TEXT        NOT NULL,

    -- Email triggers
    post_submit_email_enabled BOOLEAN    NOT NULL DEFAULT TRUE,
    edit_email_enabled        BOOLEAN    NOT NULL DEFAULT TRUE,

    -- Sync flags (override env vars por workflow)
    airtable_sync_enabled     BOOLEAN    NOT NULL DEFAULT TRUE,
    drive_sync_enabled        BOOLEAN    NOT NULL DEFAULT FALSE,

    -- Edit mode
    edit_mode_enabled         BOOLEAN    NOT NULL DEFAULT TRUE,

    -- Extensibilidade para Setup AI e config futura
    extra_settings            JSONB      NOT NULL DEFAULT '{}',

    -- Auditoria interna
    notes                     TEXT,
    configured_by             TEXT       DEFAULT 'manual',

    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT workspace_workflow_settings_unique
        UNIQUE (workspace_slug, workflow_type)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_wws_workspace
    ON public.workspace_workflow_settings (workspace_slug);

CREATE INDEX IF NOT EXISTS idx_wws_workflow_type
    ON public.workspace_workflow_settings (workspace_slug, workflow_type);

-- Seed: Atabaque — config efetiva atual por workflow
-- Reproduz exatamente o comportamento em producao no momento da criacao.
INSERT INTO public.workspace_workflow_settings
    (workspace_slug, workflow_type,
     post_submit_email_enabled, edit_email_enabled,
     airtable_sync_enabled, drive_sync_enabled, edit_mode_enabled,
     notes, configured_by)
VALUES
    ('atabaque', 'release_intake',
     TRUE, TRUE, TRUE, TRUE, TRUE,
     'Config inicial baseada no comportamento em producao em 07/05/2026.',
     'migration'),

    ('atabaque', 'rights_clearance',
     TRUE, TRUE, TRUE, TRUE, TRUE,
     'Config inicial baseada no comportamento em producao em 07/05/2026.',
     'migration'),

    ('atabaque', 'company_registry',
     TRUE, TRUE, TRUE, FALSE, TRUE,
     'drive_sync_enabled=false: pastas especificas de clearance ainda a configurar. Config inicial 07/05/2026.',
     'migration'),

    ('atabaque', 'people_registry',
     FALSE, FALSE, TRUE, FALSE, TRUE,
     'Email gerido pela arquitetura propria do people_registry, nao por submissions.py. Config inicial 07/05/2026.',
     'migration')

ON CONFLICT (workspace_slug, workflow_type) DO NOTHING;
;
