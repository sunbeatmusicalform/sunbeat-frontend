import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  buildWorkflowPublicPath,
  getWorkflowOperationalDefaults,
  getWorkflowRegistryEntry,
} from "@/lib/form-engine/workflow-registry";
import {
  COMPANY_REGISTRY_WORKFLOW_TYPE,
  DEFAULT_RELEASE_INTAKE_WORKFLOW_TYPE,
  PEOPLE_REGISTRY_WORKFLOW_TYPE,
  RIGHTS_CLEARANCE_WORKFLOW_TYPE,
  type WorkflowType,
} from "@/lib/form-engine/types";
import { sanitizeWorkspaceSlug } from "@/lib/tenant";
import type {
  OperationalRiskLevel,
  OperationalRowStatus,
  OperationalSyncStatus,
  OperationalTableRow,
  OperationalTablesReadModel,
  OperationalTablesSummary,
} from "@/lib/tables/types";

const SUBMISSION_SELECT_WITH_DRIVE =
  "id, client_slug, status, created_at, updated_at, submitted_at, edit_token, email, artist_name, release_type, release_title, main_title, track_title, genre, release_date, airtable_sync_status, email_status, google_drive_folder_id, payload";

const SUBMISSION_SELECT_BASE =
  "id, client_slug, status, created_at, updated_at, submitted_at, edit_token, email, artist_name, release_type, release_title, main_title, track_title, genre, release_date, airtable_sync_status, email_status, payload";

const PEOPLE_REGISTRY_SELECT =
  "id, workspace_slug, workflow_type, form_version, profile, source, party_kind, display_name, legal_name, stage_name, trade_name, document_id, email_primary, phone_primary, country, state_region, city, roles_json, payload, airtable_sync_status, airtable_sync_error, airtable_base_id, airtable_table_name, airtable_record_id, created_at, updated_at";

type JsonRecord = Record<string, unknown>;

type SubmissionRow = {
  id: string;
  client_slug?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  submitted_at?: string | null;
  edit_token?: string | null;
  email?: string | null;
  artist_name?: string | null;
  release_type?: string | null;
  release_title?: string | null;
  main_title?: string | null;
  track_title?: string | null;
  genre?: string | null;
  release_date?: string | null;
  airtable_sync_status?: string | null;
  email_status?: string | null;
  google_drive_folder_id?: string | null;
  payload?: JsonRecord | null;
};

type PeopleRegistryRow = {
  id: string;
  workspace_slug?: string | null;
  workflow_type?: string | null;
  form_version?: string | null;
  profile?: string | null;
  source?: string | null;
  party_kind?: string | null;
  display_name?: string | null;
  legal_name?: string | null;
  stage_name?: string | null;
  trade_name?: string | null;
  document_id?: string | null;
  email_primary?: string | null;
  phone_primary?: string | null;
  country?: string | null;
  state_region?: string | null;
  city?: string | null;
  roles_json?: unknown;
  payload?: JsonRecord | null;
  airtable_sync_status?: string | null;
  airtable_sync_error?: string | null;
  airtable_base_id?: string | null;
  airtable_table_name?: string | null;
  airtable_record_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SupabaseAdmin = ReturnType<typeof createSupabaseAdmin>;

type LoadOperationalTablesReadModelArgs = {
  workspaceSlug: string;
  workflowType?: string | null;
  query?: string | null;
  limit?: number | null;
};

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function toRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function getNestedText(
  source: JsonRecord | null | undefined,
  path: string[]
): string | null {
  let current: unknown = source;

  for (const key of path) {
    const record = toRecord(current);
    if (!record) {
      return null;
    }
    current = record[key];
  }

  return cleanText(current);
}

function getErrorMessage(error: unknown) {
  return error && typeof error === "object" && "message" in error
    ? String((error as { message?: unknown }).message ?? "")
    : String(error || "");
}

function isMissingColumnError(error: unknown, columnName: string) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes(columnName.toLowerCase()) &&
    (message.includes("does not exist") || message.includes("not found"))
  );
}

function isMissingRelationError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("schema cache")
  );
}

function clampLimit(limit: number | null | undefined) {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed)) {
    return 150;
  }
  return Math.min(Math.max(Math.trunc(parsed), 10), 500);
}

function normalizeWorkflowType(value: unknown): WorkflowType | null {
  const normalized = cleanText(value);
  if (!normalized) {
    return null;
  }

  return normalized as WorkflowType;
}

function getSubmissionWorkflowType(row: SubmissionRow): WorkflowType {
  const payload = toRecord(row.payload);
  const explicitWorkflow =
    normalizeWorkflowType(payload?.workflow_type) ??
    normalizeWorkflowType(getNestedText(payload, ["meta", "workflow_type"]));

  if (explicitWorkflow) {
    return explicitWorkflow;
  }

  const releaseType = cleanText(row.release_type);
  if (
    releaseType === RIGHTS_CLEARANCE_WORKFLOW_TYPE ||
    releaseType === COMPANY_REGISTRY_WORKFLOW_TYPE
  ) {
    return releaseType;
  }

  return DEFAULT_RELEASE_INTAKE_WORKFLOW_TYPE;
}

function getSubmissionFormVersion(
  row: SubmissionRow,
  workflowType: WorkflowType
) {
  const payload = toRecord(row.payload);
  return (
    cleanText(payload?.form_version) ??
    getNestedText(payload, ["meta", "form_version"]) ??
    getWorkflowRegistryEntry(workflowType).defaultFormVersion
  );
}

function normalizeSyncStatus(
  value: unknown,
  fallback: OperationalSyncStatus = "unknown"
): OperationalSyncStatus {
  const normalized = cleanText(value)?.toLowerCase();
  if (!normalized) {
    return fallback;
  }

  if (["ok", "success", "sent", "synced", "completed"].includes(normalized)) {
    return "synced";
  }

  if (["failed", "error", "errored"].includes(normalized)) {
    return "failed";
  }

  if (["pending", "queued", "processing", "retrying"].includes(normalized)) {
    return "pending";
  }

  if (["skipped", "disabled", "not_applicable"].includes(normalized)) {
    return "skipped";
  }

  return fallback;
}

const STATUS_LABELS: Record<OperationalRowStatus, string> = {
  draft: "Rascunho",
  submitted: "Enviado",
  in_review: "Em revisao",
  blocked: "Bloqueado",
  synced: "Sincronizado",
  failed: "Falhou",
};

function normalizeRowStatus(args: {
  rawStatus?: string | null;
  airtableSync: OperationalSyncStatus;
  emailSync: OperationalSyncStatus;
}): OperationalRowStatus {
  const rawStatus = cleanText(args.rawStatus)?.toLowerCase();

  if (args.airtableSync === "failed" || args.emailSync === "failed") {
    return "failed";
  }

  if (rawStatus === "draft") {
    return "draft";
  }

  if (rawStatus === "blocked" || rawStatus === "rejected") {
    return "blocked";
  }

  if (rawStatus === "in_review" || rawStatus === "processing") {
    return "in_review";
  }

  if (
    rawStatus === "approved" ||
    rawStatus === "synced" ||
    (rawStatus === "submitted" && args.airtableSync === "synced")
  ) {
    return "synced";
  }

  return "submitted";
}

function buildPublicUrls(args: {
  workspaceSlug: string;
  workflowType: WorkflowType;
  editToken?: string | null;
}) {
  const publicPath = buildWorkflowPublicPath({
    workspaceSlug: args.workspaceSlug,
    workflowType: args.workflowType,
  });

  if (!publicPath) {
    return { publicUrl: null, editUrl: null };
  }

  const editToken = cleanText(args.editToken);
  return {
    publicUrl: publicPath,
    editUrl: editToken
      ? `${publicPath}?edit_token=${encodeURIComponent(editToken)}`
      : null,
  };
}

function joinDefined(parts: Array<string | null | undefined>, separator = " - ") {
  return parts.filter(Boolean).join(separator) || null;
}

function roleSummary(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return cleanText(value);
  }

  const roles = value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }
      const record = toRecord(item);
      return cleanText(record?.label) ?? cleanText(record?.role);
    })
    .filter((item): item is string => Boolean(item));

  return roles.slice(0, 3).join(", ") || null;
}

function computeRisk(args: {
  status: OperationalRowStatus;
  sync: OperationalTableRow["sync"];
  title: string;
  primaryContactEmail: string | null;
  workflowType: WorkflowType;
  documentId?: string | null;
}) {
  const reasons: string[] = [];

  if (args.status === "failed") {
    reasons.push("Falha em integracao");
  }

  if (!cleanText(args.title)) {
    reasons.push("Registro sem titulo operacional");
  }

  if (!args.primaryContactEmail) {
    reasons.push("Contato principal sem email");
  }

  if (
    args.workflowType === PEOPLE_REGISTRY_WORKFLOW_TYPE &&
    !cleanText(args.documentId)
  ) {
    reasons.push("Pessoa sem documento");
  }

  if (args.sync.airtable === "pending" && args.status !== "draft") {
    reasons.push("Airtable pendente");
  }

  if (args.sync.drive === "pending" && args.status !== "draft") {
    reasons.push("Drive pendente");
  }

  const level: OperationalRiskLevel =
    args.status === "failed" || reasons.length >= 3
      ? "high"
      : reasons.length > 0 || args.status === "draft"
      ? "medium"
      : "low";

  return { level, reasons };
}

function getNextAction(args: {
  status: OperationalRowStatus;
  sync: OperationalTableRow["sync"];
  riskReasons: string[];
}) {
  if (args.status === "failed") {
    return "Revisar erro de integracao";
  }

  if (args.status === "draft") {
    return "Acompanhar rascunho";
  }

  if (args.sync.airtable === "pending") {
    return "Aguardar ou reenfileirar Airtable";
  }

  if (args.sync.drive === "pending") {
    return "Conferir pasta no Drive";
  }

  if (args.riskReasons.length > 0) {
    return "Completar dados pendentes";
  }

  if (args.status === "synced") {
    return "Monitorar pos-sync";
  }

  return "Revisar registro";
}

function normalizeSubmissionRow(
  row: SubmissionRow,
  workspaceSlug: string
): OperationalTableRow {
  const workflowType = getSubmissionWorkflowType(row);
  const workflow = getWorkflowRegistryEntry(workflowType);
  const defaults = getWorkflowOperationalDefaults(workflowType);
  const airtableSync = normalizeSyncStatus(row.airtable_sync_status, "pending");
  const emailSync = normalizeSyncStatus(
    row.email_status,
    defaults.postSubmitEmailEnabled ? "pending" : "skipped"
  );
  const driveSync: OperationalSyncStatus = row.google_drive_folder_id
    ? "synced"
    : defaults.driveSyncEnabled
    ? "pending"
    : "skipped";
  const status = normalizeRowStatus({
    rawStatus: row.status,
    airtableSync,
    emailSync,
  });
  const title =
    cleanText(row.release_title) ??
    cleanText(row.main_title) ??
    cleanText(row.track_title) ??
    cleanText(row.artist_name) ??
    "Registro sem titulo";
  const subtitle =
    joinDefined([cleanText(row.artist_name), cleanText(row.genre)]) ??
    workflow.label;
  const urls = buildPublicUrls({
    workspaceSlug,
    workflowType,
    editToken: row.edit_token,
  });
  const sync = {
    supabase: "synced" as OperationalSyncStatus,
    airtable: airtableSync,
    drive: driveSync,
    email: emailSync,
  };
  const risk = computeRisk({
    status,
    sync,
    title,
    primaryContactEmail: cleanText(row.email),
    workflowType,
  });

  return {
    id: row.id,
    sourceTable: "submissions",
    workspaceSlug,
    workflowType,
    workflowLabel: workflow.label,
    formVersion: getSubmissionFormVersion(row, workflowType),
    title,
    subtitle,
    primaryContactName: cleanText(row.artist_name),
    primaryContactEmail: cleanText(row.email),
    status,
    statusLabel: STATUS_LABELS[status],
    riskLevel: risk.level,
    riskReasons: risk.reasons,
    nextAction: getNextAction({ status, sync, riskReasons: risk.reasons }),
    publicUrl: urls.publicUrl,
    editUrl: urls.editUrl,
    submittedAt: cleanText(row.submitted_at),
    createdAt: cleanText(row.created_at),
    updatedAt: cleanText(row.updated_at) ?? cleanText(row.created_at),
    airtableRecordId: null,
    sync,
    metadata: {
      releaseType: cleanText(row.release_type),
      genre: cleanText(row.genre),
      releaseDate: cleanText(row.release_date),
    },
  };
}

function normalizePeopleRow(
  row: PeopleRegistryRow,
  workspaceSlug: string
): OperationalTableRow {
  const workflowType =
    normalizeWorkflowType(row.workflow_type) ?? PEOPLE_REGISTRY_WORKFLOW_TYPE;
  const workflow = getWorkflowRegistryEntry(workflowType);
  const defaults = getWorkflowOperationalDefaults(workflowType);
  const airtableSync = normalizeSyncStatus(row.airtable_sync_status, "pending");
  const status = normalizeRowStatus({
    rawStatus: airtableSync === "synced" ? "synced" : "submitted",
    airtableSync,
    emailSync: "skipped",
  });
  const title =
    cleanText(row.display_name) ??
    cleanText(row.stage_name) ??
    cleanText(row.trade_name) ??
    cleanText(row.legal_name) ??
    "Pessoa sem nome";
  const location = joinDefined(
    [cleanText(row.city), cleanText(row.state_region), cleanText(row.country)],
    ", "
  );
  const subtitle =
    joinDefined([cleanText(row.party_kind), roleSummary(row.roles_json)]) ??
    workflow.label;
  const urls = buildPublicUrls({
    workspaceSlug,
    workflowType,
  });
  const sync = {
    supabase: "synced" as OperationalSyncStatus,
    airtable: airtableSync,
    drive: defaults.driveSyncEnabled ? "pending" : ("skipped" as OperationalSyncStatus),
    email: defaults.postSubmitEmailEnabled
      ? ("pending" as OperationalSyncStatus)
      : ("skipped" as OperationalSyncStatus),
  };
  const risk = computeRisk({
    status,
    sync,
    title,
    primaryContactEmail: cleanText(row.email_primary),
    workflowType,
    documentId: row.document_id,
  });

  return {
    id: row.id,
    sourceTable: "people_registry_records",
    workspaceSlug,
    workflowType,
    workflowLabel: workflow.label,
    formVersion:
      cleanText(row.form_version) ?? getWorkflowRegistryEntry(workflowType).defaultFormVersion,
    title,
    subtitle,
    primaryContactName: title,
    primaryContactEmail: cleanText(row.email_primary),
    status,
    statusLabel: STATUS_LABELS[status],
    riskLevel: risk.level,
    riskReasons: risk.reasons,
    nextAction: getNextAction({ status, sync, riskReasons: risk.reasons }),
    publicUrl: urls.publicUrl,
    editUrl: urls.editUrl,
    submittedAt: null,
    createdAt: cleanText(row.created_at),
    updatedAt: cleanText(row.updated_at) ?? cleanText(row.created_at),
    airtableRecordId: cleanText(row.airtable_record_id),
    sync,
    metadata: {
      documentId: cleanText(row.document_id),
      location,
      roleSummary: roleSummary(row.roles_json),
    },
  };
}

async function loadSubmissionRows(
  supabase: SupabaseAdmin,
  workspaceSlug: string,
  limit: number,
  warnings: string[]
) {
  const result = await supabase
    .from("submissions")
    .select(SUBMISSION_SELECT_WITH_DRIVE)
    .eq("client_slug", workspaceSlug)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!result.error) {
    return (result.data ?? []) as SubmissionRow[];
  }

  if (!isMissingColumnError(result.error, "google_drive_folder_id")) {
    throw result.error;
  }

  warnings.push("submissions.google_drive_folder_id nao encontrado; status de Drive estimado.");
  const fallbackResult = await supabase
    .from("submissions")
    .select(SUBMISSION_SELECT_BASE)
    .eq("client_slug", workspaceSlug)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (fallbackResult.error) {
    throw fallbackResult.error;
  }

  return (fallbackResult.data ?? []) as SubmissionRow[];
}

async function loadPeopleRegistryRows(
  supabase: SupabaseAdmin,
  workspaceSlug: string,
  limit: number,
  warnings: string[]
) {
  const result = await supabase
    .from("people_registry_records")
    .select(PEOPLE_REGISTRY_SELECT)
    .eq("workspace_slug", workspaceSlug)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!result.error) {
    return (result.data ?? []) as PeopleRegistryRow[];
  }

  if (isMissingRelationError(result.error)) {
    warnings.push("people_registry_records indisponivel neste ambiente.");
    return [];
  }

  throw result.error;
}

function matchesSearch(row: OperationalTableRow, query: string | null) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();
  const haystack = [
    row.title,
    row.subtitle,
    row.primaryContactName,
    row.primaryContactEmail,
    row.workflowLabel,
    row.statusLabel,
    row.metadata.documentId,
    row.metadata.roleSummary,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function getRowSortDate(row: OperationalTableRow) {
  return (
    Date.parse(row.updatedAt ?? "") ||
    Date.parse(row.submittedAt ?? "") ||
    Date.parse(row.createdAt ?? "") ||
    0
  );
}

function countPeopleDuplicates(rows: OperationalTableRow[]) {
  const keys = new Map<string, number>();

  rows
    .filter((row) => row.workflowType === PEOPLE_REGISTRY_WORKFLOW_TYPE)
    .forEach((row) => {
      [row.primaryContactEmail, row.metadata.documentId]
        .map((value) => cleanText(value)?.toLowerCase())
        .filter((value): value is string => Boolean(value))
        .forEach((key) => keys.set(key, (keys.get(key) ?? 0) + 1));
    });

  return Array.from(keys.values()).filter((count) => count > 1).length;
}

function summarizeRows(rows: OperationalTableRow[]): OperationalTablesSummary {
  const byWorkflow: Record<string, number> = {};

  for (const row of rows) {
    byWorkflow[row.workflowType] = (byWorkflow[row.workflowType] ?? 0) + 1;
  }

  const updatedAt = rows
    .map((row) => row.updatedAt ?? row.submittedAt ?? row.createdAt)
    .filter((date): date is string => Boolean(date))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;

  return {
    total: rows.length,
    needsReview: rows.filter((row) =>
      ["submitted", "in_review", "blocked"].includes(row.status)
    ).length,
    syncFailed: rows.filter((row) =>
      Object.values(row.sync).some((status) => status === "failed")
    ).length,
    drafts: rows.filter((row) => row.status === "draft").length,
    highRisk: rows.filter((row) => row.riskLevel === "high").length,
    synced: rows.filter((row) => row.status === "synced").length,
    peopleDuplicates: countPeopleDuplicates(rows),
    byWorkflow,
    updatedAt,
  };
}

export async function loadOperationalTablesReadModel(
  args: LoadOperationalTablesReadModelArgs
): Promise<OperationalTablesReadModel> {
  const workspaceSlug =
    sanitizeWorkspaceSlug(args.workspaceSlug) ?? args.workspaceSlug.trim();
  const limit = clampLimit(args.limit);
  const workflowType = cleanText(args.workflowType);
  const query = cleanText(args.query);
  const warnings: string[] = [];
  const supabase = createSupabaseAdmin();

  const [submissionRows, peopleRows] = await Promise.all([
    loadSubmissionRows(supabase, workspaceSlug, limit, warnings),
    loadPeopleRegistryRows(supabase, workspaceSlug, limit, warnings),
  ]);

  const rows = [
    ...submissionRows.map((row) => normalizeSubmissionRow(row, workspaceSlug)),
    ...peopleRows.map((row) => normalizePeopleRow(row, workspaceSlug)),
  ]
    .filter((row) => !workflowType || row.workflowType === workflowType)
    .filter((row) => matchesSearch(row, query))
    .sort((a, b) => getRowSortDate(b) - getRowSortDate(a))
    .slice(0, limit);

  return {
    workspaceSlug,
    rows,
    summary: summarizeRows(rows),
    generatedAt: new Date().toISOString(),
    filters: {
      workflowType,
      query,
      limit,
    },
    warnings,
  };
}
