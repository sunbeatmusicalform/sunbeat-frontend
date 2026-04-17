import type {
  FormVersion,
  WorkflowRegistryEntry,
  WorkflowRenderer,
  WorkflowStatus,
  WorkflowType,
} from "@/lib/form-engine/types";

export type WorkspaceConfigSourceTable =
  | "workspace_branding"
  | "workspace_field_overrides"
  | "workspace_airtable_mapping";

export type WorkspaceConfigFieldOverride = {
  stepKey: string;
  fieldKey: string;
  workflowType: WorkflowType | null;
  formVersion: FormVersion | null;
  labelOverride: string | null;
  helperTextOverride: string | null;
  placeholderOverride: string | null;
  isRequired: boolean | null;
  isVisible: boolean | null;
  sortOrder: number | null;
};

export type WorkspaceConfigScope = {
  workspaceSlug: string;
  workflowType: WorkflowType;
  formVersion: FormVersion;
  workflowStatus: WorkflowStatus;
  workflowRenderer: WorkflowRenderer;
  workflowLabel: string;
  workflowDescription: string;
  availableWorkflows: WorkflowRegistryEntry[];
};

export type WorkspaceSettingsReadModel = {
  workspaceSlug: string;
  workspaceName: string;
  sourceTables: WorkspaceConfigSourceTable[];
  supportsWorkflowScoping: boolean;
};

export type PublicExperienceReadModel = {
  intakePath: string;
  workspaceName: string;
  slogan: string | null;
  formTitle: string | null;
  introText: string | null;
  successMessage: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  /** URL da imagem usada no preview social (WhatsApp/OG). Distinta do logoUrl exibido na UI. */
  socialImageUrl: string | null;
  /** Título customizado para o preview social. Se nulo, usa workspaceName. */
  socialTitle: string | null;
  /** Descrição customizada para o preview social. Se nulo, usa slogan ou fallback. */
  socialDescription: string | null;
};

export type WorkflowSettingsReadModel = {
  workflowType: WorkflowType;
  formVersion: FormVersion;
  status: WorkflowStatus;
  renderer: WorkflowRenderer;
  label: string;
  description: string;
  overrideCount: number;
  fieldOverrides: WorkspaceConfigFieldOverride[];
};

export type AirtableIntegrationReadModel = {
  provider: "airtable";
  enabled: boolean;
  mappingCount: number;
  scopedMappings: Record<string, unknown>[];
  source: "workspace_airtable_mapping";
  serviceMode: "global_env_backed";
};

export type EmailIntegrationReadModel = {
  provider: "resend";
  submissionEmailEnabled: boolean;
  notificationRecipients: string[];
  notificationRecipientCount: number;
  source: "workspace_branding + workspace_field_overrides";
};

export type StorageIntegrationReadModel = {
  provider: "supabase_storage";
  uploadPathStrategy: "workspace_slug/drafts/draft_token";
  source: "upload_route_runtime";
};

export type DeferredIntegrationReadModel = {
  state: "deferred";
  note: string;
};

export type IntegrationSettingsReadModel = {
  airtable: AirtableIntegrationReadModel;
  email: EmailIntegrationReadModel;
  storage: StorageIntegrationReadModel;
  googleDrive: DeferredIntegrationReadModel;
  automations: DeferredIntegrationReadModel;
};

export type AccessAndGovernanceReadModel = {
  publicEditWorkspaceAllowed: boolean;
  editPasswordProtected: boolean;
  settingsStorageMode: "workspace_field_overrides_legacy";
  reservedStepKeys: string[];
  membershipsState: "not_connected";
};

export type BillingAndEntitlementsReadModel = {
  state: "deferred";
  source: "not_loaded";
  note: string;
};

export type WorkspaceConfigDiagnostics = {
  brandingConfigured: boolean;
  scopedFieldOverrideCount: number;
  reservedFieldOverrideCount: number;
  scopedAirtableMappingCount: number;
};

export type WorkspaceConfigReadModel = {
  generatedAt: string;
  scope: WorkspaceConfigScope;
  workspaceSettings: WorkspaceSettingsReadModel;
  publicExperience: PublicExperienceReadModel;
  workflowSettings: WorkflowSettingsReadModel;
  integrationSettings: IntegrationSettingsReadModel;
  accessAndGovernance: AccessAndGovernanceReadModel;
  billingAndEntitlements: BillingAndEntitlementsReadModel;
  diagnostics: WorkspaceConfigDiagnostics;
};
