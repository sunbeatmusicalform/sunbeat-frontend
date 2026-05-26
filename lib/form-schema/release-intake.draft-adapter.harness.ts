import {
  VISUAL_ONLY_FIELDS,
  releaseIntakeSchemaValuesToRuntimeDraftPatch,
  runtimeDraftToReleaseIntakeSchemaValues,
  summarizeReleaseIntakeRoundTrip,
} from "./release-intake.draft-adapter";
import {
  MOCK_RUNTIME_EMPTY_PRESSKIT,
  MOCK_RUNTIME_FULL,
  MOCK_RUNTIME_UNIQUE_ISRC,
  MOCK_RUNTIME_VALID_COVER,
} from "./release-intake.draft-adapter.fixtures";

export type ReleaseIntakeDraftAdapterHarnessAssertion = {
  name: string;
  passed: boolean;
  detail: string;
};

export type ReleaseIntakeDraftAdapterHarnessResult = {
  ok: boolean;
  assertions: ReleaseIntakeDraftAdapterHarnessAssertion[];
};

function assertHarness(
  name: string,
  passed: boolean,
  detail: string
): ReleaseIntakeDraftAdapterHarnessAssertion {
  return { name, passed, detail };
}

function hasOwn(object: object, key: string) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function runReleaseIntakeDraftAdapterHarness(): ReleaseIntakeDraftAdapterHarnessResult {
  const schemaValues = runtimeDraftToReleaseIntakeSchemaValues(MOCK_RUNTIME_FULL);
  const runtimePatch =
    releaseIntakeSchemaValuesToRuntimeDraftPatch(schemaValues);
  const emptyPresskitSchema =
    runtimeDraftToReleaseIntakeSchemaValues(MOCK_RUNTIME_EMPTY_PRESSKIT);
  const emptyPresskitPatch =
    releaseIntakeSchemaValuesToRuntimeDraftPatch(emptyPresskitSchema);
  const uniqueIsrcSchema =
    runtimeDraftToReleaseIntakeSchemaValues(MOCK_RUNTIME_UNIQUE_ISRC);
  const validCoverSchema =
    runtimeDraftToReleaseIntakeSchemaValues(MOCK_RUNTIME_VALID_COVER);
  const summary = summarizeReleaseIntakeRoundTrip(MOCK_RUNTIME_FULL);

  const lowCoverResolutionSpec = schemaValues.assets.cover_specs.find(
    (spec) => spec.key === "resolution"
  );
  const validCoverResolutionSpec = validCoverSchema.assets.cover_specs.find(
    (spec) => spec.key === "resolution"
  );

  const assertions = [
    assertHarness(
      "presskit-link-url-round-trip",
      schemaValues.assets.presskit_link ===
        MOCK_RUNTIME_FULL.values.project.presskit_link &&
        runtimePatch.values.project.presskit_link ===
          MOCK_RUNTIME_FULL.values.project.presskit_link &&
        typeof schemaValues.assets.presskit_link === "string",
      "Presskit URL remains a string through schema and patch."
    ),
    assertHarness(
      "presskit-link-empty-string-round-trip",
      emptyPresskitSchema.assets.presskit_link === "" &&
        emptyPresskitPatch.values.project.presskit_link === "" &&
        typeof emptyPresskitSchema.assets.presskit_link === "string",
      "Empty presskit link remains an empty string, not a boolean."
    ),
    assertHarness(
      "project-marketing-fields-round-trip",
      schemaValues.project.tiktok_snippet ===
        MOCK_RUNTIME_FULL.values.project.tiktok_snippet &&
        schemaValues.project.has_video_asset ===
          MOCK_RUNTIME_FULL.values.project.has_video_asset &&
        schemaValues.project.video_link ===
          MOCK_RUNTIME_FULL.values.project.video_link &&
        schemaValues.project.video_release_date ===
          MOCK_RUNTIME_FULL.values.project.video_release_date &&
        runtimePatch.values.project.tiktok_snippet ===
          MOCK_RUNTIME_FULL.values.project.tiktok_snippet &&
        runtimePatch.values.project.video_link ===
          MOCK_RUNTIME_FULL.values.project.video_link,
      "TikTok and video fields survive the round-trip."
    ),
    assertHarness(
      "runtime-marketing-fields-round-trip",
      runtimePatch.values.marketing.marketing_focus ===
        MOCK_RUNTIME_FULL.values.marketing.marketing_focus &&
        runtimePatch.values.marketing.marketing_objectives ===
          MOCK_RUNTIME_FULL.values.marketing.marketing_objectives &&
        runtimePatch.values.marketing.has_marketing_budget ===
          MOCK_RUNTIME_FULL.values.marketing.has_marketing_budget &&
        runtimePatch.values.marketing.general_notes ===
          MOCK_RUNTIME_FULL.values.marketing.general_notes,
      "Runtime marketing fields carried by the adapter survive the patch."
    ),
    assertHarness(
      "per-track-primary-artists-preserved",
      schemaValues.tracks[1]?.primary_artists ===
        MOCK_RUNTIME_FULL.values.tracks[1]?.primary_artists &&
        schemaValues.tracks[1]?.primary_artists !==
          schemaValues.project.primary_artist,
      "Per-track primary artists are not overwritten by project.primary_artist."
    ),
    assertHarness(
      "patch-includes-per-track-primary-artists",
      runtimePatch.values.tracks[1]?.primary_artists ===
        MOCK_RUNTIME_FULL.values.tracks[1]?.primary_artists,
      "Runtime patch includes primary_artists per track."
    ),
    assertHarness(
      "audio-file-schema-visual-only",
      schemaValues.tracks[0]?.audio_file?.name ===
        MOCK_RUNTIME_FULL.values.tracks[0]?.audio_file?.file_name &&
        !hasOwn(runtimePatch.values.tracks[0] ?? {}, "audio_file"),
      "Per-track audio_file survives in schema but is excluded from patch."
    ),
    assertHarness(
      "duplicate-isrc-derived",
      schemaValues.tracks[0]?.validations.err.includes("isrc_duplicate") ===
        true &&
        schemaValues.tracks[1]?.validations.err.includes("isrc_duplicate") ===
          true,
      "Duplicate ISRC derives isrc_duplicate on both affected tracks."
    ),
    assertHarness(
      "unique-isrc-not-flagged",
      uniqueIsrcSchema.tracks.every(
        (track) => !track.validations.err.includes("isrc_duplicate")
      ),
      "Unique ISRC codes do not derive isrc_duplicate."
    ),
    assertHarness(
      "cover-low-resolution-blocker",
      lowCoverResolutionSpec?.ok === false &&
        lowCoverResolutionSpec.weight === "blocker" &&
        lowCoverResolutionSpec.value === "1500x1500",
      "1500x1500 cover derives a blocking resolution spec."
    ),
    assertHarness(
      "cover-valid-resolution-ok",
      validCoverResolutionSpec?.ok === true,
      "3000x3000 cover derives an OK resolution spec."
    ),
    assertHarness(
      "cover-visual-fields-excluded-from-patch",
      !hasOwn(runtimePatch.values.project, "cover_file") &&
        !hasOwn(runtimePatch.values.project, "cover_specs"),
      "cover_file and cover_specs stay out of the runtime patch."
    ),
    assertHarness(
      "visual-only-fields-constant",
      VISUAL_ONLY_FIELDS.includes("assets.cover_file") &&
        VISUAL_ONLY_FIELDS.includes("assets.cover_specs") &&
        VISUAL_ONLY_FIELDS.includes("tracks[].audio_file"),
      "VISUAL_ONLY_FIELDS names the three fields excluded from patch."
    ),
    assertHarness(
      "round-trip-scope-has-no-lost-issues",
      summary.counts.lost === 0 &&
        runtimePatch.values.project.presskit_link ===
          MOCK_RUNTIME_FULL.values.project.presskit_link &&
        runtimePatch.values.tracks[1]?.primary_artists ===
          MOCK_RUNTIME_FULL.values.tracks[1]?.primary_artists,
      "PR20 scoped fields round-trip without lost-field issues."
    ),
  ];

  return {
    ok: assertions.every((assertion) => assertion.passed),
    assertions,
  };
}

export const releaseIntakeDraftAdapterHarnessResult =
  runReleaseIntakeDraftAdapterHarness();

