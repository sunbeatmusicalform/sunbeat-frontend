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
  | "computed"
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

export type ReleaseIntakeUploadManifestFieldMapEntry = {
  schemaFieldId: string;
  manifestPath: string;
  runtimePayloadPath: string | null;
  uploadKind: "cover" | "audio" | "asset";
  status:
    | "requires_upload_runtime"
    | "requires_storage_policy"
    | "requires_drive_mapping"
    | "requires_submit_integration"
    | "visual_only_metadata";
  notes: string;
};

export const VISUAL_ONLY_FIELDS = [
  "assets.cover_file",
  "assets.cover_specs",
  "tracks[].audio_file",
] as const;

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
      "Project-level primary_artist is derived from the first populated track artist for display only; tracks[].primary_artists remains the runtime source of truth.",
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
    schemaFieldId: "explicit_content",
    schemaStep: "project",
    runtimeStep: "release",
    runtimePayloadPath: "project.explicit_content",
    draftValuePath: "values.project.explicit_content",
    submitValuePath: "project.explicit_content",
    transform: "direct",
    parityStatus: "matched",
    notes: "Preserved by the isolated adapter; schema UI exposure remains a future product decision.",
  },
  {
    schemaFieldId: "tiktok_snippet",
    schemaStep: "project",
    runtimeStep: "release",
    runtimePayloadPath: "project.tiktok_snippet",
    draftValuePath: "values.project.tiktok_snippet",
    submitValuePath: "project.tiktok_snippet",
    transform: "direct",
    parityStatus: "matched",
    notes: "Project-level marketing snippet now survives the adapter round-trip.",
  },
  {
    schemaFieldId: "has_video_asset",
    schemaStep: "project",
    runtimeStep: "release",
    runtimePayloadPath: "project.has_video_asset",
    draftValuePath: "values.project.has_video_asset",
    submitValuePath: "project.has_video_asset",
    transform: "direct",
    parityStatus: "matched",
    notes:
      "Conditional rendering remains a TODO because schema engine v0 does not support visibleWhen.",
  },
  {
    schemaFieldId: "video_link",
    schemaStep: "project",
    runtimeStep: "release",
    runtimePayloadPath: "project.video_link",
    draftValuePath: "values.project.video_link",
    submitValuePath: "project.video_link",
    transform: "direct",
    parityStatus: "matched",
    notes:
      "Preserved as a string. Runtime activation still needs the active conditional policy.",
  },
  {
    schemaFieldId: "video_release_date",
    schemaStep: "project",
    runtimeStep: "release",
    runtimePayloadPath: "project.video_release_date",
    draftValuePath: "values.project.video_release_date",
    submitValuePath: "project.video_release_date",
    transform: "direct",
    parityStatus: "matched",
    notes:
      "Preserved as a text datetime string because FieldKind v0 has no datetime-local kind.",
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
      "Candidate copy is broader than marketing.general_notes; confirm product semantics before using this alias in runtime.",
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
      "The schema repeater now preserves core track fields, but runtime activation must still preserve local_id, order_number and internal profile fields.",
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
    schemaFieldId: "tracks.primary_artists",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].primary_artists",
    draftValuePath: "values.tracks[].primary_artists",
    submitValuePath: "tracks[].primary_artists",
    transform: "direct",
    parityStatus: "matched",
    notes:
      "Per-track primary artists are preserved and are not overwritten by project.primary_artist.",
  },
  {
    schemaFieldId: "tracks.featured_artists",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].featured_artists",
    draftValuePath: "values.tracks[].featured_artists",
    submitValuePath: "tracks[].featured_artists",
    transform: "direct",
    parityStatus: "matched",
    notes: "Direct per-track value transfer.",
  },
  {
    schemaFieldId: "tracks.interpreters",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].interpreters",
    draftValuePath: "values.tracks[].interpreters",
    submitValuePath: "tracks[].interpreters",
    transform: "direct",
    parityStatus: "matched",
    notes: "Direct per-track value transfer.",
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
    schemaFieldId: "tracks.publishers",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].publishers",
    draftValuePath: "values.tracks[].publishers",
    submitValuePath: "tracks[].publishers",
    transform: "direct",
    parityStatus: "matched",
    notes: "Direct per-track value transfer.",
  },
  {
    schemaFieldId: "tracks.producers_musicians",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].producers_musicians",
    draftValuePath: "values.tracks[].producers_musicians",
    submitValuePath: "tracks[].producers_musicians",
    transform: "direct",
    parityStatus: "matched",
    notes: "Direct per-track value transfer.",
  },
  {
    schemaFieldId: "tracks.phonographic_producer",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].phonographic_producer",
    draftValuePath: "values.tracks[].phonographic_producer",
    submitValuePath: "tracks[].phonographic_producer",
    transform: "direct",
    parityStatus: "matched",
    notes:
      "Preserved for draft/submit parity; active validation policy is not changed here.",
  },
  {
    schemaFieldId: "tracks.has_isrc",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].has_isrc",
    draftValuePath: "values.tracks[].has_isrc",
    submitValuePath: "tracks[].has_isrc",
    transform: "direct",
    parityStatus: "matched",
    notes:
      "Preserved because active submit uses this switch before serializing isrc_code.",
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
    notes: "Direct per-track value transfer.",
  },
  {
    schemaFieldId: "tracks.explicit_content",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].explicit_content",
    draftValuePath: "values.tracks[].explicit_content",
    submitValuePath: "tracks[].explicit_content",
    transform: "direct",
    parityStatus: "matched",
    notes: "Direct per-track value transfer.",
  },
  {
    schemaFieldId: "tracks.tiktok_snippet",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].tiktok_snippet",
    draftValuePath: "values.tracks[].tiktok_snippet",
    submitValuePath: "tracks[].tiktok_snippet",
    transform: "direct",
    parityStatus: "matched",
    notes: "Direct per-track value transfer.",
  },
  {
    schemaFieldId: "tracks.audio_file",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].audio_file",
    draftValuePath: "values.tracks[].audio_file",
    submitValuePath: "tracks[].audio_file",
    transform: "visual_only",
    parityStatus: "visual_only",
    uploadKind: "audio",
    notes:
      "Per-track audio metadata survives in schema values and can be described by the PR22 upload manifest, but remains disconnected from runtime upload.",
  },
  {
    schemaFieldId: "tracks.lyrics",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].lyrics",
    draftValuePath: "values.tracks[].lyrics",
    submitValuePath: "tracks[].lyrics",
    transform: "direct",
    parityStatus: "matched",
    notes: "Direct per-track value transfer.",
  },
  {
    schemaFieldId: "tracks.validations",
    schemaStep: "tracks",
    runtimeStep: "tracks",
    runtimePayloadPath: "tracks[].isrc_code",
    draftValuePath: null,
    submitValuePath: null,
    transform: "computed",
    parityStatus: "visual_only",
    notes:
      "Computed schema-only validation bundle; duplicate ISRC does not alter runtime patch or submit behavior in this PR.",
  },
  {
    schemaFieldId: "cover_file",
    schemaStep: "assets",
    runtimeStep: "release",
    runtimePayloadPath: "project.cover_file",
    draftValuePath: "values.project.cover_file",
    submitValuePath: "project.cover_file",
    transform: "visual_only",
    parityStatus: "visual_only",
    uploadKind: "cover",
    notes:
      "Cover metadata is displayed, used to derive cover_specs and can be described by the PR22 upload manifest, but file refs stay out of patches.",
  },
  {
    schemaFieldId: "cover_specs",
    schemaStep: "assets",
    runtimeStep: "release",
    runtimePayloadPath: "project.cover_file",
    draftValuePath: null,
    submitValuePath: null,
    transform: "computed",
    parityStatus: "visual_only",
    notes:
      "Computed from cover_file width, height, dpi and status. Runtime upload validation is unchanged.",
  },
  {
    schemaFieldId: "cover_link",
    schemaStep: "assets",
    runtimeStep: "release",
    runtimePayloadPath: "project.cover_link",
    draftValuePath: "values.project.cover_link",
    submitValuePath: "project.cover_link",
    transform: "direct",
    parityStatus: "matched",
    notes: "Direct link fallback transfer.",
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
    schemaFieldId: "presskit_link",
    schemaStep: "assets",
    runtimeStep: "release",
    runtimePayloadPath: "project.presskit_link",
    draftValuePath: "values.project.presskit_link",
    submitValuePath: "project.presskit_link",
    transform: "direct",
    parityStatus: "matched",
    notes:
      "Presskit is now a URL/string field; empty string remains empty string and no boolean reduction is used.",
  },
  {
    schemaFieldId: "marketing.*",
    schemaStep: "project",
    runtimeStep: "marketing",
    runtimePayloadPath: "marketing",
    draftValuePath: "values.marketing",
    submitValuePath: "marketing",
    transform: "direct",
    parityStatus: "partial",
    notes:
      "The isolated adapter preserves marketing fields in schema values, but the visible FormSchema still lacks a dedicated marketing step.",
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
    runtimePayloadPath: "tracks[].is_focus_track",
    runtimeStep: "tracks",
    risk: "medium",
    reason:
      "Active runtime defaults or stores focus track state; schema v0 still needs product policy.",
  },
  {
    runtimePayloadPath: "tracks[].artist_profiles_status",
    runtimeStep: "tracks",
    risk: "medium",
    reason:
      "Active profile-management state is not modeled in the schema candidate.",
  },
  {
    runtimePayloadPath: "tracks[].artist_profile_names_to_create",
    runtimeStep: "tracks",
    risk: "medium",
    reason:
      "Active profile-management state is not modeled in the schema candidate.",
  },
  {
    runtimePayloadPath: "tracks[].existing_profile_links",
    runtimeStep: "tracks",
    risk: "medium",
    reason:
      "Active profile-management state is not modeled in the schema candidate.",
  },
  {
    runtimePayloadPath: "marketing.additional_files",
    runtimeStep: "marketing",
    risk: "high",
    reason:
      "Active optional marketing uploads are runtime-only unless explicitly supplied to the PR22 upload manifest adapter.",
  },
] as const satisfies readonly ReleaseIntakeRuntimeOnlyPath[];

export const releaseIntakeUploadManifestFieldMap = [
  {
    schemaFieldId: "assets.cover_file",
    manifestPath: "cover",
    runtimePayloadPath: "project.cover_file",
    uploadKind: "cover",
    status: "requires_upload_runtime",
    notes:
      "Manifest preserves cover file metadata and computed specs, but the active upload route must still create the real file ref.",
  },
  {
    schemaFieldId: "assets.cover_specs",
    manifestPath: "cover.specs",
    runtimePayloadPath: null,
    uploadKind: "cover",
    status: "visual_only_metadata",
    notes:
      "Cover specs are computed from metadata and must not be sent as upload or submit payload.",
  },
  {
    schemaFieldId: "tracks[].audio_file",
    manifestPath: "trackAudio[]",
    runtimePayloadPath: "tracks[].audio_file",
    uploadKind: "audio",
    status: "requires_upload_runtime",
    notes:
      "Manifest preserves per-track audio metadata and trackLocalId, but upload path creation remains runtime-owned.",
  },
  {
    schemaFieldId: "marketing.additional_files",
    manifestPath: "marketingAdditionalFiles[]",
    runtimePayloadPath: "marketing.additional_files",
    uploadKind: "asset",
    status: "requires_upload_runtime",
    notes:
      "Schema values do not include marketing additional files yet; the adapter can carry explicit fixture metadata for parity review.",
  },
] as const satisfies readonly ReleaseIntakeUploadManifestFieldMapEntry[];

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
