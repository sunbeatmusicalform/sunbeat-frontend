import type { UploadedFileRef, YesNo } from "./types";

export type ArtistProfilesStatus =
  | "already_exists"
  | "needs_creation"
  | "mixed"
  | "";

export type TrackStatus = "draft" | "ready";

export type TrackInput = {
  local_id: string;
  order_number: number;
  title: string;
  is_focus_track: boolean;

  primary_artists: string;
  featured_artists: string;
  interpreters: string;

  authors: string;
  publishers: string;
  producers_musicians: string;
  phonographic_producer: string;

  artist_profiles_status: ArtistProfilesStatus;
  artist_profile_names_to_create: string;
  existing_profile_links: string;

  has_isrc: YesNo | "";
  isrc_code: string;
  explicit_content: YesNo | "";
  tiktok_snippet: string;

  audio_file: UploadedFileRef | null;
  lyrics: string;
  track_status: TrackStatus;
};

export function createEmptyTrack(orderNumber = 1): TrackInput {
  return {
    local_id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `track-${Date.now()}-${orderNumber}`,
    order_number: orderNumber,
    title: "",
    is_focus_track: orderNumber === 1,

    primary_artists: "",
    featured_artists: "",
    interpreters: "",

    authors: "",
    publishers: "",
    producers_musicians: "",
    phonographic_producer: "",

    artist_profiles_status: "",
    artist_profile_names_to_create: "",
    existing_profile_links: "",

    has_isrc: "",
    isrc_code: "",
    explicit_content: "",
    tiktok_snippet: "",

    audio_file: null,
    lyrics: "",
    track_status: "draft",
  };
}

export function getMinimumTrackCount(
  releaseType: "single" | "ep" | "album" | ""
): number {
  if (releaseType === "single") return 1;
  if (releaseType === "ep") return 2;
  if (releaseType === "album") return 2;
  return 0;
}

export function getMaximumTrackCount(
  releaseType: "single" | "ep" | "album" | ""
): number | null {
  if (releaseType === "single") return 1;
  return null;
}
