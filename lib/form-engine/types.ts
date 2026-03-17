import type { TrackInput } from "./track-types";

export type ReleaseType = "single" | "ep" | "album";

export type YesNo = "yes" | "no";
export type YesNoUnknown = "yes" | "no" | "unknown";

export type FieldType =
  | "text"
  | "email"
  | "date"
  | "datetime-local"
  | "select"
  | "textarea"
  | "url"
  | "file";

export type FieldOption = {
  label: string;
  value: string;
};

export type UploadedFileRef = {
  file_id: string;
  file_name: string;
  storage_bucket?: string;
  storage_path: string;
  public_url?: string;
  download_url?: string;
  mime_type?: string;
  size_bytes?: number;
};

export type FormField = {
  key: string;
  type: FieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  options?: FieldOption[];
};

export type IntroConfig = {
  clientName: string;
  formTitle: string;
  introText: string;
  logoUrl?: string;
  bannerUrl?: string;
  brandWordmark?: string;
  supportLogoUrl?: string;
  supportLogoAlt?: string;
  supportLabel?: string;
  highlights?: string[];
};

export type FormStepKey =
  | "intro"
  | "identification"
  | "release"
  | "tracks"
  | "marketing"
  | "review_submit";

export type FormStep = {
  key: FormStepKey;
  title: string;
  description?: string;
  fields: FormField[];
};

export type ReleaseIntakeTemplate = {
  id: string;
  version: number;
  workspaceSlug: string;
  slogan: string;
  successMessage: string;
  intro: IntroConfig;
  steps: FormStep[];
};

export type IdentificationValues = {
  submitter_name: string;
  submitter_email: string;
  project_title: string;
  release_type: ReleaseType | "";
};

export type ProjectValues = {
  release_date: string;
  genre: string;
  explicit_content: YesNo | "";
  tiktok_snippet: string;
  cover_link: string;
  promo_assets_link: string;
  presskit_link: string;
  has_video_asset: YesNo | "";
  video_link: string;
  video_release_date: string;
  cover_file: UploadedFileRef | null;
};

export type MarketingValues = {
  marketing_numbers: string;
  marketing_focus: string;
  marketing_objectives: string;
  has_marketing_budget: YesNo | "";
  marketing_budget: string;
  focus_track_name: string;
  date_flexibility: string;
  has_special_guests: YesNo | "";
  special_guests_bio: string;
  feat_will_promote: YesNo | "";
  promotion_participants: string;
  influencers_brands_partners: string;
  general_notes: string;
  additional_files: UploadedFileRef[];
};

export type ReleaseIntakeFormValues = {
  identification: IdentificationValues;
  project: ProjectValues;
  tracks: TrackInput[];
  marketing: MarketingValues;
};

export type ReleaseIntakeDraftPayload = {
  draft_token?: string | null;
  workspace_slug: string;
  current_step: FormStepKey;
  progress_percent: number;
  values: ReleaseIntakeFormValues;
  meta: {
    form_version: number;
    source: "sunbeat_release_intake";
    updated_at?: string;
  };
};

export type ReleaseIntakeSubmitPayload = {
  draft_token?: string | null;
  workspace_slug: string;
  identification: IdentificationValues;
  project: ProjectValues;
  tracks: TrackInput[];
  marketing?: MarketingValues;
  meta: {
    form_version: number;
    source: "sunbeat_release_intake";
    submitted_at?: string;
  };
};
