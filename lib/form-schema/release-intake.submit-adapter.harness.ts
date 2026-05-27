import {
  releaseIntakeSchemaValuesToSubmitPayloadCandidate,
  summarizeReleaseIntakeSubmitParity,
} from "./release-intake.submit-adapter";
import {
  MOCK_SCHEMA_SUBMIT_FULL,
  MOCK_SCHEMA_SUBMIT_MINIMAL,
  MOCK_SCHEMA_SUBMIT_WITH_BLOCKERS,
} from "./release-intake.submit-adapter.fixtures";

export type ReleaseIntakeSubmitAdapterHarnessAssertion = {
  name: string;
  passed: boolean;
  detail: string;
};

export type ReleaseIntakeSubmitAdapterHarnessResult = {
  ok: boolean;
  assertions: ReleaseIntakeSubmitAdapterHarnessAssertion[];
};

function assertHarness(
  name: string,
  passed: boolean,
  detail: string
): ReleaseIntakeSubmitAdapterHarnessAssertion {
  return { name, passed, detail };
}

function hasOwn(object: object, key: string) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function hasFinding(
  findings: ReturnType<typeof summarizeReleaseIntakeSubmitParity>["findings"],
  code: string
) {
  return findings.some((finding) => finding.code === code);
}

export function runReleaseIntakeSubmitAdapterHarness(): ReleaseIntakeSubmitAdapterHarnessResult {
  const payload =
    releaseIntakeSchemaValuesToSubmitPayloadCandidate(MOCK_SCHEMA_SUBMIT_FULL);
  const minimalPayload = releaseIntakeSchemaValuesToSubmitPayloadCandidate(
    MOCK_SCHEMA_SUBMIT_MINIMAL
  );
  const summary = summarizeReleaseIntakeSubmitParity(
    MOCK_SCHEMA_SUBMIT_WITH_BLOCKERS
  );

  const assertions = [
    assertHarness(
      "project-main-fields-preserved",
      payload.identification.submitter_name ===
        MOCK_SCHEMA_SUBMIT_FULL.project.submitter_name &&
        payload.identification.submitter_email ===
          MOCK_SCHEMA_SUBMIT_FULL.project.submitter_email.toLowerCase() &&
        payload.identification.project_title ===
          MOCK_SCHEMA_SUBMIT_FULL.project.project_title &&
        payload.project.release_date ===
          MOCK_SCHEMA_SUBMIT_FULL.project.release_date,
      "Candidate payload preserves normalized identification and project fields."
    ),
    assertHarness(
      "presskit-link-string-preserved",
      payload.project.presskit_link ===
        MOCK_SCHEMA_SUBMIT_FULL.assets.presskit_link &&
        typeof payload.project.presskit_link === "string",
      "Presskit link survives submit candidate as a string."
    ),
    assertHarness(
      "marketing-video-fields-preserved",
      payload.project.tiktok_snippet ===
        MOCK_SCHEMA_SUBMIT_FULL.project.tiktok_snippet &&
        payload.project.has_video_asset ===
          MOCK_SCHEMA_SUBMIT_FULL.project.has_video_asset &&
        payload.project.video_link ===
          MOCK_SCHEMA_SUBMIT_FULL.project.video_link &&
        payload.project.video_release_date ===
          MOCK_SCHEMA_SUBMIT_FULL.project.video_release_date &&
        payload.marketing?.marketing_focus ===
          MOCK_SCHEMA_SUBMIT_FULL.marketing.marketing_focus,
      "Marketing and video fields survive the submit candidate."
    ),
    assertHarness(
      "per-track-primary-artists-preserved",
      payload.tracks[1]?.primary_artists ===
        MOCK_SCHEMA_SUBMIT_FULL.tracks[1]?.primary_artists &&
        payload.tracks[1]?.primary_artists !==
          MOCK_SCHEMA_SUBMIT_FULL.project.primary_artist,
      "Per-track primary artists are preserved and not overwritten by project.primary_artist."
    ),
    assertHarness(
      "isrc-code-preserved",
      payload.tracks[0]?.isrc_code ===
        MOCK_SCHEMA_SUBMIT_FULL.tracks[0]?.isrc_code,
      "ISRC code is preserved when has_isrc is yes."
    ),
    assertHarness(
      "track-audio-file-excluded",
      !hasOwn(payload.tracks[0] ?? {}, "audio_file"),
      "tracks[].audio_file is excluded from the submit candidate."
    ),
    assertHarness(
      "cover-visual-fields-excluded",
      !hasOwn(payload.project, "cover_file") &&
        !hasOwn(payload.project, "cover_specs"),
      "assets.cover_file and assets.cover_specs are excluded from the submit candidate."
    ),
    assertHarness(
      "summary-lists-visual-only-exclusions",
      hasFinding(summary.findings, "cover_file_visual_only") &&
        hasFinding(summary.findings, "track_audio_file_visual_only"),
      "Summary reports visual-only fields excluded from submit payload."
    ),
    assertHarness(
      "summary-lists-upload-parity",
      hasFinding(summary.findings, "upload_parity_pending_cover") &&
        hasFinding(summary.findings, "upload_parity_pending_audio") &&
        hasFinding(summary.findings, "upload_parity_pending_marketing_files"),
      "Summary reports pending upload parity for cover, audio and marketing files."
    ),
    assertHarness(
      "summary-lists-pending-decisions",
      hasFinding(summary.findings, "project_primary_artist_display_only") &&
        hasFinding(summary.findings, "focus_track_policy") &&
        hasFinding(summary.findings, "track_status_policy") &&
        hasFinding(summary.findings, "track_duration_no_submit_path"),
      "Summary reports pending submit decisions."
    ),
    assertHarness(
      "computed-blockers-stay-out-of-payload",
      hasFinding(summary.findings, "track_validations_computed_visual_only") &&
        !hasOwn(payload.tracks[0] ?? {}, "validations"),
      "Computed blockers are summarized but not serialized into payload."
    ),
    assertHarness(
      "minimal-schema-can-build-candidate",
      minimalPayload.identification.release_type === "single" &&
        minimalPayload.marketing === undefined &&
        minimalPayload.project.presskit_link === undefined,
      "Minimal valid schema values produce a submit candidate without optional empty strings."
    ),
  ];

  return {
    ok: assertions.every((assertion) => assertion.passed),
    assertions,
  };
}

export const releaseIntakeSubmitAdapterHarnessResult =
  runReleaseIntakeSubmitAdapterHarness();
