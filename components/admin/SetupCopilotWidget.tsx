"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import type {
  SetupCopilotProposalAction,
  SetupCopilotActionRisk,
  SetupCopilotActionType,
  SetupCopilotProposal,
} from "@/lib/ai/setup-copilot";
import type {
  SetupAIActionAuditEntry,
  SetupAIActionAuditOperation,
  SetupAIActionAuditStatus,
} from "@/lib/setup-ai/action-audit";

type Message = {
  role: "user" | "assistant" | "error";
  content: string;
  proposal?: SetupCopilotProposal | null;
  meta?: {
    provider?: string;
    model?: string;
    usedFallback?: boolean;
    budgetAlert?: BudgetAlert | null;
  };
};

type Props = {
  workspaceSlug: string;
};

type BudgetAlert = {
  pct_used?: number;
  used_brl?: number;
  limit_brl?: number;
  plan_id?: string;
  alert_threshold?: number;
};

type CopilotResponse = {
  ok?: boolean;
  text?: string;
  error?: string;
  proposal?: SetupCopilotProposal | null;
  used_fallback?: boolean;
  provider?: string;
  model?: string;
  budget_alert?: BudgetAlert | null;
};

type ActionRunState = {
  loading?: "preview_patch" | "apply_patch";
  error?: string | null;
  preview?: unknown;
  applied?: unknown;
};

type AuditResponse = {
  ok?: boolean;
  data?: SetupAIActionAuditEntry[];
  error?: string;
  warning?: string;
};

function formatCopilotError(error: string | undefined) {
  if (error?.toLowerCase().includes("copilot secret")) {
    return "Copilot aguardando token interno do backend. Os formulários seguem operando normalmente.";
  }

  return (
    error ??
    "O copilot não está disponível no momento. Verifique a configuração da IA no backend."
  );
}

export default function SetupCopilotWidget({ workspaceSlug }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionStates, setActionStates] = useState<Record<string, ActionRunState>>({});
  const [auditEntries, setAuditEntries] = useState<SetupAIActionAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadAuditLog = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetch(
        `/api/workspaces/${encodeURIComponent(workspaceSlug)}/setup-ai/audit?limit=8`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as AuditResponse;

      if (!res.ok || !data.ok) {
        setAuditMessage(data?.error ?? "Nao foi possivel carregar auditoria.");
        return;
      }

      setAuditEntries(data.data ?? []);
      setAuditMessage(data.warning ?? null);
    } catch {
      setAuditMessage("Erro de rede ao carregar auditoria.");
    } finally {
      setAuditLoading(false);
    }
  }, [workspaceSlug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    void loadAuditLog();
  }, [loadAuditLog]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, workspaceSlug }),
      });
      const data = (await res.json()) as CopilotResponse;

      if (!res.ok || !data.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "error",
            content: formatCopilotError(data?.error),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.text ?? "",
            proposal: data.proposal ?? null,
            meta: {
              provider: data.provider,
              model: data.model,
              usedFallback: data.used_fallback,
              budgetAlert: data.budget_alert,
            },
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: "Erro de rede. Verifique a conexão e tente novamente.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function runAirtableAction(
    action: SetupCopilotProposalAction,
    operation: "preview_patch" | "apply_patch"
  ) {
    const payload = buildAirtableActionPayload(action);
    if (!payload) {
      setActionStates((prev) => ({
        ...prev,
        [action.id]: {
          ...prev[action.id],
          error:
            "A proposta precisa indicar workflow_type e patch Airtable antes de executar.",
        },
      }));
      return;
    }

    setActionStates((prev) => ({
      ...prev,
      [action.id]: { ...prev[action.id], loading: operation, error: null },
    }));

    try {
      const res = await fetch(
        `/api/workspaces/${encodeURIComponent(workspaceSlug)}/setup-ai/airtable`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            operation,
            ...(operation === "apply_patch" ? { confirm_apply: true } : {}),
          }),
        }
      );
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setActionStates((prev) => ({
          ...prev,
          [action.id]: {
            ...prev[action.id],
            loading: undefined,
            error: data?.error ?? "Nao foi possivel executar a action.",
          },
        }));
        return;
      }

      setActionStates((prev) => ({
        ...prev,
        [action.id]: {
          ...prev[action.id],
          loading: undefined,
          error: null,
          ...(operation === "preview_patch"
            ? { preview: data }
            : { applied: data }),
        },
      }));
      void loadAuditLog();
    } catch {
      setActionStates((prev) => ({
        ...prev,
        [action.id]: {
          ...prev[action.id],
          loading: undefined,
          error: "Erro de rede ao executar action.",
        },
      }));
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Message history */}
      <div
        className={`min-h-[172px] rounded-[24px] border border-[#E2D8C8] bg-[#F8F3EA] p-5 ${
          isEmpty ? "flex items-center justify-center" : ""
        }`}
        style={{ maxHeight: "360px", overflowY: "auto" }}
      >
        {isEmpty ? (
          <p className="text-center text-sm text-[#776D62]">
            Faça uma pergunta sobre a configuração do workspace — workflows, branding, integrações, campos do formulário…
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-[18px] px-4 py-3 text-sm leading-7 ${
                    msg.role === "user"
                      ? "bg-[#2B241D] text-white shadow-[0_8px_24px_rgba(43,36,29,0.16)]"
                      : msg.role === "error"
                        ? "border border-amber-200 bg-amber-50 text-amber-900"
                        : "border border-[#E2D8C8] bg-white text-[#2B241D]"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="grid gap-3">
                      <AssistantText content={msg.content} />
                      {msg.proposal && (
                        <SetupProposalCard
                          proposal={msg.proposal}
                          actionStates={actionStates}
                          onRunAirtableAction={runAirtableAction}
                        />
                      )}
                      {msg.meta && <AssistantMeta meta={msg.meta} />}
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-[18px] border border-[#E2D8C8] bg-white px-4 py-3">
                  <ThinkingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex gap-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Como configurar o release intake para meu workspace?  (Enter para enviar, Shift+Enter para nova linha)"
          disabled={loading}
          rows={2}
          className="flex-1 resize-none rounded-[18px] border border-[#D9CDBD] bg-white px-4 py-3 text-sm text-[#2B241D] placeholder:text-[#958A7E] outline-none transition-colors focus:border-[#D6A21E] focus:ring-4 focus:ring-[#FACC15]/15 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="self-end rounded-[18px] border border-[#D8A81D] bg-[#FACC15] px-5 py-3 text-sm font-semibold text-[#16120F] shadow-[0_10px_24px_rgba(214,162,30,0.18)] transition-colors hover:bg-[#F7C20D] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "…" : "Enviar"}
        </button>
      </div>

      <SetupActionAuditPanel
        entries={auditEntries}
        loading={auditLoading}
        message={auditMessage}
        onRefresh={loadAuditLog}
      />

      <p className="text-xs text-[#81776B]">Sugestões dependem de revisão humana.</p>
    </div>
  );
}

// Render assistant text — preserves newlines, no markdown parser needed
function AssistantText({ content }: { content: string }) {
  const lines = (content || "Sem resposta textual. Revise a proposta abaixo.").split("\n");

  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

function actionTypeLabel(type: SetupCopilotActionType) {
  const labels: Record<SetupCopilotActionType, string> = {
    draft_form_schema: "Formulário",
    draft_table_schema: "Tabela",
    configure_airtable: "Airtable",
    adjust_field: "Campo",
    create_workflow: "Workflow",
    review_sync: "Sync",
    clarify: "Clarificar",
  };
  return labels[type];
}

function riskStyle(risk: SetupCopilotActionRisk) {
  if (risk === "high") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  if (risk === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

const AIRTABLE_DIRECT_PATCH_KEYS = new Set([
  "base_id_override",
  "table_override",
  "company_registry_table_override",
  "people_registry_table_override",
  "merge_keys",
  "field_map",
]);

function buildAirtableActionPayload(action: SetupCopilotProposalAction) {
  const patch = action.patch;
  if (!isRecord(patch)) {
    return null;
  }

  const workflowType =
    action.target.workflowType ||
    textValue(patch.workflow_type) ||
    textValue(patch.workflowType);

  if (!workflowType) {
    return null;
  }

  const payload: {
    workflow_type: string;
    airtable_sync_enabled?: boolean;
    airtable?: Record<string, unknown>;
  } = {
    workflow_type: workflowType,
  };

  if (typeof patch.airtable_sync_enabled === "boolean") {
    payload.airtable_sync_enabled = patch.airtable_sync_enabled;
  }

  if (isRecord(patch.airtable)) {
    payload.airtable = patch.airtable;
  } else {
    const airtablePatch: Record<string, unknown> = {};
    Object.entries(patch).forEach(([key, value]) => {
      if (AIRTABLE_DIRECT_PATCH_KEYS.has(key)) {
        airtablePatch[key] = value;
      }
    });
    if (Object.keys(airtablePatch).length > 0) {
      payload.airtable = airtablePatch;
    }
  }

  if (
    !("airtable_sync_enabled" in payload) &&
    Object.keys(payload.airtable ?? {}).length === 0
  ) {
    return null;
  }

  return payload;
}

function SetupProposalCard({
  proposal,
  actionStates,
  onRunAirtableAction,
}: {
  proposal: SetupCopilotProposal;
  actionStates: Record<string, ActionRunState>;
  onRunAirtableAction: (
    action: SetupCopilotProposalAction,
    operation: "preview_patch" | "apply_patch"
  ) => void;
}) {
  return (
    <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800">
          Review only
        </span>
        <span className="rounded-full border border-[#E2D8C8] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#746A5F]">
          Confiança {proposal.confidence}
        </span>
      </div>

      <div className="mt-3 text-sm font-semibold text-[#2B241D]">{proposal.title}</div>
      <p className="mt-2 text-xs leading-6 text-[#625A51]">{proposal.summary}</p>

      <div className="mt-4 grid gap-2">
        {proposal.actions.map((action) => (
          <div
            key={action.id}
            className="rounded-[16px] border border-amber-200 bg-white p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#E2D8C8] bg-[#FBF7EF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6D6258]">
                {actionTypeLabel(action.type)}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${riskStyle(action.risk)}`}
              >
                Risco {action.risk}
              </span>
            </div>
            <div className="mt-2 text-sm font-semibold text-[#2B241D]">
              {action.title}
            </div>
            <p className="mt-1 text-xs leading-6 text-[#625A51]">
              {action.description}
            </p>
            {action.warnings.length > 0 && (
              <div className="mt-2 grid gap-1">
                {action.warnings.map((warning) => (
                  <div key={warning} className="text-[11px] leading-5 text-amber-800">
                    {warning}
                  </div>
                ))}
              </div>
            )}
            <ActionControls
              action={action}
              state={actionStates[action.id]}
              onRunAirtableAction={onRunAirtableAction}
            />
          </div>
        ))}
      </div>

      {proposal.nextQuestions.length > 0 && (
        <div className="mt-4 rounded-[16px] border border-amber-200 bg-white p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#91877A]">
            Perguntas pendentes
          </div>
          <div className="mt-2 grid gap-1.5">
            {proposal.nextQuestions.map((question) => (
              <div key={question} className="text-xs leading-5 text-[#625A51]">
                {question}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 text-[11px] leading-5 text-[#81776B]">
        {proposal.governance.reason}
      </div>
    </div>
  );
}

function ActionControls({
  action,
  state,
  onRunAirtableAction,
}: {
  action: SetupCopilotProposalAction;
  state: ActionRunState | undefined;
  onRunAirtableAction: (
    action: SetupCopilotProposalAction,
    operation: "preview_patch" | "apply_patch"
  ) => void;
}) {
  if (action.type !== "configure_airtable") {
    return null;
  }

  const canRun = Boolean(buildAirtableActionPayload(action));
  const hasPreview = Boolean(state?.preview);
  const previewLoading = state?.loading === "preview_patch";
  const applyLoading = state?.loading === "apply_patch";

  return (
    <div className="mt-3 rounded-[14px] border border-[#E2D8C8] bg-[#FBF7EF] p-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canRun || previewLoading || applyLoading}
          onClick={() => onRunAirtableAction(action, "preview_patch")}
          className="rounded-xl border border-[#D9CDBD] bg-white px-3 py-2 text-xs font-semibold text-[#2B241D] transition hover:bg-[#F8F3EA] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {previewLoading ? "Gerando preview..." : "Preview Airtable"}
        </button>
        <button
          type="button"
          disabled={!canRun || !hasPreview || previewLoading || applyLoading}
          onClick={() => onRunAirtableAction(action, "apply_patch")}
          className="rounded-xl border border-amber-300 bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {applyLoading ? "Aplicando..." : "Aplicar com confirmacao"}
        </button>
      </div>

      {!canRun && (
        <p className="mt-2 text-[11px] leading-5 text-[#81776B]">
          Esta action ainda precisa de `workflowType` e patch Airtable para
          executar.
        </p>
      )}

      {state?.error && (
        <p className="mt-2 text-[11px] leading-5 text-red-700">{state.error}</p>
      )}

      {state?.preview ? (
        <ResultPreview label="Preview recebido" value={state.preview} />
      ) : null}

      {state?.applied ? (
        <ResultPreview label="Aplicacao confirmada" value={state.applied} />
      ) : null}
    </div>
  );
}

function ResultPreview({ label, value }: { label: string; value: unknown }) {
  return (
    <details className="mt-3 rounded-[12px] border border-[#E2D8C8] bg-white p-3">
      <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.14em] text-[#746A5F]">
        {label}
      </summary>
      <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-[#4C4238]">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

function operationLabel(operation: SetupAIActionAuditOperation) {
  const labels: Record<SetupAIActionAuditOperation, string> = {
    read: "Leitura",
    preview_patch: "Preview",
    apply_patch: "Aplicacao",
  };
  return labels[operation];
}

function auditStatusLabel(status: SetupAIActionAuditStatus) {
  const labels: Record<SetupAIActionAuditStatus, string> = {
    requested: "Solicitado",
    succeeded: "Concluido",
    failed: "Falhou",
    blocked: "Bloqueado",
  };
  return labels[status];
}

function auditStatusStyle(status: SetupAIActionAuditStatus) {
  if (status === "succeeded") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "failed" || status === "blocked") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function formatAuditDate(value: string | null) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function SetupActionAuditPanel({
  entries,
  loading,
  message,
  onRefresh,
}: {
  entries: SetupAIActionAuditEntry[];
  loading: boolean;
  message: string | null;
  onRefresh: () => void;
}) {
  if (entries.length === 0 && !message) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#E2D8C8] bg-[#FBF7EF] px-4 py-3">
        <span className="text-xs text-[#81776B]">Auditoria: nenhuma ação registrada.</span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl border border-[#D9CDBD] bg-white px-3 py-2 text-xs font-semibold text-[#4C4238] transition hover:bg-[#F8F3EA] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-[20px] border border-[#E2D8C8] bg-[#FBF7EF] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#91877A]">
            Auditoria Setup AI
          </div>
          <div className="mt-1 text-sm font-semibold text-[#2B241D]">
            Ultimas acoes revisaveis
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl border border-[#D9CDBD] bg-white px-3 py-2 text-xs font-semibold text-[#4C4238] transition hover:bg-[#F8F3EA] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {message && (
        <p className="mt-3 rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          {message}
        </p>
      )}

      {entries.length === 0 ? (
        <p className="mt-3 text-xs leading-6 text-[#81776B]">
          Nenhuma action registrada ainda para este workspace.
        </p>
      ) : (
        <div className="mt-3 grid gap-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-[14px] border border-[#E2D8C8] bg-white px-3 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${auditStatusStyle(entry.status)}`}
                >
                  {auditStatusLabel(entry.status)}
                </span>
                <span className="rounded-full border border-[#E2D8C8] bg-[#FBF7EF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#746A5F]">
                  {operationLabel(entry.operation)}
                </span>
                <span className="font-mono text-[10px] text-[#81776B]">
                  {formatAuditDate(entry.created_at)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#625A51]">
                <span>{entry.workflow_type}</span>
                {entry.requested_by_email && <span>{entry.requested_by_email}</span>}
                {entry.dry_run === true && <span>dry-run</span>}
                {entry.confirmed === true && <span>confirmado</span>}
              </div>

              {entry.error_message && (
                <p className="mt-2 text-[11px] leading-5 text-red-700">
                  {entry.error_message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AssistantMeta({
  meta,
}: {
  meta: NonNullable<Message["meta"]>;
}) {
  const budgetAlert = meta.budgetAlert;

  return (
    <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em] text-[#81776B]">
      {meta.provider && <span>{meta.provider}</span>}
      {meta.model && <span>{meta.model}</span>}
      {meta.usedFallback && <span>fallback</span>}
      {budgetAlert && (
        <span>
          budget {budgetAlert.pct_used}% de R${budgetAlert.limit_brl}
        </span>
      )}
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-[#81776B]"
          style={{
            animation: "pulse 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </span>
  );
}
