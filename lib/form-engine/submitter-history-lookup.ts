export const RELEASE_INTAKE_SUBMITTER_HISTORY_FIELDS = [
  "primary_artists",
  "featured_artists",
  "interpreters",
  "authors",
  "publishers",
  "phonographic_producer",
  "producers_musicians",
  "existing_profile_links",
  "cover_link",
  "presskit_link",
  "promo_assets_link",
] as const;

export type ReleaseIntakeSubmitterHistoryField =
  (typeof RELEASE_INTAKE_SUBMITTER_HISTORY_FIELDS)[number];

export type ReleaseIntakeSubmitterHistoryLookupItem = {
  value: string;
  field: ReleaseIntakeSubmitterHistoryField;
  source: "submitter_history";
  count: number;
  lastUsedAt: string | null;
};

export type ReleaseIntakeSubmitterHistoryLookupResponse = {
  ok: true;
  items: ReleaseIntakeSubmitterHistoryLookupItem[];
};

export function isReleaseIntakeSubmitterHistoryField(
  value: unknown
): value is ReleaseIntakeSubmitterHistoryField {
  return RELEASE_INTAKE_SUBMITTER_HISTORY_FIELDS.includes(
    value as ReleaseIntakeSubmitterHistoryField
  );
}
