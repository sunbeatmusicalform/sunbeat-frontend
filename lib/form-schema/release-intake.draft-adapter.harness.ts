import {
  releaseIntakeSchemaValuesToRuntimeDraftPatch,
  runtimeDraftToReleaseIntakeSchemaValues,
  summarizeReleaseIntakeRoundTrip,
} from "./release-intake.draft-adapter";
import { releaseIntakeRuntimeDraftFixture } from "./release-intake.draft-adapter.fixtures";

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

export function runReleaseIntakeDraftAdapterHarness(): ReleaseIntakeDraftAdapterHarnessResult {
  const schemaValues = runtimeDraftToReleaseIntakeSchemaValues(
    releaseIntakeRuntimeDraftFixture
  );
  const runtimePatch =
    releaseIntakeSchemaValuesToRuntimeDraftPatch(schemaValues);
  const summary = summarizeReleaseIntakeRoundTrip(
    releaseIntakeRuntimeDraftFixture
  );
  const issues = new Set(summary.issues.map((issue) => issue.code));

  const assertions = [
    assertHarness(
      "matched-identification-fields",
      runtimePatch.values.identification.submitter_email ===
        releaseIntakeRuntimeDraftFixture.values.identification.submitter_email &&
        runtimePatch.values.identification.project_title ===
          releaseIntakeRuntimeDraftFixture.values.identification.project_title,
      "Submitter email and project title round-trip into the runtime draft patch."
    ),
    assertHarness(
      "matched-project-fields",
      runtimePatch.values.project.release_date ===
        releaseIntakeRuntimeDraftFixture.values.project.release_date &&
        runtimePatch.values.project.genre ===
          releaseIntakeRuntimeDraftFixture.values.project.genre &&
        runtimePatch.values.project.promo_assets_link ===
          releaseIntakeRuntimeDraftFixture.values.project.promo_assets_link,
      "Release date, genre and promo assets link are preserved."
    ),
    assertHarness(
      "track-title-author-isrc-preserved",
      runtimePatch.values.tracks.every((track, index) => {
        const source = releaseIntakeRuntimeDraftFixture.values.tracks[index];
        return (
          track.title === source.title &&
          track.authors === source.authors &&
          track.isrc_code === source.isrc_code
        );
      }),
      "Track title, authors and ISRC map back to the patch by track order."
    ),
    assertHarness(
      "audio-carried-with-track-id",
      runtimePatch.values.tracks[0]?.audio_file?.file_id ===
        releaseIntakeRuntimeDraftFixture.values.tracks[0]?.audio_file?.file_id,
      "Audio metadata is carried through the adapter by trackLocalId, while still documented as aggregate/partial."
    ),
    assertHarness(
      "presskit-loss-reported",
      !("presskit_link" in runtimePatch.values.project) &&
        issues.has("presskit_link_reduced_to_boolean"),
      "Presskit link is not silently reduced to a boolean; the loss is reported."
    ),
    assertHarness(
      "track-primary-artist-partial-reported",
      schemaValues.primary_artist ===
        releaseIntakeRuntimeDraftFixture.values.tracks[0]?.primary_artists &&
        issues.has("track_primary_artists_collapsed"),
      "Project-level primary_artist uses the first track and reports per-track artist loss."
    ),
    assertHarness(
      "visual-only-not-in-runtime-patch",
      !("review" in runtimePatch.values) &&
        issues.has("duplicate_isrc_visual_only") &&
        issues.has("cover_spec_visual_only"),
      "Review and visual blockers stay out of the runtime draft patch."
    ),
  ];

  return {
    ok: assertions.every((assertion) => assertion.passed),
    assertions,
  };
}

export const releaseIntakeDraftAdapterHarnessResult =
  runReleaseIntakeDraftAdapterHarness();

