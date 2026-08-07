
ALTER TABLE people_registry_records
  ADD COLUMN IF NOT EXISTS edit_token UUID DEFAULT gen_random_uuid() NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS people_registry_records_edit_token_idx
  ON people_registry_records (edit_token);

-- Backfill any existing rows that somehow got NULL (shouldn't happen with DEFAULT, but safety)
UPDATE people_registry_records SET edit_token = gen_random_uuid() WHERE edit_token IS NULL;
;
