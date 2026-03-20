"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { atabaqueTemplate } from "@/lib/form-engine/atabaque-template";
import type { FormStepKey } from "@/lib/form-engine/types";

const WORKSPACE_SLUG = "atabaque";
const WORKSPACE_EDIT_PASSWORD_STORAGE_KEY = `sunbeat:workspace-edit-password:${WORKSPACE_SLUG}`;

type ApiOverride = {
  step_key: string;
  field_key: string;
  label_override?: string | null;
  helper_text_override?: string | null;
  is_required?: boolean | null;
  is_visible?: boolean | null;
  sort_order?: number | null;
};

type EditorField = {
  stepKey: FormStepKey;
  stepTitle: string;
  stepDescription?: string;
  fieldKey: string;
  defaultLabel: string;
  defaultHelperText: string;
  labelValue: string;
  helperTextValue: string;
  isRequired: boolean;
  isVisible: boolean;
  sortOrder: number;
};

type WorkspaceStats = {
  submissions: number;
  drafts: number;
};

type EmailSettings = {
  submissionEmailEnabled: boolean;
  submissionNotificationEmails: string[];
};

type SecuritySettings = {
  editPasswordEnabled: boolean;
  editPassword: string;
};

type StepSummary = {
  key: FormStepKey;
  title: string;
  description?: string;
  visibleCount: number;
  requiredCount: number;
  totalCount: number;
};

type FieldOverridesResponse = {
  ok: boolean;
  overrides?: ApiOverride[];
  email_settings?: {
    submission_email_enabled?: boolean;
    submission_notification_emails?: string[];
  };
  security?: {
    edit_password_enabled?: boolean;
  };
  stats?: WorkspaceStats;
  code?: string;
  error?: string;
};

function createEmptyEmailSettings(): EmailSettings {
  return {
    submissionEmailEnabled: true,
    submissionNotificationEmails: ["", "", "", "", ""],
  };
}

function createEmptySecuritySettings(): SecuritySettings {
  return {
    editPasswordEnabled: false,
    editPassword: "",
  };
}

function normalizeEmailSlots(values: string[]) {
  const next = values.slice(0, 5);
  while (next.length < 5) {
    next.push("");
  }
  return next;
}

function serializeEmailSettings(emailSettings: EmailSettings) {
  return JSON.stringify({
    submissionEmailEnabled: emailSettings.submissionEmailEnabled,
    submissionNotificationEmails: normalizeEmailSlots(
      emailSettings.submissionNotificationEmails
    ).map((value) => value.trim().toLowerCase()),
  });
}

function serializeSecuritySettings(securitySettings: SecuritySettings) {
  return JSON.stringify({
    editPasswordEnabled: securitySettings.editPasswordEnabled,
    editPassword: securitySettings.editPassword,
  });
}

function buildInitialEmailSettings(apiValues?: {
  submission_email_enabled?: boolean;
  submission_notification_emails?: string[];
}) {
  const base = createEmptyEmailSettings();

  return {
    submissionEmailEnabled:
      typeof apiValues?.submission_email_enabled === "boolean"
        ? apiValues.submission_email_enabled
        : base.submissionEmailEnabled,
    submissionNotificationEmails: normalizeEmailSlots(
      Array.isArray(apiValues?.submission_notification_emails)
        ? apiValues?.submission_notification_emails
        : base.submissionNotificationEmails
    ),
  } satisfies EmailSettings;
}

function buildInitialSecuritySettings(apiValues?: {
  edit_password_enabled?: boolean;
}) {
  return {
    editPasswordEnabled:
      typeof apiValues?.edit_password_enabled === "boolean"
        ? apiValues.edit_password_enabled
        : false,
    editPassword: "",
  } satisfies SecuritySettings;
}

function buildEditorFields(overrides: ApiOverride[]) {
  const overridesMap = new Map(
    overrides.map((override) => [
      `${override.step_key}:${override.field_key}`,
      override,
    ])
  );

  return atabaqueTemplate.steps
    .filter((step) => step.fields.length > 0)
    .flatMap((step) =>
      step.fields.map((field, index) => {
        const override = overridesMap.get(`${step.key}:${field.key}`);

        return {
          stepKey: step.key,
          stepTitle: step.title,
          stepDescription: step.description,
          fieldKey: field.key,
          defaultLabel: field.label,
          defaultHelperText: field.helperText ?? "",
          labelValue:
            typeof override?.label_override === "string"
              ? override.label_override
              : field.label,
          helperTextValue:
            typeof override?.helper_text_override === "string"
              ? override.helper_text_override
              : field.helperText ?? "",
          isRequired:
            typeof override?.is_required === "boolean"
              ? override.is_required
              : Boolean(field.required),
          isVisible:
            typeof override?.is_visible === "boolean"
              ? override.is_visible
              : true,
          sortOrder:
            typeof override?.sort_order === "number"
              ? override.sort_order
              : index + 1,
        } satisfies EditorField;
      })
    );
}

function serializeFields(fields: EditorField[]) {
  return JSON.stringify(
    fields.map((field) => ({
      stepKey: field.stepKey,
      fieldKey: field.fieldKey,
      labelValue: field.labelValue,
      helperTextValue: field.helperTextValue,
      isRequired: field.isRequired,
      isVisible: field.isVisible,
      sortOrder: field.sortOrder,
    }))
  );
}

function serializeEditorState(
  fields: EditorField[],
  emailSettings: EmailSettings,
  securitySettings: SecuritySettings
) {
  return JSON.stringify({
    fields: JSON.parse(serializeFields(fields)),
    emailSettings: JSON.parse(serializeEmailSettings(emailSettings)),
    securitySettings: JSON.parse(serializeSecuritySettings(securitySettings)),
  });
}

function normalizeLabelOverride(field: EditorField) {
  const trimmed = field.labelValue.trim();

  if (!trimmed || trimmed === field.defaultLabel) {
    return null;
  }

  return trimmed;
}

function normalizeHelperOverride(field: EditorField) {
  if (field.helperTextValue === field.defaultHelperText) {
    return null;
  }

  return field.helperTextValue;
}

function updateFieldValue(
  fields: EditorField[],
  stepKey: FormStepKey,
  fieldKey: string,
  patch: Partial<EditorField>
) {
  return fields.map((field) =>
    field.stepKey === stepKey && field.fieldKey === fieldKey
      ? { ...field, ...patch }
      : field
  );
}

export default function FieldSettingsPage() {
  const [fields, setFields] = useState<EditorField[]>([]);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(
    createEmptyEmailSettings()
  );
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(
    createEmptySecuritySettings()
  );
  const [stats, setStats] = useState<WorkspaceStats>({
    submissions: 0,
    drafts: 0,
  });
  const [workspacePassword, setWorkspacePassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initialSnapshotRef = useRef("");

  function applyLoadedEditorState(data: FieldOverridesResponse, password = "") {
    const nextFields = buildEditorFields(data.overrides ?? []);
    const nextEmailSettings = buildInitialEmailSettings(data.email_settings);
    const nextSecuritySettings = buildInitialSecuritySettings(data.security);

    initialSnapshotRef.current = serializeEditorState(
      nextFields,
      nextEmailSettings,
      nextSecuritySettings
    );
    setFields(nextFields);
    setEmailSettings(nextEmailSettings);
    setSecuritySettings(nextSecuritySettings);
    setStats(data.stats ?? { submissions: 0, drafts: 0 });
    setIsLocked(false);

    if (typeof window !== "undefined") {
      if (password) {
        window.sessionStorage.setItem(
          WORKSPACE_EDIT_PASSWORD_STORAGE_KEY,
          password
        );
      } else {
        window.sessionStorage.removeItem(WORKSPACE_EDIT_PASSWORD_STORAGE_KEY);
      }
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadEditor(password = "") {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/workspaces/${WORKSPACE_SLUG}/field-overrides`,
          {
            cache: "no-store",
            headers: password
              ? {
                  "x-workspace-edit-password": password,
                }
              : undefined,
          }
        );

        const data = (await response.json()) as FieldOverridesResponse;

        if (response.status === 403 && data.code === "PASSWORD_REQUIRED") {
          if (!mounted) {
            return;
          }

          setIsLocked(true);
          setError(password ? "Senha incorreta para acessar o modo edit." : null);
          setIsLoading(false);
          return;
        }

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Nao foi possivel carregar os campos.");
        }

        if (!mounted) {
          return;
        }

        applyLoadedEditorState(data, password);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Nao foi possivel carregar os campos."
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    const storedPassword =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem(WORKSPACE_EDIT_PASSWORD_STORAGE_KEY) ?? ""
        : "";

    setWorkspacePassword(storedPassword);
    loadEditor(storedPassword);

    return () => {
      mounted = false;
    };
  }, []);

  const visibleFieldsCount = useMemo(
    () => fields.filter((field) => field.isVisible).length,
    [fields]
  );
  const requiredFieldsCount = useMemo(
    () => fields.filter((field) => field.isVisible && field.isRequired).length,
    [fields]
  );
  const activeNotificationEmailsCount = useMemo(
    () =>
      emailSettings.submissionNotificationEmails.filter((value) => value.trim())
        .length,
    [emailSettings]
  );
  const hasUnsavedChanges =
    fields.length > 0 &&
    serializeEditorState(fields, emailSettings, securitySettings) !==
      initialSnapshotRef.current;

  const groupedSteps = useMemo(() => {
    return atabaqueTemplate.steps
      .filter((step) => step.fields.length > 0)
      .map((step) => ({
        key: step.key,
        title: step.title,
        description: step.description,
        fields: fields
          .filter((field) => field.stepKey === step.key)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }));
  }, [fields]);
  const stepSummaries = useMemo<StepSummary[]>(
    () =>
      groupedSteps.map((step) => ({
        key: step.key,
        title: step.title,
        description: step.description,
        visibleCount: step.fields.filter((field) => field.isVisible).length,
        requiredCount: step.fields.filter(
          (field) => field.isVisible && field.isRequired
        ).length,
        totalCount: step.fields.length,
      })),
    [groupedSteps]
  );

  function updateField(
    stepKey: FormStepKey,
    fieldKey: string,
    patch: Partial<EditorField>
  ) {
    setFields((current) => updateFieldValue(current, stepKey, fieldKey, patch));
    setNotice(null);
  }

  function resetField(stepKey: FormStepKey, fieldKey: string) {
    const baseField = buildEditorFields([]).find(
      (field) => field.stepKey === stepKey && field.fieldKey === fieldKey
    );

    if (!baseField) {
      return;
    }

    setFields((current) =>
      updateFieldValue(current, stepKey, fieldKey, {
        labelValue: baseField.defaultLabel,
        helperTextValue: baseField.defaultHelperText,
        isRequired: baseField.isRequired,
        isVisible: true,
        sortOrder: baseField.sortOrder,
      })
    );
    setNotice(null);
  }

  function resetAllFields() {
    const defaults = buildEditorFields([]);
    setFields(defaults);
    setEmailSettings(createEmptyEmailSettings());
    setSecuritySettings((current) => ({
      ...current,
      editPassword: "",
    }));
    setNotice(null);
  }

  function updateNotificationEmail(index: number, value: string) {
    setEmailSettings((current) => {
      const next = [...current.submissionNotificationEmails];
      next[index] = value;

      return {
        ...current,
        submissionNotificationEmails: normalizeEmailSlots(next),
      };
    });
    setNotice(null);
  }

  function updateEmailSettings(patch: Partial<EmailSettings>) {
    setEmailSettings((current) => ({
      ...current,
      ...patch,
      submissionNotificationEmails: normalizeEmailSlots(
        patch.submissionNotificationEmails ?? current.submissionNotificationEmails
      ),
    }));
    setNotice(null);
  }

  function updateSecuritySettings(patch: Partial<SecuritySettings>) {
    setSecuritySettings((current) => ({
      ...current,
      ...patch,
    }));
    setNotice(null);
  }

  async function handleUnlock() {
    try {
      setIsUnlocking(true);
      setError(null);
      setNotice(null);

      const response = await fetch(
        `/api/workspaces/${WORKSPACE_SLUG}/field-overrides`,
        {
          cache: "no-store",
          headers: {
            "x-workspace-edit-password": workspacePassword.trim(),
          },
        }
      );

      const data = (await response.json()) as FieldOverridesResponse;

      if (response.status === 403 && data.code === "PASSWORD_REQUIRED") {
        throw new Error("Senha incorreta para acessar o modo edit.");
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Nao foi possivel desbloquear o workspace.");
      }

      applyLoadedEditorState(data, workspacePassword.trim());
    } catch (unlockError) {
      setError(
        unlockError instanceof Error
          ? unlockError.message
          : "Nao foi possivel desbloquear o workspace."
      );
    } finally {
      setIsUnlocking(false);
    }
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      setError(null);
      setNotice(null);

      const payload = {
        overrides: fields.map((field) => ({
          step_key: field.stepKey,
          field_key: field.fieldKey,
          label_override: normalizeLabelOverride(field),
          helper_text_override: normalizeHelperOverride(field),
          is_required: field.isRequired,
          is_visible: field.isVisible,
          sort_order: field.sortOrder,
        })),
        email_settings: {
          submission_email_enabled: emailSettings.submissionEmailEnabled,
          submission_notification_emails:
            emailSettings.submissionNotificationEmails,
        },
        security: {
          edit_password_enabled: securitySettings.editPasswordEnabled,
          edit_password: securitySettings.editPassword,
        },
      };

      const response = await fetch(
        `/api/workspaces/${WORKSPACE_SLUG}/field-overrides`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(workspacePassword.trim()
              ? {
                  "x-workspace-edit-password": workspacePassword.trim(),
                }
              : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      const data = (await response.json()) as {
        ok: boolean;
        code?: string;
        error?: string;
      };

      if (response.status === 403 && data.code === "PASSWORD_REQUIRED") {
        setIsLocked(true);
        throw new Error("Senha do workspace obrigatoria para salvar.");
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Nao foi possivel salvar as configuracoes.");
      }

      const nextSecuritySettings = {
        ...securitySettings,
        editPassword: "",
      };

      const activePassword =
        securitySettings.editPassword.trim() || workspacePassword.trim();

      if (nextSecuritySettings.editPasswordEnabled) {

        if (activePassword && typeof window !== "undefined") {
          window.sessionStorage.setItem(
            WORKSPACE_EDIT_PASSWORD_STORAGE_KEY,
            activePassword
          );
          setWorkspacePassword(activePassword);
        }
      } else if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(WORKSPACE_EDIT_PASSWORD_STORAGE_KEY);
        setWorkspacePassword("");
      }

      const refreshResponse = await fetch(
        `/api/workspaces/${WORKSPACE_SLUG}/field-overrides`,
        {
          cache: "no-store",
          headers: activePassword
            ? {
                "x-workspace-edit-password": activePassword,
              }
            : undefined,
        }
      );

      const refreshedData = (await refreshResponse.json()) as FieldOverridesResponse;

      if (!refreshResponse.ok || !refreshedData.ok) {
        throw new Error(
          refreshedData.error ||
            "As configuracoes foram salvas, mas nao foi possivel confirmar o estado atualizado."
        );
      }

      applyLoadedEditorState(refreshedData, activePassword);
      setSecuritySettings(nextSecuritySettings);
      setNotice(
        "Configuracoes salvas. O intake publico e os e-mails de resumo ja podem refletir essas mudancas."
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Nao foi possivel salvar as configuracoes."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!isLoading && isLocked) {
    return (
      <div className="grid gap-6">
        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[32px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-black/8 bg-[#F8F5EF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6F695F]">
                Modo edit
              </span>
              <span className="rounded-full border border-black/8 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8D867B]">
                Workspace Atabaque
              </span>
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-[#111111] md:text-5xl">
              Area protegida
              <span className="block text-[#6F695F]">por senha do workspace.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#605A52]">
              Digite a senha definida para a Atabaque para liberar a edicao dos
              campos, das notificacoes e das configuracoes do intake.
            </p>

            <div className="mt-8 max-w-md">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D867B]">
                Senha do workspace
              </label>
              <input
                type="password"
                value={workspacePassword}
                onChange={(event) => setWorkspacePassword(event.target.value)}
                placeholder="Digite a senha"
                className="mt-3 h-12 w-full rounded-2xl border border-black/10 bg-[#F8F5EF] px-4 text-sm text-[#111111] outline-none placeholder:text-[#9A9388] focus:border-black/20"
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleUnlock}
                disabled={isUnlocking || !workspacePassword.trim()}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#111111] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUnlocking ? "Desbloqueando..." : "Desbloquear modo edit"}
              </button>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="rounded-[32px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D867B]">
              Protecao
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-[#111111]">
              Workspace protegido para o cliente
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#605A52]">
              Essa camada extra protege o link privado de edicao da Atabaque e
              limita quem pode alterar o intake do cliente.
            </p>

            <div className="mt-6 grid gap-4">
              <div className="rounded-[24px] border border-black/8 bg-[#F8F5EF] p-5">
                <div className="text-sm font-semibold text-[#111111]">
                  O que esta protegido
                </div>
                <div className="mt-2 text-sm leading-7 text-[#605A52]">
                  Campos visiveis, obrigatoriedade, titulos, helper texts e
                  notificacoes do formulario.
                </div>
              </div>

              <div className="rounded-[24px] border border-black/8 bg-[#F8F5EF] p-5">
                <div className="text-sm font-semibold text-[#111111]">
                  Como o cliente acessa
                </div>
                <div className="mt-2 text-sm leading-7 text-[#605A52]">
                  Pelo link privado de edicao e, em seguida, pela senha do
                  workspace definida para a Atabaque.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[32px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-black/8 bg-[#F8F5EF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6F695F]">
              Modo edit
            </span>
            <span className="rounded-full border border-black/8 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8D867B]">
              Workspace Atabaque
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-[#111111] md:text-5xl">
            Edite o formulario
            <span className="block text-[#6F695F]">sem tocar no codigo.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-[#605A52]">
            Ajuste o formulario publico da Atabaque sem mexer em codigo:
            visibilidade, obrigatoriedade, titulos, helper text, senha do modo
            edit e e-mails de resumo. Esse link pode ser compartilhado apenas
            com a lideranca do cliente.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading || !hasUnsavedChanges}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#111111] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Salvando..." : "Salvar configuracoes"}
            </button>
            <button
              type="button"
              onClick={resetAllFields}
              disabled={isSaving || isLoading}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-black/10 bg-[#F8F5EF] px-5 text-sm font-medium text-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Restaurar padrao
            </button>
          </div>

          {notice ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="rounded-[32px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D867B]">
            Resumo rapido
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-[#111111]">
            Estado atual do intake
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <MetricCard
              value={String(stats.submissions)}
              label="submissoes registradas"
            />
            <MetricCard value={String(stats.drafts)} label="rascunhos salvos" />
            <MetricCard
              value={`${visibleFieldsCount}/${fields.length || 0}`}
              label="campos visiveis"
            />
            <MetricCard
              value={String(requiredFieldsCount)}
              label="campos obrigatorios visiveis"
            />
            <MetricCard
              value={String(activeNotificationEmailsCount)}
              label="emails extras de resumo"
            />
          </div>

          <div className="mt-4 rounded-[24px] border border-black/8 bg-[#F8F5EF] p-5 text-sm leading-7 text-[#605A52]">
            Esta area inclui os campos de Identificacao, Projeto, Faixas e
            Marketing. A etapa de Faixas pode ser editada aqui do mesmo jeito
            que as demais.
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="rounded-[32px] border border-black/8 bg-white px-7 py-7 text-sm text-[#605A52] shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
          Carregando configuracoes do workspace...
        </section>
      ) : null}

      {!isLoading ? (
        <section className="rounded-[32px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D867B]">
                Navegacao do editor
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-[#111111]">
                Edite por etapa do formulario
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#605A52]">
                Use os atalhos abaixo para pular direto para a etapa desejada.
                A secao Faixas fica disponivel aqui no mesmo painel.
              </p>
            </div>

            <div className="rounded-full border border-black/8 bg-[#F8F5EF] px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8D867B]">
              4 etapas editaveis
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-4">
            {stepSummaries.map((step) => (
              <a
                key={`summary-${step.key}`}
                href={`#step-${step.key}`}
                className="rounded-[24px] border border-black/8 bg-[#F8F5EF] p-5 transition hover:border-black/15 hover:bg-white"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D867B]">
                  {step.key === "tracks" ? "Secao principal" : "Etapa"}
                </div>
                <div className="mt-3 text-xl font-semibold text-[#111111]">
                  {step.title}
                </div>
                <div className="mt-3 text-sm leading-7 text-[#605A52]">
                  {step.key === "tracks"
                    ? "Campos da ficha tecnica, ordem, ISRC, arquivos e regras condicionais por faixa."
                    : step.description || "Configure os campos dessa etapa."}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-medium text-[#393733]">
                    {step.visibleCount}/{step.totalCount} visiveis
                  </span>
                  <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-medium text-[#393733]">
                    {step.requiredCount} obrigatorios
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {!isLoading ? (
        <section className="rounded-[32px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D867B]">
                Seguranca
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-[#111111]">
                Proteja o modo edit com senha
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#605A52]">
                Se ativado, o cliente precisa informar uma senha adicional para
                entrar na area de edicao do intake.
              </p>
            </div>

            <div className="rounded-full border border-black/8 bg-[#F8F5EF] px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8D867B]">
              Senha por workspace
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[340px_1fr]">
            <div className="rounded-[24px] border border-black/8 bg-[#F8F5EF] p-5">
              <ToggleCard
                title="Senha ativa"
                description="Exige uma senha adicional para liberar o modo edit do cliente."
                checked={securitySettings.editPasswordEnabled}
                onChange={(checked) =>
                  updateSecuritySettings({
                    editPasswordEnabled: checked,
                  })
                }
              />
            </div>

            <div className="rounded-[24px] border border-black/8 bg-[#F8F5EF] p-5">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D867B]">
                {securitySettings.editPasswordEnabled
                  ? "Definir nova senha"
                  : "Senha desativada"}
              </label>
              <input
                type="password"
                value={securitySettings.editPassword}
                onChange={(event) =>
                  updateSecuritySettings({
                    editPassword: event.target.value,
                  })
                }
                disabled={!securitySettings.editPasswordEnabled}
                placeholder="Digite uma nova senha para o workspace"
                className="mt-3 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-[#111111] outline-none placeholder:text-[#9A9388] focus:border-black/20 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="mt-3 text-xs leading-6 text-[#8D867B]">
                Se a senha ja estiver ativa e voce quiser manter a atual, deixe
                este campo vazio.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {!isLoading ? (
        <section className="rounded-[32px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D867B]">
                Notificacoes
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-[#111111]">
                Resumo da submissao para a equipe
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#605A52]">
                Defina ate 5 e-mails para receber o resumo do que foi submetido.
                O submitter continua recebendo o link de edicao normalmente.
              </p>
            </div>

            <div className="rounded-full border border-black/8 bg-[#F8F5EF] px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8D867B]">
              Ate 5 destinatarios extras
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[340px_1fr]">
            <div className="rounded-[24px] border border-black/8 bg-[#F8F5EF] p-5">
              <ToggleCard
                title="Resumo por e-mail ativo"
                description="Dispara um resumo da submissao para os e-mails abaixo e para o proprio submitter."
                checked={emailSettings.submissionEmailEnabled}
                onChange={(checked) =>
                  updateEmailSettings({
                    submissionEmailEnabled: checked,
                  })
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {normalizeEmailSlots(emailSettings.submissionNotificationEmails).map(
                (email, index) => (
                  <div key={`notification-email-${index}`}>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D867B]">
                      E-mail {index + 1}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) =>
                        updateNotificationEmail(index, event.target.value)
                      }
                      placeholder="labels@cliente.com"
                      className="mt-3 h-12 w-full rounded-2xl border border-black/10 bg-[#F8F5EF] px-4 text-sm text-[#111111] outline-none placeholder:text-[#9A9388] focus:border-black/20"
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      ) : null}

      {!isLoading &&
        groupedSteps.map((step) => (
          <section
            key={step.key}
            id={`step-${step.key}`}
            className="rounded-[32px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D867B]">
                  Etapa do intake
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-[#111111]">
                  {step.title}
                </h2>
                {step.description ? (
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#605A52]">
                    {step.key === "tracks"
                      ? "Aqui o cliente controla a ficha tecnica das faixas, incluindo nome dos campos, obrigatoriedade, visibilidade e orientacoes do preenchimento."
                      : step.description}
                  </p>
                ) : null}
              </div>

              <div className="rounded-full border border-black/8 bg-[#F8F5EF] px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8D867B]">
                {step.fields.filter((field) => field.isVisible).length} de{" "}
                {step.fields.length} visiveis
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {step.fields.map((field) => (
                <article
                  key={`${field.stepKey}:${field.fieldKey}`}
                  className="rounded-[24px] border border-black/8 bg-[#F8F5EF] p-5"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="text-lg font-semibold text-[#111111]">
                        {field.labelValue.trim() || field.defaultLabel}
                      </div>
                      <div className="mt-2 font-mono text-xs text-[#8D867B]">
                        {field.fieldKey}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => resetField(field.stepKey, field.fieldKey)}
                      className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm text-[#111111] hover:bg-[#F4F1EA]"
                    >
                      Restaurar campo
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1.2fr_290px]">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D867B]">
                        Titulo do campo
                      </label>
                      <input
                        value={field.labelValue}
                        onChange={(event) =>
                          updateField(field.stepKey, field.fieldKey, {
                            labelValue: event.target.value,
                          })
                        }
                        className="mt-3 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-[#111111] outline-none placeholder:text-[#9A9388] focus:border-black/20"
                      />
                      <p className="mt-2 text-xs leading-6 text-[#8D867B]">
                        Padrao: {field.defaultLabel}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D867B]">
                        Helper text
                      </label>
                      <textarea
                        value={field.helperTextValue}
                        onChange={(event) =>
                          updateField(field.stepKey, field.fieldKey, {
                            helperTextValue: event.target.value,
                          })
                        }
                        className="mt-3 min-h-[120px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm leading-7 text-[#111111] outline-none placeholder:text-[#9A9388] focus:border-black/20"
                      />
                      <p className="mt-2 text-xs leading-6 text-[#8D867B]">
                        Se quiser remover o helper, deixe este campo vazio.
                      </p>
                    </div>

                    <div className="grid gap-3 rounded-[24px] border border-black/8 bg-white p-4">
                      <ToggleCard
                        title="Campo visivel"
                        description="Mostra ou oculta no intake publico."
                        checked={field.isVisible}
                        onChange={(checked) =>
                          updateField(field.stepKey, field.fieldKey, {
                            isVisible: checked,
                          })
                        }
                      />
                      <ToggleCard
                        title="Campo obrigatorio"
                        description="Exige preenchimento para seguir."
                        checked={field.isRequired}
                        onChange={(checked) =>
                          updateField(field.stepKey, field.fieldKey, {
                            isRequired: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[24px] border border-black/8 bg-[#F8F5EF] p-5">
      <div className="text-3xl font-semibold text-[#111111]">{value}</div>
      <div className="mt-2 text-sm text-[#6F695F]">{label}</div>
    </div>
  );
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-[18px] border border-black/8 bg-white px-4 py-4">
      <div>
        <div className="text-sm font-semibold text-[#111111]">{title}</div>
        <div className="mt-1 text-xs leading-6 text-[#6F695F]">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-black/20 bg-transparent text-[#111111]"
      />
    </label>
  );
}
