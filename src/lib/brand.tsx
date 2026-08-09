/* Marca do tenant (workspace_branding) — consumo client-side.
   Fonte pública: GET /workspaces/{slug}/workflow-config -> branding
   Edição: PATCH /workspaces/{slug}/branding com X-Portal-Token (sessão do portal). */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
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

const EDITABLE_BRANDING_FIELDS = [
  'workspace_name', 'slogan', 'form_title', 'intro_text', 'success_message',
  'logo_url', 'banner_url', 'badge_url', 'social_image_url', 'social_title',
  'social_description', 'form_bg_color', 'primary_color',
] as const satisfies readonly (keyof WorkspaceBranding)[]

function normalizeHex(value: string | null | undefined): string | null {
  const candidate = value?.trim()
  if (!candidate || !/^#[0-9a-f]{6}$/i.test(candidate)) return null
  return candidate.toLowerCase()
}

function hexToHsl(value: string): { h: number; s: number; l: number; contrast: string } {
  const red = Number.parseInt(value.slice(1, 3), 16) / 255
  const green = Number.parseInt(value.slice(3, 5), 16) / 255
  const blue = Number.parseInt(value.slice(5, 7), 16) / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  const delta = max - min
  let hue = 0
  let saturation = 0

  if (delta > 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1))
    if (max === red) hue = 60 * (((green - blue) / delta) % 6)
    else if (max === green) hue = 60 * ((blue - red) / delta + 2)
    else hue = 60 * ((red - green) / delta + 4)
  }
  if (hue < 0) hue += 360

  const linear = [red, green, blue].map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ))
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
  return {
    h: Math.round(hue),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
    contrast: luminance > 0.42 ? '222 47% 11%' : '42 45% 94%',
  }
}

type ThemeStyle = CSSProperties & Record<`--${string}`, string>

/** Applies tenant colors inside its own form without changing the Sunbeat shell. */
export function workspaceThemeStyle(branding: WorkspaceBranding | null): ThemeStyle {
  const style = {} as ThemeStyle
  const primary = normalizeHex(branding?.primary_color)
  const background = normalizeHex(branding?.form_bg_color)

  if (primary) {
    const color = hexToHsl(primary)
    const token = `${color.h} ${color.s}% ${color.l}%`
    style['--primary'] = token
    style['--primary-foreground'] = color.contrast
    style['--accent'] = token
    style['--accent-foreground'] = color.contrast
    style['--ring'] = token
  }

  if (background) {
    const color = hexToHsl(background)
    const dark = color.contrast.startsWith('42')
    style['--background'] = `${color.h} ${color.s}% ${color.l}%`
    style['--foreground'] = color.contrast
    style['--card'] = dark
      ? `${color.h} ${Math.max(18, color.s - 18)}% ${Math.min(18, color.l + 7)}%`
      : '0 0% 100%'
    style['--card-foreground'] = color.contrast
    style['--muted'] = dark
      ? `${color.h} ${Math.max(14, color.s - 28)}% ${Math.min(22, color.l + 11)}%`
      : `${color.h} ${Math.max(10, color.s - 38)}% 94%`
    style['--muted-foreground'] = dark ? '210 18% 72%' : '215 16% 38%'
    style['--border'] = dark ? `${color.h} 24% 24%` : `${color.h} 24% 84%`
    style['--input'] = style['--border']
  }

  return style
}

export function editableBrandingPayload(fields: Partial<WorkspaceBranding>): Partial<WorkspaceBranding> {
  const payload: Partial<WorkspaceBranding> = {}
  for (const key of EDITABLE_BRANDING_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) payload[key] = fields[key]
  }
  return payload
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

export async function fetchBranding(workspace: string, preferInitial = true): Promise<WorkspaceBranding | null> {
  // Prioridade 1: branding injetado pelo SSR no HTML
  if (preferInitial && typeof window !== 'undefined' && window.__INITIAL_BRANDING__?.workspace_slug === workspace) {
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
      body: JSON.stringify(editableBrandingPayload(fields)),
    })
    if (res.status === 401) return { ok: false, error: 'sessão expirada — entre novamente pela tela de senha' }
    if (!res.ok) {
      let detail = ''
      try {
        const json = (await res.json()) as { detail?: string | Array<{ msg?: string }> }
        detail = Array.isArray(json.detail)
          ? json.detail.map((item) => item.msg).filter(Boolean).join(', ')
          : json.detail ?? ''
      } catch { /* response without JSON */ }
      return { ok: false, error: detail || `erro ${res.status} ao salvar` }
    }
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
  return {
    branding,
    loaded,
    reload: () => fetchBranding(workspace, false).then((next) => {
      setBranding(next)
      if (next && typeof window !== 'undefined') window.__INITIAL_BRANDING__ = next
    }),
  }
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
