import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { Lock, LogOut } from 'lucide-react'
import { AtabaqueMark } from '../components/AtabaqueMark'
import { SunbeatLogo } from '../components/SunbeatLogo'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Textarea } from '../components/ui/textarea'
import { HelpChat } from '../components/HelpChat'
import { EmailConfig } from './EmailConfig'
import { FormConfig } from './FormConfig'
import { VERDICT_STYLE, type LookupResult, type PersonBaseHit } from '../forms/invites'
import { api, apiEnabled, type OnboardingInitialRemote, type PortalDataRemote } from '../lib/api'
import { useBranding, patchBranding, createPortalSession, portalToken, setPortalToken, BrandLogo, type WorkspaceBranding } from '../lib/brand'
import { LiveAirtable, LiveDriveFolders, LiveIntegrations, LiveInvites, LiveOverview, LiveTables } from './LivePortalData'
import { OnboardingPanel } from './OnboardingPanel'

/* ---------- Abas ---------- */
type Tab = 'onboarding' | 'geral' | 'tables' | 'convites' | 'integracoes' | 'formulario' | 'emails' | 'drive' | 'airtable' | 'marca'
const TABS: { key: Tab; label: string }[] = [
  { key: 'onboarding', label: 'MotoSchema' },
  { key: 'geral', label: 'Visão geral' },
  { key: 'tables', label: 'Demandas operacionais' },
  { key: 'convites', label: 'Convites' },
  { key: 'integracoes', label: 'Integrações' },
  { key: 'formulario', label: 'Formulário' },
  { key: 'emails', label: 'E-mails' },
  { key: 'drive', label: 'Drive' },
  { key: 'airtable', label: 'Airtable' },
  { key: 'marca', label: 'Minha marca' },
]
const SELF_SERVICE_TABS = new Set<Tab>(['onboarding', 'formulario', 'marca'])

/* ---------- Verificação de cadastro nas duas bases ---------- */
function PeopleLookupCard() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<LookupResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function runLookup() {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    const remote = await api.verifyPerson(query)
    if (remote?.ok) {
      const hit: PersonBaseHit | undefined =
        remote.dados_cadastrais || remote.v2_pessoas
          ? {
              nome: remote.v2_pessoas?.display_name ?? remote.dados_cadastrais?.display_name ?? query,
              dadosCadastrais: remote.dados_cadastrais
                ? { id: remote.dados_cadastrais.record_id, status: `match por ${remote.dados_cadastrais.match_by}` }
                : undefined,
              v2Pessoas: remote.v2_pessoas
                ? { id: remote.v2_pessoas.record_id, status: `match por ${remote.v2_pessoas.match_by}` }
                : undefined,
            }
          : undefined
      setResult({ hit, verdict: remote.verdict, acao: remote.acao })
    } else {
      setError('A verificação real está temporariamente indisponível. Nenhum resultado demonstrativo foi exibido.')
    }
    setLoading(false)
  }

  return (
    <div className="sun-card p-4">
      <p className="text-[13px] font-bold text-[#512314]">Verificar cadastro antes de convidar</p>
      <p className="mt-0.5 text-[12px] text-[#512314]/60">
        Averiguação cruzada nas duas tabelas de pessoas da Workstation Atabaque: <code>Dados Cadastrais</code> (base viva de artistas)
        + <code>[V2] - Pessoas</code> (cadastro operacional). O veredito decide: vincular existente ou gerar convite.
        {apiEnabled() && <span className="ml-1 rounded-full bg-[#16a34a]/15 px-2 py-0.5 text-[10px] font-semibold text-[#166534]">API real conectada</span>}
      </p>
      <div className="mt-3 flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runLookup()}
          placeholder="Nome, documento ou e-mail — ex.: Zé Raminho, Banda Farol, alaide@email.com"
          className="h-9 flex-1 rounded-full border border-[#512314]/20 bg-white/60 px-4 text-[12px] outline-none focus:border-[#512314]/50" />
        <button onClick={runLookup} disabled={loading}
          className="rounded-full bg-[#512314] px-4 py-1.5 text-[12px] font-bold text-[#ebdbba] hover:opacity-90">
          {loading ? 'verificando…' : 'verificar'}
        </button>
      </div>

      {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}

      {result && (
        <div className="mt-3 rounded-2xl border border-[#512314]/15 bg-white/50 p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${VERDICT_STYLE[result.verdict].cls}`}>
              {VERDICT_STYLE[result.verdict].label}
            </span>
            {result.hit && <span className="text-[13px] font-bold text-[#512314]">{result.hit.nome}</span>}
            <span className="ml-auto rounded-full bg-[#16a34a]/15 px-2 py-0.5 text-[10px] font-semibold text-[#166534]">fonte: Airtable real (2 tabelas)</span>
          </div>
          {result.hit && (
            <div className="mt-2 grid gap-2 text-[11.5px] sm:grid-cols-2">
              <div className="rounded-xl bg-[#512314]/5 p-2.5">
                <p className="font-semibold text-[#512314]/60">Dados Cadastrais (base viva)</p>
                {result.hit.dadosCadastrais
                  ? <p className="text-[#512314]">{result.hit.dadosCadastrais.id} · {result.hit.dadosCadastrais.status}</p>
                  : <p className="text-[#512314]/50">sem registro</p>}
              </div>
              <div className="rounded-xl bg-[#512314]/5 p-2.5">
                <p className="font-semibold text-[#512314]/60">[V2] - Pessoas</p>
                {result.hit.v2Pessoas
                  ? <p className="text-[#512314]">{result.hit.v2Pessoas.id} · {result.hit.v2Pessoas.status}</p>
                  : <p className="text-[#512314]/50">sem registro</p>}
              </div>
            </div>
          )}
          <p className="mt-2 text-[12px] font-semibold text-[#512314]/80">→ {result.acao}</p>
        </div>
      )}
    </div>
  )
}

/* ---------- Painel de configuração de pastas do Drive ----------
   Lógica visível e editável por workflow: cadeia de resolução, raiz,
   subpastas padrão e travas de segurança. Persiste em localStorage. */
type DrivePanelItem = {
  root: string
  subfolders: string[]
  rootMode: string
  artistPattern: string
  warnings: string[]
}

const DRIVE_WORKFLOWS = [
  ['release_intake', 'Lançamentos (intake)'],
  ['rights_clearance', 'Clearance'],
  ['people_registry', 'Pessoas'],
  ['company_registry', 'Empresas'],
] as const

function DriveConfigPanel({ workspace, driveConfigured }: { workspace: string; driveConfigured: boolean }) {
  const [cfg, setCfg] = useState<Record<string, DrivePanelItem>>({})
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const results = await Promise.all(DRIVE_WORKFLOWS.map(([workflow]) => api.getDriveConfig(workflow, workspace)))
      if (cancelled) return
      const next: Record<string, DrivePanelItem> = {}
      results.forEach((remote, idx) => {
        if (!remote) return
        next[DRIVE_WORKFLOWS[idx][0]] = {
          root: String(remote.overrides?.root_folder_id ?? ''),
          subfolders: remote.subfolders ?? [],
          rootMode: remote.root_mode ?? 'unmapped',
          artistPattern: remote.artist_folder_pattern ?? '',
          warnings: remote.warnings ?? [],
        }
      })
      setCfg(next)
      setLoaded(true)
    })()
    return () => { cancelled = true }
  }, [workspace])

  function update(workflow: string, patch: Partial<DrivePanelItem>) {
    setCfg((current) => ({
      ...current,
      [workflow]: {
        ...(current[workflow] ?? { root: '', subfolders: [], rootMode: 'unmapped', artistPattern: '', warnings: [] }),
        ...patch,
      },
    }))
    setSaved(false)
  }

  async function save() {
    const results = await Promise.all(
      DRIVE_WORKFLOWS.map(([workflow]) => {
        const item = cfg[workflow]
        if (!item) return Promise.resolve(null)
        return api.patchDriveConfig(workflow, {
          workflow_type: workflow,
          subfolders: item.subfolders,
          overrides: { root_folder_id: item.root || null },
        }, workspace)
      }),
    )
    setSaved(results.some(Boolean))
  }

  return (
    <div className="sun-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[#512314]">Configuração de pastas por workflow</h3>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className={`rounded-full px-2 py-0.5 text-[10px] ${loaded ? 'bg-[#16a34a]/15 text-[#166534]' : 'bg-[#512314]/10 text-[#512314]/55'}`}>
            fonte: {loaded ? 'backend do workspace' : 'indisponível'}
          </span>
          {saved && <span className="text-[#166534]">✓ salvo</span>}
          <button className="rounded-full bg-[#512314] px-3.5 py-1.5 text-[#ebdbba] hover:opacity-90"
            onClick={save} disabled={!loaded}>
            salvar configuração
          </button>
        </div>
      </div>
      <p className="mt-0.5 text-[12px] text-[#512314]/60">
        Como a Sunbeat localiza ou cria pastas no envio de cada formulário. Editável internamente —
        na produção vira configuração do workspace, sem deploy.
      </p>

      <div className="mt-4 rounded-2xl border border-[#16a34a]/25 bg-[#16a34a]/8 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#16a34a]/15 px-2.5 py-1 text-[10px] font-bold text-[#166534]">✓ Intake conectado ao Google Drive da Atabaque</span>
          <span className="text-[11px] font-semibold text-[#512314]/65">roteamento automático por cliente/artista</span>
        </div>
        <p className="mt-2 text-[12px] text-[#512314]/75">
          No envio do formulário, a Sunbeat identifica o cliente no Airtable, localiza sua pasta no Drive e cria a pasta <strong>Projetos</strong> quando necessário.
          Depois cria uma pasta para o lançamento e envia cada arquivo para o destino correto.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[#512314]/75">
          <span className="rounded-lg bg-white/55 px-2 py-1">Clientes</span><span>→</span>
          <span className="rounded-lg bg-white/55 px-2 py-1">Artista</span><span>→</span>
          <span className="rounded-lg bg-white/55 px-2 py-1">Projetos</span><span>→</span>
          <span className="rounded-lg bg-white/55 px-2 py-1">Single/EP/Álbum_Título</span><span>→</span>
          <span className="rounded-lg bg-white/55 px-2 py-1">Áudios · Capa · Imprensa · Imagens e Vídeos · Outros</span>
        </div>
        <p className="mt-2 text-[11px] text-[#512314]/60">
          Capa → <strong>Capa</strong> · masters das faixas → <strong>Áudios</strong> · anexos adicionais → <strong>Outros</strong>. A pasta raiz não aparece como um ID fixo porque é resolvida individualmente para cada cliente.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {DRIVE_WORKFLOWS.map(([workflow, label]) => {
          const item = cfg[workflow] ?? { root: '', subfolders: [], rootMode: 'unmapped', artistPattern: '', warnings: [] }
          const dynamicIntake = workflow === 'release_intake' && item.rootMode === 'mirror_v2_clientes' && driveConfigured
          const fixedDestination = Boolean(item.root)
          return (
          <div key={workflow} className="rounded-2xl border border-[#512314]/15 bg-white/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-bold text-[#512314]">{label}</p>
              {dynamicIntake
                ? <span className="rounded-full bg-[#16a34a]/15 px-2 py-0.5 text-[10px] font-semibold text-[#166534]">ativo — pasta criada por cliente</span>
                : fixedDestination
                ? <span className="rounded-full bg-[#16a34a]/15 px-2 py-0.5 text-[10px] font-semibold text-[#166534]">destino ativo</span>
                : item.rootMode === 'unmapped'
                  ? <span className="rounded-full bg-[#512314]/10 px-2 py-0.5 text-[10px] font-semibold text-[#512314]/60">sem roteamento de arquivos</span>
                  : <span className="rounded-full bg-[#ffb53e]/25 px-2 py-0.5 text-[10px] font-semibold text-[#8a5b00]">configuração do workflow</span>}
            </div>
            {dynamicIntake && (
              <p className="mt-2 text-[11px] font-medium text-[#166534]">
                Lógica ativa: {item.artistPattern || 'Clientes/{Artista}/Projetos'} → pasta do lançamento. Não depende de uma pasta raiz única.
              </p>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#512314]/50">Override manual de pasta raiz {dynamicIntake && '(opcional)'}</span>
                <input value={item.root} onChange={(e) => update(workflow, { root: e.target.value })}
                  placeholder={dynamicIntake ? 'vazio = usar automaticamente a pasta do cliente' : 'ID de pasta, quando aplicável'}
                  className="mt-1 h-8 w-full rounded-lg border border-[#512314]/20 bg-white/70 px-3 text-[12px] outline-none focus:border-[#512314]/50" />
              </label>
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#512314]/50">Subpastas padrão (separadas por vírgula)</span>
                <input value={item.subfolders.join(', ')} onChange={(e) => update(workflow, { subfolders: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  className="mt-1 h-8 w-full rounded-lg border border-[#512314]/20 bg-white/70 px-3 text-[12px] outline-none focus:border-[#512314]/50" />
              </label>
            </div>

          </div>
        )})}
      </div>
    </div>
  )
}

/* ---------- Cadeado de acesso (por tenant) ---------- */
const portalAuthKey = (ws: string) => `sunbeat-portal-${ws}-auth`

function restoreMagicLinkSession(workspace: string) {
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const token = fragment.get('portal_token')
  if (!token) return false
  setPortalToken(token)
  sessionStorage.setItem(portalAuthKey(workspace), '1')
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
  return true
}

function PortalGate({ workspace, displayName, onUnlock }: { workspace: string; displayName: string; onUnlock: () => void }) {
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setChecking(true)
    const token = await createPortalSession(workspace, pass)
    if (token) {
      sessionStorage.setItem(portalAuthKey(workspace), '1')
      onUnlock()
    } else {
      setError(true)
      setPass('')
    }
    setChecking(false)
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form onSubmit={submit} className="sun-card w-full max-w-sm p-8 text-center">
        <div className="flex justify-center"><span className="rounded-lg bg-primary px-4 py-2"><SunbeatLogo className="h-6" /></span></div>
        <h1 className="mt-6 text-xl font-semibold text-foreground">Área do cliente · {displayName}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Área restrita à equipe e parceiros da operação. Digite a senha de acesso.
        </p>
        <Input
          type="password"
          value={pass}
          onChange={(e) => { setPass(e.target.value); setError(false) }}
          placeholder="Senha de acesso"
          autoComplete="new-password"
          autoFocus
          className="mt-5 h-11"
        />
        {error && <p className="mt-2 text-xs font-semibold text-red-700">Senha incorreta ou serviço indisponível. Tente novamente.</p>}
        <Button
          type="submit"
          disabled={checking || !pass}
          className="mt-4 h-11 w-full"
        >
          {checking ? 'Verificando…' : 'Entrar'}
        </Button>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock size={11} /> Acesso monitorado pela Sunbeat
        </p>
      </form>
    </div>
  )
}

/* ---------- Minha marca (branding do tenant) ---------- */
const BRAND_FIELDS: { key: keyof WorkspaceBranding; label: string; placeholder?: string; textarea?: boolean }[] = [
  { key: 'workspace_name', label: 'Nome do workspace', placeholder: 'Nome da sua operação' },
  { key: 'slogan', label: 'Slogan', placeholder: 'Uma frase que represente sua marca' },
  { key: 'form_title', label: 'Título dos formulários' },
  { key: 'intro_text', label: 'Texto de introdução', textarea: true },
  { key: 'success_message', label: 'Mensagem de sucesso (pós-envio)', textarea: true },
]

function BrandingTab({ workspace }: { workspace: string }) {
  const { branding, loaded, reload } = useBranding(workspace)
  const [form, setForm] = useState<Partial<WorkspaceBranding>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!branding) return
    const task = window.setTimeout(() => setForm((current) => ({ ...branding, ...current })), 0)
    return () => window.clearTimeout(task)
  }, [branding])

  function set<K extends keyof WorkspaceBranding>(key: K, value: WorkspaceBranding[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      if (dataUrl.length > 400_000) {
        setMsg({ ok: false, text: 'Logo muito pesada (máx. ~300 KB). Exporte uma versão menor.' })
        return
      }
      set('logo_url', dataUrl)
      setMsg(null)
    }
    reader.readAsDataURL(file)
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    const { workspace_slug, ...fields } = form
    void workspace_slug
    const r = await patchBranding(workspace, fields)
    setSaving(false)
    if (r.ok) {
      setMsg({ ok: true, text: `Marca atualizada (${(r.updated ?? []).length} campos). Já vale nos formulários.` })
      void reload()
    } else {
      setMsg({ ok: false, text: r.error ?? 'erro ao salvar' })
    }
  }

  if (!loaded) return <div className="mt-6 text-sm text-muted-foreground">Carregando marca…</div>

  const fallback = workspace === 'atabaque'
    ? <AtabaqueMark size={48} />
    : <span className="grid size-14 place-items-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">{(form.workspace_name || workspace).charAt(0).toUpperCase()}</span>

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
        <CardTitle className="text-base">Identidade da operação</CardTitle>
        <CardDescription>
          Logo, nome, cores e textos exibidos nos formulários públicos (intake, clearance, people, company). As mudanças valem na hora.
        </CardDescription>
        </CardHeader>
        <CardContent>

        <div className="mt-5 flex items-start gap-5">
          <div>
            <Label className="mb-2 text-xs text-muted-foreground">Logo atual</Label>
            <div className="flex h-20 w-40 items-center justify-center rounded-xl border bg-muted/35 p-2">
              <BrandLogo branding={form as WorkspaceBranding} size={56} fallback={fallback} />
            </div>
          </div>
          <div className="flex-1">
            <Label className="mb-2 text-xs text-muted-foreground">Trocar logo</Label>
            <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={onLogoFile}
              className="text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-medium file:text-primary-foreground" />
            <p className="mt-2 text-xs text-muted-foreground">PNG/SVG/WebP até ~300 KB — ou informe uma URL:</p>
            <Input value={form.logo_url ?? ''} onChange={(e) => set('logo_url', e.target.value)}
              placeholder="https://sua-marca.com/logo.svg" className="mt-2" />
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {BRAND_FIELDS.map((f) => (
            <div key={f.key} className={f.textarea ? 'sm:col-span-2' : ''}>
              <Label className="mb-2 text-xs text-muted-foreground">{f.label}</Label>
              {f.textarea ? (
                <Textarea rows={3} value={(form[f.key] as string) ?? ''} onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder} />
              ) : (
                <Input value={(form[f.key] as string) ?? ''} onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder} />
              )}
            </div>
          ))}
          <div>
            <Label className="mb-2 text-xs text-muted-foreground">Cor primária</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primary_color ?? '#0ea5e9'} onChange={(e) => set('primary_color', e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border bg-transparent" />
              <Input value={form.primary_color ?? ''} onChange={(e) => set('primary_color', e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="mb-2 text-xs text-muted-foreground">Cor de fundo do formulário</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.form_bg_color ?? '#f8fafc'} onChange={(e) => set('form_bg_color', e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border bg-transparent" />
              <Input value={form.form_bg_color ?? ''} onChange={(e) => set('form_bg_color', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar marca'}
          </Button>
          {msg && (
            <p className={`text-[12px] font-semibold ${msg.ok ? 'text-[#166534]' : 'text-red-700'}`}>{msg.text}</p>
          )}
        </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Portal() {
  const { workspace = 'atabaque' } = useParams()
  const displayName = workspace.charAt(0).toUpperCase() + workspace.slice(1)
  const [tab, setTab] = useState<Tab>('onboarding')
  const [unlocked, setUnlocked] = useState(
    () => restoreMagicLinkSession(workspace) || (sessionStorage.getItem(portalAuthKey(workspace)) === '1' && Boolean(portalToken())),
  )
  const { branding } = useBranding(workspace)
  const [portalData, setPortalData] = useState<PortalDataRemote | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [access, setAccess] = useState<OnboardingInitialRemote | null>(null)

  async function loadPortalData() {
    setPortalLoading(true)
    setPortalData(await api.getPortalData(workspace))
    setPortalLoading(false)
  }

  async function logout() {
    await api.logout()
    sessionStorage.removeItem(portalAuthKey(workspace))
    setPortalToken(null)
    setPortalData(null)
    setUnlocked(false)
  }

  useEffect(() => {
    if (!unlocked) return
    let cancelled = false
    Promise.resolve().then(async () => {
      if (cancelled) return
      const onboarding = await api.getOnboarding(workspace)
      if (cancelled) return
      setAccess(onboarding?.data ?? null)
      setPortalLoading(true)
      const data = await api.getPortalData(workspace)
      if (cancelled) return
      setPortalData(data)
      setPortalLoading(false)
    })
    return () => { cancelled = true }
  }, [unlocked, workspace])

  const liveProps = { data: portalData, loading: portalLoading, reload: () => { void loadPortalData() } }
  const activeTab = access?.selfService && !SELF_SERVICE_TABS.has(tab) ? 'onboarding' : tab
  const visibleTabs = access === null
    ? TABS.filter((item) => item.key === 'onboarding')
    : access.selfService
      ? TABS.filter((item) => SELF_SERVICE_TABS.has(item.key))
      : TABS
  const logoFallback = workspace === 'atabaque'
    ? <AtabaqueMark size={36} />
    : <span className="grid h-9 w-9 place-items-center rounded-full bg-[#512314] text-sm font-black text-[#ebdbba]">S</span>
  if (!unlocked && workspace !== 'atabaque') return <Navigate to="/login" replace />
  if (!unlocked) return <PortalGate workspace={workspace} displayName={branding?.workspace_name ?? displayName} onUnlock={() => setUnlocked(true)} />
  return (
    <div className="portal-shell mx-auto max-w-6xl px-4 pb-16">
      <header className="flex items-center justify-between py-5">
        <div className="flex items-center gap-3">
          <BrandLogo branding={branding} size={36} fallback={logoFallback} />
          <div>
            <p className="text-base font-semibold leading-none text-foreground">{branding?.workspace_name ?? displayName}</p>
            <p className="mt-1 text-xs text-muted-foreground">Sunbeat · área do cliente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="sun-chip hidden items-center gap-1.5 sm:flex"><Lock size={12} /> Restrito a parceiros</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void logout()} aria-label="Encerrar sessão">
            <LogOut size={12} /> Sair
          </Button>
        </div>
      </header>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Área do cliente</h1>
        <span className="sun-chip">{branding?.workspace_name ?? displayName} · Operação</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Acompanhe os formulários, as integrações e o andamento da operação em tempo real.
      </p>

      <Tabs value={activeTab} onValueChange={(value) => setTab(value as Tab)} className="mt-6">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-lg bg-muted/70 p-1">
          {visibleTabs.map((t) => <TabsTrigger key={t.key} value={t.key} className="min-h-8 flex-none px-4">{t.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {activeTab === 'geral' && <LiveOverview {...liveProps} />}

      {activeTab === 'onboarding' && <OnboardingPanel workspace={workspace} />}

      {activeTab === 'tables' && <LiveTables {...liveProps} />}

      {activeTab === 'marca' && <BrandingTab workspace={workspace} />}

      {activeTab === 'emails' && <EmailConfig workspace={workspace} />}

      {activeTab === 'formulario' && <FormConfig workspace={workspace} selfService={Boolean(access?.selfService)} />}

      {activeTab === 'convites' && (
        <div className="mt-6 space-y-4">
          <PeopleLookupCard />
          <div className="sun-card p-4">
            <p className="text-[13px] text-[#512314]/75">
              <strong>Convites de cadastro (people links)</strong> — criados a partir de partes faltantes nos casos de
              clearance. Cada convite abre o formulário de pessoas pré-preenchido com o contexto do caso; ao responder,
              o cadastro é vinculado automaticamente à parte correspondente.
            </p>
          </div>
          <LiveInvites {...liveProps} />
          <p className="text-[11px] text-[#512314]/45">
            Estados: enviado → aberto → respondido. Criação automática de convites no sync do clearance permanece
            desligada até aprovação (flag <code>people_invite_auto_create_enabled</code>).
          </p>
        </div>
      )}

      {activeTab === 'integracoes' && <LiveIntegrations {...liveProps} />}

      {activeTab === 'drive' && (
        <div className="mt-6 space-y-6">
          <DriveConfigPanel workspace={workspace} driveConfigured={Boolean(portalData?.integrations.drive?.configured)} />
          <LiveDriveFolders {...liveProps} />
        </div>
      )}

      {activeTab === 'airtable' && <LiveAirtable {...liveProps} />}
      {activeTab !== 'onboarding' && workspace === 'atabaque' ? <HelpChat clientName={branding?.workspace_name ?? displayName} workspaceSlug={workspace} /> : null}
    </div>
  )
}
