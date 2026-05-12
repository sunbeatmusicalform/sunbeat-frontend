import {
  PEOPLE_REGISTRY_WORKFLOW_TYPE,
  buildWorkflowSource,
  buildWorkflowTemplateId,
  type FormField,
  type FormStep,
  type WorkflowTemplate,
} from "@/lib/form-engine/types";
import type { PeopleRegistryProfileConfig } from "./types";

const partyKindOptions = [
  { label: "Pessoa Fisica", value: "pf" },
  { label: "Pessoa Juridica", value: "pj" },
];

function field(
  key: string,
  label: string,
  required = false,
  helperText = ""
): FormField {
  return {
    key,
    label,
    required,
    helperText,
    type: "text",
  };
}

export function createPeopleRegistryWorkflowTemplate(
  profile: PeopleRegistryProfileConfig
): WorkflowTemplate {
  const workspaceSlug = profile.workspaceSlug;
  const workflowType = PEOPLE_REGISTRY_WORKFLOW_TYPE;
  const formVersion = profile.formVersion;
  const steps: FormStep[] = [
    {
      key: "intro",
      title: "Introducao",
      description: "Comece o cadastro de pessoas.",
      fields: [],
    },
    {
      key: "identification",
      title: "Identificacao",
      description: "Dados principais da pessoa fisica ou juridica.",
      fields: [
        {
          key: "party_kind",
          label: "Tipo de cadastro",
          required: true,
          type: "select",
          options: partyKindOptions,
        },
        field("display_name", "Nome de exibicao", true),
        field("legal_name", "Nome completo ou razao social", true),
        field("stage_name", "Nome artistico", false, "Aplicavel para pessoa fisica."),
        field("trade_name", "Nome fantasia", false, "Aplicavel para pessoa juridica."),
        field("document_id", "CPF ou CNPJ", false, "Usado para deduplicacao."),
        {
          key: "roles",
          label: "Funcoes no projeto",
          required: true,
          helperText: "Lista definida pelo profile operacional do workspace.",
          type: "select",
          options: profile.availableRoles,
        },
      ],
    },
  ];

  if (profile.showSections.contact) {
    steps.push({
      key: "contact",
      title: "Contato",
      description: "Canais principais de contato.",
      fields: [
        field("email_primary", "E-mail", false, "Tambem usado para deduplicacao."),
        field("phone_primary", "Telefone / WhatsApp"),
        field("website", "Site"),
        field("instagram", "Instagram"),
      ],
    });
  }

  if (profile.showSections.address) {
    steps.push({
      key: "address",
      title: "Endereco",
      description: "Endereco cadastral principal.",
      fields: [
        field("country", "Pais"),
        field("state_region", "Estado"),
        field("city", "Cidade"),
        field("postal_code", "CEP"),
        field("address_line_1", "Endereco"),
      ],
    });
  }

  if (profile.showSections.banking) {
    steps.push({
      key: "banking",
      title: "Dados bancarios",
      description: "Dados para repasses e pagamentos.",
      fields: [
        field("pix_key", "Chave PIX"),
        field("bank_name", "Banco"),
        field("bank_agency", "Agencia"),
        field("account_number", "Numero da conta"),
        field("account_holder_name", "Titular da conta"),
        field("account_holder_document_id", "CPF / CNPJ do titular"),
      ],
    });
  }

  if (profile.showSections.additionalInfo) {
    steps.push({
      key: "additional_info",
      title: "Informacoes adicionais",
      description: "Dados operacionais complementares.",
      fields: [
        field("manager_name", "Assessor / Manager"),
        field("label_name", "Gravadora / Editora"),
        field("notes_internal", "Observacoes internas"),
      ],
    });
  }

  steps.push({
    key: "review_submit",
    title: "Revisao e envio",
    description: "Revise os dados antes de concluir.",
    fields: [],
  });

  return {
    id: buildWorkflowTemplateId(workspaceSlug, workflowType, formVersion),
    workspaceSlug,
    workflowType,
    formVersion,
    source: buildWorkflowSource(workspaceSlug, workflowType, formVersion),
    version: 1,
    slogan: "",
    successMessage: "Cadastro recebido com sucesso.",
    intro: {
      clientName: profile.clientLabel,
      formTitle: profile.formTitle,
      introText: "",
      supportLogoUrl: "/favicon.ico",
      supportLogoAlt: "Sunbeat",
      supportLabel: "Powered by Sunbeat",
      highlights: [],
    },
    steps,
  };
}
