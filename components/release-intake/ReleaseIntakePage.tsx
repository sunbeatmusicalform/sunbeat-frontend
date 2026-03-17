"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  atabaqueTemplate,
  createInitialReleaseIntakeValues,
} from "@/lib/form-engine/atabaque-template";
import { getReleaseTemplate } from "@/lib/form-engine/get-release-template";
import {
  buildDraftPayload,
  buildSubmitPayload,
  canAddMoreTracks,
  getTrackPendingRequiredCount,
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

type AutosaveState = "idle" | "saving" | "saved" | "error";
type DraftNoticeType = "success" | "error";
type UploadKind = "cover" | "audio" | "asset";

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

function getStringFieldValue(
  section: Record<string, unknown>,
  key: string
) {
  const value = section[key];
  return typeof value === "string" ? value : "";
}

function splitMultilineText(value: string) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentDateTimeValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  const hours = `${now.getHours()}`.padStart(2, "0");
  const minutes = `${now.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function ReleaseIntakePage({
  workspaceSlug = "atabaque",
}: {
  workspaceSlug?: string;
}) {
  const searchParams = useSearchParams();
  const resumeToken = searchParams.get("draft");
  const editToken = searchParams.get("edit_token");

  const [template, setTemplate] = useState(atabaqueTemplate);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);

  const [currentStep, setCurrentStep] = useState<FormStepKey>("intro");
  const [values, setValues] = useState<ReleaseIntakeFormValues>(
    createInitialReleaseIntakeValues()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftToken, setDraftToken] = useState<string | null>(resumeToken);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingSendDraftEmail, setLoadingSendDraftEmail] = useState(false);

  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [isHydratingDraft, setIsHydratingDraft] = useState(false);

  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [draftNoticeType, setDraftNoticeType] =
    useState<DraftNoticeType>("success");
  const [draftLinkEmailSent, setDraftLinkEmailSent] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>(
    {}
  );

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const releaseType = values.identification.release_type;
  const currentStepMeta = template.steps.find((step) => step.key === currentStep);
  const stepLabels = useMemo(
    () =>
      STEP_ORDER.map((key) => ({
        key,
        label:
          template.steps.find((step) => step.key === key)?.title ??
          key.replaceAll("_", " "),
      })),
    [template.steps]
  );
  const introParagraphs = useMemo(
    () => splitMultilineText(template.intro.introText),
    [template.intro.introText]
  );

  function shouldRenderProjectField(fieldKey: string) {
    if (
      (fieldKey === "video_link" || fieldKey === "video_release_date") &&
      values.project.has_video_asset !== "yes"
    ) {
      return false;
    }

    return true;
  }

  function shouldRenderMarketingField(fieldKey: string) {
    if (
      fieldKey === "marketing_budget" &&
      values.marketing.has_marketing_budget !== "yes"
    ) {
      return false;
    }

    if (
      fieldKey === "focus_track_name" &&
      !["ep", "album"].includes(releaseType)
    ) {
      return false;
    }

    if (
      (fieldKey === "special_guests_bio" ||
        fieldKey === "feat_will_promote") &&
      values.marketing.has_special_guests !== "yes"
    ) {
      return false;
    }

    return true;
  }

  function getFieldsForStep(stepKey: FormStepKey) {
    const step = template.steps.find((item) => item.key === stepKey);

    if (!step) {
      return [];
    }

    if (stepKey === "release") {
      return step.fields.filter((field) => shouldRenderProjectField(field.key));
    }

    if (stepKey === "marketing") {
      return step.fields.filter((field) => shouldRenderMarketingField(field.key));
    }

    return step.fields;
  }

  function validateTemplateStep(stepKey: "identification" | "release" | "marketing") {
    const errors: Record<string, string> = {};
    const fields = getFieldsForStep(stepKey);
    const sectionKey =
      stepKey === "identification"
        ? "identification"
        : stepKey === "release"
        ? "project"
        : "marketing";
    const sectionValues = values[sectionKey] as Record<string, unknown>;

    fields.forEach((field) => {
      const path = `${sectionKey}.${field.key}`;
      const rawValue = sectionValues[field.key];

      if (field.required) {
        const isEmpty =
          field.type === "file"
            ? Array.isArray(rawValue)
              ? rawValue.length === 0
              : !rawValue
            : typeof rawValue === "string"
            ? rawValue.trim().length === 0
            : !rawValue;

        if (isEmpty) {
          errors[path] =
            field.type === "select"
              ? "Selecione uma opção obrigatória."
              : field.type === "file"
              ? "Envie um arquivo obrigatório."
              : "Preencha este campo obrigatório.";
          return;
        }
      }

      if (
        field.type === "email" &&
        typeof rawValue === "string" &&
        rawValue.trim().length > 0 &&
        !/\S+@\S+\.\S+/.test(rawValue)
      ) {
        errors[path] = "Informe um e-mail válido.";
      }
    });

    return errors;
  }

  function validateBeforeSubmit() {
    return {
      ...validateTemplateStep("identification"),
      ...validateTemplateStep("release"),
      ...validateTracks(values),
      ...validateTemplateStep("marketing"),
    };
  }

  const activeTrack =
    values.tracks.find((track) => track.local_id === activeTrackId) ??
    values.tracks[0] ??
    null;
  const activeTrackIndex = activeTrack
    ? values.tracks.findIndex((track) => track.local_id === activeTrack.local_id)
    : -1;

  const didHydrateDraftRef = useRef(false);
  const didHydrateEditRef = useRef(false);

  const identificationErrors = validateTemplateStep("identification");
  const isIdentificationComplete = Object.keys(identificationErrors).length === 0;
  const canShowDraftButtons = currentStepIndex >= 2 && isIdentificationComplete;

  useEffect(() => {
    let mounted = true;

    async function loadTemplate() {
      try {
        const resolved = await getReleaseTemplate(workspaceSlug);
        if (mounted) {
          setTemplate(resolved);
        }
      } catch (error) {
        console.error("Failed to load release template", error);
      } finally {
        if (mounted) {
          setIsLoadingTemplate(false);
        }
      }
    }

    loadTemplate();

    return () => {
      mounted = false;
    };
  }, [workspaceSlug]);

  useEffect(() => {
    if (!draftNotice) return;

    const timeout = setTimeout(() => {
      setDraftNotice(null);
    }, 3500);

    return () => clearTimeout(timeout);
  }, [draftNotice]);

  useEffect(() => {
    if (!editToken || didHydrateEditRef.current) return;
    didHydrateEditRef.current = true;

    async function loadEditSubmission() {
      try {
        const response = await fetch(`/api/submissions/edit/${editToken}`, {
          method: "GET",
          cache: "no-store",
        });

        const raw = await response.text();
        const data = raw ? JSON.parse(raw) : null;

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              data?.message ||
              "Falha ao carregar submissão para edição."
          );
        }

        const payload = data?.data ?? null;
        if (!payload) return;

        setValues((prev) => ({
          ...prev,
          identification: {
            ...prev.identification,
            ...(payload.identification ?? {}),
          },
          project: {
            ...prev.project,
            ...(payload.project ?? {}),
          },
          marketing: {
            ...prev.marketing,
            ...(payload.marketing ?? {}),
          },
          tracks:
            Array.isArray(payload.tracks) && payload.tracks.length > 0
              ? payload.tracks
              : prev.tracks,
        }));

        if (payload.draft_token) {
          setDraftToken(payload.draft_token);
        }

        const hydratedTracks = Array.isArray(payload.tracks) ? payload.tracks : [];
        if (hydratedTracks.length > 0) {
          setActiveTrackId(hydratedTracks[0].local_id ?? null);
        }

        setCurrentStep("review_submit");
      } catch (error) {
        console.error("Erro ao carregar submissão para edição:", error);
      }
    }

    loadEditSubmission();
  }, [editToken]);

  function showDraftNotice(message: string, type: DraftNoticeType) {
    setDraftNotice(message);
    setDraftNoticeType(type);
  }

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

  function setFieldError(path: string, message: string) {
    setErrors((prev) => ({
      ...prev,
      [path]: message,
    }));
  }

  function setFieldUploading(path: string, isUploading: boolean) {
    setUploadingFields((prev) => {
      if (isUploading) {
        return {
          ...prev,
          [path]: true,
        };
      }

      const next = { ...prev };
      delete next[path];
      return next;
    });
  }

  function setNestedValue(
    section: keyof ReleaseIntakeFormValues,
    key: string,
    value: unknown
  ) {
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

  function setProjectField(
    key: keyof ReleaseIntakeFormValues["project"],
    value: unknown
  ) {
    clearMessages();
    setNestedValue("project", key, value);
    clearFieldError(`project.${key}`);
  }

  function setMarketingField(
    key: keyof ReleaseIntakeFormValues["marketing"],
    value: unknown
  ) {
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
    const generated = generateUuid();

    setDraftToken(generated);
    return generated;
  }

  async function uploadFile(args: {
    file: File;
    kind: UploadKind;
    fieldPath: string;
    trackLocalId?: string;
  }): Promise<UploadedFileRef> {
    const stableDraftToken = ensureDraftToken();
    setFieldUploading(args.fieldPath, true);
    clearFieldError(args.fieldPath);

    try {
      const formData = new FormData();
      formData.set("file", args.file);
      formData.set("kind", args.kind);
      formData.set("workspaceSlug", template.workspaceSlug);
      formData.set("draftToken", stableDraftToken);

      if (args.trackLocalId) {
        formData.set("trackLocalId", args.trackLocalId);
      }

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : null;

      if (!response.ok) {
        throw new Error(data?.message || "Falha ao enviar arquivo.");
      }

      return {
        file_id: data?.file_id || generateUuid(),
        file_name: data?.file_name || args.file.name,
        storage_bucket: data?.storage_bucket || undefined,
        storage_path: data?.storage_path || "",
        public_url: data?.public_url || "",
        download_url: data?.download_url || "",
        mime_type: data?.mime_type || args.file.type,
        size_bytes: data?.size_bytes || args.file.size,
      };
    } finally {
      setFieldUploading(args.fieldPath, false);
    }
  }

  async function handleProjectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setProjectField("cover_file", null);
      return;
    }

    try {
      const uploaded = await uploadFile({
        file,
        kind: "cover",
        fieldPath: "project.cover_file",
      });
      setProjectField("cover_file", uploaded);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setFieldError(
        "project.cover_file",
        error?.message || "Não foi possível enviar a capa."
      );
    } finally {
      event.target.value = "";
    }
  }

  async function handleMarketingFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    try {
      const uploaded: UploadedFileRef[] = [];

      for (const file of files) {
        uploaded.push(
          await uploadFile({
            file,
            kind: "asset",
            fieldPath: "marketing.additional_files",
          })
        );
      }

      setMarketingField("additional_files", uploaded);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setFieldError(
        "marketing.additional_files",
        error?.message || "Não foi possível enviar os arquivos adicionais."
      );
    } finally {
      event.target.value = "";
    }
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

  async function handleTrackAudio(localId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const trackIndex = values.tracks.findIndex((track) => track.local_id === localId);
    const fieldPath =
      trackIndex >= 0 ? `tracks.${trackIndex}.audio_file` : "tracks.audio_file";

    if (!file) {
      updateTrack(localId, { audio_file: null });
      return;
    }

    try {
      const uploaded = await uploadFile({
        file,
        kind: "audio",
        fieldPath,
        trackLocalId: localId,
      });

      updateTrack(localId, { audio_file: uploaded });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setFieldError(
        fieldPath,
        error?.message || "Não foi possível enviar o áudio da faixa."
      );
    } finally {
      event.target.value = "";
    }
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
        throw new Error(data?.detail || data?.message || "Falha ao carregar rascunho.");
      }

      const draftData = data?.data ?? data;
      const hydratedValues = draftData?.values ?? null;

      if (hydratedValues) {
        setValues(hydratedValues);
      }

      const hydratedStep = draftData?.current_step ?? null;
      if (hydratedStep) {
        setCurrentStep(hydratedStep);
      }

      if (data?.draft_token) {
        setDraftToken(data.draft_token);
      }

      if (data?.draft_link_email_sent) {
        setDraftLinkEmailSent(true);
      }

      if (hydratedValues?.tracks?.length) {
        setActiveTrackId(hydratedValues.tracks[0].local_id);
      }

      setAutosaveState("saved");
    } catch (error) {
      console.error("Draft load failed", error);
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
    if (isLoadingTemplate) return;
    if (editToken) return;

    const timeout = setTimeout(async () => {
      try {
        setAutosaveState("saving");

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
          throw new Error(
            typeof data?.detail === "string"
              ? data.detail
              : data?.message || "Falha ao salvar rascunho."
          );
        }

        if (data?.draft_token && data.draft_token !== draftToken) {
          setDraftToken(data.draft_token);
        }

        if (data?.draft_link_email_sent) {
          setDraftLinkEmailSent(true);
        }

        setAutosaveState("saved");
      } catch (error) {
        console.error("Autosave failed", error);
        setAutosaveState("error");
      }
    }, 900);

    return () => clearTimeout(timeout);
  }, [
    draftToken,
    values,
    currentStep,
    template.workspaceSlug,
    template.version,
    isHydratingDraft,
    isLoadingTemplate,
    editToken,
  ]);

  async function handleSaveDraft() {
    if (!isIdentificationComplete) {
      showDraftNotice(
        "Preencha a etapa de identificação antes de salvar o rascunho.",
        "error"
      );
      return;
    }

    try {
      const token = ensureDraftToken();

      const payload = buildDraftPayload({
        draftToken: token,
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
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : data?.message || "Falha ao salvar rascunho."
        );
      }

      if (data?.draft_token && data.draft_token !== draftToken) {
        setDraftToken(data.draft_token);
      }

      if (data?.draft_link_email_sent) {
        setDraftLinkEmailSent(true);
      }

      showDraftNotice("Rascunho salvo com sucesso.", "success");
      setAutosaveState("saved");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      showDraftNotice(
        error?.message || "Não foi possível salvar o rascunho.",
        "error"
      );
    }
  }

  async function handleSendDraftEmail() {
    if (!isIdentificationComplete) {
      showDraftNotice(
        "Preencha a etapa de identificação antes de enviar o rascunho por email.",
        "error"
      );
      return;
    }

    if (draftLinkEmailSent) {
      showDraftNotice("O link do rascunho já foi enviado por email.", "success");
      return;
    }

    try {
      setLoadingSendDraftEmail(true);

      const token = ensureDraftToken();

      const savePayload = buildDraftPayload({
        draftToken: token,
        workspaceSlug: template.workspaceSlug,
        formVersion: template.version,
        currentStep,
        values,
      });

      const saveResponse = await fetch("/api/release-drafts/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(savePayload),
      });

      const saveRaw = await saveResponse.text();
      const saveData = saveRaw ? JSON.parse(saveRaw) : null;

      if (!saveResponse.ok) {
        throw new Error(
          saveData?.detail || saveData?.message || "Falha ao salvar rascunho."
        );
      }

      const stableDraftToken = saveData?.draft_token || token;
      setDraftToken(stableDraftToken);

      const response = await fetch("/api/release-drafts/send-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draft_token: stableDraftToken,
          workspace_slug: template.workspaceSlug,
          to_email: values.identification.submitter_email,
          recipient_name: values.identification.submitter_name,
          project_title: values.identification.project_title,
        }),
      });

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : null;

      if (!response.ok) {
        throw new Error(
          data?.detail || data?.message || "Falha ao enviar email do rascunho."
        );
      }

      setDraftLinkEmailSent(true);

      if (data?.already_sent) {
        showDraftNotice("O link do rascunho já havia sido enviado por email.", "success");
      } else {
        showDraftNotice("Link do rascunho enviado por email com sucesso.", "success");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      showDraftNotice(
        error?.message || "Não foi possível enviar o link do rascunho por email.",
        "error"
      );
    } finally {
      setLoadingSendDraftEmail(false);
    }
  }

  function validateCurrentStep() {
    switch (currentStep) {
      case "identification":
        return validateTemplateStep("identification");
      case "release":
        return validateTemplateStep("release");
      case "tracks":
        return validateTracks(values);
      case "marketing":
        return validateTemplateStep("marketing");
      default:
        return {};
    }
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

    const validation = validateBeforeSubmit();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
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

      const finalPayload = {
        ...payload,
        edit_token: editToken ?? undefined,
      };

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalPayload),
      });

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : null;

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || "Falha no envio.");
      }

      setSubmitMessage(
        template.successMessage ||
          `Formulário enviado com sucesso. ID: ${data?.submission_id ?? data?.id ?? "ok"}`
      );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setSubmitError(error?.message ?? "Falha ao enviar o formulário.");
    } finally {
      setLoadingSubmit(false);
    }
  }

  if (isLoadingTemplate) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] px-4 py-16">
        <div className="mx-auto max-w-2xl text-center text-sm text-slate-500">
          Carregando formulário...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {template.intro.logoUrl ? (
                <img
                  src={template.intro.logoUrl}
                  alt={template.intro.clientName}
                  className="h-12 w-auto object-contain sm:h-14"
                />
              ) : null}

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {template.intro.clientName}
                </div>
                <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-[32px]">
                  {template.intro.formTitle}
                </h1>
                {introParagraphs[0] ? (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                    {introParagraphs[0]}
                  </p>
                ) : null}
              </div>
            </div>

            {(editToken || draftToken) && (
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
                {editToken ? "Modo edicao ativo" : "Rascunho carregado"}
              </div>
            )}
          </div>
        </header>

        <div className="mb-6 overflow-x-auto">
          <div className="flex min-w-[720px] gap-3 pb-1">
            {stepLabels.map((item, index) => {
              const active = item.key === currentStep;
              const completed = index < currentStepIndex;

              return (
                <div
                  key={item.key}
                  className={`min-w-[118px] rounded-[22px] border px-4 py-3 transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : completed
                      ? "border-slate-300 bg-white text-slate-900"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition ${
                        active
                          ? "border-white/20 bg-white/10 text-white"
                          : completed
                          ? "border-slate-300 bg-slate-100 text-slate-900"
                          : "border-slate-200 bg-slate-50 text-slate-400"
                      }`}
                    >
                      {completed ? "✓" : index + 1}
                    </div>

                    <div className="min-w-0">
                      <div
                        className={`text-[10px] uppercase tracking-[0.18em] ${
                          active
                            ? "text-white/65"
                            : completed
                            ? "text-slate-500"
                            : "text-slate-400"
                        }`}
                      >
                        Etapa {index + 1}
                      </div>
                      <div
                        className={`mt-1 truncate text-sm font-medium ${
                          active
                            ? "text-white"
                            : completed
                            ? "text-slate-900"
                            : "text-slate-400"
                        }`}
                      >
                        {item.label}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {autosaveState !== "idle" ? (
          <div className="mb-5 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            {autosaveState === "saving" ? "Salvando rascunho" : null}
            {autosaveState === "saved" ? "Rascunho salvo" : null}
            {autosaveState === "error" ? "Erro ao salvar" : null}
          </div>
        ) : null}

        <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-7 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-8">
          {currentStep === "intro" && (
            <IntroStep
              title={template.intro.formTitle}
              text={template.intro.introText}
            />
          )}

          {currentStep !== "intro" && (
            <div className="mb-8">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {currentStepMeta?.title ?? "Etapa"}
              </div>
              {currentStepMeta?.description ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {currentStepMeta.description}
                </p>
              ) : null}
            </div>
          )}

          {currentStep === "identification" && (
            <div className="grid gap-7">
              {currentStepMeta?.fields.map((field) => (
                <FormFieldRenderer
                  key={field.key}
                  field={field}
                  value={getStringFieldValue(values.identification, field.key)}
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
            <div className="grid gap-7">
              {currentStepMeta?.fields.map((field) => {
                if (!shouldRenderProjectField(field.key)) {
                  return null;
                }

                if (field.key === "cover_file") {
                  return (
                    <FileField
                      key={field.key}
                      label={field.label}
                      helperText={field.helperText}
                      required={field.required}
                      error={errors[`project.${field.key}`]}
                      fileName={values.project.cover_file?.file_name ?? ""}
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      isUploading={Boolean(uploadingFields["project.cover_file"])}
                      onChange={handleProjectFile}
                    />
                  );
                }

                return (
                  <FormFieldRenderer
                    key={field.key}
                    field={field}
                    value={getStringFieldValue(values.project, field.key)}
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
            <div className="grid gap-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-900">Faixas</div>
                </div>

                <button
                  type="button"
                  onClick={addTrack}
                  disabled={!canAddMoreTracks(releaseType, values.tracks.length)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  + Adicionar faixa
                </button>
              </div>

              {errors["tracks"] ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errors["tracks"]}
                </div>
              ) : null}

              <div className="grid gap-3">
                {values.tracks.map((track, index) => {
                  const pendingRequiredCount = getTrackPendingRequiredCount(track);

                  return (
                    <button
                      key={track.local_id}
                      type="button"
                      onClick={() => setActiveTrackId(track.local_id)}
                      className={`rounded-xl border p-4 text-left transition ${
                        activeTrack?.local_id === track.local_id
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                          Faixa {track.order_number || index + 1}
                        </div>

                        {pendingRequiredCount > 0 ? (
                          <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                            {pendingRequiredCount}{" "}
                            {pendingRequiredCount === 1
                              ? "obrigatório pendente"
                              : "obrigatórios pendentes"}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-1 text-sm font-medium text-slate-900">
                        {track.title || "Faixa sem título"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {activeTrack ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
                  <TrackEditor
                    track={activeTrack}
                    index={values.tracks.findIndex(
                      (track) => track.local_id === activeTrack.local_id
                    )}
                    totalTracks={values.tracks.length}
                    errors={errors}
                    canMoveUp={
                      values.tracks.findIndex(
                        (track) => track.local_id === activeTrack.local_id
                      ) > 0
                    }
                    canMoveDown={
                      activeTrackIndex < values.tracks.length - 1
                    }
                    audioUploading={
                      activeTrackIndex >= 0
                        ? Boolean(
                            uploadingFields[`tracks.${activeTrackIndex}.audio_file`]
                          )
                        : false
                    }
                    onChange={(patch) => updateTrack(activeTrack.local_id, patch)}
                    onAudioChange={(event) =>
                      handleTrackAudio(activeTrack.local_id, event)
                    }
                    onSetFocus={() => setFocusTrack(activeTrack.local_id)}
                    onMoveUp={() => moveTrack(activeTrack.local_id, "up")}
                    onMoveDown={() => moveTrack(activeTrack.local_id, "down")}
                    onRemove={() => removeTrack(activeTrack.local_id)}
                  />
                </div>
              ) : null}
            </div>
          )}

          {currentStep === "marketing" && (
            <div className="grid gap-7">
              {currentStepMeta?.fields.map((field) => {
                if (!shouldRenderMarketingField(field.key)) {
                  return null;
                }

                if (field.key === "additional_files") {
                  return (
                    <FileField
                      key={field.key}
                      label={field.label}
                      helperText={field.helperText}
                      required={field.required}
                      error={errors[`marketing.${field.key}`]}
                      fileName={
                        values.marketing.additional_files.length > 0
                          ? `${values.marketing.additional_files.length} arquivo(s) selecionado(s)`
                          : ""
                      }
                      accept=".jpg,.jpeg,.png,.pdf,.zip,image/jpeg,image/png,application/pdf,application/zip"
                      isUploading={Boolean(uploadingFields["marketing.additional_files"])}
                      multiple
                      onChange={handleMarketingFiles}
                    />
                  );
                }

                return (
                  <FormFieldRenderer
                    key={field.key}
                    field={field}
                    value={getStringFieldValue(values.marketing, field.key)}
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

          {draftNotice ? (
            <div
              className={`mt-7 rounded-xl px-4 py-3 text-sm ${
                draftNoticeType === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {draftNotice}
            </div>
          ) : null}

          {submitMessage ? (
            <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {submitMessage}
            </div>
          ) : null}

          {submitError ? (
            <div className="mt-7 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <div className="mt-12 border-t border-slate-200 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === "intro"}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Voltar
                </button>

                {canShowDraftButtons && !editToken && (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900"
                    >
                      Salvar rascunho
                    </button>

                    <button
                      type="button"
                      onClick={handleSendDraftEmail}
                      disabled={loadingSendDraftEmail || draftLinkEmailSent}
                      className="rounded-xl border border-slate-900 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {draftLinkEmailSent
                        ? "Link já enviado"
                        : loadingSendDraftEmail
                        ? "Enviando link..."
                        : "Enviar rascunho por email"}
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:flex-1">
                {currentStep === "tracks" ? (
                  <button
                    type="button"
                    onClick={addTrack}
                    disabled={!canAddMoreTracks(releaseType, values.tracks.length)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    + Adicionar nova faixa
                  </button>
                ) : null}

                <div className="sm:min-w-[220px]">
                  {currentStep !== "review_submit" ? (
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="w-full rounded-xl border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-medium text-white"
                    >
                      {currentStep === "intro" ? "Começar" : "Próximo"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loadingSubmit}
                      className="w-full rounded-xl border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingSubmit
                        ? "Enviando..."
                        : editToken
                        ? "Salvar alterações"
                        : "Enviar formulário"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {template.intro.supportLogoUrl ? (
          <footer className="mt-5 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              <img
                src={template.intro.supportLogoUrl}
                alt={template.intro.supportLogoAlt ?? "Sunbeat"}
                className="h-4 w-4 rounded-full object-contain"
              />
              {template.intro.supportLabel ?? "Powered by Sunbeat"}
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  );
}

function IntroStep({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  const paragraphs = splitMultilineText(text);

  return (
    <div className="max-w-2xl">
      <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 sm:px-6 sm:py-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Início
        </div>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
          {title}
        </h3>

        <div className="mt-4 grid gap-4 text-[15px] leading-7 text-slate-600">
          {paragraphs.map((paragraph, index) => (
            <p key={`${paragraph}-${index}`}>{paragraph}</p>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Clique em <strong>Começar</strong> para seguir para o preenchimento.
        </p>
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[15px] font-medium text-slate-900">{label}</span>
      {required ? (
        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-700">
          Obrigatório
        </span>
      ) : null}
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
  const minValue =
    field.key === "release_date"
      ? getTodayDateValue()
      : field.key === "video_release_date"
      ? getCurrentDateTimeValue()
      : undefined;

  return (
    <div>
      <FieldLabel label={field.label} required={field.required} />

      {field.helperText ? (
        <p className="mt-2 text-sm leading-6 text-slate-500">{field.helperText}</p>
      ) : null}

      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="mt-3 min-h-[148px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-slate-900"
        />
      ) : field.type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-3 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-[15px] text-slate-900 outline-none transition focus:border-slate-900"
        >
          {field.options?.map((option) => (
            <option key={option.value || option.label} value={option.value}>
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
          min={minValue}
          step={field.type === "datetime-local" ? 60 : undefined}
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

function FileField({
  label,
  helperText,
  fileName,
  error,
  onChange,
  accept,
  isUploading = false,
  multiple = false,
  required = false,
}: {
  label: string;
  helperText?: string;
  fileName?: string;
  error?: string;
  accept?: string;
  isUploading?: boolean;
  multiple?: boolean;
  required?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />

      {helperText ? (
        <p className="mt-2 text-sm leading-6 text-slate-500">{helperText}</p>
      ) : null}

      <label
        className={`mt-3 flex min-h-[96px] items-center justify-center rounded-xl border border-dashed border-slate-300 px-4 py-4 text-center text-sm text-slate-600 transition ${
          isUploading
            ? "cursor-wait bg-slate-100"
            : "cursor-pointer bg-slate-50 hover:bg-slate-100"
        }`}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={isUploading}
          className="hidden"
          onChange={onChange}
        />
        {isUploading
          ? "Enviando arquivo..."
          : fileName
          ? fileName
          : "Clique para selecionar arquivo"}
      </label>

      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
  audioUploading,
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
  audioUploading: boolean;
  onChange: (patch: Partial<TrackInput>) => void;
  onAudioChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSetFocus: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const prefix = `tracks.${index}`;
  const pendingRequiredCount = getTrackPendingRequiredCount(track);

  return (
    <div className="grid gap-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Faixa {track.order_number} de {totalTracks}
          </div>
          <div className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
            {track.title || "Editor de faixa"}
          </div>
          {pendingRequiredCount > 0 ? (
            <div className="mt-3 inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[12px] font-semibold text-red-700">
              {pendingRequiredCount}{" "}
              {pendingRequiredCount === 1
                ? "campo obrigatório pendente"
                : "campos obrigatórios pendentes"}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSetFocus}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            Definir faixa foco
          </button>

          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-40"
          >
            Subir
          </button>

          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-40"
          >
            Descer
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            Remover
          </button>
        </div>
      </div>

      <TrackInputField
        label="Nome da Faixa (Título da Música)"
        value={track.title}
        required
        error={errors[`${prefix}.title`]}
        onChange={(value) => onChange({ title: value })}
      />

      <div className="grid gap-7 md:grid-cols-2">
        <TrackInputField
          label="Artistas Principais (Plataformas Digitais)"
          value={track.primary_artists}
          required
          error={errors[`${prefix}.primary_artists`]}
          onChange={(value) => onChange({ primary_artists: value })}
          helpText="Separe por vírgula se houver múltiplos artistas."
        />
        <TrackInputField
          label="Artistas Feats (Plataformas Digitais)"
          value={track.featured_artists}
          onChange={(value) => onChange({ featured_artists: value })}
          helpText="Separe por vírgula se houver múltiplos artistas."
        />
      </div>

        <TrackSelectField
          label="Os Artistas já têm Perfil nas plataformas ou o Perfil precisa ser criado?"
          value={track.artist_profiles_status}
        error={errors[`${prefix}.artist_profiles_status`]}
        options={[
          { label: "Selecione", value: "" },
          { label: "Já tem perfil", value: "already_exists" },
          {
            label:
              "Alguns artistas já possuem perfil, enquanto outros precisam ser criados.",
            value: "mixed",
          },
          { label: "O perfil precisa ser criado", value: "needs_creation" },
        ]}
        onChange={(value) =>
          onChange({
            artist_profiles_status: value as TrackInput["artist_profiles_status"],
          })
        }
      />

      {track.artist_profiles_status ? (
        <div
          className={`grid gap-7 ${
            track.artist_profiles_status === "mixed" ? "md:grid-cols-2" : ""
          }`}
        >
          {track.artist_profiles_status !== "already_exists" ? (
            <TrackTextareaField
              label="Escreva exatamente como deve ser o nome do Perfil de cada Artista que precisa ser criado"
              value={track.artist_profile_names_to_create}
              onChange={(value) =>
                onChange({ artist_profile_names_to_create: value })
              }
            />
          ) : null}

          {track.artist_profiles_status !== "needs_creation" ? (
            <TrackTextareaField
              label="Links do Perfil já existente de cada Artista"
              value={track.existing_profile_links}
              onChange={(value) => onChange({ existing_profile_links: value })}
            />
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-7 md:grid-cols-2">
        <TrackInputField
          label="Intérpretes (Créditos e cadastro do ISRC)"
          value={track.interpreters}
          error={errors[`${prefix}.interpreters`]}
          onChange={(value) => onChange({ interpreters: value })}
          helpText="Intérpretes são os artistas vocais da música."
        />
        <TrackInputField
          label="Autor(es)"
          value={track.authors}
          required
          error={errors[`${prefix}.authors`]}
          onChange={(value) => onChange({ authors: value })}
          helpText="Separe por vírgula caso tenha mais de um autor."
        />
      </div>

      <div className="grid gap-7 md:grid-cols-2">
        <TrackInputField
          label="Editoras"
          value={track.publishers}
          onChange={(value) => onChange({ publishers: value })}
          helpText="Indique a editora de cada autor."
        />
        <TrackInputField
          label="Produtores / Músicos"
          value={track.producers_musicians}
          onChange={(value) => onChange({ producers_musicians: value })}
          helpText="Separe por vírgula e indique instrumentos quando necessário."
        />
      </div>

      <TrackInputField
        label="Trecho do TikTok - Minutagem"
        value={track.tiktok_snippet}
        onChange={(value) => onChange({ tiktok_snippet: value })}
        helpText="Especifique em qual trecho os 30 segundos do TikTok devem começar."
      />

      <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        <TrackSelectField
          label="A música já tem o ISRC?"
          value={track.has_isrc}
          required
          error={errors[`${prefix}.has_isrc`]}
          options={[
            { label: "Selecione", value: "" },
            { label: "Sim", value: "yes" },
            { label: "Não", value: "no" },
          ]}
          onChange={(value) =>
            onChange({
              has_isrc: value as TrackInput["has_isrc"],
              isrc_code: value === "yes" ? track.isrc_code : "",
            })
          }
        />

        <TrackSelectField
          label="Conteúdo Explícito? (+18)"
          value={track.explicit_content}
          error={errors[`${prefix}.explicit_content`]}
          options={[
            { label: "Selecione", value: "" },
            { label: "Sim", value: "yes" },
            { label: "Não", value: "no" },
          ]}
          onChange={(value) =>
            onChange({
              explicit_content: value as TrackInput["explicit_content"],
            })
          }
        />

        <TrackReadOnlyField
          label="Ordem da Faixa"
          value={String(track.order_number || index + 1)}
          helpText="A ordem também pode ser ajustada pelos botões Subir e Descer."
        />
      </div>

      {track.has_isrc ? (
        <div
          className={`grid gap-7 ${
            track.has_isrc === "yes" ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"
          }`}
        >
          <TrackInputField
            label="Produtor Fonográfico"
            value={track.phonographic_producer}
            required
            error={errors[`${prefix}.phonographic_producer`]}
            onChange={(value) => onChange({ phonographic_producer: value })}
            helpText="Informe o produtor fonográfico tanto para faixas com ISRC quanto para faixas sem ISRC."
          />

          {track.has_isrc === "yes" ? (
            <TrackInputField
              label="Código do ISRC"
              value={track.isrc_code}
              required
              error={errors[`${prefix}.isrc_code`]}
              onChange={(value) => onChange({ isrc_code: value })}
            />
          ) : null}
        </div>
      ) : null}

      <FileField
        label="Anexe aqui o áudio da música (WAV)"
        required={false}
        fileName={track.audio_file?.file_name ?? ""}
        error={errors[`${prefix}.audio_file`]}
        accept=".wav,.mp3,audio/wav,audio/x-wav,audio/mpeg,audio/mp3"
        isUploading={audioUploading}
        onChange={onAudioChange}
      />

      <TrackTextareaField
        label="Letra da Música"
        value={track.lyrics}
        onChange={(value) => onChange({ lyrics: value })}
      />
    </div>
  );
}

function TrackReadOnlyField({
  label,
  value,
  helpText,
}: {
  label: string;
  value: string;
  helpText?: string;
}) {
  return (
    <div>
      <label className="block text-[15px] font-medium text-slate-900">{label}</label>
      {helpText ? (
        <p className="mt-2 text-sm leading-6 text-slate-500">{helpText}</p>
      ) : null}
      <input
        readOnly
        value={value}
        className="mt-3 h-12 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 text-[15px] text-slate-700 outline-none"
      />
    </div>
  );
}

function TrackInputField({
  label,
  value,
  error,
  onChange,
  helpText,
  required = false,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  helpText?: string;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      {helpText ? (
        <p className="mt-2 text-sm leading-6 text-slate-500">{helpText}</p>
      ) : null}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-[15px] text-slate-900 outline-none transition focus:border-slate-900"
      />
      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 min-h-[140px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-slate-900"
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
  required = false,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  error?: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-[15px] text-slate-900 outline-none transition focus:border-slate-900"
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function ReviewStep({ values }: { values: ReleaseIntakeFormValues }) {
  return (
    <div className="grid gap-6">
      <ReviewSection title="Identificação">
        <ReviewItem
          label="Nome do Responsável"
          value={values.identification.submitter_name}
        />
        <ReviewItem
          label="E-mail do Responsável"
          value={values.identification.submitter_email}
        />
        <ReviewItem
          label="Nome do Projeto"
          value={values.identification.project_title}
        />
        <ReviewItem
          label="Tipo de Lançamento"
          value={values.identification.release_type}
        />
      </ReviewSection>

      <ReviewSection title="Projeto">
        <ReviewItem label="Data de Lançamento" value={values.project.release_date} />
        <ReviewItem label="Gênero Musical" value={values.project.genre} />
        <ReviewItem
          label="Conteúdo Explícito"
          value={values.project.explicit_content}
        />
        <ReviewItem
          label="Trecho do TikTok"
          value={values.project.tiktok_snippet}
        />
        <ReviewItem label="Link da Capa" value={values.project.cover_link} />
        <ReviewItem
          label="Link de Divulgação"
          value={values.project.promo_assets_link}
        />
        <ReviewItem label="Link do Presskit" value={values.project.presskit_link} />
        <ReviewItem label="Tem Vídeo" value={values.project.has_video_asset} />
        {values.project.has_video_asset === "yes" ? (
          <>
            <ReviewItem label="Link do Vídeo" value={values.project.video_link} />
            <ReviewItem
              label="Data do Vídeo"
              value={values.project.video_release_date}
            />
          </>
        ) : null}
        <ReviewItem
          label="Arquivo da Capa"
          value={values.project.cover_file?.file_name ?? "-"}
        />
      </ReviewSection>

      <ReviewSection title="Marketing">
        <ReviewItem
          label="Números e Resultados"
          value={values.marketing.marketing_numbers}
        />
        <ReviewItem
          label="Foco do Lançamento"
          value={values.marketing.marketing_focus}
        />
        <ReviewItem
          label="Metas do Lançamento"
          value={values.marketing.marketing_objectives}
        />
        <ReviewItem
          label="Tem verba para promoção"
          value={values.marketing.has_marketing_budget}
        />
        {values.marketing.has_marketing_budget === "yes" ? (
          <ReviewItem
            label="Valor da verba"
            value={values.marketing.marketing_budget}
          />
        ) : null}
        {["ep", "album"].includes(values.identification.release_type) ? (
          <ReviewItem
            label="Faixa foco"
            value={values.marketing.focus_track_name}
          />
        ) : null}
        <ReviewItem
          label="Flexibilidade de data"
          value={values.marketing.date_flexibility}
        />
        <ReviewItem
          label="Tem participações especiais"
          value={values.marketing.has_special_guests}
        />
        {values.marketing.has_special_guests === "yes" ? (
          <>
            <ReviewItem
              label="Mini bio das participações"
              value={values.marketing.special_guests_bio}
            />
            <ReviewItem
              label="Feat participa da divulgação"
              value={values.marketing.feat_will_promote}
            />
          </>
        ) : null}
        <ReviewItem
          label="Participantes na promoção"
          value={values.marketing.promotion_participants}
        />
        <ReviewItem
          label="Influenciadores / Marcas / Parceiros"
          value={values.marketing.influencers_brands_partners}
        />
        <ReviewItem
          label="Observações do projeto"
          value={values.marketing.general_notes}
        />
        <ReviewItem
          label="Arquivos adicionais"
          value={
            values.marketing.additional_files.length > 0
              ? `${values.marketing.additional_files.length} arquivo(s)`
              : "-"
          }
        />
      </ReviewSection>

      <ReviewSection title="Faixas">
        <div className="grid gap-4">
          {values.tracks.map((track) => (
            <div
              key={track.local_id}
              className="rounded-xl border border-slate-200 bg-white px-4 py-4"
            >
              <div className="text-sm font-semibold text-slate-900">
                Faixa {track.order_number}: {track.title || "Sem título"}
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <ReviewItem label="Artistas principais" value={track.primary_artists} />
                <ReviewItem label="Feats" value={track.featured_artists} />
                <ReviewItem label="Autores" value={track.authors} />
                <ReviewItem label="Intérpretes" value={track.interpreters} />
                <ReviewItem label="Editoras" value={track.publishers} />
                <ReviewItem
                  label="Produtores / Músicos"
                  value={track.producers_musicians}
                />
                <ReviewItem
                  label="Produtor Fonográfico"
                  value={track.phonographic_producer}
                />
                <ReviewItem label="Status de perfil" value={track.artist_profiles_status} />
                <ReviewItem
                  label="Perfis a criar"
                  value={track.artist_profile_names_to_create}
                />
                <ReviewItem
                  label="Links de perfil existentes"
                  value={track.existing_profile_links}
                />
                <ReviewItem label="Tem ISRC" value={track.has_isrc} />
                <ReviewItem label="Código ISRC" value={track.isrc_code} />
                <ReviewItem
                  label="Conteúdo explícito"
                  value={track.explicit_content}
                />
                <ReviewItem
                  label="Trecho TikTok"
                  value={track.tiktok_snippet}
                />
                <ReviewItem
                  label="Áudio"
                  value={track.audio_file?.file_name ?? "-"}
                />
                <ReviewItem label="Letra" value={track.lyrics} />
              </div>
            </div>
          ))}
        </div>
      </ReviewSection>
    </div>
  );
}
function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 text-lg font-semibold text-slate-900">{title}</div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm leading-7 text-slate-800">{value || "-"}</div>
    </div>
  );
}


