import type {
  ReleaseIntakeDraftPayload,
  ReleaseIntakeFormValues,
  ReleaseIntakeSubmitPayload,
} from "./types";

import { getMinimumTrackCount } from "./track-types";

export function getProgressPercent(values: ReleaseIntakeFormValues): number {
  const checks = [
    !!values.identification.submitter_name.trim(),
    !!values.identification.submitter_email.trim(),
    !!values.identification.project_title.trim(),
    !!values.identification.release_type,
    !!values.project.release_date,
    !!values.project.genre.trim(),
    !!values.project.explicit_content,
    !!values.project.has_video_asset,
    !!values.project.cover_file,
    values.tracks.length > 0,
    !!values.marketing.marketing_numbers.trim(),
    !!values.marketing.marketing_focus.trim(),
    !!values.marketing.marketing_objectives.trim(),
    !!values.marketing.date_flexibility.trim(),
    !!values.marketing.has_special_guests,
    !!values.marketing.promotion_participants.trim(),
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

  if (!values.project.genre.trim()) {
    errors["project.genre"] = "Informe o gênero musical.";
  }

  if (!values.project.explicit_content) {
    errors["project.explicit_content"] = "Informe se o conteúdo é explícito.";
  }

  if (!values.project.has_video_asset) {
    errors["project.has_video_asset"] =
      "Informe se há videoclipe, lyric ou visualizer.";
  }

  if (!values.project.cover_file) {
    errors["project.cover_file"] = "Envie a capa do projeto.";
  }

  return errors;
}

export function validateTracks(values: ReleaseIntakeFormValues) {
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

    if (!track.title.trim()) {
      errors[`${prefix}.title`] = "Preencha o título da faixa.";
    }

    if (!track.primary_artists.trim()) {
      errors[`${prefix}.primary_artists`] = "Preencha os artistas principais.";
    }

    if (!track.interpreters.trim()) {
      errors[`${prefix}.interpreters`] = "Preencha os intérpretes.";
    }

    if (!track.authors.trim()) {
      errors[`${prefix}.authors`] = "Preencha os autores.";
    }

    if (!track.artist_profiles_status) {
      errors[`${prefix}.artist_profiles_status`] =
        "Informe se os artistas já têm perfil ou precisam de criação.";
    }

    if (!track.has_isrc) {
      errors[`${prefix}.has_isrc`] = "Informe se a música já tem ISRC.";
    }

    if (track.has_isrc === "yes" && !track.isrc_code.trim()) {
      errors[`${prefix}.isrc_code`] = "Informe o código ISRC.";
    }

    if (!track.explicit_content) {
      errors[`${prefix}.explicit_content`] = "Informe se a faixa é explícita.";
    }
  });

  return errors;
}

export function validateMarketing(values: ReleaseIntakeFormValues) {
  const errors: Record<string, string> = {};

  if (!values.marketing.marketing_numbers.trim()) {
    errors["marketing.marketing_numbers"] =
      "Preencha os números ou fatos importantes do lançamento.";
  }

  if (!values.marketing.marketing_focus.trim()) {
    errors["marketing.marketing_focus"] =
      "Preencha o foco do artista e do lançamento.";
  }

  if (!values.marketing.marketing_objectives.trim()) {
    errors["marketing.marketing_objectives"] =
      "Preencha os objetivos do lançamento.";
  }

  if (!values.marketing.date_flexibility.trim()) {
    errors["marketing.date_flexibility"] =
      "Preencha a flexibilidade de data do lançamento.";
  }

  if (!values.marketing.has_special_guests) {
    errors["marketing.has_special_guests"] =
      "Informe se haverá convidados especiais.";
  }

  if (!values.marketing.promotion_participants.trim()) {
    errors["marketing.promotion_participants"] =
      "Preencha os participantes da promoção.";
  }

  return errors;
}

export function validateAll(values: ReleaseIntakeFormValues) {
  return {
    ...validateIdentification(values),
    ...validateProject(values),
    ...validateTracks(values),
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

export function buildSubmitPayload(args: {
  draftToken: string;
  workspaceSlug: string;
  formVersion: number;
  values: ReleaseIntakeFormValues;
}): ReleaseIntakeSubmitPayload {
  return {
    draft_token: args.draftToken,
    workspace_slug: args.workspaceSlug,
    identification: args.values.identification,
    project: args.values.project,
    tracks: args.values.tracks.map((track, index) => ({
      ...track,
      order_number: index + 1,
    })),
    marketing: args.values.marketing,
    meta: {
      form_version: args.formVersion,
      source: "sunbeat_release_intake",
      submitted_at: new Date().toISOString(),
    },
  };
}