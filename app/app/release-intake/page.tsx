"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  atabaqueTemplate,
  createInitialReleaseIntakeValues,
} from "@/lib/form-engine/atabaque-template";
import {
  buildDraftPayload,
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
  FormField,
  FormStepKey,
  ReleaseIntakeFormValues,
  UploadedFileRef,
} from "@/lib/form-engine/types";
import type { TrackInput } from "@/lib/form-engine/track-types";

const STEP_ORDER: FormStepKey[] = [
  "intro",
  "identification",
  "release",
  "tracks",
  "marketing",
  "review_submit",
];

const STEP_LABELS: Array<{ key: FormStepKey; label: string }> = [
  { key: "intro", label: "Intro" },
  { key: "identification", label: "Identification" },
  { key: "release", label: "Release" },
  { key: "tracks", label: "Tracks" },
  { key: "marketing", label: "Marketing" },
  { key: "review_submit", label: "Review" },
];

type AutosaveState = "idle" | "saving" | "saved" | "error";

export default function ReleaseIntakePage() {
  const template = atabaqueTemplate;
  const searchParams = useSearchParams();
  const resumeToken = searchParams.get("draft");

  const [currentStep, setCurrentStep] = useState<FormStepKey>("intro");
  const [values, setValues] = useState<ReleaseIntakeFormValues>(
    createInitialReleaseIntakeValues()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftToken, setDraftToken] = useState<string | null>(resumeToken);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [autosaveMessage, setAutosaveMessage] = useState<string | null>(null);
  const [isHydratingDraft, setIsHydratingDraft] = useState(false);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const releaseType = values.identification.release_type;
  const currentStepMeta = template.steps.find((step) => step.key === currentStep);
  const progressPercent = useMemo(() => getProgressPercent(values), [values]);

  const activeTrack =
    values.tracks.find((track) => track.local_id === activeTrackId) ??
    values.tracks[0] ??
    null;

  const didHydrateDraftRef = useRef(false);

  function clearMessages() {
    setSubmitMessage(null);
    setSubmitError(null);
  }

  function clearFieldError(path: string) {
    setErrors((prev) => {
      if (!prev[path]) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }

  function setNestedValue(section: keyof ReleaseIntakeFormValues, key: string, value: unknown) {
    setValues((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  }

  function setIdentificationField(
    key: keyof ReleaseIntakeFormValues["identification"],
    value: string
  ) {
    clearMessages();
    setNestedValue("identification", key, value);
    clearFieldError(`identification.${key}`);
  }

  function setProjectField(key: keyof ReleaseIntakeFormValues["project"], value: unknown) {
    clearMessages();
    setNestedValue("project", key, value);
    clearFieldError(`project.${key}`);
  }

  function setMarketingField(key: keyof ReleaseIntakeFormValues["marketing"], value: unknown) {
    clearMessages();
    setNestedValue("marketing", key, value);
    clearFieldError(`marketing.${key}`);
  }

  function nextStep() {
    const nextIndex = Math.min(currentStepIndex + 1, STEP_ORDER.length - 1);
    setCurrentStep(STEP_ORDER[nextIndex]);
  }

  function prevStep() {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(STEP_ORDER[prevIndex]);
  }

  function ensureDraftToken() {
    if (draftToken) return draftToken;

    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `draft-${Date.now()}`;

    setDraftToken(generated);
    return generated;
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

  function handleProjectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setProjectField("cover_file", handleFakeUpload(file));
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

    const newTrack = createEmptyTrack(values.tracks.length + 1);

    setValues((prev) => ({
      ...prev,
      tracks: [...prev.tracks, newTrack],
    }));

    setActiveTrackId(newTrack.local_id);
    clearFieldError("tracks");
  }

  function removeTrack(localId: string) {
    setValues((prev) => {
      const nextTracks = prev.tracks
        .filter((track) => track.local_id !== localId)
        .map((track, index) => ({
          ...track,
          order_number: index + 1,
        }));

      if (nextTracks.length > 0 && !nextTracks.some((track) => track.is_focus_track)) {
        nextTracks[0] = { ...nextTracks[0], is_focus_track: true };
      }

      return {
        ...prev,
        tracks: nextTracks,
      };
    });

    if (activeTrackId === localId) {
      const fallback = values.tracks.find((track) => track.local_id !== localId);
      setActiveTrackId(fallback?.local_id ?? null);
    }
  }

  function updateTrack(localId: string, patch: Partial<TrackInput>) {
    setValues((prev) => ({
      ...prev,
      tracks: prev.tracks.map((track) =>
        track.local_id === localId ? { ...track, ...patch } : track
      ),
    }));
  }

  function setFocusTrack(localId: string) {
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
    [nextTracks[index], nextTracks[targetIndex]] = [nextTracks[targetIndex], nextTracks[index]];

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
    updateTrack(localId, { audio_file: handleFakeUpload(file) });
  }

  async function loadDraft(token: string) {
    setIsHydratingDraft(true);
    try {
      const response = await fetch(`/api/release-drafts/${token}`, {
        method: "GET",
        cache: "no-store",
      });

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : null;

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || "Falha ao carregar draft.");
      }

      if (data?.values) {
        setValues(data.values);
      }
      if (data?.current_step) {
        setCurrentStep(data.current_step);
      }
      if (data?.draft_token) {
        setDraftToken(data.draft_token);
      }
      if (data?.values?.tracks?.length) {
        setActiveTrackId(data.values.tracks[0].local_id);
      }
      setAutosaveMessage("Draft carregado.");
      setAutosaveState("saved");
    } catch (error: any) {
      setAutosaveState("error");
      setAutosaveMessage(error?.message ?? "Não foi possível carregar o draft.");
    } finally {
      setIsHydratingDraft(false);
    }
  }

  useEffect(() => {
    if (!resumeToken || didHydrateDraftRef.current) return;
    didHydrateDraftRef.current = true;
    loadDraft(resumeToken);
  }, [resumeToken]);

  useEffect(() => {
    if (!draftToken) return;
    if (!values.identification.submitter_email.trim()) return;
    if (isHydratingDraft) return;

    const timeout = setTimeout(async () => {
      try {
        setAutosaveState("saving");
        setAutosaveMessage("Salvando rascunho...");

        const payload = buildDraftPayload({
          draftToken,
          workspaceSlug: template.workspaceSlug,
          formVersion: template.version,
          currentStep,
          values,
        });

        const response = await fetch("/api/release-drafts/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const raw = await response.text();
        const data = raw ? JSON.parse(raw) : null;

        if (!response.ok) {
          throw new Error(data?.detail || data?.message || "Falha ao salvar draft.");
        }

        if (data?.draft_token && data.draft_token !== draftToken) {
          setDraftToken(data.draft_token);
        }

        setAutosaveState("saved");
        setAutosaveMessage("Draft salvo automaticamente.");
      } catch (error: any) {
        setAutosaveState("error");
        setAutosaveMessage(error?.message ?? "Falha no autosave.");
      }
    }, 900);

    return () => clearTimeout(timeout);
  }, [draftToken, values, currentStep, template.workspaceSlug, template.version, isHydratingDraft]);

  function validateCurrentStep() {
    if (currentStep === "intro") return {};
    if (currentStep === "identification") return validateIdentification(values);
    if (currentStep === "release") return validateProject(values);
    if (currentStep === "tracks") return validateTracks(values);
    if (currentStep === "marketing") return validateMarketing(values);
    return {};
  }

  function handleContinue() {
    const stepErrors = validateCurrentStep();

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});

    if (currentStep === "identification") {
      ensureDraftToken();
    }

    if (currentStep === "tracks" && values.tracks.length > 0 && !activeTrackId) {
      setActiveTrackId(values.tracks[0].local_id);
    }

    nextStep();
  }

  async function handleSubmit() {
    clearMessages();

    const validation = validateAll(values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);

      if (Object.keys(validation).some((key) => key.startsWith("identification."))) {
        setCurrentStep("identification");
      } else if (Object.keys(validation).some((key) => key.startsWith("project."))) {
        setCurrentStep("release");
      } else if (Object.keys(validation).some((key) => key.startsWith("tracks"))) {
        setCurrentStep("tracks");
      } else if (Object.keys(validation).some((key) => key.startsWith("marketing."))) {
        setCurrentStep("marketing");
      }

      return;
    }

    setErrors({});
    setLoadingSubmit(true);

    try {
      const payload = buildSubmitPayload({
        draftToken: ensureDraftToken(),
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
      const data = raw ? JSON.parse(raw) : null;

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || "Falha no envio.");
      }

      setSubmitMessage(
        `Release submitted successfully. ID: ${data?.submission_id ?? data?.id ?? "ok"}`
      );
      setAutosaveMessage(null);
      setAutosaveState("idle");
    } catch (error: any) {
      setSubmitError(error?.message ?? "Falha ao enviar o formulário.");
    } finally {
      setLoadingSubmit(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="glass-panel-strong premium-border rounded-[32px] p-7 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <div className="sunbeat-badge">
              <span className="sunbeat-dot" />
              {template.intro.clientName}
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-white md:text-6xl">
              {template.intro.formTitle}
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-white/60">
              Prepare and submit your next release.
            </p>
          </div>

          <div className="min-w-[220px] rounded-[24px] border border-white/10 bg-black/25 px-5 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/38">
              Draft status
            </div>
            <div className="mt-2 text-sm text-white/88">
              {autosaveState === "saving" && "Saving..."}
              {autosaveState === "saved" && "Saved"}
              {autosaveState === "error" && "Error"}
              {autosaveState === "idle" && "Not started"}
            </div>
            <div className="mt-2 text-xs text-white/50">
              {autosaveMessage || "Draft starts after identification."}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-6">
          {STEP_LABELS.map((item, index) => {
            const active = item.key === currentStep;
            const completed = index < currentStepIndex;

            return (
              <div
                key={item.key}
                className={`rounded-[20px] border px-4 py-4 text-sm transition ${
                  active
                    ? "border-[#F3F0A1]/40 bg-[#F3F0A1]/10 text-[#F8FAFC]"
                    : completed
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 bg-white/[0.03] text-white/48"
                }`}
              >
                <div className="text-[10px] uppercase tracking-[0.18em] opacity-80">
                  Step {index + 1}
                </div>
                <div className="mt-1 font-medium">{item.label}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-xs uppercase tracking-[0.18em] text-white/38">
          Progress {progressPercent}%
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.78fr_0.22fr]">
        <div className="rounded-[32px] border border-white/10 bg-[#0D1218] p-7 md:p-8">
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              {currentStepMeta?.title ?? "Step"}
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {currentStepMeta?.description ?? "Complete this section carefully."}
            </h2>
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

          {currentStep === "release" && (
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
                      onChange={handleProjectFile}
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
          )}

          {currentStep === "tracks" && (
            <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-white">Tracks</div>
                    <p className="mt-2 text-sm leading-7 text-white/52">
                      Add and edit each track.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addTrack}
                    disabled={!canAddMoreTracks(releaseType, values.tracks.length)}
                    className="rounded-2xl border border-[#F3F0A1]/20 bg-[#F3F0A1] px-4 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    + Add
                  </button>
                </div>

                {errors["tracks"] ? (
                  <div className="mt-4 rounded-[18px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errors["tracks"]}
                  </div>
                ) : null}

                <div className="mt-5 grid gap-3">
                  {values.tracks.length === 0 ? (
                    <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-sm text-white/45">
                      No tracks yet.
                    </div>
                  ) : (
                    values.tracks.map((track, index) => (
                      <button
                        key={track.local_id}
                        type="button"
                        onClick={() => setActiveTrackId(track.local_id)}
                        className={`rounded-[20px] border p-4 text-left transition ${
                          activeTrack?.local_id === track.local_id
                            ? "border-[#F3F0A1]/30 bg-[#F3F0A1]/8"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.18em] text-white/38">
                              Track {index + 1}
                            </div>
                            <div className="mt-1 text-sm font-medium text-white">
                              {track.title || "Untitled track"}
                            </div>
                            <div className="mt-1 text-xs text-white/45">
                              {track.primary_artists || "No artists yet"}
                            </div>
                          </div>

                          {track.is_focus_track ? (
                            <span className="rounded-full border border-[#F3F0A1]/20 bg-[#F3F0A1]/12 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-[#F3F0A1]">
                              Focus
                            </span>
                          ) : null}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                {activeTrack ? (
                  <TrackEditor
                    track={activeTrack}
                    index={values.tracks.findIndex((track) => track.local_id === activeTrack.local_id)}
                    totalTracks={values.tracks.length}
                    errors={errors}
                    canMoveUp={values.tracks.findIndex((track) => track.local_id === activeTrack.local_id) > 0}
                    canMoveDown={
                      values.tracks.findIndex((track) => track.local_id === activeTrack.local_id) <
                      values.tracks.length - 1
                    }
                    onChange={(patch) => updateTrack(activeTrack.local_id, patch)}
                    onAudioChange={(event) => handleTrackAudio(activeTrack.local_id, event)}
                    onSetFocus={() => setFocusTrack(activeTrack.local_id)}
                    onMoveUp={() => moveTrack(activeTrack.local_id, "up")}
                    onMoveDown={() => moveTrack(activeTrack.local_id, "down")}
                    onRemove={() => removeTrack(activeTrack.local_id)}
                  />
                ) : (
                  <div className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-6 text-center text-sm text-white/48">
                    Add a track to start editing details.
                  </div>
                )}
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
                          ? `${values.marketing.additional_files.length} file(s) selected`
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

          {currentStep === "review_submit" && <ReviewStep values={values} />}

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
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === "intro"}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>

            {currentStep !== "review_submit" ? (
              <button
                type="button"
                onClick={handleContinue}
                className="rounded-2xl border border-[#F3F0A1]/20 bg-[#F3F0A1] px-5 py-3 text-sm font-medium text-black transition hover:opacity-90"
              >
                {currentStep === "intro" ? "Start" : "Continue"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loadingSubmit}
                className="rounded-2xl border border-[#F3F0A1]/20 bg-[#F3F0A1] px-5 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingSubmit ? "Submitting..." : "Submit Release"}
              </button>
            )}
          </div>
        </div>

        <aside className="grid gap-6">
          <div className="rounded-[32px] border border-white/10 bg-[#0D1218] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              Summary
            </div>

            <div className="mt-4 grid gap-4 text-sm">
              <SummaryItem label="Project" value={values.identification.project_title || "-"} />
              <SummaryItem label="Type" value={values.identification.release_type || "-"} />
              <SummaryItem label="Owner" value={values.identification.submitter_name || "-"} />
              <SummaryItem label="Tracks" value={String(values.tracks.length)} />
              <SummaryItem label="Release date" value={values.project.release_date || "-"} />
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[#0D1218] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              Draft
            </div>
            <p className="mt-3 text-sm leading-7 text-white/58">
              {draftToken
                ? `Token: ${draftToken}`
                : "Draft will be created automatically after identification."}
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
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
          Release Intake
        </div>
        <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-white/62">{text}</p>
      </div>

      <div className="rounded-[24px] border border-[#F3F0A1]/20 bg-[#F3F0A1]/8 p-5 text-sm leading-7 text-[#F3F0A1]">
        You are filling the release intake for {clientName}.
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
        {field.required ? <span className="ml-1 text-[#F3F0A1]">*</span> : null}
      </label>

      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="min-h-[140px] w-full rounded-[20px] border border-white/10 bg-[#05070A] px-4 py-3 text-white outline-none transition focus:border-[#F3F0A1]/50 focus:ring-4 focus:ring-[#F3F0A1]/10"
        />
      ) : field.type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-[20px] border border-white/10 bg-[#05070A] px-4 py-3 text-white outline-none transition focus:border-[#F3F0A1]/50 focus:ring-4 focus:ring-[#F3F0A1]/10"
        >
          <option value="">Select</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-[20px] border border-white/10 bg-[#05070A] px-4 py-3 text-white outline-none transition focus:border-[#F3F0A1]/50 focus:ring-4 focus:ring-[#F3F0A1]/10"
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

      <label className="flex min-h-[92px] cursor-pointer items-center justify-center rounded-[20px] border border-dashed border-white/15 bg-[#05070A] px-4 py-4 text-center text-sm text-white/60 transition hover:border-[#F3F0A1]/30">
        <input type="file" multiple={multiple} className="hidden" onChange={onChange} />
        {fileName ? fileName : "Click to select file"}
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

function TrackEditor({
  track,
  index,
  totalTracks,
  errors,
  canMoveUp,
  canMoveDown,
  onChange,
  onAudioChange,
  onSetFocus,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  track: TrackInput;
  index: number;
  totalTracks: number;
  errors: Record<string, string>;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChange: (patch: Partial<TrackInput>) => void;
  onAudioChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSetFocus: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const prefix = `tracks.${index}`;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-white/40">
            Track {track.order_number} of {totalTracks}
          </div>
          <div className="mt-1 text-xl font-semibold text-white">
            {track.title || "Track editor"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSetFocus}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
          >
            Set Focus Track
          </button>

          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            Move Up
          </button>

          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            Move Down
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-200"
          >
            Remove
          </button>
        </div>
      </div>

      <TrackInputField
        label="Track Title"
        value={track.title}
        error={errors[`${prefix}.title`]}
        onChange={(value) => onChange({ title: value })}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <TrackInputField
          label="Primary Artists"
          value={track.primary_artists}
          error={errors[`${prefix}.primary_artists`]}
          onChange={(value) => onChange({ primary_artists: value })}
        />
        <TrackInputField
          label="Featuring"
          value={track.featured_artists}
          onChange={(value) => onChange({ featured_artists: value })}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <TrackInputField
          label="Interpreters"
          value={track.interpreters}
          error={errors[`${prefix}.interpreters`]}
          onChange={(value) => onChange({ interpreters: value })}
        />
        <TrackInputField
          label="Authors"
          value={track.authors}
          error={errors[`${prefix}.authors`]}
          onChange={(value) => onChange({ authors: value })}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <TrackInputField
          label="Publishers"
          value={track.publishers}
          onChange={(value) => onChange({ publishers: value })}
        />
        <TrackInputField
          label="Producers / Musicians"
          value={track.producers_musicians}
          onChange={(value) => onChange({ producers_musicians: value })}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <TrackSelectField
          label="Artist Profiles"
          value={track.artist_profiles_status}
          error={errors[`${prefix}.artist_profiles_status`]}
          options={[
            { label: "Select", value: "" },
            { label: "Already exist", value: "already_exists" },
            { label: "Need creation", value: "needs_creation" },
            { label: "Mixed", value: "mixed" },
          ]}
          onChange={(value) =>
            onChange({ artist_profiles_status: value as TrackInput["artist_profiles_status"] })
          }
        />

        <TrackSelectField
          label="Has ISRC?"
          value={track.has_isrc}
          error={errors[`${prefix}.has_isrc`]}
          options={[
            { label: "Select", value: "" },
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
          onChange={(value) => onChange({ has_isrc: value as TrackInput["has_isrc"] })}
        />

        <TrackSelectField
          label="Explicit?"
          value={track.explicit_content}
          error={errors[`${prefix}.explicit_content`]}
          options={[
            { label: "Select", value: "" },
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
          onChange={(value) =>
            onChange({ explicit_content: value as TrackInput["explicit_content"] })
          }
        />
      </div>

      {track.has_isrc === "yes" ? (
        <TrackInputField
          label="ISRC Code"
          value={track.isrc_code}
          error={errors[`${prefix}.isrc_code`]}
          onChange={(value) => onChange({ isrc_code: value })}
        />
      ) : null}

      <FileField
        label="Audio Upload"
        fileName={track.audio_file?.file_name ?? ""}
        onChange={onAudioChange}
      />

      <TrackTextareaField
        label="Lyrics"
        value={track.lyrics}
        onChange={(value) => onChange({ lyrics: value })}
      />
    </div>
  );
}

function TrackInputField({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/88">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[18px] border border-white/10 bg-[#05070A] px-4 py-3 text-white outline-none transition focus:border-[#F3F0A1]/50 focus:ring-4 focus:ring-[#F3F0A1]/10"
      />
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
        className="min-h-[120px] w-full rounded-[18px] border border-white/10 bg-[#05070A] px-4 py-3 text-white outline-none transition focus:border-[#F3F0A1]/50 focus:ring-4 focus:ring-[#F3F0A1]/10"
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
        className="w-full rounded-[18px] border border-white/10 bg-[#05070A] px-4 py-3 text-white outline-none transition focus:border-[#F3F0A1]/50 focus:ring-4 focus:ring-[#F3F0A1]/10"
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
      <ReviewSection title="Identification">
        <ReviewItem label="Name" value={values.identification.submitter_name} />
        <ReviewItem label="Email" value={values.identification.submitter_email} />
        <ReviewItem label="Project Title" value={values.identification.project_title} />
        <ReviewItem label="Release Type" value={values.identification.release_type} />
      </ReviewSection>

      <ReviewSection title="Release">
        <ReviewItem label="Release Date" value={values.project.release_date} />
        <ReviewItem label="Genre" value={values.project.genre} />
        <ReviewItem label="Explicit Content" value={values.project.explicit_content} />
        <ReviewItem label="TikTok Snippet" value={values.project.tiktok_snippet} />
        <ReviewItem label="Presskit Link" value={values.project.presskit_link} />
        <ReviewItem label="Video Asset" value={values.project.has_video_asset} />
        <ReviewItem label="Cover" value={values.project.cover_file?.file_name ?? "-"} />
      </ReviewSection>

      <ReviewSection title="Tracks">
        {values.tracks.length === 0 ? (
          <div className="text-sm text-white/55">No tracks added yet.</div>
        ) : (
          <div className="grid gap-3">
            {values.tracks.map((track) => (
              <div
                key={track.local_id}
                className="rounded-[18px] border border-white/10 bg-black/20 p-4"
              >
                <div className="text-sm font-semibold text-white">
                  {track.order_number}. {track.title || "Untitled"}
                  {track.is_focus_track ? " · focus track" : ""}
                </div>
                <div className="mt-2 text-sm leading-7 text-white/58">
                  Primary artists: {track.primary_artists || "-"}
                </div>
                <div className="text-sm leading-7 text-white/58">
                  Interpreters: {track.interpreters || "-"}
                </div>
                <div className="text-sm leading-7 text-white/58">
                  Authors: {track.authors || "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </ReviewSection>

      <ReviewSection title="Marketing">
        <ReviewItem label="Marketing Numbers" value={values.marketing.marketing_numbers} />
        <ReviewItem label="Marketing Focus" value={values.marketing.marketing_focus} />
        <ReviewItem label="Marketing Objectives" value={values.marketing.marketing_objectives} />
        <ReviewItem label="Budget" value={values.marketing.marketing_budget} />
        <ReviewItem label="Focus Track Name" value={values.marketing.focus_track_name} />
        <ReviewItem label="Date Flexibility" value={values.marketing.date_flexibility} />
        <ReviewItem label="Special Guests" value={values.marketing.has_special_guests} />
        <ReviewItem
          label="Promotion Participants"
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