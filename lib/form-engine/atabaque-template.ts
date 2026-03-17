import type { ReleaseIntakeFormValues, ReleaseIntakeTemplate } from "./types";
import { createEmptyTrack } from "./track-types";

const yesNoOptions = [
  { label: "Selecione", value: "" },
  { label: "Sim", value: "yes" },
  { label: "N\u00e3o", value: "no" },
];

export const atabaqueTemplate: ReleaseIntakeTemplate = {
  id: "atabaque-release-intake",
  workspaceSlug: "atabaque",
  version: 6,
  slogan: "",
  successMessage:
    "Recebemos seu envio com sucesso. O time da Atabaque dar\u00e1 continuidade ao fluxo operacional.",
  intro: {
    clientName: "Atabaque",
    formTitle: "Formul\u00e1rio de lan\u00e7amento",
    introText:
      "Preencha os dados do lan\u00e7amento e envie as informa\u00e7\u00f5es para a equipe da Atabaque.\n\nSe precisar interromper, voc\u00ea pode salvar o rascunho e continuar depois pelo link enviado ao e-mail informado.",
    logoUrl: "/atabaque.png",
    bannerUrl: "",
    brandWordmark: "",
    supportLogoUrl: "/favicon.ico",
    supportLogoAlt: "Sunbeat",
    supportLabel: "Powered by Sunbeat",
    highlights: [
      "Confiabilidade",
      "Tecnologia",
      "Confianca",
    ],
  },
  steps: [
    {
      key: "intro",
      title: "Introdu\u00e7\u00e3o",
      description: "Comece o preenchimento.",
      fields: [],
    },
    {
      key: "identification",
      title: "Identifica\u00e7\u00e3o",
      description: "Dados do respons\u00e1vel e do projeto.",
      fields: [
        {
          key: "submitter_name",
          label: "Quem est\u00e1 respondendo este formul\u00e1rio?",
          type: "text",
          placeholder: "Nome completo do respons\u00e1vel",
          helperText:
            "Este ser\u00e1 o contato principal para rascunho, confirma\u00e7\u00e3o e pr\u00f3ximos passos.",
          required: true,
        },
        {
          key: "submitter_email",
          label: "Seu e-mail",
          type: "email",
          placeholder: "nome@empresa.com",
          helperText:
            "Usaremos este e-mail para salvar o rascunho e enviar o link de edi\u00e7\u00e3o depois do submit.",
          required: true,
        },
        {
          key: "project_title",
          label: "Nome do Projeto: (T\u00edtulo do Single/EP/\u00c1lbum)",
          type: "text",
          placeholder: "Digite o nome comercial do projeto",
          helperText: "",
          required: true,
        },
        {
          key: "release_type",
          label: "Tipo de Lan\u00e7amento",
          type: "select",
          helperText: "",
          required: true,
          options: [
            { label: "Selecione", value: "" },
            { label: "Single", value: "single" },
            { label: "EP", value: "ep" },
            { label: "\u00c1lbum", value: "album" },
          ],
        },
      ],
    },
    {
      key: "release",
      title: "Projeto",
      description: "Dados principais do lan\u00e7amento.",
      fields: [
        {
          key: "release_date",
          label: "Data de Lan\u00e7amento",
          type: "date",
          helperText:
            "Selecione a data prevista para o lan\u00e7amento. Apenas datas a partir de hoje ficam dispon\u00edveis.",
          required: true,
        },
        {
          key: "cover_file",
          label: "Anexe aqui a capa do projeto (3000x3000)",
          type: "file",
          helperText:
            "Envie a capa final em alta qualidade. Se preferir, voc\u00ea tamb\u00e9m pode usar o campo de link da capa.",
          required: false,
        },
        {
          key: "cover_link",
          label: "Ou coloque aqui o link do arquivo da capa (3000x3000)",
          type: "url",
          placeholder: "https://...",
          helperText: "",
          required: false,
        },
        {
          key: "genre",
          label: "G\u00eanero Musical",
          type: "text",
          placeholder: "Ex.: Pagod\u00e3o, Trap, MPB, Funk",
          helperText: "Ex.: Pop, Trap, Funk, MPB, Forr\u00f3, Gospel.",
          required: false,
        },
        {
          key: "has_video_asset",
          label: "Tem Videoclipe, Lyric ou Visualizer?",
          type: "select",
          helperText: "",
          required: false,
          options: yesNoOptions,
        },
        {
          key: "video_link",
          label: "Link do Videoclipe / Lyric / Visualizer",
          type: "url",
          placeholder: "https://...",
          helperText:
            "Se o material j\u00e1 estiver publicado ou em preview, compartilhe o link aqui.",
          required: false,
        },
        {
          key: "video_release_date",
          label: "Qual a data de lan\u00e7amento do v\u00eddeo?",
          type: "datetime-local",
          helperText:
            "Se existir v\u00eddeo confirmado, informe a data e o hor\u00e1rio previstos.",
          required: false,
        },
        {
          key: "promo_assets_link",
          label: "Link com Fotos e Arquivos de Divulga\u00e7\u00e3o",
          type: "url",
          placeholder: "https://...",
          helperText:
            "Caso j\u00e1 tenham arquivos ou fotos de divulga\u00e7\u00e3o, voc\u00ea pode compartilhar aqui o link para download.",
          required: false,
        },
        {
          key: "presskit_link",
          label: "Link do Presskit",
          type: "url",
          placeholder: "https://...",
          helperText: "",
          required: false,
        },
        {
          key: "tiktok_snippet",
          label: "Trecho do TikTok - Minutagem",
          type: "text",
          placeholder: "Ex.: 00:45 at\u00e9 01:15",
          helperText:
            "Especifique em qual trecho inicial os 30 segundos do TikTok devem come\u00e7ar.",
          required: false,
        },
        {
          key: "explicit_content",
          label: "Conte\u00fado Expl\u00edcito? (+18)",
          type: "select",
          helperText: "",
          required: false,
          options: yesNoOptions,
        },
      ],
    },
    {
      key: "tracks",
      title: "Faixas",
      description: "Metadados das faixas.",
      fields: [],
    },
    {
      key: "marketing",
      title: "Marketing",
      description: "Informa\u00e7\u00f5es complementares.",
      fields: [
        {
          key: "marketing_numbers",
          label:
            "Tem n\u00fameros ou fatos importantes que identifiquem os integrantes no lan\u00e7amento?",
          type: "textarea",
          placeholder: "",
          helperText:
            "Exemplo: J\u00e1 produziu nomes como XXX; j\u00e1 comp\u00f4s v\u00e1rios hits do Top 200; etc.",
          required: false,
        },
        {
          key: "marketing_focus",
          label: "Qual o foco do artista e do lan\u00e7amento?",
          type: "textarea",
          placeholder: "",
          helperText:
            "Ex.: aumentar ouvintes mensais, vender mais show, vender mais publi ou aproximar dos f\u00e3s.",
          required: false,
        },
        {
          key: "marketing_objectives",
          label: "Quais s\u00e3o os objetivos do lan\u00e7amento?",
          type: "textarea",
          placeholder: "",
          helperText: "",
          required: false,
        },
        {
          key: "has_marketing_budget",
          label: "Tem verba para promo\u00e7\u00e3o?",
          type: "select",
          helperText: "",
          required: false,
          options: yesNoOptions,
        },
        {
          key: "marketing_budget",
          label: "Qual a verba de promo\u00e7\u00e3o?",
          type: "text",
          placeholder: "Ex.: R$ 2.000",
          helperText: "",
          required: false,
        },
        {
          key: "focus_track_name",
          label: "[EP ou \u00c1lbum] Qual a faixa foco?",
          type: "text",
          placeholder: "",
          helperText: "",
          required: false,
        },
        {
          key: "date_flexibility",
          label: "Tem espa\u00e7o pra mudar data de lan\u00e7amento?",
          type: "text",
          placeholder: "",
          helperText: "",
          required: false,
        },
        {
          key: "has_special_guests",
          label:
            "Este lan\u00e7amento tem Participa\u00e7\u00f5es Especiais de outros Artistas?",
          type: "select",
          helperText: "",
          required: false,
          options: yesNoOptions,
        },
        {
          key: "special_guests_bio",
          label: "Mini biografia das participa\u00e7\u00f5es",
          type: "textarea",
          placeholder: "",
          helperText:
            "Conte um pouco sobre os feats ou participa\u00e7\u00f5es especiais que precisam entrar no planejamento.",
          required: false,
        },
        {
          key: "feat_will_promote",
          label: "Feat participar\u00e1 da divulga\u00e7\u00e3o?",
          type: "select",
          helperText: "",
          required: false,
          options: yesNoOptions,
        },
        {
          key: "promotion_participants",
          label:
            "Participantes na promo\u00e7\u00e3o do lan\u00e7amento? (Influenciadores, marcas e parceiros)",
          type: "text",
          placeholder: "",
          helperText: "",
          required: false,
        },
        {
          key: "influencers_brands_partners",
          label: "Influenciadores / Marcas / Parceiros",
          type: "textarea",
          placeholder: "",
          helperText: "",
          required: false,
        },
        {
          key: "general_notes",
          label: "Observa\u00e7\u00f5es e Arquivos Adicionais (Opcional)",
          type: "textarea",
          placeholder: "",
          helperText:
            "Sinta-se \u00e0 vontade para adicionar quaisquer outras observa\u00e7\u00f5es relevantes sobre este projeto.",
          required: false,
        },
        {
          key: "additional_files",
          label: "Arquivos e documentos adicionais",
          type: "file",
          helperText:
            "Se quiser, envie aqui materiais extras para apoiar a opera\u00e7\u00e3o e o marketing.",
          required: false,
        },
      ],
    },
    {
      key: "review_submit",
      title: "Revis\u00e3o",
      description: "Revise e envie.",
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
      cover_link: "",
      promo_assets_link: "",
      presskit_link: "",
      has_video_asset: "",
      video_link: "",
      video_release_date: "",
      cover_file: null,
    },
    tracks: [createEmptyTrack(1)],
    marketing: {
      marketing_numbers: "",
      marketing_focus: "",
      marketing_objectives: "",
      has_marketing_budget: "",
      marketing_budget: "",
      focus_track_name: "",
      date_flexibility: "",
      has_special_guests: "",
      special_guests_bio: "",
      feat_will_promote: "",
      promotion_participants: "",
      influencers_brands_partners: "",
      general_notes: "",
      additional_files: [],
    },
  };
}
