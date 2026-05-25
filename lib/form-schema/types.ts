import type {
  AISignalTone,
  BlockingState,
  IntegrationAuditKey,
  SyncStatus,
  ValidationState,
} from "@/lib/foundation/types";

export type FieldKind =
  | "text"
  | "textarea"
  | "select"
  | "date"
  | "boolean"
  | "repeater"
  | "upload"
  | "review";

export type SchemaRendererMode = "preview" | "readonly" | "runtime_candidate";

export type WorkflowType = "release_intake" | (string & {});

export type ValidationRuleType =
  | "required"
  | "min_length"
  | "max_length"
  | "pattern"
  | "file_spec"
  | "unique"
  | "custom";

export type ValidationRule = {
  id: string;
  type: ValidationRuleType;
  message: string;
  blocking?: BlockingState;
  params?: Record<string, string | number | boolean>;
};

export type FieldOption = {
  label: string;
  value: string;
};

export type AISignalAction = {
  label: string;
  kind?: "primary" | "secondary" | "jump" | "disabled_preview";
  targetStepId?: string;
};

export type AISignalSpec = {
  id: string;
  tone: AISignalTone;
  title: string;
  summary: string;
  recommendation?: string;
  fieldKey?: string;
  blocking?: BlockingState;
  validationState?: ValidationState;
  confidence?: number;
  scopeLabel?: string;
  allowedActions?: Array<"suggest" | "validate" | "explain" | "draft_diff">;
  requiresHumanApproval?: boolean;
  actions?: AISignalAction[];
  match?: {
    title: string;
    subtitle?: string;
    initials?: string;
  };
};

export type IntegrationAuditHint = {
  id: string;
  key: IntegrationAuditKey;
  label: string;
  status: SyncStatus;
  blocking: BlockingState;
  summary: string;
  evidence?: string;
};

export type UploadSpec = {
  acceptLabel: string;
  maxSizeLabel?: string;
  requiredSpecs?: Array<{
    key: string;
    label: string;
    value: string;
    required: string;
    tone: AISignalTone;
    blocking?: BlockingState;
  }>;
};

export type FormField = {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  description?: string;
  options?: FieldOption[];
  validation?: ValidationRule[];
  validationState?: ValidationState;
  blocking?: BlockingState;
  statusLabel?: string;
  aiSignals?: AISignalSpec[];
  auditHints?: IntegrationAuditHint[];
  fields?: FormField[];
  uploadSpec?: UploadSpec;
  reviewTargetStepId?: string;
};

export type FormStep = {
  id: string;
  label: string;
  title: string;
  description: string;
  fields: FormField[];
  aiSignals?: AISignalSpec[];
  alerts?: AISignalSpec[];
};

export type FormSchema = {
  id: string;
  version: string;
  workflowType: WorkflowType;
  title: string;
  description: string;
  modeLabel: string;
  steps: FormStep[];
  auditHints?: IntegrationAuditHint[];
};

export type SchemaReviewSummaryRow = {
  targetStepId: string;
  text: string;
  tone: AISignalTone;
};

export type SchemaReviewNextStep = {
  description: string;
  key: IntegrationAuditKey;
  title: string;
};

export type SchemaReviewSummary = {
  counts: {
    blockers: number;
    ok: number;
    warnings: number;
  };
  headline: string;
  nextSteps: SchemaReviewNextStep[];
  rows: SchemaReviewSummaryRow[];
};

export type SchemaScalar = string | number | boolean | null;

export type SchemaValue =
  | SchemaScalar
  | SchemaValueMap
  | SchemaValueMap[]
  | SchemaScalar[];

export type SchemaValueMap = {
  [key: string]: SchemaValue;
};
