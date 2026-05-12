import type {
  CompanyRegistryFormValues,
  ReleaseIntakeTemplate,
} from "./types";
import {
  ACTIVE_WORKFLOW_FORM_VERSION,
  COMPANY_REGISTRY_WORKFLOW_TYPE,
  buildWorkflowSource,
  buildWorkflowTemplateId,
  type FormVersion,
  type WorkflowType,
} from "./types";

const ATABAQUE_WORKSPACE_SLUG = "atabaque";

const yesNoOptions = [
  { label: "Selecione", value: "" },
  { label: "Sim", value: "yes" },
  { label: "Nao", value: "no" },
];

const documentTypeOptions = [
  { label: "Selecione", value: "" },
  { label: "CPF (pessoa fisica)", value: "cpf" },
  { label: "CNPJ (pessoa juridica)", value: "cnpj" },
];

const accountTypeOptions = [
  { label: "Selecione", value: "" },
  { label: "Conta corrente", value: "corrente" },
  { label: "Conta poupanca", value: "poupanca" },
];

export function createCompanyRegistryTemplate(args?: {
  workspaceSlug?: string;
  workflowType?: WorkflowType;
  formVersion?: FormVersion;
}): ReleaseIntakeTemplate {
  const workspaceSlug = args?.workspaceSlug ?? ATABAQUE_WORKSPACE_SLUG;
  const workflowType = args?.workflowType ?? COMPANY_REGISTRY_WORKFLOW_TYPE;
  const formVersion = args?.formVersion ?? ACTIVE_WORKFLOW_FORM_VERSION;

  return {
    id: buildWorkflowTemplateId(workspaceSlug, workflowType, formVersion),
    workspaceSlug,
    workflowType,
    formVersion,
    source: buildWorkflowSource(workspaceSlug, workflowType, formVersion),
    version: 1,
    slogan: "",
    successMessage:
      "Cadastro recebido com sucesso. A equipe da Atabaque entrara em contato para finalizar a parceria.",
    intro: {
      clientName: "Atabaque",
      formTitle: "Cadastro de empresa",
      introText:
        "Preencha o formulario abaixo para iniciar o cadastro como cliente da Atabaque.\n\nAs informacoes fornecidas serao utilizadas para formalizar a parceria contratual, financeira e operacional.\n\nSe precisar pausar, voce pode salvar o rascunho e continuar depois pelo link enviado ao e-mail informado.",
      highlights: [
        "Dados da empresa",
        "Responsaveis (legal, contrato, financeiro)",
        "Dados bancarios",
      ],
    },
    steps: [
      {
        key: "intro",
        title: "Boas-vindas",
        description: "Introducao ao formulario de cadastro.",
        fields: [],
      },
      {
        key: "company_data",
        title: "Dados da empresa",
        description: "Identificacao fiscal e endereco da empresa ou pessoa fisica.",
        fields: [
          {
            key: "document_type",
            type: "select",
            label: "Tipo de documento",
            required: true,
            options: documentTypeOptions,
          },
          {
            key: "document_number",
            type: "text",
            label: "Numero do documento (CPF ou CNPJ)",
            required: true,
            placeholder: "000.000.000-00 ou 00.000.000/0001-00",
          },
          {
            key: "fantasy_name",
            type: "text",
            label: "Nome fantasia",
            required: true,
            placeholder: "Nome pelo qual a empresa e conhecida",
          },
          {
            key: "legal_name",
            type: "text",
            label: "Razao social",
            required: true,
            placeholder: "Razao social completa conforme registro",
          },
          {
            key: "address",
            type: "text",
            label: "Endereco (logradouro, numero, complemento)",
            required: true,
            placeholder: "Rua, numero, complemento",
          },
          {
            key: "city",
            type: "text",
            label: "Cidade",
            required: true,
            placeholder: "Cidade",
          },
          {
            key: "state",
            type: "text",
            label: "Estado (UF)",
            required: true,
            placeholder: "SP",
          },
          {
            key: "zip_code",
            type: "text",
            label: "CEP",
            required: true,
            placeholder: "00000-000",
          },
        ],
      },
      {
        key: "legal_representative",
        title: "Responsavel legal",
        description:
          "Dados do responsavel legal pela empresa. Pode ser o socio-administrador ou representante autorizado.",
        fields: [
          {
            key: "name",
            type: "text",
            label: "Nome completo",
            required: true,
            placeholder: "Nome do responsavel legal",
          },
          {
            key: "phone",
            type: "text",
            label: "Telefone / WhatsApp",
            required: true,
            placeholder: "+55 11 99999-9999",
          },
          {
            key: "email",
            type: "email",
            label: "E-mail",
            required: true,
            placeholder: "email@empresa.com",
          },
        ],
      },
      {
        key: "contract_representative",
        title: "Responsavel pelo contrato",
        description:
          "Quem assina ou acompanha os contratos firmados com a Atabaque. Pode ser o mesmo responsavel legal.",
        fields: [
          {
            key: "same_as_legal",
            type: "select",
            label: "Mesmo que o responsavel legal?",
            required: true,
            options: yesNoOptions,
          },
          {
            key: "name",
            type: "text",
            label: "Nome completo",
            required: false,
            placeholder: "Nome do responsavel pelo contrato",
          },
          {
            key: "phone",
            type: "text",
            label: "Telefone / WhatsApp",
            required: false,
            placeholder: "+55 11 99999-9999",
          },
          {
            key: "email",
            type: "email",
            label: "E-mail",
            required: false,
            placeholder: "email@empresa.com",
          },
        ],
      },
      {
        key: "financial_representative",
        title: "Responsavel financeiro",
        description:
          "Quem recebe os boletos, faturas e repasses financeiros. Pode ser o mesmo responsavel legal ou do contrato.",
        fields: [
          {
            key: "same_as_legal",
            type: "select",
            label: "Mesmo que o responsavel legal?",
            required: true,
            options: yesNoOptions,
          },
          {
            key: "same_as_contract",
            type: "select",
            label: "Mesmo que o responsavel pelo contrato?",
            required: true,
            options: yesNoOptions,
          },
          {
            key: "name",
            type: "text",
            label: "Nome completo",
            required: false,
            placeholder: "Nome do responsavel financeiro",
          },
          {
            key: "phone",
            type: "text",
            label: "Telefone / WhatsApp",
            required: false,
            placeholder: "+55 11 99999-9999",
          },
          {
            key: "email",
            type: "email",
            label: "E-mail",
            required: false,
            placeholder: "email@empresa.com",
          },
        ],
      },
      {
        key: "banking_data",
        title: "Dados bancarios",
        description:
          "Informacoes da conta bancaria para repasses e transferencias.",
        fields: [
          {
            key: "bank_name",
            type: "text",
            label: "Banco",
            required: true,
            placeholder: "Ex: Itau, Bradesco, Nubank",
          },
          {
            key: "agency",
            type: "text",
            label: "Agencia",
            required: true,
            placeholder: "0000",
          },
          {
            key: "account",
            type: "text",
            label: "Conta (com digito)",
            required: true,
            placeholder: "00000-0",
          },
          {
            key: "account_type",
            type: "select",
            label: "Tipo de conta",
            required: true,
            options: accountTypeOptions,
          },
          {
            key: "pix_key",
            type: "text",
            label: "Chave Pix (opcional)",
            required: false,
            placeholder: "CPF, CNPJ, e-mail, telefone ou chave aleatoria",
          },
        ],
      },
      {
        key: "review_submit",
        title: "Revisao e envio",
        description:
          "Revise as informacoes antes de enviar o formulario.",
        fields: [],
      },
    ],
  };
}

export function createInitialCompanyRegistryValues(): CompanyRegistryFormValues {
  return {
    company_data: {
      document_type: "",
      document_number: "",
      fantasy_name: "",
      legal_name: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
    },
    legal_representative: {
      name: "",
      phone: "",
      email: "",
    },
    contract_representative: {
      same_as_legal: "",
      name: "",
      phone: "",
      email: "",
    },
    financial_representative: {
      same_as_legal: "",
      same_as_contract: "",
      name: "",
      phone: "",
      email: "",
    },
    banking_data: {
      bank_name: "",
      agency: "",
      account: "",
      account_type: "",
      pix_key: "",
    },
  };
}

export const companyRegistryTemplate = createCompanyRegistryTemplate();
