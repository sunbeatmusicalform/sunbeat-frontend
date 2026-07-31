/* Convites contextuais de cadastro de pessoas (people links).
   Espelha a frente "Rights Clearance → People Registry invites" do Codex:
   um convite nasce de uma parte faltante num caso de clearance, carrega o
   contexto (caso, projeto, faixa, função) e abre o formulário de pessoas
   pré-preenchido. Estados: enviado → aberto → respondido. */

import type { FormValues } from '../engine/types'

export type InviteStatus = 'enviado' | 'aberto' | 'respondido'

export interface PeopleInvite {
  token: string
  status: InviteStatus
  parte: string          // nome esperado da parte no caso
  papel: string          // função no caso (Intérprete, Autor...)
  caso: string           // Nome do Caso de clearance
  casoId: string         // registro Airtable do caso
  projeto: string
  faixa?: string
  criadoEm: string
  prefill: Partial<FormValues>
}

export const INVITES: PeopleInvite[] = [
  {
    token: 'inv-001', status: 'aberto',
    parte: 'Zé Raminho', papel: 'Intérprete',
    caso: 'Maré de Dentro — sample 8s (refrão 2)', casoId: 'clr-007',
    projeto: 'Maré de Dentro', faixa: 'Maré de Dentro (faixa 1)',
    criadoEm: '2026-07-28 15:05',
    prefill: {
      party_kind: 'pf',
      stage_name: 'Zé Raminho',
      roles: ['interprete'],
    },
  },
  {
    token: 'inv-002', status: 'enviado',
    parte: 'Banda Farol', papel: 'Titular do master',
    caso: 'Licença de clipe — "Sol de Julho"', casoId: 'clr-008',
    projeto: 'Sol de Julho',
    criadoEm: '2026-07-28 17:25',
    prefill: {
      party_kind: 'pj',
      display_name_pj: 'Banda Farol',
      roles: ['artista'],
    },
  },
  {
    token: 'inv-003', status: 'respondido',
    parte: 'Alaíde Costa Nascimento', papel: 'Autora',
    caso: 'Maré de Dentro — sample 8s (refrão 2)', casoId: 'clr-007',
    projeto: 'Maré de Dentro', faixa: 'Maré de Dentro (faixa 1)',
    criadoEm: '2026-07-26 11:40',
    prefill: {},
  },
]

export function findInvite(token: string | null): PeopleInvite | undefined {
  if (!token) return undefined
  const inv = INVITES.find((i) => i.token === token)
  return inv ? { ...inv, status: getInviteStatus(token) } : undefined
}

/* Volta do ciclo: o submit do cadastro marca o convite como respondido.
   Protótipo sem backend — persiste em localStorage (mesmo padrão do rascunho);
   na produção é o endpoint POST /people-registry/invites/{token}/records. */
const LS_KEY = 'sunbeat.people_invites.status'

function readOverrides(): Record<string, InviteStatus> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') } catch { return {} }
}

export function getInviteStatus(token: string): InviteStatus {
  return readOverrides()[token] ?? INVITES.find((i) => i.token === token)?.status ?? 'enviado'
}

export function markInviteResponded(token: string) {
  const o = readOverrides()
  o[token] = 'respondido'
  localStorage.setItem(LS_KEY, JSON.stringify(o))
}

export function invitesWithStatus(): PeopleInvite[] {
  return INVITES.map((i) => ({ ...i, status: getInviteStatus(i.token) }))
}

export const INVITE_STATUS_LABEL: Record<InviteStatus, string> = {
  enviado: 'convite enviado',
  aberto: 'link aberto',
  respondido: 'cadastro recebido',
}

/* ---------- Verificação de cadastro nas tabelas Airtable da Atabaque ----------
   Antes de gerar um convite ou vincular uma parte, averigua as DUAS tabelas de
   pessoas da Workstation Atabaque (mesma base v2):
   1) "Dados Cadastrais" — base viva de artistas (505+ registros)
   2) "[V2] - Pessoas" — cadastro operacional novo
   O veredito decide: vincular existente ou gerar convite contextual.
   Produção: busca Airtable server-side (minimizada, read-only). */

export const PEOPLE_LEGACY_TABLE = 'Dados Cadastrais'
export const PEOPLE_V2_TABLE = '[V2] - Pessoas'

export interface PersonBaseHit {
  nome: string
  documento?: string   // mascarado na exibição
  email?: string
  dadosCadastrais?: { id: string; status: string }
  v2Pessoas?: { id: string; status: string }
}

export const PEOPLE_BASES: PersonBaseHit[] = [
  {
    nome: 'Alaíde Costa Nascimento', documento: '***.***.***-**', email: 'alaide@email.com',
    dadosCadastrais: { id: 'recLEG031', status: 'Ativo' },
    v2Pessoas: { id: 'recPPL031', status: 'Ativo' },
  },
  {
    nome: 'Banda Farol', documento: '**.***.***/****-**', email: 'contato@bandafarol.com',
    v2Pessoas: { id: 'recPPL044', status: 'Ativo' },
  },
  {
    nome: 'Rafael Nogueira', email: 'rafael@selva.rec.br',
    v2Pessoas: { id: 'recPPL037', status: 'Ativo' },
  },
  {
    nome: 'Donna Lolla', email: 'contato@donnalolla.com',
    dadosCadastrais: { id: 'recLEG012', status: 'Ativo' },
  },
  {
    nome: 'Tuca Silveira', email: 'arthur.silveirasc@gmail.com',
    dadosCadastrais: { id: 'recLEG001', status: 'Ativo' },
  },
]

export type LookupVerdict =
  | 'ambas'           // cadastrado nas duas tabelas — vincular à parte
  | 'so_v2'           // existe só no [V2] - Pessoas — vincular, não gerar convite
  | 'so_legado'       // existe só no Dados Cadastrais — vincular e planejar migração
  | 'nao_encontrado'  // não existe em nenhuma — gerar convite contextual

export interface LookupResult {
  hit?: PersonBaseHit
  verdict: LookupVerdict
  acao: string
}

export function lookupPerson(query: string): LookupResult {
  const q = query.trim().toLowerCase()
  if (q.length < 3) return { verdict: 'nao_encontrado', acao: 'Digite ao menos 3 letras do nome, documento ou e-mail.' }
  const hit = PEOPLE_BASES.find((p) =>
    p.nome.toLowerCase().includes(q) ||
    (p.email ?? '').toLowerCase().includes(q) ||
    (p.documento ?? '').includes(q)
  )
  if (!hit) {
    return { verdict: 'nao_encontrado', acao: `Sem cadastro nem em ${PEOPLE_LEGACY_TABLE} nem em ${PEOPLE_V2_TABLE} — gerar convite contextual de cadastro.` }
  }
  if (hit.dadosCadastrais && hit.v2Pessoas) {
    return { hit, verdict: 'ambas', acao: 'Cadastrado nas duas tabelas — vincular à parte do caso. Não gerar convite.' }
  }
  if (hit.v2Pessoas) {
    return { hit, verdict: 'so_v2', acao: `Existe em ${PEOPLE_V2_TABLE} — vincular à parte e registrar origem. Não gerar convite.` }
  }
  return { hit, verdict: 'so_legado', acao: `Existe só em ${PEOPLE_LEGACY_TABLE} — vincular à parte e planejar migração para ${PEOPLE_V2_TABLE}. Não gerar convite.` }
}

export const VERDICT_STYLE: Record<LookupVerdict, { label: string; cls: string }> = {
  ambas: { label: 'nas duas tabelas ✓', cls: 'bg-[#16a34a]/15 text-[#166534]' },
  so_v2: { label: 'só no [V2] - Pessoas', cls: 'bg-[#329fd7]/15 text-[#1f6f9e]' },
  so_legado: { label: 'só no Dados Cadastrais', cls: 'bg-[#7c3aed]/15 text-[#5b21b6]' },
  nao_encontrado: { label: 'não encontrado', cls: 'bg-[#ff5639]/15 text-[#b3261e]' },
}
