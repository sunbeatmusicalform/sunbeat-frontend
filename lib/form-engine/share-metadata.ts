import type { Metadata } from "next";
import { headers } from "next/headers";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  buildWorkflowPublicPath,
  createWorkflowTemplate,
  resolveWorkflowIdentity,
} from "./workflow-registry";
import {
  COMPANY_REGISTRY_WORKFLOW_TYPE,
  DEFAULT_RELEASE_INTAKE_WORKFLOW_TYPE,
  RIGHTS_CLEARANCE_WORKFLOW_TYPE,
  type FormVersion,
  type WorkflowTemplate,
  type WorkflowType,
} from "./types";

type WorkspaceShareBranding = Record<string, unknown>;

type ShareableWorkflowTemplate = WorkflowTemplate & {
  title?: string | null;
  description?: string | null;
  shareTitle?: string | null;
  shareDescription?: string | null;
};

const GLOBAL_SUNBEAT_SHARE_IMAGE = "/favicon.ico";
const DEFAULT_HOST = "sunbeat.pro";

function pickText(
  source: Record<string, unknown> | null | undefined,
  keys: string[]
) {
  if (!source) return "";

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

function absoluteUrl(value: string, origin: string) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${origin}${value}`;
  return `${origin}/${value}`;
}

async function getRequestOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") || DEFAULT_HOST;
  const protocol = requestHeaders.get("x-forwarded-proto") || "https";

  return `${protocol}://${host}`;
}

async function loadWorkspaceShareBranding(workspaceSlug: string) {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("workspace_branding")
      .select("*")
      .eq("workspace_slug", workspaceSlug)
      .maybeSingle();

    if (error) return null;
    return (data ?? null) as WorkspaceShareBranding | null;
  } catch {
    return null;
  }
}

function fallbackDescriptionForWorkflow(workflowType: WorkflowType) {
  switch (workflowType) {
    case DEFAULT_RELEASE_INTAKE_WORKFLOW_TYPE:
      return "Envie os dados do lançamento por um formulário seguro e direto.";
    case RIGHTS_CLEARANCE_WORKFLOW_TYPE:
      return "Compartilhe informações de clearance, licenciamento e referências do projeto.";
    case COMPANY_REGISTRY_WORKFLOW_TYPE:
      return "Cadastre dados empresariais, responsáveis e informações bancárias.";
    default:
      return "Preencha o formulário público do workspace por link direto.";
  }
}

function buildShareTitle(args: {
  template: ShareableWorkflowTemplate;
  branding: WorkspaceShareBranding | null;
  workflowLabel: string;
}) {
  const formShareTitle =
    pickText(args.template, ["shareTitle", "share_title"]) ||
    // Current schema keeps preview copy in workspace_branding. Treat it as the
    // form-level share title until share fields become workflow-scoped.
    pickText(args.branding, ["socialTitle", "social_title"]);
  if (formShareTitle) return formShareTitle;

  const formTitle =
    pickText(args.template, ["title"]) || args.template.intro.formTitle?.trim();
  if (formTitle) return formTitle;

  const tenantName =
    pickText(args.branding, ["name", "workspace_name", "tenant_name"]) ||
    args.template.intro.clientName;

  return `${tenantName} — ${args.workflowLabel}`;
}

function buildShareDescription(args: {
  template: ShareableWorkflowTemplate;
  branding: WorkspaceShareBranding | null;
  workflowType: WorkflowType;
}) {
  const formShareDescription =
    pickText(args.template, ["shareDescription", "share_description"]) ||
    // Current schema keeps preview copy in workspace_branding. Treat it as the
    // form-level share description until share fields become workflow-scoped.
    pickText(args.branding, ["socialDescription", "social_description"]);
  if (formShareDescription) return formShareDescription;

  const formDescription = pickText(args.template, ["description"]);
  if (formDescription) return formDescription;

  const workflowFallback = fallbackDescriptionForWorkflow(args.workflowType);
  if (workflowFallback) return workflowFallback;

  return pickText(args.branding, [
    "description",
    "workspace_description",
    "tenant_description",
    "slogan",
  ]);
}

function buildShareImage(args: {
  template: ShareableWorkflowTemplate;
  branding: WorkspaceShareBranding | null;
  origin: string;
}) {
  const tenantImage =
    pickText(args.branding, [
      "shareImageUrl",
      "share_image_url",
      "socialImageUrl",
      "social_image_url",
    ]) ||
    pickText(args.branding, ["badgeUrl", "badge_url"]) ||
    pickText(args.branding, ["logoUrl", "logo_url"]);

  const image =
    tenantImage || args.template.intro.logoUrl || GLOBAL_SUNBEAT_SHARE_IMAGE;

  return absoluteUrl(image, args.origin);
}

export async function buildWorkflowShareMetadata(args: {
  workspaceSlug: string;
  workflowType: WorkflowType;
  formVersion?: FormVersion;
}): Promise<Metadata> {
  const origin = await getRequestOrigin();
  const identity = resolveWorkflowIdentity(args);
  const template = createWorkflowTemplate(identity) as ShareableWorkflowTemplate;
  const branding = await loadWorkspaceShareBranding(identity.workspaceSlug);
  const title = buildShareTitle({
    template,
    branding,
    workflowLabel: identity.label,
  });
  const description = buildShareDescription({
    template,
    branding,
    workflowType: identity.workflowType,
  });
  const imageUrl = buildShareImage({ template, branding, origin });
  const pathname = buildWorkflowPublicPath({
    workspaceSlug: identity.workspaceSlug,
    workflowType: identity.workflowType,
  });
  const canonicalUrl = absoluteUrl(pathname, origin);

  return {
    title,
    description,
    metadataBase: new URL(origin),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 1200,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}
