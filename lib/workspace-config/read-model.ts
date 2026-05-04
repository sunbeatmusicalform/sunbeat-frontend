import {
  listRegisteredWorkflows,
  resolveWorkflowIdentity,
} from "@/lib/form-engine/workflow-registry";
import type { FormVersion, WorkflowType } from "@/lib/form-engine/types";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  AccessAndGovernanceReadModel,
  BillingAndEntitlementsReadModel,
  IntegrationSettingsReadModel,
  PublicExperienceReadModel,
  WorkspaceConfigFieldOverride,
  WorkspaceConfigReadModel,
  WorkspaceSettingsReadModel,
  WorkflowSettingsReadModel,
} from "./types";

export const WORKSPACE_EMAIL_SETTINGS_STEP_KEY = "__workspace_settings__";
export const WORKSPACE_EMAIL_SETTINGS_FIELD_KEY =
  "submission_notification_emails";
export const WORKSPACE_SECURITY_STEP_KEY = "__workspace_security__";
export const WORKSPACE_EDIT_PASSWORD_FIELD_KEY = "edit_mode_password_hash";
export const WORKSPACE_RESERVED_STEP_KEYS = [
  WORKSPACE_EMAIL_SETTINGS_STEP_KEY,
  WORKSPACE_SECURITY_STEP_KEY,
] as const;

type WorkspaceBrandingRow = {
  workspace_slug: string;
  workspace_name?: string | null;
  slogan?: string | null;
  form_title?: string | null;
  intro_text?: string | null;
  success_message?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  submission_email_enabled?: boolean | null;
  /** Permite edição pública do formulário (substitui hardcode "atabaque"). */
  public_edit_allowed?: boolean | null;
  /** URL da imagem usada no preview social (OG/WhatsApp). Distinta do logo da UI. */
  social_image_url?: string | null;
  /** Título customizado para o card de preview social. */
  social_title?: string | null;
  /** Descrição customizada para o card de preview social. */
  social_description?: string | null;
  /** CSS color for form page background. */
  form_bg_color?: string | null;
  /** CSS color for primary action elements. */
  primary_color?: string | null;
  /** URL for small badge/icon shown in form chips. */
  badge_url?: string | null;
  /** NULL = all workflows enabled; explicit string[] = only those workflows active for this tenant. */
  enabled_workflows?: string[] | null;
};

type WorkspaceFieldOverrideRow = {
  workspace_slug: string;
  step_key: string;
  field_key: string;
  workflow_type?: string | null;
  form_version?: string | null;
  label_override?: string | null;
  helper_text_override?: string | null;
  placeholder_override?: string | null;
  is_required?: boolean | null;
  is_visible?: boolean | null;
  sort_order?: number | null;
};

type WorkspaceAirtableMappingRow = Record<string, unknown> & {
  workspace_slug?: string;
  workflow_type?: string | null;
  form_version?: string | null;
  is_enabled?: boolean | null;
};

type WorkspacePlanRow = {
  plan_id: string;
  plan_name: string;
  plan_is_public: boolean;
  plan_ai_enabled: boolean;
  plan_audio_upload_mb: number | null;
  plan_cover_upload_mb: number | null;
  plan_submissions_month: number | null;
  plan_airtable_enabled: boolean;
  plan_gdrive_enabled: boolean;
  plan_support_level: string;
};

type WorkspacePlanOverrideRow = {
  ai_enabled: boolean | null;
  ai_monthly_budget_brl: number | null;
  ai_overage_policy: string | null;
  ai_gemini_reserve_brl: number | null;
  audio_upload_mb: number | null;
  cover_upload_mb: number | null;
  max_submissions_month: number | null;
  airtable_enabled: boolean | null;
  gdrive_enabled: boolean | null;
  support_tier: string | null;
  sla_response_hours: number | null;
  enabled_workflow_types: string[] | null;
  monthly_value_brl: number | null;
  setup_fee_paid_brl: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  billing_cycle: string | null;
  configured_by: string | null;
};

/** Orçamento de IA por plan_id (fallback quando não há override). Espelho do backend. */
const AI_BUDGET_BY_PLAN: Record<string, number> = {
  free: 2.0,
  starter: 10.0,
  pro: 30.0,
  enterprise: 120.0,
  consulting: 30.0, // base do plano consulting; override tem prioridade
};

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeWorkflowScopedValue(value: unknown) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function parseStoredEmailList(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const unique = new Set<string>();

    parsed.forEach((item) => {
      if (typeof item !== "string") {
        return;
      }

      const normalized = item.trim().toLowerCase();
      if (!normalized) {
        return;
      }

      unique.add(normalized);
    });

    return Array.from(unique).slice(0, 5);
  } catch {
    return [];
  }
}

function getDefaultNotificationEmails(_workspaceSlug: string) {
  return [];
}

function isReservedFieldOverride(row: WorkspaceFieldOverrideRow) {
  return WORKSPACE_RESERVED_STEP_KEYS.includes(
    row.step_key as (typeof WORKSPACE_RESERVED_STEP_KEYS)[number]
  );
}

function matchesWorkflowScope(
  row: {
    workflow_type?: string | null;
    form_version?: string | null;
  },
  workflowIdentity: ReturnType<typeof resolveWorkflowIdentity>
) {
  const workflowType = normalizeWorkflowScopedValue(row.workflow_type);
  if (workflowType && workflowType !== workflowIdentity.workflowType) {
    return false;
  }

  const formVersion = normalizeWorkflowScopedValue(row.form_version);
  if (formVersion && formVersion !== workflowIdentity.formVersion) {
    return false;
  }

  return true;
}

function toFieldOverrideReadModel(
  row: WorkspaceFieldOverrideRow
): WorkspaceConfigFieldOverride {
  return {
    stepKey: row.step_key,
    fieldKey: row.field_key,
    workflowType: normalizeWorkflowScopedValue(row.workflow_type),
    formVersion: normalizeWorkflowScopedValue(row.form_version),
    labelOverride: normalizeOptionalText(row.label_override),
    helperTextOverride: normalizeOptionalText(row.helper_text_override),
    placeholderOverride: normalizeOptionalText(row.placeholder_override),
    isRequired:
      typeof row.is_required === "boolean" ? row.is_required : null,
    isVisible: typeof row.is_visible === "boolean" ? row.is_visible : null,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : null,
  };
}

function buildWorkspaceSettings(args: {
  workspaceSlug: string;
  workspaceName: string;
}): WorkspaceSettingsReadModel {
  return {
    workspaceSlug: args.workspaceSlug,
    workspaceName: args.workspaceName,
    sourceTables: [
      "workspace_branding",
      "workspace_field_overrides",
      "workspace_airtable_mapping",
    ],
    supportsWorkflowScoping: true,
  };
}

function buildPublicExperience(args: {
  workspaceSlug: string;
  workspaceName: string;
  branding: WorkspaceBrandingRow | null;
}): PublicExperienceReadModel {
  return {
    intakePath: `/intake/${args.workspaceSlug}`,
    workspaceName: args.workspaceName,
    slogan: normalizeOptionalText(args.branding?.slogan),
    formTitle: normalizeOptionalText(args.branding?.form_title),
    introText: normalizeOptionalText(args.branding?.intro_text),
    successMessage: normalizeOptionalText(args.branding?.success_message),
    logoUrl: normalizeOptionalText(args.branding?.logo_url),
    bannerUrl: normalizeOptionalText(args.branding?.banner_url),
    socialImageUrl: normalizeOptionalText(args.branding?.social_image_url),
    socialTitle: normalizeOptionalText(args.branding?.social_title),
    socialDescription: normalizeOptionalText(args.branding?.social_description),
    formBgColor: normalizeOptionalText(args.branding?.form_bg_color),
    primaryColor: normalizeOptionalText(args.branding?.primary_color),
    badgeUrl: normalizeOptionalText(args.branding?.badge_url),
    enabledWorkflows: Array.isArray(args.branding?.enabled_workflows)
      ? (args.branding.enabled_workflows as string[])
      : null,
  };
}

function buildWorkflowSettings(args: {
  workflowIdentity: ReturnType<typeof resolveWorkflowIdentity>;
  fieldOverrides: WorkspaceFieldOverrideRow[];
}): WorkflowSettingsReadModel {
  const scopedOverrides = args.fieldOverrides
    .filter((row) => !isReservedFieldOverride(row))
    .filter((row) => matchesWorkflowScope(row, args.workflowIdentity))
    .map(toFieldOverrideReadModel);

  return {
    workflowType: args.workflowIdentity.workflowType,
    formVersion: args.workflowIdentity.formVersion,
    status: args.workflowIdentity.status,
    renderer: args.workflowIdentity.renderer,
    label: args.workflowIdentity.label,
    description: args.workflowIdentity.description,
    overrideCount: scopedOverrides.length,
    fieldOverrides: scopedOverrides,
  };
}

function buildIntegrationSettings(args: {
  workspaceSlug: string;
  branding: WorkspaceBrandingRow | null;
  fieldOverrides: WorkspaceFieldOverrideRow[];
  airtableMappings: WorkspaceAirtableMappingRow[];
  workflowIdentity: ReturnType<typeof resolveWorkflowIdentity>;
}): IntegrationSettingsReadModel {
  const summaryEmailRow = args.fieldOverrides.find(
    (row) =>
      row.step_key === WORKSPACE_EMAIL_SETTINGS_STEP_KEY &&
      row.field_key === WORKSPACE_EMAIL_SETTINGS_FIELD_KEY
  );

  const notificationRecipients =
    parseStoredEmailList(summaryEmailRow?.helper_text_override) ||
    getDefaultNotificationEmails(args.workspaceSlug);

  const scopedAirtableMappings = args.airtableMappings.filter((row) =>
    matchesWorkflowScope(row, args.workflowIdentity)
  );

  return {
    airtable: {
      provider: "airtable",
      enabled: scopedAirtableMappings.length > 0,
      mappingCount: scopedAirtableMappings.length,
      scopedMappings: scopedAirtableMappings,
      source: "workspace_airtable_mapping",
      serviceMode: "global_env_backed",
    },
    email: {
      provider: "resend",
      submissionEmailEnabled:
        typeof args.branding?.submission_email_enabled === "boolean"
          ? args.branding.submission_email_enabled
          : true,
      notificationRecipients:
        notificationRecipients.length > 0
          ? notificationRecipients
          : getDefaultNotificationEmails(args.workspaceSlug),
      notificationRecipientCount:
        notificationRecipients.length > 0
          ? notificationRecipients.length
          : getDefaultNotificationEmails(args.workspaceSlug).length,
      source: "workspace_branding + workspace_field_overrides",
    },
    storage: {
      provider: "supabase_storage",
      uploadPathStrategy: "workspace_slug/drafts/draft_token",
      source: "upload_route_runtime",
    },
    googleDrive: {
      state: "deferred",
      note: "Read model intentionally avoids touching the live Google Drive integration in this phase.",
    },
    automations: {
      state: "deferred",
      note: "Automation state is intentionally left out of this first multi-tenant foundation.",
    },
  };
}

function buildAccessAndGovernance(args: {
  workspaceSlug: string;
  branding: WorkspaceBrandingRow | null;
  fieldOverrides: WorkspaceFieldOverrideRow[];
}): AccessAndGovernanceReadModel {
  const passwordProtected = args.fieldOverrides.some(
    (row) =>
      row.step_key === WORKSPACE_SECURITY_STEP_KEY &&
      row.field_key === WORKSPACE_EDIT_PASSWORD_FIELD_KEY &&
      typeof row.helper_text_override === "string" &&
      row.helper_text_override.length > 0
  );

  return {
    publicEditWorkspaceAllowed: args.branding?.public_edit_allowed === true,
    editPasswordProtected: passwordProtected,
    settingsStorageMode: "workspace_field_overrides_legacy",
    reservedStepKeys: [...WORKSPACE_RESERVED_STEP_KEYS],
    membershipsState: "not_connected",
  };
}

function buildBillingAndEntitlements(args: {
  plan: WorkspacePlanRow | null;
  override: WorkspacePlanOverrideRow | null;
}): BillingAndEntitlementsReadModel {
  if (!args.plan) {
    return { state: "deferred", source: "not_loaded", note: "Workspace plan not found." };
  }

  const p = args.plan;
  const o = args.override;
  const hasOverride = o !== null;

  // Resolver entitlement: override (quando não-nulo) > plano base > fallback
  const aiEnabled = o?.ai_enabled ?? p.plan_ai_enabled;
  const aiMonthlyBudgetBrl =
    o?.ai_monthly_budget_brl != null
      ? Number(o.ai_monthly_budget_brl)
      : (AI_BUDGET_BY_PLAN[p.plan_id] ?? AI_BUDGET_BY_PLAN["starter"]);
  const aiOveragePolicy = (o?.ai_overage_policy ?? "block") as
    | "block"
    | "notify"
    | "allow";
  const aiGeminiReserveBrl =
    o?.ai_gemini_reserve_brl != null ? Number(o.ai_gemini_reserve_brl) : 0;
  const maxSubmissionsMonth =
    o?.max_submissions_month !== undefined
      ? o.max_submissions_month
      : p.plan_submissions_month;
  const audioUploadMb =
    o?.audio_upload_mb ?? p.plan_audio_upload_mb ?? 10;
  const coverUploadMb =
    o?.cover_upload_mb ?? p.plan_cover_upload_mb ?? 5;
  const airtableEnabled = o?.airtable_enabled ?? p.plan_airtable_enabled;
  const gdriveEnabled = o?.gdrive_enabled ?? p.plan_gdrive_enabled;
  const supportTier = (o?.support_tier ?? p.plan_support_level ?? "community") as
    | "community"
    | "email"
    | "priority"
    | "dedicated";
  const slaResponseHours = o?.sla_response_hours ?? null;
  const enabledWorkflowTypes = o?.enabled_workflow_types ?? null;

  return {
    state: "loaded",
    source: hasOverride ? "plan_with_override" : "plan_only",
    planId: p.plan_id,
    planName: p.plan_name,
    isConsultingPlan: !p.plan_is_public,
    entitlements: {
      aiEnabled,
      aiMonthlyBudgetBrl,
      aiOveragePolicy,
      aiGeminiReserveBrl,
      maxSubmissionsMonth,
      audioUploadMb,
      coverUploadMb,
      airtableEnabled,
      gdriveEnabled,
      supportTier,
      slaResponseHours,
      enabledWorkflowTypes,
    },
    contractInfo: {
      monthlyValueBrl: o?.monthly_value_brl != null ? Number(o.monthly_value_brl) : null,
      setupFeePaidBrl: o?.setup_fee_paid_brl != null ? Number(o.setup_fee_paid_brl) : null,
      contractStartDate: o?.contract_start_date ?? null,
      contractEndDate: o?.contract_end_date ?? null,
      billingCycle: o?.billing_cycle ?? "monthly",
      configuredBy: o?.configured_by ?? null,
    },
  };
}

export function buildWorkspaceConfigReadModel(args: {
  workspaceSlug: string;
  workflowType?: WorkflowType | null;
  formVersion?: FormVersion | null;
  branding: WorkspaceBrandingRow | null;
  fieldOverrides: WorkspaceFieldOverrideRow[];
  airtableMappings: WorkspaceAirtableMappingRow[];
  plan?: WorkspacePlanRow | null;
  planOverride?: WorkspacePlanOverrideRow | null;
}): WorkspaceConfigReadModel {
  const workflowIdentity = resolveWorkflowIdentity({
    workspaceSlug: args.workspaceSlug,
    workflowType: args.workflowType,
    formVersion: args.formVersion,
  });
  const availableWorkflows = listRegisteredWorkflows();
  const workspaceName =
    normalizeOptionalText(args.branding?.workspace_name) || args.workspaceSlug;
  const workflowSettings = buildWorkflowSettings({
    workflowIdentity,
    fieldOverrides: args.fieldOverrides,
  });
  const integrationSettings = buildIntegrationSettings({
    workspaceSlug: args.workspaceSlug,
    branding: args.branding,
    fieldOverrides: args.fieldOverrides,
    airtableMappings: args.airtableMappings,
    workflowIdentity,
  });
  const reservedFieldOverrideCount = args.fieldOverrides.filter(
    isReservedFieldOverride
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    scope: {
      workspaceSlug: args.workspaceSlug,
      workflowType: workflowIdentity.workflowType,
      formVersion: workflowIdentity.formVersion,
      workflowStatus: workflowIdentity.status,
      workflowRenderer: workflowIdentity.renderer,
      workflowLabel: workflowIdentity.label,
      workflowDescription: workflowIdentity.description,
      availableWorkflows,
    },
    workspaceSettings: buildWorkspaceSettings({
      workspaceSlug: args.workspaceSlug,
      workspaceName,
    }),
    publicExperience: buildPublicExperience({
      workspaceSlug: args.workspaceSlug,
      workspaceName,
      branding: args.branding,
    }),
    workflowSettings,
    integrationSettings,
    accessAndGovernance: buildAccessAndGovernance({
      workspaceSlug: args.workspaceSlug,
      branding: args.branding,
      fieldOverrides: args.fieldOverrides,
    }),
    billingAndEntitlements: buildBillingAndEntitlements({ plan: args.plan ?? null, override: args.planOverride ?? null }),
    diagnostics: {
      brandingConfigured: Boolean(args.branding),
      scopedFieldOverrideCount: workflowSettings.overrideCount,
      reservedFieldOverrideCount,
      scopedAirtableMappingCount: integrationSettings.airtable.mappingCount,
    },
  };
}

export async function loadWorkspaceConfigReadModel(args: {
  workspaceSlug: string;
  workflowType?: WorkflowType | null;
  formVersion?: FormVersion | null;
}) {
  const supabase = createSupabaseAdmin();

  const [
    { data: branding, error: brandingError },
    { data: fieldOverrides, error: fieldOverridesError },
    { data: airtableMappings, error: airtableError },
    { data: workspaceRow },
    { data: planOverrideRow },
  ] = await Promise.all([
    supabase
      .from("workspace_branding")
      .select("*")
      .eq("workspace_slug", args.workspaceSlug)
      .maybeSingle<WorkspaceBrandingRow>(),
    supabase
      .from("workspace_field_overrides")
      .select("*")
      .eq("workspace_slug", args.workspaceSlug)
      .order("step_key", { ascending: true })
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("workspace_airtable_mapping")
      .select("*")
      .eq("workspace_slug", args.workspaceSlug)
      .eq("is_enabled", true),
    // Plano base do workspace (fail-open: null se não encontrado)
    supabase
      .from("workspaces")
      .select("plan_id, plans!inner(id, name, is_public, ai_enabled, audio_upload_mb, cover_upload_mb, submissions_month, airtable_enabled, gdrive_enabled, support_level)")
      .eq("slug", args.workspaceSlug)
      .maybeSingle(),
    // Override por workspace (fail-open: null se não houver override)
    supabase
      .from("workspace_plan_overrides")
      .select("ai_enabled, ai_monthly_budget_brl, ai_overage_policy, ai_gemini_reserve_brl, audio_upload_mb, cover_upload_mb, max_submissions_month, airtable_enabled, gdrive_enabled, support_tier, sla_response_hours, enabled_workflow_types, monthly_value_brl, setup_fee_paid_brl, contract_start_date, contract_end_date, billing_cycle, configured_by")
      .eq("workspace_slug", args.workspaceSlug)
      .maybeSingle(),
  ]);

  if (brandingError) throw new Error(brandingError.message);
  if (fieldOverridesError) throw new Error(fieldOverridesError.message);
  if (airtableError) throw new Error(airtableError.message);

  // Resolver plan row — normalizar join aninhado do Supabase
  let planRow: WorkspacePlanRow | null = null;
  if (workspaceRow) {
    const raw = workspaceRow as Record<string, unknown>;
    const plans = raw["plans"] as Record<string, unknown> | null;
    if (plans) {
      planRow = {
        plan_id: String(raw["plan_id"] ?? "starter"),
        plan_name: String(plans["name"] ?? ""),
        plan_is_public: Boolean(plans["is_public"] ?? true),
        plan_ai_enabled: Boolean(plans["ai_enabled"] ?? false),
        plan_audio_upload_mb: (plans["audio_upload_mb"] as number | null) ?? null,
        plan_cover_upload_mb: (plans["cover_upload_mb"] as number | null) ?? null,
        plan_submissions_month: (plans["submissions_month"] as number | null) ?? null,
        plan_airtable_enabled: Boolean(plans["airtable_enabled"] ?? false),
        plan_gdrive_enabled: Boolean(plans["gdrive_enabled"] ?? false),
        plan_support_level: String(plans["support_level"] ?? "community"),
      };
    }
  }

  return buildWorkspaceConfigReadModel({
    workspaceSlug: args.workspaceSlug,
    workflowType: args.workflowType,
    formVersion: args.formVersion,
    branding: branding ?? null,
    fieldOverrides: (fieldOverrides ?? []) as WorkspaceFieldOverrideRow[],
    airtableMappings: (airtableMappings ?? []) as WorkspaceAirtableMappingRow[],
    plan: planRow,
    planOverride: (planOverrideRow as WorkspacePlanOverrideRow | null) ?? null,
  });
}
