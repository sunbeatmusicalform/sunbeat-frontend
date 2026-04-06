import type {
  ClearanceFormat,
  RightsClearanceFormValues,
  RightsClearanceTrackValues,
  RightsClearanceTemplate,
} from "./types";
import {
  ACTIVE_WORKFLOW_FORM_VERSION,
  RIGHTS_CLEARANCE_WORKFLOW_TYPE,
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

const clearanceFormatOptions = [
  { label: "Selecione", value: "" },
  {
    label: "Lancamento musical / projeto + faixas",
    value: "music_release_clearance_intake",
  },
  { label: "Projeto musical / faixa", value: "music_project_track" },
  {
    label: "Audiovisual / produto / videoclipe / sync",
    value: "audiovisual_product_sync",
  },
];

export function createRightsClearanceTemplate(args?: {
  workspaceSlug?: string;
  workflowType?: WorkflowType;
  formVersion?: FormVersion;
}): RightsClearanceTemplate {
  const workspaceSlug = args?.workspaceSlug ?? ATABAQUE_WORKSPACE_SLUG;
  const workflowType = args?.workflowType ?? RIGHTS_CLEARANCE_WORKFLOW_TYPE;
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
      "Recebemos a solicitacao de rights clearance com sucesso. O time da Atabaque dara continuidade a analise e ao fluxo operacional.",
    intro: {
      clientName: "Atabaque",
      formTitle: "Formulario de rights clearance",
      introText:
        "Preencha o formulario abaixo para compartilhar o contexto do pedido, o formato de clearance e os materiais de apoio com a equipe da Atabaque.\n\nSe precisar pausar, voce pode salvar o rascunho e continuar depois pelo link enviado ao e-mail informado.",
      logoUrl: "/atabaque-mark.svg",
      bannerUrl: "",
      brandWordmark: "",
      supportLogoUrl: "/favicon.ico",
      supportLogoAlt: "Sunbeat",
      supportLabel: "Powered by Sunbeat",
      highlights: [],
    },
    steps: [
      {
        key: "intro",
        title: "Introducao",
        description: "Comece o preenchimento.",
        fields: [],
      },
      {
        key: "requester_identification",
        title: "Solicitante",
        description: "Dados do contato responsavel por este pedido.",
        fields: [
          {
            key: "requester_name",
            label: "Nome do solicitante",
            type: "text",
            placeholder: "Nome completo do responsavel",
            helperText:
              "Este contato sera usado para rascunho, edicoes e continuidade do fluxo.",
            required: true,
          },
          {
            key: "requester_email",
            label: "E-mail do solicitante",
            type: "email",
            placeholder: "nome@empresa.com",
            helperText:
              "Usaremos este e-mail para salvar o rascunho e enviar o link de edicao depois do submit.",
            required: true,
          },
          {
            key: "requester_company",
            label: "Empresa do solicitante",
            type: "text",
            placeholder: "Nome da empresa responsavel pelo pedido",
            required: true,
          },
          {
            key: "requester_role",
            label: "Cargo ou papel no projeto",
            type: "text",
            placeholder: "Ex.: juridico, A&R, producao executiva, atendimento",
            required: true,
          },
        ],
      },
      {
        key: "request_type",
        title: "Formato do pedido",
        description:
          "Escolha a natureza do pedido para abrir a trilha correta dentro do workflow.",
        fields: [
          {
            key: "clearance_format",
            label: "Qual formato de rights clearance voce precisa preencher?",
            type: "select",
            options: clearanceFormatOptions,
            helperText:
              "Isso define quais campos operacionais aparecerao nas etapas seguintes.",
            required: true,
          },
        ],
      },
      {
        key: "project_context",
        title: "Contexto do projeto",
        description: "Informacoes comuns ao pedido de clearance.",
        fields: [
          {
            key: "project_title",
            label: "Titulo do projeto",
            type: "text",
            placeholder: "Nome do projeto, campanha, clipe ou acao",
            required: true,
          },
          {
            key: "responsible_company",
            label: "Empresa responsavel pelo projeto",
            type: "text",
            placeholder: "Nome da produtora, gravadora, agencia ou cliente",
            required: true,
          },
          {
            key: "client_or_distributor",
            label: "Cliente, distribuidora ou parceiro operacional",
            type: "text",
            placeholder: "Nome do cliente, distribuidora ou parceiro",
            required: true,
          },
          {
            key: "release_or_start_date",
            label: "Data prevista de inicio ou lancamento",
            type: "date",
            helperText:
              "Informe a data prevista de veiculacao, lancamento ou ativacao.",
            required: true,
          },
          {
            key: "release_type",
            label: "Tipo de lancamento",
            type: "select",
            options: [
              { label: "Selecione", value: "" },
              { label: "Single", value: "single" },
              { label: "EP", value: "ep" },
              { label: "Album", value: "album" },
            ],
            required: false,
          },
          {
            key: "project_synopsis",
            label: "Sinopse ou contexto do pedido",
            type: "textarea",
            placeholder: "Descreva o projeto e o uso pretendido.",
            required: true,
          },
          {
            key: "has_brand_association",
            label: "Existe associacao com marca, campanha ou contexto comercial?",
            type: "select",
            options: yesNoOptions,
            required: true,
          },
          {
            key: "brand_context",
            label: "Marca ou contexto associado",
            type: "textarea",
            placeholder: "Descreva a marca, campanha ou contexto comercial.",
            required: false,
          },
          {
            key: "general_clearance_notes",
            label: "Observacoes gerais de clearance",
            type: "textarea",
            placeholder: "Contexto geral, urgencia, pendencias ou observacoes para o time.",
            required: false,
          },
        ],
      },
      {
        key: "tracks",
        title: "Faixas",
        description:
          "Liste as faixas do projeto com os dados essenciais para alimentar a base.",
        fields: [],
      },
      {
        key: "clearance_scope",
        title: "Escopo de clearance",
        description:
          "Detalhes da musica e do uso pretendido, variando conforme o formato escolhido.",
        fields: [
          {
            key: "music_title",
            label: "Titulo da musica",
            type: "text",
            placeholder: "Nome da obra ou fonograma",
            required: true,
          },
          {
            key: "artist_name",
            label: "Artista principal",
            type: "text",
            placeholder: "Nome do artista ou interprete",
            required: true,
          },
          {
            key: "phonogram_owner",
            label: "Titular do fonograma",
            type: "text",
            placeholder: "Quem controla o master / fonograma",
            required: true,
          },
          {
            key: "territory",
            label: "Territorio",
            type: "text",
            placeholder: "Ex.: Brasil, America Latina, mundo",
            required: true,
          },
          {
            key: "licensing_period",
            label: "Periodo de licenciamento",
            type: "text",
            placeholder: "Ex.: 3 meses, 1 ano, perpetuo",
            required: true,
          },
          {
            key: "composer_author_info",
            label: "Compositores e autores",
            type: "textarea",
            placeholder: "Liste compositores, autores e percentuais se houver.",
            required: true,
          },
          {
            key: "publisher_info",
            label: "Editoras ou publishing",
            type: "textarea",
            placeholder: "Informe editoras, contatos ou observacoes de publishing.",
            required: true,
          },
          {
            key: "material_type",
            label: "Tipo de material solicitado",
            type: "text",
            placeholder: "Ex.: master, editorial, nome, imagem",
            required: true,
          },
          {
            key: "intended_use",
            label: "Uso pretendido",
            type: "textarea",
            placeholder: "Descreva como a musica sera usada no projeto musical.",
            required: true,
          },
          {
            key: "exclusivity",
            label: "Existe pedido de exclusividade?",
            type: "select",
            options: yesNoOptions,
            required: true,
          },
          {
            key: "audiovisual_type",
            label: "Tipo de audiovisual ou produto",
            type: "text",
            placeholder: "Ex.: videoclipe, campanha, branded content, filme",
            required: true,
          },
          {
            key: "director_name",
            label: "Direcao",
            type: "text",
            placeholder: "Nome do diretor ou responsavel criativo",
            required: true,
          },
          {
            key: "product_or_campaign_name",
            label: "Produto, campanha ou peca",
            type: "text",
            placeholder: "Nome do produto, campanha ou entrega audiovisual",
            required: true,
          },
          {
            key: "scene_description",
            label: "Descricao da cena ou da aplicacao",
            type: "textarea",
            placeholder: "Explique como a musica sera usada no audiovisual.",
            required: true,
          },
          {
            key: "sync_duration",
            label: "Duracao de sync",
            type: "text",
            placeholder: "Ex.: 15 segundos, 30 segundos, uso integral",
            required: true,
          },
          {
            key: "media_channels",
            label: "Canais e meios de veiculacao",
            type: "textarea",
            placeholder: "TV, YouTube, streaming, redes sociais, cinema, OOH, etc.",
            required: true,
          },
        ],
      },
      {
        key: "assets_references",
        title: "Assets e referencias",
        description: "Arquivos, links e observacoes de apoio.",
        fields: [
          {
            key: "supporting_files",
            label: "Arquivos de apoio",
            type: "file",
            helperText:
              "Anexe briefs, roteiros, cortes, contratos ou outros materiais de apoio.",
            required: false,
          },
          {
            key: "reference_links",
            label: "Links de referencia",
            type: "textarea",
            placeholder: "Cole um ou mais links relevantes para a analise.",
            required: false,
          },
          {
            key: "additional_notes",
            label: "Observacoes adicionais",
            type: "textarea",
            placeholder: "Acrescente instrucoes, contexto ou pendencias.",
            required: false,
          },
        ],
      },
      {
        key: "review_submit",
        title: "Revisao e envio",
        description: "Revise os dados antes de concluir.",
        fields: [],
      },
    ],
  };
}

export const rightsClearanceTemplate = createRightsClearanceTemplate();

export function createEmptyRightsClearanceTrack(
  orderNumber = 1
): RightsClearanceTrackValues {
  return {
    local_id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `rights-track-${Date.now()}-${orderNumber}`,
    order_number: orderNumber,
    title: "",
    primary_artists: "",
    authors: "",
    publishers: "",
    phonogram_owner: "",
    has_isrc: "",
    isrc_code: "",
    notes_for_clearance: "",
  };
}

export function createInitialRightsClearanceValues(args?: {
  defaultFormat?: ClearanceFormat | "";
}): RightsClearanceFormValues {
  const defaultFormat = args?.defaultFormat ?? "";
  return {
    requester_identification: {
      requester_name: "",
      requester_email: "",
      requester_company: "",
      requester_role: "",
    },
    request_type: {
      clearance_format: defaultFormat,
    },
    project_context: {
      project_title: "",
      responsible_company: "",
      client_or_distributor: "",
      release_or_start_date: "",
      release_type: "",
      project_synopsis: "",
      has_brand_association: "",
      brand_context: "",
      general_clearance_notes: "",
    },
    tracks:
      defaultFormat === "music_release_clearance_intake"
        ? [createEmptyRightsClearanceTrack(1)]
        : [],
    clearance_scope: {
      music_title: "",
      artist_name: "",
      phonogram_owner: "",
      territory: "",
      licensing_period: "",
      composer_author_info: "",
      publisher_info: "",
      material_type: "",
      intended_use: "",
      exclusivity: "",
      audiovisual_type: "",
      director_name: "",
      product_or_campaign_name: "",
      scene_description: "",
      sync_duration: "",
      media_channels: "",
    },
    assets_references: {
      supporting_files: [],
      reference_links: "",
      additional_notes: "",
    },
  };
}
