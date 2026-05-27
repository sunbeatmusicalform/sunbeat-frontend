import type { FormSchema } from "./types";

export const releaseIntakeSchema = {
  id: "release_intake_redesign_candidate",
  version: "0.1.0",
  workflowType: "release_intake",
  title: "Release intake candidate",
  description:
    "Preview schema for the redesigned four-step release intake. This is not the active Atabaque runtime.",
  modeLabel: "Schema preview only",
  steps: [
    {
      id: "project",
      label: "Projeto",
      title: "Projeto",
      description:
        "Dados principais do lancamento, contato do submitter e contexto editorial.",
      aiSignals: [
        {
          id: "artist-match",
          tone: "ai",
          title: "Artista provavel ja existe no cadastro",
          summary:
            "O nome informado parece corresponder a um artista recorrente. Confirme manualmente antes de qualquer acao irreversivel.",
          recommendation: "Usar como sugestao visual; nenhum cadastro real e consultado.",
          fieldKey: "primary_artist",
          blocking: "none",
          validationState: "pending",
          confidence: 0.84,
          allowedActions: ["suggest", "explain"],
          match: {
            title: "Lucas Martins",
            subtitle: "3 lancamentos mockados no historico do prototipo",
            initials: "LM",
          },
          actions: [
            { label: "Usar este", kind: "disabled_preview" },
            { label: "Ignorar", kind: "disabled_preview" },
          ],
        },
        {
          id: "date-conflict",
          tone: "warn",
          title: "Outro lancamento proximo da data escolhida",
          summary:
            "Existe um conflito de calendario mockado sete dias antes. E um aviso de marketing, nao um bloqueio.",
          fieldKey: "release_date",
          blocking: "none",
          validationState: "warning",
          allowedActions: ["validate", "explain"],
          actions: [
            { label: "Ver calendario", kind: "disabled_preview" },
            { label: "Manter mesmo assim", kind: "disabled_preview" },
          ],
        },
      ],
      fields: [
        {
          key: "submitter_name",
          label: "Nome de quem envia",
          kind: "text",
          required: true,
          placeholder: "Nome completo",
          validation: [
            {
              id: "submitter-name-required",
              type: "required",
              message: "Informe o nome do submitter.",
            },
          ],
          validationState: "valid",
        },
        {
          key: "submitter_email",
          label: "E-mail de contato",
          kind: "text",
          required: true,
          placeholder: "contato@example.com",
          helperText: "Usado apenas como mock neste preview.",
          validationState: "valid",
        },
        {
          key: "project_title",
          label: "Titulo do lancamento",
          kind: "text",
          required: true,
          placeholder: "Nome do single, EP ou album",
          validationState: "valid",
        },
        {
          key: "primary_artist",
          label: "Artista principal",
          kind: "text",
          required: true,
          placeholder: "Nome artistico",
          helperText:
            "O preview mostra uma sugestao de artista existente sem consultar API real.",
          validationState: "pending",
          aiSignals: [
            {
              id: "artist-match-inline",
              tone: "ai",
              title: "Possivel artista existente",
              summary:
                "Sinal mockado inspirado no handoff: a IA sugere, mas o humano decide.",
              fieldKey: "primary_artist",
              blocking: "none",
              validationState: "pending",
              confidence: 0.84,
              allowedActions: ["suggest"],
              match: {
                title: "Lucas Martins",
                subtitle: "Perfil de exemplo",
                initials: "LM",
              },
            },
          ],
        },
        {
          key: "release_type",
          label: "Tipo",
          kind: "select",
          required: true,
          options: [
            { label: "Single", value: "single" },
            { label: "EP", value: "ep" },
            { label: "Album", value: "album" },
          ],
          validationState: "valid",
        },
        {
          key: "release_date",
          label: "Data prevista",
          kind: "date",
          required: true,
          helperText: "Conflitos de calendario aparecem como warning visual.",
          validationState: "warning",
          aiSignals: [
            {
              id: "date-conflict-inline",
              tone: "warn",
              title: "Data proxima de outro lancamento",
              summary:
                "Aviso nao bloqueante do Claude Design. O preview nao consulta calendario real.",
              fieldKey: "release_date",
              blocking: "none",
              validationState: "warning",
            },
          ],
        },
        {
          key: "genre",
          label: "Genero",
          kind: "text",
          placeholder: "Ex.: Pagodao, MPB, Funk",
          helperText: "Campo editorial opcional para triagem.",
        },
        {
          key: "tiktok_snippet",
          label: "Trecho para TikTok",
          kind: "text",
          placeholder: "Ex.: 00:48 ate 01:18",
          helperText: "Campo preservado no adapter; nao aciona runtime real.",
        },
        {
          key: "has_video_asset",
          label: "Tem videoclipe?",
          kind: "select",
          options: [
            { label: "Sim", value: "yes" },
            { label: "Nao", value: "no" },
          ],
          helperText:
            "Condicionalidade fica como TODO do renderer; engine v0 nao suporta visibleWhen.",
        },
        {
          key: "video_link",
          label: "Link do video",
          kind: "text",
          placeholder: "https://...",
          helperText:
            "Campo sempre presente no schema v0; renderer futuro pode condicionar por has_video_asset.",
        },
        {
          key: "video_release_date",
          label: "Data/hora do video",
          kind: "text",
          placeholder: "2026-08-12T19:00",
          helperText:
            "Datetime preservado como texto no v0 porque FieldKind ainda nao tem datetime-local.",
        },
        {
          key: "project_notes",
          label: "Detalhes do projeto",
          kind: "textarea",
          placeholder: "Contexto, observacoes ou links importantes",
          helperText: "Nao aciona autosave real neste preview.",
        },
      ],
    },
    {
      id: "tracks",
      label: "Faixas",
      title: "Faixas",
      description:
        "Repeater visual com validacoes de ISRC, audio e creditos. Nenhum upload real e conectado.",
      alerts: [
        {
          id: "isrc-duplicate-alert",
          tone: "danger",
          title: "ISRC duplicado em faixa do mesmo projeto",
          summary:
            "O codigo BR-XYZ-25-00001 aparece em duas faixas mockadas. Cada faixa precisa de um codigo unico.",
          blocking: "hard_block",
          validationState: "invalid",
          scopeLabel: "Mesmo projeto - faixa 1",
          allowedActions: ["validate", "explain"],
          actions: [
            { label: "Ir para faixa 2", kind: "jump", targetStepId: "tracks" },
            { label: "Pedir novo ISRC", kind: "disabled_preview" },
          ],
        },
      ],
      fields: [
        {
          key: "tracks",
          label: "Lista de faixas",
          kind: "repeater",
          required: true,
          helperText:
            "Renderizacao visual simples do repeater v0; edicao profunda fica fora desta fase.",
          validationState: "invalid",
          blocking: "hard_block",
          statusLabel: "1 bloqueio",
          fields: [
            { key: "title", label: "Titulo", kind: "text", required: true },
            { key: "duration", label: "Duracao", kind: "text" },
            {
              key: "primary_artists",
              label: "Artista(s) principal(is)",
              kind: "text",
              required: true,
            },
            { key: "featured_artists", label: "Feat.", kind: "text" },
            { key: "interpreters", label: "Interpretes", kind: "text" },
            { key: "isrc_code", label: "ISRC", kind: "text" },
            { key: "authors", label: "Autores", kind: "textarea" },
            { key: "publishers", label: "Editoras", kind: "text" },
            {
              key: "producers_musicians",
              label: "Produtores / musicos",
              kind: "text",
            },
            {
              key: "phonographic_producer",
              label: "Produtor fonografico",
              kind: "text",
            },
            {
              key: "has_isrc",
              label: "Ja tem ISRC?",
              kind: "select",
              options: [
                { label: "Sim", value: "yes" },
                { label: "Nao", value: "no" },
              ],
            },
            {
              key: "explicit_content",
              label: "Conteudo explicito",
              kind: "select",
              options: [
                { label: "Sim", value: "yes" },
                { label: "Nao", value: "no" },
              ],
            },
            {
              key: "audio_file",
              label: "Arquivo WAV",
              kind: "upload",
              helperText:
                "Visual-only ate upload parity; o patch do draft adapter nao envia este campo.",
              statusLabel: "Visual-only",
              uploadSpec: {
                acceptLabel: "WAV",
                maxSizeLabel: "Mock metadata only",
              },
            },
            {
              key: "validations",
              label: "Validacoes derivadas",
              kind: "review",
              helperText:
                "Computed no adapter: inclui isrc_duplicate, audio_missing e creditos.",
              statusLabel: "Computed",
            },
          ],
          aiSignals: [
            {
              id: "collab-suggestion",
              tone: "ai",
              title: "Colaborador frequente",
              summary:
                "A editora Atabaque Edicoes aparece como sugestao mockada para uma faixa, sem alterar os dados.",
              blocking: "none",
              validationState: "pending",
              confidence: 0.78,
              allowedActions: ["suggest"],
            },
          ],
        },
      ],
    },
    {
      id: "assets",
      label: "Capa & assets",
      title: "Capa & assets",
      description:
        "Uploads display-only para capa, masters e materiais opcionais. O preview nao envia arquivos.",
      alerts: [
        {
          id: "cover-spec-blocker",
          tone: "danger",
          title: "Capa abaixo da especificacao",
          summary:
            "Arquivo mockado esta em 1500x1500. O minimo do redesign e 3000x3000, entao o submit fica bloqueado.",
          blocking: "hard_block",
          validationState: "invalid",
          allowedActions: ["validate", "explain"],
          actions: [
            { label: "Pedir nova capa", kind: "disabled_preview" },
          ],
        },
        {
          id: "presskit-missing",
          tone: "warn",
          title: "Presskit nao enviado",
          summary:
            "Aviso leve: nao bloqueia o envio, mas pode gerar follow-up operacional.",
          blocking: "none",
          validationState: "warning",
        },
      ],
      fields: [
        {
          key: "cover_file",
          label: "Arquivo de capa",
          kind: "upload",
          required: true,
          helperText:
            "DropZone mock-only. Sem input de arquivo e sem endpoint de upload.",
          validationState: "invalid",
          blocking: "hard_block",
          statusLabel: "Bloqueio",
          uploadSpec: {
            acceptLabel: "PNG ou JPG",
            maxSizeLabel: "Mock limit: 25 MB",
            requiredSpecs: [
              {
                key: "resolution",
                label: "Resolucao",
                value: "1500x1500",
                required: "min 3000x3000",
                tone: "danger",
                blocking: "hard_block",
              },
              {
                key: "format",
                label: "Formato",
                value: "PNG",
                required: "PNG ou JPG",
                tone: "success",
                blocking: "none",
              },
              {
                key: "color",
                label: "Perfil de cor",
                value: "sRGB",
                required: "sRGB",
                tone: "success",
                blocking: "none",
              },
              {
                key: "weight",
                label: "Peso",
                value: "3 MB",
                required: "ate 25 MB",
                tone: "success",
                blocking: "none",
              },
              {
                key: "readability",
                label: "Legibilidade",
                value: "ilegivel em 64px",
                required: "titulo legivel",
                tone: "warn",
                blocking: "soft_block",
              },
            ],
          },
        },
        {
          key: "promo_assets_link",
          label: "Pasta de divulgacao",
          kind: "text",
          placeholder: "https://...",
          helperText: "Link opcional, armazenado apenas no estado local.",
          validationState: "valid",
        },
        {
          key: "cover_link",
          label: "Link externo da capa",
          kind: "text",
          placeholder: "https://...",
          helperText:
            "Fallback de link preservado no adapter; nao altera upload real.",
        },
        {
          key: "presskit_link",
          label: "Link do presskit",
          kind: "text",
          placeholder: "https://...",
          helperText:
            "URL/string preservada no round-trip; string vazia significa ausente.",
          validationState: "warning",
          aiSignals: [
            {
              id: "presskit-missing-inline",
              tone: "warn",
              title: "Presskit pendente",
              summary:
                "Nao bloqueia, mas o time pode solicitar manualmente depois.",
              blocking: "none",
              validationState: "warning",
            },
          ],
        },
        {
          key: "cover_specs",
          label: "Specs da capa",
          kind: "review",
          helperText:
            "Computed visual-only a partir de width, height, dpi e status da capa.",
          validationState: "invalid",
          blocking: "hard_block",
          statusLabel: "Computed",
        },
      ],
    },
    {
      id: "review",
      label: "Revisao",
      title: "Revisao",
      description:
        "Resumo final com bloqueios, avisos, OKs e acoes que ficariam pendentes no runtime real.",
      fields: [
        {
          key: "review",
          label: "Resumo de pre-submit",
          kind: "review",
          helperText:
            "Submit real fica desabilitado: este renderer opera somente em modo preview.",
          validationState: "invalid",
          blocking: "hard_block",
        },
      ],
    },
  ],
  auditHints: [
    {
      id: "audit-airtable",
      key: "airtable",
      label: "Airtable",
      status: "not_synced",
      blocking: "human_required",
      summary:
        "No runtime real criaria registros operacionais. Neste preview nada e chamado.",
      evidence: "Static schema metadata only.",
    },
    {
      id: "audit-drive",
      key: "google_drive",
      label: "Google Drive",
      status: "not_synced",
      blocking: "none",
      summary:
        "No runtime real organizaria arquivos. Neste preview nao ha upload.",
      evidence: "DropZone is display-only.",
    },
    {
      id: "audit-email",
      key: "email",
      label: "Email",
      status: "not_configured",
      blocking: "none",
      summary:
        "No runtime real enviaria confirmacao. Neste preview nao ha endpoint.",
      evidence: "No fetch, action or API route imported.",
    },
    {
      id: "audit-human-review",
      key: "human_review",
      label: "Human review",
      status: "queued",
      blocking: "human_required",
      summary:
        "Acoes irreversiveis continuam dependendo de aprovacao humana explicita.",
      evidence: "Preview submit is disabled.",
    },
  ],
} satisfies FormSchema;

