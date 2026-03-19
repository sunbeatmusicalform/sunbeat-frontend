import type {
  FormField,
  ReleaseIntakeDraftPayload,
  ReleaseIntakeFormValues,
  ReleaseIntakeSubmitPayload,
  UploadedFileRef,
} from "./types";

import type { TrackInput } from "./track-types";
import { getMinimumTrackCount } from "./track-types";

type TrackRequiredError = {
  field: keyof TrackInput;
  message: string;
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

  if (!values.project.release_date) {
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

export function buildDraftPayload(args: {
  draftToken: string;
  workspaceSlug: string;
  formVersion: number;
  currentStep: ReleaseIntakeDraftPayload["current_step"];
  values: ReleaseIntakeFormValues;
}): ReleaseIntakeDraftPayload {
  return {
    draft_token: args.draftToken,
    workspace_slug: args.workspaceSlug,
    current_step: args.currentStep,
    progress_percent: getProgressPercent(args.values),
    values: args.values,
    meta: {
      form_version: args.formVersion,
      source: "sunbeat_release_intake",
      updated_at: new Date().toISOString(),
    },
  };
}

function cleanString(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
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

export function buildSubmitPayload(args: {
  draftToken: string;
  workspaceSlug: string;
  formVersion: number;
  values: ReleaseIntakeFormValues;
}): ReleaseIntakeSubmitPayload {
  const marketing = {
    marketing_numbers: cleanString(args.values.marketing.marketing_numbers),
    marketing_focus: cleanString(args.values.marketing.marketing_focus),
    marketing_objectives: cleanString(args.values.marketing.marketing_objectives),
    has_marketing_budget: cleanYesNo(
      args.values.marketing.has_marketing_budget
    ),
    marketing_budget: cleanString(args.values.marketing.marketing_budget),
    focus_track_name: cleanString(args.values.marketing.focus_track_name),
    date_flexibility: cleanString(args.values.marketing.date_flexibility),
    has_special_guests: cleanYesNo(args.values.marketing.has_special_guests),
    special_guests_bio: cleanString(args.values.marketing.special_guests_bio),
    feat_will_promote: cleanYesNo(args.values.marketing.feat_will_promote),
    promotion_participants: cleanString(
      args.values.marketing.promotion_participants
    ),
    influencers_brands_partners: cleanString(
      args.values.marketing.influencers_brands_partners
    ),
    general_notes: cleanString(args.values.marketing.general_notes),
    additional_files: cleanFileRefs(args.values.marketing.additional_files),
  };

  const hasMarketingValue = Object.values(marketing).some(
    (value) => value !== undefined
  );

  return {
    draft_token: args.draftToken,
    workspace_slug: args.workspaceSlug,
    identification: {
      submitter_name: args.values.identification.submitter_name.trim(),
      submitter_email: args.values.identification.submitter_email
        .trim()
        .toLowerCase(),
      project_title: args.values.identification.project_title.trim(),
      release_type: args.values.identification.release_type,
    },
    project: {
      release_date: args.values.project.release_date,
      genre: cleanString(args.values.project.genre),
      explicit_content: cleanYesNo(args.values.project.explicit_content),
      tiktok_snippet: cleanString(args.values.project.tiktok_snippet),
      cover_link: cleanString(args.values.project.cover_link),
      promo_assets_link: cleanString(args.values.project.promo_assets_link),
      presskit_link: cleanString(args.values.project.presskit_link),
      has_video_asset: cleanYesNo(args.values.project.has_video_asset),
      video_link: cleanString(args.values.project.video_link),
      video_release_date: cleanString(args.values.project.video_release_date),
      cover_file: cleanFileRef(args.values.project.cover_file),
    },
    tracks: args.values.tracks.map((track, index) => ({
      local_id: track.local_id,
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
      source: "sunbeat_release_intake",
      submitted_at: new Date().toISOString(),
    },
  } as ReleaseIntakeSubmitPayload;
}
