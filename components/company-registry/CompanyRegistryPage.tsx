"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  createInitialCompanyRegistryValues,
  companyRegistryTemplate,
} from "@/lib/form-engine/company-registry-template";
import {
  buildWorkflowDraftPayload,
  buildWorkflowSubmitPayload,
} from "@/lib/form-engine/submission-payload";
import { getWorkflowTemplate } from "@/lib/form-engine/get-release-template";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type {
  CompanyRegistryFormValues,
  CompanyRegistryStepKey,
  FormVersion,
  WorkflowType,
} from "@/lib/form-engine/types";

const STEP_ORDER: CompanyRegistryStepKey[] = [
  "intro",
  "company_data",
  "legal_representative",
  "contract_representative",
  "financial_representative",
  "banking_data",
  "review_submit",
];

type AutosaveState = "idle" | "saving" | "saved" | "error";

function generateUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function parseJsonResponseText(raw: string) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getApiMessage(
  data: Record<string, unknown> | null,
  raw: string,
  fallback: string
) {
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  if (typeof data?.detail === "string" && data.detail.trim()) return data.detail;
  const text = raw.trim();
  if (!text || text.startsWith("<")) return fallback;
  return text;
}

// ---------------------------------------------------------------------------
// UI primitives
// ---------------------------------------------------------------------------

function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[15px] font-medium text-slate-900">{label}</span>
      {required ? (
        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-700">
          Obrigatorio
        </span>
      ) : null}
    </div>
  );
}

function FormInput({
  label,
  type = "text",
  value,
  required,
  placeholder,
  error,
  options,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  options?: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      {type === "select" && options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-3 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-[15px] text-slate-900 outline-none transition focus:border-slate-900"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-3 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-[15px] text-slate-900 outline-none transition focus:border-slate-900"
        />
      )}
      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

/** Elegant Yes/No toggle replacing the plain <select> for same-as questions. */
function SameAsToggle({
  label,
  value,
  required,
  error,
  onChange,
}: {
  label: string;
  value: string;
  required?: boolean;
  error?: string;
  onChange: (value: "yes" | "no" | "") => void;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <div className="mt-3 flex gap-3">
        {(["yes", "no"] as const).map((opt) => {
          const isActive = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(isActive ? "" : opt)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-5 py-3 text-[15px] font-semibold transition ${
                isActive
                  ? opt === "yes"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {isActive && opt === "yes" ? (
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : null}
              {opt === "yes" ? "Sim" : "Nao"}
            </button>
          );
        })}
      </div>
      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

/** Preview card shown when a representative is inherited from another role. */
function InheritedPersonCard({
  sourceLabel,
  name,
  phone,
  email,
}: {
  sourceLabel: string;
  name?: string;
  phone?: string;
  email?: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
        {sourceLabel}
      </p>
      <div className="space-y-1.5">
        {name && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="w-20 shrink-0 text-slate-400">Nome</span>
            <span className="font-medium">{name}</span>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="w-20 shrink-0 text-slate-400">Telefone</span>
            <span className="font-medium">{phone}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="w-20 shrink-0 text-slate-400">E-mail</span>
            <span className="font-medium">{email}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  const display = value?.trim() || "-";
  const isYesNo = value === "yes" ? "Sim" : value === "no" ? "Nao" : display;
  return (
    <div className="flex gap-4 py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 w-44 shrink-0">{label}</span>
      <span className="text-sm text-slate-900 font-medium">{isYesNo}</span>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-500 mb-1">
        {title}
      </h3>
      <div className="rounded-2xl border border-slate-200 bg-white px-5 divide-y divide-slate-100">
        {children}
      </div>
    </div>
  );
}

/** Autosave status dot + label */
function AutosaveBadge({ state }: { state: AutosaveState }) {
  if (state === "idle") return null;
  const config = {
    saving: { dot: "bg-amber-400 animate-pulse", text: "Salvando...", textColor: "text-slate-400" },
    saved: { dot: "bg-emerald-500", text: "Salvo", textColor: "text-slate-400" },
    error: { dot: "bg-red-500", text: "Erro ao salvar", textColor: "text-red-500" },
  }[state];
  return (
    <span className={`flex items-center gap-1.5 text-xs ${config.textColor}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.text}
    </span>
  );
}

/** Step pill for the stepper navigation. */
function StepChip({
  label,
  index,
  isActive,
  isDone,
  onClick,
}: {
  label: string;
  index: number;
  isActive: boolean;
  isDone: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isDone && !isActive}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        isActive
          ? "bg-slate-900 text-white shadow-sm"
          : isDone
          ? "bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
          : "bg-slate-50 text-slate-300 cursor-not-allowed"
      }`}
    >
      {isDone ? (
        <svg className="h-3 w-3 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <span className={`h-4 w-4 flex items-center justify-center rounded-full text-[10px] font-bold ${isActive ? "bg-white text-slate-900" : "bg-slate-200 text-slate-500"}`}>
          {index + 1}
        </span>
      )}
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CompanyRegistryPage({
  workspaceSlug = companyRegistryTemplate.workspaceSlug,
  workflowType = companyRegistryTemplate.workflowType,
  formVersion = companyRegistryTemplate.formVersion,
}: {
  workspaceSlug?: string;
  workflowType?: WorkflowType;
  formVersion?: FormVersion;
}) {
  const searchParams = useSearchParams();
  const resumeToken = searchParams.get("draft");
  const editToken = searchParams.get("edit_token");

  const [template, setTemplate] = useState(companyRegistryTemplate);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [currentStep, setCurrentStep] = useState<CompanyRegistryStepKey>("intro");
  const [values, setValues] = useState<CompanyRegistryFormValues>(
    createInitialCompanyRegistryValues()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftToken, setDraftToken] = useState<string | null>(resumeToken);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [isHydratingDraft, setIsHydratingDraft] = useState(false);

  const didHydrateDraftRef = useRef(false);
  const didHydrateEditRef = useRef(false);
  const successCardRef = useRef<HTMLDivElement | null>(null);

  const currentStepIndex = Math.max(STEP_ORDER.indexOf(currentStep), 0);
  const currentStepMeta = useMemo(
    () => template.steps.find((s) => s.key === currentStep),
    [template, currentStep]
  );

  // Load workspace-specific template
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const t = await getWorkflowTemplate({
          workspaceSlug,
          workflowType,
          formVersion,
        });
        if (!cancelled && t) setTemplate(t as typeof companyRegistryTemplate);
      } catch {
        // keep default
      } finally {
        if (!cancelled) setIsLoadingTemplate(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [workspaceSlug, workflowType, formVersion]);

  function ensureDraftToken() {
    if (draftToken) return draftToken;
    const token = generateUuid();
    setDraftToken(token);
    return token;
  }

  function setSectionField(
    section: keyof CompanyRegistryFormValues,
    key: string,
    value: unknown
  ) {
    setValues((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, unknown>),
        [key]: value,
      },
    }));
  }

  function clearFieldError(path: string) {
    setErrors((prev) => {
      if (!prev[path]) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }

  // Autosave
  useEffect(() => {
    if (currentStep === "intro" || currentStep === "review_submit") return;
    if (!draftToken && !editToken) return;

    const timer = setTimeout(async () => {
      const token = ensureDraftToken();
      setAutosaveState("saving");
      try {
        const payload = buildWorkflowDraftPayload({
          draftToken: token,
          workspaceSlug,
          workflowType,
          formVersion,
          currentStep,
          values,
        });
        const supabase = createSupabaseBrowser();
        const { error } = await supabase.from("drafts").upsert(
          {
            draft_token: token,
            workspace_slug: workspaceSlug,
            workflow_type: workflowType,
            current_step: currentStep,
            progress_percent: (payload as { progress_percent?: number }).progress_percent ?? 0,
            payload: JSON.stringify(payload),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "draft_token" }
        );
        if (error) throw error;
        setAutosaveState("saved");
      } catch {
        setAutosaveState("error");
      }
    }, 1200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, currentStep]);

  // Hydrate draft on load
  useEffect(() => {
    if (!resumeToken || didHydrateDraftRef.current) return;
    didHydrateDraftRef.current = true;
    setIsHydratingDraft(true);
    async function hydrate() {
      try {
        const supabase = createSupabaseBrowser();
        const { data } = await supabase
          .from("drafts")
          .select("payload, current_step")
          .eq("draft_token", resumeToken)
          .single();
        if (!data) return;
        let payload: Record<string, unknown> | null = null;
        try {
          payload = typeof data.payload === "string"
            ? JSON.parse(data.payload)
            : data.payload;
        } catch { return; }
        if (!payload?.values) return;
        const v = payload.values as Partial<CompanyRegistryFormValues>;
        setValues((prev) => ({
          company_data: { ...prev.company_data, ...(v.company_data ?? {}) },
          legal_representative: { ...prev.legal_representative, ...(v.legal_representative ?? {}) },
          contract_representative: { ...prev.contract_representative, ...(v.contract_representative ?? {}) },
          financial_representative: { ...prev.financial_representative, ...(v.financial_representative ?? {}) },
          banking_data: { ...prev.banking_data, ...(v.banking_data ?? {}) },
        }));
        if (data.current_step && STEP_ORDER.includes(data.current_step as CompanyRegistryStepKey)) {
          setCurrentStep(data.current_step as CompanyRegistryStepKey);
        }
      } catch { /* ignore */ } finally {
        setIsHydratingDraft(false);
      }
    }
    hydrate();
  }, [resumeToken]);

  // Hydrate edit mode
  useEffect(() => {
    if (!editToken || didHydrateEditRef.current) return;
    didHydrateEditRef.current = true;
    async function hydrateEdit() {
      try {
        const response = await fetch(`/api/submissions/edit/${editToken}`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) return;
        const data = await response.json() as Record<string, unknown>;
        const payload = (data.data ?? data.payload ?? data) as Record<string, unknown>;
        if (payload.draft_token && typeof payload.draft_token === "string") {
          setDraftToken(payload.draft_token);
        }
        const v = payload as Partial<CompanyRegistryFormValues> & { company_data?: Partial<CompanyRegistryFormValues["company_data"]> };
        setValues((prev) => ({
          company_data: { ...prev.company_data, ...(v.company_data ?? {}) },
          legal_representative: { ...prev.legal_representative, ...(v.legal_representative ?? {}) },
          contract_representative: { ...prev.contract_representative, ...(v.contract_representative ?? {}) },
          financial_representative: { ...prev.financial_representative, ...(v.financial_representative ?? {}) },
          banking_data: { ...prev.banking_data, ...(v.banking_data ?? {}) },
        }));
        setCurrentStep("company_data");
      } catch { /* ignore */ }
    }
    hydrateEdit();
  }, [editToken]);

  function validateCurrentStep(): boolean {
    const newErrors: Record<string, string> = {};

    if (currentStep === "company_data") {
      if (!values.company_data.document_type)
        newErrors["company_data.document_type"] = "Selecione o tipo de documento.";
      if (!values.company_data.document_number.trim())
        newErrors["company_data.document_number"] = "Informe o numero do documento.";
      if (!values.company_data.fantasy_name.trim())
        newErrors["company_data.fantasy_name"] = "Informe o nome fantasia.";
      if (!values.company_data.legal_name.trim())
        newErrors["company_data.legal_name"] = "Informe a razao social.";
      if (!values.company_data.address.trim())
        newErrors["company_data.address"] = "Informe o endereco.";
      if (!values.company_data.city.trim())
        newErrors["company_data.city"] = "Informe a cidade.";
      if (!values.company_data.state.trim())
        newErrors["company_data.state"] = "Informe o estado.";
      if (!values.company_data.zip_code.trim())
        newErrors["company_data.zip_code"] = "Informe o CEP.";
    }

    if (currentStep === "legal_representative") {
      if (!values.legal_representative.name.trim())
        newErrors["legal_representative.name"] = "Informe o nome.";
      if (!values.legal_representative.phone.trim())
        newErrors["legal_representative.phone"] = "Informe o telefone.";
      if (!values.legal_representative.email.trim())
        newErrors["legal_representative.email"] = "Informe o e-mail.";
      else if (!/\S+@\S+\.\S+/.test(values.legal_representative.email))
        newErrors["legal_representative.email"] = "Informe um e-mail valido.";
    }

    if (currentStep === "contract_representative") {
      if (!values.contract_representative.same_as_legal)
        newErrors["contract_representative.same_as_legal"] = "Selecione uma opcao.";
      if (values.contract_representative.same_as_legal === "no") {
        if (!values.contract_representative.name.trim())
          newErrors["contract_representative.name"] = "Informe o nome.";
        if (!values.contract_representative.phone.trim())
          newErrors["contract_representative.phone"] = "Informe o telefone.";
        if (!values.contract_representative.email.trim())
          newErrors["contract_representative.email"] = "Informe o e-mail.";
        else if (!/\S+@\S+\.\S+/.test(values.contract_representative.email))
          newErrors["contract_representative.email"] = "Informe um e-mail valido.";
      }
    }

    if (currentStep === "financial_representative") {
      if (!values.financial_representative.same_as_legal)
        newErrors["financial_representative.same_as_legal"] = "Selecione uma opcao.";
      if (
        values.financial_representative.same_as_legal === "no" &&
        !values.financial_representative.same_as_contract
      )
        newErrors["financial_representative.same_as_contract"] = "Selecione uma opcao.";
      if (
        values.financial_representative.same_as_legal === "no" &&
        values.financial_representative.same_as_contract === "no"
      ) {
        if (!values.financial_representative.name.trim())
          newErrors["financial_representative.name"] = "Informe o nome.";
        if (!values.financial_representative.phone.trim())
          newErrors["financial_representative.phone"] = "Informe o telefone.";
        if (!values.financial_representative.email.trim())
          newErrors["financial_representative.email"] = "Informe o e-mail.";
        else if (!/\S+@\S+\.\S+/.test(values.financial_representative.email))
          newErrors["financial_representative.email"] = "Informe um e-mail valido.";
      }
    }

    if (currentStep === "banking_data") {
      if (!values.banking_data.bank_name.trim())
        newErrors["banking_data.bank_name"] = "Informe o banco.";
      if (!values.banking_data.agency.trim())
        newErrors["banking_data.agency"] = "Informe a agencia.";
      if (!values.banking_data.account.trim())
        newErrors["banking_data.account"] = "Informe a conta.";
      if (!values.banking_data.account_type)
        newErrors["banking_data.account_type"] = "Selecione o tipo de conta.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      setCurrentStep(STEP_ORDER[nextIndex]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goBack() {
    if (currentStepIndex > 0) {
      setCurrentStep(STEP_ORDER[currentStepIndex - 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleSubmit() {
    if (!validateCurrentStep()) return;
    setLoadingSubmit(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      const token = ensureDraftToken();
      const payload = buildWorkflowSubmitPayload({
        draftToken: token,
        workspaceSlug,
        workflowType,
        formVersion,
        values,
      });

      const body = editToken
        ? { ...payload, edit_token: editToken }
        : payload;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}/submissions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const rawText = await response.text();
      const data = parseJsonResponseText(rawText);

      if (!response.ok) {
        throw new Error(
          getApiMessage(data, rawText, "Erro ao enviar. Tente novamente.")
        );
      }

      setSubmitMessage(
        getApiMessage(data, rawText, template.successMessage)
      );
      setIsSubmissionComplete(true);
      setTimeout(() => {
        successCardRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Erro inesperado. Tente novamente."
      );
    } finally {
      setLoadingSubmit(false);
    }
  }

  const progressPercent = Math.round(
    (currentStepIndex / (STEP_ORDER.length - 1)) * 100
  );

  // Helper to resolve display values for contract/financial reps
  const resolvedContract = values.contract_representative.same_as_legal === "yes"
    ? values.legal_representative
    : values.contract_representative;

  const resolvedFinancial =
    values.financial_representative.same_as_legal === "yes"
      ? values.legal_representative
      : values.financial_representative.same_as_contract === "yes"
      ? values.contract_representative
      : values.financial_representative;

  if (isLoadingTemplate || isHydratingDraft) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#ebdbba" }}>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
          Carregando...
        </div>
      </div>
    );
  }

  if (isSubmissionComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16" style={{ background: "#ebdbba" }}>
        <div
          ref={successCardRef}
          className="w-full max-w-lg rounded-3xl border border-green-200 bg-white p-10 text-center shadow-sm"
        >
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-slate-900">Cadastro enviado!</h2>
          <p className="text-[15px] leading-7 text-slate-600">
            {submitMessage ?? template.successMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: template.formTheme?.formBg ?? "#ebdbba" }}>
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {template.intro.logoUrl ? (
              <img
                src={template.intro.logoUrl}
                alt={template.intro.clientName}
                className="h-7 max-w-[140px] object-contain"
              />
            ) : (
              <span className="text-sm font-bold text-slate-900">
                {template.intro.clientName}
              </span>
            )}
            <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 sm:inline">
              Cadastro de empresa
            </span>
          </div>
          <div className="flex items-center gap-3">
            <AutosaveBadge state={autosaveState} />
            {editToken && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                Modo edicao
              </span>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-slate-100">
          <div
            className="h-full transition-all duration-500"
            style={{ background: template.formTheme?.primary ?? "#0f172a", width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Edit mode banner */}
      {editToken && currentStep !== "intro" && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <svg className="h-4 w-4 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <p className="text-xs text-amber-800">
              Voce esta <strong>editando</strong> um cadastro ja enviado. As alteracoes serao salvas ao clicar em{" "}
              <strong>Enviar cadastro</strong>.
            </p>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-2xl px-4 py-10">
        {/* Step nav */}
        {currentStep !== "intro" && (
          <div className="mb-8 flex flex-wrap gap-2">
            {STEP_ORDER.filter((s) => s !== "intro").map((step, i) => {
              const stepIdx = STEP_ORDER.indexOf(step);
              const isActive = step === currentStep;
              const isDone = stepIdx < currentStepIndex;
              const stepMeta = template.steps.find((s) => s.key === step);
              return (
                <StepChip
                  key={step}
                  label={stepMeta?.title ?? step}
                  index={i}
                  isActive={isActive}
                  isDone={isDone}
                  onClick={isDone ? () => setCurrentStep(step) : undefined}
                />
              );
            })}
          </div>
        )}

        {/* ===== INTRO ===== */}
        {currentStep === "intro" && (
          <div className="space-y-8">
            {/* Branding card */}
            <div className="rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
              {template.intro.logoUrl ? (
                <div className="mb-4">
                  <img
                    src={template.intro.logoUrl}
                    alt={template.intro.clientName}
                    className="mx-auto h-16 max-w-[200px] object-contain"
                  />
                </div>
              ) : (
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900">
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <div className="mb-1 inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                {template.intro.clientName}
              </div>
              <h1 className="mt-3 text-2xl font-bold text-slate-900">{template.intro.formTitle}</h1>
              <p className="mt-3 text-[15px] leading-7 text-slate-500 whitespace-pre-line">
                {template.intro.introText}
              </p>
            </div>

            {/* Highlights */}
            {template.intro.highlights && template.intro.highlights.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  O que sera preenchido
                </p>
                <ul className="space-y-3">
                  {template.intro.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3 text-[14px] text-slate-700">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={goNext}
              className="w-full rounded-2xl px-6 py-4 text-[15px] font-semibold text-white transition active:scale-[0.99]" style={{ background: template.formTheme?.primary ?? "#0f172a" }}
            >
              Comecar cadastro
            </button>
          </div>
        )}

        {/* ===== COMPANY DATA ===== */}
        {currentStep === "company_data" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{currentStepMeta?.title}</h2>
              {currentStepMeta?.description && (
                <p className="mt-2 text-sm text-slate-500">{currentStepMeta.description}</p>
              )}
            </div>
            <FormInput
              label="Tipo de documento"
              type="select"
              value={values.company_data.document_type}
              required
              options={[
                { label: "Selecione", value: "" },
                { label: "CPF (pessoa fisica)", value: "cpf" },
                { label: "CNPJ (pessoa juridica)", value: "cnpj" },
              ]}
              error={errors["company_data.document_type"]}
              onChange={(v) => {
                setSectionField("company_data", "document_type", v);
                clearFieldError("company_data.document_type");
              }}
            />
            <FormInput
              label="Numero do documento (CPF ou CNPJ)"
              value={values.company_data.document_number}
              required
              placeholder="000.000.000-00 ou 00.000.000/0001-00"
              error={errors["company_data.document_number"]}
              onChange={(v) => {
                setSectionField("company_data", "document_number", v);
                clearFieldError("company_data.document_number");
              }}
            />
            <FormInput
              label="Nome fantasia"
              value={values.company_data.fantasy_name}
              required
              placeholder="Nome pelo qual a empresa e conhecida"
              error={errors["company_data.fantasy_name"]}
              onChange={(v) => {
                setSectionField("company_data", "fantasy_name", v);
                clearFieldError("company_data.fantasy_name");
              }}
            />
            <FormInput
              label="Razao social"
              value={values.company_data.legal_name}
              required
              placeholder="Razao social completa conforme registro"
              error={errors["company_data.legal_name"]}
              onChange={(v) => {
                setSectionField("company_data", "legal_name", v);
                clearFieldError("company_data.legal_name");
              }}
            />
            <FormInput
              label="Endereco (logradouro, numero, complemento)"
              value={values.company_data.address}
              required
              placeholder="Rua, numero, complemento"
              error={errors["company_data.address"]}
              onChange={(v) => {
                setSectionField("company_data", "address", v);
                clearFieldError("company_data.address");
              }}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Cidade"
                value={values.company_data.city}
                required
                placeholder="Cidade"
                error={errors["company_data.city"]}
                onChange={(v) => {
                  setSectionField("company_data", "city", v);
                  clearFieldError("company_data.city");
                }}
              />
              <FormInput
                label="Estado (UF)"
                value={values.company_data.state}
                required
                placeholder="SP"
                error={errors["company_data.state"]}
                onChange={(v) => {
                  setSectionField("company_data", "state", v.toUpperCase());
                  clearFieldError("company_data.state");
                }}
              />
            </div>
            <FormInput
              label="CEP"
              value={values.company_data.zip_code}
              required
              placeholder="00000-000"
              error={errors["company_data.zip_code"]}
              onChange={(v) => {
                setSectionField("company_data", "zip_code", v);
                clearFieldError("company_data.zip_code");
              }}
            />
          </div>
        )}

        {/* ===== LEGAL REPRESENTATIVE ===== */}
        {currentStep === "legal_representative" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{currentStepMeta?.title}</h2>
              {currentStepMeta?.description && (
                <p className="mt-2 text-sm text-slate-500">{currentStepMeta.description}</p>
              )}
            </div>
            <FormInput
              label="Nome completo"
              value={values.legal_representative.name}
              required
              placeholder="Nome do responsavel legal"
              error={errors["legal_representative.name"]}
              onChange={(v) => {
                setSectionField("legal_representative", "name", v);
                clearFieldError("legal_representative.name");
              }}
            />
            <FormInput
              label="Telefone / WhatsApp"
              value={values.legal_representative.phone}
              required
              placeholder="+55 11 99999-9999"
              error={errors["legal_representative.phone"]}
              onChange={(v) => {
                setSectionField("legal_representative", "phone", v);
                clearFieldError("legal_representative.phone");
              }}
            />
            <FormInput
              label="E-mail"
              type="email"
              value={values.legal_representative.email}
              required
              placeholder="email@empresa.com"
              error={errors["legal_representative.email"]}
              onChange={(v) => {
                setSectionField("legal_representative", "email", v);
                clearFieldError("legal_representative.email");
              }}
            />
          </div>
        )}

        {/* ===== CONTRACT REPRESENTATIVE ===== */}
        {currentStep === "contract_representative" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{currentStepMeta?.title}</h2>
              {currentStepMeta?.description && (
                <p className="mt-2 text-sm text-slate-500">{currentStepMeta.description}</p>
              )}
            </div>
            <SameAsToggle
              label="E a mesma pessoa que o responsavel legal?"
              value={values.contract_representative.same_as_legal}
              required
              error={errors["contract_representative.same_as_legal"]}
              onChange={(v) => {
                setSectionField("contract_representative", "same_as_legal", v);
                clearFieldError("contract_representative.same_as_legal");
              }}
            />
            {values.contract_representative.same_as_legal === "yes" && (
              <InheritedPersonCard
                sourceLabel="Dados herdados do responsavel legal"
                name={values.legal_representative.name}
                phone={values.legal_representative.phone}
                email={values.legal_representative.email}
              />
            )}
            {values.contract_representative.same_as_legal === "no" && (
              <>
                <FormInput
                  label="Nome completo"
                  value={values.contract_representative.name}
                  required
                  placeholder="Nome do responsavel pelo contrato"
                  error={errors["contract_representative.name"]}
                  onChange={(v) => {
                    setSectionField("contract_representative", "name", v);
                    clearFieldError("contract_representative.name");
                  }}
                />
                <FormInput
                  label="Telefone / WhatsApp"
                  value={values.contract_representative.phone}
                  required
                  placeholder="+55 11 99999-9999"
                  error={errors["contract_representative.phone"]}
                  onChange={(v) => {
                    setSectionField("contract_representative", "phone", v);
                    clearFieldError("contract_representative.phone");
                  }}
                />
                <FormInput
                  label="E-mail"
                  type="email"
                  value={values.contract_representative.email}
                  required
                  placeholder="email@empresa.com"
                  error={errors["contract_representative.email"]}
                  onChange={(v) => {
                    setSectionField("contract_representative", "email", v);
                    clearFieldError("contract_representative.email");
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* ===== FINANCIAL REPRESENTATIVE ===== */}
        {currentStep === "financial_representative" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{currentStepMeta?.title}</h2>
              {currentStepMeta?.description && (
                <p className="mt-2 text-sm text-slate-500">{currentStepMeta.description}</p>
              )}
            </div>
            <SameAsToggle
              label="E a mesma pessoa que o responsavel legal?"
              value={values.financial_representative.same_as_legal}
              required
              error={errors["financial_representative.same_as_legal"]}
              onChange={(v) => {
                setSectionField("financial_representative", "same_as_legal", v);
                clearFieldError("financial_representative.same_as_legal");
              }}
            />
            {values.financial_representative.same_as_legal === "yes" && (
              <InheritedPersonCard
                sourceLabel="Dados herdados do responsavel legal"
                name={values.legal_representative.name}
                phone={values.legal_representative.phone}
                email={values.legal_representative.email}
              />
            )}
            {values.financial_representative.same_as_legal === "no" && (
              <SameAsToggle
                label="E a mesma pessoa que o responsavel pelo contrato?"
                value={values.financial_representative.same_as_contract}
                required
                error={errors["financial_representative.same_as_contract"]}
                onChange={(v) => {
                  setSectionField("financial_representative", "same_as_contract", v);
                  clearFieldError("financial_representative.same_as_contract");
                }}
              />
            )}
            {values.financial_representative.same_as_legal === "no" &&
              values.financial_representative.same_as_contract === "yes" && (
                <InheritedPersonCard
                  sourceLabel="Dados herdados do responsavel pelo contrato"
                  name={resolvedContract.name}
                  phone={resolvedContract.phone}
                  email={resolvedContract.email}
                />
              )}
            {values.financial_representative.same_as_legal === "no" &&
              values.financial_representative.same_as_contract === "no" && (
                <>
                  <FormInput
                    label="Nome completo"
                    value={values.financial_representative.name}
                    required
                    placeholder="Nome do responsavel financeiro"
                    error={errors["financial_representative.name"]}
                    onChange={(v) => {
                      setSectionField("financial_representative", "name", v);
                      clearFieldError("financial_representative.name");
                    }}
                  />
                  <FormInput
                    label="Telefone / WhatsApp"
                    value={values.financial_representative.phone}
                    required
                    placeholder="+55 11 99999-9999"
                    error={errors["financial_representative.phone"]}
                    onChange={(v) => {
                      setSectionField("financial_representative", "phone", v);
                      clearFieldError("financial_representative.phone");
                    }}
                  />
                  <FormInput
                    label="E-mail"
                    type="email"
                    value={values.financial_representative.email}
                    required
                    placeholder="email@empresa.com"
                    error={errors["financial_representative.email"]}
                    onChange={(v) => {
                      setSectionField("financial_representative", "email", v);
                      clearFieldError("financial_representative.email");
                    }}
                  />
                </>
              )}
          </div>
        )}

        {/* ===== BANKING DATA ===== */}
        {currentStep === "banking_data" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{currentStepMeta?.title}</h2>
              {currentStepMeta?.description && (
                <p className="mt-2 text-sm text-slate-500">{currentStepMeta.description}</p>
              )}
            </div>
            <FormInput
              label="Banco"
              value={values.banking_data.bank_name}
              required
              placeholder="Ex: Itau, Bradesco, Nubank"
              error={errors["banking_data.bank_name"]}
              onChange={(v) => {
                setSectionField("banking_data", "bank_name", v);
                clearFieldError("banking_data.bank_name");
              }}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Agencia"
                value={values.banking_data.agency}
                required
                placeholder="0000"
                error={errors["banking_data.agency"]}
                onChange={(v) => {
                  setSectionField("banking_data", "agency", v);
                  clearFieldError("banking_data.agency");
                }}
              />
              <FormInput
                label="Conta (com digito)"
                value={values.banking_data.account}
                required
                placeholder="00000-0"
                error={errors["banking_data.account"]}
                onChange={(v) => {
                  setSectionField("banking_data", "account", v);
                  clearFieldError("banking_data.account");
                }}
              />
            </div>
            <FormInput
              label="Tipo de conta"
              type="select"
              value={values.banking_data.account_type}
              required
              options={[
                { label: "Selecione", value: "" },
                { label: "Conta corrente", value: "corrente" },
                { label: "Conta poupanca", value: "poupanca" },
              ]}
              error={errors["banking_data.account_type"]}
              onChange={(v) => {
                setSectionField("banking_data", "account_type", v);
                clearFieldError("banking_data.account_type");
              }}
            />
            <FormInput
              label="Chave Pix (opcional)"
              value={values.banking_data.pix_key}
              placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatoria"
              onChange={(v) => setSectionField("banking_data", "pix_key", v)}
            />
          </div>
        )}

        {/* ===== REVIEW & SUBMIT ===== */}
        {currentStep === "review_submit" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{currentStepMeta?.title}</h2>
              <p className="mt-2 text-sm text-slate-500">
                Revise as informacoes antes de enviar.
              </p>
            </div>

            <ReviewSection title="Dados da empresa">
              <ReviewRow label="Tipo de documento" value={values.company_data.document_type === "cpf" ? "CPF" : values.company_data.document_type === "cnpj" ? "CNPJ" : ""} />
              <ReviewRow label="Documento" value={values.company_data.document_number} />
              <ReviewRow label="Nome fantasia" value={values.company_data.fantasy_name} />
              <ReviewRow label="Razao social" value={values.company_data.legal_name} />
              <ReviewRow label="Endereco" value={values.company_data.address} />
              <ReviewRow label="Cidade" value={`${values.company_data.city} - ${values.company_data.state}`} />
              <ReviewRow label="CEP" value={values.company_data.zip_code} />
            </ReviewSection>

            <ReviewSection title="Responsavel legal">
              <ReviewRow label="Nome" value={values.legal_representative.name} />
              <ReviewRow label="Telefone" value={values.legal_representative.phone} />
              <ReviewRow label="E-mail" value={values.legal_representative.email} />
            </ReviewSection>

            <ReviewSection title="Responsavel pelo contrato">
              {values.contract_representative.same_as_legal === "yes" ? (
                <ReviewRow label="Mesmo que o legal" value="Sim" />
              ) : (
                <>
                  <ReviewRow label="Nome" value={(resolvedContract as typeof values.legal_representative).name} />
                  <ReviewRow label="Telefone" value={(resolvedContract as typeof values.legal_representative).phone} />
                  <ReviewRow label="E-mail" value={(resolvedContract as typeof values.legal_representative).email} />
                </>
              )}
            </ReviewSection>

            <ReviewSection title="Responsavel financeiro">
              {values.financial_representative.same_as_legal === "yes" ? (
                <ReviewRow label="Mesmo que o legal" value="Sim" />
              ) : values.financial_representative.same_as_contract === "yes" ? (
                <ReviewRow label="Mesmo que o contrato" value="Sim" />
              ) : (
                <>
                  <ReviewRow label="Nome" value={(resolvedFinancial as typeof values.legal_representative).name} />
                  <ReviewRow label="Telefone" value={(resolvedFinancial as typeof values.legal_representative).phone} />
                  <ReviewRow label="E-mail" value={(resolvedFinancial as typeof values.legal_representative).email} />
                </>
              )}
            </ReviewSection>

            <ReviewSection title="Dados bancarios">
              <ReviewRow label="Banco" value={values.banking_data.bank_name} />
              <ReviewRow label="Agencia" value={values.banking_data.agency} />
              <ReviewRow label="Conta" value={values.banking_data.account} />
              <ReviewRow label="Tipo" value={values.banking_data.account_type === "corrente" ? "Conta corrente" : values.banking_data.account_type === "poupanca" ? "Conta poupanca" : ""} />
              {values.banking_data.pix_key && (
                <ReviewRow label="Chave Pix" value={values.banking_data.pix_key} />
              )}
            </ReviewSection>

            {submitError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        {currentStep !== "intro" && (
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              onClick={goBack}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>

            {currentStep !== "review_submit" ? (
              <button
                onClick={goNext}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-3 text-[15px] font-semibold text-white transition active:scale-[0.99]" style={{ background: template.formTheme?.primary ?? "#0f172a" }}
              >
                Continuar
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loadingSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-3 text-[15px] font-semibold text-white transition disabled:opacity-60 active:scale-[0.99]" style={{ background: template.formTheme?.primary ?? "#0f172a" }}
              >
                {loadingSubmit ? (
                  <>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60" />
                    Enviando...
                  </>
                ) : (
                  "Enviar cadastro"
                )}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
