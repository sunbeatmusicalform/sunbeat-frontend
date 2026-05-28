import {
  releaseIntakeSchemaValuesToUploadManifestCandidate,
  releaseIntakeUploadManifestContainsRuntimeBinary,
  summarizeReleaseIntakeUploadParity,
} from "./release-intake.upload-adapter";
import {
  MOCK_MARKETING_ADDITIONAL_FILES,
  MOCK_SCHEMA_UPLOAD_INVALID_COVER,
  MOCK_SCHEMA_UPLOAD_MINIMAL,
  MOCK_SCHEMA_UPLOAD_VALID_COVER,
  MOCK_SCHEMA_UPLOAD_WITH_MISSING_TRACK_AUDIO,
} from "./release-intake.upload-adapter.fixtures";

export type ReleaseIntakeUploadAdapterHarnessAssertion = {
  name: string;
  passed: boolean;
  detail: string;
};

export type ReleaseIntakeUploadAdapterHarnessResult = {
  ok: boolean;
  assertions: ReleaseIntakeUploadAdapterHarnessAssertion[];
};

function assertHarness(
  name: string,
  passed: boolean,
  detail: string
): ReleaseIntakeUploadAdapterHarnessAssertion {
  return { name, passed, detail };
}

function hasFinding(
  findings: ReturnType<typeof summarizeReleaseIntakeUploadParity>["findings"],
  code: string
) {
  return findings.some((finding) => finding.code === code);
}

function stringify(value: unknown) {
  return JSON.stringify(value);
}

export function runReleaseIntakeUploadAdapterHarness(): ReleaseIntakeUploadAdapterHarnessResult {
  const validManifest = releaseIntakeSchemaValuesToUploadManifestCandidate(
    MOCK_SCHEMA_UPLOAD_VALID_COVER,
    { marketingAdditionalFiles: MOCK_MARKETING_ADDITIONAL_FILES }
  );
  const invalidManifest = releaseIntakeSchemaValuesToUploadManifestCandidate(
    MOCK_SCHEMA_UPLOAD_INVALID_COVER
  );
  const missingAudioManifest =
    releaseIntakeSchemaValuesToUploadManifestCandidate(
      MOCK_SCHEMA_UPLOAD_WITH_MISSING_TRACK_AUDIO
    );
  const minimalManifest = releaseIntakeSchemaValuesToUploadManifestCandidate(
    MOCK_SCHEMA_UPLOAD_MINIMAL
  );
  const summary = summarizeReleaseIntakeUploadParity(
    MOCK_SCHEMA_UPLOAD_VALID_COVER,
    { marketingAdditionalFiles: MOCK_MARKETING_ADDITIONAL_FILES }
  );

  const serializedValidManifest = stringify(validManifest);
  const forbiddenUploadRuntimeMarkers = [
    "signed" + "_upload" + "_token",
    "signed" + "Upload" + "Url",
    "create" + "Signed" + "Upload" + "Url",
  ];

  const assertions = [
    assertHarness(
      "cover-candidate-created",
      validManifest.cover?.field === "assets.cover_file" &&
        validManifest.cover.runtimeTarget.uploadRequestKind === "cover",
      "Manifest includes a cover upload candidate when schema cover metadata exists."
    ),
    assertHarness(
      "cover-metadata-preserved",
      validManifest.cover?.file.name === "aurora_leste_cover_3000.png" &&
        validManifest.cover.file.width === 3000 &&
        validManifest.cover.file.height === 3000 &&
        validManifest.cover.file.dpi === 300 &&
        validManifest.cover.file.status === "validated" &&
        validManifest.cover.file.preview === true,
      "Cover name, dimensions, DPI, status and preview metadata are preserved."
    ),
    assertHarness(
      "invalid-cover-blocker-derived",
      invalidManifest.cover?.file.width === 1500 &&
        invalidManifest.cover.blockers.includes("resolution") &&
        invalidManifest.cover.specs.some(
          (spec) =>
            spec.key === "resolution" &&
            spec.ok === false &&
            spec.weight === "blocker"
        ),
      "A 1500x1500 cover derives a blocking resolution spec without upload runtime."
    ),
    assertHarness(
      "track-audio-candidates-created",
      validManifest.trackAudio.length === 2 &&
        validManifest.trackAudio[0]?.trackLocalId === "track-1" &&
        validManifest.trackAudio[1]?.trackLocalId === "track-2",
      "Manifest includes per-track audio upload candidates with trackLocalId."
    ),
    assertHarness(
      "track-audio-metadata-preserved",
      validManifest.trackAudio[0]?.file.name ===
        "01_aurora_leste_master.wav" &&
        validManifest.trackAudio[0]?.file.sizeBytes === 48_234_111 &&
        validManifest.trackAudio[0]?.runtimeTarget.uploadRequestKind ===
          "audio",
      "Per-track audio name, size and upload kind metadata are preserved."
    ),
    assertHarness(
      "missing-track-audio-excluded",
      missingAudioManifest.trackAudio.length === 1 &&
        missingAudioManifest.excluded.some(
          (entry) =>
            entry.field === "tracks[].audio_file" &&
            entry.reason === "no_audio_for_track" &&
            entry.trackLocalId === "track-2"
        ),
      "Tracks without audio metadata do not create upload candidates."
    ),
    assertHarness(
      "marketing-additional-files-supported-when-supplied",
      validManifest.marketingAdditionalFiles.length === 1 &&
        validManifest.marketingAdditionalFiles[0]?.field ===
          "marketing.additional_files" &&
        validManifest.marketingAdditionalFiles[0]?.runtimeTarget
          .uploadRequestKind === "asset",
      "Adapter can include marketing additional file metadata when supplied explicitly."
    ),
    assertHarness(
      "pending-runtime-integration-listed",
      validManifest.pendingRuntimeIntegration.some(
        (entry) => entry.status === "requires_upload_runtime"
      ) &&
        validManifest.pendingRuntimeIntegration.some(
          (entry) => entry.status === "requires_storage_policy"
        ) &&
        validManifest.pendingRuntimeIntegration.some(
          (entry) => entry.status === "requires_drive_mapping"
        ) &&
        validManifest.pendingRuntimeIntegration.some(
          (entry) => entry.status === "requires_submit_integration"
        ),
      "Manifest lists upload runtime, storage policy, Drive and submit integration as pending."
    ),
    assertHarness(
      "no-file-or-blob-in-manifest",
      !releaseIntakeUploadManifestContainsRuntimeBinary(validManifest),
      "Manifest stores serializable metadata only and no File/Blob object."
    ),
    assertHarness(
      "no-upload-backend-token-produced",
      forbiddenUploadRuntimeMarkers.every(
        (marker) => !serializedValidManifest.includes(marker)
      ),
      "Harness does not produce signed upload tokens or backend upload handles."
    ),
    assertHarness(
      "summary-lists-upload-runtime-required",
      hasFinding(summary.findings, "upload_runtime_required") &&
        summary.counts.requires_upload_runtime === 1,
      "Summary reports that a real upload runtime is still required."
    ),
    assertHarness(
      "minimal-schema-has-no-upload-candidates",
      minimalManifest.cover === null &&
        minimalManifest.trackAudio.length === 0 &&
        minimalManifest.marketingAdditionalFiles.length === 0,
      "Minimal schema values do not create cover, audio or marketing upload candidates."
    ),
  ];

  return {
    ok: assertions.every((assertion) => assertion.passed),
    assertions,
  };
}

export const releaseIntakeUploadAdapterHarnessResult =
  runReleaseIntakeUploadAdapterHarness();
