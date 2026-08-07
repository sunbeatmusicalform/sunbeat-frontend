import "server-only";

import { createHash, createHmac, timingSafeEqual } from "crypto";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getPlanProductCapabilities,
  FREE_ASSET_RETENTION_DAYS,
} from "@/lib/billing/plan-capabilities";
import { listRegisteredWorkflows } from "@/lib/form-engine/workflow-registry";
import {
  ONBOARDING_INTEGRATIONS,
  ONBOARDING_MONTHLY_VOLUMES,
  ONBOARDING_OPERATION_TYPES,
  ONBOARDING_TEAM_SIZES,
  type OnboardingInitialData,
  type OnboardingIntegration,
  type OnboardingMonthlyVolume,
  type OnboardingOperationType,
  type OnboardingPreview,
  type OnboardingTeamSize,
  type WorkspaceOnboardingProfile,
} from "@/lib/onboarding/types";

const ONBOARDING_WORKFLOW_TYPE = "__workspace_onboarding__";
const PREVIEW_TTL_SECONDS = 30 * 60;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

function cleanText(value: unknown, maxLength = 600) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function uniqueAllowed<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  const allowedSet = new Set<string>(allowed);
  return Array.from(
    new Set(
      value.filter((item): item is T => typeof item === "string" && allowedSet.has(item))
    )
  );
}

function activeWorkflowTypes() {
  return listRegisteredWorkflows()
    .filter((workflow) => workflow.status === "active")
    .map((workflow) => workflow.workflowType);
}

function allowedWorkflowsForPlan(planId: string) {
  const active = activeWorkflowTypes();
  const capabilities = getPlanProductCapabilities(planId);
  const allowed = capabilities.enabledWorkflowTypes;
  return allowed === null ? active : active.filter((workflowType) => allowed.includes(workflowType));
}

export function normalizeOnboardingProfile(
  value: unknown,
  args: { planId: string; fallbackWorkflowTypes?: string[] }
): WorkspaceOnboardingProfile {
  const source = isRecord(value) ? value : {};
  const allowedWorkflows = allowedWorkflowsForPlan(args.planId);
  const requestedWorkflows = uniqueAllowed(source.workflowTypes, allowedWorkflows);
  const fallbackWorkflows = uniqueAllowed(args.fallbackWorkflowTypes, allowedWorkflows);
  const workflowTypes =
    requestedWorkflows.length > 0
      ? requestedWorkflows
      : fallbackWorkflows.length > 0
        ? fallbackWorkflows
        : allowedWorkflows.slice(0, 1);

  return {
    operationType: enumValue<OnboardingOperationType>(
      source.operationType,
      ONBOARDING_OPERATION_TYPES,
      "label"
    ),
    teamSize: enumValue<OnboardingTeamSize>(source.teamSize, ONBOARDING_TEAM_SIZES, "1"),
    monthlyVolume: enumValue<OnboardingMonthlyVolume>(
      source.monthlyVolume,
      ONBOARDING_MONTHLY_VOLUMES,
      "1-10"
    ),
    workflowTypes,
    integrations: uniqueAllowed<OnboardingIntegration>(source.integrations, ONBOARDING_INTEGRATIONS),
    primaryGoal: cleanText(source.primaryGoal),
  };
}

function previewSecret() {
  const secret =
    process.env.ONBOARDING_PREVIEW_SECRET?.trim() ||
    process.env.BACKEND_INTERNAL_ADMIN_TOKEN?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) throw new Error("Onboarding preview secret is not configured.");
  return secret;
}

function profileDigest(args: { workspaceSlug: string; userId: string; profile: WorkspaceOnboardingProfile }) {
  return createHash("sha256").update(JSON.stringify(args)).digest("hex");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", previewSecret()).update(encodedPayload).digest("base64url");
}

function issuePreviewToken(args: {
  workspaceSlug: string;
  userId: string;
  profile: WorkspaceOnboardingProfile;
}) {
  const expiresAt = new Date(Date.now() + PREVIEW_TTL_SECONDS * 1000);
  const payload = Buffer.from(
    JSON.stringify({
      workspaceSlug: args.workspaceSlug,
      userId: args.userId,
      digest: profileDigest(args),
      exp: Math.floor(expiresAt.getTime() / 1000),
    })
  ).toString("base64url");
  return { token: `${payload}.${signPayload(payload)}`, expiresAt: expiresAt.toISOString() };
}

function verifyPreviewToken(args: {
  token: string;
  workspaceSlug: string;
  userId: string;
  profile: WorkspaceOnboardingProfile;
}) {
  const [payload, signature] = args.token.split(".");
  if (!payload || !signature) return false;
  const expected = Buffer.from(signPayload(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as JsonRecord;
    return (
      parsed.workspaceSlug === args.workspaceSlug &&
      parsed.userId === args.userId &&
      parsed.digest === profileDigest(args) &&
      typeof parsed.exp === "number" &&
      parsed.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export async function loadOnboardingData(workspaceSlug: string): Promise<OnboardingInitialData> {
  const admin = createSupabaseAdmin();
  const [{ data: workspace, error: workspaceError }, { data: branding }, { data: settings }] =
    await Promise.all([
      admin.from("workspaces").select("name, plan_id").eq("slug", workspaceSlug).maybeSingle(),
      admin
        .from("workspace_branding")
        .select("enabled_workflows")
        .eq("workspace_slug", workspaceSlug)
        .maybeSingle(),
      admin
        .from("workspace_workflow_settings")
        .select("extra_settings")
        .eq("workspace_slug", workspaceSlug)
        .eq("workflow_type", ONBOARDING_WORKFLOW_TYPE)
        .maybeSingle(),
    ]);

  if (workspaceError || !workspace) throw new Error("Workspace não encontrado.");
  const planId = String(workspace.plan_id || "free");
  const allowedWorkflowTypes = allowedWorkflowsForPlan(planId);
  const enabled = Array.isArray(branding?.enabled_workflows)
    ? branding.enabled_workflows.filter((item): item is string => typeof item === "string")
    : allowedWorkflowTypes;
  const extra = isRecord(settings?.extra_settings) ? settings.extra_settings : {};
  const onboarding = isRecord(extra.onboarding) ? extra.onboarding : {};
  const profile = normalizeOnboardingProfile(onboarding.profile, {
    planId,
    fallbackWorkflowTypes: enabled,
  });

  return {
    workspaceSlug,
    workspaceName: cleanText(workspace.name, 120) || workspaceSlug,
    planId,
    allowedWorkflowTypes,
    enabledWorkflowTypes: profile.workflowTypes,
    profile,
    completedAt: typeof onboarding.completed_at === "string" ? onboarding.completed_at : null,
  };
}

export async function previewOnboarding(args: {
  workspaceSlug: string;
  userId: string;
  profile: unknown;
}): Promise<OnboardingPreview> {
  const current = await loadOnboardingData(args.workspaceSlug);
  const profile = normalizeOnboardingProfile(args.profile, {
    planId: current.planId,
    fallbackWorkflowTypes: current.enabledWorkflowTypes,
  });
  const signed = issuePreviewToken({ ...args, profile });
  const warnings = current.planId === "free"
    ? [
        `No plano Free, os assets ficam disponíveis por ${FREE_ASSET_RETENTION_DAYS} dias; metadados e auditoria permanecem registrados.`,
      ]
    : [];

  return {
    workspaceSlug: args.workspaceSlug,
    planId: current.planId,
    profile,
    enabledWorkflows: profile.workflowTypes,
    changes: [
      {
        key: "operation",
        title: "Perfil operacional",
        detail: `${profile.operationType} · equipe ${profile.teamSize} · ${profile.monthlyVolume} operações/mês`,
      },
      {
        key: "workflows",
        title: "Acesso aos workflows",
        detail: profile.workflowTypes.join(", "),
      },
      {
        key: "integrations",
        title: "Prioridades de integração",
        detail: profile.integrations.length > 0 ? profile.integrations.join(", ") : "Configurar depois",
      },
      {
        key: "governance",
        title: "Governança do MotoSchema",
        detail: "Prévia assinada, confirmação humana e registro de auditoria antes da aplicação.",
      },
    ],
    warnings,
    previewToken: signed.token,
    expiresAt: signed.expiresAt,
  };
}

export async function applyOnboarding(args: {
  workspaceSlug: string;
  userId: string;
  userEmail: string | null;
  profile: unknown;
  previewToken: string;
}) {
  const preview = await previewOnboarding(args);
  if (
    !verifyPreviewToken({
      token: args.previewToken,
      workspaceSlug: args.workspaceSlug,
      userId: args.userId,
      profile: preview.profile,
    })
  ) {
    throw new Error("A prévia expirou ou não corresponde à configuração atual. Gere uma nova prévia.");
  }

  const admin = createSupabaseAdmin();
  const completedAt = new Date().toISOString();
  const { error: brandingError } = await admin.from("workspace_branding").upsert(
    {
      workspace_slug: args.workspaceSlug,
      enabled_workflows: preview.enabledWorkflows,
    },
    { onConflict: "workspace_slug" }
  );
  if (brandingError) throw new Error(`Não foi possível ativar os workflows: ${brandingError.message}`);

  const { error: settingsError } = await admin.from("workspace_workflow_settings").upsert(
    {
      workspace_slug: args.workspaceSlug,
      workflow_type: ONBOARDING_WORKFLOW_TYPE,
      configured_by: args.userEmail || args.userId,
      notes: "Configuração guiada pelo MotoSchema com confirmação humana.",
      extra_settings: {
        onboarding: {
          version: 1,
          profile: preview.profile,
          preview_digest: profileDigest({
            workspaceSlug: args.workspaceSlug,
            userId: args.userId,
            profile: preview.profile,
          }),
          completed_at: completedAt,
          completed_by_user_id: args.userId,
        },
      },
    },
    { onConflict: "workspace_slug,workflow_type" }
  );
  if (settingsError) throw new Error(`Não foi possível salvar o onboarding: ${settingsError.message}`);

  return { ...preview, completedAt };
}
