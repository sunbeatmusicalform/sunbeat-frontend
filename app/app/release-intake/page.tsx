"use client";

import { useMemo, useState } from "react";
import {
  atabaqueTemplate,
  createInitialReleaseIntakeValues,
} from "@/lib/form-engine/atabaque-template";
import {
  buildSubmitPayload,
  canAddMoreTracks,
  getProgressPercent,
  validateAll,
  validateIdentification,
  validateMarketing,
  validateProject,
  validateTracks,
} from "@/lib/form-engine/submission-payload";
import { createEmptyTrack } from "@/lib/form-engine/track-types";
import type {
  FormStepKey,
  FormField,
  ReleaseIntakeFormValues,
  UploadedFileRef,
} from "@/lib/form-engine/types";
import type { TrackInput } from "@/lib/form-engine/track-types";

const STEP_ORDER: FormStepKey[] = [
  "intro",
  "identification",
  "project",
  "marketing",
  "review_submit",
];

const STEP_LABELS = [
  { key: "intro", label: "Intro" },
  { key: "identification", label: "Identificação" },
  { key: "project", label: "Projeto" },
  { key: "marketing", label: "Marketing" },
  { key: "review_submit", label: "Revisão" },
] as const;

export default function ReleaseIntakePage() {
  const template = atabaqueTemplate;

  const [currentStep, setCurrentStep] = useState<FormStepKey>("intro");
  const [values, setValues] = useState<ReleaseIntakeFormValues>(
    createInitialReleaseIntakeValues()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftToken, setDraftToken] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [saveDraftMessage, setSaveDraftMessage] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const releaseType = values.identification.release_type;
  const progressPercent = useMemo(() => getProgressPercent(values), [values]);

  function nextStep() {
    const nextIndex = Math.min(currentStepIndex + 1, STEP_ORDER.length - 1);
    setCurrentStep(STEP_ORDER[nextIndex]);
  }

  function prevStep() {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(STEP_ORDER[prevIndex]);
  }

  function clearMessages() {
    setSaveDraftMessage(null);
    setSubmitMessage(null);
    setSubmitError(null);
  }

  function setNestedValue(section: keyof ReleaseIntakeFormValues, key: string, value: any) {
    setValues((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  }

  function setIdentificationField(key: keyof ReleaseIntakeFormValues["identification"], value: string) {
    clearMessages();
    setNestedValue("identification", key, value);
    clearFieldError(`identification.${key}`);
  }

  function setProjectField(key: keyof ReleaseIntakeFormValues["project"], value: any) {
    clearMessages();
    setNestedValue("project", key, value);
    clearFieldError(`project.${key}`);
  }

  function setMarketingField(key: keyof ReleaseIntakeFormValues["marketing"], value: any) {
    clearMessages();
    setNestedValue("marketing", key, value);
    clearFieldError(`marketing.${key}`);
  }

  function clearFieldError(path: string) {
    setErrors((prev) => {
      if (!prev[path]) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }

  function handleFakeUpload(file: File | null): UploadedFileRef | null {
    if (!file) return null;

    return {
      file_id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `file-${Date.now()}`,
      file_name: file.name,
      storage_path: `mock/${file.name}`,
      public_url: "",
      mime_type: file.type,
      size_bytes: file.size,
    };
  }

  function handleProjectFile(
    key: "cover_file",
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null;
    const uploaded = handleFakeUpload(file);
    setProjectField(key, uploaded);
  }

  function handleMarketingFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const uploaded = files
      .map((file) => handleFakeUpload(file))
      .filter(Boolean) as UploadedFileRef[];
    setMarketingField("additional_files", uploaded);
  }

  function addTrack() {
    if (!canAddMoreTracks(releaseType, values.tracks.length)) return;

    clearMessages();
    setValues((prev) => ({
      ...prev,
      tracks: [...prev.tracks, createEmptyTrack(prev.tracks.length + 1)],
    }));
    clearFieldError("tracks");
  }

  function removeTrack(localId: string) {
    clearMessages();
    setValues((prev) => {
      const filtered = prev.tracks
        .filter((track) => track.local_id !== localId)
        .map((track, index) => ({
          ...track,
          order_number: index + 1,
          is_focus_track: track.is_focus_track,
        }));

      return {
        ...prev,
        tracks: filtered,
      };
    });
  }

  function updateTrack(localId: string, patch: Partial<TrackInput>) {
    clearMessages();
    setValues((prev) => ({
      ...prev,
      tracks: prev.tracks.map((track) =>
        track.local_id === localId ? { ...track, ...patch } : track
      ),
    }));
  }

  function setFocusTrack(localId: string) {
    clearMessages();
    setValues((prev) => ({
      ...prev,
      tracks: prev.tracks.map((track) => ({
        ...track,
        is_focus_track: track.local_id === localId,
      })),
    }));
  }

  function moveTrack(localId: string, direction: "up" | "down") {
    const index = values.tracks.findIndex((track) => track.local_id === localId);
    if (index < 0) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= values.tracks.length) return;

    const nextTracks = [...values.tracks];
    [nextTracks[index], nextTracks[targetIndex]] = [
      nextTracks[targetIndex],
      nextTracks[index],
    ];

    setValues((prev) => ({
      ...prev,
      tracks: nextTracks.map((track, idx) => ({
        ...track,
        order_number: idx + 1,
      })),
    }));
  }

  function handleTrackAudio(localId: string, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const uploaded = handleFakeUpload(file);
    updateTrack(localId, { audio_file: uploaded });
  }

  async function handleSaveDraft() {
    clearMessages();

    if (!values.identification.submitter_email.trim()) {
      setErrors((prev) => ({
        ...prev,
        "identification.submitter_email":
          "Informe o e-mail na etapa de identificação para salvar o rascunho.",
      }));
      setCurrentStep("identification");
      return;
    }

    if (!draftToken) {
      const generated =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `draft-${Date.now()}`;
      setDraftToken(generated);
    }

    setSaveDraftMessage(
      "Rascunho salvo. Na próxima etapa, conecte isso ao endpoint de draft e envio por email."
    );
  }

  function validateCurrentStep() {
    if (currentStep === "intro") return {};
    if (currentStep === "identification") return validateIdentification(values);
    if (currentStep === "project") {
      return {
        ...validateProject(values),
        ...validateTracks(values),
      };
    }
    if (currentStep === "marketing") return validateMarketing(values);
    return {};
  }

  function handleContinue() {
    clearMessages();
    const stepErrors = validateCurrentStep();

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});

    if (currentStep === "identification" && !draftToken) {
      const generated =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `draft-${Date.now()}`;
      setDraftToken(generated);
    }

    nextStep();
  }

  async function handleSubmit() {
    clearMessages();
    const validation = validateAll(values);

    if (Object.keys(validation).length > 0) {
      setErrors(validation);

      if (
        Object.keys(validation).some((key) => key.startsWith("identification."))
      ) {
        setCurrentStep("identification");
      } else if (
        Object.keys(validation).some(
          (key) => key.startsWith("project.") || key.startsWith("tracks")
        )
      ) {
        setCurrentStep("project");
      } else if (
        Object.keys(validation).some((key) => key.startsWith("marketing."))
      ) {
        setCurrentStep("marketing");
      }

      return;
    }

    setErrors({});
    setLoadingSubmit(true);

    try {
      const payload = buildSubmitPayload({
        draftToken,
        workspaceSlug: template.workspaceSlug,
        formVersion: template.version,
        values,
      });

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      let data: any = null;

      try {
        data = JSON.parse(raw);
      } catch {
        data = { raw };
      }

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || raw || "Falha no envio.");
      }

      setSubmitMessage(
        `Envio concluído com sucesso. ID: ${data?.submission_id ?? data?.id ?? "ok"}`
      );
    } catch (error: any) {
      setSubmitError(error?.message ?? "Falha ao enviar o formulário.");
    } finally {
      setLoadingSubmit(false);
    }
  }

  const currentStepMeta = template.steps.find((step) => step.key === currentStep);

  return (
    <div className="grid gap-6">
      <section className="glass-panel-strong premium-border rounded-[32px] p-7 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="sunbeat-badge">
              <span className="sunbeat-dot" />
              {template.intro.clientName}
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
              {template.intro.formTitle}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/62">
              {template.slogan}
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/20 px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
              Progresso
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {progressPercent}%
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-5">
          {STEP_LABELS.map((item, index) => {
            const active = item.key === currentStep;
            const completed = index < currentStepIndex;

            return (
              <div
                key={item.key}
                className={`rounded-[20px] border px-4 py-4 text-sm transition ${
                  active
                    ? "border-yellow-300/30 bg-yellow-300/10 text-yellow-100"
                    : completed
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 bg-white/[0.04] text-white/55"
                }`}
              >
                <div className="text-[11px] uppercase tracking-[0.16em] opacity-80">
                  Etapa {index + 1}
                </div>
                <div className="mt-1 font-medium">{item.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.78fr_0.22fr]">
        <div className="sunbeat-card rounded-[32px] p-7 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                {currentStepMeta?.title ?? "Etapa"}
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {currentStepMeta?.description ?? "Preencha com atenção."}
              </h2>
            </div>

            {draftToken ? (
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60">
                Draft ativo
              </div>
            ) : null}
          </div>

          {currentStep === "intro" && (
            <IntroStep
              title={template.intro.formTitle}
              text={template.intro.introText}
              clientName={template.intro.clientName}
            />
          )}

          {currentStep === "identification" && (
            <div className="grid gap-5">
              {currentStepMeta?.fields.map((field) => (
                <FormFieldRenderer
                  key={field.key}
                  field={field}
                  value={(values.identification as any)[field.key] ?? ""}
                  error={errors[`identification.${field.key}`]}
                  onChange={(value) =>
                    setIdentificationField(
                      field.key as keyof ReleaseIntakeFormValues["identification"],
                      value
                    )
                  }
                />
              ))}
            </div>
          )}

          {currentStep === "project" && (
            <div className="grid gap-8">
              <div>
                <div className="mb-4 text-lg font-semibold text-white">
                  Detalhes do projeto
                </div>
                <div className="grid gap-5">
                  {currentStepMeta?.fields.map((field) => {
                    if (field.key === "cover_file") {
                      return (
                        <FileField
                          key={field.key}
                          label={field.label}
                          helperText={field.helperText}
                          error={errors[`project.${field.key}`]}
                          fileName={values.project.cover_file?.file_name ?? ""}
                          onChange={(event) => handleProjectFile("cover_file", event)}
                        />
                      );
                    }

                    return (
                      <FormFieldRenderer
                        key={field.key}
                        field={field}
                        value={(values.project as any)[field.key] ?? ""}
                        error={errors[`project.${field.key}`]}
                        onChange={(value) =>
                          setProjectField(
                            field.key as keyof ReleaseIntakeFormValues["project"],
                            value
                          )
                        }
                      />
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-white">Faixas</div>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-white/58">
                      Adicione as faixas do projeto, defina a ordem e marque a faixa foco.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addTrack}
                    disabled={!canAddMoreTracks(releaseType, values.tracks.length)}
                    className="sunbeat-button sunbeat-button-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Adicionar faixa
                  </button>
                </div>

                {errors["tracks"] ? (
                  <div className="mt-4 rounded-[18px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errors["tracks"]}
                  </div>
                ) : null}

                <div className="mt-6 grid gap-5">
                  {values.tracks.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-8 text-sm text-white/48">
                      Nenhuma faixa adicionada ainda.
                    </div>
                  ) : (
                    values.tracks.map((track, index) => (
                      <TrackCard
                        key={track.local_id}
                        track={track}
                        index={index}
                        errors={errors}
                        canMoveUp={index > 0}
                        canMoveDown={index < values.tracks.length - 1}
                        onRemove={() => removeTrack(track.local_id)}
                        onMoveUp={() => moveTrack(track.local_id, "up")}
                        onMoveDown={() => moveTrack(track.local_id, "down")}
                        onSetFocus={() => setFocusTrack(track.local_id)}
                        onChange={(patch) => updateTrack(track.local_id, patch)}
                        onAudioChange={(event) => handleTrackAudio(track.local_id, event)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === "marketing" && (
            <div className="grid gap-5">
              {currentStepMeta?.fields.map((field) => {
                if (field.key === "additional_files") {
                  return (
                    <FileField
                      key={field.key}
                      label={field.label}
                      helperText={field.helperText}
                      error={errors[`marketing.${field.key}`]}
                      fileName={
                        values.marketing.additional_files.length > 0
                          ? `${values.marketing.additional_files.length} arquivo(s) selecionado(s)`
                          : ""
                      }
                      multiple
                      onChange={handleMarketingFiles}
                    />
                  );
                }

                return (
                  <FormFieldRenderer
                    key={field.key}
                    field={field}
                    value={(values.marketing as any)[field.key] ?? ""}
                    error={errors[`marketing.${field.key}`]}
                    onChange={(value) =>
                      setMarketingField(
                        field.key as keyof ReleaseIntakeFormValues["marketing"],
                        value
                      )
                    }
                  />
                );
              })}
            </div>
          )}

          {currentStep === "review_submit" && (
            <ReviewStep values={values} />
          )}

          {saveDraftMessage ? (
            <div className="mt-6 rounded-[18px] border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm text-blue-100">
              {saveDraftMessage}
            </div>
          ) : null}

          {submitMessage ? (
            <div className="mt-6 rounded-[18px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {submitMessage}
            </div>
          ) : null}

          {submitError ? (
            <div className="mt-6 rounded-[18px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {submitError}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === "intro"}
                className="sunbeat-button sunbeat-button-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Voltar
              </button>

              {currentStep !== "intro" ? (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="sunbeat-button rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/8"
                >
                  Salvar rascunho
                </button>
              ) : null}
            </div>

            {currentStep !== "review_submit" ? (
              <button
                type="button"
                onClick={handleContinue}
                className="sunbeat-button sunbeat-button-primary"
              >
                {currentStep === "intro" ? "Começar" : "Continuar"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loadingSubmit}
                className="sunbeat-button sunbeat-button-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingSubmit ? "Enviando..." : "Enviar formulário"}
              </button>
            )}
          </div>
        </div>

        <aside className="grid gap-6">
          <div className="sunbeat-card rounded-[32px] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              Resumo
            </div>
            <div className="mt-4 grid gap-4 text-sm">
              <SummaryItem label="Projeto" value={values.identification.project_title || "-"} />
              <SummaryItem
                label="Tipo"
                value={values.identification.release_type || "-"}
              />
              <SummaryItem
                label="Responsável"
                value={values.identification.submitter_name || "-"}
              />
              <SummaryItem
                label="Faixas"
                value={String(values.tracks.length)}
              />
            </div>
          </div>

          <div className="glass-panel rounded-[32px] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              Orientação
            </div>
            <p className="mt-3 text-sm leading-7 text-white/58">
              Esta V1 já está estruturada para draft, revisão final e envio ao backend.
              O próximo passo será ligar upload real, autosave remoto e email de edição.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function IntroStep({
  title,
  text,
  clientName,
}: {
  title: string;
  text: string;
  clientName: string;
}) {
  return (
    <div className="grid gap-6">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 md:p-8">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
          Apresentação
        </div>
        <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          {title}
        </h3>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-white/62">{text}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          "Preencha com calma",
          "Salve seu rascunho",
          "Revise antes do envio",
        ].map((item) => (
          <div
            key={item}
            className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-white/78"
          >
            {item}
          </div>
        ))}
      </div>

      <div className="rounded-[24px] border border-yellow-300/20 bg-yellow-300/8 p-5 text-sm leading-7 text-yellow-100/85">
        Você está preenchendo o intake de {clientName}. Na próxima etapa será criado o
        rascunho do envio a partir das informações de identificação.
      </div>
    </div>
  );
}

function FormFieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/88">
        {field.label}
        {field.required ? <span className="ml-1 text-yellow-300">*</span> : null}
      </label>

      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="min-h-[140px] w-full rounded-[20px] border border-white/10 bg-[#0a1020] px-4 py-3 text-white outline-none transition focus:border-yellow-400/40 focus:ring-4 focus:ring-yellow-400/12"
        />
      ) : field.type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-13 w-full rounded-[20px] border border-white/10 bg-[#0a1020] px-4 py-3 text-white outline-none transition focus:border-yellow-400/40 focus:ring-4 focus:ring-yellow-400/12"
        >
          <option value="">Selecione</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === "file" ? "text" : field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="h-13 w-full rounded-[20px] border border-white/10 bg-[#0a1020] px-4 py-3 text-white outline-none transition focus:border-yellow-400/40 focus:ring-4 focus:ring-yellow-400/12"
        />
      )}

      {field.helperText ? (
        <p className="mt-2 text-sm leading-7 text-white/50">{field.helperText}</p>
      ) : null}

      {error ? (
        <div className="mt-2 rounded-[16px] border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function FileField({
  label,
  helperText,
  fileName,
  error,
  onChange,
  multiple = false,
}: {
  label: string;
  helperText?: string;
  fileName?: string;
  error?: string;
  multiple?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/88">{label}</label>
      <label className="flex min-h-[86px] cursor-pointer items-center justify-center rounded-[20px] border border-dashed border-white/15 bg-[#0a1020] px-4 py-4 text-center text-sm text-white/60 transition hover:border-yellow-300/30">
        <input type="file" multiple={multiple} className="hidden" onChange={onChange} />
        {fileName ? fileName : "Clique para selecionar arquivo"}
      </label>

      {helperText ? (
        <p className="mt-2 text-sm leading-7 text-white/50">{helperText}</p>
      ) : null}

      {error ? (
        <div className="mt-2 rounded-[16px] border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function TrackCard({
  track,
  index,
  errors,
  canMoveUp,
  canMoveDown,
  onRemove,
  onMoveUp,
  onMoveDown,
  onSetFocus,
  onChange,
  onAudioChange,
}: {
  track: TrackInput;
  index: number;
  errors: Record<string, string>;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetFocus: () => void;
  onChange: (patch: Partial<TrackInput>) => void;
  onAudioChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const prefix = `tracks.${index}`;

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-white/40">
            Faixa {track.order_number}
          </div>
          <div className="mt-1 text-lg font-semibold text-white">
            {track.title || "Nova faixa"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="sunbeat-button rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="sunbeat-button rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onSetFocus}
            className={`sunbeat-button rounded-2xl px-4 py-2 ${
              track.is_focus_track
                ? "border border-yellow-300/20 bg-yellow-300/12 text-yellow-100"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/8"
            }`}
          >
            Faixa foco
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="sunbeat-button rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-red-200 hover:bg-red-500/15"
          >
            Remover
          </button>
        </div>
      </div>

      <div className="grid gap-5">
        <TrackInputField
          label="Título da faixa"
          value={track.title}
          error={errors[`${prefix}.title`]}
          helperText="Use o título exato da música."
          onChange={(value) => onChange({ title: value })}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <TrackInputField
            label="Artistas principais"
            value={track.primary_artists}
            error={errors[`${prefix}.primary_artists`]}
            helperText="Indique os artistas cujos perfis serão associados à música como artistas principais."
            onChange={(value) => onChange({ primary_artists: value })}
          />
          <TrackInputField
            label="Participações (feat)"
            value={track.featured_artists}
            helperText="Separe por vírgula se houver múltiplas participações."
            onChange={(value) => onChange({ featured_artists: value })}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <TrackInputField
            label="Intérpretes"
            value={track.interpreters}
            error={errors[`${prefix}.interpreters`]}
            helperText="Créditos e cadastro do ISRC."
            onChange={(value) => onChange({ interpreters: value })}
          />
          <TrackInputField
            label="Autores"
            value={track.authors}
            error={errors[`${prefix}.authors`]}
            helperText="Separe por vírgula caso tenha mais de um autor."
            onChange={(value) => onChange({ authors: value })}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <TrackInputField
            label="Editoras"
            value={track.publishers}
            onChange={(value) => onChange({ publishers: value })}
          />
          <TrackInputField
            label="Produtores / Músicos"
            value={track.producers_musicians}
            onChange={(value) => onChange({ producers_musicians: value })}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <TrackSelectField
            label="Perfis dos artistas"
            value={track.artist_profiles_status}
            error={errors[`${prefix}.artist_profiles_status`]}
            options={[
              { label: "Selecione", value: "" },
              { label: "Já existem", value: "already_exists" },
              { label: "Precisam ser criados", value: "needs_creation" },
              { label: "Misto", value: "mixed" },
            ]}
            onChange={(value) =>
              onChange({ artist_profiles_status: value as TrackInput["artist_profiles_status"] })
            }
          />
          <TrackSelectField
            label="A música já tem ISRC?"
            value={track.has_isrc}
            error={errors[`${prefix}.has_isrc`]}
            options={[
              { label: "Selecione", value: "" },
              { label: "Sim", value: "yes" },
              { label: "Não", value: "no" },
            ]}
            onChange={(value) => onChange({ has_isrc: value as TrackInput["has_isrc"] })}
          />
          <TrackSelectField
            label="Conteúdo explícito?"
            value={track.explicit_content}
            error={errors[`${prefix}.explicit_content`]}
            options={[
              { label: "Selecione", value: "" },
              { label: "Sim", value: "yes" },
              { label: "Não", value: "no" },
            ]}
            onChange={(value) =>
              onChange({ explicit_content: value as TrackInput["explicit_content"] })
            }
          />
        </div>

        {track.has_isrc === "yes" ? (
          <TrackInputField
            label="Código ISRC"
            value={track.isrc_code}
            error={errors[`${prefix}.isrc_code`]}
            onChange={(value) => onChange({ isrc_code: value })}
          />
        ) : null}

        <FileField
          label="Áudio WAV da faixa"
          fileName={track.audio_file?.file_name ?? ""}
          onChange={onAudioChange}
        />

        <TrackTextareaField
          label="Letra da música"
          value={track.lyrics}
          onChange={(value) => onChange({ lyrics: value })}
        />
      </div>
    </div>
  );
}

function TrackInputField({
  label,
  value,
  helperText,
  error,
  onChange,
}: {
  label: string;
  value: string;
  helperText?: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/88">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-13 w-full rounded-[18px] border border-white/10 bg-[#0a1020] px-4 py-3 text-white outline-none transition focus:border-yellow-400/40 focus:ring-4 focus:ring-yellow-400/12"
      />
      {helperText ? <p className="mt-2 text-sm text-white/50">{helperText}</p> : null}
      {error ? (
        <div className="mt-2 rounded-[14px] border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function TrackTextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/88">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[120px] w-full rounded-[18px] border border-white/10 bg-[#0a1020] px-4 py-3 text-white outline-none transition focus:border-yellow-400/40 focus:ring-4 focus:ring-yellow-400/12"
      />
    </div>
  );
}

function TrackSelectField({
  label,
  value,
  options,
  error,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/88">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-13 w-full rounded-[18px] border border-white/10 bg-[#0a1020] px-4 py-3 text-white outline-none transition focus:border-yellow-400/40 focus:ring-4 focus:ring-yellow-400/12"
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <div className="mt-2 rounded-[14px] border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function ReviewStep({ values }: { values: ReleaseIntakeFormValues }) {
  return (
    <div className="grid gap-5">
      <ReviewSection title="Identificação">
        <ReviewItem label="Nome" value={values.identification.submitter_name} />
        <ReviewItem label="E-mail" value={values.identification.submitter_email} />
        <ReviewItem label="Projeto" value={values.identification.project_title} />
        <ReviewItem label="Tipo" value={values.identification.release_type} />
      </ReviewSection>

      <ReviewSection title="Projeto">
        <ReviewItem label="Data de lançamento" value={values.project.release_date} />
        <ReviewItem label="Gênero" value={values.project.genre} />
        <ReviewItem label="Explícito" value={values.project.explicit_content} />
        <ReviewItem label="TikTok" value={values.project.tiktok_snippet} />
        <ReviewItem label="Presskit" value={values.project.presskit_link} />
        <ReviewItem label="Vídeo" value={values.project.has_video_asset} />
        <ReviewItem
          label="Capa"
          value={values.project.cover_file?.file_name ?? "-"}
        />
      </ReviewSection>

      <ReviewSection title="Faixas">
        {values.tracks.length === 0 ? (
          <div className="text-sm text-white/55">Nenhuma faixa adicionada.</div>
        ) : (
          <div className="grid gap-3">
            {values.tracks.map((track) => (
              <div
                key={track.local_id}
                className="rounded-[18px] border border-white/10 bg-black/20 p-4"
              >
                <div className="text-sm font-semibold text-white">
                  {track.order_number}. {track.title || "Sem título"}
                  {track.is_focus_track ? " · faixa foco" : ""}
                </div>
                <div className="mt-2 text-sm leading-7 text-white/58">
                  Artistas principais: {track.primary_artists || "-"}
                </div>
                <div className="text-sm leading-7 text-white/58">
                  Intérpretes: {track.interpreters || "-"}
                </div>
                <div className="text-sm leading-7 text-white/58">
                  Autores: {track.authors || "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </ReviewSection>

      <ReviewSection title="Marketing">
        <ReviewItem
          label="Números e fatos"
          value={values.marketing.marketing_numbers}
        />
        <ReviewItem
          label="Foco"
          value={values.marketing.marketing_focus}
        />
        <ReviewItem
          label="Objetivos"
          value={values.marketing.marketing_objectives}
        />
        <ReviewItem
          label="Verba"
          value={values.marketing.marketing_budget}
        />
        <ReviewItem
          label="Faixa foco"
          value={values.marketing.focus_track_name}
        />
        <ReviewItem
          label="Flexibilidade de data"
          value={values.marketing.date_flexibility}
        />
        <ReviewItem
          label="Participações especiais"
          value={values.marketing.has_special_guests}
        />
        <ReviewItem
          label="Participantes da promoção"
          value={values.marketing.promotion_participants}
        />
      </ReviewSection>
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
      <div className="mb-4 text-lg font-semibold text-white">{title}</div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="text-xs uppercase tracking-[0.14em] text-white/38">{label}</div>
      <div className="mt-2 text-sm leading-7 text-white/80">{value || "-"}</div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.14em] text-white/38">{label}</div>
      <div className="mt-1 text-sm font-medium text-white/88">{value}</div>
    </div>
  );
}