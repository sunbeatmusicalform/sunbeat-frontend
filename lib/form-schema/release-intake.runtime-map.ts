import type {
  ReleaseIntakeParityRisk,
  ReleaseIntakeParityStatus,
  ReleaseIntakeRuntimeStepKey,
  ReleaseIntakeSchemaStepId,
} from "./release-intake.parity";

export type ReleaseIntakeRuntimeTransform =
  | "direct"
  | "derived"
  | "aggregate"
  | "not_mapped"
  | "visual_only";

export type ReleaseIntakeRuntimeMapEntry = {
  schemaFieldId: string;
  schemaStep: ReleaseIntakeSchemaStepId;
  runtimeStep: ReleaseIntakeRuntimeStepKey | null;
  runtimePayloadPath: string | null;
  draftValuePath: string | null;
  submitValuePath: string | null;
  transform: ReleaseIntakeRuntimeTransform;
  parityStatus: ReleaseIntakeParityStatus;
  uploadKind?: "cover" | "audio" | "asset";
  runtimeAliases?: readonly string[];
  notes: string;
};

export type ReleaseIntakeRuntimeOnlyPath = {
  runtimePayloadPath: string;
  runtimeStep: ReleaseIntakeRuntimeStepKey;
  risk: ReleaseIntakeParityRisk;
  reason: string;
};

export type ReleaseIntakeRuntimeSurfaceMap = {
  surface: "draft" | "submit" | "edit_mode" | "upload";
  activeEntryPoint: string;
  activeBuilderOrRoute: string;
  schemaParityRequirement: string;
};

export const releaseIntakeRuntimeFieldMap = [
  {
    schemaFieldId: "submitter_name",
    schemaStep: "project",
    runtimeStep: "identification",
    runtimePayloadPath: "identification.submitter_name",
    draftValuePath: "values.identification.submitter_name",
    submitValuePath: "identification.submitter_name",
    transform: "direct",
    parityStatus: "matched",
    notes: "Direct value transfer; no runtime adapter needed beyond path mapping.",
  },
  {
    schemaFieldId: "submitter_email",
    schemaStep: "project",
    runtimeStep: "identification",
    runtimePayloadPath: "identification.submitter_email",
    draftValuePath: "values.identification.submitter_email",
    submitValuePath: "identification.submitter_email",
    transform: "direct",
    parityStatus: "matched",
    notes: "Submit builder lowercases the active runtime value.",
  },
  {
    schemaFieldId: "project_title",
    schemaStep: "project",
    runtimeStep: "identification",
    runtimePayloadPath: "identification.project_title",
    draftValuePath: "values.identification.project_title",
    submitValuePath: "identification.project_title",
    transform: "direct",
    parityStatus: "matched",
    notes: "Direct value transfer; used by draft email and submission payload.",
  },
  {
    schemaFieldId: "primary_artist",
    schemaStep: "project",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].primary_artists",
    draftValuePath: "values.tracks[].primary_artists",
    submitValuePath: "tracks[].primary_artists",
    transform: "derived",
    parityStatus: "partial",
    runtimeAliases: ["tracks[0].primary_artists"],
    notes:
      "Needs an explicit policy: copy the project-level artist into each track, first track only, or replace it with per-track fields.",
  },
  {
    schemaFieldId: "release_type",
    schemaStep: "project",
    runtimeStep: "identification",
    runtimePayloadPath: "identification.release_type",
    draftValuePath: "values.identification.release_type",
    submitValuePath: "identification.release_type",
    transform: "direct",
    parityStatus: "matched",
    notes: "Direct value transfer; active runtime uses it for track count limits.",
  },
  {
    schemaFieldId: "release_date",
    schemaStep: "project",
    runtimeStep: "release",
    runtimePayloadPath: "project.release_date",
    draftValuePath: "values.project.release_date",
    submitValuePath: "project.release_date",
    transform: "direct",
    parityStatus: "matched",
    notes: "Submit builder normalizes date strings to YYYY-MM-DD.",
  },
  {
    schemaFieldId: "genre",
    schemaStep: "project",
    runtimeStep: "release",
    runtimePayloadPath: "project.genre",
    draftValuePath: "values.project.genre",
    submitValuePath: "project.genre",
    transform: "direct",
    parityStatus: "matched",
    notes: "Direct value transfer.",
  },
  {
    schemaFieldId: "project_notes",
    schemaStep: "project",
    runtimeStep: "marketing",
    runtimePayloadPath: "marketing.general_notes",
    draftValuePath: "values.marketing.general_notes",
    submitValuePath: "marketing.general_notes",
    transform: "derived",
    parityStatus: "partial",
    runtimeAliases: ["general_notes"],
    notes:
      "Candidate copy is broader than marketing.general_notes; confirm product semantics before using this alias.",
  },
  {
    schemaFieldId: "tracks",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[]",
    draftValuePath: "values.tracks[]",
    submitValuePath: "tracks[]",
    transform: "aggregate",
    parityStatus: "partial",
    notes:
      "The schema repeater is a subset. Runtime adapter must preserve local_id, client_track_id, order_number and track_status.",
  },
  {
    schemaFieldId: "tracks.title",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].title",
    draftValuePath: "values.tracks[].title",
    submitValuePath: "tracks[].title",
    transform: "direct",
    parityStatus: "matched",
    notes: "Direct per-track value transfer.",
  },
  {
    schemaFieldId: "tracks.duration",
    schemaStep: "tracks",
    runtimeStep: null,
    runtimePayloadPath: null,
    draftValuePath: null,
    submitValuePath: null,
    transform: "not_mapped",
    parityStatus: "missing_in_runtime",
    notes: "No active runtime payload path exists for duration.",
  },
  {
    schemaFieldId: "tracks.isrc_code",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].isrc_code",
    draftValuePath: "values.tracks[].isrc_code",
    submitValuePath: "tracks[].isrc_code",
    transform: "direct",
    parityStatus: "matched",
    runtimeAliases: ["tracks[].has_isrc"],
    notes:
      "The adapter also needs has_isrc because active submit drops isrc_code unless has_isrc is yes.",
  },
  {
    schemaFieldId: "tracks.authors",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].authors",
    draftValuePath: "values.tracks[].authors",
    submitValuePath: "tracks[].authors",
    transform: "direct",
    parityStatus: "matched",
    notes: "Direct per-track value transfer.",
  },
  {
    schemaFieldId: "cover_file",
    schemaStep: "assets",
    runtimeStep: "release",
    runtimePayloadPath: "project.cover_file",
    draftValuePath: "values.project.cover_file",
    submitValuePath: "project.cover_file",
    transform: "direct",
    parityStatus: "matched",
    uploadKind: "cover",
    notes:
      "Path parity exists, but any runtime use must keep the existing signed upload API and UploadedFileRef contract.",
  },
  {
    schemaFieldId: "audio_files",
    schemaStep: "assets",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].audio_file",
    draftValuePath: "values.tracks[].audio_file",
    submitValuePath: "tracks[].audio_file",
    transform: "aggregate",
    parityStatus: "partial",
    uploadKind: "audio",
    notes:
      "Candidate aggregate must be split into per-track audio_file refs before runtime binding.",
  },
  {
    schemaFieldId: "promo_assets_link",
    schemaStep: "assets",
    runtimeStep: "release",
    runtimePayloadPath: "project.promo_assets_link",
    draftValuePath: "values.project.promo_assets_link",
    submitValuePath: "project.promo_assets_link",
    transform: "direct",
    parityStatus: "matched",
    notes: "Direct project link transfer.",
  },
  {
    schemaFieldId: "presskit_available",
    schemaStep: "assets",
    runtimeStep: "release",
    runtimePayloadPath: "project.presskit_link",
    draftValuePath: "values.project.presskit_link",
    submitValuePath: "project.presskit_link",
    transform: "derived",
    parityStatus: "partial",
    notes:
      "Candidate boolean cannot preserve the active runtime presskit URL. Prefer a presskit_link field before runtime activation.",
  },
  {
    schemaFieldId: "review",
    schemaStep: "review",
    runtimeStep: "review_submit",
    runtimePayloadPath: null,
    draftValuePath: null,
    submitValuePath: null,
    transform: "visual_only",
    parityStatus: "visual_only",
    notes: "Review is derived UI and should not be serialized as payload.",
  },
] as const satisfies readonly ReleaseIntakeRuntimeMapEntry[];

export const releaseIntakeRuntimeOnlyPaths = [
  {
    runtimePayloadPath: "project.explicit_content",
    runtimeStep: "release",
    risk: "medium",
    reason: "Active project payload field is absent from the candidate schema.",
  },
  {
    runtimePayloadPath: "project.tiktok_snippet",
    runtimeStep: "release",
    risk: "low",
    reason: "Active editorial field is absent from the candidate schema.",
  },
  {
    runtimePayloadPath: "project.cover_link",
    runtimeStep: "release",
    risk: "medium",
    reason: "Active link fallback for cover is absent from the candidate schema.",
  },
  {
    runtimePayloadPath: "project.presskit_link",
    runtimeStep: "release",
    risk: "medium",
    reason: "Candidate uses a boolean instead of preserving the URL.",
  },
  {
    runtimePayloadPath: "project.has_video_asset",
    runtimeStep: "release",
    risk: "medium",
    reason: "Controls conditional video fields in the active renderer.",
  },
  {
    runtimePayloadPath: "project.video_link",
    runtimeStep: "release",
    risk: "medium",
    reason: "Conditional active project field is absent from the candidate.",
  },
  {
    runtimePayloadPath: "project.video_release_date",
    runtimeStep: "release",
    risk: "medium",
    reason: "Conditional active project date field is absent from the candidate.",
  },
  {
    runtimePayloadPath: "tracks[].primary_artists",
    runtimeStep: "tracks",
    risk: "high",
    reason: "Runtime stores primary artists per track, not only once per project.",
  },
  {
    runtimePayloadPath: "tracks[].has_isrc",
    runtimeStep: "tracks",
    risk: "high",
    reason: "Runtime uses this switch to decide whether isrc_code is serialized.",
  },
  {
    runtimePayloadPath: "tracks[].phonographic_producer",
    runtimeStep: "tracks",
    risk: "high",
    reason: "Active validation can require this when ISRC is present.",
  },
  {
    runtimePayloadPath: "tracks[].audio_file",
    runtimeStep: "tracks",
    risk: "high",
    reason: "Runtime stores audio per track; candidate has aggregate audio_files.",
  },
  {
    runtimePayloadPath: "marketing.marketing_focus",
    runtimeStep: "marketing",
    risk: "high",
    reason: "Active progress calculation checks this field.",
  },
  {
    runtimePayloadPath: "marketing.marketing_objectives",
    runtimeStep: "marketing",
    risk: "high",
    reason: "Active progress calculation checks this field.",
  },
  {
    runtimePayloadPath: "marketing.additional_files",
    runtimeStep: "marketing",
    risk: "high",
    reason: "Active optional asset upload list is absent from the candidate.",
  },
] as const satisfies readonly ReleaseIntakeRuntimeOnlyPath[];

export const releaseIntakeRuntimeSurfaces = [
  {
    surface: "draft",
    activeEntryPoint: "components/release-intake/ReleaseIntakePage.tsx",
    activeBuilderOrRoute: "buildWorkflowDraftPayload -> /api/release-drafts/save",
    schemaParityRequirement:
      "Preserve values.identification, values.project, values.tracks and values.marketing before any draft adapter is connected.",
  },
  {
    surface: "submit",
    activeEntryPoint: "components/release-intake/ReleaseIntakePage.tsx",
    activeBuilderOrRoute: "buildWorkflowSubmitPayload -> /api/submissions",
    schemaParityRequirement:
      "Match the active nested payload contract and submit normalization before any schema submit is enabled.",
  },
  {
    surface: "edit_mode",
    activeEntryPoint: "components/release-intake/ReleaseIntakePage.tsx",
    activeBuilderOrRoute: "/api/submissions/edit/[editToken]",
    schemaParityRequirement:
      "Hydration must round-trip existing submission payloads without dropping runtime-only fields.",
  },
  {
    surface: "upload",
    activeEntryPoint: "components/release-intake/ReleaseIntakePage.tsx",
    activeBuilderOrRoute: "/api/uploads + Supabase signed upload",
    schemaParityRequirement:
      "Keep UploadedFileRef shape, upload kind, draftToken and per-track audio paths intact.",
  },
] as const satisfies readonly ReleaseIntakeRuntimeSurfaceMap[];

