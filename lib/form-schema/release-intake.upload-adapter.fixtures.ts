import type { ReleaseIntakeSchemaValues } from "./release-intake.draft-adapter";
import { runtimeDraftToReleaseIntakeSchemaValues } from "./release-intake.draft-adapter";
import {
  MOCK_RUNTIME_FULL,
  MOCK_RUNTIME_VALID_COVER,
} from "./release-intake.draft-adapter.fixtures";
import { MOCK_SCHEMA_SUBMIT_MINIMAL } from "./release-intake.submit-adapter.fixtures";
import type { ReleaseIntakeMarketingAdditionalFileInput } from "./release-intake.upload-adapter";

export const MOCK_SCHEMA_UPLOAD_VALID_COVER =
  runtimeDraftToReleaseIntakeSchemaValues(MOCK_RUNTIME_VALID_COVER);

export const MOCK_SCHEMA_UPLOAD_INVALID_COVER =
  runtimeDraftToReleaseIntakeSchemaValues(MOCK_RUNTIME_FULL);

export const MOCK_SCHEMA_UPLOAD_WITH_MISSING_TRACK_AUDIO = {
  ...MOCK_SCHEMA_UPLOAD_INVALID_COVER,
  tracks: MOCK_SCHEMA_UPLOAD_INVALID_COVER.tracks.map((track, index) =>
    index === 1
      ? {
          ...track,
          audio_file: null,
          validations: {
            ok: track.validations.ok.filter(
              (code) => code !== "audio_file_present"
            ),
            warn: Array.from(
              new Set([...track.validations.warn, "audio_missing"])
            ),
            err: track.validations.err,
          },
        }
      : track
  ),
} satisfies ReleaseIntakeSchemaValues;

export const MOCK_SCHEMA_UPLOAD_MINIMAL =
  MOCK_SCHEMA_SUBMIT_MINIMAL satisfies ReleaseIntakeSchemaValues;

export const MOCK_MARKETING_ADDITIONAL_FILES: ReleaseIntakeMarketingAdditionalFileInput[] =
  [
    {
      file_id: "mock-asset-press-photo",
      file_name: "press_photo_demo.jpg",
      storage_bucket: "mock-assets",
      storage_path: "atabaque/drafts/mock-draft/assets/press_photo_demo.jpg",
      public_url: "https://example.test/files/mock-asset-press-photo",
      download_url: "https://example.test/files/mock-asset-press-photo/download",
      mime_type: "image/jpeg",
      size_bytes: 1_204_111,
      status: "validated",
      category: "press_photo",
    },
  ];
