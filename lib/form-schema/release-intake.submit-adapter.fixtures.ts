import type { ReleaseIntakeSchemaValues } from "./release-intake.draft-adapter";
import { runtimeDraftToReleaseIntakeSchemaValues } from "./release-intake.draft-adapter";
import {
  MOCK_RUNTIME_FULL,
  MOCK_RUNTIME_UNIQUE_ISRC,
} from "./release-intake.draft-adapter.fixtures";

export const MOCK_SCHEMA_SUBMIT_FULL =
  runtimeDraftToReleaseIntakeSchemaValues(MOCK_RUNTIME_FULL);

export const MOCK_SCHEMA_SUBMIT_WITH_BLOCKERS = {
  ...MOCK_SCHEMA_SUBMIT_FULL,
  tracks: MOCK_SCHEMA_SUBMIT_FULL.tracks.map((track, index) =>
    index === 0
      ? {
          ...track,
          duration: "03:15",
        }
      : track
  ),
} satisfies ReleaseIntakeSchemaValues;

export const MOCK_SCHEMA_SUBMIT_UNIQUE_ISRC =
  runtimeDraftToReleaseIntakeSchemaValues(MOCK_RUNTIME_UNIQUE_ISRC);

export const MOCK_SCHEMA_SUBMIT_MINIMAL = {
  project: {
    submitter_name: "Paula Demo",
    submitter_email: "paula.demo@example.test",
    project_title: "Single Demo",
    primary_artist: "Paula Demo",
    release_type: "single",
    release_date: "2026-10-02",
    genre: "Pop",
    explicit_content: "no",
    tiktok_snippet: "",
    has_video_asset: "no",
    video_link: "",
    video_release_date: "",
    project_notes: "",
  },
  assets: {
    cover_file: null,
    cover_specs: [],
    cover_link: "https://example.test/minimal-cover",
    promo_assets_link: "",
    presskit_link: "",
  },
  tracks: [
    {
      id: "minimal-track-1",
      local_id: "minimal-track-1",
      order: 1,
      title: "Single Demo",
      duration: "",
      primary_artists: "Paula Demo",
      featured_artists: "",
      interpreters: "",
      authors: "Paula Demo",
      publishers: "",
      producers_musicians: "",
      phonographic_producer: "",
      has_isrc: "no",
      isrc_code: "",
      explicit_content: "no",
      tiktok_snippet: "",
      audio_file: null,
      lyrics: "",
      validations: {
        ok: ["title_present", "credits_present", "primary_artists_present"],
        warn: ["audio_missing"],
        err: [],
      },
    },
  ],
  marketing: {
    marketing_numbers: "",
    marketing_focus: "",
    marketing_objectives: "",
    has_marketing_budget: "",
    marketing_budget: "",
    focus_track_name: "",
    date_flexibility: "",
    has_special_guests: "",
    special_guests_bio: "",
    feat_will_promote: "",
    promotion_participants: "",
    influencers_brands_partners: "",
    general_notes: "",
  },
  review: null,
} satisfies ReleaseIntakeSchemaValues;
