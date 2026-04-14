"use client";

// components/people-registry/PeopleRegistryForm.tsx
// Formulário de cadastro de pessoas — PF e PJ, profile-driven, submit real
//
// GUARDRAIL: não altera release_intake, não toca no fluxo legado da Atabaque.
// Airtable sync: preparado via profile.airtableSyncHook — não implementado nesta rodada.

import { useState, useCallback, type ChangeEvent } from "react";
import type {
  PeopleRegistryProfileConfig,
  PeopleRegistryFormValues,
  PeopleRegistryApiPayload,
  PeopleRegistrySubmitResult,
  PartyKind,
} from "@/lib/people-registry/types";

// ─── Estado inicial do formulário ────────────────────────────────────────────

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
    account_holder_name: "",
    account_holder_document_id: "",
    manager_name: "",
    label_name: "",
    notes_internal: "",
  };
}

// ─── Construção do payload para o backend ────────────────────────────────────

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
      ...(isPF && values.stage_name.trim()
        ? { stage_name: values.stage_name.trim() }
        : {}),
      ...(!isPF && values.trade_name.trim()
        ? { trade_name: values.trade_name.trim() }
        : {}),
      ...(values.document_id.trim()
        ? { document_id: values.document_id.trim() }
        : {}),
      roles: values.roles,
    },
    contact: {
      ...(values.email_primary.trim()
        ? { email_primary: values.email_primary.trim() }
        : {}),
      ...(values.phone_primary.trim()
        ? { phone_primary: values.phone_primary.trim() }
        : {}),
      ...(values.website.trim() ? { website: values.website.trim() } : {}),
      ...(values.instagram.trim()
        ? { instagram: values.instagram.trim() }
        : {}),
    },
    address: {
      ...(values.country.trim() ? { country: values.country.trim() } : {}),
      ...(values.state_region.trim()
        ? { state_region: values.state_region.trim() }
        : {}),
      ...(values.city.trim() ? { city: values.city.trim() } : {}),
      ...(values.postal_code.trim()
        ? { postal_code: values.postal_code.trim() }
        : {}),
      ...(values.address_line_1.trim()
        ? { address_line_1: values.address_line_1.trim() }
        : {}),
    },
    banking: {
      ...(values.pix_key.trim() ? { pix_key: values.pix_key.trim() } : {}),
      ...(values.bank_name.trim()
        ? { bank_name: values.bank_name.trim() }
        : {}),
      ...(values.account_holder_name.trim()
        ? { account_holder_name: values.account_holder_name.trim() }
        : {}),
      ...(values.account_holder_document_id.trim()
        ? {
            account_holder_document_id:
              values.account_holder_document_id.trim(),
          }
        : {}),
    },
    additional_info: {
      ...(values.manager_name.trim()
        ? { manager_name: values.manager_name.trim() }
        : {}),
      ...(values.label_name.trim()
        ? { label_name: values.label_name.trim() }
        : {}),
      ...(values.notes_internal.trim()
        ? { notes_internal: values.notes_internal.trim() }
        : {}),
      external_refs: {},
    },
    meta: {
      form_version: profile.formVersion,
      source: `sunbeat.${profile.workspaceSlug}.people_registry.${profile.formVersion}`,
      submitted_at: new Date().toISOString(),
    },
  };
}

// ─── Chamada à API ────────────────────────────────────────────────────────────

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
    return {
      ok: false,
      status: "error",
      message: "Não foi possível conectar ao servidor. Tente novamente.",
    };
  }

  let data: Record<string, unknown>;

  try {
    data = await res.json();
  } catch {
    return {
      ok: false,
      status: "error",
      message: `Resposta inesperada do servidor (HTTP ${res.status}).`,
    };
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
    return {
      ok: false,
      status: "conflict",
      message:
        typeof error?.message === "string"
          ? error.message
          : "Já existe um cadastro com o mesmo documento ou e-mail neste workspace.",
    };
  }

  if (res.status === 422) {
    const error = data.error as Record<string, unknown> | undefined;
    const rawIssues = Array.isArray(error?.issues) ? error.issues : [];
    const issues = rawIssues.map((issue: unknown) => {
      const i = issue as Record<string, unknown>;
      return {
        field: String(i?.field ?? ""),
        message: String(i?.message ?? ""),
      };
    });
    return {
      ok: false,
      status: "invalid",
      issues,
      message:
        typeof error?.message === "string"
          ? error.message
          : "Verifique os campos obrigatórios e tente novamente.",
    };
  }

  return {
    ok: false,
    status: "error",
    message: `Erro inesperado (HTTP ${res.status}). Tente novamente ou contate o suporte.`,
  };
}

// ─── Sub-componentes de UI ────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--muted)",
        marginBottom: "1rem",
        paddingBottom: "0.5rem",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {children}
    </h3>
  );
}

function FormField({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label
        style={{
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: "var(--muted)",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--brand)", marginLeft: "0.25rem" }}>
            *
          </span>
        )}
      </label>
      {children}
      {hint && (
        <span style={{ fontSize: "0.75rem", color: "var(--muted-2)" }}>
          {hint}
        </span>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  padding: "0.625rem 0.875rem",
  color: "var(--text)",
  fontSize: "0.875rem",
  outline: "none",
  transition: "border-color 0.15s",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "6rem",
};

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={inputStyle}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
        onChange(e.target.value)
      }
      placeholder={placeholder}
      disabled={disabled}
      style={textareaStyle}
    />
  );
}

function RoleCheckboxGroup({
  roles,
  selected,
  onChange,
  disabled,
}: {
  roles: { value: string; label: string }[];
  selected: string[];
  onChange: (roles: string[]) => void;
  disabled?: boolean;
}) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((r) => r !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}
    >
      {roles.map((role) => {
        const active = selected.includes(role.value);
        return (
          <button
            key={role.value}
            type="button"
            onClick={() => toggle(role.value)}
            disabled={disabled}
            style={{
              padding: "0.375rem 0.875rem",
              borderRadius: "2rem",
              fontSize: "0.8125rem",
              fontWeight: 500,
              cursor: disabled ? "not-allowed" : "pointer",
              border: active
                ? "1px solid var(--brand)"
                : "1px solid var(--border)",
              background: active
                ? "rgba(250,204,21,0.12)"
                : "rgba(255,255,255,0.04)",
              color: active ? "var(--brand)" : "var(--muted)",
              transition: "all 0.15s",
            }}
          >
            {role.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Feedback de resultado ────────────────────────────────────────────────────

function SuccessBanner({ record_id }: { record_id: string }) {
  return (
    <div
      style={{
        background: "rgba(52, 211, 153, 0.1)",
        border: "1px solid rgba(52, 211, 153, 0.3)",
        borderRadius: "0.75rem",
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <span
        style={{ color: "#34d399", fontWeight: 600, fontSize: "0.9375rem" }}
      >
        Cadastro realizado com sucesso
      </span>
      <span style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>
        ID do registro:{" "}
        <code
          style={{
            fontFamily: "monospace",
            background: "rgba(255,255,255,0.08)",
            padding: "0.1rem 0.4rem",
            borderRadius: "0.25rem",
          }}
        >
          {record_id}
        </code>
      </span>
    </div>
  );
}

function ConflictBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "rgba(251, 191, 36, 0.1)",
        border: "1px solid rgba(251, 191, 36, 0.35)",
        borderRadius: "0.75rem",
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.375rem",
      }}
    >
      <span
        style={{ color: "#fbbf24", fontWeight: 600, fontSize: "0.9375rem" }}
      >
        Cadastro duplicado detectado
      </span>
      <span style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>
        {message}
      </span>
      <span style={{ color: "var(--muted-2)", fontSize: "0.75rem" }}>
        Se precisar atualizar os dados desta pessoa, contate o time responsável.
      </span>
    </div>
  );
}

function ValidationErrorBanner({
  message,
  issues,
}: {
  message: string;
  issues: { field: string; message: string }[];
}) {
  return (
    <div
      style={{
        background: "rgba(248, 113, 113, 0.1)",
        border: "1px solid rgba(248, 113, 113, 0.3)",
        borderRadius: "0.75rem",
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <span
        style={{ color: "var(--danger)", fontWeight: 600, fontSize: "0.9375rem" }}
      >
        Campos com problema
      </span>
      <span style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>
        {message}
      </span>
      {issues.length > 0 && (
        <ul
          style={{
            margin: "0.25rem 0 0",
            paddingLeft: "1.25rem",
            fontSize: "0.8125rem",
            color: "var(--muted)",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          {issues.map((issue, i) => (
            <li key={i}>
              <strong style={{ color: "var(--danger)" }}>{issue.field}</strong>
              {" — "}
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "rgba(248, 113, 113, 0.08)",
        border: "1px solid rgba(248, 113, 113, 0.25)",
        borderRadius: "0.75rem",
        padding: "1.25rem 1.5rem",
      }}
    >
      <span
        style={{ color: "var(--danger)", fontWeight: 600, fontSize: "0.9375rem" }}
      >
        Erro ao enviar cadastro
      </span>
      <p
        style={{
          color: "var(--muted)",
          fontSize: "0.8125rem",
          marginTop: "0.375rem",
          marginBottom: 0,
        }}
      >
        {message}
      </p>
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

export default function PeopleRegistryForm({
  profile,
}: {
  profile: PeopleRegistryProfileConfig;
}) {
  const [values, setValues] = useState<PeopleRegistryFormValues>(
    createInitialFormValues
  );
  const [submitState, setSubmitState] = useState<SubmitState>({ type: "idle" });

  const isPF = values.party_kind === "pf";
  const isLoading = submitState.type === "loading";

  const set = useCallback(
    <K extends keyof PeopleRegistryFormValues>(
      key: K,
      value: PeopleRegistryFormValues[K]
    ) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      // Limpa resultado anterior ao editar
      setSubmitState((prev) =>
        prev.type === "idle" || prev.type === "loading" ? prev : { type: "idle" }
      );
    },
    []
  );

  function handlePartyKindChange(kind: PartyKind) {
    setValues((prev) => ({ ...prev, party_kind: kind }));
    setSubmitState({ type: "idle" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Guard: evita double-submit por teclado quando loading
    if (isLoading) return;

    const displayName = values.display_name.trim();
    const legalName = values.legal_name.trim();
    const hasDocumentOrEmail =
      values.document_id.trim() || values.email_primary.trim();
    const hasRoles = values.roles.length > 0;

    const issues: { field: string; message: string }[] = [
      ...(!displayName
        ? [{ field: "party.display_name", message: "Nome de exibição é obrigatório." }]
        : []),
      ...(!legalName
        ? [{ field: "party.legal_name", message: "Nome legal / razão social é obrigatório." }]
        : []),
      ...(!hasRoles
        ? [{ field: "party.roles", message: "Selecione ao menos uma função." }]
        : []),
      ...(!hasDocumentOrEmail
        ? [
            {
              field: "party.document_id / contact.email_primary",
              message: "Informe CPF/CNPJ ou e-mail — necessário ao menos um para deduplicação.",
            },
          ]
        : []),
    ];

    if (issues.length > 0) {
      setSubmitState({
        type: "invalid",
        result: {
          ok: false,
          status: "invalid",
          message: "Preencha os campos obrigatórios antes de enviar.",
          issues,
        },
      });
      return;
    }

    setSubmitState({ type: "loading" });

    const payload = buildApiPayload(values, profile);
    const result = await submitPeopleRegistry(payload);

    if (result.ok) {
      setSubmitState({ type: "success", result });
      return;
    }

    if (result.status === "conflict") {
      setSubmitState({ type: "conflict", result });
      return;
    }

    if (result.status === "invalid") {
      setSubmitState({ type: "invalid", result });
      return;
    }

    setSubmitState({ type: "error", result });
  }

  function handleReset() {
    setValues(createInitialFormValues());
    setSubmitState({ type: "idle" });
  }

  const grid2: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1rem",
  };

  const sectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "1.25rem 1.5rem",
    background: "var(--panel)",
    borderRadius: "0.75rem",
    border: "1px solid var(--border)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem 1rem 4rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Header */}
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          marginBottom: "2rem",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--brand)",
            marginBottom: "0.5rem",
          }}
        >
          {profile.clientLabel}
        </p>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "0.5rem",
          }}
        >
          {profile.formTitle}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
          Preencha os dados da pessoa. Os campos marcados com{" "}
          <span style={{ color: "var(--brand)" }}>*</span> são obrigatórios.
        </p>
      </div>

      {/* Formulário */}
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "720px",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {/* Toggle PF / PJ */}
        <div style={sectionStyle}>
          <SectionTitle>Tipo de cadastro</SectionTitle>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {(["pf", "pj"] as PartyKind[]).map((kind) => {
              const active = values.party_kind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => handlePartyKindChange(kind)}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    border: active
                      ? "2px solid var(--brand)"
                      : "2px solid var(--border)",
                    background: active
                      ? "rgba(250,204,21,0.1)"
                      : "rgba(255,255,255,0.04)",
                    color: active ? "var(--brand)" : "var(--muted)",
                    transition: "all 0.15s",
                  }}
                >
                  {kind === "pf" ? "Pessoa Física (PF)" : "Pessoa Jurídica (PJ)"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Identificação */}
        <div style={sectionStyle}>
          <SectionTitle>Identificação</SectionTitle>
          <div style={grid2}>
            <FormField
              label={isPF ? "Nome de exibição" : "Nome da empresa / marca"}
              required
            >
              <TextInput
                value={values.display_name}
                onChange={(v) => set("display_name", v)}
                placeholder={isPF ? "Ex: João Silva" : "Ex: Produtora XYZ"}
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label={isPF ? "Nome completo (legal)" : "Razão social"}
              required
            >
              <TextInput
                value={values.legal_name}
                onChange={(v) => set("legal_name", v)}
                placeholder={
                  isPF
                    ? "Ex: João Henrique da Silva"
                    : "Ex: Produtora XYZ Ltda."
                }
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label={isPF ? "Nome artístico" : "Nome fantasia"}
              hint={isPF ? "Opcional" : "Opcional"}
            >
              {isPF ? (
                <TextInput
                  value={values.stage_name}
                  onChange={(v) => set("stage_name", v)}
                  placeholder="Ex: Jota Silva"
                  disabled={isLoading}
                />
              ) : (
                <TextInput
                  value={values.trade_name}
                  onChange={(v) => set("trade_name", v)}
                  placeholder="Ex: XYZ Music"
                  disabled={isLoading}
                />
              )}
            </FormField>

            <FormField
              label={isPF ? "CPF" : "CNPJ"}
              hint="Usado para deduplicação. Opcional, mas recomendado."
            >
              <TextInput
                value={values.document_id}
                onChange={(v) => set("document_id", v)}
                placeholder={isPF ? "000.000.000-00" : "00.000.000/0000-00"}
                disabled={isLoading}
              />
            </FormField>
          </div>

          {/* Função(ões) */}
          {profile.availableRoles.length > 0 && (
            <FormField label="Função(ões) no projeto">
              <RoleCheckboxGroup
                roles={profile.availableRoles}
                selected={values.roles}
                onChange={(r) => set("roles", r)}
                disabled={isLoading}
              />
            </FormField>
          )}
        </div>

        {/* Contato */}
        {profile.showSections.contact && (
          <div style={sectionStyle}>
            <SectionTitle>Contato</SectionTitle>
            <div style={grid2}>
              <FormField label="E-mail">
                <TextInput
                  type="email"
                  value={values.email_primary}
                  onChange={(v) => set("email_primary", v)}
                  placeholder="email@exemplo.com"
                  disabled={isLoading}
                />
              </FormField>
              <FormField label="Telefone / WhatsApp">
                <TextInput
                  value={values.phone_primary}
                  onChange={(v) => set("phone_primary", v)}
                  placeholder="+55 11 90000-0000"
                  disabled={isLoading}
                />
              </FormField>
              <FormField label="Site">
                <TextInput
                  type="url"
                  value={values.website}
                  onChange={(v) => set("website", v)}
                  placeholder="https://..."
                  disabled={isLoading}
                />
              </FormField>
              <FormField label="Instagram">
                <TextInput
                  value={values.instagram}
                  onChange={(v) => set("instagram", v)}
                  placeholder="@usuario"
                  disabled={isLoading}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* Endereço */}
        {profile.showSections.address && (
          <div style={sectionStyle}>
            <SectionTitle>Endereço</SectionTitle>
            <div style={grid2}>
              <FormField label="País">
                <TextInput
                  value={values.country}
                  onChange={(v) => set("country", v)}
                  placeholder="Brasil"
                  disabled={isLoading}
                />
              </FormField>
              <FormField label="Estado">
                <TextInput
                  value={values.state_region}
                  onChange={(v) => set("state_region", v)}
                  placeholder="Ex: São Paulo"
                  disabled={isLoading}
                />
              </FormField>
              <FormField label="Cidade">
                <TextInput
                  value={values.city}
                  onChange={(v) => set("city", v)}
                  placeholder="Ex: São Paulo"
                  disabled={isLoading}
                />
              </FormField>
              <FormField label="CEP">
                <TextInput
                  value={values.postal_code}
                  onChange={(v) => set("postal_code", v)}
                  placeholder="00000-000"
                  disabled={isLoading}
                />
              </FormField>
              <FormField label="Endereço" hint="Rua, número, complemento">
                <TextInput
                  value={values.address_line_1}
                  onChange={(v) => set("address_line_1", v)}
                  placeholder="Ex: Rua das Flores, 100 - Apto 12"
                  disabled={isLoading}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* Dados bancários */}
        {profile.showSections.banking && (
          <div style={sectionStyle}>
            <SectionTitle>Dados bancários</SectionTitle>
            <div style={grid2}>
              <FormField label="Chave PIX">
                <TextInput
                  value={values.pix_key}
                  onChange={(v) => set("pix_key", v)}
                  placeholder="CPF, CNPJ, e-mail ou telefone"
                  disabled={isLoading}
                />
              </FormField>
              <FormField label="Banco">
                <TextInput
                  value={values.bank_name}
                  onChange={(v) => set("bank_name", v)}
                  placeholder="Ex: Nubank, Itaú, Bradesco"
                  disabled={isLoading}
                />
              </FormField>
              <FormField label="Titular da conta">
                <TextInput
                  value={values.account_holder_name}
                  onChange={(v) => set("account_holder_name", v)}
                  placeholder="Nome completo ou razão social"
                  disabled={isLoading}
                />
              </FormField>
              <FormField label="CPF / CNPJ do titular">
                <TextInput
                  value={values.account_holder_document_id}
                  onChange={(v) => set("account_holder_document_id", v)}
                  placeholder="000.000.000-00"
                  disabled={isLoading}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* Informações adicionais */}
        {profile.showSections.additionalInfo && (
          <div style={sectionStyle}>
            <SectionTitle>Informações adicionais</SectionTitle>
            <div style={grid2}>
              <FormField label="Assessor / Manager">
                <TextInput
                  value={values.manager_name}
                  onChange={(v) => set("manager_name", v)}
                  placeholder="Nome do assessor ou manager"
                  disabled={isLoading}
                />
              </FormField>
              <FormField label="Gravadora / Editora">
                <TextInput
                  value={values.label_name}
                  onChange={(v) => set("label_name", v)}
                  placeholder="Ex: Sony Music, Warner"
                  disabled={isLoading}
                />
              </FormField>
            </div>
            <FormField label="Observações internas" hint="Não visível para o cadastrado">
              <TextArea
                value={values.notes_internal}
                onChange={(v) => set("notes_internal", v)}
                placeholder="Notas operacionais para uso interno..."
                disabled={isLoading}
              />
            </FormField>
          </div>
        )}

        {/* Feedback de resultado */}
        {submitState.type === "success" && (
          <SuccessBanner record_id={submitState.result.record_id} />
        )}
        {submitState.type === "conflict" && (
          <ConflictBanner message={submitState.result.message} />
        )}
        {submitState.type === "invalid" && (
          <ValidationErrorBanner
            message={submitState.result.message}
            issues={submitState.result.issues}
          />
        )}
        {submitState.type === "error" && (
          <ErrorBanner message={submitState.result.message} />
        )}

        {/* Ações */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          {submitState.type === "success" ? (
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: "0.75rem 1.75rem",
                borderRadius: "0.5rem",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            >
              Cadastrar outra pessoa
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "0.5rem",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
              >
                Limpar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: "0.75rem 2rem",
                  borderRadius: "0.5rem",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  background: isLoading
                    ? "rgba(250,204,21,0.4)"
                    : "var(--brand)",
                  border: "none",
                  color: "#07111f",
                  transition: "opacity 0.15s",
                  opacity: isLoading ? 0.7 : 1,
                  minWidth: "140px",
                }}
              >
                {isLoading ? "Enviando..." : "Cadastrar"}
              </button>
            </>
          )}
        </div>

        {/* Rodapé */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            color: "var(--muted-2)",
            marginTop: "0.5rem",
          }}
        >
          Sunbeat · People Registry · {profile.clientLabel} ·{" "}
          {profile.formVersion}
        </p>
      </form>
    </div>
  );
}
