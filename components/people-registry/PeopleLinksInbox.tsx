"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  PeopleRegistryInvite,
  PeopleRegistryInviteCreateRequest,
  PeopleRegistryInviteCreateResponse,
  PeopleRegistryInviteEmailResponse,
  PeopleRegistryInviteListResponse,
} from "@/lib/people-registry/types";

type Props = {
  workspaceSlug: string;
};

type FormState = {
  partyName: string;
  email: string;
  projectTitle: string;
  trackTitle: string;
  role: string;
  remuneration: string;
  remunerationSource: "gestor" | "label";
  notes: string;
  expirationDays: string;
  includeAddress: boolean;
  includeBanking: boolean;
};

type UiState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "ready" };

const initialForm: FormState = {
  partyName: "",
  email: "",
  projectTitle: "",
  trackTitle: "",
  role: "",
  remuneration: "",
  remunerationSource: "gestor",
  notes: "",
  expirationDays: "14",
  includeAddress: false,
  includeBanking: false,
};

const STATUS_COPY: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pendente",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  sent: {
    label: "Enviado",
    className: "border-indigo-200 bg-indigo-50 text-indigo-800",
  },
  opened: {
    label: "Aberto",
    className: "border-blue-200 bg-blue-50 text-blue-800",
  },
  submitted: {
    label: "Concluído",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  submitted_pending_airtable: {
    label: "Sincronização pendente",
    className: "border-cyan-200 bg-cyan-50 text-cyan-800",
  },
  failed: {
    label: "Falhou",
    className: "border-red-200 bg-red-50 text-red-800",
  },
  expired: {
    label: "Expirado",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  discontinued: {
    label: "Descontinuado",
    className: "border-stone-300 bg-stone-100 text-stone-800",
  },
};

const FILTERS = [
  { label: "Todos", value: "all" },
  { label: "Pendentes", value: "pending" },
  { label: "Enviados", value: "sent" },
  { label: "Abertos", value: "opened" },
  { label: "Concluídos", value: "submitted" },
  { label: "Expirados", value: "expired" },
  { label: "Descontinuados", value: "discontinued" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-[#111111] outline-none transition focus:border-[#111111]";

const textareaClass =
  "mt-2 min-h-[92px] w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm leading-6 text-[#111111] outline-none transition focus:border-[#111111]";

function getErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const error = (data as { error?: { message?: string } }).error;
    if (error?.message) return error.message;
  }
  return fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "Sem expiração";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function contextText(invite: PeopleRegistryInvite, keys: string[]) {
  for (const key of keys) {
    const value = invite.context?.[key];
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function remunerationSourceLabel(value: string) {
  if (value === "label") return "cliente/label";
  if (value === "gestor") return "gestor";
  return value || "não informada";
}

function statusCopy(status: string) {
  return STATUS_COPY[status] ?? {
    label: status || "Pendente",
    className: "border-slate-200 bg-white text-slate-700",
  };
}

export default function PeopleLinksInbox({ workspaceSlug }: Props) {
  const [items, setItems] = useState<PeopleRegistryInvite[]>([]);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [uiState, setUiState] = useState<UiState>({ type: "idle" });
  const [form, setForm] = useState<FormState>(initialForm);
  const [creating, setCreating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const pending = items.filter((item) => item.status === "pending" || item.status === "sent" || item.status === "opened").length;
    const submitted = items.filter((item) => item.status === "submitted").length;
    const expired = items.filter((item) => item.status === "expired" || item.status === "discontinued").length;
    return { pending, submitted, expired };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "submitted") {
      return items.filter((item) => item.status === "submitted" || item.status === "submitted_pending_airtable");
    }
    return items.filter((item) => item.status === filter);
  }, [filter, items]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setActionError(null);
    setActionMessage(null);
  }, []);

  const loadInvites = useCallback(async () => {
    setUiState({ type: "loading" });
    try {
      const params = new URLSearchParams({
        workspace_slug: workspaceSlug,
        status: "all",
        limit: "100",
      });
      const response = await fetch(`/api/people-registry/invites?${params.toString()}`, {
        method: "GET",
      });
      const data = (await response.json()) as PeopleRegistryInviteListResponse;
      if (!response.ok || !data.ok) {
        throw new Error(getErrorMessage(data, "Não foi possível carregar os links."));
      }
      setItems(data.items ?? []);
      setUiState({ type: "ready" });
    } catch (error) {
      setUiState({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível carregar os links.",
      });
    }
  }, [workspaceSlug]);

  useEffect(() => {
    void loadInvites();
  }, [loadInvites]);

  async function handleCreateInvite() {
    const partyName = form.partyName.trim();
    if (!partyName) {
      setActionError("Informe o nome da parte antes de criar o link.");
      return;
    }

    const expirationDays = Number(form.expirationDays);
    if (!Number.isFinite(expirationDays) || expirationDays < 1 || expirationDays > 120) {
      setActionError("A expiração precisa estar entre 1 e 120 dias.");
      return;
    }

    const visibleSections = ["contact", "additionalInfo"];
    if (form.includeAddress) visibleSections.push("address");
    if (form.includeBanking) visibleSections.push("banking");

    const payload: PeopleRegistryInviteCreateRequest = {
      workspace_slug: workspaceSlug,
      profile: "atabaque_people_v1",
      airtable_clearance_part_id: null,
      expires_in_days: expirationDays,
      context: {
        source: "people_links_inbox",
        party_name: partyName,
        email: form.email.trim(),
        signing_email: form.email.trim(),
        project_title: form.projectTitle.trim(),
        track_title: form.trackTitle.trim(),
        requested_role: form.role.trim(),
        role: form.role.trim(),
        remuneration: form.remuneration.trim(),
        remuneration_source: form.remunerationSource,
        notes: form.notes.trim(),
        visible_sections: visibleSections,
      },
    };

    setCreating(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await fetch("/api/people-registry/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as PeopleRegistryInviteCreateResponse;
      if (!response.ok || !data.ok || !data.invite) {
        throw new Error(getErrorMessage(data, "Não foi possível criar o link."));
      }
      setForm(initialForm);
      setActionMessage("Link inteligente criado e adicionado à inbox.");
      await loadInvites();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Não foi possível criar o link.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(invite: PeopleRegistryInvite) {
    try {
      await navigator.clipboard.writeText(invite.invite_url);
      setActionMessage("Link copiado.");
      setActionError(null);
    } catch {
      setActionError("Não foi possível copiar automaticamente. Abra o link e copie pela barra do navegador.");
    }
  }

  async function handleSendEmail(invite: PeopleRegistryInvite) {
    const email = contextText(invite, ["signing_email", "email"]);
    if (!email) {
      setActionError("Este link não tem e-mail preenchido. Copie o link e envie manualmente.");
      return;
    }

    setActionError(null);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/people-registry/invites/${encodeURIComponent(invite.token)}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_slug: workspaceSlug,
          to_email: email,
          recipient_name: contextText(invite, ["party_name", "person_name"]),
        }),
      });
      const data = (await response.json()) as PeopleRegistryInviteEmailResponse;
      if (!response.ok || !data.ok) {
        throw new Error(getErrorMessage(data, "Não foi possível enviar o e-mail."));
      }
      setActionMessage(`E-mail enviado para ${email}.`);
      await loadInvites();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Não foi possível enviar o e-mail.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-black/8 bg-white px-5 py-5 shadow-[0_16px_36px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D867B]">
              Cadastro de partes
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
              Inbox de links inteligentes
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B655C]">
              Gere links de cadastro vinculados a projeto/faixa, função e remuneração indicada para apoiar a preparação dos contratos.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-black/8 bg-[#F8F5EF] px-4 py-3">
              <div className="text-xl font-semibold text-[#111111]">{stats.pending}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#7A746A]">Pendentes</div>
            </div>
            <div className="rounded-2xl border border-black/8 bg-[#F8F5EF] px-4 py-3">
              <div className="text-xl font-semibold text-[#111111]">{stats.submitted}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#7A746A]">Concluídos</div>
            </div>
            <div className="rounded-2xl border border-black/8 bg-[#F8F5EF] px-4 py-3">
              <div className="text-xl font-semibold text-[#111111]">{stats.expired}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#7A746A]">Encerrados</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-[24px] border border-black/8 bg-white px-5 py-5 shadow-[0_16px_36px_rgba(0,0,0,0.04)]">
          <div className="text-sm font-semibold text-[#111111]">Criar link personalizado</div>
          <div className="mt-4 grid gap-4">
            <label className="text-sm font-medium text-[#4A443D]">
              Nome da parte
              <input
                className={inputClass}
                value={form.partyName}
                onChange={(event) => setField("partyName", event.target.value)}
                placeholder="Nome da pessoa ou empresa"
              />
            </label>
            <label className="text-sm font-medium text-[#4A443D]">
              E-mail
              <input
                className={inputClass}
                value={form.email}
                onChange={(event) => setField("email", event.target.value)}
                placeholder="email@exemplo.com"
                type="email"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <label className="text-sm font-medium text-[#4A443D]">
                Projeto
                <input
                  className={inputClass}
                  value={form.projectTitle}
                  onChange={(event) => setField("projectTitle", event.target.value)}
                  placeholder="Projeto ou negócio"
                />
              </label>
              <label className="text-sm font-medium text-[#4A443D]">
                Faixa
                <input
                  className={inputClass}
                  value={form.trackTitle}
                  onChange={(event) => setField("trackTitle", event.target.value)}
                  placeholder="Nome da faixa"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <label className="text-sm font-medium text-[#4A443D]">
                Função
                <input
                  className={inputClass}
                  value={form.role}
                  onChange={(event) => setField("role", event.target.value)}
                  placeholder="Artista, autor, produtor..."
                />
              </label>
              <label className="text-sm font-medium text-[#4A443D]">
                Remuneração indicada
                <span className="mt-1 block text-xs font-normal leading-5 text-[#7A746A]">
                  Pode ser informada pelo cliente/label ou pelo gestor de direitos. A parte poderá confirmar ou pedir revisão.
                </span>
                <input
                  className={inputClass}
                  value={form.remuneration}
                  onChange={(event) => setField("remuneration", event.target.value)}
                  placeholder="25%, R$ 1.500 ou a definir"
                />
              </label>
              <label className="text-sm font-medium text-[#4A443D]">
                Origem
                <select
                  className={inputClass}
                  value={form.remunerationSource}
                  onChange={(event) => setField("remunerationSource", event.target.value as FormState["remunerationSource"])}
                >
                  <option value="gestor">Gestor de direitos</option>
                  <option value="label">Cliente / label</option>
                </select>
              </label>
            </div>
            <label className="text-sm font-medium text-[#4A443D]">
              Observações
              <textarea
                className={textareaClass}
                value={form.notes}
                onChange={(event) => setField("notes", event.target.value)}
                placeholder="Contexto para a pessoa entender o cadastro."
              />
            </label>
            <label className="text-sm font-medium text-[#4A443D]">
              Expira em
              <div className="mt-2 flex items-center gap-2">
                <input
                  className="h-11 w-24 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#111111] outline-none transition focus:border-[#111111]"
                  value={form.expirationDays}
                  onChange={(event) => setField("expirationDays", event.target.value)}
                  type="number"
                  min={1}
                  max={120}
                />
                <span className="text-sm text-[#6B655C]">dias</span>
              </div>
            </label>
            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm text-[#4A443D]">
                <input
                  type="checkbox"
                  checked={form.includeAddress}
                  onChange={(event) => setField("includeAddress", event.target.checked)}
                  className="h-4 w-4 rounded border-black/20"
                />
                Solicitar endereço
              </label>
              <label className="flex items-center gap-2 text-sm text-[#4A443D]">
                <input
                  type="checkbox"
                  checked={form.includeBanking}
                  onChange={(event) => setField("includeBanking", event.target.checked)}
                  className="h-4 w-4 rounded border-black/20"
                />
                Solicitar dados bancários
              </label>
            </div>
            <button
              type="button"
              onClick={handleCreateInvite}
              disabled={creating}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#111111] px-4 text-sm font-semibold text-white transition hover:bg-[#2B2926] disabled:opacity-60"
            >
              {creating ? "Criando..." : "Criar link"}
            </button>
          </div>
        </div>

        <div className="rounded-[24px] border border-black/8 bg-white px-5 py-5 shadow-[0_16px_36px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-[#111111]">Links recentes</div>
              <div className="mt-1 text-xs text-[#7A746A]">{filteredItems.length} de {items.length} item(ns) na inbox</div>
            </div>
            <button
              type="button"
              onClick={() => void loadInvites()}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-[#111111] transition hover:bg-[#F8F5EF]"
            >
              Atualizar
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {FILTERS.map((item) => {
              const active = filter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold transition ${
                    active
                      ? "border-[#512314] bg-[#512314] text-white"
                      : "border-black/10 bg-white text-[#4A443D] hover:bg-[#F8F5EF]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {(actionMessage || actionError) && (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                actionError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {actionError || actionMessage}
            </div>
          )}

          {uiState.type === "loading" && (
            <div className="mt-8 rounded-2xl border border-black/8 bg-[#F8F5EF] px-4 py-8 text-center text-sm text-[#6B655C]">
              Carregando links...
            </div>
          )}

          {uiState.type === "error" && (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
              {uiState.message}
            </div>
          )}

          {uiState.type !== "loading" && uiState.type !== "error" && filteredItems.length === 0 && (
            <div className="mt-8 rounded-2xl border border-black/8 bg-[#F8F5EF] px-4 py-8 text-center text-sm text-[#6B655C]">
              Nenhum link encontrado para este filtro.
            </div>
          )}

          {filteredItems.length > 0 && (
            <div className="mt-5 grid gap-3">
              {filteredItems.map((invite) => {
                const status = statusCopy(invite.status);
                const partyName = contextText(invite, ["party_name", "person_name"]) || "Parte sem nome";
                const projectTitle = contextText(invite, ["project_title", "clearance_case_name"]);
                const trackTitle = contextText(invite, ["track_title", "clearance_item_name"]);
                const email = contextText(invite, ["signing_email", "email"]);
                const role = contextText(invite, ["requested_role", "role"]);
                const remuneration = contextText(invite, ["remuneration", "participation_percent", "fixed_amount"]);
                const remunerationSource = contextText(invite, ["remuneration_source", "remunerationOrigem"]);

                return (
                  <article key={invite.token} className="rounded-2xl border border-black/8 bg-[#FFFEFB] px-4 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-[#111111]">{partyName}</h3>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="mt-2 grid gap-1 text-xs leading-5 text-[#6B655C]">
                          <div>
                            <span className="font-semibold text-[#4A443D]">Projeto:</span>{" "}
                            {projectTitle || "—"}
                            {trackTitle ? ` · ${trackTitle}` : ""}
                          </div>
                          <div>
                            <span className="font-semibold text-[#4A443D]">Função:</span>{" "}
                            {role || "—"}
                            <span className="mx-2 text-[#B8B0A3]">|</span>
                            <span className="font-semibold text-[#4A443D]">Remuneração indicada:</span>{" "}
                            {remuneration || "—"}
                            {remunerationSource ? (
                              <span className="ml-1 text-[#8D867B]">
                                ({remunerationSourceLabel(remunerationSource)})
                              </span>
                            ) : null}
                          </div>
                          <div>
                            <span className="font-semibold text-[#4A443D]">E-mail:</span>{" "}
                            {email || "—"}
                            <span className="mx-2 text-[#B8B0A3]">|</span>
                            <span className="font-semibold text-[#4A443D]">Expira:</span>{" "}
                            {formatDate(invite.expires_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleCopy(invite)}
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-black/10 bg-white px-3 text-xs font-semibold text-[#111111] transition hover:bg-[#F8F5EF]"
                        >
                          Copiar link
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSendEmail(invite)}
                          disabled={!email || invite.status === "expired" || invite.status === "discontinued" || invite.status === "submitted" || invite.status === "submitted_pending_airtable"}
                          className="inline-flex h-9 items-center justify-center rounded-xl bg-[#111111] px-3 text-xs font-semibold text-white transition hover:bg-[#2B2926] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {invite.status === "sent" || invite.status === "opened" ? "Reenviar" : "Enviar e-mail"}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 truncate rounded-xl border border-black/8 bg-white px-3 py-2 font-mono text-[11px] text-[#6B655C]">
                      {invite.invite_url}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
