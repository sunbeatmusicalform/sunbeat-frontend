import { createLegacyReleaseIntakeTemplate } from "./atabaque-template";
import { createRightsClearanceTemplate } from "./rights-clearance-template";
import {
  ACTIVE_WORKFLOW_FORM_VERSION,
  buildWorkflowSource,
  buildWorkflowTemplateId,
  DEFAULT_RELEASE_INTAKE_WORKFLOW_TYPE,
  LEGACY_RELEASE_INTAKE_FORM_VERSION,
  PEOPLE_REGISTRY_WORKFLOW_TYPE,
  PLANNED_WORKFLOW_FORM_VERSION,
  RIGHTS_CLEARANCE_WORKFLOW_TYPE,
  type FormVersion,
  type ReleaseIntakeTemplate,
  type WorkflowIdentity,
  type WorkflowRegistryEntry,
  type WorkflowType,
} from "./types";

const WORKFLOW_REGISTRY: Record<string, WorkflowRegistryEntry> = {
  [DEFAULT_RELEASE_INTAKE_WORKFLOW_TYPE]: {
    workflowType: DEFAULT_RELEASE_INTAKE_WORKFLOW_TYPE,
    label: "Release intake",
    description:
      "Fluxo legado operacional da Atabaque preservado como trilha principal.",
    defaultFormVersion: LEGACY_RELEASE_INTAKE_FORM_VERSION,
    status: "active",
    renderer: "release_intake",
    templateFactory: "release_intake",
    payloadBuilder: "release_intake",
    publicPathPrefix: "/intake",
  },
  [RIGHTS_CLEARANCE_WORKFLOW_TYPE]: {
    workflowType: RIGHTS_CLEARANCE_WORKFLOW_TYPE,
    label: "Rights clearance",
    description:
      "Workflow multi-step de clearance, licenciamento e referencias operacionais.",
    defaultFormVersion: ACTIVE_WORKFLOW_FORM_VERSION,
    status: "active",
    renderer: "rights_clearance",
    templateFactory: "rights_clearance",
    payloadBuilder: "rights_clearance",
    publicPathPrefix: "/clearance",
  },
  [PEOPLE_REGISTRY_WORKFLOW_TYPE]: {
    workflowType: PEOPLE_REGISTRY_WORKFLOW_TYPE,
    label: "People registry",
    description:
      "Placeholder inicial para o workflow de cadastro de pessoas fisicas e juridicas.",
    defaultFormVersion: PLANNED_WORKFLOW_FORM_VERSION,
    status: "planned",
    renderer: "external",
    templateFactory: "external",
    payloadBuilder: "external",
    publicPathPrefix: "/people",
  },
};

function humanizeWorkflowType(workflowType: string) {
  return workflowType
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getWorkflowRegistryEntry(
  workflowType?: WorkflowType | null
): WorkflowRegistryEntry {
  const normalized = String(workflowType || "").trim();
  if (!normalized) {
    return WORKFLOW_REGISTRY[DEFAULT_RELEASE_INTAKE_WORKFLOW_TYPE];
  }

  return (
    WORKFLOW_REGISTRY[normalized] ?? {
      workflowType: normalized,
      label: humanizeWorkflowType(normalized),
      description: "Workflow customizado ainda nao conectado a um renderer local.",
      defaultFormVersion: PLANNED_WORKFLOW_FORM_VERSION,
      status: "custom",
      renderer: "external",
      templateFactory: "external",
      payloadBuilder: "external",
      publicPathPrefix: `/${normalized}`,
    }
  );
}

export function listRegisteredWorkflows(): WorkflowRegistryEntry[] {
  return Object.values(WORKFLOW_REGISTRY);
}

export function resolveWorkflowIdentity(args: {
  workspaceSlug: string;
  workflowType?: WorkflowType | null;
  formVersion?: FormVersion | null;
}): WorkflowIdentity {
  const workspaceSlug = args.workspaceSlug.trim();
  const workflow = getWorkflowRegistryEntry(args.workflowType);
  const formVersion =
    String(args.formVersion || "").trim() || workflow.defaultFormVersion;

  return {
    ...workflow,
    workspaceSlug,
    formVersion,
    source: buildWorkflowSource(workspaceSlug, workflow.workflowType, formVersion),
    templateId: buildWorkflowTemplateId(
      workspaceSlug,
      workflow.workflowType,
      formVersion
    ),
  };
}

export function resolveWorkflowRenderer(
  workflowType?: WorkflowType | null
) {
  return getWorkflowRegistryEntry(workflowType).renderer;
}

export function buildWorkflowPublicPath(args: {
  workspaceSlug: string;
  workflowType?: WorkflowType | null;
}) {
  const workflow = getWorkflowRegistryEntry(args.workflowType);
  return `${workflow.publicPathPrefix}/${args.workspaceSlug.trim()}`;
}

export function resolveWorkflowTemplateFactory(identity: WorkflowIdentity) {
  switch (identity.templateFactory) {
    case "release_intake":
      return createLegacyReleaseIntakeTemplate;
    case "rights_clearance":
      return createRightsClearanceTemplate;
    default:
      throw new Error(
        `Workflow ${identity.workflowType} ainda nao esta ligado a uma factory de template local.`
      );
  }
}

export function createWorkflowTemplate(
  identity: WorkflowIdentity
): ReleaseIntakeTemplate {
  const templateFactory = resolveWorkflowTemplateFactory(identity);

  return templateFactory({
    workspaceSlug: identity.workspaceSlug,
    workflowType: identity.workflowType,
    formVersion: identity.formVersion,
  });
}

// Para plugar novos formularios:
// 1. registrar o workflow aqui;
// 2. apontar o renderer correto;
// 3. conectar a nova pagina/template sem tocar no legacy_v1 da Atabaque.
