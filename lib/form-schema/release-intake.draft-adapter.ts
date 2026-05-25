import type { TrackInput } from "../form-engine/track-types";
import type {
  IdentificationValues,
  MarketingValues,
  ProjectValues,
  ReleaseIntakeDraftPayload,
  ReleaseIntakeFormValues,
  UploadedFileRef,
} from "../form-engine/types";

export type ReleaseIntakeRuntimeDraftLike =
  | ReleaseIntakeFormValues
  | Pick<ReleaseIntakeDraftPayload, "values">;

export type ReleaseIntakeSchemaUploadValue = {
  id: string;
  name: string;
  meta?: string;
  status?: "valid" | "warning" | "invalid" | "unknown";
  statusLabel?: string;
  trackLocalId?: string;
  runtimeFileRef?: UploadedFileRef;
};

export type ReleaseIntakeSchemaTrackValue = {
  id: string;
  local_id: string;
  order: number;
  title: string;
  duration: string;
  isrc_code: string;
  authors: string;
  audio_file: string | null;
};

export type ReleaseIntakeSchemaValues = {
  submitter_name: string;
  submitter_email: string;
  project_title: string;
  primary_artist: string;
  release_type: IdentificationValues["release_type"];
  release_date: string;
  genre: string;
  project_notes: string;
  tracks: ReleaseIntakeSchemaTrackValue[];
  cover_file: ReleaseIntakeSchemaUploadValue | null;
  audio_files: ReleaseIntakeSchemaUploadValue[];
  promo_assets_link: string;
  presskit_available: boolean;
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
      | "authors"
      | "has_isrc"
      | "isrc_code"
      | "audio_file"
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
  "project.cover_file",
  "project.promo_assets_link",
  "tracks[].title",
  "tracks[].authors",
  "tracks[].isrc_code",
  "tracks[].audio_file",
  "marketing.general_notes",
] as const;

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

function hasFile(value: UploadedFileRef | null | undefined) {
  return Boolean(value?.file_name || value?.storage_path || value?.file_id);
}

function fileToSchemaUploadValue(
  file: UploadedFileRef,
  options: {
    idPrefix: string;
    status?: ReleaseIntakeSchemaUploadValue["status"];
    statusLabel?: string;
    trackLocalId?: string;
  }
): ReleaseIntakeSchemaUploadValue {
  const sizeLabel =
    typeof file.size_bytes === "number"
      ? `${Math.round(file.size_bytes / (1024 * 1024))} MB`
      : undefined;
  const typeLabel = file.mime_type || undefined;
  const meta = [typeLabel, sizeLabel].filter(Boolean).join(" - ");

  return {
    id: `${options.idPrefix}:${file.file_id}`,
    name: file.file_name,
    meta: meta || file.storage_path,
    status: options.status ?? "unknown",
    statusLabel: options.statusLabel,
    trackLocalId: options.trackLocalId,
    runtimeFileRef: file,
  };
}

function getCoverStatus(
  file: UploadedFileRef | null
): Pick<ReleaseIntakeSchemaUploadValue, "status" | "statusLabel"> {
  const text = `${file?.file_name ?? ""} ${file?.storage_path ?? ""}`;
  if (text.includes("1500")) {
    return {
      status: "invalid",
      statusLabel: "Below visual spec",
    };
  }

  return {
    status: "unknown",
    statusLabel: "Runtime metadata only",
  };
}

function getPrimaryArtistFromTracks(tracks: TrackInput[]) {
  return tracks.find((track) => hasText(track.primary_artists))
    ?.primary_artists ?? "";
}

function getDuplicateIsrcCodes(tracks: TrackInput[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  tracks.forEach((track) => {
    const code = track.isrc_code.trim();
    if (!code) return;
    if (seen.has(code)) {
      duplicates.add(code);
      return;
    }
    seen.add(code);
  });

  return Array.from(duplicates);
}

function getDistinctNonEmptyValues(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

function listNonEmptyMarketingFields(marketing: MarketingValues) {
  const fields: Array<keyof MarketingValues> = [
    "marketing_numbers",
    "marketing_focus",
    "marketing_objectives",
    "has_marketing_budget",
    "marketing_budget",
    "focus_track_name",
    "date_flexibility",
    "has_special_guests",
    "special_guests_bio",
    "feat_will_promote",
    "promotion_participants",
    "influencers_brands_partners",
    "additional_files",
  ];

  return fields.filter((field) => {
    const value = marketing[field];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function runtimeDraftToReleaseIntakeSchemaValues(
  input: ReleaseIntakeRuntimeDraftLike
): ReleaseIntakeSchemaValues {
  const values = getRuntimeValues(input);
  const coverStatus = getCoverStatus(values.project.cover_file);

  return {
    submitter_name: values.identification.submitter_name,
    submitter_email: values.identification.submitter_email,
    project_title: values.identification.project_title,
    primary_artist: getPrimaryArtistFromTracks(values.tracks),
    release_type: values.identification.release_type,
    release_date: values.project.release_date,
    genre: values.project.genre,
    project_notes: values.marketing.general_notes,
    tracks: values.tracks.map((track) => ({
      id: track.client_track_id || track.local_id,
      local_id: track.local_id,
      order: track.order_number,
      title: track.title,
      duration: "",
      isrc_code: track.isrc_code,
      authors: track.authors,
      audio_file: track.audio_file?.file_name ?? null,
    })),
    cover_file: values.project.cover_file
      ? fileToSchemaUploadValue(values.project.cover_file, {
          idPrefix: "cover",
          status: coverStatus.status,
          statusLabel: coverStatus.statusLabel,
        })
      : null,
    audio_files: values.tracks
      .filter((track) => hasFile(track.audio_file))
      .map((track) =>
        fileToSchemaUploadValue(track.audio_file as UploadedFileRef, {
          idPrefix: "audio",
          status: "valid",
          statusLabel: "Runtime file ref",
          trackLocalId: track.local_id,
        })
      ),
    promo_assets_link: values.project.promo_assets_link,
    presskit_available: hasText(values.project.presskit_link),
    review: null,
  };
}

export function releaseIntakeSchemaValuesToRuntimeDraftPatch(
  input: ReleaseIntakeSchemaValues
): ReleaseIntakeRuntimeDraftPatch {
  return {
    values: {
      identification: {
        submitter_name: input.submitter_name,
        submitter_email: input.submitter_email,
        project_title: input.project_title,
        release_type: input.release_type,
      },
      project: {
        release_date: input.release_date,
        genre: input.genre,
        cover_file: input.cover_file?.runtimeFileRef ?? null,
        promo_assets_link: input.promo_assets_link,
      },
      tracks: input.tracks.map((track) => {
        const audioFile =
          input.audio_files.find((file) => file.trackLocalId === track.local_id)
            ?.runtimeFileRef ?? null;

        return {
          local_id: track.local_id,
          order_number: track.order,
          title: track.title,
          authors: track.authors,
          has_isrc: track.isrc_code ? "yes" : "",
          isrc_code: track.isrc_code,
          audio_file: audioFile,
          track_status: "draft",
        };
      }),
      marketing: {
        general_notes: input.project_notes,
      },
    },
  };
}

function createIssue(
  issue: ReleaseIntakeRoundTripIssue
): ReleaseIntakeRoundTripIssue {
  return issue;
}

function summarizeIssues(values: ReleaseIntakeFormValues) {
  const issues: ReleaseIntakeRoundTripIssue[] = [];
  const primaryArtists = getDistinctNonEmptyValues(
    values.tracks.map((track) => track.primary_artists)
  );
  const audioFiles = values.tracks.filter((track) => hasFile(track.audio_file));
  const duplicateIsrcCodes = getDuplicateIsrcCodes(values.tracks);
  const marketingFields = listNonEmptyMarketingFields(values.marketing);

  if (primaryArtists.length > 1) {
    issues.push(
      createIssue({
        code: "track_primary_artists_collapsed",
        field: "primary_artist",
        status: "partial",
        runtimePath: "tracks[].primary_artists",
        schemaPath: "primary_artist",
        message:
          "Schema candidate has one primary_artist, but runtime stores primary artists per track.",
      })
    );
  }

  if (audioFiles.length > 0) {
    issues.push(
      createIssue({
        code: "audio_files_aggregated",
        field: "audio_files",
        status: "partial",
        runtimePath: "tracks[].audio_file",
        schemaPath: "audio_files",
        message:
          "Adapter carries trackLocalId for mock round-trip, but the candidate field is still aggregate rather than per-track.",
      })
    );
  }

  if (hasText(values.project.presskit_link)) {
    issues.push(
      createIssue({
        code: "presskit_link_reduced_to_boolean",
        field: "presskit_available",
        status: "lost",
        runtimePath: "project.presskit_link",
        schemaPath: "presskit_available",
        message:
          "Runtime presskit_link cannot be restored from the candidate boolean without a schema field for the URL.",
      })
    );
  }

  if (marketingFields.length > 0) {
    issues.push(
      createIssue({
        code: "marketing_fields_not_modeled",
        field: "marketing",
        status: "lost",
        runtimePath: "marketing.*",
        schemaPath: "project_notes",
        message:
          "Only marketing.general_notes maps to project_notes; other populated marketing fields are not represented in the candidate schema.",
      })
    );
  }

  if (duplicateIsrcCodes.length > 0) {
    issues.push(
      createIssue({
        code: "duplicate_isrc_visual_only",
        field: "tracks[].isrc_code",
        status: "needs_decision",
        runtimePath: "tracks[].isrc_code",
        schemaPath: "tracks[].isrc_code",
        message:
          "Duplicate ISRC can be detected locally for summary, but the active runtime does not enforce the visual blocker yet.",
      })
    );
  }

  if (values.project.cover_file && getCoverStatus(values.project.cover_file).status === "invalid") {
    issues.push(
      createIssue({
        code: "cover_spec_visual_only",
        field: "cover_file",
        status: "visual_only",
        runtimePath: "project.cover_file",
        schemaPath: "cover_file",
        message:
          "Cover spec state is inferred from mock metadata only; runtime upload validation does not check dimensions in this adapter.",
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
  const values = getRuntimeValues(input);
  const schemaValues = runtimeDraftToReleaseIntakeSchemaValues(values);
  const runtimePatch =
    releaseIntakeSchemaValuesToRuntimeDraftPatch(schemaValues);
  const issues = summarizeIssues(values);

  return {
    schemaValues,
    runtimePatch,
    preservedFields: [...PRESERVED_FIELDS],
    issues,
    counts: countByStatus(issues),
  };
}

