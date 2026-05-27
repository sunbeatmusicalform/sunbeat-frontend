import type {
  FormVersion,
  ReleaseType,
  WorkflowType,
  YesNo,
} from "../form-engine/types";
import type { TrackStatus } from "../form-engine/track-types";
import type {
  ReleaseIntakeSchemaTrackValue,
  ReleaseIntakeSchemaValues,
} from "./release-intake.draft-adapter";

export type ReleaseIntakeSubmitAdapterOptions = {
  draftToken?: string | null;
  workspaceSlug?: string;
  workflowType?: WorkflowType;
  formVersion?: FormVersion;
  submittedAt?: string;
};

export type ReleaseIntakeSubmitPayloadCandidate = {
  draft_token?: string | null;
  workspace_slug: string;
  workflow_type: WorkflowType;
  identification: {
    submitter_name: string;
    submitter_email: string;
    project_title: string;
    release_type: ReleaseType | "";
  };
  project: {
    release_date?: string;
    genre?: string;
    explicit_content?: YesNo;
    tiktok_snippet?: string;
    cover_link?: string;
    promo_assets_link?: string;
    presskit_link?: string;
    has_video_asset?: YesNo;
    video_link?: string;
    video_release_date?: string;
  };
  tracks: ReleaseIntakeSubmitTrackCandidate[];
  marketing?: ReleaseIntakeSubmitMarketingCandidate;
  meta: {
    form_version: FormVersion;
    source: string;
    submitted_at?: string;
    adapter: "release_intake_schema_submit_parity_v0";
  };
};

export type ReleaseIntakeSubmitTrackCandidate = {
  local_id: string;
  order_number: number;
  title: string;
  is_focus_track: boolean;
  primary_artists: string;
  featured_artists?: string;
  interpreters?: string;
  authors: string;
  publishers?: string;
  producers_musicians?: string;
  phonographic_producer?: string;
  has_isrc?: YesNo;
  isrc_code?: string;
  explicit_content?: YesNo;
  tiktok_snippet?: string;
  lyrics?: string;
  track_status: TrackStatus;
};

export type ReleaseIntakeSubmitMarketingCandidate = {
  marketing_numbers?: string;
  marketing_focus?: string;
  marketing_objectives?: string;
  has_marketing_budget?: YesNo;
  marketing_budget?: string;
  focus_track_name?: string;
  date_flexibility?: string;
  has_special_guests?: YesNo;
  special_guests_bio?: string;
  feat_will_promote?: YesNo;
  promotion_participants?: string;
  influencers_brands_partners?: string;
  general_notes?: string;
};

export type ReleaseIntakeSubmitParityStatus =
  | "preserved"
  | "excluded_visual_only"
  | "needs_upload_parity"
  | "needs_decision"
  | "computed_visual_only";

export type ReleaseIntakeSubmitParityFinding = {
  code: string;
  field: string;
  status: ReleaseIntakeSubmitParityStatus;
  message: string;
  schemaPath?: string;
  payloadPath?: string;
};

export type ReleaseIntakeSubmitParitySummary = {
  payloadCandidate: ReleaseIntakeSubmitPayloadCandidate;
  preservedFields: string[];
  findings: ReleaseIntakeSubmitParityFinding[];
  counts: Record<ReleaseIntakeSubmitParityStatus, number>;
};

const DEFAULT_OPTIONS = {
  draftToken: "schema-submit-parity-draft",
  workspaceSlug: "atabaque",
  workflowType: "release_intake",
  formVersion: "schema_submit_parity_v0",
  submittedAt: "2026-05-26T00:00:00.000Z",
} as const;

const PRESERVED_FIELDS = [
  "identification.submitter_name",
  "identification.submitter_email",
  "identification.project_title",
  "identification.release_type",
  "project.release_date",
  "project.genre",
  "project.explicit_content",
  "project.tiktok_snippet",
  "project.cover_link",
  "project.promo_assets_link",
  "project.presskit_link",
  "project.has_video_asset",
  "project.video_link",
  "project.video_release_date",
  "tracks[].local_id",
  "tracks[].order_number",
  "tracks[].title",
  "tracks[].primary_artists",
  "tracks[].featured_artists",
  "tracks[].interpreters",
  "tracks[].authors",
  "tracks[].publishers",
  "tracks[].producers_musicians",
  "tracks[].phonographic_producer",
  "tracks[].has_isrc",
  "tracks[].isrc_code",
  "tracks[].explicit_content",
  "tracks[].tiktok_snippet",
  "tracks[].lyrics",
  "marketing.marketing_numbers",
  "marketing.marketing_focus",
  "marketing.marketing_objectives",
  "marketing.has_marketing_budget",
  "marketing.marketing_budget",
  "marketing.focus_track_name",
  "marketing.date_flexibility",
  "marketing.has_special_guests",
  "marketing.special_guests_bio",
  "marketing.feat_will_promote",
  "marketing.promotion_participants",
  "marketing.influencers_brands_partners",
  "marketing.general_notes",
] as const;

function cleanString(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function cleanRequiredString(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeDateInputValue(value: string | null | undefined) {
  const normalized = cleanString(value);
  if (!normalized) return undefined;

  const directMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (directMatch) return directMatch[1];

  const prefixedMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s].*)?$/);
  return prefixedMatch ? prefixedMatch[1] : undefined;
}

function cleanYesNo(value: YesNo | "" | null | undefined) {
  return value === "yes" || value === "no" ? value : undefined;
}

function buildSource(
  workspaceSlug: string,
  workflowType: WorkflowType,
  formVersion: FormVersion
) {
  return `sunbeat.${workspaceSlug}.${workflowType}.${formVersion}`;
}

function hasAnyValue(record: Record<string, unknown>) {
  return Object.values(record).some((value) => value !== undefined);
}

function normalizeOptions(options: ReleaseIntakeSubmitAdapterOptions = {}) {
  return {
    draftToken: options.draftToken ?? DEFAULT_OPTIONS.draftToken,
    workspaceSlug: options.workspaceSlug ?? DEFAULT_OPTIONS.workspaceSlug,
    workflowType: options.workflowType ?? DEFAULT_OPTIONS.workflowType,
    formVersion: options.formVersion ?? DEFAULT_OPTIONS.formVersion,
    submittedAt: options.submittedAt ?? DEFAULT_OPTIONS.submittedAt,
  };
}

function toSubmitTrackCandidate(
  track: ReleaseIntakeSchemaTrackValue,
  index: number
): ReleaseIntakeSubmitTrackCandidate {
  const hasIsrc = cleanYesNo(track.has_isrc);

  return {
    local_id: track.local_id,
    order_number: index + 1,
    title: cleanRequiredString(track.title),
    is_focus_track: index === 0,
    primary_artists: cleanRequiredString(track.primary_artists),
    featured_artists: cleanString(track.featured_artists),
    interpreters: cleanString(track.interpreters),
    authors: cleanRequiredString(track.authors),
    publishers: cleanString(track.publishers),
    producers_musicians: cleanString(track.producers_musicians),
    phonographic_producer: cleanString(track.phonographic_producer),
    has_isrc: hasIsrc,
    isrc_code: hasIsrc === "yes" ? cleanString(track.isrc_code) : undefined,
    explicit_content: cleanYesNo(track.explicit_content),
    tiktok_snippet: cleanString(track.tiktok_snippet),
    lyrics: cleanString(track.lyrics),
    track_status: "draft",
  };
}

function toSubmitMarketingCandidate(
  input: ReleaseIntakeSchemaValues
): ReleaseIntakeSubmitMarketingCandidate | undefined {
  const marketing = {
    marketing_numbers: cleanString(input.marketing.marketing_numbers),
    marketing_focus: cleanString(input.marketing.marketing_focus),
    marketing_objectives: cleanString(input.marketing.marketing_objectives),
    has_marketing_budget: cleanYesNo(input.marketing.has_marketing_budget),
    marketing_budget: cleanString(input.marketing.marketing_budget),
    focus_track_name: cleanString(input.marketing.focus_track_name),
    date_flexibility: cleanString(input.marketing.date_flexibility),
    has_special_guests: cleanYesNo(input.marketing.has_special_guests),
    special_guests_bio: cleanString(input.marketing.special_guests_bio),
    feat_will_promote: cleanYesNo(input.marketing.feat_will_promote),
    promotion_participants: cleanString(input.marketing.promotion_participants),
    influencers_brands_partners: cleanString(
      input.marketing.influencers_brands_partners
    ),
    general_notes: cleanString(input.marketing.general_notes),
  };

  return hasAnyValue(marketing) ? marketing : undefined;
}

export function releaseIntakeSchemaValuesToSubmitPayloadCandidate(
  input: ReleaseIntakeSchemaValues,
  options: ReleaseIntakeSubmitAdapterOptions = {}
): ReleaseIntakeSubmitPayloadCandidate {
  const normalizedOptions = normalizeOptions(options);
  const marketing = toSubmitMarketingCandidate(input);

  return {
    draft_token: normalizedOptions.draftToken,
    workspace_slug: normalizedOptions.workspaceSlug,
    workflow_type: normalizedOptions.workflowType,
    identification: {
      submitter_name: cleanRequiredString(input.project.submitter_name),
      submitter_email: cleanRequiredString(
        input.project.submitter_email
      ).toLowerCase(),
      project_title: cleanRequiredString(input.project.project_title),
      release_type: input.project.release_type,
    },
    project: {
      release_date: normalizeDateInputValue(input.project.release_date),
      genre: cleanString(input.project.genre),
      explicit_content: cleanYesNo(input.project.explicit_content),
      tiktok_snippet: cleanString(input.project.tiktok_snippet),
      cover_link: cleanString(input.assets.cover_link),
      promo_assets_link: cleanString(input.assets.promo_assets_link),
      presskit_link: cleanString(input.assets.presskit_link),
      has_video_asset: cleanYesNo(input.project.has_video_asset),
      video_link: cleanString(input.project.video_link),
      video_release_date: cleanString(input.project.video_release_date),
    },
    tracks: input.tracks.map(toSubmitTrackCandidate),
    marketing,
    meta: {
      form_version: normalizedOptions.formVersion,
      source: buildSource(
        normalizedOptions.workspaceSlug,
        normalizedOptions.workflowType,
        normalizedOptions.formVersion
      ),
      submitted_at: normalizedOptions.submittedAt,
      adapter: "release_intake_schema_submit_parity_v0",
    },
  };
}

function createFinding(
  finding: ReleaseIntakeSubmitParityFinding
): ReleaseIntakeSubmitParityFinding {
  return finding;
}

function summarizeExclusions(input: ReleaseIntakeSchemaValues) {
  const findings: ReleaseIntakeSubmitParityFinding[] = [];

  if (input.assets.cover_file) {
    findings.push(
      createFinding({
        code: "cover_file_visual_only",
        field: "assets.cover_file",
        status: "excluded_visual_only",
        schemaPath: "assets.cover_file",
        message:
          "Cover file metadata is preview-only in submit parity and is excluded until upload parity preserves UploadedFileRef safely.",
      })
    );
  }

  if (input.assets.cover_specs.length > 0) {
    findings.push(
      createFinding({
        code: "cover_specs_computed_visual_only",
        field: "assets.cover_specs",
        status: "computed_visual_only",
        schemaPath: "assets.cover_specs",
        message:
          "Cover specs are derived blocker metadata and are not part of the active submit payload.",
      })
    );
  }

  if (input.tracks.some((track) => track.audio_file)) {
    findings.push(
      createFinding({
        code: "track_audio_file_visual_only",
        field: "tracks[].audio_file",
        status: "excluded_visual_only",
        schemaPath: "tracks[].audio_file",
        message:
          "Per-track audio metadata is excluded from the submit candidate until upload parity maps file refs safely.",
      })
    );
  }

  if (input.tracks.some((track) => track.validations.err.length > 0)) {
    findings.push(
      createFinding({
        code: "track_validations_computed_visual_only",
        field: "tracks[].validations",
        status: "computed_visual_only",
        schemaPath: "tracks[].validations",
        message:
          "Computed blockers such as duplicate ISRC remain schema-only and do not change real submit behavior.",
      })
    );
  }

  findings.push(
    createFinding({
      code: "upload_parity_pending_cover",
      field: "assets.cover_file",
      status: "needs_upload_parity",
      schemaPath: "assets.cover_file",
      payloadPath: "project.cover_file",
      message:
        "The active submit payload can include project.cover_file, but this candidate excludes it until upload parity is implemented.",
    }),
    createFinding({
      code: "upload_parity_pending_audio",
      field: "tracks[].audio_file",
      status: "needs_upload_parity",
      schemaPath: "tracks[].audio_file",
      payloadPath: "tracks[].audio_file",
      message:
        "The active submit payload can include per-track audio refs, but this candidate excludes them until upload parity is implemented.",
    }),
    createFinding({
      code: "upload_parity_pending_marketing_files",
      field: "marketing.additional_files",
      status: "needs_upload_parity",
      payloadPath: "marketing.additional_files",
      message:
        "Runtime marketing uploads remain outside the schema candidate and need a separate upload parity decision.",
    })
  );

  return findings;
}

function summarizePendingDecisions(input: ReleaseIntakeSchemaValues) {
  const findings: ReleaseIntakeSubmitParityFinding[] = [
    createFinding({
      code: "project_primary_artist_display_only",
      field: "project.primary_artist",
      status: "needs_decision",
      schemaPath: "project.primary_artist",
      payloadPath: "tracks[].primary_artists",
      message:
        "The active submit shape has per-track primary artists, not a project-level primary_artist field. This candidate preserves the artist through tracks[].primary_artists.",
    }),
    createFinding({
      code: "focus_track_policy",
      field: "tracks[].is_focus_track",
      status: "needs_decision",
      payloadPath: "tracks[].is_focus_track",
      message:
        "Schema v0 does not expose focus-track selection, so the candidate derives the first track as the focus track.",
    }),
    createFinding({
      code: "track_status_policy",
      field: "tracks[].track_status",
      status: "needs_decision",
      payloadPath: "tracks[].track_status",
      message:
        "Schema v0 does not model runtime track status, so the candidate emits draft for all tracks.",
    }),
  ];

  if (input.tracks.some((track) => cleanString(track.duration))) {
    findings.push(
      createFinding({
        code: "track_duration_no_submit_path",
        field: "tracks[].duration",
        status: "needs_decision",
        schemaPath: "tracks[].duration",
        message:
          "Track duration exists in the schema candidate but has no active submit payload path.",
      })
    );
  }

  return findings;
}

function countByStatus(findings: ReleaseIntakeSubmitParityFinding[]) {
  return findings.reduce<Record<ReleaseIntakeSubmitParityStatus, number>>(
    (acc, finding) => {
      acc[finding.status] += 1;
      return acc;
    },
    {
      preserved: PRESERVED_FIELDS.length,
      excluded_visual_only: 0,
      needs_upload_parity: 0,
      needs_decision: 0,
      computed_visual_only: 0,
    }
  );
}

export function summarizeReleaseIntakeSubmitParity(
  input: ReleaseIntakeSchemaValues,
  options: ReleaseIntakeSubmitAdapterOptions = {}
): ReleaseIntakeSubmitParitySummary {
  const payloadCandidate =
    releaseIntakeSchemaValuesToSubmitPayloadCandidate(input, options);
  const findings = [
    ...summarizeExclusions(input),
    ...summarizePendingDecisions(input),
  ];

  return {
    payloadCandidate,
    preservedFields: [...PRESERVED_FIELDS],
    findings,
    counts: countByStatus(findings),
  };
}
