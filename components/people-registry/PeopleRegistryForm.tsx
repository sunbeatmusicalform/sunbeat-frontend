"use client";

// components/people-registry/PeopleRegistryForm.tsx
// Formulário multi-step de cadastro de pessoas — PF/PJ, profile-driven
// Visual alinhado ao design system dos forms existentes (tema claro, #ebdbba, slate)

import { Fragment, useState, useCallback, type ChangeEvent } from "react";
import type {
  PeopleRegistryProfileConfig,
  PeopleRegistryFormValues,
  PeopleRegistryApiPayload,
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

const STEP_ORDER: StepKey[] = [
  "intro",
  "identification",
  "contact",
  "address",
  "banking",
  "additional_info",
  "review_submit",
];

const STEP_LABELS: Record<Exclude<StepKey, "intro">, string> = {
  identification: "Identificação",
  contact: "Contato",
  address: "Endereço",
  banking: "Dados bancários",
  additional_info: "Informações",
  review_submit: "Revisão",
};

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

// ─── Payload builder ──────────────────────────────────────────────────────────

function buildApiPayload(
  values: PeopleRegistryFormValues,
  profile: PeopleRegistryProfileConfig
): PeopleRegistryApiPayload {
  const isPF = values.party_kind === "pf";

  // agência e número vão em external_refs — backend ignora campos extras em banking
  const externalRefs: Record<string, string> = {};
  if (values.bank_agency.trim()) externalRefs.bank_agency = values.bank_agency.trim();
  if (values.account_number.trim()) externalRefs.account_number = values.account_number.trim();

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
      external_refs: externalRefs,
    },
    meta: {
      form_version: profile.formVersion,
      source: `sunbeat.${profile.workspaceSlug}.people_registry.${profile.formVersion}`,
      submitted_at: new Date().toISOString(),
    },
  };
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
    return {
      ok: false,
      status: "conflict",
      message: typeof error?.message === "string"
        ? error.message
        : "Já existe um cadastro com o mesmo documento ou e-mail neste workspace.",
    };
  }

  if (res.status === 422) {
    const error = data.error as Record<string, unknown> | undefined;
    const rawIssues = Array.isArray(error?.issues) ? error.issues : [];
    return {
      ok: false,
      status: "invalid",
      issues: rawIssues.map((i: unknown) => {
        const issue = i as Record<string, unknown>;
        return { field: String(issue?.field ?? ""), message: String(issue?.message ?? "") };
      }),
      message: typeof error?.message === "string"
        ? error.message
        : "Verifique os campos obrigatórios e tente novamente.",
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
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
            }`}
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
}: {
  currentStep: StepKey;
  currentStepIndex: number;
}) {
  if (currentStep === "intro") return null;

  const visibleSteps = STEP_ORDER.filter((s) => s !== "intro");

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
                      ? "border-slate-900 bg-slate-900 text-white"
                      : completed
                      ? "border-slate-300 bg-white text-slate-900"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
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
                    completed ? "bg-slate-900" : "bg-slate-200"
                  }`}
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
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-slate-800 transition"
        >
          {isLoading ? "Enviando..." : nextLabel}
        </button>
      )}
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

export default function PeopleRegistryForm({
  profile,
}: {
  profile: PeopleRegistryProfileConfig;
}) {
  const [currentStep, setCurrentStep] = useState<StepKey>("intro");
  const [values, setValues] = useState<PeopleRegistryFormValues>(createInitialFormValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>({ type: "idle" });

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const isPF = values.party_kind === "pf";
  const isLoading = submitState.type === "loading";

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
    return errs;
  }

  // ─── Navegação ────────────────────────────────────────────────────────────

  function goNext() {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    const nextIndex = Math.min(currentStepIndex + 1, STEP_ORDER.length - 1);
    setCurrentStep(STEP_ORDER[nextIndex]);
    setSubmitState({ type: "idle" });
  }

  function goBack() {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(STEP_ORDER[prevIndex]);
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
    const result = await submitPeopleRegistry(payload);

    if (result.ok) { setSubmitState({ type: "success", result }); return; }
    if (result.status === "conflict") { setSubmitState({ type: "conflict", result }); return; }
    if (result.status === "invalid") { setSubmitState({ type: "invalid", result }); return; }
    setSubmitState({ type: "error", result });
  }

  // ─── Heading de step ──────────────────────────────────────────────────────

  function StepHeading({ step }: { step: Exclude<StepKey, "intro"> }) {
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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#ebdbba] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <header className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
            {profile.clientLabel}
          </div>
          {currentStep !== "intro" && (
            <p className="mt-1 text-sm text-slate-600">
              {profile.formTitle} — Formulário restrito ao time operacional.
            </p>
          )}
        </header>

        {/* Step bar */}
        <StepBar currentStep={currentStep} currentStepIndex={currentStepIndex} />

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
                Preencha os dados da pessoa que deseja cadastrar. O formulário suporta
                Pessoa Física e Pessoa Jurídica com campos condicionais.
              </p>
              <button
                type="button"
                onClick={goNext}
                className="mt-8 rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Começar cadastro
              </button>
            </div>
          )}

          {/* ── IDENTIFICAÇÃO ── */}
          {currentStep === "identification" && (
            <>
              <StepHeading step="identification" />

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
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                        }`}
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
              <StepHeading step="contact" />
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
              <StepHeading step="address" />
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
              <StepHeading step="banking" />
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
              <StepHeading step="additional_info" />
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
              <NavButtons showBack onBack={goBack} onNext={goNext} nextLabel="Revisar" />
            </>
          )}

          {/* ── REVISÃO E ENVIO ── */}
          {currentStep === "review_submit" && (
            <>
              <StepHeading step="review_submit" />

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

                  <ReviewSection title="Contato">
                    <ReviewRow label="E-mail" value={values.email_primary} />
                    <ReviewRow label="Telefone" value={values.phone_primary} />
                    <ReviewRow label="Site" value={values.website} />
                    <ReviewRow label="Instagram" value={values.instagram} />
                  </ReviewSection>

                  <ReviewSection title="Endereço">
                    <ReviewRow label="País" value={values.country} />
                    <ReviewRow label="Estado" value={values.state_region} />
                    <ReviewRow label="Cidade" value={values.city} />
                    <ReviewRow label="CEP" value={values.postal_code} />
                    <ReviewRow label="Endereço" value={values.address_line_1} />
                  </ReviewSection>

                  <ReviewSection title="Dados bancários">
                    <ReviewRow label="Chave PIX" value={values.pix_key} />
                    <ReviewRow label="Banco" value={values.bank_name} />
                    <ReviewRow label="Agência" value={values.bank_agency} />
                    <ReviewRow label="Número da conta" value={values.account_number} />
                    <ReviewRow label="Titular" value={values.account_holder_name} />
                    <ReviewRow label="CPF/CNPJ titular" value={values.account_holder_document_id} />
                  </ReviewSection>

                  <ReviewSection title="Informações adicionais">
                    <ReviewRow label="Assessor / Manager" value={values.manager_name} />
                    <ReviewRow label="Gravadora / Editora" value={values.label_name} />
                    <ReviewRow label="Observações" value={values.notes_internal} />
                  </ReviewSection>
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
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
                    >
                      Cadastrar outra pessoa
                    </button>
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
                    className="rounded-xl bg-slate-900 px-8 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-slate-800 transition"
                  >
                    {isLoading ? "Enviando..." : "Confirmar cadastro"}
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
