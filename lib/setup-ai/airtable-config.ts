export const SETUP_AI_AIRTABLE_WORKFLOWS = [
  {
    value: "company_registry",
    label: "Company registry",
    tableLabel: "[V2] - Empresas",
  },
  {
    value: "people_registry",
    label: "People registry",
    tableLabel: "[V2] - Pessoas",
  },
] as const;

export const SETUP_AI_AIRTABLE_OPERATIONS = [
  "read",
  "preview_patch",
  "apply_patch",
] as const;

export type SetupAiAirtableWorkflow =
  (typeof SETUP_AI_AIRTABLE_WORKFLOWS)[number]["value"];

export type SetupAiAirtableOperation =
  (typeof SETUP_AI_AIRTABLE_OPERATIONS)[number];

export type SyncMode = "keep" | "enabled" | "disabled";

export type SetupAiAirtablePatchDraft = {
  syncMode: SyncMode;
  baseIdOverride: string;
  tableOverride: string;
  mergeKeysJson: string;
  fieldMapJson: string;
};

export type SetupAiAirtablePatchPayload = {
  airtable_sync_enabled?: boolean;
  airtable?: {
    base_id_override?: string;
    table_override?: string;
    merge_keys?: unknown[];
    field_map?: Record<string, unknown>;
  };
};

export type SetupAiAirtableResponse = {
  ok?: boolean;
  operation?: string;
  workspace_slug?: string;
  workflow_type?: string;
  contract_version?: string;
  source?: string;
  airtable_sync_enabled?: unknown;
  effective?: unknown;
  raw?: unknown;
  origins?: unknown;
  contract?: unknown;
  applied_patch?: unknown;
  warnings?: string[];
  dry_run?: boolean;
  requires_confirmation?: boolean;
  confirmed?: boolean;
  updated?: string[];
  airtable_updated?: string[];
  current?: SetupAiAirtableResponse;
  current_before?: SetupAiAirtableResponse;
  error?: string;
  detail?: unknown;
};

type PatchBuildResult =
  | {
      ok: true;
      payload: SetupAiAirtablePatchPayload;
      metadataWarnings: string[];
    }
  | {
      ok: false;
      error: string;
    };

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function parseOptionalJson(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: true as const, value: undefined };
  }

  try {
    return { ok: true as const, value: JSON.parse(trimmed) as unknown };
  } catch {
    return {
      ok: false as const,
      error: `${label} must be valid JSON.`,
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isSetupAiAirtableWorkflow(
  value: unknown
): value is SetupAiAirtableWorkflow {
  return SETUP_AI_AIRTABLE_WORKFLOWS.some((workflow) => workflow.value === value);
}

export function isSetupAiAirtableOperation(
  value: unknown
): value is SetupAiAirtableOperation {
  return SETUP_AI_AIRTABLE_OPERATIONS.some((operation) => operation === value);
}

export function buildSetupAiAirtablePatch(
  draft: SetupAiAirtablePatchDraft
): PatchBuildResult {
  const airtable: NonNullable<SetupAiAirtablePatchPayload["airtable"]> = {};
  const metadataWarnings: string[] = [];

  const baseIdOverride = normalizeText(draft.baseIdOverride);
  if (baseIdOverride) {
    airtable.base_id_override = baseIdOverride;
  }

  const tableOverride = normalizeText(draft.tableOverride);
  if (tableOverride) {
    airtable.table_override = tableOverride;
  }

  const mergeKeys = parseOptionalJson(draft.mergeKeysJson, "merge_keys");
  if (!mergeKeys.ok) {
    return mergeKeys;
  }

  if (mergeKeys.value !== undefined) {
    if (!Array.isArray(mergeKeys.value)) {
      return {
        ok: false,
        error: "merge_keys must be a JSON array.",
      };
    }
    airtable.merge_keys = mergeKeys.value;
    metadataWarnings.push(
      "merge_keys is metadata-only in this phase; sync services keep their current merge policy."
    );
  }

  const fieldMap = parseOptionalJson(draft.fieldMapJson, "field_map");
  if (!fieldMap.ok) {
    return fieldMap;
  }

  if (fieldMap.value !== undefined) {
    if (!isRecord(fieldMap.value)) {
      return {
        ok: false,
        error: "field_map must be a JSON object.",
      };
    }
    airtable.field_map = fieldMap.value;
    metadataWarnings.push(
      "field_map is metadata-only in this phase; sync services keep their current payload builders."
    );
  }

  const payload: SetupAiAirtablePatchPayload = {};
  if (draft.syncMode === "enabled") {
    payload.airtable_sync_enabled = true;
  }
  if (draft.syncMode === "disabled") {
    payload.airtable_sync_enabled = false;
  }
  if (Object.keys(airtable).length > 0) {
    payload.airtable = airtable;
  }

  if (!payload.airtable && !("airtable_sync_enabled" in payload)) {
    return {
      ok: false,
      error: "Add at least one patch field before previewing.",
    };
  }

  return {
    ok: true,
    payload,
    metadataWarnings,
  };
}

export function stableJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
