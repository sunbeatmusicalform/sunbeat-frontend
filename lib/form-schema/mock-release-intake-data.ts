import type { SchemaReviewSummary, SchemaValueMap } from "./types";

export const mockReleaseIntakeValues = {
  submitter_name: "Ana Carvalho",
  submitter_email: "ana@example.test",
  project_title: "Cair na Folia",
  primary_artist: "Lucas Martins",
  release_type: "single",
  release_date: "2026-08-12",
  genre: "Pagodao",
  project_notes:
    "Demo sem dados sensiveis. Texto usado apenas para validar o renderer schema v0.",
  tracks: [
    {
      id: "t1",
      order: 1,
      title: "Cair na Folia",
      duration: "3:24",
      isrc_code: "BR-XYZ-25-00001",
      authors: "Lucas Martins, Bruno Cavalcanti",
      audio_file: "01_cair_na_folia_master_v3.wav",
      validations: {
        ok: ["audio_lufs", "title_match", "credits_present"],
        warn: [],
        err: [],
      },
    },
    {
      id: "t2",
      order: 2,
      title: "Pisada na Folia",
      duration: "3:48",
      isrc_code: "BR-XYZ-25-00001",
      authors: "Lucas Martins, Bia Souza, Bruno Cavalcanti",
      audio_file: null,
      validations: {
        ok: ["title_match", "credits_present"],
        warn: ["audio_missing"],
        err: ["isrc_duplicate"],
      },
    },
    {
      id: "t3",
      order: 3,
      title: "Tarde de Sol",
      duration: "2:58",
      isrc_code: "",
      authors: "Lucas Martins",
      audio_file: "03_tarde_de_sol_master_v1.wav",
      validations: {
        ok: ["audio_lufs", "credits_present"],
        warn: ["isrc_will_be_minted"],
        err: [],
      },
    },
  ],
  cover_file: {
    id: "cover-low",
    name: "capa_cair_na_folia_1500.png",
    meta: "1500x1500 - 3 MB - PNG",
    status: "invalid",
    statusLabel: "Abaixo do spec",
  },
  audio_files: [
    {
      id: "audio-1",
      name: "01_cair_na_folia_master_v3.wav",
      meta: "48 MB - WAV",
      status: "valid",
      statusLabel: "Validado",
    },
    {
      id: "audio-3",
      name: "03_tarde_de_sol_master_v1.wav",
      meta: "44 MB - WAV",
      status: "valid",
      statusLabel: "Validado",
    },
  ],
  promo_assets_link: "https://example.test/promo-pack",
  presskit_available: false,
  review: null,
} satisfies SchemaValueMap;

export const mockReleaseIntakeSummary = {
  headline: "Tudo certo, com 2 bloqueios antes do envio",
  counts: {
    blockers: 2,
    warnings: 2,
    ok: 5,
  },
  rows: [
    {
      tone: "danger",
      text: "ISRC duplicado na faixa 2 bloqueia a distribuicao.",
      targetStepId: "tracks",
    },
    {
      tone: "danger",
      text: "Capa 1500x1500 esta abaixo do minimo 3000x3000.",
      targetStepId: "assets",
    },
    {
      tone: "warn",
      text: "Conflito de calendario proximo da data escolhida.",
      targetStepId: "project",
    },
    {
      tone: "warn",
      text: "Presskit nao enviado; aviso leve, nao bloqueante.",
      targetStepId: "assets",
    },
    {
      tone: "success",
      text: "Projeto, genero e data principal estao preenchidos.",
      targetStepId: "project",
    },
    {
      tone: "success",
      text: "Duas faixas tem masters WAV mockados e creditos preenchidos.",
      targetStepId: "tracks",
    },
  ],
  nextSteps: [
    {
      key: "airtable",
      title: "Registrar dados operacionais",
      description:
        "No runtime real, registros seriam preparados para sync. Preview nao chama API.",
    },
    {
      key: "google_drive",
      title: "Organizar arquivos",
      description:
        "No runtime real, audio e capa seriam enviados para storage/Drive. Preview nao envia arquivos.",
    },
    {
      key: "email",
      title: "Notificar submitter e operacao",
      description:
        "No runtime real, emails seriam gerados. Preview nao usa Resend nem backend.",
    },
    {
      key: "human_review",
      title: "Aguardar aprovacao humana",
      description:
        "Acoes irreversiveis permanecem bloqueadas ate revisao humana explicita.",
    },
  ],
} satisfies SchemaReviewSummary;
