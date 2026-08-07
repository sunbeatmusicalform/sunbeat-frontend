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

export interface ApiActionResult<T> {
  ok: boolean
  data?: T
  error?: string
  status: number
}

async function sendAction<T>(path: string, body: unknown): Promise<ApiActionResult<T>> {
  if (!apiEnabled()) return { ok: false, error: 'API desativada.', status: 0 }
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' }
    const pt = portalToken()
    if (pt) headers['X-Portal-Token'] = pt
    const res = await fetch(`${apiBase()}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    const payload = await res.json().catch(() => ({})) as {
      ok?: boolean
      data?: T
      error?: string
      detail?: string | { message?: string }
    }
    const detail = typeof payload.detail === 'string' ? payload.detail : payload.detail?.message
    return {
      ok: res.ok && payload.ok !== false,
      data: payload.data,
      error: payload.error ?? detail ?? (res.ok ? undefined : `Erro ${res.status}`),
      status: res.status,
    }
  } catch (err) {
    console.warn(`[api] POST ${path} falhou:`, err)
    return { ok: false, error: 'Falha de rede. Tente novamente.', status: 0 }
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

export interface PeopleLookupItem {
  id: string
  displayName: string
  roles: string[]
  source: 'people_registry'
  confidence: 'exact' | 'partial'
}

export interface PeopleLookupResponse {
  ok: boolean
  items: PeopleLookupItem[]
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
  default_subject: string
  default_body: string
  default_subject_template: string
  default_body_template: string
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
  templates?: Partial<Record<EmailEventName, Pick<EmailTemplateRemote, 'subject' | 'body'>>>
  cc_addresses?: string[]
  bcc_addresses?: string[]
}

export type FieldRequirement = 'optional' | 'on_submit' | 'on_step'

export interface FormFieldConfigRemote {
  key: string
  step: string
  label: string
  hint: string
  placeholder: string
  visible: boolean
  requirement: FieldRequirement
  locked: boolean
  lock_reason: string
  _origin?: 'db' | 'default'
}

export interface FormConfigRemote {
  ok: boolean
  workspace_slug: string
  workflow_type: string
  schema_version: number
  row_exists: boolean
  steps: Record<string, string>
  fields: Record<string, FormFieldConfigRemote>
  updated?: string[]
}

export interface FormConfigPatchRemote {
  fields: Record<string, Partial<Pick<FormFieldConfigRemote, 'visible' | 'requirement' | 'label' | 'hint' | 'placeholder'>>>
}

export interface HelpTopicRemote {
  question: string
  answer: string
  keywords: string[]
}

export interface HelpConfigRemote {
  ok?: boolean
  workspace_slug?: string
  row_exists?: boolean
  enabled: boolean
  button_label: string
  title: string
  subtitle: string
  welcome_message: string
  fallback_message: string
  topics: HelpTopicRemote[]
}

export interface PortalProjectRemote {
  id: string; title: string; artist: string; release_type: string
  release_date?: string | null; status: string; genre?: string; track_count: number
  cover_status: 'ok' | 'pending' | 'unknown'; audio_status: 'ok' | 'pending' | 'unknown'
  isrc_status: 'generated' | 'pending' | 'unknown'; sync_status: string; created_at?: string | null
}

export interface PortalStageRemote {
  id: string; project_id: string; project: string; name: string; macroarea: string
  status: string; active: boolean; responsible: string; start_date?: string | null
  end_date?: string | null; completion_date?: string | null; release_date?: string | null; risk: string
}

export interface PortalDemandRemote {
  id: string; ticket: string; product: string; type: string; status: string
  release_date?: string | null; deadline?: string | null; days_remaining?: number | string | null
  upload_status: string; project_id?: string; project_title?: string
  file_links?: { label: string; url: string }[]
}

export interface PortalDataRemote {
  ok: boolean; workspace_slug: string; source: 'airtable' | 'supabase'; source_error?: string | null
  projects: PortalProjectRemote[]; stages: PortalStageRemote[]; demands: PortalDemandRemote[]
  invites: InviteRemotePayload[]
  drive_folders: { submission_id: string; project: string; project_id?: string; folder_id: string; url: string; created_at?: string | null }[]
  email_activity: { submission_id: string; project: string; status: string; sent_at?: string | null }[]
  sync_summary: { total: number; synced: number; failed: number }
  integrations: Record<string, { configured: boolean; status: string }>
}

export type EditPolicy = 'link_after_submit' | 'admin_authorized' | 'disabled'
export interface EditConfigRemote {
  ok: boolean
  workspace_slug: string
  workflows: Record<string, { policy: EditPolicy }>
}
export interface EditAccessItemRemote {
  record_id: string
  workflow_type: 'company_registry' | 'people_registry'
  title: string
  email: string
  created_at?: string | null
}
export interface EditAccessListRemote { ok: boolean; items: EditAccessItemRemote[] }
export interface EditAccessIssueRemote {
  ok: boolean; record_id: string; workflow_type: string; to_email: string
  edit_url: string; email_status?: string | null
}

export type OnboardingOperationType = 'label' | 'artist_management' | 'publisher' | 'agency' | 'distributor' | 'independent_artist' | 'other'
export type OnboardingTeamSize = '1' | '2-5' | '6-15' | '16+'
export type OnboardingMonthlyVolume = '1-10' | '11-50' | '51-200' | '200+'
export type OnboardingIntegration = 'airtable' | 'google_drive' | 'email' | 'slack' | 'webhooks'

export interface OnboardingProfileRemote {
  operationType: OnboardingOperationType
  teamSize: OnboardingTeamSize
  monthlyVolume: OnboardingMonthlyVolume
  workflowTypes: string[]
  integrations: OnboardingIntegration[]
  primaryGoal: string
}

export interface OnboardingInitialRemote {
  workspaceSlug: string
  workspaceName: string
  planId: string
  accessMode: 'plan' | 'custom'
  selfService: boolean
  provisioningMode: 'self_service' | 'profile_only'
  allowedWorkflowTypes: string[]
  enabledWorkflowTypes: string[]
  provisionedWorkflowTypes: string[]
  profile: OnboardingProfileRemote
  completedAt: string | null
}

export interface OnboardingPreviewRemote {
  workspaceSlug: string
  planId: string
  accessMode: 'plan' | 'custom'
  selfService: boolean
  provisioningMode: 'self_service' | 'profile_only'
  profile: OnboardingProfileRemote
  enabledWorkflows: string[]
  changes: { key: string; title: string; detail: string }[]
  warnings: string[]
  warningCodes?: ('free_asset_retention_60_days' | 'managed_profile_only')[]
  previewToken: string
  expiresAt: string
  completedAt?: string
}

export interface SignupRemote {
  workspace_slug?: string
  plan_intent?: 'starter' | 'pro' | null
  requires_email_confirmation?: boolean
}

export const api = {
  lookupArtists: (query: string, workspace = WORKSPACE) =>
    get<PeopleLookupResponse>(`/people-registry/lookup?workspace_slug=${encodeURIComponent(workspace)}&roles=artista&limit=8&query=${encodeURIComponent(query)}`),

  /* pendente no backend: endpoint de averiguação 2 bases (pacote Codex, tarefa 1) */
  verifyPerson: (query: string, workspace = WORKSPACE) =>
    get<VerifyPersonResponse>(`/people-registry/verify?workspace_slug=${encodeURIComponent(workspace)}&query=${encodeURIComponent(query)}`),

  /* existe na branch do Codex: GET marca o convite como "opened" */
  getInvite: (token: string) =>
    get<InviteRemoteResponse>(`/people-registry/invites/${encodeURIComponent(token)}`),

  /* existe na branch do Codex: cria o cadastro contextual e vincula à parte do clearance.
     O envelope segue docs/people-invite-front-mapping.md — montado por
     app/src/forms/peopleAdapter.ts (buildInviteEnvelope). */
  respondInvite: (token: string, envelope: Record<string, unknown>) =>
    send<InviteRemoteResponse>('POST', `/people-registry/invites/${encodeURIComponent(token)}/records`, envelope),

  getDriveConfig: (workflowType: string, workspace = WORKSPACE) =>
    get<DriveConfigRemote>(`/workspaces/${encodeURIComponent(workspace)}/workflows/${workflowType}/drive-config`),

  patchDriveConfig: (workflowType: string, cfg: DriveConfigRemote, workspace = WORKSPACE) =>
    send<DriveConfigRemote>('PATCH', `/workspaces/${encodeURIComponent(workspace)}/workflows/${workflowType}/drive-config`, cfg),

  getEmailConfig: (workspace: string, workflowType = 'release_intake') =>
    get<EmailConfigRemote>(`/workspaces/${encodeURIComponent(workspace)}/workflows/${encodeURIComponent(workflowType)}/email-config`),

  patchEmailConfig: (workspace: string, cfg: EmailConfigPatchRemote, workflowType = 'release_intake') =>
    send<EmailConfigRemote>('PATCH', `/workspaces/${encodeURIComponent(workspace)}/workflows/${encodeURIComponent(workflowType)}/email-config`, cfg),

  getFormConfig: (workspace: string, workflowType = 'release_intake') =>
    get<FormConfigRemote>(`/workspaces/${encodeURIComponent(workspace)}/workflows/${encodeURIComponent(workflowType)}/form-config`),

  patchFormConfig: (workspace: string, cfg: FormConfigPatchRemote, workflowType = 'release_intake') =>
    send<FormConfigRemote>('PATCH', `/workspaces/${encodeURIComponent(workspace)}/workflows/${encodeURIComponent(workflowType)}/form-config`, cfg),

  getHelpConfig: (workspace: string) =>
    get<HelpConfigRemote>(`/workspaces/${encodeURIComponent(workspace)}/help-config`),

  patchHelpConfig: (workspace: string, cfg: HelpConfigRemote) =>
    send<HelpConfigRemote>('PATCH', `/workspaces/${encodeURIComponent(workspace)}/help-config`, cfg),

  getPortalData: (workspace: string) =>
    get<PortalDataRemote>(`/workspaces/${encodeURIComponent(workspace)}/portal-data`),

  getEditConfig: (workspace: string) =>
    get<EditConfigRemote>(`/workspaces/${encodeURIComponent(workspace)}/edit-config`),

  patchEditConfig: (workspace: string, workflowType: string, policy: EditPolicy) =>
    send<{ ok: boolean; policy: EditPolicy }>('PATCH', `/workspaces/${encodeURIComponent(workspace)}/workflows/${encodeURIComponent(workflowType)}/edit-config`, { policy }),

  getEditAccess: (workspace: string) =>
    get<EditAccessListRemote>(`/workspaces/${encodeURIComponent(workspace)}/edit-access`),

  issueEditAccess: (workspace: string, workflowType: string, recordId: string) =>
    send<EditAccessIssueRemote>('POST', `/workspaces/${encodeURIComponent(workspace)}/edit-access/${encodeURIComponent(workflowType)}/${encodeURIComponent(recordId)}`, {}),

  getOnboarding: (workspace: string) =>
    get<{ ok: boolean; data: OnboardingInitialRemote }>(`/workspaces/${encodeURIComponent(workspace)}/onboarding`),

  configureOnboarding: (
    workspace: string,
    operation: 'preview_patch' | 'apply_patch',
    profile: OnboardingProfileRemote,
    previewToken?: string,
  ) => sendAction<OnboardingPreviewRemote>(`/workspaces/${encodeURIComponent(workspace)}/onboarding`, {
    operation,
    profile,
    preview_token: previewToken,
  }),

  signup: (payload: {
    name: string
    email: string
    workspace_name: string
    plan_intent?: string | null
    terms_accepted: boolean
    company_website: string
    form_started_at: number
  }) => sendAction<SignupRemote>('/auth/signup', payload),

  requestMagicLink: (email: string, companyWebsite = '') =>
    sendAction<Record<string, never>>('/auth/magic-link', { email, company_website: companyWebsite }),
}
