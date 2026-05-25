export type AISignalTone = "ai" | "warn" | "danger" | "success";

export type BlockingState =
  | "none"
  | "soft_block"
  | "hard_block"
  | "human_required";

export type ValidationState =
  | "idle"
  | "pending"
  | "valid"
  | "warning"
  | "invalid";

export type SubmissionStatus =
  | "not_started"
  | "draft"
  | "ready_for_review"
  | "submitted"
  | "blocked"
  | "failed";

export type SyncStatus =
  | "not_configured"
  | "not_synced"
  | "queued"
  | "syncing"
  | "synced"
  | "blocked"
  | "failed";

export type IntegrationAuditKey =
  | "airtable"
  | "google_drive"
  | "email"
  | "supabase_storage"
  | "ai_validation"
  | "human_review";

export type IntegrationAuditItem = {
  key: IntegrationAuditKey;
  label: string;
  status: SyncStatus;
  blocking: BlockingState;
  lastCheckedAt?: string | null;
  lastSyncedAt?: string | null;
  evidence?: string;
  owner?: "system" | "human" | "ai";
  notes?: string[];
};

export type IntegrationAuditMap = Partial<
  Record<IntegrationAuditKey, IntegrationAuditItem>
>;

export type AISuggestionActionScope =
  | "suggest"
  | "validate"
  | "explain"
  | "draft_diff";

export type AISuggestionSignal = {
  tone: AISignalTone;
  title: string;
  summary: string;
  confidence?: number;
  blocking?: BlockingState;
  validationState?: ValidationState;
  allowedActions: AISuggestionActionScope[];
  requiresHumanApproval?: boolean;
};
