import type {
  FormField,
  FormStepKey,
  FormVersion,
  ReleaseIntakeDraftPayload,
  ReleaseIntakeFormValues,
  ReleaseIntakeSubmitPayload,
  RightsClearanceDraftPayload,
  RightsClearanceFormValues,
  RightsClearanceSubmitPayload,
  UploadedFileRef,
  WorkflowType,
} from "./types";
import {
  DEFAULT_RELEASE_INTAKE_WORKFLOW_TYPE,
  RIGHTS_CLEARANCE_WORKFLOW_TYPE,
  buildWorkflowSource,
} from "./types";
import { getWorkflowRegistryEntry } from "./workflow-registry";

import type { TrackInput } from "./track-types";
import { getMinimumTrackCount } from "./track-types";

type TrackRequiredError = {
  field: keyof TrackInput;
  message: string;
};

export type WorkflowDraftPayload =
  | ReleaseIntakeDraftPayload
  | RightsClearanceDraftPayload;
export type WorkflowSubmitPayload =
  | ReleaseIntakeSubmitPayload
  | RightsClearanceSubmitPayload;
export type WorkflowFormValues =
  | ReleaseIntakeFormValues
  | RightsClearanceFormValues;

export type WorkflowDraftPayloadBuilderArgs = {
  draftToken: string;
  workspaceSlug: string;
  workflowType: WorkflowType;
  formVersion: FormVersion;
  currentStep: FormStepKey;
  values: WorkflowFormValues;
};

export type WorkflowSubmitPayloadBuilderArgs = {
  draftToken: string;
  workspaceSlug: string;
  workflowType: WorkflowType;
  formVersion: FormVersion;
  values: WorkflowFormValues;
};

export type WorkflowPayloadBuilderSet = {
  workflowType: WorkflowType;
  buildDraftPayload: (
    args: WorkflowDraftPayloadBuilderArgs
  ) => WorkflowDraftPayload;
  buildSubmitPayload: (
    args: WorkflowSubmitPayloadBuilderArgs
  ) => WorkflowSubmitPayload;
};

function getTrackField(trackFields: FormField[], key: keyof TrackInput) {
  return trackFields.find((field) => field.key === key);
}

function isTrackFieldVisible(trackFields: FormField[], key: keyof TrackInput) {
  return getTrackField(trackFields, key) !== undefined;
}

function isTrackFieldRequired(trackFields: FormField[], key: keyof TrackInput) {
  return Boolean(getTrackField(trackFields, key)?.required);
}

export function getTrackRequiredErrors(
  track: TrackInput,
  trackFields: FormField[] = []
): TrackRequiredError[] {
  const errors: TrackRequiredError[] = [];

  if (isTrackFieldRequired(trackFields, "title") && !track.title.trim()) {
    errors.push({
      field: "title",
      message: "Preencha o título da faixa.",
    });
  }

  if (
    isTrackFieldRequired(trackFields, "primary_artists") &&
    !track.primary_artists.trim()
  ) {
    errors.push({
      field: "primary_artists",
      message: "Preencha os artistas principais.",
    });
  }

  if (isTrackFieldRequired(trackFields, "authors") && !track.authors.trim()) {
    errors.push({
      field: "authors",
      message: "Preencha os autores.",
    });
  }

  if (isTrackFieldRequired(trackFields, "has_isrc") && !track.has_isrc) {
    errors.push({
      field: "has_isrc",
      message: "Selecione se a faixa já possui ISRC.",
    });
    return errors;
  }

  if (
    track.has_isrc &&
    isTrackFieldVisible(trackFields, "phonographic_producer") &&
    isTrackFieldRequired(trackFields, "phonographic_producer") &&
    !track.phonographic_producer.trim()
  ) {
    errors.push({
      field: "phonographic_producer",
      message: "Preencha o produtor fonográfico.",
    });
  }

  if (
    track.has_isrc === "yes" &&
    isTrackFieldVisible(trackFields, "isrc_code") &&
    isTrackFieldRequired(trackFields, "isrc_code") &&
    !track.isrc_code.trim()
  ) {
    errors.push({
      field: "isrc_code",
      message: "Informe o código ISRC da faixa.",
    });
  }

  return errors;
}

export function getTrackPendingRequiredCount(
  track: TrackInput,
  trackFields: FormField[] = []
) {
  return getTrackRequiredErrors(track, trackFields).length;
}

export function getProgressPercent(values: ReleaseIntakeFormValues): number {
  const checks = [
    !!values.identification.submitter_name.trim(),
    !!values.identification.submitter_email.trim(),
    !!values.identification.project_title.trim(),
    !!values.identification.release_type,
    !!values.project.release_date,
    !!values.project.genre.trim(),
    !!values.project.cover_file || !!values.project.cover_link.trim(),
    values.tracks.some((track) => !!track.title.trim()),
    values.tracks.some((track) => !!track.primary_artists.trim()),
    values.tracks.some((track) => !!track.authors.trim()),
    !!values.marketing.marketing_focus.trim(),
    !!values.marketing.marketing_objectives.trim(),
  ];

  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

export function getRightsClearanceProgressPercent(
  values: RightsClearanceFormValues
): number {
  const clearanceFormat = values.request_type.clearance_format;
  const formatSpecificChecks =
    clearanceFormat === "music_release_clearance_intake"
      ? [
          !!values.project_context.release_type,
          values.tracks.length > 0,
          values.tracks.some((track) => !!track.title.trim()),
          values.tracks.some((track) => !!track.primary_artists.trim()),
          values.tracks.some((track) => !!track.authors.trim()),
          values.tracks.some((track) => !!track.phonogram_owner.trim()),
        ]
      : clearanceFormat === "music_project_track"
      ? [
          !!values.clearance_scope.composer_author_info.trim(),
          !!values.clearance_scope.publisher_info.trim(),
          !!values.clearance_scope.material_type.trim(),
          !!values.clearance_scope.intended_use.trim(),
          !!values.clearance_scope.exclusivity,
        ]
      : clearanceFormat === "audiovisual_product_sync"
      ? [
          !!values.clearance_scope.audiovisual_type.trim(),
          !!values.clearance_scope.director_name.trim(),
          !!values.clearance_scope.product_or_campaign_name.trim(),
          !!values.clearance_scope.scene_description.trim(),
          !!values.clearance_scope.sync_duration.trim(),
          !!values.clearance_scope.media_channels.trim(),
        ]
      : [];

  const checks = [
    !!values.requester_identification.requester_name.trim(),
    !!values.requester_identification.requester_email.trim(),
    !!values.requester_identification.requester_company.trim(),
    !!values.request_type.clearance_format,
    !!values.project_context.project_title.trim(),
    !!values.project_context.responsible_company.trim(),
    !!values.project_context.client_or_distributor.trim(),
    !!values.project_context.release_or_start_date.trim(),
    ...(clearanceFormat === "music_release_clearance_intake"
      ? [!!values.project_context.general_clearance_notes.trim()]
      : [
          !!values.project_context.project_synopsis.trim(),
          !!values.clearance_scope.music_title.trim(),
          !!values.clearance_scope.artist_name.trim(),
          !!values.clearance_scope.phonogram_owner.trim(),
          !!values.clearance_scope.territory.trim(),
          !!values.clearance_scope.licensing_period.trim(),
        ]),
    ...formatSpecificChecks,
  ];

  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

export function validateIdentification(values: ReleaseIntakeFormValues) {
  const errors: Record<string, string> = {};

  if (!values.identification.submitter_name.trim()) {
    errors["identification.submitter_name"] = "Preencha seu nome.";
  }

  if (!values.identification.submitter_email.trim()) {
    errors["identification.submitter_email"] = "Preencha seu e-mail.";
  } else if (!/\S+@\S+\.\S+/.test(values.identification.submitter_email)) {
    errors["identification.submitter_email"] = "Informe um e-mail válido.";
  }

  if (!values.identification.project_title.trim()) {
    errors["identification.project_title"] = "Preencha o título do projeto.";
  }

  if (!values.identification.release_type) {
    errors["identification.release_type"] = "Selecione o tipo de lançamento.";
  }

  return errors;
}

export function validateProject(values: ReleaseIntakeFormValues) {
  const errors: Record<string, string> = {};
  const normalizedReleaseDate = cleanString(
    normalizeDateInputValue(values.project.release_date)
  );

  if (!normalizedReleaseDate) {
    errors["project.release_date"] = "Informe a data de lançamento.";
  }

  return errors;
}

export function validateTracks(
  values: ReleaseIntakeFormValues,
  trackFields: FormField[] = []
) {
  const errors: Record<string, string> = {};
  const releaseType = values.identification.release_type;
  const minimum = getMinimumTrackCount(releaseType);

  if (values.tracks.length < minimum) {
    errors["tracks"] =
      releaseType === "single"
        ? "Adicione a faixa do single."
        : "Adicione pelo menos 2 faixas.";
    return errors;
  }

  values.tracks.forEach((track, index) => {
    const prefix = `tracks.${index}`;
    const trackErrors = getTrackRequiredErrors(track, trackFields);

    trackErrors.forEach((error) => {
      errors[`${prefix}.${error.field}`] = error.message;
    });
  });

  return errors;
}

export function validateMarketing(values: ReleaseIntakeFormValues) {
  void values;
  return {};
}

export function validateAll(
  values: ReleaseIntakeFormValues,
  trackFields: FormField[] = []
) {
  return {
    ...validateIdentification(values),
    ...validateProject(values),
    ...validateTracks(values, trackFields),
    ...validateMarketing(values),
  };
}

export function canAddMoreTracks(
  releaseType: "single" | "ep" | "album" | "",
  currentTracks: number
) {
  if (releaseType === "single") {
    return currentTracks < 1;
  }
  return true;
}

function cleanString(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeDateInputValue(value: string | null | undefined) {
  const normalized = cleanString(value);
  if (!normalized) {
    return undefined;
  }

  const directMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (directMatch) {
    return directMatch[1];
  }

  const prefixedMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s].*)?$/);
  if (prefixedMatch) {
    return prefixedMatch[1];
  }

  return undefined;
}

function cleanYesNo(value: string | null | undefined) {
  return value === "yes" || value === "no" ? value : undefined;
}

function cleanFileRef(value: UploadedFileRef | null | undefined) {
  return value ?? undefined;
}

function cleanFileRefs(value: UploadedFileRef[] | null | undefined) {
  return Array.isArray(value) && value.length > 0 ? value : undefined;
}

export function buildReleaseIntakeDraftPayload(
  args: WorkflowDraftPayloadBuilderArgs
): ReleaseIntakeDraftPayload {
  const values = args.values as ReleaseIntakeFormValues;

  return {
    draft_token: args.draftToken,
    workspace_slug: args.workspaceSlug,
    workflow_type: args.workflowType,
    current_step: args.currentStep,
    progress_percent: getProgressPercent(values),
    values,
    meta: {
      form_version: args.formVersion,
      source: buildWorkflowSource(
        args.workspaceSlug,
        args.workflowType,
        args.formVersion
      ),
      updated_at: new Date().toISOString(),
    },
  };
}

export function buildReleaseIntakeSubmitPayload(
  args: WorkflowSubmitPayloadBuilderArgs
): ReleaseIntakeSubmitPayload {
  const values = args.values as ReleaseIntakeFormValues;
  const normalizedReleaseDate = cleanString(
    normalizeDateInputValue(values.project.release_date)
  );
  const marketing = {
    marketing_numbers: cleanString(values.marketing.marketing_numbers),
    marketing_focus: cleanString(values.marketing.marketing_focus),
    marketing_objectives: cleanString(values.marketing.marketing_objectives),
    has_marketing_budget: cleanYesNo(values.marketing.has_marketing_budget),
    marketing_budget: cleanString(values.marketing.marketing_budget),
    focus_track_name: cleanString(values.marketing.focus_track_name),
    date_flexibility: cleanString(values.marketing.date_flexibility),
    has_special_guests: cleanYesNo(values.marketing.has_special_guests),
    special_guests_bio: cleanString(values.marketing.special_guests_bio),
    feat_will_promote: cleanYesNo(values.marketing.feat_will_promote),
    promotion_participants: cleanString(
      values.marketing.promotion_participants
    ),
    influencers_brands_partners: cleanString(
      values.marketing.influencers_brands_partners
    ),
    general_notes: cleanString(values.marketing.general_notes),
    additional_files: cleanFileRefs(values.marketing.additional_files),
  };

  const hasMarketingValue = Object.values(marketing).some(
    (value) => value !== undefined
  );

  return {
    draft_token: args.draftToken,
    workspace_slug: args.workspaceSlug,
    workflow_type: args.workflowType,
    identification: {
      submitter_name: values.identification.submitter_name.trim(),
      submitter_email: values.identification.submitter_email.trim().toLowerCase(),
      project_title: values.identification.project_title.trim(),
      release_type: values.identification.release_type,
    },
    project: {
      release_date: normalizedReleaseDate,
      genre: cleanString(values.project.genre),
      explicit_content: cleanYesNo(values.project.explicit_content),
      tiktok_snippet: cleanString(values.project.tiktok_snippet),
      cover_link: cleanString(values.project.cover_link),
      promo_assets_link: cleanString(values.project.promo_assets_link),
      presskit_link: cleanString(values.project.presskit_link),
      has_video_asset: cleanYesNo(values.project.has_video_asset),
      video_link: cleanString(values.project.video_link),
      video_release_date: cleanString(values.project.video_release_date),
      cover_file: cleanFileRef(values.project.cover_file),
    },
    tracks: values.tracks.map((track, index) => ({
      local_id: track.local_id,
      client_track_id: track.client_track_id ?? track.local_id,
      order_number: index + 1,
      title: track.title.trim(),
      is_focus_track: track.is_focus_track,
      primary_artists: track.primary_artists.trim(),
      featured_artists: cleanString(track.featured_artists),
      interpreters: cleanString(track.interpreters),
      authors: track.authors.trim(),
      publishers: cleanString(track.publishers),
      producers_musicians: cleanString(track.producers_musicians),
      phonographic_producer: cleanString(track.phonographic_producer),
      artist_profiles_status: cleanString(track.artist_profiles_status),
      artist_profile_names_to_create: cleanString(
        track.artist_profile_names_to_create
      ),
      existing_profile_links: cleanString(track.existing_profile_links),
      has_isrc: cleanYesNo(track.has_isrc),
      isrc_code:
        track.has_isrc === "yes" ? cleanString(track.isrc_code) : undefined,
      explicit_content: cleanYesNo(track.explicit_content),
      tiktok_snippet: cleanString(track.tiktok_snippet),
      audio_file: cleanFileRef(track.audio_file),
      lyrics: cleanString(track.lyrics),
      track_status: track.track_status,
    })),
    marketing: hasMarketingValue ? marketing : undefined,
    meta: {
      form_version: args.formVersion,
      source: buildWorkflowSource(
        args.workspaceSlug,
        args.workflowType,
        args.formVersion
      ),
      submitted_at: new Date().toISOString(),
    },
  } as ReleaseIntakeSubmitPayload;
}

export function buildRightsClearanceDraftPayload(
  args: WorkflowDraftPayloadBuilderArgs
): RightsClearanceDraftPayload {
  const values = args.values as RightsClearanceFormValues;

  return {
    draft_token: args.draftToken,
    workspace_slug: args.workspaceSlug,
    workflow_type: args.workflowType,
    current_step: args.currentStep as RightsClearanceDraftPayload["current_step"],
    progress_percent: getRightsClearanceProgressPercent(values),
    values,
    meta: {
      form_version: args.formVersion,
      source: buildWorkflowSource(
        args.workspaceSlug,
        args.workflowType,
        args.formVersion
      ),
      updated_at: new Date().toISOString(),
    },
  };
}

export function buildRightsClearanceSubmitPayload(
  args: WorkflowSubmitPayloadBuilderArgs
): RightsClearanceSubmitPayload {
  const values = args.values as RightsClearanceFormValues;
  const clearanceFormat = values.request_type.clearance_format;
  const commonClearanceScope = {
    music_title: values.clearance_scope.music_title.trim(),
    artist_name: values.clearance_scope.artist_name.trim(),
    phonogram_owner: values.clearance_scope.phonogram_owner.trim(),
    territory: values.clearance_scope.territory.trim(),
    licensing_period: values.clearance_scope.licensing_period.trim(),
  };
  const formatSpecificScope =
    clearanceFormat === "music_release_clearance_intake"
      ? undefined
      : clearanceFormat === "music_project_track"
      ? {
          composer_author_info: cleanString(
            values.clearance_scope.composer_author_info
          ),
          publisher_info: cleanString(values.clearance_scope.publisher_info),
          material_type: cleanString(values.clearance_scope.material_type),
          intended_use: cleanString(values.clearance_scope.intended_use),
          exclusivity: values.clearance_scope.exclusivity,
        }
      : {
          audiovisual_type: cleanString(values.clearance_scope.audiovisual_type),
          director_name: cleanString(values.clearance_scope.director_name),
          product_or_campaign_name: cleanString(
            values.clearance_scope.product_or_campaign_name
          ),
          scene_description: cleanString(values.clearance_scope.scene_description),
          sync_duration: cleanString(values.clearance_scope.sync_duration),
          media_channels: cleanString(values.clearance_scope.media_channels),
        };

  return {
    draft_token: args.draftToken,
    workspace_slug: args.workspaceSlug,
    workflow_type: args.workflowType,
    requester_identification: {
      requester_name: values.requester_identification.requester_name.trim(),
      requester_email: values.requester_identification.requester_email
        .trim()
        .toLowerCase(),
      requester_company: values.requester_identification.requester_company.trim(),
      requester_role: values.requester_identification.requester_role.trim(),
    },
    request_type: {
      clearance_format: values.request_type.clearance_format,
    },
    project_context: {
      project_title: values.project_context.project_title.trim(),
      responsible_company: values.project_context.responsible_company.trim(),
      client_or_distributor:
        values.project_context.client_or_distributor.trim(),
      release_or_start_date: values.project_context.release_or_start_date,
      release_type: values.project_context.release_type || undefined,
      project_synopsis: cleanString(values.project_context.project_synopsis),
      has_brand_association: cleanYesNo(values.project_context.has_brand_association),
      brand_context: cleanString(values.project_context.brand_context),
      general_clearance_notes: cleanString(
        values.project_context.general_clearance_notes
      ),
    },
    tracks:
      clearanceFormat === "music_release_clearance_intake"
        ? values.tracks.map((track, index) => ({
            local_id: track.local_id,
            order_number: index + 1,
            title: track.title.trim(),
            primary_artists: track.primary_artists.trim(),
            authors: track.authors.trim(),
            publishers: cleanString(track.publishers),
            phonogram_owner: track.phonogram_owner.trim(),
            has_isrc: cleanYesNo(track.has_isrc),
            isrc_code:
              track.has_isrc === "yes" ? cleanString(track.isrc_code) : undefined,
            notes_for_clearance: cleanString(track.notes_for_clearance),
          }))
        : undefined,
    clearance_scope:
      clearanceFormat === "music_release_clearance_intake"
        ? undefined
        : {
            ...commonClearanceScope,
            ...formatSpecificScope,
          },
    assets_references:
      clearanceFormat === "music_release_clearance_intake"
        ? undefined
        : {
            supporting_files: values.assets_references.supporting_files,
            reference_links:
              cleanString(values.assets_references.reference_links) || "",
            additional_notes:
              cleanString(values.assets_references.additional_notes) || "",
          },
    meta: {
      form_version: args.formVersion,
      source: buildWorkflowSource(
        args.workspaceSlug,
        args.workflowType,
        args.formVersion
      ),
      submitted_at: new Date().toISOString(),
    },
  };
}

function buildUnsupportedWorkflowPayloadError(workflowType: WorkflowType) {
  return new Error(
    `Workflow ${workflowType} ainda nao possui payload builder conectado no frontend.`
  );
}

function createUnsupportedWorkflowPayloadBuilders(
  workflowType: WorkflowType
): WorkflowPayloadBuilderSet {
  return {
    workflowType,
    buildDraftPayload() {
      throw buildUnsupportedWorkflowPayloadError(workflowType);
    },
    buildSubmitPayload() {
      throw buildUnsupportedWorkflowPayloadError(workflowType);
    },
  };
}

const RELEASE_INTAKE_PAYLOAD_BUILDERS: WorkflowPayloadBuilderSet = {
  workflowType: DEFAULT_RELEASE_INTAKE_WORKFLOW_TYPE,
  buildDraftPayload: buildReleaseIntakeDraftPayload,
  buildSubmitPayload: buildReleaseIntakeSubmitPayload,
};

const RIGHTS_CLEARANCE_PAYLOAD_BUILDERS: WorkflowPayloadBuilderSet = {
  workflowType: RIGHTS_CLEARANCE_WORKFLOW_TYPE,
  buildDraftPayload: buildRightsClearanceDraftPayload,
  buildSubmitPayload: buildRightsClearanceSubmitPayload,
};

export function getWorkflowPayloadBuilders(
  workflowType?: WorkflowType | null
): WorkflowPayloadBuilderSet {
  const registryEntry = getWorkflowRegistryEntry(workflowType);

  switch (registryEntry.payloadBuilder) {
    case "release_intake":
      return RELEASE_INTAKE_PAYLOAD_BUILDERS;
    case "rights_clearance":
      return RIGHTS_CLEARANCE_PAYLOAD_BUILDERS;
    default:
      return createUnsupportedWorkflowPayloadBuilders(registryEntry.workflowType);
  }
}

export function buildWorkflowDraftPayload(
  args: WorkflowDraftPayloadBuilderArgs
): WorkflowDraftPayload {
  return getWorkflowPayloadBuilders(args.workflowType).buildDraftPayload(args);
}

export function buildWorkflowSubmitPayload(
  args: WorkflowSubmitPayloadBuilderArgs
): WorkflowSubmitPayload {
  return getWorkflowPayloadBuilders(args.workflowType).buildSubmitPayload(args);
}

export const buildDraftPayload = buildReleaseIntakeDraftPayload;
export const buildSubmitPayload = buildReleaseIntakeSubmitPayload;
