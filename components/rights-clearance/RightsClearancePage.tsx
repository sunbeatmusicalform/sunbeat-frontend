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
  createEmptyRightsClearanceTrack,
  createInitialRightsClearanceValues,
  rightsClearanceTemplate,
} from "@/lib/form-engine/rights-clearance-template";
import {
  buildWorkflowDraftPayload,
  buildWorkflowSubmitPayload,
} from "@/lib/form-engine/submission-payload";
import { getWorkflowTemplate } from "@/lib/form-engine/get-release-template";
import { resolveWorkflowRenderer } from "@/lib/form-engine/workflow-registry";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type {
  ClearanceFormat,
  FormField,
  FormVersion,
  ReleaseType,
  RightsClearanceFormValues,
  RightsClearanceStepKey,
  RightsClearanceTrackValues,
  UploadedFileRef,
  WorkflowType,
} from "@/lib/form-engine/types";

const STEP_ORDER: RightsClearanceStepKey[] = [
  "intro",
  "requester_identification",
  "request_type",
  "project_context",
  "clearance_scope",
  "assets_references",
  "review_submit",
];

const ATABAQUE_DEFAULT_CLEARANCE_FORMAT = "music_release_clearance_intake" as const;

const MUSIC_PROJECT_TRACK_FIELDS = [
  "composer_author_info",
  "publisher_info",
  "material_type",
  "intended_use",
  "exclusivity",
] as const;

const AUDIOVISUAL_PRODUCT_SYNC_FIELDS = [
  "audiovisual_type",
  "director_name",
  "product_or_campaign_name",
  "scene_description",
  "sync_duration",
  "media_channels",
] as const;

function parseJsonResponseText(raw: string) {
  if (!raw) {
    return null;
  }

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
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.detail === "string" && data.detail.trim()) {
    return data.detail;
  }

  const text = raw.trim();
  if (!text || text.startsWith("<")) {
    return fallback;
  }

  return text;
}

function inferClearanceFormatFromScope(
  clearanceScope: Record<string, unknown>
): ClearanceFormat | "" {
  if (
    AUDIOVISUAL_PRODUCT_SYNC_FIELDS.some((key) =>
      getStringFieldValue(clearanceScope, key).trim()
    )
  ) {
    return "audiovisual_product_sync";
  }

  if (
    MUSIC_PROJECT_TRACK_FIELDS.some((key) =>
      getStringFieldValue(clearanceScope, key).trim()
    )
  ) {
    return "music_project_track";
  }

  return "";
}

function isMusicReleaseClearanceIntake(
  clearanceFormat: ClearanceFormat | ""
): clearanceFormat is "music_release_clearance_intake" {
  return clearanceFormat === "music_release_clearance_intake";
}

function getDefaultClearanceFormat(
  workspaceSlug: string
): ClearanceFormat | "" {
  return workspaceSlug === "atabaque"
    ? ATABAQUE_DEFAULT_CLEARANCE_FORMAT
    : "";
}

function getActiveStepOrder(
  clearanceFormat: ClearanceFormat | ""
): RightsClearanceStepKey[] {
  if (isMusicReleaseClearanceIntake(clearanceFormat)) {
    return [
      "intro",
      "requester_identification",
      "request_type",
      "project_context",
      "tracks",
      "review_submit",
    ];
  }

  return STEP_ORDER;
}

type AutosaveState = "idle" | "saving" | "saved" | "error";
type DraftNoticeType = "success" | "error";

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

function getStringFieldValue(section: Record<string, unknown>, key: string) {
  const value = section[key];
  return typeof value === "string" ? value : "";
}

function splitMultilineText(value: string) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatReviewValue(value?: string) {
  if (!value) return "-";

  switch (value) {
    case "yes":
      return "Sim";
    case "no":
      return "Nao";
    default:
      return value;
  }
}

function normalizeDateInputValue(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const text = value.trim();
  if (!text) {
    return "";
  }

  const directMatch = text.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (directMatch) {
    return directMatch[1];
  }

  const prefixedMatch = text.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s].*)?$/);
  if (prefixedMatch) {
    return prefixedMatch[1];
  }

  return "";
}

function normalizeReleaseType(value: unknown): ReleaseType | "" {
  return value === "single" || value === "ep" || value === "album" ? value : "";
}

function formatReleaseType(value?: ReleaseType | "") {
  if (value === "single") return "Single";
  if (value === "ep") return "EP";
  if (value === "album") return "Album";
  return "-";
}

function normalizeRightsClearanceTracks(
  value: unknown,
  defaultFormat: ClearanceFormat | ""
) {
  if (!Array.isArray(value)) {
    return isMusicReleaseClearanceIntake(defaultFormat)
      ? [createEmptyRightsClearanceTrack(1)]
      : [];
  }

  const normalized = value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const fallback = createEmptyRightsClearanceTrack(index + 1);
      const hasIsrc =
        candidate.has_isrc === "yes" || candidate.has_isrc === "no"
          ? candidate.has_isrc
          : "";

      return {
        ...fallback,
        local_id:
          typeof candidate.local_id === "string" && candidate.local_id.trim()
            ? candidate.local_id
            : fallback.local_id,
        order_number:
          typeof candidate.order_number === "number" && candidate.order_number > 0
            ? candidate.order_number
            : index + 1,
        title: getStringFieldValue(candidate, "title"),
        primary_artists:
          getStringFieldValue(candidate, "primary_artists") ||
          getStringFieldValue(candidate, "artists"),
        authors: getStringFieldValue(candidate, "authors"),
        publishers: getStringFieldValue(candidate, "publishers"),
        phonogram_owner:
          getStringFieldValue(candidate, "phonogram_owner") ||
          getStringFieldValue(candidate, "phonographic_producer"),
        has_isrc: hasIsrc,
        isrc_code:
          getStringFieldValue(candidate, "isrc_code") ||
          getStringFieldValue(candidate, "isrc"),
        notes_for_clearance:
          getStringFieldValue(candidate, "notes_for_clearance") ||
          getStringFieldValue(candidate, "lyrics"),
      } satisfies RightsClearanceTrackValues;
    })
    .filter(Boolean) as RightsClearanceTrackValues[];

  if (normalized.length === 0 && isMusicReleaseClearanceIntake(defaultFormat)) {
    return [createEmptyRightsClearanceTrack(1)];
  }

  return normalized;
}

function stripEmptyHydrationValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => stripEmptyHydrationValue(item))
      .filter((item) => {
        if (item == null) return false;
        if (typeof item === "string") return item.trim().length > 0;
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === "object") return Object.keys(item).length > 0;
        return true;
      });

    return cleaned;
  }

  if (value && typeof value === "object") {
    const cleaned = Object.entries(value).reduce<Record<string, unknown>>(
      (acc, [key, item]) => {
        const normalized = stripEmptyHydrationValue(item);
        if (normalized == null) {
          return acc;
        }

        if (typeof normalized === "string" && normalized.trim().length === 0) {
          return acc;
        }

        if (Array.isArray(normalized) && normalized.length === 0) {
          return acc;
        }

        if (
          typeof normalized === "object" &&
          !Array.isArray(normalized) &&
          Object.keys(normalized).length === 0
        ) {
          return acc;
        }

        acc[key] = normalized;
        return acc;
      },
      {}
    );

    return cleaned;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  return value;
}

function hasMeaningfulHydrationValue(value: unknown) {
  const normalized = stripEmptyHydrationValue(value);

  if (normalized == null) {
    return false;
  }

  if (typeof normalized === "string") {
    return normalized.trim().length > 0;
  }

  if (Array.isArray(normalized)) {
    return normalized.length > 0;
  }

  if (typeof normalized === "object") {
    return Object.keys(normalized).length > 0;
  }

  return true;
}

function normalizeHydratedRightsClearanceValues(
  value: unknown,
  previousValues: RightsClearanceFormValues
) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const rawTracks = Array.isArray(candidate.tracks) ? candidate.tracks : [];
  const inferredFormat =
    (candidate.request_type &&
    typeof candidate.request_type === "object" &&
    typeof (candidate.request_type as Record<string, unknown>).clearance_format ===
      "string"
      ? ((candidate.request_type as Record<string, unknown>)
          .clearance_format as ClearanceFormat)
      : undefined) ??
    (rawTracks.length > 0
      ? "music_release_clearance_intake"
      : inferClearanceFormatFromScope(
          (candidate.clearance_scope as Record<string, unknown>) ?? {}
        ));
  const nextValues = createInitialRightsClearanceValues({
    defaultFormat: inferredFormat,
  });
  const requesterIdentification =
    candidate.requester_identification &&
    typeof candidate.requester_identification === "object"
      ? {
          ...(candidate.requester_identification as Record<string, unknown>),
          requester_company:
            (candidate.requester_identification as Record<string, unknown>)
              .requester_company ??
            (candidate.requester_identification as Record<string, unknown>)
              .responsible_company ??
            "",
        }
      : {};
  const requestType =
    candidate.request_type && typeof candidate.request_type === "object"
      ? (candidate.request_type as Record<string, unknown>)
      : {
          clearance_format: inferredFormat,
        };
  const projectContext =
    candidate.project_context && typeof candidate.project_context === "object"
      ? {
          ...(candidate.project_context as Record<string, unknown>),
          client_or_distributor:
            (candidate.project_context as Record<string, unknown>)
              .client_or_distributor ??
            (candidate.project_context as Record<string, unknown>).distributor ??
            "",
          release_or_start_date: normalizeDateInputValue(
            (candidate.project_context as Record<string, unknown>)
              .release_or_start_date ??
              (candidate.project_context as Record<string, unknown>)
                .release_start_date
          ),
          release_type: normalizeReleaseType(
            (candidate.project_context as Record<string, unknown>).release_type
          ),
          has_brand_association:
            (candidate.project_context as Record<string, unknown>)
              .has_brand_association ??
            (candidate.project_context as Record<string, unknown>)
              .is_associated_with_brand ??
            "",
          brand_context:
            (candidate.project_context as Record<string, unknown>).brand_context ??
            (candidate.project_context as Record<string, unknown>)
              .brand_name_or_context ??
            "",
          general_clearance_notes:
            (candidate.project_context as Record<string, unknown>)
              .general_clearance_notes ??
            (candidate.project_context as Record<string, unknown>).general_notes ??
            "",
        }
      : {};
  const tracks = normalizeRightsClearanceTracks(rawTracks, inferredFormat);
  const clearanceScope =
    candidate.clearance_scope && typeof candidate.clearance_scope === "object"
      ? {
          ...(candidate.clearance_scope as Record<string, unknown>),
          material_type:
            (candidate.clearance_scope as Record<string, unknown>).material_type ??
            (candidate.clearance_scope as Record<string, unknown>)
              .licensed_materials ??
            "",
          sync_duration:
            (candidate.clearance_scope as Record<string, unknown>).sync_duration ??
            (candidate.clearance_scope as Record<string, unknown>).duration_sync ??
            "",
        }
      : {};
  const assetsReferences =
    candidate.assets_references && typeof candidate.assets_references === "object"
      ? {
          ...(candidate.assets_references as Record<string, unknown>),
          supporting_files:
            (candidate.assets_references as Record<string, unknown>)
              .supporting_files ??
            (candidate.assets_references as Record<string, unknown>)
              .additional_files ??
            [],
          additional_notes:
            (candidate.assets_references as Record<string, unknown>)
              .additional_notes ??
            (candidate.assets_references as Record<string, unknown>)
              .supporting_notes ??
            "",
        }
      : {};

  return {
    requester_identification: {
      ...nextValues.requester_identification,
      ...previousValues.requester_identification,
      ...requesterIdentification,
    },
    request_type: {
      ...nextValues.request_type,
      ...previousValues.request_type,
      ...requestType,
    },
    project_context: {
      ...nextValues.project_context,
      ...previousValues.project_context,
      ...projectContext,
    },
    tracks,
    clearance_scope: {
      ...nextValues.clearance_scope,
      ...previousValues.clearance_scope,
      ...clearanceScope,
    },
    assets_references: {
      ...nextValues.assets_references,
      ...previousValues.assets_references,
      ...assetsReferences,
    },
  };
}

function normalizeEditRightsClearancePayload(value: unknown) {
  function parseJsonString(input: unknown) {
    if (typeof input !== "string") {
      return input;
    }

    const trimmed = input.trim();
    if (!trimmed) {
      return null;
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      return input;
    }
  }

  function parseObject(input: unknown) {
    const parsed = parseJsonString(input);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  }

  function parseList(input: unknown) {
    const parsed = parseJsonString(input);
    return Array.isArray(parsed) ? parsed : [];
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const nestedPayload = parseObject(candidate.payload);

  const resolved =
    candidate.requester_identification ||
    candidate.request_type ||
    candidate.project_context ||
    candidate.tracks ||
    candidate.clearance_scope ||
    candidate.assets_references
      ? candidate
      : nestedPayload;

  if (!resolved) {
    return null;
  }

  return {
    draft_token:
      typeof candidate.draft_token === "string"
        ? candidate.draft_token
        : typeof resolved.draft_token === "string"
        ? resolved.draft_token
        : null,
    requester_identification:
      (stripEmptyHydrationValue(
        parseObject(resolved.requester_identification) ?? {}
      ) as Record<string, unknown>) ?? {},
    request_type:
      (stripEmptyHydrationValue(parseObject(resolved.request_type) ?? {}) as Record<
        string,
        unknown
      >) ?? {},
    project_context:
      (stripEmptyHydrationValue(parseObject(resolved.project_context) ?? {}) as Record<
        string,
        unknown
      >) ?? {},
    tracks:
      (stripEmptyHydrationValue(parseList(resolved.tracks)) as Array<unknown>) ?? [],
    clearance_scope:
      (stripEmptyHydrationValue(parseObject(resolved.clearance_scope) ?? {}) as Record<
        string,
        unknown
      >) ?? {},
    assets_references:
      (stripEmptyHydrationValue(parseObject(resolved.assets_references) ?? {}) as Record<
        string,
        unknown
      >) ?? {},
    debug:
      candidate.debug && typeof candidate.debug === "object"
        ? (candidate.debug as Record<string, unknown>)
        : null,
  };
}

function hasEditHydrationData(
  payload: ReturnType<typeof normalizeEditRightsClearancePayload>
) {
  if (!payload) {
    return false;
  }

  return Boolean(
    hasMeaningfulHydrationValue(payload.requester_identification) ||
      hasMeaningfulHydrationValue(payload.request_type) ||
      hasMeaningfulHydrationValue(payload.project_context) ||
      hasMeaningfulHydrationValue(payload.tracks) ||
      hasMeaningfulHydrationValue(payload.clearance_scope) ||
      hasMeaningfulHydrationValue(payload.assets_references)
  );
}

function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
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
          Obrigatorio
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
  const minValue = field.type === "date" ? getTodayDateValue() : undefined;
  const inputValue =
    field.type === "date" ? normalizeDateInputValue(value) : value;

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
          value={inputValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          min={minValue}
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

function IntroStep({
  clientName,
  logoUrl,
  title,
  text,
}: {
  clientName: string;
  logoUrl?: string;
  title: string;
  text: string;
}) {
  const paragraphs = splitMultilineText(text);

  return (
    <div className="max-w-2xl">
      <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-5 py-6 sm:px-6 sm:py-7">
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={clientName}
              className="h-16 w-auto object-contain sm:h-20"
            />
          ) : null}
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {clientName}
          </div>
        </div>

        <h3 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-[34px]">
          {title}
        </h3>

        <div className="mt-4 grid gap-4 text-[15px] leading-7 text-slate-600">
          {paragraphs.map((paragraph, index) => (
            <p key={`${paragraph}-${index}`}>{paragraph}</p>
          ))}
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-500">
          Clique em <strong>Comecar</strong> para seguir para o preenchimento.
        </p>
      </div>
    </div>
  );
}

function SubmissionCompleteStep({
  message,
  onRestart,
}: {
  message: string;
  onRestart: () => void;
}) {
  return (
    <div className="mt-12 border-t border-slate-200 pt-6">
      <div className="rounded-[28px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-8 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            Envio concluido
          </p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            Obrigado pelo preenchimento.
          </h3>
          <p className="mt-4 text-base leading-7 text-slate-600">{message}</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Se voce quiser registrar outra solicitacao, pode iniciar um novo
            preenchimento agora.
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={onRestart}
              className="rounded-xl border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-medium text-white"
            >
              Preencher novamente
            </button>
          </div>
        </div>
      </div>
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
      <div className="mt-2 text-sm leading-7 text-slate-800">
        {formatReviewValue(value)}
      </div>
    </div>
  );
}

function TrackTextField({
  label,
  value,
  error,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  type?: "text" | "date";
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel label={label} />
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
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
  error,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel label={label} />
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 min-h-[148px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-[15px] leading-7 text-slate-900 outline-none transition focus:border-slate-900"
      />
      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

export default function RightsClearancePage({
  workspaceSlug = rightsClearanceTemplate.workspaceSlug,
  workflowType = rightsClearanceTemplate.workflowType,
  formVersion = rightsClearanceTemplate.formVersion,
}: {
  workspaceSlug?: string;
  workflowType?: WorkflowType;
  formVersion?: FormVersion;
}) {
  const searchParams = useSearchParams();
  const resumeToken = searchParams.get("draft");
  const editToken = searchParams.get("edit_token");
  const defaultClearanceFormat = useMemo(
    () => getDefaultClearanceFormat(workspaceSlug),
    [workspaceSlug]
  );

  const [template, setTemplate] = useState(rightsClearanceTemplate);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);

  const [currentStep, setCurrentStep] =
    useState<RightsClearanceStepKey>("intro");
  const [values, setValues] = useState<RightsClearanceFormValues>(
    createInitialRightsClearanceValues({
      defaultFormat: defaultClearanceFormat,
    })
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftToken, setDraftToken] = useState<string | null>(resumeToken);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingSendDraftEmail, setLoadingSendDraftEmail] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false);

  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [isHydratingDraft, setIsHydratingDraft] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [draftNoticeType, setDraftNoticeType] =
    useState<DraftNoticeType>("success");
  const [draftLinkEmailSent, setDraftLinkEmailSent] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>(
    {}
  );

  const selectedClearanceFormat = values.request_type.clearance_format;
  const activeStepOrder = useMemo(
    () => getActiveStepOrder(selectedClearanceFormat),
    [selectedClearanceFormat]
  );
  const currentStepIndex = Math.max(activeStepOrder.indexOf(currentStep), 0);
  const currentStepMeta = template.steps.find((step) => step.key === currentStep);
  const stepLabels = useMemo(
    () =>
      activeStepOrder.map((key) => ({
        key,
        label:
          template.steps.find((step) => step.key === key)?.title ??
          key.replaceAll("_", " "),
      })),
    [activeStepOrder, template.steps]
  );
  const requestedRenderer = useMemo(
    () => resolveWorkflowRenderer(workflowType),
    [workflowType]
  );

  const didHydrateDraftRef = useRef(false);
  const didHydrateEditRef = useRef(false);
  const successCardRef = useRef<HTMLDivElement | null>(null);

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

  function setSectionField(
    section: keyof RightsClearanceFormValues,
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

  function setRequesterField(
    key: keyof RightsClearanceFormValues["requester_identification"],
    value: string
  ) {
    clearMessages();
    clearFieldError(`requester_identification.${key}`);
    setSectionField("requester_identification", key, value);
  }

  function setRequestTypeField(
    key: keyof RightsClearanceFormValues["request_type"],
    value: string
  ) {
    clearMessages();
    clearFieldError(`request_type.${key}`);
    setValues((prev) => {
      const nextFormat = value as ClearanceFormat | "";
      return {
        ...prev,
        request_type: {
          clearance_format: nextFormat,
        },
        tracks:
          key === "clearance_format" &&
          isMusicReleaseClearanceIntake(nextFormat) &&
          prev.tracks.length === 0
            ? [createEmptyRightsClearanceTrack(1)]
            : prev.tracks,
      };
    });
  }

  function setProjectContextField(
    key: keyof RightsClearanceFormValues["project_context"],
    value: string
  ) {
    clearMessages();
    clearFieldError(`project_context.${key}`);
    setSectionField("project_context", key, value);
  }

  function setClearanceField(
    key: keyof RightsClearanceFormValues["clearance_scope"],
    value: string
  ) {
    clearMessages();
    clearFieldError(`clearance_scope.${key}`);
    setSectionField("clearance_scope", key, value);
  }

  function setAssetsField(
    key: keyof RightsClearanceFormValues["assets_references"],
    value: string | UploadedFileRef[]
  ) {
    clearMessages();
    clearFieldError(`assets_references.${key}`);
    setSectionField("assets_references", key, value);
  }

  function updateTracks(
    updater: (tracks: RightsClearanceTrackValues[]) => RightsClearanceTrackValues[]
  ) {
    setValues((prev) => {
      const nextTracks = updater(prev.tracks).map((track, index) => ({
        ...track,
        order_number: index + 1,
      }));

      return {
        ...prev,
        tracks: nextTracks,
      };
    });
  }

  function addTrack() {
    clearMessages();
    updateTracks((tracks) => [
      ...tracks,
      createEmptyRightsClearanceTrack(tracks.length + 1),
    ]);
  }

  function removeTrack(localId: string) {
    clearMessages();
    updateTracks((tracks) => tracks.filter((track) => track.local_id !== localId));
    setErrors((prev) => {
      const next: Record<string, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        if (!key.startsWith("tracks.")) {
          next[key] = value;
        }
      });
      return next;
    });
  }

  function setTrackField(
    localId: string,
    key: keyof RightsClearanceTrackValues,
    value: string
  ) {
    clearMessages();
    updateTracks((tracks) =>
      tracks.map((track) =>
        track.local_id === localId
          ? {
              ...track,
              [key]: value,
              ...(key === "has_isrc" && value !== "yes" ? { isrc_code: "" } : {}),
            }
          : track
      )
    );
  }

  function ensureDraftToken() {
    if (draftToken) return draftToken;
    const generated = generateUuid();
    setDraftToken(generated);
    return generated;
  }

  function nextStep() {
    const nextIndex = Math.min(currentStepIndex + 1, activeStepOrder.length - 1);
    setCurrentStep(activeStepOrder[nextIndex]);
  }

  function prevStep() {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(activeStepOrder[prevIndex]);
  }

  function getFieldsForStep(stepKey: RightsClearanceStepKey) {
    const step = template.steps.find((item) => item.key === stepKey);
    if (!step) return [];

    if (stepKey === "project_context") {
      return step.fields.filter((field) => {
        if (isMusicReleaseClearanceIntake(selectedClearanceFormat)) {
          return !["project_synopsis", "has_brand_association", "brand_context"].includes(
            field.key
          );
        }

        if (["release_type", "general_clearance_notes"].includes(field.key)) {
          return false;
        }

        if (
          field.key === "brand_context" &&
          values.project_context.has_brand_association !== "yes"
        ) {
          return false;
        }
        return true;
      });
    }

    if (stepKey === "clearance_scope") {
      return step.fields.filter((field) => {
        if (
          MUSIC_PROJECT_TRACK_FIELDS.includes(
            field.key as (typeof MUSIC_PROJECT_TRACK_FIELDS)[number]
          )
        ) {
          return selectedClearanceFormat === "music_project_track";
        }

        if (
          AUDIOVISUAL_PRODUCT_SYNC_FIELDS.includes(
            field.key as (typeof AUDIOVISUAL_PRODUCT_SYNC_FIELDS)[number]
          )
        ) {
          return selectedClearanceFormat === "audiovisual_product_sync";
        }

        return true;
      });
    }

    return step.fields;
  }

  function validateStep(
    stepKey:
      | "requester_identification"
      | "request_type"
      | "project_context"
      | "tracks"
      | "clearance_scope"
      | "assets_references"
  ) {
    const errors: Record<string, string> = {};

    if (stepKey === "tracks") {
      if (!isMusicReleaseClearanceIntake(selectedClearanceFormat)) {
        return errors;
      }

      if (values.tracks.length === 0) {
        errors.tracks = "Adicione pelo menos uma faixa.";
        return errors;
      }

      values.tracks.forEach((track, index) => {
        const prefix = `tracks.${index}`;

        if (!track.title.trim()) {
          errors[`${prefix}.title`] = "Preencha o titulo da faixa.";
        }

        if (!track.primary_artists.trim()) {
          errors[`${prefix}.primary_artists`] =
            "Preencha os artistas principais.";
        }

        if (!track.authors.trim()) {
          errors[`${prefix}.authors`] = "Preencha os autores.";
        }

        if (!track.phonogram_owner.trim()) {
          errors[`${prefix}.phonogram_owner`] =
            "Preencha o titular do fonograma.";
        }

        if (!track.has_isrc) {
          errors[`${prefix}.has_isrc`] =
            "Selecione se a faixa ja possui codigo ISRC.";
        }

        if (track.has_isrc === "yes" && !track.isrc_code.trim()) {
          errors[`${prefix}.isrc_code`] =
            "Informe o codigo ISRC quando a faixa ja possuir registro.";
        }
      });

      return errors;
    }

    const fields = getFieldsForStep(stepKey);
    const sectionValues = values[stepKey] as Record<string, unknown>;

    fields.forEach((field) => {
      const path = `${stepKey}.${field.key}`;
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
              ? "Selecione uma opcao obrigatoria."
              : field.type === "file"
              ? "Envie um arquivo obrigatorio."
              : "Preencha este campo obrigatorio.";
          return;
        }
      }

      if (
        field.type === "email" &&
        typeof rawValue === "string" &&
        rawValue.trim().length > 0 &&
        !/\S+@\S+\.\S+/.test(rawValue)
      ) {
        errors[path] = "Informe um e-mail valido.";
      }
    });

    if (stepKey === "project_context") {
      if (
        isMusicReleaseClearanceIntake(selectedClearanceFormat) &&
        !values.project_context.release_type
      ) {
        errors["project_context.release_type"] =
          "Selecione o tipo de lancamento.";
      }

      if (
        isMusicReleaseClearanceIntake(selectedClearanceFormat) &&
        !values.project_context.general_clearance_notes.trim()
      ) {
        errors["project_context.general_clearance_notes"] =
          "Informe as observacoes gerais de clearance.";
      }

      if (
        !isMusicReleaseClearanceIntake(selectedClearanceFormat) &&
        values.project_context.has_brand_association === "yes" &&
        !values.project_context.brand_context.trim()
      ) {
        errors["project_context.brand_context"] =
          "Descreva a marca ou o contexto comercial associado.";
      }
    }

    return errors;
  }

  function validateBeforeSubmit() {
    return activeStepOrder.reduce<Record<string, string>>((acc, stepKey) => {
      if (stepKey === "intro" || stepKey === "review_submit") {
        return acc;
      }

      return {
        ...acc,
        ...validateStep(
          stepKey as
            | "requester_identification"
            | "request_type"
            | "project_context"
            | "tracks"
            | "clearance_scope"
            | "assets_references"
        ),
      };
    }, {});
  }

  async function uploadFile(args: {
    file: File;
    fieldPath: string;
  }): Promise<UploadedFileRef> {
    const stableDraftToken = ensureDraftToken();
    setFieldUploading(args.fieldPath, true);
    clearFieldError(args.fieldPath);

    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kind: "asset",
          fileName: args.file.name,
          mimeType: args.file.type,
          fileSize: args.file.size,
          workspaceSlug: template.workspaceSlug,
          draftToken: stableDraftToken,
        }),
      });

      const raw = await response.text();
      const data = parseJsonResponseText(raw);

      if (!response.ok) {
        throw new Error(getApiMessage(data, raw, "Falha ao preparar upload."));
      }

      const storageBucket =
        typeof data?.storage_bucket === "string" ? data.storage_bucket : "";
      const storagePath =
        typeof data?.storage_path === "string" ? data.storage_path : "";
      const signedUploadToken =
        typeof data?.signed_upload_token === "string"
          ? data.signed_upload_token
          : "";

      if (!storageBucket || !storagePath || !signedUploadToken) {
        throw new Error("Upload assinado indisponível para este arquivo.");
      }

      const supabase = createSupabaseBrowser();
      const { error: uploadError } = await supabase.storage
        .from(storageBucket)
        .uploadToSignedUrl(storagePath, signedUploadToken, args.file, {
          contentType: args.file.type || undefined,
        });

      if (uploadError) {
        throw new Error(uploadError.message || "Falha ao enviar arquivo.");
      }

      const fileId = typeof data?.file_id === "string" ? data.file_id : generateUuid();
      const fileName =
        typeof data?.file_name === "string" ? data.file_name : args.file.name;
      const publicUrl =
        typeof data?.public_url === "string" ? data.public_url : "";
      const downloadUrl =
        typeof data?.download_url === "string" ? data.download_url : "";
      const mimeType =
        typeof data?.mime_type === "string" ? data.mime_type : args.file.type;
      const sizeBytes =
        typeof data?.size_bytes === "number" ? data.size_bytes : args.file.size;

      return {
        file_id: fileId,
        file_name: fileName,
        storage_bucket: storageBucket || undefined,
        storage_path: storagePath,
        public_url: publicUrl,
        download_url: downloadUrl,
        mime_type: mimeType,
        size_bytes: sizeBytes,
      };
    } finally {
      setFieldUploading(args.fieldPath, false);
    }
  }

  async function handleAssetsFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    try {
      const uploaded: UploadedFileRef[] = [];

      for (const file of files) {
        uploaded.push(
          await uploadFile({
            file,
            fieldPath: "assets_references.supporting_files",
          })
        );
      }

      setAssetsField("supporting_files", [
        ...values.assets_references.supporting_files,
        ...uploaded,
      ]);
    } catch (error: any) {
      setFieldError(
        "assets_references.supporting_files",
        error?.message || "Nao foi possivel enviar os arquivos."
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
        setValues((prev) => {
          const nextValues = normalizeHydratedRightsClearanceValues(
            hydratedValues,
            prev
          );
          return nextValues ?? prev;
        });
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

      setAutosaveState("saved");
    } catch (error) {
      console.error("Draft load failed", error);
    } finally {
      setIsHydratingDraft(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadTemplate() {
      try {
        const resolved = await getWorkflowTemplate({
          workspaceSlug,
          workflowType,
          formVersion,
        });
        if (mounted) {
          setTemplate(resolved);
        }
      } catch (error) {
        console.error("Failed to load workflow template", error);
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
  }, [formVersion, workflowType, workspaceSlug]);

  useEffect(() => {
    if (activeStepOrder.includes(currentStep)) {
      return;
    }

    setCurrentStep(activeStepOrder[activeStepOrder.length - 1] ?? "intro");
  }, [activeStepOrder, currentStep]);

  useEffect(() => {
    if (!draftNotice) return;

    const timeout = setTimeout(() => {
      setDraftNotice(null);
    }, 3500);

    return () => clearTimeout(timeout);
  }, [draftNotice]);

  useEffect(() => {
    if (!resumeToken || didHydrateDraftRef.current) return;
    didHydrateDraftRef.current = true;
    loadDraft(resumeToken);
  }, [resumeToken]);

  useEffect(() => {
    if (!editToken || didHydrateEditRef.current) return;
    didHydrateEditRef.current = true;

    async function loadEditSubmission() {
      try {
        setSubmitError(null);
        const response = await fetch(`/api/submissions/edit/${editToken}`, {
          method: "GET",
          cache: "no-store",
        });

        const raw = await response.text();
        const data = raw ? JSON.parse(raw) : null;
        console.info("[rights clearance edit] raw response body", data);

        if (!response.ok) {
          throw new Error(
            data?.detail || data?.message || "Falha ao carregar a submissao."
          );
        }

        const payload = normalizeEditRightsClearancePayload(data?.data ?? data);
        console.info("[rights clearance edit] normalized payload", payload);

        if (!hasEditHydrationData(payload)) {
          setSubmitError(
            "Nao foi possivel reidratar os dados desta submissao para edicao."
          );
          return;
        }

        setValues((prev) => {
          const nextValues = normalizeHydratedRightsClearanceValues(payload, prev);
          return nextValues ?? prev;
        });

        if (payload?.draft_token) {
          setDraftToken(payload.draft_token);
        }

        setCurrentStep("review_submit");
      } catch (error: any) {
        console.error("Edit submission load failed", error);
        setSubmitError(
          error?.message || "Nao foi possivel carregar a submissao para edicao."
        );
      }
    }

    loadEditSubmission();
  }, [editToken]);

  useEffect(() => {
    if (!draftToken) return;
    if (!values.requester_identification.requester_email.trim()) return;
    if (isHydratingDraft) return;
    if (isLoadingTemplate) return;
    if (editToken) return;

    const timeout = setTimeout(async () => {
      try {
        setAutosaveState("saving");

        const payload = buildWorkflowDraftPayload({
          draftToken,
          workspaceSlug: template.workspaceSlug,
          workflowType: template.workflowType,
          formVersion: template.formVersion,
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
    currentStep,
    draftToken,
    editToken,
    isHydratingDraft,
    isLoadingTemplate,
    template.formVersion,
    template.workflowType,
    template.workspaceSlug,
    values,
  ]);

  useEffect(() => {
    if (!isSubmissionComplete) return;
    successCardRef.current?.focus({ preventScroll: true });
  }, [isSubmissionComplete]);

  const requesterValidation = validateStep("requester_identification");
  const isRequesterStepComplete = Object.keys(requesterValidation).length === 0;
  const canShowDraftButtons = currentStepIndex >= 2 && isRequesterStepComplete;

  function validateCurrentStep() {
    switch (currentStep) {
      case "requester_identification":
        return validateStep("requester_identification");
      case "request_type":
        return validateStep("request_type");
      case "project_context":
        return validateStep("project_context");
      case "tracks":
        return validateStep("tracks");
      case "clearance_scope":
        return validateStep("clearance_scope");
      case "assets_references":
        return validateStep("assets_references");
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

    if (currentStep === "requester_identification") {
      ensureDraftToken();
    }

    nextStep();
  }

  async function handleSaveDraft() {
    if (!isRequesterStepComplete) {
      showDraftNotice(
        "Preencha a etapa de solicitante antes de salvar o rascunho.",
        "error"
      );
      return;
    }

    try {
      const token = ensureDraftToken();

      const payload = buildWorkflowDraftPayload({
        draftToken: token,
        workspaceSlug: template.workspaceSlug,
        workflowType: template.workflowType,
        formVersion: template.formVersion,
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
    } catch (error: any) {
      console.error(error);
      showDraftNotice(
        error?.message || "Nao foi possivel salvar o rascunho.",
        "error"
      );
    }
  }

  async function handleSendDraftEmail() {
    if (!isRequesterStepComplete) {
      showDraftNotice(
        "Preencha a etapa de solicitante antes de enviar o rascunho por email.",
        "error"
      );
      return;
    }

    if (draftLinkEmailSent) {
      showDraftNotice("O link do rascunho ja foi enviado por email.", "success");
      return;
    }

    try {
      setLoadingSendDraftEmail(true);

      const token = ensureDraftToken();

      const savePayload = buildWorkflowDraftPayload({
        draftToken: token,
        workspaceSlug: template.workspaceSlug,
        workflowType: template.workflowType,
        formVersion: template.formVersion,
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
          workflow_type: template.workflowType,
          to_email: values.requester_identification.requester_email,
          recipient_name: values.requester_identification.requester_name,
          project_title: values.project_context.project_title,
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
        showDraftNotice("O link do rascunho ja havia sido enviado por email.", "success");
      } else {
        showDraftNotice("Link do rascunho enviado por email com sucesso.", "success");
      }
    } catch (error: any) {
      console.error(error);
      showDraftNotice(
        error?.message || "Nao foi possivel enviar o link do rascunho por email.",
        "error"
      );
    } finally {
      setLoadingSendDraftEmail(false);
    }
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
      const payload = buildWorkflowSubmitPayload({
        draftToken: ensureDraftToken(),
        workspaceSlug: template.workspaceSlug,
        workflowType: template.workflowType,
        formVersion: template.formVersion,
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
          "Seu formulario foi enviado com sucesso. O time da Atabaque dara continuidade a analise de clearance."
      );
      setIsSubmissionComplete(true);
    } catch (error: any) {
      setSubmitError(error?.message ?? "Falha ao enviar o formulario.");
    } finally {
      setLoadingSubmit(false);
    }
  }

  function resetAfterSubmission() {
    setValues(
      createInitialRightsClearanceValues({
        defaultFormat: defaultClearanceFormat,
      })
    );
    setErrors({});
    setCurrentStep("intro");
    setDraftToken(null);
    setAutosaveState("idle");
    setDraftNotice(null);
    setDraftNoticeType("success");
    setDraftLinkEmailSent(false);
    setUploadingFields({});
    setSubmitMessage(null);
    setSubmitError(null);
    setIsSubmissionComplete(false);

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function renderSectionField(
    stepKey:
      | "requester_identification"
      | "request_type"
      | "project_context"
      | "clearance_scope"
      | "assets_references",
    fieldKey: string
  ) {
    const field = getFieldsForStep(stepKey).find((item) => item.key === fieldKey);
    if (!field) return null;

    if (field.key === "supporting_files") {
      return (
        <FileField
          key={field.key}
          label={field.label}
          helperText={field.helperText}
          required={field.required}
          error={errors[`assets_references.${field.key}`]}
          fileName={
            values.assets_references.supporting_files.length > 0
              ? `${values.assets_references.supporting_files.length} arquivo(s) selecionado(s)`
              : ""
          }
          accept=".jpg,.jpeg,.png,.pdf,.zip,image/jpeg,image/png,application/pdf,application/zip"
          isUploading={Boolean(uploadingFields["assets_references.supporting_files"])}
          multiple
          onChange={handleAssetsFiles}
        />
      );
    }

    const sectionValues = values[stepKey] as Record<string, unknown>;

    return (
      <FormFieldRenderer
        key={field.key}
        field={field}
        value={getStringFieldValue(sectionValues, field.key)}
        error={errors[`${stepKey}.${field.key}`]}
        onChange={(value) => {
          if (stepKey === "requester_identification") {
            setRequesterField(
              field.key as keyof RightsClearanceFormValues["requester_identification"],
              value
            );
            return;
          }

          if (stepKey === "project_context") {
            setProjectContextField(
              field.key as keyof RightsClearanceFormValues["project_context"],
              value
            );
            return;
          }

          if (stepKey === "request_type") {
            setRequestTypeField(
              field.key as keyof RightsClearanceFormValues["request_type"],
              value
            );
            return;
          }

          if (stepKey === "clearance_scope") {
            setClearanceField(
              field.key as keyof RightsClearanceFormValues["clearance_scope"],
              value
            );
            return;
          }

          setAssetsField(
            field.key as keyof RightsClearanceFormValues["assets_references"],
            value
          );
        }}
      />
    );
  }

  const autosaveLabel =
    autosaveState === "saving"
      ? "Salvando rascunho"
      : autosaveState === "saved"
      ? "Rascunho salvo"
      : autosaveState === "error"
      ? "Erro ao salvar"
      : null;

  if (isLoadingTemplate) {
    return (
      <div className="min-h-screen bg-[#ebdbba] px-4 py-16">
        <div className="mx-auto max-w-2xl text-center text-sm text-slate-500">
          Carregando formulario...
        </div>
      </div>
    );
  }

  if (requestedRenderer !== "rights_clearance") {
    return (
      <div className="min-h-screen bg-[#ebdbba] px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white px-6 py-7 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {workspaceSlug}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-900">
            Workflow ainda nao renderizavel nesta tela
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            O workflow <strong>{workflowType}</strong> nao esta ligado ao renderer
            de rights clearance esperado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ebdbba] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {currentStep !== "intro" && template.intro.logoUrl ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <img
                  src={template.intro.logoUrl}
                  alt={template.intro.clientName}
                  className="h-10 w-auto object-contain"
                />
              </div>
            ) : null}

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {template.intro.clientName}
              </div>
              {currentStep !== "intro" ? (
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Formulario restrito ao time e aos parceiros autorizados. Preencha
                  os dados do pedido de clearance e envie para revisao da equipe.
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {autosaveLabel ? (
              <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                {autosaveLabel}
              </div>
            ) : null}

            {(editToken || draftToken) && (
              <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                {editToken ? "Modo edicao ativo" : "Rascunho carregado"}
              </div>
            )}
          </div>
        </header>

        <div className="mb-6 overflow-x-auto">
          <div className="flex min-w-[720px] items-center gap-3 pb-1">
            {stepLabels.map((item, index) => {
              const active = item.key === currentStep;
              const completed = index < currentStepIndex;

              return (
                <Fragment key={item.key}>
                  <div className="flex min-w-[92px] flex-col items-center gap-2 text-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : completed
                          ? "border-slate-300 bg-white text-slate-900"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {completed ? "✓" : index + 1}
                    </div>

                    <div
                      className={`text-sm font-medium ${
                        active
                          ? "text-slate-900"
                          : completed
                          ? "text-slate-700"
                          : "text-slate-400"
                      }`}
                    >
                      {item.label}
                    </div>
                  </div>

                  {index < stepLabels.length - 1 ? (
                    <div
                      className={`h-px min-w-[36px] flex-1 ${
                        completed ? "bg-slate-900" : "bg-slate-200"
                      }`}
                    />
                  ) : null}
                </Fragment>
              );
            })}
          </div>
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-7 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-8">
          {currentStep === "intro" && (
            <IntroStep
              clientName={template.intro.clientName}
              logoUrl={template.intro.logoUrl}
              title={template.intro.formTitle}
              text={template.intro.introText}
            />
          )}

          {currentStep !== "intro" && (
            <div className="mb-8 border-b border-slate-200 pb-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Etapa {currentStepIndex + 1}
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">
                {currentStepMeta?.title ?? "Etapa"}
              </h2>
              {currentStep === "review_submit" ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Revise o contexto do projeto e o escopo de clearance antes de
                  concluir o envio.
                </p>
              ) : null}
            </div>
          )}

          {currentStep === "requester_identification" && (
            <div className="grid gap-7">
              {currentStepMeta?.fields.map((field) => (
                <FormFieldRenderer
                  key={field.key}
                  field={field}
                  value={getStringFieldValue(
                    values.requester_identification,
                    field.key
                  )}
                  error={errors[`requester_identification.${field.key}`]}
                  onChange={(value) =>
                    setRequesterField(
                      field.key as keyof RightsClearanceFormValues["requester_identification"],
                      value
                    )
                  }
                />
              ))}
            </div>
          )}

          {currentStep === "request_type" && (
            <div className="grid gap-7">
              {currentStepMeta?.fields.map((field) => (
                <FormFieldRenderer
                  key={field.key}
                  field={field}
                  value={getStringFieldValue(values.request_type, field.key)}
                  error={errors[`request_type.${field.key}`]}
                  onChange={(value) =>
                    setRequestTypeField(
                      field.key as keyof RightsClearanceFormValues["request_type"],
                      value
                    )
                  }
                />
              ))}
            </div>
          )}

          {currentStep === "project_context" && (
            <div className="grid gap-7">
              <div className="grid gap-7 md:grid-cols-2">
                {renderSectionField("project_context", "project_title")}
                {renderSectionField("project_context", "responsible_company")}
              </div>

              {renderSectionField("project_context", "client_or_distributor")}
              {renderSectionField("project_context", "release_or_start_date")}

              {isMusicReleaseClearanceIntake(selectedClearanceFormat) ? (
                <>
                  {renderSectionField("project_context", "release_type")}
                  {renderSectionField(
                    "project_context",
                    "general_clearance_notes"
                  )}
                </>
              ) : (
                <>
                  {renderSectionField("project_context", "project_synopsis")}
                  {renderSectionField("project_context", "has_brand_association")}

                  {values.project_context.has_brand_association === "yes"
                    ? renderSectionField("project_context", "brand_context")
                    : null}
                </>
              )}
            </div>
          )}

          {currentStep === "tracks" && (
            <div className="grid gap-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                Liste as faixas do projeto com os dados essenciais para alimentar
                a base da Atabaque. Nao inclua marketing nem presskit nesta trilha.
              </div>

              {errors.tracks ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errors.tracks}
                </div>
              ) : null}

              <div className="grid gap-6">
                {values.tracks.map((track, index) => (
                  <div
                    key={track.local_id}
                    className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5"
                  >
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Faixa {index + 1}
                        </div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">
                          {track.title.trim() || "Nova faixa"}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeTrack(track.local_id)}
                        disabled={values.tracks.length === 1}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="grid gap-6">
                      <TrackTextField
                        label="Titulo da faixa"
                        value={track.title}
                        error={errors[`tracks.${index}.title`]}
                        placeholder="Nome da faixa"
                        onChange={(value) =>
                          setTrackField(track.local_id, "title", value)
                        }
                      />

                      <div className="grid gap-6 md:grid-cols-2">
                        <TrackTextField
                          label="Artistas principais"
                          value={track.primary_artists}
                          error={errors[`tracks.${index}.primary_artists`]}
                          placeholder="Nome artistico principal"
                          onChange={(value) =>
                            setTrackField(track.local_id, "primary_artists", value)
                          }
                        />
                        <TrackTextField
                          label="Autores"
                          value={track.authors}
                          error={errors[`tracks.${index}.authors`]}
                          placeholder="Compositores e autores"
                          onChange={(value) =>
                            setTrackField(track.local_id, "authors", value)
                          }
                        />
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <TrackTextField
                          label="Publishers"
                          value={track.publishers}
                          error={errors[`tracks.${index}.publishers`]}
                          placeholder="Editoras ou publishing"
                          onChange={(value) =>
                            setTrackField(track.local_id, "publishers", value)
                          }
                        />
                        <TrackTextField
                          label="Titular do fonograma"
                          value={track.phonogram_owner}
                          error={errors[`tracks.${index}.phonogram_owner`]}
                          placeholder="Quem controla o master"
                          onChange={(value) =>
                            setTrackField(track.local_id, "phonogram_owner", value)
                          }
                        />
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <FormFieldRenderer
                          field={{
                            key: "has_isrc",
                            label: "A faixa ja possui ISRC?",
                            type: "select",
                            required: true,
                            options: [
                              { label: "Selecione", value: "" },
                              { label: "Sim", value: "yes" },
                              { label: "Nao", value: "no" },
                            ],
                          }}
                          value={track.has_isrc}
                          error={errors[`tracks.${index}.has_isrc`]}
                          onChange={(value) =>
                            setTrackField(track.local_id, "has_isrc", value)
                          }
                        />

                        {track.has_isrc === "yes" ? (
                          <TrackTextField
                            label="Codigo ISRC"
                            value={track.isrc_code}
                            error={errors[`tracks.${index}.isrc_code`]}
                            placeholder="BR-XXX-00-00000"
                            onChange={(value) =>
                              setTrackField(track.local_id, "isrc_code", value)
                            }
                          />
                        ) : (
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-500">
                            Se a faixa ainda nao possui ISRC, podemos seguir sem o
                            codigo neste momento.
                          </div>
                        )}
                      </div>

                      <TrackTextareaField
                        label="Notas para clearance"
                        value={track.notes_for_clearance}
                        error={errors[`tracks.${index}.notes_for_clearance`]}
                        placeholder="Observacoes relevantes para o time juridico ou de clearance."
                        onChange={(value) =>
                          setTrackField(track.local_id, "notes_for_clearance", value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <button
                  type="button"
                  onClick={addTrack}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-900"
                >
                  Adicionar faixa
                </button>
              </div>
            </div>
          )}

          {currentStep === "clearance_scope" && (
            <div className="grid gap-7">
              <div className="grid gap-7 md:grid-cols-2">
                {renderSectionField("clearance_scope", "music_title")}
                {renderSectionField("clearance_scope", "artist_name")}
              </div>

              <div className="grid gap-7 md:grid-cols-2">
                {renderSectionField("clearance_scope", "phonogram_owner")}
                {renderSectionField("clearance_scope", "territory")}
              </div>

              {selectedClearanceFormat === "music_project_track" ? (
                <>
                  {renderSectionField("clearance_scope", "composer_author_info")}
                  {renderSectionField("clearance_scope", "publisher_info")}
                  <div className="grid gap-7 md:grid-cols-2">
                    {renderSectionField("clearance_scope", "material_type")}
                    {renderSectionField("clearance_scope", "exclusivity")}
                  </div>
                  {renderSectionField("clearance_scope", "intended_use")}
                </>
              ) : null}

              {selectedClearanceFormat === "audiovisual_product_sync" ? (
                <>
                  <div className="grid gap-7 md:grid-cols-2">
                    {renderSectionField("clearance_scope", "audiovisual_type")}
                    {renderSectionField("clearance_scope", "director_name")}
                  </div>
                  {renderSectionField(
                    "clearance_scope",
                    "product_or_campaign_name"
                  )}
                  {renderSectionField("clearance_scope", "scene_description")}
                  <div className="grid gap-7 md:grid-cols-2">
                    {renderSectionField("clearance_scope", "sync_duration")}
                    {renderSectionField("clearance_scope", "media_channels")}
                  </div>
                </>
              ) : null}

              {selectedClearanceFormat ? (
                renderSectionField("clearance_scope", "licensing_period")
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Selecione o formato do pedido para liberar os campos corretos
                  de clearance.
                </div>
              )}
            </div>
          )}

          {currentStep === "assets_references" && (
            <div className="grid gap-7">
              {renderSectionField("assets_references", "supporting_files")}
              {renderSectionField("assets_references", "reference_links")}
              {renderSectionField("assets_references", "additional_notes")}
            </div>
          )}

          {currentStep === "review_submit" && (
            <div className="grid gap-6">
              <ReviewSection title="Solicitante">
                <ReviewItem
                  label="Nome"
                  value={values.requester_identification.requester_name}
                />
                <ReviewItem
                  label="Email"
                  value={values.requester_identification.requester_email}
                />
                <ReviewItem
                  label="Empresa"
                  value={values.requester_identification.requester_company}
                />
                <ReviewItem
                  label="Papel no projeto"
                  value={values.requester_identification.requester_role}
                />
              </ReviewSection>

              <ReviewSection title="Formato do pedido">
                <ReviewItem
                  label="Formato"
                  value={
                    values.request_type.clearance_format ===
                    "music_release_clearance_intake"
                      ? "Lancamento musical / projeto + faixas"
                      : values.request_type.clearance_format ===
                        "audiovisual_product_sync"
                      ? "Audiovisual / produto / sync"
                      : values.request_type.clearance_format ===
                        "music_project_track"
                      ? "Projeto musical / faixa"
                      : ""
                  }
                />
              </ReviewSection>

              <ReviewSection title="Contexto do projeto">
                <ReviewItem
                  label="Titulo do projeto"
                  value={values.project_context.project_title}
                />
                <ReviewItem
                  label="Empresa responsavel"
                  value={values.project_context.responsible_company}
                />
                <ReviewItem
                  label="Cliente / distribuidora"
                  value={values.project_context.client_or_distributor}
                />
                <ReviewItem
                  label="Data prevista"
                  value={values.project_context.release_or_start_date}
                />
                {isMusicReleaseClearanceIntake(selectedClearanceFormat) ? (
                  <>
                    <ReviewItem
                      label="Tipo de lancamento"
                      value={formatReleaseType(values.project_context.release_type)}
                    />
                    <ReviewItem
                      label="Observacoes gerais de clearance"
                      value={values.project_context.general_clearance_notes}
                    />
                  </>
                ) : (
                  <>
                    <ReviewItem
                      label="Associacao com marca"
                      value={values.project_context.has_brand_association}
                    />
                    <ReviewItem
                      label="Marca ou contexto"
                      value={values.project_context.brand_context}
                    />
                    <ReviewItem
                      label="Sinopse"
                      value={values.project_context.project_synopsis}
                    />
                  </>
                )}
              </ReviewSection>

              {isMusicReleaseClearanceIntake(selectedClearanceFormat) ? (
                <ReviewSection title="Faixas do projeto">
                  {values.tracks.map((track, index) => (
                    <div
                      key={track.local_id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="mb-3 text-sm font-semibold text-slate-900">
                        Faixa {index + 1}
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <ReviewItem label="Titulo" value={track.title} />
                        <ReviewItem
                          label="Artistas principais"
                          value={track.primary_artists}
                        />
                        <ReviewItem label="Autores" value={track.authors} />
                        <ReviewItem label="Publishers" value={track.publishers} />
                        <ReviewItem
                          label="Titular do fonograma"
                          value={track.phonogram_owner}
                        />
                        <ReviewItem
                          label="Possui ISRC"
                          value={track.has_isrc}
                        />
                        <ReviewItem
                          label="Codigo ISRC"
                          value={track.isrc_code}
                        />
                        <ReviewItem
                          label="Notas para clearance"
                          value={track.notes_for_clearance}
                        />
                      </div>
                    </div>
                  ))}
                </ReviewSection>
              ) : (
                <>
                  <ReviewSection title="Escopo de clearance">
                    <ReviewItem
                      label="Titulo da musica"
                      value={values.clearance_scope.music_title}
                    />
                    <ReviewItem
                      label="Artista"
                      value={values.clearance_scope.artist_name}
                    />
                    <ReviewItem
                      label="Titular do fonograma"
                      value={values.clearance_scope.phonogram_owner}
                    />
                    <ReviewItem
                      label="Territorio"
                      value={values.clearance_scope.territory}
                    />
                    <ReviewItem
                      label="Periodo de licenciamento"
                      value={values.clearance_scope.licensing_period}
                    />
                    {selectedClearanceFormat === "music_project_track" ? (
                      <>
                        <ReviewItem
                          label="Compositores / autores"
                          value={values.clearance_scope.composer_author_info}
                        />
                        <ReviewItem
                          label="Editoras / publishing"
                          value={values.clearance_scope.publisher_info}
                        />
                        <ReviewItem
                          label="Tipo de material"
                          value={values.clearance_scope.material_type}
                        />
                        <ReviewItem
                          label="Uso pretendido"
                          value={values.clearance_scope.intended_use}
                        />
                        <ReviewItem
                          label="Exclusividade"
                          value={values.clearance_scope.exclusivity}
                        />
                      </>
                    ) : null}
                    {selectedClearanceFormat === "audiovisual_product_sync" ? (
                      <>
                        <ReviewItem
                          label="Tipo de audiovisual"
                          value={values.clearance_scope.audiovisual_type}
                        />
                        <ReviewItem
                          label="Direcao"
                          value={values.clearance_scope.director_name}
                        />
                        <ReviewItem
                          label="Produto / campanha / peca"
                          value={values.clearance_scope.product_or_campaign_name}
                        />
                        <ReviewItem
                          label="Descricao da cena"
                          value={values.clearance_scope.scene_description}
                        />
                        <ReviewItem
                          label="Duracao de sync"
                          value={values.clearance_scope.sync_duration}
                        />
                        <ReviewItem
                          label="Canais e meios"
                          value={values.clearance_scope.media_channels}
                        />
                      </>
                    ) : null}
                  </ReviewSection>

                  <ReviewSection title="Assets e referencias">
                    <ReviewItem
                      label="Arquivos anexados"
                      value={
                        values.assets_references.supporting_files.length > 0
                          ? values.assets_references.supporting_files
                              .map((file) => file.file_name)
                              .join(", ")
                          : "-"
                      }
                    />
                    <ReviewItem
                      label="Links de referencia"
                      value={values.assets_references.reference_links}
                    />
                    <ReviewItem
                      label="Observacoes adicionais"
                      value={values.assets_references.additional_notes}
                    />
                  </ReviewSection>
                </>
              )}
            </div>
          )}

          {submitError ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          {draftNotice ? (
            <div
              className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
                draftNoticeType === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {draftNotice}
            </div>
          ) : null}

          {isSubmissionComplete ? (
            <div ref={successCardRef} tabIndex={-1}>
              <SubmissionCompleteStep
                message={submitMessage || template.successMessage}
                onRestart={resetAfterSubmission}
              />
            </div>
          ) : (
            <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3">
                {currentStep !== "intro" ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-900"
                  >
                    Voltar
                  </button>
                ) : null}

                {canShowDraftButtons ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-900"
                    >
                      Salvar rascunho
                    </button>

                    <button
                      type="button"
                      onClick={handleSendDraftEmail}
                      disabled={loadingSendDraftEmail}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingSendDraftEmail
                        ? "Enviando link..."
                        : "Enviar link do rascunho"}
                    </button>
                  </>
                ) : null}
              </div>

              {currentStep === "review_submit" ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loadingSubmit}
                  className="rounded-xl border border-slate-900 bg-slate-900 px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingSubmit ? "Enviando..." : "Concluir envio"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="rounded-xl border border-slate-900 bg-slate-900 px-6 py-3 text-sm font-medium text-white"
                >
                  {currentStep === "intro" ? "Comecar" : "Continuar"}
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
