import type { ReleaseIntakeTemplate, ReleaseIntakeFormValues } from "./types";

export const atabaqueTemplate: ReleaseIntakeTemplate = {
  id: "atabaque-release-intake-v1",
  version: 1,
  workspaceSlug: "atabaque",
  slogan: "Shine Brighter, Work Smarter.",
  successMessage:
    "Seu envio foi recebido com sucesso. Em breve o time da Atabaque dará continuidade ao fluxo operacional e você também receberá um email com resumo e link de edição.",
  intro: {
    clientName: "Atabaque",
    formTitle: "Novas Músicas - Atabaque",
    introText:
      "Cada resposta que você fornecer é crucial para o sucesso do projeto. Suas informações nos ajudam a cuidar de todos os detalhes operacionais, desde a criação até o lançamento. Preencha com atenção e, se precisar, use os textos de apoio ao longo do formulário.",
    logoUrl: "/clients/atabaque/logo.png",
    bannerUrl: "/clients/atabaque/banner.png",
  },
  steps: [
    {
      key: "intro",
      title: "Intro",
      description: "Apresentação do cliente e contexto do formulário.",
      fields: [],
    },
    {
      key: "identification",
      title: "Identificação",
      description: "Quem está preenchendo e qual projeto será enviado.",
      fields: [
        {
          key: "submitter_name",
          type: "text",
          label: "Seu nome",
          required: true,
          helperText:
            "Informe o nome da pessoa responsável pelo preenchimento deste formulário.",
          placeholder: "Digite seu nome",
        },
        {
          key: "submitter_email",
          type: "email",
          label: "Seu e-mail",
          required: true,
          helperText:
            "Esse e-mail será usado para salvar rascunho e enviar o link de edição após o submit.",
          placeholder: "voce@empresa.com",
        },
        {
          key: "project_title",
          type: "text",
          label: "Título do projeto",
          required: true,
          helperText:
            "Digite o nome do lançamento exatamente como ele deve ser tratado na operação.",
          placeholder: "Ex.: Nome do single, EP ou álbum",
        },
        {
          key: "release_type",
          type: "select",
          label: "Tipo de lançamento",
          required: true,
          helperText: "Selecione se o projeto é um single, EP ou álbum.",
          options: [
            { label: "Single", value: "single" },
            { label: "EP", value: "ep" },
            { label: "Álbum", value: "album" },
          ],
        },
      ],
    },
    {
      key: "project",
      title: "Projeto",
      description: "Detalhes do projeto musical, capa e faixas.",
      fields: [
        {
          key: "release_date",
          type: "date",
          label: "Data de lançamento",
          required: true,
          helperText: "Informe a data prevista de lançamento do projeto.",
        },
        {
          key: "genre",
          type: "text",
          label: "Gênero musical",
          required: true,
          helperText: "Use o gênero principal que melhor representa o lançamento.",
          placeholder: "Ex.: Pop, Trap, Forró, Funk, MPB",
        },
        {
          key: "explicit_content",
          type: "select",
          label: "Conteúdo explícito? (+18)",
          required: true,
          options: [
            { label: "Sim", value: "yes" },
            { label: "Não", value: "no" },
          ],
        },
        {
          key: "tiktok_snippet",
          type: "text",
          label: "Trecho do TikTok / Minutagem",
          helperText:
            "Especifique em qual trecho se inicia o recorte de 30 segundos do TikTok.",
          placeholder: "Ex.: inicia em 00:45",
        },
        {
          key: "presskit_link",
          type: "url",
          label: "Link com fotos e arquivos de divulgação",
          helperText:
            "Caso já tenham arquivos ou fotos de divulgação, compartilhe neste campo o link para download.",
          placeholder: "https://...",
        },
        {
          key: "has_video_asset",
          type: "select",
          label: "Tem videoclipe, lyric ou visualizer?",
          required: true,
          options: [
            { label: "Sim", value: "yes" },
            { label: "Não", value: "no" },
            { label: "Ainda não sei", value: "unknown" },
          ],
        },
        {
          key: "cover_file",
          type: "file",
          label: "Capa do projeto",
          required: true,
          helperText: "Envie a capa do lançamento. Idealmente em 3000x3000.",
        },
      ],
    },
    {
      key: "marketing",
      title: "Marketing",
      description: "Contexto estratégico do lançamento e observações.",
      fields: [
        {
          key: "marketing_numbers",
          type: "textarea",
          label:
            "Tem números ou fatos importantes que identifiquem os integrantes no lançamento?",
          required: true,
          helperText:
            "Ex.: já produziu nomes conhecidos, já tem hits relevantes, resultados expressivos ou fatos importantes.",
        },
        {
          key: "marketing_focus",
          type: "textarea",
          label: "Qual o foco do artista e do lançamento?",
          required: true,
          helperText:
            "Ex.: aumentar ouvintes mensais, vender mais shows, vender mais publi, aproximar dos fãs, compor grade de lançamento etc.",
        },
        {
          key: "marketing_objectives",
          type: "textarea",
          label: "Quais são os objetivos do lançamento?",
          required: true,
        },
        {
          key: "marketing_budget",
          type: "text",
          label: "Qual a verba de promoção?",
          placeholder: "Ex.: R$ 2.000",
        },
        {
          key: "focus_track_name",
          type: "text",
          label: "[EP ou Álbum] Qual a faixa foco?",
          helperText:
            "Se o projeto tiver mais de uma faixa, indique aqui a faixa prioritária.",
          placeholder: "Ex.: Track 3",
        },
        {
          key: "date_flexibility",
          type: "text",
          label: "Tem espaço pra mudar data de lançamento?",
          required: true,
          placeholder: "Ex.: sim, até 2 semanas / não / depende",
        },
        {
          key: "has_special_guests",
          type: "select",
          label: "Este lançamento tem participações especiais de outros artistas?",
          required: true,
          options: [
            { label: "Sim", value: "yes" },
            { label: "Não", value: "no" },
          ],
        },
        {
          key: "promotion_participants",
          type: "text",
          label:
            "Participantes da promoção do lançamento? (influenciadores, marcas e parceiros)",
          required: true,
          placeholder: "Ex.: creators, marcas parceiras, perfis, mídia",
        },
        {
          key: "lyrics",
          type: "textarea",
          label: "Letra da música",
          helperText:
            "Caso já tenha a letra da música, envie aqui digitada.",
        },
        {
          key: "general_notes",
          type: "textarea",
          label: "Observações adicionais",
          helperText:
            "Use este espaço para qualquer contexto importante que ajude a operação.",
        },
        {
          key: "additional_files",
          type: "file",
          label: "Arquivos adicionais",
          helperText: "Envie documentos, referências ou materiais complementares.",
        },
      ],
    },
    {
      key: "review_submit",
      title: "Revisão",
      description: "Revise tudo antes de enviar.",
      fields: [],
    },
  ],
};

export function createInitialReleaseIntakeValues(): ReleaseIntakeFormValues {
  return {
    identification: {
      submitter_name: "",
      submitter_email: "",
      project_title: "",
      release_type: "",
    },
    project: {
      release_date: "",
      genre: "",
      explicit_content: "",
      tiktok_snippet: "",
      presskit_link: "",
      has_video_asset: "",
      cover_file: null,
    },
    tracks: [],
    marketing: {
      marketing_numbers: "",
      marketing_focus: "",
      marketing_objectives: "",
      marketing_budget: "",
      focus_track_name: "",
      date_flexibility: "",
      has_special_guests: "",
      promotion_participants: "",
      lyrics: "",
      general_notes: "",
      additional_files: [],
    },
  };
}