"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { atabaqueTemplate } from "@/lib/form-engine/atabaque-template";
import type { FormStepKey } from "@/lib/form-engine/types";

const WORKSPACE_SLUG = "atabaque";

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
  const [stats, setStats] = useState<WorkspaceStats>({
    submissions: 0,
    drafts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initialSnapshotRef = useRef("");

  useEffect(() => {
    let mounted = true;

    async function loadEditor() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/workspaces/${WORKSPACE_SLUG}/field-overrides`,
          {
            cache: "no-store",
          }
        );

        const data = (await response.json()) as {
          ok: boolean;
          overrides?: ApiOverride[];
          stats?: WorkspaceStats;
          error?: string;
        };

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Nao foi possivel carregar os campos.");
        }

        if (!mounted) {
          return;
        }

        const nextFields = buildEditorFields(data.overrides ?? []);
        initialSnapshotRef.current = serializeFields(nextFields);
        setFields(nextFields);
        setStats(data.stats ?? { submissions: 0, drafts: 0 });
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

    loadEditor();

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
  const hasUnsavedChanges =
    fields.length > 0 &&
    serializeFields(fields) !== initialSnapshotRef.current;

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
    initialSnapshotRef.current = initialSnapshotRef.current || serializeFields(defaults);
    setFields(defaults);
    setNotice(null);
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
      };

      const response = await fetch(
        `/api/workspaces/${WORKSPACE_SLUG}/field-overrides`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Nao foi possivel salvar as configuracoes.");
      }

      initialSnapshotRef.current = serializeFields(fields);
      setNotice("Configuracoes salvas. O intake publico ja pode refletir essas mudancas.");
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

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="sunbeat-badge">
              <span className="sunbeat-dot" />
              Modo edit
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/50">
              Workspace: Atabaque
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
            Edite os campos do intake
            <span className="block text-white/65">sem tocar no codigo.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-white/62">
            Aqui o cliente pode ocultar campos, definir obrigatoriedade e ajustar
            titulos e helper text do formulario publico. Esta primeira versao cobre
            Identificacao, Projeto e Marketing.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading || !hasUnsavedChanges}
              className="sunbeat-button sunbeat-button-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Salvando..." : "Salvar configuracoes"}
            </button>
            <button
              type="button"
              onClick={resetAllFields}
              disabled={isSaving || isLoading}
              className="sunbeat-button sunbeat-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Restaurar padrao
            </button>
          </div>

          {notice ? (
            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {notice}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-black/20 p-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Resumo rapido
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            O que o cliente controla agora
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
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
          </div>

          <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-white/62">
            Os campos da etapa de faixas continuam em um editor dedicado por
            enquanto. Nesta V1, o cliente ja consegue ajustar o fluxo principal
            do formulario publico com seguranca.
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 text-sm text-white/60">
          Carregando configuracoes do workspace...
        </section>
      ) : null}

      {!isLoading &&
        groupedSteps.map((step) => (
          <section
            key={step.key}
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  Etapa do intake
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  {step.title}
                </h2>
                {step.description ? (
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">
                    {step.description}
                  </p>
                ) : null}
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-white/55">
                {step.fields.filter((field) => field.isVisible).length} de{" "}
                {step.fields.length} visiveis
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {step.fields.map((field) => (
                <article
                  key={`${field.stepKey}:${field.fieldKey}`}
                  className="rounded-[24px] border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="text-lg font-semibold text-white">
                        {field.labelValue.trim() || field.defaultLabel}
                      </div>
                      <div className="mt-2 font-mono text-xs text-white/35">
                        {field.fieldKey}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => resetField(field.stepKey, field.fieldKey)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/72 hover:bg-white/10"
                    >
                      Restaurar campo
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1.2fr_290px]">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                        Titulo do campo
                      </label>
                      <input
                        value={field.labelValue}
                        onChange={(event) =>
                          updateField(field.stepKey, field.fieldKey, {
                            labelValue: event.target.value,
                          })
                        }
                        className="mt-3 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
                      />
                      <p className="mt-2 text-xs leading-6 text-white/38">
                        Padrao: {field.defaultLabel}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                        Helper text
                      </label>
                      <textarea
                        value={field.helperTextValue}
                        onChange={(event) =>
                          updateField(field.stepKey, field.fieldKey, {
                            helperTextValue: event.target.value,
                          })
                        }
                        className="mt-3 min-h-[120px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-white/25 focus:border-white/20"
                      />
                      <p className="mt-2 text-xs leading-6 text-white/38">
                        Se quiser remover o helper, deixe este campo vazio.
                      </p>
                    </div>

                    <div className="grid gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
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
    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
      <div className="text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-white/55">{label}</div>
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
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-[18px] border border-white/10 bg-black/20 px-4 py-4">
      <div>
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="mt-1 text-xs leading-6 text-white/48">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-white"
      />
    </label>
  );
}
