/* Dados simulados da operação Atabaque — protótipo da área do cliente (/portal).
   Estrutura pensada para depois virar fetch real: Airtable (2-way), Drive API, Resend webhooks. */

export type StageKey =
  | 'recebido' | 'em_analise' | 'ajustes' | 'aprovado' | 'agendado' | 'distribuido'

export const STAGES: { key: StageKey; label: string; color: string }[] = [
  { key: 'recebido', label: 'Recebido', color: '#329fd7' },
  { key: 'em_analise', label: 'Em análise', color: '#ffb53e' },
  { key: 'ajustes', label: 'Ajustes', color: '#ff5639' },
  { key: 'aprovado', label: 'Aprovado', color: '#16a34a' },
  { key: 'agendado', label: 'Agendado', color: '#7c3aed' },
  { key: 'distribuido', label: 'Distribuído', color: '#512314' },
]

export interface ReleaseRow {
  id: string
  project: string
  artist: string
  type: 'Single' | 'EP' | 'Álbum'
  genre: string
  stage: StageKey
  releaseDate: string
  segments: { from: string; to: string; stage: StageKey }[]
  tracks: number
  cover: 'ok' | 'pendente'
  audio: 'ok' | 'pendente'
  isrc: 'gerado' | 'a gerar'
}

export const RELEASES: ReleaseRow[] = [
  {
    id: 'rec-01', project: 'Ciranda Elétrica', artist: 'Alaíde Tropical', type: 'Single',
    genre: 'MPB', stage: 'agendado', releaseDate: '2026-08-21', tracks: 1,
    cover: 'ok', audio: 'ok', isrc: 'gerado',
    segments: [
      { from: '2026-07-14', to: '2026-07-16', stage: 'recebido' },
      { from: '2026-07-16', to: '2026-07-21', stage: 'em_analise' },
      { from: '2026-07-21', to: '2026-07-23', stage: 'ajustes' },
      { from: '2026-07-23', to: '2026-07-28', stage: 'aprovado' },
      { from: '2026-07-28', to: '2026-08-21', stage: 'agendado' },
    ],
  },
  {
    id: 'rec-02', project: 'Maré de Dentro', artist: 'Alaíde Tropical', type: 'Single',
    genre: 'MPB', stage: 'ajustes', releaseDate: '2026-09-11', tracks: 1,
    cover: 'ok', audio: 'ok', isrc: 'a gerar',
    segments: [
      { from: '2026-07-24', to: '2026-07-25', stage: 'recebido' },
      { from: '2026-07-25', to: '2026-07-28', stage: 'em_analise' },
      { from: '2026-07-28', to: '2026-08-02', stage: 'ajustes' },
    ],
  },
  {
    id: 'rec-03', project: 'Batuque Neon (EP)', artist: 'Zé Raminho', type: 'EP',
    genre: 'Eletrônica', stage: 'em_analise', releaseDate: '2026-10-02', tracks: 4,
    cover: 'pendente', audio: 'ok', isrc: 'a gerar',
    segments: [
      { from: '2026-07-27', to: '2026-07-28', stage: 'recebido' },
      { from: '2026-07-28', to: '2026-08-04', stage: 'em_analise' },
    ],
  },
  {
    id: 'rec-04', project: 'Sol de Julho', artist: 'Banda Farol', type: 'Single',
    genre: 'Pop', stage: 'distribuido', releaseDate: '2026-07-17', tracks: 1,
    cover: 'ok', audio: 'ok', isrc: 'gerado',
    segments: [
      { from: '2026-06-30', to: '2026-07-02', stage: 'recebido' },
      { from: '2026-07-02', to: '2026-07-07', stage: 'em_analise' },
      { from: '2026-07-07', to: '2026-07-09', stage: 'aprovado' },
      { from: '2026-07-09', to: '2026-07-17', stage: 'agendado' },
      { from: '2026-07-17', to: '2026-07-18', stage: 'distribuido' },
    ],
  },
]

export interface EmailEvent {
  at: string
  to: string
  subject: string
  trigger: string
  status: 'entregue' | 'aberto' | 'clicado'
  ref: string
}

export const EMAIL_LOG: EmailEvent[] = [
  { at: '2026-07-28 16:12', to: 'rafael@selva.rec.br', subject: 'Ajustes necessários — Maré de Dentro', trigger: 'status → ajustes', status: 'aberto', ref: 'rec-02' },
  { at: '2026-07-28 09:40', to: 'equipe@atabaque.biz', subject: 'Resumo diário da operação — 28 jul', trigger: 'cron 08:30', status: 'aberto', ref: '—' },
  { at: '2026-07-27 18:03', to: 'ze.raminho@estudio.com', subject: 'Recebemos Batuque Neon (EP) — em análise', trigger: 'status → recebido', status: 'clicado', ref: 'rec-03' },
  { at: '2026-07-25 11:22', to: 'marina@selva.rec.br', subject: 'Ciranda Elétrica aprovado — agendamento em curso', trigger: 'status → aprovado', status: 'clicado', ref: 'rec-01' },
  { at: '2026-07-24 15:47', to: 'rafael@selva.rec.br', subject: 'Recebemos Maré de Dentro — resumo do envio', trigger: 'submissão', status: 'clicado', ref: 'rec-02' },
  { at: '2026-07-23 10:05', to: 'marina@selva.rec.br', subject: 'Edição registrada — Ciranda Elétrica', trigger: 'edit mode', status: 'entregue', ref: 'rec-01' },
  { at: '2026-07-17 08:00', to: 'contato@bandafarol.com', subject: 'Sol de Julho distribuído 🎉', trigger: 'status → distribuído', status: 'clicado', ref: 'rec-04' },
]

export interface DriveNode {
  name: string
  kind: 'folder' | 'file'
  children?: DriveNode[]
  meta?: string
}

export const DRIVE_TREE: DriveNode = {
  name: 'Atabaque — Operação 2026', kind: 'folder',
  children: [
    {
      name: 'Ciranda Elétrica — Alaíde Tropical', kind: 'folder',
      children: [
        { name: '01 Áudio (masters)', kind: 'folder', children: [
          { name: 'ciranda-eletrica_master_v3.wav', kind: 'file', meta: '44.1kHz · 24bit · 3:12' },
        ]},
        { name: '02 Capa', kind: 'folder', children: [
          { name: 'ciranda_capa_3000x3000.png', kind: 'file', meta: '3000×3000 · ok' },
        ]},
        { name: '03 Documentos', kind: 'folder', children: [
          { name: 'resumo_submissao_rec-01.pdf', kind: 'file', meta: 'gerado no envio' },
          { name: 'splits_autores.pdf', kind: 'file', meta: 'anexo do intake' },
        ]},
        { name: '04 Divulgação', kind: 'folder', children: [
          { name: 'presskit_link.txt', kind: 'file', meta: 'link do intake' },
        ]},
      ],
    },
    {
      name: 'Maré de Dentro — Alaíde Tropical', kind: 'folder',
      children: [
        { name: '01 Áudio (masters)', kind: 'folder', children: [
          { name: 'mare-de-dentro_master_v1.wav', kind: 'file', meta: '44.1kHz · 16bit · 3:48' },
        ]},
        { name: '02 Capa', kind: 'folder', children: [
          { name: 'mare_capa_3000x3000.png', kind: 'file', meta: '3000×3000 · ok' },
        ]},
        { name: '03 Documentos', kind: 'folder', children: [
          { name: 'resumo_submissao_rec-02.pdf', kind: 'file', meta: 'gerado no envio' },
        ]},
      ],
    },
    {
      name: 'Clearance — pedidos', kind: 'folder',
      children: [
        { name: '2026-07_mare-de-dentro_clearance.pdf', kind: 'file', meta: 'do formulário clearance' },
      ],
    },
    {
      name: 'Cadastros — pessoas e empresas', kind: 'folder',
      children: [
        { name: 'alaide-tropical_cadastro.pdf', kind: 'file', meta: 'people registry' },
        { name: 'selva-producoes_cadastro.pdf', kind: 'file', meta: 'company registry' },
      ],
    },
  ],
}

export interface AirtableRecord {
  base: string
  table: string
  record: string
  key: string
  status: string
  sync: 'sincronizado' | 'gravando' | 'lendo'
  updatedAt: string
  origin: 'Formulário Sunbeat' | 'Airtable (equipe)' | 'Automação'
}

export const AIRTABLE_ROWS: AirtableRecord[] = [
  { base: 'Operação Atabaque', table: '[V2] Projetos Musicais', record: 'Ciranda Elétrica — Alaíde Tropical', key: 'rec-01', status: 'Agendado', sync: 'sincronizado', updatedAt: '2026-07-28 09:41', origin: 'Automação' },
  { base: 'Operação Atabaque', table: '[V2] Projetos Musicais', record: 'Maré de Dentro — Alaíde Tropical', key: 'rec-02', status: 'Ajustes', sync: 'sincronizado', updatedAt: '2026-07-28 16:12', origin: 'Airtable (equipe)' },
  { base: 'Operação Atabaque', table: '[V2] Projetos Musicais', record: 'Batuque Neon (EP) — Zé Raminho', key: 'rec-03', status: 'Em análise', sync: 'sincronizado', updatedAt: '2026-07-28 08:10', origin: 'Formulário Sunbeat' },
  { base: 'Operação Atabaque', table: '[V2] Faixas Musicais', record: 'Ciranda Elétrica (faixa 1) — ISRC BRABC2600001', key: 'trk-011', status: 'ISRC gerado', sync: 'sincronizado', updatedAt: '2026-07-27 14:20', origin: 'Automação' },
  { base: 'Operação Atabaque', table: '[V2] Clearance — Casos', record: 'Maré de Dentro — sample 8s (refrão 2)', key: 'clr-007', status: 'Em análise de titularidade', sync: 'sincronizado', updatedAt: '2026-07-28 15:02', origin: 'Formulário Sunbeat' },
  { base: 'Operação Atabaque', table: '[V2] - Pessoas', record: 'Alaíde Tropical (Alaíde Costa Nascimento)', key: 'ppl-031', status: 'Ativo', sync: 'sincronizado', updatedAt: '2026-07-26 12:00', origin: 'Formulário Sunbeat' },
  { base: 'Operação Atabaque', table: '[V2] - Empresas', record: 'Selva Produções Artísticas LTDA', key: 'cmp-004', status: 'Formalização', sync: 'gravando', updatedAt: 'agora', origin: 'Formulário Sunbeat' },
]

export const INTEGRATIONS = [
  {
    id: 'resend', name: 'Resend', tagline: 'E-mails transacionais por etapa',
    status: 'ativo', latency: '~400ms por disparo',
    points: [
      'Trigger a cada mudança de status no Airtable (recebido → em análise → ajustes → aprovado → agendado → distribuído)',
      'Resumo completo da submissão enviado na hora, com link de edição (edit mode)',
      'Resumo diário da operação para o time Atabaque (cron 08:30)',
    ],
  },
  {
    id: 'drive', name: 'Google Drive (Workspace)', tagline: 'Pastas e arquivos organizados sozinhos',
    status: 'ativo', latency: 'criação em ~2s por projeto',
    points: [
      'Pasta do projeto criada no envio: "Projeto — Artista"',
      'Subpastas padrão: 01 Áudio (masters) · 02 Capa · 03 Documentos · 04 Divulgação',
      'Arquivos dos formulários alocados automaticamente na subpasta certa, com nomenclatura padronizada',
      'Resumo da submissão em PDF salvo em 03 Documentos',
    ],
  },
  {
    id: 'airtable', name: 'Airtable (nativo)', tagline: '2-way sync — a base continua sendo a fonte',
    status: 'ativo', latency: 'sync em < 1min',
    points: [
      'Cada submissão vira registro nas tabelas Releases, Faixas, Clearance, Pessoas e Empresas',
      'Mudanças de status feitas pela equipe no Airtable refletem nos acompanhamentos e disparam os e-mails',
      'Deduplicação de pessoas por CPF/CNPJ ou e-mail antes de criar registro',
    ],
  },
] as const

/* ---------- Sunbeat Tables — read model operacional normalizado ----------
   Baseado em docs/sunbeat-tables-operational-read-model.md.
   Uma linha por registro operacional, independente do workflow. */

export type WorkflowType = 'release_intake' | 'rights_clearance' | 'people_registry' | 'company_registry'
export type RowStatus = 'draft' | 'submitted' | 'in_review' | 'blocked' | 'synced' | 'failed'
export type SyncState = 'ok' | 'pending' | 'synced' | 'sent' | 'failed' | 'skipped'

export interface TableRow {
  id: string
  workflow: WorkflowType
  title: string
  subtitle?: string
  contact?: string
  status: RowStatus
  stage: string
  nextAction?: string
  nextActionAt?: string
  risk: 'low' | 'medium' | 'high'
  sync: { airtable: SyncState; drive: SyncState; email: SyncState }
  updatedAt: string
  editUrl?: string
  airtableRef?: string
  airtableTable?: string
  v2Fields?: { field: string; value: string }[]
}

export const WORKFLOW_LABEL: Record<WorkflowType, string> = {
  release_intake: 'Lançamento',
  rights_clearance: 'Clearance',
  people_registry: 'Pessoas',
  company_registry: 'Empresas',
}

/* Tabelas v2 reais do Airtable Atabaque por workflow (fonte canônica do cliente).
   release_intake escreve Projetos + Faixas; clearance escreve Casos/Itens/Partes. */
export const WORKFLOW_AIRTABLE_TABLES: Record<WorkflowType, string[]> = {
  release_intake: ['[V2] Projetos Musicais', '[V2] Faixas Musicais'],
  rights_clearance: ['[V2] Clearance — Casos', '[V2] Clearance — Itens', '[V2] Clearance — Partes'],
  people_registry: ['[V2] - Pessoas'],
  company_registry: ['[V2] - Empresas'],
}

export const TABLE_ROWS: TableRow[] = [
  {
    id: 'sub-1042', workflow: 'release_intake', title: 'Ciranda Elétrica', subtitle: 'Alaíde Tropical · Single',
    contact: 'marina@selva.rec.br', status: 'synced', stage: 'Agendado',
    nextAction: 'Distribuição em 21 de ago', nextActionAt: '2026-08-21', risk: 'low',
    sync: { airtable: 'synced', drive: 'synced', email: 'sent' },
    updatedAt: '2026-07-28 09:41', editUrl: '#/intake?edit=sub-1042', airtableRef: 'rec-01', airtableTable: '[V2] Projetos Musicais',
    v2Fields: [
      { field: 'Origem Projeto ID', value: 'rec-01' },
      { field: 'Tipo de Lançamento', value: 'Single' },
      { field: 'Data de Lançamento', value: '2026-08-21' },
      { field: 'Liberado para Calendário', value: 'Sim' },
      { field: 'Cliente / Artista', value: 'Alaíde Tropical' },
      { field: 'Macroáreas Ativas', value: 'Clearance · Operacional · Plano de Marketing · Plano de Mídia · Imprensa' },
      { field: 'Responsável pelo upload', value: 'Cliente' },
    ],
  },
  {
    id: 'sub-1051', workflow: 'release_intake', title: 'Maré de Dentro', subtitle: 'Alaíde Tropical · Single',
    contact: 'rafael@selva.rec.br', status: 'in_review', stage: 'Ajustes',
    nextAction: 'Aguardando master 24bit do estúdio', nextActionAt: '2026-07-30', risk: 'medium',
    sync: { airtable: 'synced', drive: 'synced', email: 'sent' },
    updatedAt: '2026-07-28 16:12', editUrl: '#/intake?edit=sub-1051', airtableRef: 'rec-02', airtableTable: '[V2] Projetos Musicais',
    v2Fields: [
      { field: 'Origem Projeto ID', value: 'rec-02' },
      { field: 'Tipo de Lançamento', value: 'Single' },
      { field: 'Data de Lançamento', value: '2026-09-11' },
      { field: 'Liberado para Calendário', value: 'Não' },
      { field: 'Cliente / Artista', value: 'Alaíde Tropical' },
      { field: 'Macroáreas Ativas', value: 'Clearance · Operacional · Plano de Marketing' },
    ],
  },
  {
    id: 'sub-1053', workflow: 'release_intake', title: 'Batuque Neon (EP)', subtitle: 'Zé Raminho · EP · 4 faixas',
    contact: 'ze.raminho@estudio.com', status: 'in_review', stage: 'Em análise',
    nextAction: 'Validar capa (resolução abaixo do mínimo)', risk: 'medium',
    sync: { airtable: 'synced', drive: 'pending', email: 'sent' },
    updatedAt: '2026-07-28 08:10', editUrl: '#/intake?edit=sub-1053', airtableRef: 'rec-03', airtableTable: '[V2] Projetos Musicais',
    v2Fields: [
      { field: 'Origem Projeto ID', value: 'rec-03' },
      { field: 'Tipo de Lançamento', value: 'EP' },
      { field: 'Data de Lançamento', value: '2026-10-02' },
      { field: 'Liberado para Calendário', value: 'Não' },
      { field: 'Cliente / Artista', value: 'Zé Raminho' },
      { field: 'Macroáreas Ativas', value: 'Clearance · Operacional' },
    ],
  },
  {
    id: 'clr-007', workflow: 'rights_clearance', title: 'Maré de Dentro — sample 8s (refrão 2)',
    subtitle: 'Clearance musical', contact: 'rafael@selva.rec.br', status: 'in_review',
    stage: 'Em análise de titularidade', nextAction: 'Contatar editora detentora do master',
    nextActionAt: '2026-07-29', risk: 'high',
    sync: { airtable: 'synced', drive: 'skipped', email: 'sent' },
    updatedAt: '2026-07-28 15:02', airtableRef: 'clr-007', airtableTable: '[V2] Clearance — Casos',
    v2Fields: [
      { field: 'Nome do Caso', value: 'Maré de Dentro — sample 8s (refrão 2)' },
      { field: 'Formato do Clearance', value: 'Clearance musical' },
      { field: 'Status', value: 'Em análise de titularidade' },
      { field: 'Projeto vinculado', value: 'rec-02 · Maré de Dentro' },
    ],
  },
  {
    id: 'clr-008', workflow: 'rights_clearance', title: 'Licença de clipe — "Sol de Julho"',
    subtitle: 'Audiovisual / sync', contact: 'contato@bandafarol.com', status: 'submitted',
    stage: 'Recebido', nextAction: 'Triagem inicial da equipe', risk: 'low',
    sync: { airtable: 'pending', drive: 'pending', email: 'sent' },
    updatedAt: '2026-07-28 17:20', airtableTable: '[V2] Clearance — Casos',
    v2Fields: [
      { field: 'Nome do Caso', value: 'Licença de clipe — "Sol de Julho"' },
      { field: 'Formato do Clearance', value: 'Audiovisual / sync' },
      { field: 'Status', value: 'Recebido' },
      { field: 'Projeto vinculado', value: 'rec-04 · Sol de Julho' },
    ],
  },
  {
    id: 'ppl-031', workflow: 'people_registry', title: 'Alaíde Costa Nascimento',
    subtitle: 'PF · artista "Alaíde Tropical"', contact: 'alaide@email.com', status: 'synced',
    stage: 'Ativo', risk: 'low',
    sync: { airtable: 'synced', drive: 'skipped', email: 'sent' },
    updatedAt: '2026-07-26 12:00', airtableRef: 'ppl-031', airtableTable: '[V2] - Pessoas',
    v2Fields: [
      { field: 'Nome', value: 'Alaíde Costa Nascimento' },
      { field: 'Tipo', value: 'Pessoa física' },
      { field: 'Nome artístico', value: 'Alaíde Tropical' },
      { field: 'Status', value: 'Ativo' },
    ],
  },
  {
    id: 'cmp-004', workflow: 'company_registry', title: 'Selva Produções Artísticas LTDA',
    subtitle: 'PJ · selo', contact: 'marina@selva.rec.br', status: 'in_review',
    stage: 'Formalização', nextAction: 'Conferir dados bancários', risk: 'medium',
    sync: { airtable: 'synced', drive: 'skipped', email: 'pending' },
    updatedAt: 'agora', airtableRef: 'cmp-004', airtableTable: '[V2] - Empresas',
    v2Fields: [
      { field: 'Razão social', value: 'Selva Produções Artísticas LTDA' },
      { field: 'Tipo', value: 'Pessoa jurídica · selo' },
      { field: 'Status', value: 'Formalização' },
    ],
  },
  {
    id: 'drf-011', workflow: 'release_intake', title: 'Rascunho — "Vento Norte"',
    subtitle: 'Alaíde Tropical · parou em Faixas', contact: 'rafael@selva.rec.br', status: 'draft',
    stage: 'Rascunho ativo', nextAction: 'Lembrar o parceiro por e-mail', risk: 'low',
    sync: { airtable: 'skipped', drive: 'skipped', email: 'skipped' },
    updatedAt: '2026-07-27 19:44',
  },
  {
    id: 'sub-1039', workflow: 'release_intake', title: 'Sol de Julho', subtitle: 'Banda Farol · Single',
    contact: 'contato@bandafarol.com', status: 'synced', stage: 'Distribuído',
    risk: 'low',
    sync: { airtable: 'synced', drive: 'synced', email: 'sent' },
    updatedAt: '2026-07-17 08:00', airtableRef: 'rec-04', airtableTable: '[V2] Projetos Musicais',
    v2Fields: [
      { field: 'Origem Projeto ID', value: 'rec-04' },
      { field: 'Tipo de Lançamento', value: 'Single' },
      { field: 'Data de Lançamento', value: '2026-07-17' },
      { field: 'Liberado para Calendário', value: 'Sim' },
      { field: 'Cliente / Artista', value: 'Banda Farol' },
      { field: 'Status Pós-Lançamento', value: 'Distribuído · relatórios D+7/D+15/D+28 na fila' },
    ],
  },
]

export type TableView = 'todas' | 'revisao' | 'sync_falhou' | 'rascunhos' | 'sem_airtable' | 'hoje'

export const TABLE_VIEWS: { key: TableView; label: string; filter: (r: TableRow) => boolean }[] = [
  { key: 'todas', label: 'Todas', filter: () => true },
  { key: 'revisao', label: 'Precisa revisão', filter: (r) => r.status === 'submitted' || r.status === 'in_review' || r.risk === 'high' },
  { key: 'sync_falhou', label: 'Sync pendente/falha', filter: (r) => Object.values(r.sync).some((s) => s === 'failed' || s === 'pending') },
  { key: 'rascunhos', label: 'Rascunhos ativos', filter: (r) => r.status === 'draft' },
  { key: 'sem_airtable', label: 'Sem Airtable', filter: (r) => !r.airtableRef },
  { key: 'hoje', label: 'Atabaque hoje', filter: (r) => r.nextActionAt ? r.nextActionAt <= '2026-07-29' : false },
]

/* ---------- [V2] Etapas do Lançamento ----------
   Espelha tbla3E1wam2daNP5l. Etapa = "Macroárea - Nome do Projeto";
   Data Início/Fim = Data de Lançamento + Offset (janelas do dicionário v2). */

export interface EtapaRow {
  id: string
  etapa: string
  macroarea: string
  status: 'Não iniciado' | 'Em andamento' | 'Concluído' | 'Cancelado'
  ativa: boolean
  responsavel: string
  projeto: string
  projetoId: string
  inicio: string
  fim: string
  risco: 'verde' | 'amarelo' | 'vermelho'
  emailEnviadoEm?: string
}

export const ETAPA_ROWS: EtapaRow[] = [
  // Ciranda Elétrica — rec-01 — lançamento 2026-08-21
  { id: 'etp-101', etapa: 'Clearance - Ciranda Elétrica', macroarea: 'Clearance', status: 'Em andamento', ativa: true, responsavel: 'Mylena', projeto: 'Ciranda Elétrica', projetoId: 'rec-01', inicio: '2026-06-22', fim: '2026-07-31', risco: 'vermelho' },
  { id: 'etp-102', etapa: 'Operacional - Ciranda Elétrica', macroarea: 'Operacional', status: 'Em andamento', ativa: true, responsavel: 'Felipe', projeto: 'Ciranda Elétrica', projetoId: 'rec-01', inicio: '2026-07-07', fim: '2026-08-07', risco: 'amarelo' },
  { id: 'etp-103', etapa: 'Plano de Marketing - Ciranda Elétrica', macroarea: 'Plano de Marketing', status: 'Concluído', ativa: true, responsavel: 'Mylena', projeto: 'Ciranda Elétrica', projetoId: 'rec-01', inicio: '2026-06-27', fim: '2026-07-12', risco: 'verde' },
  { id: 'etp-104', etapa: 'Plano de Mídia - Ciranda Elétrica', macroarea: 'Plano de Mídia', status: 'Em andamento', ativa: true, responsavel: 'André', projeto: 'Ciranda Elétrica', projetoId: 'rec-01', inicio: '2026-07-12', fim: '2026-08-11', risco: 'verde' },
  { id: 'etp-105', etapa: 'Imprensa - Ciranda Elétrica', macroarea: 'Imprensa', status: 'Não iniciado', ativa: true, responsavel: 'Mylena', projeto: 'Ciranda Elétrica', projetoId: 'rec-01', inicio: '2026-07-31', fim: '2026-08-06', risco: 'verde' },
  // Maré de Dentro — rec-02 — lançamento 2026-09-11
  { id: 'etp-201', etapa: 'Clearance - Maré de Dentro', macroarea: 'Clearance', status: 'Em andamento', ativa: true, responsavel: 'Mylena', projeto: 'Maré de Dentro', projetoId: 'rec-02', inicio: '2026-07-13', fim: '2026-08-21', risco: 'vermelho' },
  { id: 'etp-202', etapa: 'Operacional - Maré de Dentro', macroarea: 'Operacional', status: 'Em andamento', ativa: true, responsavel: 'Felipe', projeto: 'Maré de Dentro', projetoId: 'rec-02', inicio: '2026-07-28', fim: '2026-08-28', risco: 'amarelo' },
  { id: 'etp-203', etapa: 'Plano de Marketing - Maré de Dentro', macroarea: 'Plano de Marketing', status: 'Em andamento', ativa: true, responsavel: 'Mylena', projeto: 'Maré de Dentro', projetoId: 'rec-02', inicio: '2026-07-18', fim: '2026-08-02', risco: 'amarelo' },
  // Batuque Neon — rec-03 — lançamento 2026-10-02
  { id: 'etp-301', etapa: 'Clearance - Batuque Neon (EP)', macroarea: 'Clearance', status: 'Não iniciado', ativa: true, responsavel: 'Mylena', projeto: 'Batuque Neon (EP)', projetoId: 'rec-03', inicio: '2026-08-03', fim: '2026-09-11', risco: 'verde' },
  { id: 'etp-302', etapa: 'Operacional - Batuque Neon (EP)', macroarea: 'Operacional', status: 'Não iniciado', ativa: true, responsavel: 'Felipe', projeto: 'Batuque Neon (EP)', projetoId: 'rec-03', inicio: '2026-08-18', fim: '2026-09-18', risco: 'verde' },
  // Sol de Julho — rec-04 — lançamento 2026-07-17 (distribuído; relatórios D+)
  { id: 'etp-401', etapa: 'Relatório D+7 - Sol de Julho', macroarea: 'Relatório D+7', status: 'Concluído', ativa: true, responsavel: 'Felipe', projeto: 'Sol de Julho', projetoId: 'rec-04', inicio: '2026-07-24', fim: '2026-07-27', risco: 'verde', emailEnviadoEm: '2026-07-24 08:00' },
  { id: 'etp-402', etapa: 'Relatório D+15 - Sol de Julho', macroarea: 'Relatório D+15', status: 'Não iniciado', ativa: true, responsavel: 'Felipe', projeto: 'Sol de Julho', projetoId: 'rec-04', inicio: '2026-08-01', fim: '2026-08-04', risco: 'verde' },
  { id: 'etp-403', etapa: 'Relatório D+28 - Sol de Julho', macroarea: 'Relatório D+28', status: 'Não iniciado', ativa: true, responsavel: 'Felipe', projeto: 'Sol de Julho', projetoId: 'rec-04', inicio: '2026-08-14', fim: '2026-08-19', risco: 'verde' },
]

/* ---------- [V2] Demandas Operacionais ----------
   Espelha tblQEaeXsxMaINAYg. Chave de Demanda Upload = "OrigemProjetoID:tipo-normalizado". */

export interface DemandaRow {
  id: string
  ticket: string
  produto: string
  projetoId: string
  dataLancamento: string
  tipo: 'Upload de produto nas DSPs' | 'Revisão de Metadados' | 'Upload de videoclipe nas DSPs'
  cliente: string
  status: 'Não Iniciado' | 'Em andamento' | 'Concluído'
  upload: 'Sim' | 'Não' | '—'
  chave: string
  dataLimite: string
}

export const DEMANDA_ROWS: DemandaRow[] = [
  { id: 'dem-031', ticket: 'DEM-00031', produto: 'Ciranda Elétrica', projetoId: 'rec-01', dataLancamento: '2026-08-21', tipo: 'Upload de produto nas DSPs', cliente: 'Alaíde Tropical', status: 'Em andamento', upload: 'Sim', chave: 'rec-01:upload-dsp', dataLimite: '2026-07-31' },
  { id: 'dem-032', ticket: 'DEM-00032', produto: 'Ciranda Elétrica', projetoId: 'rec-01', dataLancamento: '2026-08-21', tipo: 'Revisão de Metadados', cliente: 'Alaíde Tropical', status: 'Concluído', upload: '—', chave: 'rec-01:revisao-metadados', dataLimite: '2026-08-07' },
  { id: 'dem-033', ticket: 'DEM-00033', produto: 'Maré de Dentro', projetoId: 'rec-02', dataLancamento: '2026-09-11', tipo: 'Upload de produto nas DSPs', cliente: 'Alaíde Tropical', status: 'Não Iniciado', upload: 'Não', chave: 'rec-02:upload-dsp', dataLimite: '2026-08-21' },
  { id: 'dem-034', ticket: 'DEM-00034', produto: 'Maré de Dentro', projetoId: 'rec-02', dataLancamento: '2026-09-11', tipo: 'Revisão de Metadados', cliente: 'Alaíde Tropical', status: 'Não Iniciado', upload: '—', chave: 'rec-02:revisao-metadados', dataLimite: '2026-08-28' },
  { id: 'dem-035', ticket: 'DEM-00035', produto: 'Batuque Neon (EP)', projetoId: 'rec-03', dataLancamento: '2026-10-02', tipo: 'Upload de produto nas DSPs', cliente: 'Zé Raminho', status: 'Não Iniciado', upload: 'Não', chave: 'rec-03:upload-dsp', dataLimite: '2026-09-11' },
  { id: 'dem-036', ticket: 'DEM-00036', produto: 'Ciranda Elétrica', projetoId: 'rec-01', dataLancamento: '2026-08-21', tipo: 'Upload de videoclipe nas DSPs', cliente: 'Alaíde Tropical', status: 'Não Iniciado', upload: 'Não', chave: 'rec-01:upload-videoclipe', dataLimite: '2026-08-11' },
]

/* ---------- Automações e triggers ----------
   Visibilidade das automações v2 e e-mails transacionais.
   Ativação ampla só após dry run e teste controlado (regra do handoff). */

export type AutomationStatus = 'ativa' | 'em_validacao' | 'pausada'

export interface AutomationRow {
  id: string
  nome: string
  escopo: string
  gatilho: string
  efeito: string
  status: AutomationStatus
  ultimoDisparo?: string
  travaAntiReenvio: string
  observacao?: string
}

export const AUTOMATION_ROWS: AutomationRow[] = [
  {
    id: 'auto-01', nome: 'E-mails transacionais por status', escopo: 'Resend · intake',
    gatilho: 'Mudança de status no Airtable (recebido → em análise → ajustes → aprovado → agendado → distribuído)',
    efeito: 'E-mail ao parceiro a cada etapa + resumo completo da submissão com link de edição',
    status: 'ativa', ultimoDisparo: '2026-07-28 16:12',
    travaAntiReenvio: 'Idempotência por evento + registro (e-mails de intake)',
  },
  {
    id: 'auto-02', nome: 'Resumo diário da operação', escopo: 'Resend · equipe Atabaque',
    gatilho: 'Cron 08:30',
    efeito: 'E-mail consolidado do dia para a equipe',
    status: 'ativa', ultimoDisparo: '2026-07-28 09:40',
    travaAntiReenvio: 'Janela única diária (cron)',
  },
  {
    id: 'auto-03', nome: 'Pastas e arquivos no Drive', escopo: 'Google Drive · todos os fluxos',
    gatilho: 'Submissão recebida',
    efeito: 'Pasta do projeto + subpastas padrão (01 Áudio · 02 Capa · 03 Documentos · 04 Divulgação) + PDF resumo',
    status: 'ativa', ultimoDisparo: '2026-07-28 08:10',
    travaAntiReenvio: 'Reuso de pasta por projeto (arquivos ainda sem idempotência — risco conhecido)',
    observacao: 'Política de arquivo repetido (ignorar/substituir/versionar) pendente de decisão',
  },
  {
    id: 'auto-04', nome: 'Gantt — criação de etapas', escopo: 'Airtable v2 · Etapas',
    gatilho: 'Campo "Automação V2 - Precisa sincronizar" = Sim (8 campos monitorados do projeto)',
    efeito: 'Cria/atualiza etapas por macroárea com janelas D-xx e responsáveis',
    status: 'pausada',
    travaAntiReenvio: 'Chave: Projeto Musical + Macroárea (uma etapa ativa por par)',
    observacao: 'Aguardando dry run e teste controlado de idempotência',
  },
  {
    id: 'auto-05', nome: 'Calendário e Demandas', escopo: 'Airtable v2 · Calendário/Demandas',
    gatilho: 'Checkbox "Liberado para Calendário" — liberação manual da Mylena',
    efeito: 'Cria registro no Calendário + demandas por tipo (upload DSPs, revisão de metadados, videoclipe)',
    status: 'pausada',
    travaAntiReenvio: 'Chaves: Origem Projeto ID (1 calendário/projeto) · OrigemProjetoID:tipo (1 demanda/projeto/tipo)',
    observacao: 'Só nasce após liberação explícita; nunca por projeto/data sozinho',
  },
  {
    id: 'auto-06', nome: 'Relatórios D+7 / D+15 / D+28', escopo: 'Airtable v2 + Resend · pós-lançamento',
    gatilho: 'Campo "Email V2 - Deve enviar hoje" = Sim (Data Início da etapa de relatório ativa)',
    efeito: 'E-mail de relatório ao responsável, com link quando preenchido',
    status: 'em_validacao', ultimoDisparo: '2026-07-24 08:00',
    travaAntiReenvio: 'Chave: ID da Etapa + "Email automático enviado em" (um disparo por etapa, sem retroativo)',
    observacao: 'Corpo do e-mail e remetente aguardando aprovação de Felipe/Mylena',
  },
]

/* ---------- Configuração de pastas do Google Drive por workflow ----------
   Torna visível e editável a lógica de criação/localização de pastas.
   Intake espelha [V2] Clientes: Cliente → pasta do artista → Projetos →
   "Projeto — Artista" → subpastas padrão. Clearance usa raízes próprias
   (musical / não musical). Protótipo: persiste em localStorage; na produção
   vira workspace_workflow_settings.extra_settings.drive. */

export interface DriveWorkflowConfig {
  workflow: WorkflowType
  label: string
  resolucao: string[]     // cadeia de localização, em ordem
  raiz: string            // pasta raiz (nome ou folder_id); vazio = sem destino
  subpastas: string[]     // template criado em cada pasta de projeto/caso
  criarSeAusente: boolean
  fallbackBloqueado: boolean
}

export const DRIVE_CONFIG_DEFAULT: DriveWorkflowConfig[] = [
  {
    workflow: 'release_intake', label: 'Lançamentos (intake)',
    resolucao: ['[V2] Clientes', 'Pasta do artista (folder_id ou link)', 'Subpasta "Projetos"', '"{Projeto} — {Artista}"'],
    raiz: 'Atabaque — Operação 2026',
    subpastas: ['01 Áudio (masters)', '02 Capa', '03 Documentos', '04 Divulgação'],
    criarSeAusente: true, fallbackBloqueado: true,
  },
  {
    workflow: 'rights_clearance', label: 'Clearance musical',
    resolucao: ['Raiz clearance musical', '"{Nome do Caso}"'],
    raiz: 'Clearance — Musical',
    subpastas: ['01 Documentos', '02 Materiais de análise', '03 Contratos e licenças'],
    criarSeAusente: true, fallbackBloqueado: true,
  },
  {
    workflow: 'rights_clearance', label: 'Clearance não musical (audiovisual/sync)',
    resolucao: ['Raiz clearance não musical', '"{Nome do Caso}"'],
    raiz: 'Clearance — Audiovisual / Sync',
    subpastas: ['01 Documentos', '02 Materiais de análise', '03 Contratos e licenças'],
    criarSeAusente: true, fallbackBloqueado: true,
  },
  {
    workflow: 'people_registry', label: 'Pessoas (cadastros)',
    resolucao: ['Raiz cadastros', '"{Nome} — {documento mascarado}"'],
    raiz: '',
    subpastas: ['01 Documentos'],
    criarSeAusente: false, fallbackBloqueado: true,
  },
  {
    workflow: 'company_registry', label: 'Empresas (cadastros)',
    resolucao: ['Raiz cadastros', '"{Razão social}"'],
    raiz: '',
    subpastas: ['01 Documentos', '02 Contratos'],
    criarSeAusente: false, fallbackBloqueado: true,
  },
]

const DRIVE_CFG_KEY = 'sunbeat.drive_config'

export function loadDriveConfig(): DriveWorkflowConfig[] {
  try {
    const raw = localStorage.getItem(DRIVE_CFG_KEY)
    if (raw) return JSON.parse(raw) as DriveWorkflowConfig[]
  } catch { /* ignore */ }
  return DRIVE_CONFIG_DEFAULT
}

export function saveDriveConfig(cfg: DriveWorkflowConfig[]) {
  localStorage.setItem(DRIVE_CFG_KEY, JSON.stringify(cfg))
}

export function resetDriveConfig() {
  localStorage.removeItem(DRIVE_CFG_KEY)
}
