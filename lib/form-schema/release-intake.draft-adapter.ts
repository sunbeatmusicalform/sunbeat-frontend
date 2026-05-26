import type { TrackInput } from "../form-engine/track-types";
import type {
  IdentificationValues,
  MarketingValues,
  ProjectValues,
  ReleaseIntakeDraftPayload,
  ReleaseIntakeFormValues,
  UploadedFileRef,
} from "../form-engine/types";

export const VISUAL_ONLY_FIELDS = [
  "assets.cover_file",
  "assets.cover_specs",
  "tracks[].audio_file",
] as const;

export type ReleaseIntakeVisualOnlyField =
  (typeof VISUAL_ONLY_FIELDS)[number];

export type ReleaseIntakeRuntimeDraftLike =
  | ReleaseIntakeFormValues
  | Pick<ReleaseIntakeDraftPayload, "values">;

export type ReleaseIntakeFileStatus =
  | "validated"
  | "pending"
  | "error"
  | "unknown";

export type ReleaseIntakeSchemaAudioFileValue = {
  id: string;
  name: string;
  size: string;
  status: ReleaseIntakeFileStatus;
  trackLocalId: string;
  runtimeFileRef?: UploadedFileRef;
};

export type ReleaseIntakeSchemaCoverFileValue = {
  id: string;
  name: string;
  size: string;
  width: number;
  height: number;
  dpi: number;
  status: ReleaseIntakeFileStatus;
  preview: boolean;
  runtimeFileRef?: UploadedFileRef;
};

export type ReleaseIntakeCoverSpec = {
  key: "resolution" | "dpi" | "status";
  label: string;
  value: string;
  required: string;
  ok: boolean;
  weight: "blocker" | "warn";
  icon: string;
};

export type ReleaseIntakeTrackValidations = {
  ok: string[];
  warn: string[];
  err: string[];
};

export type ReleaseIntakeSchemaTrackValue = {
  id: string;
  local_id: string;
  order: number;
  title: string;
  duration: string;
  primary_artists: string;
  featured_artists: string;
  interpreters: string;
  authors: string;
  publishers: string;
  producers_musicians: string;
  phonographic_producer: string;
  has_isrc: TrackInput["has_isrc"];
  isrc_code: string;
  explicit_content: TrackInput["explicit_content"];
  tiktok_snippet: string;
  audio_file: ReleaseIntakeSchemaAudioFileValue | null;
  lyrics: string;
  validations: ReleaseIntakeTrackValidations;
};

export type ReleaseIntakeSchemaProjectValues = {
  submitter_name: string;
  submitter_email: string;
  project_title: string;
  primary_artist: string;
  release_type: IdentificationValues["release_type"];
  release_date: string;
  genre: string;
  explicit_content: ProjectValues["explicit_content"];
  tiktok_snippet: string;
  has_video_asset: ProjectValues["has_video_asset"];
  video_link: string;
  video_release_date: string;
  project_notes: string;
};

export type ReleaseIntakeSchemaAssetsValues = {
  cover_file: ReleaseIntakeSchemaCoverFileValue | null;
  cover_specs: ReleaseIntakeCoverSpec[];
  cover_link: string;
  promo_assets_link: string;
  presskit_link: string;
};

export type ReleaseIntakeSchemaMarketingValues = Omit<
  MarketingValues,
  "additional_files"
>;

export type ReleaseIntakeSchemaValues = {
  project: ReleaseIntakeSchemaProjectValues;
  assets: ReleaseIntakeSchemaAssetsValues;
  tracks: ReleaseIntakeSchemaTrackValue[];
  marketing: ReleaseIntakeSchemaMarketingValues;
  review: null;
};

export type ReleaseIntakeRuntimeTrackPatch = Pick<
  TrackInput,
  "local_id" | "order_number"
> &
  Partial<
    Pick<
      TrackInput,
      | "title"
      | "primary_artists"
      | "featured_artists"
      | "interpreters"
      | "authors"
      | "publishers"
      | "producers_musicians"
      | "phonographic_producer"
      | "has_isrc"
      | "isrc_code"
      | "explicit_content"
      | "tiktok_snippet"
      | "lyrics"
      | "track_status"
    >
  >;

export type ReleaseIntakeRuntimeDraftPatch = {
  values: {
    identification: Partial<IdentificationValues>;
    project: Partial<ProjectValues>;
    tracks: ReleaseIntakeRuntimeTrackPatch[];
    marketing: Partial<MarketingValues>;
  };
};

export type ReleaseIntakeRoundTripStatus =
  | "preserved"
  | "partial"
  | "lost"
  | "visual_only"
  | "needs_decision";

export type ReleaseIntakeRoundTripIssue = {
  code: string;
  field: string;
  status: ReleaseIntakeRoundTripStatus;
  message: string;
  runtimePath?: string;
  schemaPath?: string;
};

export type ReleaseIntakeRoundTripSummary = {
  schemaValues: ReleaseIntakeSchemaValues;
  runtimePatch: ReleaseIntakeRuntimeDraftPatch;
  preservedFields: string[];
  issues: ReleaseIntakeRoundTripIssue[];
  counts: Record<ReleaseIntakeRoundTripStatus, number>;
};

const PRESERVED_FIELDS = [
  "identification.submitter_name",
  "identification.submitter_email",
  "identification.project_title",
  "identification.release_type",
  "project.release_date",
  "project.genre",
  "project.explicit_content",
  "project.tiktok_snippet",
  "project.has_video_asset",
  "project.video_link",
  "project.video_release_date",
  "project.cover_link",
  "project.promo_assets_link",
  "project.presskit_link",
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

const COVER_SPEC_REQUIREMENTS = {
  minWidth: 3000,
  minHeight: 3000,
  minDpi: 300,
} as const;

type RuntimeFileMetadata = {
  width?: number;
  height?: number;
  dpi?: number;
  status?: ReleaseIntakeFileStatus | "valid" | "invalid";
  preview?: boolean;
};

function isDraftPayloadLike(
  input: ReleaseIntakeRuntimeDraftLike
): input is Pick<ReleaseIntakeDraftPayload, "values"> {
  return "values" in input;
}

function getRuntimeValues(input: ReleaseIntakeRuntimeDraftLike) {
  return isDraftPayloadLike(input) ? input.values : input;
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function formatFileSize(file: UploadedFileRef) {
  return typeof file.size_bytes === "number"
    ? `${Math.round(file.size_bytes / (1024 * 1024))} MB`
    : "";
}

function readRuntimeFileMetadata(file: UploadedFileRef | null | undefined) {
  return (file ?? {}) as UploadedFileRef & RuntimeFileMetadata;
}

function normalizeFileStatus(
  status: RuntimeFileMetadata["status"] | undefined
): ReleaseIntakeFileStatus {
  if (status === "valid") return "validated";
  if (status === "invalid") return "error";
  if (status === "validated" || status === "pending" || status === "error") {
    return status;
  }
  return "unknown";
}

function inferSquareSizeFromFileName(file: UploadedFileRef | null | undefined) {
  const text = `${file?.file_name ?? ""} ${file?.storage_path ?? ""}`;
  const match = text.match(/(1500|3000|4000|5000)/);
  return match ? Number(match[1]) : 0;
}

function fileToSchemaAudioValue(
  file: UploadedFileRef,
  trackLocalId: string
): ReleaseIntakeSchemaAudioFileValue {
  const meta = readRuntimeFileMetadata(file);

  return {
    id: `audio:${file.file_id}`,
    name: file.file_name,
    size: formatFileSize(file),
    status: normalizeFileStatus(meta.status) || "unknown",
    trackLocalId,
    runtimeFileRef: file,
  };
}

function fileToSchemaCoverValue(
  file: UploadedFileRef
): ReleaseIntakeSchemaCoverFileValue {
  const meta = readRuntimeFileMetadata(file);
  const inferredSquareSize = inferSquareSizeFromFileName(file);
  const width = meta.width ?? inferredSquareSize;
  const height = meta.height ?? inferredSquareSize;

  return {
    id: `cover:${file.file_id}`,
    name: file.file_name,
    size: formatFileSize(file),
    width,
    height,
    dpi: meta.dpi ?? 0,
    status: normalizeFileStatus(meta.status),
    preview: Boolean(meta.preview),
    runtimeFileRef: file,
  };
}

export function deriveReleaseIntakeCoverSpecs(
  coverFile: ReleaseIntakeSchemaCoverFileValue | null
): ReleaseIntakeCoverSpec[] {
  const width = coverFile?.width ?? 0;
  const height = coverFile?.height ?? 0;
  const dpi = coverFile?.dpi ?? 0;
  const status = coverFile?.status ?? "unknown";
  const resolutionOk =
    width >= COVER_SPEC_REQUIREMENTS.minWidth &&
    height >= COVER_SPEC_REQUIREMENTS.minHeight;
  const dpiOk = dpi >= COVER_SPEC_REQUIREMENTS.minDpi;
  const statusOk = status === "validated";

  return [
    {
      key: "resolution",
      label: "Resolution",
      value: width && height ? `${width}x${height}` : "unknown",
      required: "min 3000x3000",
      ok: resolutionOk,
      weight: resolutionOk ? "warn" : "blocker",
      icon: resolutionOk ? "check" : "alert",
    },
    {
      key: "dpi",
      label: "DPI",
      value: dpi ? String(dpi) : "unknown",
      required: "min 300 DPI",
      ok: dpiOk,
      weight: dpiOk ? "warn" : "blocker",
      icon: dpiOk ? "check" : "alert",
    },
    {
      key: "status",
      label: "File status",
      value: status,
      required: "validated",
      ok: statusOk,
      weight: statusOk ? "warn" : "blocker",
      icon: statusOk ? "check" : "alert",
    },
  ];
}

function getPrimaryArtistFromTracks(tracks: TrackInput[]) {
  return tracks.find((track) => hasText(track.primary_artists))
    ?.primary_artists ?? "";
}

function getDuplicateIsrcCodes(tracks: TrackInput[]) {
  const counts = new Map<string, number>();

  tracks.forEach((track) => {
    const code = track.isrc_code.trim();
    if (!code) return;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  });

  return new Set(
    Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([code]) => code)
  );
}

function deriveTrackValidations(
  track: TrackInput,
  duplicateIsrcCodes: Set<string>
): ReleaseIntakeTrackValidations {
  const ok: string[] = [];
  const warn: string[] = [];
  const err: string[] = [];

  if (track.title.trim()) ok.push("title_present");
  if (track.authors.trim()) ok.push("credits_present");
  if (track.primary_artists.trim()) ok.push("primary_artists_present");
  if (track.audio_file) ok.push("audio_file_present");
  else warn.push("audio_missing");

  if (track.has_isrc === "yes" && track.isrc_code.trim()) {
    ok.push("isrc_present");
  }

  if (track.isrc_code.trim() && duplicateIsrcCodes.has(track.isrc_code.trim())) {
    err.push("isrc_duplicate");
  }

  return { ok, warn, err };
}

function cloneMarketingValues(
  marketing: MarketingValues
): ReleaseIntakeSchemaMarketingValues {
  return {
    marketing_numbers: marketing.marketing_numbers,
    marketing_focus: marketing.marketing_focus,
    marketing_objectives: marketing.marketing_objectives,
    has_marketing_budget: marketing.has_marketing_budget,
    marketing_budget: marketing.marketing_budget,
    focus_track_name: marketing.focus_track_name,
    date_flexibility: marketing.date_flexibility,
    has_special_guests: marketing.has_special_guests,
    special_guests_bio: marketing.special_guests_bio,
    feat_will_promote: marketing.feat_will_promote,
    promotion_participants: marketing.promotion_participants,
    influencers_brands_partners: marketing.influencers_brands_partners,
    general_notes: marketing.general_notes,
  };
}

export function runtimeDraftToReleaseIntakeSchemaValues(
  input: ReleaseIntakeRuntimeDraftLike
): ReleaseIntakeSchemaValues {
  const values = getRuntimeValues(input);
  const coverFile = values.project.cover_file
    ? fileToSchemaCoverValue(values.project.cover_file)
    : null;
  const duplicateIsrcCodes = getDuplicateIsrcCodes(values.tracks);

  return {
    project: {
      submitter_name: values.identification.submitter_name,
      submitter_email: values.identification.submitter_email,
      project_title: values.identification.project_title,
      primary_artist: getPrimaryArtistFromTracks(values.tracks),
      release_type: values.identification.release_type,
      release_date: values.project.release_date,
      genre: values.project.genre,
      explicit_content: values.project.explicit_content,
      tiktok_snippet: values.project.tiktok_snippet,
      has_video_asset: values.project.has_video_asset,
      video_link: values.project.video_link,
      video_release_date: values.project.video_release_date,
      project_notes: values.marketing.general_notes,
    },
    assets: {
      cover_file: coverFile,
      cover_specs: deriveReleaseIntakeCoverSpecs(coverFile),
      cover_link: values.project.cover_link,
      promo_assets_link: values.project.promo_assets_link,
      presskit_link: values.project.presskit_link,
    },
    tracks: values.tracks.map((track) => ({
      id: track.client_track_id || track.local_id,
      local_id: track.local_id,
      order: track.order_number,
      title: track.title,
      duration: "",
      primary_artists: track.primary_artists,
      featured_artists: track.featured_artists,
      interpreters: track.interpreters,
      authors: track.authors,
      publishers: track.publishers,
      producers_musicians: track.producers_musicians,
      phonographic_producer: track.phonographic_producer,
      has_isrc: track.has_isrc,
      isrc_code: track.isrc_code,
      explicit_content: track.explicit_content,
      tiktok_snippet: track.tiktok_snippet,
      audio_file: track.audio_file
        ? fileToSchemaAudioValue(track.audio_file, track.local_id)
        : null,
      lyrics: track.lyrics,
      validations: deriveTrackValidations(track, duplicateIsrcCodes),
    })),
    marketing: cloneMarketingValues(values.marketing),
    review: null,
  };
}

export const toSchema = runtimeDraftToReleaseIntakeSchemaValues;

export function releaseIntakeSchemaValuesToRuntimeDraftPatch(
  input: ReleaseIntakeSchemaValues
): ReleaseIntakeRuntimeDraftPatch {
  return {
    values: {
      identification: {
        submitter_name: input.project.submitter_name,
        submitter_email: input.project.submitter_email,
        project_title: input.project.project_title,
        release_type: input.project.release_type,
      },
      project: {
        release_date: input.project.release_date,
        genre: input.project.genre,
        explicit_content: input.project.explicit_content,
        tiktok_snippet: input.project.tiktok_snippet,
        cover_link: input.assets.cover_link,
        promo_assets_link: input.assets.promo_assets_link,
        presskit_link: input.assets.presskit_link,
        has_video_asset: input.project.has_video_asset,
        video_link: input.project.video_link,
        video_release_date: input.project.video_release_date,
      },
      tracks: input.tracks.map((track) => ({
        local_id: track.local_id,
        order_number: track.order,
        title: track.title,
        primary_artists: track.primary_artists || input.project.primary_artist,
        featured_artists: track.featured_artists,
        interpreters: track.interpreters,
        authors: track.authors,
        publishers: track.publishers,
        producers_musicians: track.producers_musicians,
        phonographic_producer: track.phonographic_producer,
        has_isrc: track.has_isrc,
        isrc_code: track.isrc_code,
        explicit_content: track.explicit_content,
        tiktok_snippet: track.tiktok_snippet,
        lyrics: track.lyrics,
        track_status: "draft",
      })),
      marketing: {
        marketing_numbers: input.marketing.marketing_numbers,
        marketing_focus: input.marketing.marketing_focus,
        marketing_objectives: input.marketing.marketing_objectives,
        has_marketing_budget: input.marketing.has_marketing_budget,
        marketing_budget: input.marketing.marketing_budget,
        focus_track_name: input.marketing.focus_track_name,
        date_flexibility: input.marketing.date_flexibility,
        has_special_guests: input.marketing.has_special_guests,
        special_guests_bio: input.marketing.special_guests_bio,
        feat_will_promote: input.marketing.feat_will_promote,
        promotion_participants: input.marketing.promotion_participants,
        influencers_brands_partners:
          input.marketing.influencers_brands_partners,
        general_notes: input.marketing.general_notes,
      },
    },
  };
}

export const toPatch = releaseIntakeSchemaValuesToRuntimeDraftPatch;

function createIssue(
  issue: ReleaseIntakeRoundTripIssue
): ReleaseIntakeRoundTripIssue {
  return issue;
}

function summarizeIssues(schemaValues: ReleaseIntakeSchemaValues) {
  const issues: ReleaseIntakeRoundTripIssue[] = [];
  const hasAudioFiles = schemaValues.tracks.some((track) => track.audio_file);
  const duplicateIsrc = schemaValues.tracks.some((track) =>
    track.validations.err.includes("isrc_duplicate")
  );
  const hasBlockingCoverSpec = schemaValues.assets.cover_specs.some(
    (spec) => !spec.ok && spec.weight === "blocker"
  );

  if (hasAudioFiles) {
    issues.push(
      createIssue({
        code: "track_audio_file_visual_only",
        field: "tracks[].audio_file",
        status: "visual_only",
        runtimePath: "tracks[].audio_file",
        schemaPath: "tracks[].audio_file",
        message:
          "Per-track audio metadata survives in schema values but is excluded from the runtime patch until upload parity.",
      })
    );
  }

  if (duplicateIsrc) {
    issues.push(
      createIssue({
        code: "duplicate_isrc_computed",
        field: "tracks[].validations",
        status: "needs_decision",
        runtimePath: "tracks[].isrc_code",
        schemaPath: "tracks[].validations.err",
        message:
          "Duplicate ISRC is derived into schema validations and remains out of the runtime patch until submit parity.",
      })
    );
  }

  if (hasBlockingCoverSpec) {
    issues.push(
      createIssue({
        code: "cover_specs_visual_only",
        field: "assets.cover_specs",
        status: "visual_only",
        runtimePath: "project.cover_file",
        schemaPath: "assets.cover_specs",
        message:
          "Cover specs are derived from mock metadata and are excluded from the runtime patch until upload parity.",
      })
    );
  }

  return issues;
}

function countByStatus(issues: ReleaseIntakeRoundTripIssue[]) {
  return issues.reduce<Record<ReleaseIntakeRoundTripStatus, number>>(
    (acc, issue) => {
      acc[issue.status] += 1;
      return acc;
    },
    {
      preserved: PRESERVED_FIELDS.length,
      partial: 0,
      lost: 0,
      visual_only: 0,
      needs_decision: 0,
    }
  );
}

export function summarizeReleaseIntakeRoundTrip(
  input: ReleaseIntakeRuntimeDraftLike
): ReleaseIntakeRoundTripSummary {
  const schemaValues = runtimeDraftToReleaseIntakeSchemaValues(input);
  const runtimePatch =
    releaseIntakeSchemaValuesToRuntimeDraftPatch(schemaValues);
  const issues = summarizeIssues(schemaValues);

  return {
    schemaValues,
    runtimePatch,
    preservedFields: [...PRESERVED_FIELDS],
    issues,
    counts: countByStatus(issues),
  };
}
