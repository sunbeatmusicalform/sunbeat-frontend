"use client";

// components/people-registry/PeopleRegistryForm.tsx
// Formulário multi-step de cadastro de pessoas — PF/PJ, profile-driven
// Visual alinhado ao design system dos forms existentes (tema claro, #ebdbba, slate)

import { Fragment, useState, useCallback, useMemo, useEffect, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import { DEFAULT_FORM_THEME } from "@/lib/form-engine/types";
import type {
  PeopleRegistryProfileConfig,
  PeopleRegistryFormValues,
  PeopleRegistryApiPayload,
  PeopleRegistryInvite,
  PeopleRegistryInviteContext,
  PeopleRegistryInviteParticipation,
  PeopleRegistrySubmitResult,
  PartyKind,
} from "@/lib/people-registry/types";

// ─── Steps ───────────────────────────────────────────────────────────────────

type StepKey =
  | "intro"
  | "identification"
  | "contact"
  | "address"
  | "banking"
  | "additional_info"
  | "review_submit";

// Mapeamento showSections → StepKey (para steps opcionais)
const SECTION_STEP_MAP = {
  contact:       "contact"        as StepKey,
  address:       "address"        as StepKey,
  banking:       "banking"        as StepKey,
  additionalInfo:"additional_info" as StepKey,
} as const;

type InviteVisibleSection = keyof typeof SECTION_STEP_MAP;

const DEFAULT_INVITE_VISIBLE_SECTIONS: InviteVisibleSection[] = [
  "contact",
  "additionalInfo",
];

const STEP_LABELS: Record<Exclude<StepKey, "intro">, string> = {
  identification: "Identificação",
  contact: "Contato",
  address: "Endereço",
  banking: "Dados bancários",
  additional_info: "Informações",
  review_submit: "Revisão",
};

type InviteParticipationValues = {
  confirmation_status: "confirmado" | "em_negociacao";
  musical_role: string;
  remuneration_type: string;
  participation_percent: string;
  fixed_amount: string;
  notes: string;
};

const REMUNERATION_OPTIONS = [
  "Percentual",
  "Valor fixo",
  "Percentual + valor fixo",
  "A definir",
];

const MUSICAL_ROLE_OPTIONS = [
  "Intérprete / Artista",
  "Autor / Compositor",
  "Produtor musical",
  "Produtor fonográfico",
  "Editora",
  "Gravadora / Selo",
  "Empresário / Responsável",
];

const INVITE_ROLE_ALIASES: Array<{ match: string[]; role: string }> = [
  { match: ["interprete", "intérprete", "artista", "artist"], role: "interprete" },
  { match: ["autor", "compositor", "composer", "lyricist", "letrista"], role: "compositor" },
  { match: ["produtor musical", "producer"], role: "produtor" },
  { match: ["produtor fonografico", "produtor fonográfico"], role: "produtor" },
  { match: ["editora", "publisher"], role: "editora" },
  { match: ["gravadora", "selo", "label"], role: "gravadora" },
  { match: ["responsavel", "responsável", "manager", "contato"], role: "contato" },
];

// ─── Estado inicial ───────────────────────────────────────────────────────────

function createInitialFormValues(): PeopleRegistryFormValues {
  return {
    party_kind: "pf",
    display_name: "",
    legal_name: "",
    document_id: "",
    roles: [],
    stage_name: "",
    trade_name: "",
    email_primary: "",
    phone_primary: "",
    website: "",
    instagram: "",
    country: "Brasil",
    state_region: "",
    city: "",
    postal_code: "",
    address_line_1: "",
    pix_key: "",
    bank_name: "",
    bank_agency: "",
    account_number: "",
    account_holder_name: "",
    account_holder_document_id: "",
    manager_name: "",
    label_name: "",
    notes_internal: "",
  };
}

function createInitialInviteParticipation(): InviteParticipationValues {
  return {
    confirmation_status: "confirmado",
    musical_role: "",
    remuneration_type: "A definir",
    participation_percent: "",
    fixed_amount: "",
    notes: "",
  };
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function firstContextValue(
  context: PeopleRegistryInviteContext | null,
  keys: string[]
): string {
  if (!context) return "";
  for (const key of keys) {
    const value = normalizeText(context[key]);
    if (value) return value;
  }
  return "";
}

function parseOptionalNumber(value: string): number | undefined {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatContextNumber(value: unknown): string {
  if (typeof value === "number") return String(value);
  return normalizeText(value);
}

function resolveInviteVisibleSections(
  context: PeopleRegistryInviteContext | null,
  isInviteMode: boolean
): Set<InviteVisibleSection> | null {
  if (!isInviteMode) return null;

  const raw = context?.visible_sections;
  const requested = Array.isArray(raw)
    ? raw.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const source = requested.length > 0
    ? requested
    : DEFAULT_INVITE_VISIBLE_SECTIONS;
  const allowed = new Set<InviteVisibleSection>();

  source.forEach((item) => {
    if (item in SECTION_STEP_MAP) {
      allowed.add(item as InviteVisibleSection);
    }
  });

  if (allowed.size === 0) {
    DEFAULT_INVITE_VISIBLE_SECTIONS.forEach((item) => allowed.add(item));
  }

  return allowed;
}

function resolveInviteRole(
  rawRole: string,
  profile: PeopleRegistryProfileConfig
): string | null {
  const normalized = rawRole.toLowerCase();
  const exact = profile.availableRoles.find((role) => role.value === rawRole);
  if (exact) return exact.value;

  const byLabel = profile.availableRoles.find((role) =>
    normalized.includes(role.label.toLowerCase())
  );
  if (byLabel) return byLabel.value;

  const alias = INVITE_ROLE_ALIASES.find((item) =>
    item.match.some((match) => normalized.includes(match))
  );
  if (!alias) return null;

  return profile.availableRoles.some((role) => role.value === alias.role)
    ? alias.role
    : null;
}

function resolveMusicalRoleOption(rawRole: string): string {
  const normalized = rawRole.toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("artista") || normalized.includes("intérprete") || normalized.includes("interprete")) {
    return "Intérprete / Artista";
  }
  if (normalized.includes("autor") || normalized.includes("compositor")) {
    return "Autor / Compositor";
  }
  if (normalized.includes("fonograf")) {
    return "Produtor fonográfico";
  }
  if (normalized.includes("produtor")) {
    return "Produtor musical";
  }
  if (normalized.includes("editora")) {
    return "Editora";
  }
  if (normalized.includes("gravadora") || normalized.includes("selo")) {
    return "Gravadora / Selo";
  }
  if (normalized.includes("respons")) {
    return "Empresário / Responsável";
  }
  return rawRole;
}

function resolveRemunerationOption(rawValue: string): string {
  const normalized = rawValue.toLowerCase();
  if (!normalized) return "A definir";

  const exact = REMUNERATION_OPTIONS.find((option) => option.toLowerCase() === normalized);
  if (exact) return exact;

  const hasPercent = normalized.includes("percent");
  const hasFixed = normalized.includes("fix") || normalized.includes("valor");
  if (hasPercent && hasFixed) return "Percentual + valor fixo";
  if (hasPercent) return "Percentual";
  if (hasFixed) return "Valor fixo";
  return "A definir";
}

function resolveRemunerationSource(rawValue: string): string {
  const normalized = rawValue.toLowerCase();
  if (normalized === "label" || normalized.includes("cliente")) return "cliente/label";
  if (normalized === "gestor" || normalized.includes("henrique")) return "gestor";
  return rawValue;
}

function parseRemunerationIndication(rawValue: string): {
  remunerationType: string;
  participationPercent: string;
  fixedAmount: string;
} {
  const raw = rawValue.trim();
  const normalized = raw.toLowerCase();
  const percentMatch = raw.match(/(\d+(?:[,.]\d+)?)\s*%/);
  const explicitCurrencyMatch = raw.match(/r\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:[,.]\d+)?)/i);
  const looseNumberMatch = raw.match(/(\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:[,.]\d+)?)/);
  const hasPercent = Boolean(percentMatch);
  const hasFixed = Boolean(explicitCurrencyMatch) || normalized.includes("valor") || (Boolean(looseNumberMatch) && !hasPercent);
  const fixedMatch = explicitCurrencyMatch ?? (!hasPercent ? looseNumberMatch : null);

  return {
    remunerationType: hasPercent && hasFixed
      ? "Percentual + valor fixo"
      : hasPercent
      ? "Percentual"
      : hasFixed
      ? "Valor fixo"
      : "A definir",
    participationPercent: percentMatch?.[1]?.replace(",", ".") ?? "",
    fixedAmount: hasFixed && fixedMatch?.[1]
      ? fixedMatch[1].replace(/\./g, "").replace(",", ".")
      : "",
  };
}

function formatInviteRemuneration(values: InviteParticipationValues): string {
  const parts = [values.remuneration_type || "A definir"];
  if (values.participation_percent.trim()) {
    parts.push(`${values.participation_percent.trim()}%`);
  }
  if (values.fixed_amount.trim()) {
    parts.push(`R$ ${values.fixed_amount.trim()}`);
  }
  return parts.join(" · ");
}

function buildInviteParticipationPayload(
  values: InviteParticipationValues
): PeopleRegistryInviteParticipation {
  return {
    confirmation_status: values.confirmation_status,
    ...(values.musical_role.trim() ? { musical_role: values.musical_role.trim() } : {}),
    ...(values.remuneration_type.trim() ? { remuneration_type: values.remuneration_type.trim() } : {}),
    ...(parseOptionalNumber(values.participation_percent) !== undefined
      ? { participation_percent: parseOptionalNumber(values.participation_percent) }
      : {}),
    ...(parseOptionalNumber(values.fixed_amount) !== undefined
      ? { fixed_amount: parseOptionalNumber(values.fixed_amount) }
      : {}),
    ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
  };
}

// ─── Payload builder ──────────────────────────────────────────────────────────

function buildApiPayload(
  values: PeopleRegistryFormValues,
  profile: PeopleRegistryProfileConfig
): PeopleRegistryApiPayload {
  const isPF = values.party_kind === "pf";

  return {
    workspace_slug: profile.workspaceSlug,
    workflow_type: "people_registry",
    profile: profile.profile,
    party: {
      party_kind: values.party_kind,
      display_name: values.display_name.trim(),
      legal_name: values.legal_name.trim(),
      ...(isPF && values.stage_name.trim() ? { stage_name: values.stage_name.trim() } : {}),
      ...(!isPF && values.trade_name.trim() ? { trade_name: values.trade_name.trim() } : {}),
      ...(values.document_id.trim() ? { document_id: values.document_id.trim() } : {}),
      roles: values.roles,
    },
    contact: {
      ...(values.email_primary.trim() ? { email_primary: values.email_primary.trim() } : {}),
      ...(values.phone_primary.trim() ? { phone_primary: values.phone_primary.trim() } : {}),
      ...(values.website.trim() ? { website: values.website.trim() } : {}),
      ...(values.instagram.trim() ? { instagram: values.instagram.trim() } : {}),
    },
    address: {
      ...(values.country.trim() ? { country: values.country.trim() } : {}),
      ...(values.state_region.trim() ? { state_region: values.state_region.trim() } : {}),
      ...(values.city.trim() ? { city: values.city.trim() } : {}),
      ...(values.postal_code.trim() ? { postal_code: values.postal_code.trim() } : {}),
      ...(values.address_line_1.trim() ? { address_line_1: values.address_line_1.trim() } : {}),
    },
    banking: {
      ...(values.pix_key.trim() ? { pix_key: values.pix_key.trim() } : {}),
      ...(values.bank_name.trim() ? { bank_name: values.bank_name.trim() } : {}),
      ...(values.bank_agency.trim() ? { bank_agency: values.bank_agency.trim() } : {}),
      ...(values.account_number.trim() ? { account_number: values.account_number.trim() } : {}),
      ...(values.account_holder_name.trim() ? { account_holder_name: values.account_holder_name.trim() } : {}),
      ...(values.account_holder_document_id.trim()
        ? { account_holder_document_id: values.account_holder_document_id.trim() }
        : {}),
    },
    additional_info: {
      ...(values.manager_name.trim() ? { manager_name: values.manager_name.trim() } : {}),
      ...(values.label_name.trim() ? { label_name: values.label_name.trim() } : {}),
      ...(values.notes_internal.trim() ? { notes_internal: values.notes_internal.trim() } : {}),
      external_refs: {},
    },
    meta: {
      form_version: profile.formVersion,
      source: `sunbeat.${profile.workspaceSlug}.people_registry.${profile.formVersion}`,
      submitted_at: new Date().toISOString(),
    },
  };
}

// ─── Localização de mensagens do backend ──────────────────────────────────────
// O backend retorna mensagens em inglês. Mapeamos as conhecidas para português.

const BACKEND_MESSAGES_PT: Record<string, string> = {
  "A matching people registry record already exists in this workspace.":
    "Já existe um cadastro com este documento ou e-mail neste workspace.",
  "People registry payload validation failed.":
    "Alguns campos precisam ser corrigidos antes de continuar.",
  "Could not check people registry duplicates":
    "Não foi possível verificar duplicatas. Tente novamente.",
  "Could not persist people registry record":
    "Erro ao salvar o cadastro. Tente novamente ou contate o suporte.",
};

function localizarMensagem(msg: string): string {
  // Busca match exato primeiro, depois partial (para mensagens com detalhes dinâmicos)
  if (BACKEND_MESSAGES_PT[msg]) return BACKEND_MESSAGES_PT[msg];
  const partial = Object.keys(BACKEND_MESSAGES_PT).find((k) => msg.startsWith(k));
  return partial ? BACKEND_MESSAGES_PT[partial] : msg;
}

// ─── API call ─────────────────────────────────────────────────────────────────

async function submitPeopleRegistry(
  payload: PeopleRegistryApiPayload
): Promise<PeopleRegistrySubmitResult> {
  let res: Response;
  try {
    res = await fetch("/api/people-registry/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, status: "error", message: "Não foi possível conectar ao servidor. Tente novamente." };
  }

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    return { ok: false, status: "error", message: `Resposta inesperada do servidor (HTTP ${res.status}).` };
  }

  if (res.status === 201) {
    const record = data.record as Record<string, unknown> | undefined;
    return {
      ok: true,
      status: "created",
      record_id: String(record?.record_id ?? ""),
      created_at: String(record?.created_at ?? ""),
    };
  }

  if (res.status === 409) {
    const error = data.error as Record<string, unknown> | undefined;
    const raw = typeof error?.message === "string" ? error.message : "";
    return {
      ok: false,
      status: "conflict",
      message: localizarMensagem(raw) || "Já existe um cadastro com este documento ou e-mail neste workspace.",
    };
  }

  if (res.status === 422) {
    const error = data.error as Record<string, unknown> | undefined;
    const rawIssues = Array.isArray(error?.issues) ? error.issues : [];
    const rawMsg = typeof error?.message === "string" ? error.message : "";
    return {
      ok: false,
      status: "invalid",
      issues: rawIssues.map((i: unknown) => {
        const issue = i as Record<string, unknown>;
        return { field: String(issue?.field ?? ""), message: String(issue?.message ?? "") };
      }),
      message: localizarMensagem(rawMsg) || "Verifique os campos obrigatórios e tente novamente.",
    };
  }

  return { ok: false, status: "error", message: `Erro inesperado (HTTP ${res.status}). Contate o suporte.` };
}

type PeopleRegistryInviteFetchResult =
  | { ok: true; invite: PeopleRegistryInvite }
  | { ok: false; message: string };

async function fetchPeopleRegistryInvite(
  inviteToken: string
): Promise<PeopleRegistryInviteFetchResult> {
  let res: Response;
  try {
    res = await fetch(`/api/people-registry/invites/${encodeURIComponent(inviteToken)}`);
  } catch {
    return { ok: false, message: "Não foi possível carregar o convite." };
  }

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    return { ok: false, message: `Resposta inesperada do servidor (HTTP ${res.status}).` };
  }

  if (res.ok && data.ok) {
    return { ok: true, invite: data.invite as PeopleRegistryInvite };
  }

  const error = data.error as Record<string, unknown> | undefined;
  const message =
    typeof error?.message === "string"
      ? error.message
      : res.status === 410
      ? "Este convite expirou."
      : "Convite não encontrado.";
  return { ok: false, message };
}

async function submitPeopleRegistryInvite(
  inviteToken: string,
  payload: PeopleRegistryApiPayload,
  participation: PeopleRegistryInviteParticipation
): Promise<PeopleRegistrySubmitResult> {
  let res: Response;
  try {
    res = await fetch(`/api/people-registry/invites/${encodeURIComponent(inviteToken)}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person: payload, participation }),
    });
  } catch {
    return { ok: false, status: "error", message: "Não foi possível conectar ao servidor. Tente novamente." };
  }

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    return { ok: false, status: "error", message: `Resposta inesperada do servidor (HTTP ${res.status}).` };
  }

  const people = data.people as Record<string, unknown> | undefined;
  const peopleError = people?.error as Record<string, unknown> | undefined;

  if (res.ok && data.ok) {
    const record = people?.record as Record<string, unknown> | undefined;
    const inviteStatus = String(data.status ?? "");
    return {
      ok: true,
      status: "created",
      record_id: String(record?.record_id ?? ""),
      created_at: String(record?.created_at ?? ""),
          invite_status: inviteStatus,
          invite_message:
            inviteStatus === "submitted_pending_airtable"
              ? "Cadastro salvo. O vínculo operacional ficou pendente de sincronização."
              : "Cadastro salvo e vinculado ao projeto/faixa.",
    };
  }

  if (res.status === 422 && people?.status === "invalid") {
    const rawIssues = Array.isArray(peopleError?.issues) ? peopleError.issues : [];
    const rawMsg = typeof peopleError?.message === "string" ? peopleError.message : "";
    return {
      ok: false,
      status: "invalid",
      issues: rawIssues.map((i: unknown) => {
        const issue = i as Record<string, unknown>;
        return { field: String(issue?.field ?? ""), message: String(issue?.message ?? "") };
      }),
      message: localizarMensagem(rawMsg) || "Verifique os campos obrigatórios e tente novamente.",
    };
  }

  if (res.status === 409 || people?.status === "conflict") {
    const raw = typeof peopleError?.message === "string" ? peopleError.message : "";
    return {
      ok: false,
      status: "conflict",
      message: localizarMensagem(raw) || "Já existe um cadastro com este documento ou e-mail neste workspace.",
    };
  }

  const error = data.error as Record<string, unknown> | undefined;
  const rawMessage = typeof error?.message === "string" ? error.message : "";
  return {
    ok: false,
    status: "error",
    message: localizarMensagem(rawMessage) || `Erro inesperado (HTTP ${res.status}). Contate o suporte.`,
  };
}

// ─── API call — edit mode ─────────────────────────────────────────────────────

async function patchPeopleRegistry(
  editToken: string,
  payload: PeopleRegistryApiPayload
): Promise<PeopleRegistrySubmitResult> {
  let res: Response;
  try {
    res = await fetch(`/api/people-registry/records/edit/${encodeURIComponent(editToken)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, status: "error", message: "Não foi possível conectar ao servidor. Tente novamente." };
  }

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    return { ok: false, status: "error", message: `Resposta inesperada do servidor (HTTP ${res.status}).` };
  }

  if (res.ok) {
    const record = data.record as Record<string, unknown> | undefined;
    return {
      ok: true,
      status: "created",
      record_id: String(record?.record_id ?? ""),
      created_at: String(record?.created_at ?? ""),
    };
  }

  if (res.status === 404) {
    return { ok: false, status: "error", message: "Token de edição não encontrado. O link pode ter expirado." };
  }

  if (res.status === 422) {
    const error = data.error as Record<string, unknown> | undefined;
    const rawIssues = Array.isArray(error?.issues) ? error.issues : [];
    const rawMsg = typeof error?.message === "string" ? error.message : "";
    return {
      ok: false,
      status: "invalid",
      issues: rawIssues.map((i: unknown) => {
        const issue = i as Record<string, unknown>;
        return { field: String(issue?.field ?? ""), message: String(issue?.message ?? "") };
      }),
      message: localizarMensagem(rawMsg) || "Verifique os campos obrigatórios e tente novamente.",
    };
  }

  return { ok: false, status: "error", message: `Erro inesperado (HTTP ${res.status}). Contate o suporte.` };
}

// ─── Primitivos de UI ─────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[13px] text-slate-500">{children}</p>;
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[13px] text-red-600">{children}</p>;
}

const inputCls =
  "mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-[15px] text-slate-900 outline-none transition focus:border-slate-900 disabled:opacity-50";

const textareaCls =
  "mt-2 min-h-[120px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] leading-7 text-slate-900 outline-none transition focus:border-slate-900 disabled:opacity-50 resize-vertical";

function TextInput({
  value, onChange, placeholder, type = "text", disabled, error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <>
      <input
        type={type}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`${inputCls} ${error ? "border-red-400 focus:border-red-500" : ""}`}
      />
      {error && <FieldError>{error}</FieldError>}
    </>
  );
}

function SelectInput({
  value, onChange, options, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      disabled={disabled}
      className={inputCls}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option === "confirmado"
            ? "Confirmo a função e remuneração indicada"
            : option === "em_negociacao"
            ? "Precisa de revisão"
            : option || "Selecionar..."}
        </option>
      ))}
    </select>
  );
}

function TextArea({
  value, onChange, placeholder, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={textareaCls}
    />
  );
}

function RoleChips({
  roles, selected, onChange, disabled,
}: {
  roles: { value: string; label: string }[];
  selected: string[];
  onChange: (roles: string[]) => void;
  disabled?: boolean;
}) {
  function toggle(value: string) {
    onChange(selected.includes(value)
      ? selected.filter((r) => r !== value)
      : [...selected, value]);
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {roles.map((role) => {
        const active = selected.includes(role.value);
        return (
          <button
            key={role.value}
            type="button"
            onClick={() => toggle(role.value)}
            disabled={disabled}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed ${
              active
                ? "text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
            }`}
            style={active ? { background: "var(--form-primary)", borderColor: "var(--form-primary)" } : undefined}
          >
            {role.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Step bar ─────────────────────────────────────────────────────────────────

function StepBar({
  currentStep,
  currentStepIndex,
  activeStepOrder,
}: {
  currentStep: StepKey;
  currentStepIndex: number;
  activeStepOrder: StepKey[];
}) {
  if (currentStep === "intro") return null;

  const visibleSteps = activeStepOrder.filter((s) => s !== "intro");

  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex min-w-[600px] items-center gap-3 pb-1">
        {visibleSteps.map((step, idx) => {
          const adjustedIdx = idx + 1; // +1 porque intro ocupa o index 0
          const active = step === currentStep;
          const completed = currentStepIndex > adjustedIdx;

          return (
            <Fragment key={step}>
              <div className="flex min-w-[80px] flex-col items-center gap-2 text-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
                    active
                      ? "text-white"
                      : completed
                      ? "border-slate-300 bg-white text-slate-900"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                  style={active ? { background: "var(--form-primary)", borderColor: "var(--form-primary)" } : undefined}
                >
                  {completed ? "✓" : idx + 1}
                </div>
                <div
                  className={`text-[12px] font-medium ${
                    active ? "text-slate-900" : completed ? "text-slate-700" : "text-slate-400"
                  }`}
                >
                  {STEP_LABELS[step]}
                </div>
              </div>
              {idx < visibleSteps.length - 1 && (
                <div
                  className={`h-px min-w-[24px] flex-1 ${
                    completed ? "" : "bg-slate-200"
                  }`}
                  style={completed ? { background: "var(--form-primary)" } : undefined}
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Botões de navegação ──────────────────────────────────────────────────────

function NavButtons({
  onBack,
  onNext,
  nextLabel = "Continuar",
  backLabel = "Voltar",
  isLoading,
  showBack,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  isLoading?: boolean;
  showBack?: boolean;
}) {
  return (
    <div className={`mt-8 flex gap-3 ${showBack ? "justify-between" : "justify-end"}`}>
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50 hover:border-slate-400 transition"
        >
          {backLabel}
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={isLoading}
          className="rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 transition"
          style={{ background: "var(--form-primary)" }}
        >
          {isLoading ? "Enviando..." : nextLabel}
        </button>
      )}
    </div>
  );
}

function StepHeading({
  step,
  currentStepIndex,
}: {
  step: Exclude<StepKey, "intro">;
  currentStepIndex: number;
}) {
  return (
    <div className="mb-8 border-b border-slate-200 pb-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Etapa {currentStepIndex}
      </div>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">
        {STEP_LABELS[step]}
      </h2>
    </div>
  );
}

// ─── Review row ───────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value?: string | string[] }) {
  const display = Array.isArray(value)
    ? value.length > 0 ? value.join(", ") : "—"
    : value?.trim() || "—";

  return (
    <div className="flex gap-4 py-3 border-b border-slate-100 last:border-0">
      <span className="w-40 shrink-0 text-[13px] text-slate-500">{label}</span>
      <span className="text-[14px] text-slate-900">{display}</span>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5">
        {children}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

type SubmitState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; result: Extract<PeopleRegistrySubmitResult, { ok: true }> }
  | { type: "conflict"; result: Extract<PeopleRegistrySubmitResult, { status: "conflict" }> }
  | { type: "invalid"; result: Extract<PeopleRegistrySubmitResult, { status: "invalid" }> }
  | { type: "error"; result: Extract<PeopleRegistrySubmitResult, { status: "error" }> };

type InviteState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "ready"; invite: PeopleRegistryInvite }
  | { type: "error"; message: string };

export default function PeopleRegistryForm({
  profile,
}: {
  profile: PeopleRegistryProfileConfig;
}) {
  const searchParams = useSearchParams();
  const editToken = searchParams.get("edit_token");
  const inviteToken = searchParams.get("invite");
  const isEditMode = Boolean(editToken);
  const isInviteMode = Boolean(inviteToken) && !isEditMode;

  const [currentStep, setCurrentStep] = useState<StepKey>("intro");
  const [values, setValues] = useState<PeopleRegistryFormValues>(createInitialFormValues);
  const [inviteParticipation, setInviteParticipation] = useState<InviteParticipationValues>(
    createInitialInviteParticipation
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>({ type: "idle" });
  const [hydrateState, setHydrateState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [inviteState, setInviteState] = useState<InviteState>({ type: "idle" });

  const invite = inviteState.type === "ready" ? inviteState.invite : null;
  const inviteContext = invite?.context ?? null;
  const inviteVisibleSections = useMemo(
    () => resolveInviteVisibleSections(inviteContext, isInviteMode),
    [inviteContext, isInviteMode]
  );

  // Ordem ativa de steps — guiada pelo profile.showSections ou pelo link inteligente.
  const activeStepOrder = useMemo<StepKey[]>(() => {
    const steps: StepKey[] = ["intro", "identification"];
    (Object.keys(SECTION_STEP_MAP) as Array<InviteVisibleSection>).forEach((key) => {
      const visible = isInviteMode
        ? Boolean(inviteVisibleSections?.has(key))
        : profile.showSections[key];
      if (visible) {
        steps.push(SECTION_STEP_MAP[key]);
      }
    });
    steps.push("review_submit");
    return steps;
  }, [inviteVisibleSections, isInviteMode, profile.showSections]);

  const currentStepIndex = activeStepOrder.indexOf(currentStep);
  const isPF = values.party_kind === "pf";
  const isLoading = submitState.type === "loading";
  const showContactSection = isInviteMode
    ? Boolean(inviteVisibleSections?.has("contact"))
    : profile.showSections.contact;
  const showAddressSection = isInviteMode
    ? Boolean(inviteVisibleSections?.has("address"))
    : profile.showSections.address;
  const showBankingSection = isInviteMode
    ? Boolean(inviteVisibleSections?.has("banking"))
    : profile.showSections.banking;
  const showAdditionalInfoSection = isInviteMode
    ? Boolean(inviteVisibleSections?.has("additionalInfo"))
    : profile.showSections.additionalInfo;
  const inviteCaseLabel = firstContextValue(inviteContext, [
    "clearance_case_name",
    "case_name",
    "project_title",
    "projeto",
  ]);
  const inviteItemLabel = firstContextValue(inviteContext, [
    "clearance_item_name",
    "item_name",
    "music_title",
    "faixa",
  ]);
  const invitePartyLabel = firstContextValue(inviteContext, [
    "party_name",
    "nome_parte",
    "person_name",
  ]);
  const inviteRemunerationLabel = firstContextValue(inviteContext, [
    "remuneration",
    "remuneracao",
    "remuneracao_indicada",
    "participation_percent",
    "fixed_amount",
  ]);
  const inviteRemunerationSource = resolveRemunerationSource(
    firstContextValue(inviteContext, [
      "remuneration_source",
      "remunerationOrigem",
      "origem_remuneracao",
    ])
  );

  // Hydrate edit mode — fetch existing record by edit_token, pre-fill form
  useEffect(() => {
    if (!editToken || hydrateState !== "idle") return;
    queueMicrotask(() => setHydrateState("loading"));

    fetch(`/api/people-registry/records/edit/${encodeURIComponent(editToken)}`)
      .then((r) => r.json())
      .then((data: Record<string, unknown>) => {
        if (!data.ok) {
          setHydrateState("error");
          return;
        }
        const d = data.data as Record<string, unknown> | undefined;
        if (!d) { setHydrateState("error"); return; }

        const party = (d.party ?? {}) as Record<string, unknown>;
        const contact = (d.contact ?? {}) as Record<string, unknown>;
        const address = (d.address ?? {}) as Record<string, unknown>;
        const banking = (d.banking ?? {}) as Record<string, unknown>;
        const info = (d.additional_info ?? {}) as Record<string, unknown>;

        setValues({
          party_kind: (party.party_kind as "pf" | "pj") ?? "pf",
          display_name: String(party.display_name ?? ""),
          legal_name: String(party.legal_name ?? ""),
          document_id: String(party.document_id ?? ""),
          roles: Array.isArray(party.roles) ? party.roles.map(String) : [],
          stage_name: String(party.stage_name ?? ""),
          trade_name: String(party.trade_name ?? ""),
          email_primary: String(contact.email_primary ?? ""),
          phone_primary: String(contact.phone_primary ?? ""),
          website: String(contact.website ?? ""),
          instagram: String(contact.instagram ?? ""),
          country: String(address.country ?? "Brasil"),
          state_region: String(address.state_region ?? ""),
          city: String(address.city ?? ""),
          postal_code: String(address.postal_code ?? ""),
          address_line_1: String(address.address_line_1 ?? ""),
          pix_key: String(banking.pix_key ?? ""),
          bank_name: String(banking.bank_name ?? ""),
          bank_agency: String(banking.bank_agency ?? ""),
          account_number: String(banking.account_number ?? ""),
          account_holder_name: String(banking.account_holder_name ?? ""),
          account_holder_document_id: String(banking.account_holder_document_id ?? ""),
          manager_name: String(info.manager_name ?? ""),
          label_name: String(info.label_name ?? ""),
          notes_internal: String(info.notes_internal ?? ""),
        });
        setHydrateState("ready");
        setCurrentStep("identification");
      })
      .catch(() => setHydrateState("error"));
  }, [editToken, hydrateState]);

  // Hydrate invite mode — fetch contextual clearance invite and pre-fill safe fields.
  useEffect(() => {
    if (!isInviteMode || !inviteToken || inviteState.type !== "idle") return;

    queueMicrotask(() => setInviteState({ type: "loading" }));
    fetchPeopleRegistryInvite(inviteToken)
      .then((result) => {
        if (!result.ok) {
          setInviteState({ type: "error", message: result.message });
          return;
        }

        const invite = result.invite;
        const context = invite.context ?? {};
        const partyName = firstContextValue(context, [
          "party_name",
          "nome_parte",
          "person_name",
          "display_name",
          "nome",
        ]);
        const email = firstContextValue(context, [
          "signing_email",
          "email",
          "email_assinatura",
        ]);
        const rawRole = firstContextValue(context, [
          "requested_role",
          "role",
          "papel_no_caso",
          "tipo_parte",
        ]);
        const resolvedRole = rawRole ? resolveInviteRole(rawRole, profile) : null;

        setValues((prev) => ({
          ...prev,
          display_name: prev.display_name || partyName,
          legal_name: prev.legal_name || partyName,
          stage_name: prev.stage_name || partyName,
          email_primary: prev.email_primary || email,
          roles: resolvedRole && !prev.roles.includes(resolvedRole)
            ? [...prev.roles, resolvedRole]
            : prev.roles,
        }));

        const remunerationType = firstContextValue(context, [
          "remuneration_type",
          "tipo_remuneracao",
          "tipo_de_remuneracao",
        ]);
        const remunerationIndication = firstContextValue(context, [
          "remuneration",
          "remuneracao",
          "remuneracao_indicada",
        ]);
        const parsedRemuneration = parseRemunerationIndication(remunerationIndication);
        const participationPercent =
          firstContextValue(context, ["participation_percent", "percentual"]) ||
          formatContextNumber(context.participation_percent) ||
          parsedRemuneration.participationPercent;
        const fixedAmount =
          firstContextValue(context, ["fixed_amount", "valor_fixo"]) ||
          formatContextNumber(context.fixed_amount) ||
          parsedRemuneration.fixedAmount;

        setInviteParticipation((prev) => ({
          ...prev,
          musical_role: prev.musical_role || resolveMusicalRoleOption(rawRole),
          remuneration_type: prev.remuneration_type === "A definir"
            ? resolveRemunerationOption(remunerationType || parsedRemuneration.remunerationType)
            : prev.remuneration_type,
          participation_percent: prev.participation_percent || participationPercent,
          fixed_amount: prev.fixed_amount || fixedAmount,
        }));
        setInviteState({ type: "ready", invite });
      })
      .catch(() => {
        setInviteState({ type: "error", message: "Não foi possível carregar o convite." });
      });
  }, [inviteState.type, inviteToken, isInviteMode, profile]);

  const set = useCallback(<K extends keyof PeopleRegistryFormValues>(
    key: K,
    value: PeopleRegistryFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const setInviteField = useCallback(<K extends keyof InviteParticipationValues>(
    key: K,
    value: InviteParticipationValues[K]
  ) => {
    setInviteParticipation((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.clearance_participation;
      return next;
    });
  }, []);

  function clearError(key: string) {
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  // ─── Validação por step ───────────────────────────────────────────────────

  function validateStep(step: StepKey): Record<string, string> {
    const errs: Record<string, string> = {};

    if (step === "identification") {
      if (!values.display_name.trim()) errs.display_name = "Nome de exibição é obrigatório.";
      if (!values.legal_name.trim()) errs.legal_name = "Nome legal / razão social é obrigatório.";
      if (values.roles.length === 0) errs.roles = "Selecione ao menos uma função.";
    }

    if (step === "contact") {
      const email = values.email_primary.trim();
      if (email && !/\S+@\S+\.\S+/.test(email)) errs.email_primary = "Informe um e-mail válido.";
    }

    return errs;
  }

  function validateBeforeSubmit(): Record<string, string> {
    const errs: Record<string, string> = {};
    const hasDocOrEmail = values.document_id.trim() || values.email_primary.trim();
    if (!hasDocOrEmail) {
      errs.document_or_email = "Informe CPF/CNPJ ou e-mail — ao menos um é necessário para deduplicação.";
    }
    if (isInviteMode && inviteState.type !== "ready") {
      errs.clearance_participation = "O link inteligente precisa estar carregado antes do envio.";
    }
    if (isInviteMode && inviteParticipation.confirmation_status === "em_negociacao" && !inviteParticipation.notes.trim()) {
      errs.clearance_participation = "Explique o que precisa ser revisado para o time operacional seguir corretamente.";
    }
    return errs;
  }

  // ─── Navegação ────────────────────────────────────────────────────────────

  function goNext() {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    const nextIndex = Math.min(currentStepIndex + 1, activeStepOrder.length - 1);
    setCurrentStep(activeStepOrder[nextIndex]);
    setSubmitState({ type: "idle" });
  }

  function goBack() {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(activeStepOrder[prevIndex]);
    setSubmitState({ type: "idle" });
  }

  function handleReset() {
    setValues(createInitialFormValues());
    setErrors({});
    setSubmitState({ type: "idle" });
    setCurrentStep("intro");
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (isLoading) return;

    const preErrors = validateBeforeSubmit();
    if (Object.keys(preErrors).length > 0) {
      setErrors(preErrors);
      return;
    }

    setSubmitState({ type: "loading" });
    const payload = buildApiPayload(values, profile);

    const result = isEditMode && editToken
      ? await patchPeopleRegistry(editToken, payload)
      : isInviteMode && inviteToken
      ? await submitPeopleRegistryInvite(
          inviteToken,
          payload,
          buildInviteParticipationPayload(inviteParticipation)
        )
      : await submitPeopleRegistry(payload);

    if (result.ok) { setSubmitState({ type: "success", result }); return; }
    if (result.status === "conflict") { setSubmitState({ type: "conflict", result }); return; }
    if (result.status === "invalid") { setSubmitState({ type: "invalid", result }); return; }
    setSubmitState({ type: "error", result });
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8" style={{ background: profile.theme?.formBg ?? DEFAULT_FORM_THEME.formBg, "--form-primary": profile.theme?.primary ?? DEFAULT_FORM_THEME.primary, "--form-primary-hover": profile.theme?.primaryHover ?? DEFAULT_FORM_THEME.primaryHover } as React.CSSProperties}>
      <div className="mx-auto max-w-3xl">

        {/* Edit mode — hydration loading / error */}
        {isEditMode && hydrateState === "loading" && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white/70 px-6 py-5 text-center text-sm text-slate-600">
            Carregando dados para edição…
          </div>
        )}
        {isEditMode && hydrateState === "error" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
            Não foi possível carregar os dados para edição. Verifique o link e tente novamente.
          </div>
        )}
        {isInviteMode && inviteState.type === "loading" && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white/70 px-6 py-5 text-center text-sm text-slate-600">
            Carregando dados do link inteligente…
          </div>
        )}
        {isInviteMode && inviteState.type === "error" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
            {inviteState.message}
          </div>
        )}

        {/* Edit mode banner */}
        {isEditMode && hydrateState === "ready" && (
          <div className="mb-5 rounded-2xl border px-5 py-3 text-sm font-medium" style={{ borderColor: "var(--form-primary)", background: "color-mix(in srgb, var(--form-primary) 8%, white)" }}>
            <span style={{ color: "var(--form-primary)" }}>Modo edição</span>
            <span className="ml-2 font-normal text-slate-600">— os dados foram pré-preenchidos. Revise e confirme as alterações.</span>
          </div>
        )}
        {isInviteMode && invite && currentStep !== "intro" && (
          <div className="mb-5 rounded-2xl border px-5 py-3 text-sm font-medium" style={{ borderColor: "var(--form-primary)", background: "color-mix(in srgb, var(--form-primary) 8%, white)" }}>
            <span style={{ color: "var(--form-primary)" }}>Cadastro vinculado</span>
            <span className="ml-2 font-normal text-slate-600">
              — {inviteCaseLabel || "projeto/faixa"}{inviteItemLabel ? ` · ${inviteItemLabel}` : ""}
            </span>
          </div>
        )}

        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-3">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={profile.clientLabel}
                className="h-8 max-w-[120px] object-contain"
              />
            ) : (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold text-white"
                style={{ background: "var(--form-primary)" }}
              >
                {profile.clientLabel.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
              {profile.badgeUrl && <img src={profile.badgeUrl} alt="" className="h-4 w-4 object-contain" />}
              {profile.clientLabel}
            </div>
          </div>
          {currentStep !== "intro" && (
            <p className="mt-1 text-sm text-slate-600">
              {profile.formTitle} — Formulário restrito ao time operacional.
            </p>
          )}
        </header>

        {/* Step bar */}
        <StepBar currentStep={currentStep} currentStepIndex={currentStepIndex} activeStepOrder={activeStepOrder} />

        {/* Card */}
        <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-7 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-8">

          {/* ── INTRO ── */}
          {currentStep === "intro" && (
            <div className="flex flex-col items-center text-center py-6">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {profile.clientLabel} · People Registry
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900">
                {profile.formTitle}
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
                {isInviteMode
                  ? "Confirme seus dados de cadastro e a participação informada para este projeto ou faixa."
                  : "Preencha os dados da pessoa que deseja cadastrar. O formulário suporta Pessoa Física e Pessoa Jurídica com campos condicionais."}
              </p>
              {isInviteMode && invite && (
                <div className="mt-6 w-full max-w-xl rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-left">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Participação solicitada
                  </div>
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <div className="text-[12px] font-medium text-slate-500">Projeto</div>
                      <div className="mt-0.5 font-medium text-slate-900">{inviteCaseLabel || "—"}</div>
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-slate-500">Faixa</div>
                      <div className="mt-0.5 font-medium text-slate-900">{inviteItemLabel || "—"}</div>
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-slate-500">Parte</div>
                      <div className="mt-0.5 font-medium text-slate-900">{invitePartyLabel || values.display_name || "—"}</div>
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-slate-500">Função</div>
                      <div className="mt-0.5 font-medium text-slate-900">{inviteParticipation.musical_role || "—"}</div>
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-slate-500">Remuneração indicada</div>
                      <div className="mt-0.5 font-medium text-slate-900">
                        {inviteRemunerationLabel || formatInviteRemuneration(inviteParticipation)}
                      </div>
                      {inviteRemunerationSource && (
                        <div className="mt-0.5 text-[12px] text-slate-500">
                          Informada por {inviteRemunerationSource}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={goNext}
                disabled={isInviteMode && inviteState.type === "loading"}
                className="mt-8 rounded-xl px-8 py-3.5 text-sm font-semibold text-white transition"
                style={{ background: "var(--form-primary)" }}
              >
                {isEditMode ? "Editar cadastro" : isInviteMode ? "Completar cadastro" : "Começar cadastro"}
              </button>
            </div>
          )}

          {/* ── IDENTIFICAÇÃO ── */}
          {currentStep === "identification" && (
            <>
              <StepHeading step="identification" currentStepIndex={currentStepIndex} />

              {/* Toggle PF / PJ */}
              <div className="mb-6">
                <FieldLabel>Tipo de cadastro</FieldLabel>
                <div className="mt-2 flex gap-3">
                  {(["pf", "pj"] as PartyKind[]).map((kind) => {
                    const active = values.party_kind === kind;
                    return (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => set("party_kind", kind)}
                        className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition ${
                          active
                            ? "text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                        }`}
                        style={active ? { background: "var(--form-primary)", borderColor: "var(--form-primary)" } : undefined}
                      >
                        {kind === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel required>
                    {isPF ? "Nome de exibição" : "Nome da empresa / marca"}
                  </FieldLabel>
                  <TextInput
                    value={values.display_name}
                    onChange={(v) => set("display_name", v)}
                    placeholder={isPF ? "Ex: João Silva" : "Ex: Produtora XYZ"}
                    error={errors.display_name}
                  />
                </div>

                <div>
                  <FieldLabel required>
                    {isPF ? "Nome completo (legal)" : "Razão social"}
                  </FieldLabel>
                  <TextInput
                    value={values.legal_name}
                    onChange={(v) => set("legal_name", v)}
                    placeholder={isPF ? "Ex: João Henrique da Silva" : "Ex: Produtora XYZ Ltda."}
                    error={errors.legal_name}
                  />
                </div>

                <div>
                  <FieldLabel>{isPF ? "Nome artístico" : "Nome fantasia"}</FieldLabel>
                  {isPF ? (
                    <TextInput
                      value={values.stage_name}
                      onChange={(v) => set("stage_name", v)}
                      placeholder="Ex: Jota Silva"
                    />
                  ) : (
                    <TextInput
                      value={values.trade_name}
                      onChange={(v) => set("trade_name", v)}
                      placeholder="Ex: XYZ Music"
                    />
                  )}
                  <FieldHint>Opcional</FieldHint>
                </div>

                <div>
                  <FieldLabel>{isPF ? "CPF" : "CNPJ"}</FieldLabel>
                  <TextInput
                    value={values.document_id}
                    onChange={(v) => set("document_id", v)}
                    placeholder={isPF ? "000.000.000-00" : "00.000.000/0000-00"}
                  />
                  <FieldHint>Usado para deduplicação</FieldHint>
                </div>
              </div>

              {profile.availableRoles.length > 0 && (
                <div className="mt-5">
                  <FieldLabel required>Função(ões) no projeto</FieldLabel>
                  <RoleChips
                    roles={profile.availableRoles}
                    selected={values.roles}
                    onChange={(r) => { set("roles", r); clearError("roles"); }}
                  />
                  {errors.roles && <FieldError>{errors.roles}</FieldError>}
                </div>
              )}

              <NavButtons
                showBack={false}
                onNext={goNext}
              />
            </>
          )}

          {/* ── CONTATO ── */}
          {currentStep === "contact" && (
            <>
              <StepHeading step="contact" currentStepIndex={currentStepIndex} />
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>E-mail</FieldLabel>
                  <TextInput
                    type="email"
                    value={values.email_primary}
                    onChange={(v) => set("email_primary", v)}
                    placeholder="email@exemplo.com"
                    error={errors.email_primary}
                  />
                  <FieldHint>Também usado para deduplicação</FieldHint>
                </div>
                <div>
                  <FieldLabel>Telefone / WhatsApp</FieldLabel>
                  <TextInput
                    value={values.phone_primary}
                    onChange={(v) => set("phone_primary", v)}
                    placeholder="+55 11 90000-0000"
                  />
                </div>
                <div>
                  <FieldLabel>Site</FieldLabel>
                  <TextInput
                    type="url"
                    value={values.website}
                    onChange={(v) => set("website", v)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <FieldLabel>Instagram</FieldLabel>
                  <TextInput
                    value={values.instagram}
                    onChange={(v) => set("instagram", v)}
                    placeholder="@usuario"
                  />
                </div>
              </div>
              <NavButtons showBack onBack={goBack} onNext={goNext} />
            </>
          )}

          {/* ── ENDEREÇO ── */}
          {currentStep === "address" && (
            <>
              <StepHeading step="address" currentStepIndex={currentStepIndex} />
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>País</FieldLabel>
                  <TextInput
                    value={values.country}
                    onChange={(v) => set("country", v)}
                    placeholder="Brasil"
                  />
                </div>
                <div>
                  <FieldLabel>Estado</FieldLabel>
                  <TextInput
                    value={values.state_region}
                    onChange={(v) => set("state_region", v)}
                    placeholder="Ex: São Paulo"
                  />
                </div>
                <div>
                  <FieldLabel>Cidade</FieldLabel>
                  <TextInput
                    value={values.city}
                    onChange={(v) => set("city", v)}
                    placeholder="Ex: São Paulo"
                  />
                </div>
                <div>
                  <FieldLabel>CEP</FieldLabel>
                  <TextInput
                    value={values.postal_code}
                    onChange={(v) => set("postal_code", v)}
                    placeholder="00000-000"
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Endereço</FieldLabel>
                  <TextInput
                    value={values.address_line_1}
                    onChange={(v) => set("address_line_1", v)}
                    placeholder="Rua, número, complemento"
                  />
                </div>
              </div>
              <NavButtons showBack onBack={goBack} onNext={goNext} />
            </>
          )}

          {/* ── DADOS BANCÁRIOS ── */}
          {currentStep === "banking" && (
            <>
              <StepHeading step="banking" currentStepIndex={currentStepIndex} />
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>Chave PIX</FieldLabel>
                  <TextInput
                    value={values.pix_key}
                    onChange={(v) => set("pix_key", v)}
                    placeholder="CPF, CNPJ, e-mail ou telefone"
                  />
                </div>
                <div>
                  <FieldLabel>Banco</FieldLabel>
                  <TextInput
                    value={values.bank_name}
                    onChange={(v) => set("bank_name", v)}
                    placeholder="Ex: Nubank, Itaú, Bradesco"
                  />
                </div>
                <div>
                  <FieldLabel>Agência</FieldLabel>
                  <TextInput
                    value={values.bank_agency}
                    onChange={(v) => set("bank_agency", v)}
                    placeholder="Ex: 0001"
                  />
                </div>
                <div>
                  <FieldLabel>Número da conta</FieldLabel>
                  <TextInput
                    value={values.account_number}
                    onChange={(v) => set("account_number", v)}
                    placeholder="Ex: 12345-6"
                  />
                </div>
                <div>
                  <FieldLabel>Titular da conta</FieldLabel>
                  <TextInput
                    value={values.account_holder_name}
                    onChange={(v) => set("account_holder_name", v)}
                    placeholder="Nome completo ou razão social"
                  />
                </div>
                <div>
                  <FieldLabel>CPF / CNPJ do titular</FieldLabel>
                  <TextInput
                    value={values.account_holder_document_id}
                    onChange={(v) => set("account_holder_document_id", v)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
              <NavButtons showBack onBack={goBack} onNext={goNext} />
            </>
          )}

          {/* ── INFORMAÇÕES ADICIONAIS ── */}
          {currentStep === "additional_info" && (
            <>
              <StepHeading step="additional_info" currentStepIndex={currentStepIndex} />
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>Assessor / Manager</FieldLabel>
                  <TextInput
                    value={values.manager_name}
                    onChange={(v) => set("manager_name", v)}
                    placeholder="Nome do assessor ou manager"
                  />
                </div>
                <div>
                  <FieldLabel>Gravadora / Editora</FieldLabel>
                  <TextInput
                    value={values.label_name}
                    onChange={(v) => set("label_name", v)}
                    placeholder="Ex: Sony Music, Warner"
                  />
                </div>
              </div>
              <div className="mt-5">
                <FieldLabel>Observações internas</FieldLabel>
                <TextArea
                  value={values.notes_internal}
                  onChange={(v) => set("notes_internal", v)}
                  placeholder="Notas operacionais para uso interno..."
                />
                <FieldHint>Não visível para o cadastrado</FieldHint>
              </div>
              {isInviteMode && invite && (
                <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Participação no projeto/faixa
                  </div>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Remuneração indicada:</span>{" "}
                    {inviteRemunerationLabel || formatInviteRemuneration(inviteParticipation)}
                    {inviteRemunerationSource && (
                      <span className="ml-1 text-slate-500">
                        (informada por {inviteRemunerationSource})
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Confirmação da participação</FieldLabel>
                      <SelectInput
                        value={inviteParticipation.confirmation_status}
                        onChange={(v) => setInviteField("confirmation_status", v as InviteParticipationValues["confirmation_status"])}
                        options={["confirmado", "em_negociacao"]}
                      />
                      <FieldHint>Confirme ou peça revisão antes do time preparar o contrato</FieldHint>
                    </div>
                    <div>
                      <FieldLabel>Função no projeto/faixa</FieldLabel>
                      <SelectInput
                        value={inviteParticipation.musical_role}
                        onChange={(v) => setInviteField("musical_role", v)}
                        options={["", ...MUSICAL_ROLE_OPTIONS]}
                      />
                    </div>
                    <div>
                      <FieldLabel>Tipo de remuneração indicada</FieldLabel>
                      <SelectInput
                        value={inviteParticipation.remuneration_type}
                        onChange={(v) => setInviteField("remuneration_type", v)}
                        options={REMUNERATION_OPTIONS}
                      />
                    </div>
                    <div>
                      <FieldLabel>Percentual / participação</FieldLabel>
                      <TextInput
                        type="number"
                        value={inviteParticipation.participation_percent}
                        onChange={(v) => setInviteField("participation_percent", v)}
                        placeholder="Ex: 25"
                      />
                      <FieldHint>Informe 25 para 25%</FieldHint>
                    </div>
                    <div>
                      <FieldLabel>Valor fixo indicado</FieldLabel>
                      <TextInput
                        type="number"
                        value={inviteParticipation.fixed_amount}
                        onChange={(v) => setInviteField("fixed_amount", v)}
                        placeholder="Ex: 1500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel>
                        {inviteParticipation.confirmation_status === "em_negociacao"
                          ? "Explique o que precisa ser ajustado"
                          : "Observação sobre participação"}
                      </FieldLabel>
                      <TextArea
                        value={inviteParticipation.notes}
                        onChange={(v) => setInviteField("notes", v)}
                        placeholder="Use este campo se precisar ajustar função, remuneração ou alguma condição."
                      />
                      {inviteParticipation.confirmation_status === "em_negociacao" && (
                        <FieldHint>Obrigatório quando a participação precisa de revisão</FieldHint>
                      )}
                    </div>
                  </div>
                  {errors.clearance_participation && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {errors.clearance_participation}
                    </div>
                  )}
                </div>
              )}
              <NavButtons showBack onBack={goBack} onNext={goNext} nextLabel="Revisar" />
            </>
          )}

          {/* ── REVISÃO E ENVIO ── */}
          {currentStep === "review_submit" && (
            <>
              <StepHeading step="review_submit" currentStepIndex={currentStepIndex} />

              {submitState.type !== "success" && (
                <>
                  <ReviewSection title="Identificação">
                    <ReviewRow label="Tipo" value={isPF ? "Pessoa Física" : "Pessoa Jurídica"} />
                    <ReviewRow label={isPF ? "Nome de exibição" : "Nome / marca"} value={values.display_name} />
                    <ReviewRow label={isPF ? "Nome legal" : "Razão social"} value={values.legal_name} />
                    {isPF && <ReviewRow label="Nome artístico" value={values.stage_name} />}
                    {!isPF && <ReviewRow label="Nome fantasia" value={values.trade_name} />}
                    <ReviewRow label={isPF ? "CPF" : "CNPJ"} value={values.document_id} />
                    <ReviewRow label="Funções" value={values.roles} />
                  </ReviewSection>

                  {showContactSection && (
                    <ReviewSection title="Contato">
                      <ReviewRow label="E-mail" value={values.email_primary} />
                      <ReviewRow label="Telefone" value={values.phone_primary} />
                      <ReviewRow label="Site" value={values.website} />
                      <ReviewRow label="Instagram" value={values.instagram} />
                    </ReviewSection>
                  )}

                  {showAddressSection && (
                    <ReviewSection title="Endereço">
                      <ReviewRow label="País" value={values.country} />
                      <ReviewRow label="Estado" value={values.state_region} />
                      <ReviewRow label="Cidade" value={values.city} />
                      <ReviewRow label="CEP" value={values.postal_code} />
                      <ReviewRow label="Endereço" value={values.address_line_1} />
                    </ReviewSection>
                  )}

                  {showBankingSection && (
                    <ReviewSection title="Dados bancários">
                      <ReviewRow label="Chave PIX" value={values.pix_key} />
                      <ReviewRow label="Banco" value={values.bank_name} />
                      <ReviewRow label="Agência" value={values.bank_agency} />
                      <ReviewRow label="Número da conta" value={values.account_number} />
                      <ReviewRow label="Titular" value={values.account_holder_name} />
                      <ReviewRow label="CPF/CNPJ titular" value={values.account_holder_document_id} />
                    </ReviewSection>
                  )}

                  {showAdditionalInfoSection && (
                    <ReviewSection title="Informações adicionais">
                      <ReviewRow label="Assessor / Manager" value={values.manager_name} />
                      <ReviewRow label="Gravadora / Editora" value={values.label_name} />
                      <ReviewRow label="Observações" value={values.notes_internal} />
                    </ReviewSection>
                  )}

                  {isInviteMode && invite && (
                    <ReviewSection title="Participação">
                      <ReviewRow label="Projeto" value={inviteCaseLabel} />
                      <ReviewRow label="Faixa" value={inviteItemLabel} />
                      <ReviewRow label="Parte" value={invitePartyLabel || values.display_name} />
                      <ReviewRow
                        label="Situação"
                        value={inviteParticipation.confirmation_status === "confirmado"
                          ? "Função e remuneração indicada confirmadas"
                          : "Precisa de revisão"}
                      />
                      <ReviewRow label="Função" value={inviteParticipation.musical_role} />
                      <ReviewRow label="Remuneração indicada" value={formatInviteRemuneration(inviteParticipation)} />
                      <ReviewRow label="Percentual" value={inviteParticipation.participation_percent} />
                      <ReviewRow label="Valor fixo" value={inviteParticipation.fixed_amount} />
                      {inviteRemunerationSource && (
                        <ReviewRow label="Origem" value={inviteRemunerationSource} />
                      )}
                      <ReviewRow label="Observação" value={inviteParticipation.notes} />
                    </ReviewSection>
                  )}
                </>
              )}

              {/* Feedback de resultado */}
              {submitState.type === "success" && (
                <div className="rounded-[24px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-8">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    Cadastro realizado
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    Pessoa cadastrada com sucesso
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    ID do registro:{" "}
                    <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[13px] text-slate-800">
                      {submitState.result.record_id}
                    </code>
                  </p>
                  {submitState.result.invite_message && (
                    <p className="mt-3 text-sm text-emerald-700">
                      {submitState.result.invite_message}
                    </p>
                  )}
                  <div className="mt-6 flex gap-3">
                    {!isEditMode && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition"
                        style={{ background: "var(--form-primary)" }}
                      >
                        Cadastrar outra pessoa
                      </button>
                    )}
                  </div>
                </div>
              )}

              {submitState.type === "conflict" && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                  <div className="text-sm font-semibold text-amber-800">Cadastro duplicado detectado</div>
                  <p className="mt-1 text-sm text-amber-700">{submitState.result.message}</p>
                  <p className="mt-1 text-[13px] text-amber-600">
                    Para atualizar os dados desta pessoa, contate o time responsável.
                  </p>
                </div>
              )}

              {submitState.type === "invalid" && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                  <div className="text-sm font-semibold text-red-800">Campos com problema</div>
                  <p className="mt-1 text-sm text-red-700">{submitState.result.message}</p>
                  {submitState.result.issues.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-[13px] text-red-700 space-y-1">
                      {submitState.result.issues.map((issue, i) => (
                        <li key={i}>
                          <strong>{issue.field}</strong> — {issue.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {submitState.type === "error" && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                  <div className="text-sm font-semibold text-red-800">Erro ao enviar cadastro</div>
                  <p className="mt-1 text-sm text-red-700">{submitState.result.message}</p>
                </div>
              )}

              {errors.document_or_email && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-3">
                  <p className="text-sm text-red-700">{errors.document_or_email}</p>
                </div>
              )}
              {errors.clearance_participation && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-3">
                  <p className="text-sm text-red-700">{errors.clearance_participation}</p>
                </div>
              )}

              {submitState.type !== "success" && (
                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={isLoading}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50 hover:border-slate-400 transition"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="rounded-xl px-8 py-3 text-sm font-semibold text-white disabled:opacity-60 transition"
                    style={{ background: "var(--form-primary)" }}
                  >
                    {isLoading
                      ? "Salvando..."
                      : isEditMode
                      ? "Salvar alterações"
                      : isInviteMode
                      ? "Confirmar cadastro e participação"
                      : "Confirmar cadastro"}
                  </button>
                </div>
              )}
            </>
          )}

        </section>

        {/* Rodapé */}
        <p className="mt-6 text-center text-[12px] text-slate-500">
          Sunbeat · People Registry · {profile.clientLabel} · {profile.formVersion}
        </p>
      </div>
    </div>
  );
}
