import type { WorkflowType } from "@/lib/form-engine/types";

export type OperationalRowSource =
  | "submissions"
  | "people_registry_records";

export type OperationalRowStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "blocked"
  | "synced"
  | "failed";

export type OperationalSyncStatus =
  | "pending"
  | "synced"
  | "failed"
  | "skipped"
  | "unknown";

export type OperationalRiskLevel = "low" | "medium" | "high";

export type OperationalTableRow = {
  id: string;
  sourceTable: OperationalRowSource;
  workspaceSlug: string;
  workflowType: WorkflowType;
  workflowLabel: string;
  formVersion: string | null;
  title: string;
  subtitle: string;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  status: OperationalRowStatus;
  statusLabel: string;
  riskLevel: OperationalRiskLevel;
  riskReasons: string[];
  nextAction: string;
  publicUrl: string | null;
  editUrl: string | null;
  submittedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  airtableRecordId: string | null;
  sync: {
    supabase: OperationalSyncStatus;
    airtable: OperationalSyncStatus;
    drive: OperationalSyncStatus;
    email: OperationalSyncStatus;
  };
  metadata: {
    releaseType?: string | null;
    genre?: string | null;
    releaseDate?: string | null;
    documentId?: string | null;
    location?: string | null;
    roleSummary?: string | null;
  };
};

export type OperationalTablesSummary = {
  total: number;
  needsReview: number;
  syncFailed: number;
  drafts: number;
  highRisk: number;
  synced: number;
  peopleDuplicates: number;
  byWorkflow: Record<string, number>;
  updatedAt: string | null;
};

export type OperationalTablesReadModel = {
  workspaceSlug: string;
  rows: OperationalTableRow[];
  summary: OperationalTablesSummary;
  generatedAt: string;
  filters: {
    workflowType: string | null;
    query: string | null;
    limit: number;
  };
  warnings: string[];
};
