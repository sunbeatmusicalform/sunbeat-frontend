import { createLegacyReleaseIntakeTemplate } from "./atabaque-template";
import { createRightsClearanceTemplate } from "./rights-clearance-template";
import { createCompanyRegistryTemplate } from "./company-registry-template";
import {
  ACTIVE_WORKFLOW_FORM_VERSION,
  buildWorkflowSource,
  buildWorkflowTemplateId,
  COMPANY_REGISTRY_WORKFLOW_TYPE,
  DEFAULT_RELEASE_INTAKE_WORKFLOW_TYPE,
  LEGACY_RELEASE_INTAKE_FORM_VERSION,
  PEOPLE_REGISTRY_WORKFLOW_TYPE,
  PLANNED_WORKFLOW_FORM_VERSION,
  RIGHTS_CLEARANCE_WORKFLOW_TYPE,
  type FormVersion,
  type ReleaseIntakeTemplate,
  type WorkflowCapabilities,
  type WorkflowIdentity,
  type WorkflowOperationalDefaults,
  type WorkflowRegistryEntry,
  type WorkflowType,
} from "./types";

const DEFAULT_EXTERNAL_WORKFLOW_CAPABILITIES: WorkflowCapabilities = {
  steps: [],
  airtableTarget: "—",
  driveNote: "—",
  previewPath: null,
  fieldEditorMode: "none",
  operationalDefaults: {
    postSubmitEmailEnabled: false,
    editEmailEnabled: false,
    airtableSyncEnabled: false,
    driveSyncEnabled: false,
    editModeEnabled: false,
  },
};

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
    capabilities: {
      steps: [
        { label: "Introdução" },
        { label: "Identificação" },
        { label: "Projeto" },
        { label: "Faixas" },
        { label: "Marketing" },
        { label: "Revisão" },
      ],
      airtableTarget: "[V2] Projetos + Faixas Musicais",
      driveNote: "Root folder do workspace",
      previewPath: "/app/release-intake",
      fieldEditorMode: "legacy_release_intake",
      operationalDefaults: {
        postSubmitEmailEnabled: true,
        editEmailEnabled: true,
        airtableSyncEnabled: true,
        driveSyncEnabled: true,
        editModeEnabled: true,
      },
    },
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
    capabilities: {
      steps: [
        { label: "Introdução" },
        { label: "Solicitante" },
        { label: "Formato" },
        { label: "Contexto" },
        { label: "Faixas" },
        { label: "Escopo" },
        { label: "Assets" },
        { label: "Revisão" },
      ],
      airtableTarget: "[V2] Clearance — Case · Itens · Partes",
      driveNote: "Pasta Clearance Musical / Não-Musical",
      previewPath: "/app/rights-clearance",
      fieldEditorMode: "workflow_config",
      operationalDefaults: {
        postSubmitEmailEnabled: true,
        editEmailEnabled: true,
        airtableSyncEnabled: true,
        driveSyncEnabled: true,
        editModeEnabled: true,
      },
    },
  },
  [PEOPLE_REGISTRY_WORKFLOW_TYPE]: {
    workflowType: PEOPLE_REGISTRY_WORKFLOW_TYPE,
    label: "People registry",
    description:
      "Cadastro de pessoas fisicas e juridicas com perfil operacional da Atabaque.",
    defaultFormVersion: PLANNED_WORKFLOW_FORM_VERSION,
    status: "active",
    renderer: "external",
    templateFactory: "external",
    payloadBuilder: "external",
    publicPathPrefix: "/people",
    capabilities: {
      steps: [
        { label: "Introdução" },
        { label: "Identificação" },
        { label: "Contato" },
        { label: "Endereço" },
        { label: "Bancário" },
        { label: "Informações adicionais" },
        { label: "Revisão" },
      ],
      airtableTarget: "Dados Cadastrais / People Registry",
      driveNote: "Não mapeado ainda",
      previewPath: null,
      fieldEditorMode: "profile_adapter",
      operationalDefaults: {
        postSubmitEmailEnabled: false,
        editEmailEnabled: false,
        airtableSyncEnabled: true,
        driveSyncEnabled: false,
        editModeEnabled: true,
      },
    },
  },
  [COMPANY_REGISTRY_WORKFLOW_TYPE]: {
    workflowType: COMPANY_REGISTRY_WORKFLOW_TYPE,
    label: "Cadastro de empresa",
    description:
      "Cadastro de clientes efetivos da Atabaque — dados contratuais, financeiros e operacionais.",
    defaultFormVersion: ACTIVE_WORKFLOW_FORM_VERSION,
    status: "active",
    renderer: "company_registry",
    templateFactory: "company_registry",
    payloadBuilder: "company_registry",
    publicPathPrefix: "/company",
    capabilities: {
      steps: [
        { label: "Boas-vindas" },
        { label: "Dados da empresa" },
        { label: "Resp. legal" },
        { label: "Resp. contrato" },
        { label: "Resp. financeiro" },
        { label: "Bancário" },
        { label: "Revisão" },
      ],
      airtableTarget: "Tabela de clientes efetivos",
      driveNote: "Não mapeado ainda",
      previewPath: null,
      fieldEditorMode: "workflow_config",
      operationalDefaults: {
        postSubmitEmailEnabled: true,
        editEmailEnabled: true,
        airtableSyncEnabled: true,
        driveSyncEnabled: false,
        editModeEnabled: true,
      },
    },
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
      publicPathPrefix: null,
      capabilities: DEFAULT_EXTERNAL_WORKFLOW_CAPABILITIES,
    }
  );
}

export function listRegisteredWorkflows(): WorkflowRegistryEntry[] {
  return Object.values(WORKFLOW_REGISTRY);
}

export function listFieldEditableWorkflows(): WorkflowRegistryEntry[] {
  return listRegisteredWorkflows().filter(
    (workflow) => workflow.capabilities.fieldEditorMode !== "none"
  );
}

export function getWorkflowOperationalDefaults(
  workflowType?: WorkflowType | null
): WorkflowOperationalDefaults {
  const defaults =
    getWorkflowRegistryEntry(workflowType).capabilities.operationalDefaults;

  return { ...defaults };
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
  if (!workflow.publicPathPrefix) {
    return null;
  }
  return `${workflow.publicPathPrefix}/${args.workspaceSlug.trim()}`;
}

export function resolveWorkflowTemplateFactory(identity: WorkflowIdentity) {
  switch (identity.templateFactory) {
    case "release_intake":
      return createLegacyReleaseIntakeTemplate;
    case "rights_clearance":
      return createRightsClearanceTemplate;
    case "company_registry":
      return createCompanyRegistryTemplate;
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
