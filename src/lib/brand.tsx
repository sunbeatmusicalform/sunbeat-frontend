/* Marca do tenant (workspace_branding) — consumo client-side.
   Fonte pública: GET /workspaces/{slug}/workflow-config -> branding
   Edição: PATCH /workspaces/{slug}/branding com X-Portal-Token (sessão do portal). */
import { useEffect, useState, type ReactNode } from 'react'
import { apiBase, apiEnabled } from './api'

export interface WorkspaceBranding {
  workspace_slug: string
  workspace_name?: string | null
  slogan?: string | null
  form_title?: string | null
  intro_text?: string | null
  success_message?: string | null
  logo_url?: string | null
  banner_url?: string | null
  badge_url?: string | null
  social_image_url?: string | null
  social_title?: string | null
  social_description?: string | null
  form_bg_color?: string | null
  primary_color?: string | null
}

declare global {
  interface Window {
    __INITIAL_BRANDING__?: WorkspaceBranding
  }
}

const SS_PORTAL_TOKEN = 'sunbeat-portal-token'

export function portalToken(): string | null {
  try { return sessionStorage.getItem(SS_PORTAL_TOKEN) } catch { return null }
}

export function setPortalToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(SS_PORTAL_TOKEN, token)
    else sessionStorage.removeItem(SS_PORTAL_TOKEN)
  } catch { /* ignore */ }
}

export async function createPortalSession(workspace: string, password: string): Promise<string | null> {
  try {
    const res = await fetch(`${apiBase()}/workspaces/${workspace}/portal-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { token?: string }
    if (json.token) setPortalToken(json.token)
    return json.token ?? null
  } catch {
    return null
  }
}

export async function fetchBranding(workspace: string): Promise<WorkspaceBranding | null> {
  // Prioridade 1: branding injetado pelo SSR no HTML
  if (typeof window !== 'undefined' && window.__INITIAL_BRANDING__?.workspace_slug === workspace) {
    return window.__INITIAL_BRANDING__
  }
  // Prioridade 2: API (fallback)
  if (!apiEnabled()) return null
  try {
    const res = await fetch(`${apiBase()}/workspaces/${workspace}/workflow-config`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { branding?: WorkspaceBranding | null }
    return json.branding ?? null
  } catch {
    return null
  }
}

export async function patchBranding(
  workspace: string,
  fields: Partial<WorkspaceBranding>,
): Promise<{ ok: boolean; updated?: string[]; error?: string }> {
  const token = portalToken()
  if (!token) return { ok: false, error: 'sessão do portal ausente — entre novamente pela tela de senha' }
  try {
    const res = await fetch(`${apiBase()}/workspaces/${workspace}/branding`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Portal-Token': token,
      },
      body: JSON.stringify(fields),
    })
    if (res.status === 401) return { ok: false, error: 'sessão expirada — entre novamente pela tela de senha' }
    if (!res.ok) return { ok: false, error: `erro ${res.status} ao salvar` }
    const json = (await res.json()) as { updated?: string[] }
    return { ok: true, updated: json.updated }
  } catch {
    return { ok: false, error: 'falha de rede ao salvar' }
  }
}

/** Hook: marca do workspace (null enquanto carrega / se API desligada). */
export function useBranding(workspace: string) {
  const [branding, setBranding] = useState<WorkspaceBranding | null>(() => {
    // Estado inicial: usa branding do SSR se disponível
    if (typeof window !== 'undefined' && window.__INITIAL_BRANDING__?.workspace_slug === workspace) {
      return window.__INITIAL_BRANDING__
    }
    return null
  })
  const [loaded, setLoaded] = useState(branding !== null)
  useEffect(() => {
    let alive = true
    // Se já temos branding do SSR, não precisa buscar de novo
    if (branding) return
    fetchBranding(workspace).then((b) => {
      if (!alive) return
      setBranding(b)
      setLoaded(true)
    })
    return () => { alive = false }
  }, [workspace, branding])
  return { branding, loaded, reload: () => fetchBranding(workspace).then(setBranding) }
}

/** Logo do tenant: <img> quando há logo_url, senão fallback (componente da marca atual). */
export function BrandLogo({
  branding, size = 36, fallback,
}: { branding: WorkspaceBranding | null; size?: number; fallback: ReactNode }) {
  if (branding?.logo_url) {
    return (
      <img
        src={branding.logo_url}
        alt={branding.workspace_name ?? 'logo'}
        style={{ height: size, width: 'auto', objectFit: 'contain' }}
      />
    )
  }
  return <>{fallback}</>
}
