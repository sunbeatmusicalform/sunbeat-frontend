
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_slug  text,
    surface         text        NOT NULL DEFAULT 'copilot',
    provider        text        NOT NULL,
    model           text        NOT NULL,
    task            text        NOT NULL DEFAULT 'setup',
    tokens_in       integer     NOT NULL DEFAULT 0,
    tokens_out      integer     NOT NULL DEFAULT 0,
    estimated_cost_usd  numeric(10,6)  NOT NULL DEFAULT 0,
    estimated_cost_brl  numeric(10,4)  NOT NULL DEFAULT 0,
    used_fallback   boolean     NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- Index para queries mensais por workspace (budget_alert lookup)
CREATE INDEX IF NOT EXISTS ai_usage_log_workspace_month_idx
    ON public.ai_usage_log (workspace_slug, created_at);

-- RLS desabilitado — tabela interna de operação, acesso via service role
ALTER TABLE public.ai_usage_log DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.ai_usage_log IS
    'Log de uso de IA por workspace. Populado pelo endpoint /ai/copilot. Usado para budget_alert e governança de modelos.';
;
