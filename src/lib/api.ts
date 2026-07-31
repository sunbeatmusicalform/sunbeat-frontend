/* Camada de API do front Sunbeat → backend real (FastAPI no Fly.io).

   Resolução da base URL (ordem):
     1. localStorage "sunbeat.api_base"  (override manual, ex.: http://localhost:8000)
     2. env VITE_API_URL no build
     3. produção Fly.io

   Feature flag (ordem):
     1. localStorage "sunbeat.api_enabled" = "1" | "0"
     2. env VITE_API_ENABLED = "1" | "0"
     3. ligada por padrão, pois front e API agora são servidos na mesma origem.

   Toda função devolve null em caso de falha/flag off — o chamador
   faz fallback para o mock local. Nenhuma chamada quebra a UI. */

const FLY_BASE = 'https://sunbeat-backend.fly.dev'
const LS_BASE = 'sunbeat.api_base'
const LS_ENABLED = 'sunbeat.api_enabled'
const SS_PORTAL_TOKEN = 'sunbeat-portal-token'

function portalToken(): string | null {
  try { return sessionStorage.getItem(SS_PORTAL_TOKEN) } catch { return null }
}

export function apiBase(): string {
  try {
    const ls = localStorage.getItem(LS_BASE)
    if (ls) return ls.replace(/\/+$/, '')
  } catch { /* ignore */ }
  const env = import.meta.env.VITE_API_URL as string | undefined
  const sameOrigin = typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol)
    ? window.location.origin
    : FLY_BASE
  return (env ?? sameOrigin).replace(/\/+$/, '')
}

export function apiEnabled(): boolean {
  try {
    const ls = localStorage.getItem(LS_ENABLED)
    if (ls === '1') return true
    if (ls === '0') return false
  } catch { /* ignore */ }
  const env = import.meta.env.VITE_API_ENABLED as string | undefined
  return env === undefined ? true : env === '1'
}

export function setApiOverride(base?: string, enabled?: boolean) {
  try {
    if (base === undefined) localStorage.removeItem(LS_BASE)
    else localStorage.setItem(LS_BASE, base)
    if (enabled === undefined) localStorage.removeItem(LS_ENABLED)
    else localStorage.setItem(LS_ENABLED, enabled ? '1' : '0')
  } catch { /* ignore */ }
}

const WORKSPACE = 'atabaque'

async function get<T>(path: string): Promise<T | null> {
  if (!apiEnabled()) return null
  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    const pt = portalToken()
    if (pt) headers['X-Portal-Token'] = pt
    const res = await fetch(`${apiBase()}${path}`, { headers })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch (err) {
    console.warn(`[api] GET ${path} falhou:`, err)
    return null
  }
}

async function send<T>(method: 'POST' | 'PATCH', path: string, body: unknown): Promise<T | null> {
  if (!apiEnabled()) return null
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' }
    const pt = portalToken()
    if (pt) headers['X-Portal-Token'] = pt
    const res = await fetch(`${apiBase()}${path}`, {
      method,
      headers,
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch (err) {
    console.warn(`[api] ${method} ${path} falhou:`, err)
    return null
  }
}

/* ---------- Contratos (espelham os pacotes de trabalho do backend) ---------- */

/* Contrato real do verify (PR #37, app/schemas/people_registry.py).
   Retorno sanitizado: sem e-mail, documento ou dados bancários. */
export interface VerifyMatchPayload {
  record_id: string
  display_name?: string | null
  match_by: 'email' | 'documento' | 'nome'
}

export interface VerifyPersonResponse {
  ok: boolean
  query: string
  verdict: 'ambas' | 'so_v2' | 'so_legado' | 'nao_encontrado'
  dados_cadastrais?: VerifyMatchPayload | null
  v2_pessoas?: VerifyMatchPayload | null
  acao: string
}

/* Contrato real da branch codex/atabaque-meeting-readiness
   (app/schemas/people_registry.py — PeopleRegistryInvite*). */
export interface InviteRemotePayload {
  token: string
  status: 'pending' | 'sent' | 'opened' | 'submitted' | 'submitted_pending_airtable' | 'failed' | 'expired' | 'discontinued'
  workspace_slug: string
  profile: string
  airtable_clearance_part_id: string
  invite_url: string
  context: Record<string, unknown>
  expires_at?: string | null
  created_at?: string | null
}

export interface InviteRemoteResponse {
  ok: boolean
  status: string
  invite?: InviteRemotePayload | null
  error?: { code?: string; message?: string } | null
}

export interface DriveConfigRemote {
  workflow_type: string
  root_mode?: string
  artist_folder_pattern?: string
  subfolders?: string[]
  overrides?: Record<string, unknown>
  warnings?: string[]
}

export type EmailEventName = 'on_draft' | 'on_submit' | 'on_edit' | 'on_first_stage' | 'on_summary'

export interface EmailEventRemote {
  enabled: boolean
  recipients: string[]
  _origin?: 'db' | 'default'
}

export interface EmailTemplateRemote {
  subject: string
  body: string
  _origin?: 'db' | 'default'
}

export interface EmailConfigRemote {
  ok: boolean
  workspace_slug: string
  workflow_type: string
  row_exists: boolean
  events: Record<EmailEventName, EmailEventRemote>
  templates: Record<EmailEventName, EmailTemplateRemote>
  cc_addresses: string[]
  bcc_addresses: string[]
  placeholders: string[]
  updated?: string[]
}

export interface EmailConfigPatchRemote {
  events?: Partial<Record<EmailEventName, Omit<EmailEventRemote, '_origin'>>>
  templates?: Partial<Record<EmailEventName, Omit<EmailTemplateRemote, '_origin'>>>
  cc_addresses?: string[]
  bcc_addresses?: string[]
}

export const api = {
  /* pendente no backend: endpoint de averiguação 2 bases (pacote Codex, tarefa 1) */
  verifyPerson: (query: string) =>
    get<VerifyPersonResponse>(`/people-registry/verify?workspace_slug=${WORKSPACE}&query=${encodeURIComponent(query)}`),

  /* existe na branch do Codex: GET marca o convite como "opened" */
  getInvite: (token: string) =>
    get<InviteRemoteResponse>(`/people-registry/invites/${encodeURIComponent(token)}`),

  /* existe na branch do Codex: cria o cadastro contextual e vincula à parte do clearance.
     O envelope segue docs/people-invite-front-mapping.md — montado por
     app/src/forms/peopleAdapter.ts (buildInviteEnvelope). */
  respondInvite: (token: string, envelope: Record<string, unknown>) =>
    send<InviteRemoteResponse>('POST', `/people-registry/invites/${encodeURIComponent(token)}/records`, envelope),

  getDriveConfig: (workflowType: string) =>
    get<DriveConfigRemote>(`/workspaces/${WORKSPACE}/workflows/${workflowType}/drive-config`),

  patchDriveConfig: (workflowType: string, cfg: DriveConfigRemote) =>
    send<DriveConfigRemote>('PATCH', `/workspaces/${WORKSPACE}/workflows/${workflowType}/drive-config`, cfg),

  getEmailConfig: (workspace: string, workflowType = 'release_intake') =>
    get<EmailConfigRemote>(`/workspaces/${encodeURIComponent(workspace)}/workflows/${encodeURIComponent(workflowType)}/email-config`),

  patchEmailConfig: (workspace: string, cfg: EmailConfigPatchRemote, workflowType = 'release_intake') =>
    send<EmailConfigRemote>('PATCH', `/workspaces/${encodeURIComponent(workspace)}/workflows/${encodeURIComponent(workflowType)}/email-config`, cfg),
}
