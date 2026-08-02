import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Lock } from 'lucide-react'
import { AtabaqueMark } from '../components/AtabaqueMark'
import { HelpChat } from '../components/HelpChat'
import { EmailConfig } from './EmailConfig'
import { FormConfig } from './FormConfig'
import { VERDICT_STYLE, type LookupResult, type PersonBaseHit } from '../forms/invites'
import { api, apiEnabled, type PortalDataRemote } from '../lib/api'
import { useBranding, patchBranding, createPortalSession, portalToken, BrandLogo, type WorkspaceBranding } from '../lib/brand'
import { LiveAirtable, LiveDriveFolders, LiveIntegrations, LiveInvites, LiveOverview, LiveTables } from './LivePortalData'

/* ---------- Abas ---------- */
type Tab = 'geral' | 'tables' | 'convites' | 'integracoes' | 'formulario' | 'emails' | 'drive' | 'airtable' | 'marca'
const TABS: { key: Tab; label: string }[] = [
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

function DriveConfigPanel({ workspace, driveConfigured }: { workspace: string; driveConfigured: boolean }) {
  const workflows = [
    ['release_intake', 'Lançamentos (intake)'],
    ['rights_clearance', 'Clearance'],
    ['people_registry', 'Pessoas'],
    ['company_registry', 'Empresas'],
  ] as const
  const [cfg, setCfg] = useState<Record<string, DrivePanelItem>>({})
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const results = await Promise.all(workflows.map(([workflow]) => api.getDriveConfig(workflow, workspace)))
      if (cancelled) return
      const next: Record<string, DrivePanelItem> = {}
      results.forEach((remote, idx) => {
        if (!remote) return
        next[workflows[idx][0]] = {
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
      workflows.map(([workflow]) => {
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
        {workflows.map(([workflow, label]) => {
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
      <form onSubmit={submit} className="sun-card w-full max-w-sm rounded-3xl p-8 text-center">
        <div className="flex justify-center"><AtabaqueMark size={44} /></div>
        <h1 className="mt-4 text-xl font-bold text-[#512314]">Área do cliente · {displayName}</h1>
        <p className="mt-1.5 text-sm text-[#512314]/60">
          Área restrita à equipe e parceiros da operação. Digite a senha de acesso.
        </p>
        <input
          type="password"
          value={pass}
          onChange={(e) => { setPass(e.target.value); setError(false) }}
          placeholder="Senha de acesso"
          autoComplete="new-password"
          autoFocus
          className="mt-5 w-full rounded-2xl border border-[#512314]/25 bg-transparent px-4 py-3 text-sm text-[#512314] outline-none focus:border-[#512314]/60"
        />
        {error && <p className="mt-2 text-xs font-semibold text-red-700">Senha incorreta ou serviço indisponível. Tente novamente.</p>}
        <button
          type="submit"
          disabled={checking || !pass}
          className="mt-4 w-full rounded-full bg-[#512314] px-6 py-3 text-sm font-bold text-[#ebdbba] transition hover:opacity-90 disabled:opacity-50"
        >
          {checking ? 'Verificando…' : 'Entrar'}
        </button>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#512314]/45">
          <Lock size={11} /> Acesso monitorado pela Sunbeat
        </p>
      </form>
    </div>
  )
}

/* ---------- Minha marca (branding do tenant) ---------- */
const BRAND_FIELDS: { key: keyof WorkspaceBranding; label: string; placeholder?: string; textarea?: boolean }[] = [
  { key: 'workspace_name', label: 'Nome do workspace', placeholder: 'Atabaque' },
  { key: 'slogan', label: 'Slogan', placeholder: 'Um Ritmo de Pensar Música' },
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

  if (!loaded) return <div className="mt-6 text-sm text-[#512314]/60">Carregando marca…</div>

  const inputCls = 'w-full rounded-2xl border border-[#512314]/25 bg-transparent px-4 py-2.5 text-sm text-[#512314] outline-none focus:border-[#512314]/60'

  return (
    <div className="mt-6 space-y-6">
      <div className="sun-card p-5">
        <h3 className="text-[14px] font-semibold text-[#512314]">Identidade da operação nos formulários Sunbeat</h3>
        <p className="mt-0.5 text-[12px] text-[#512314]/60">
          Logo, nome, cores e textos exibidos nos formulários públicos (intake, clearance, people, company). As mudanças valem na hora.
        </p>

        <div className="mt-5 flex items-start gap-5">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">Logo atual</p>
            <div className="flex h-20 w-40 items-center justify-center rounded-2xl border border-[#512314]/15 bg-white/40 p-2">
              <BrandLogo branding={form as WorkspaceBranding} size={56} fallback={<AtabaqueMark size={48} />} />
            </div>
          </div>
          <div className="flex-1">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">Trocar logo</p>
            <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={onLogoFile}
              className="text-[12px] text-[#512314]/70 file:mr-3 file:rounded-full file:border-0 file:bg-[#512314] file:px-4 file:py-1.5 file:text-[12px] file:font-semibold file:text-[#ebdbba]" />
            <p className="mt-1.5 text-[11px] text-[#512314]/45">PNG/SVG/WebP até ~300 KB — ou informe uma URL:</p>
            <input value={form.logo_url ?? ''} onChange={(e) => set('logo_url', e.target.value)}
              placeholder="https://… ou /atabaque-logo.png" className={`${inputCls} mt-2`} />
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {BRAND_FIELDS.map((f) => (
            <div key={f.key} className={f.textarea ? 'sm:col-span-2' : ''}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">{f.label}</p>
              {f.textarea ? (
                <textarea rows={2} value={(form[f.key] as string) ?? ''} onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder} className={inputCls} />
              ) : (
                <input value={(form[f.key] as string) ?? ''} onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder} className={inputCls} />
              )}
            </div>
          ))}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">Cor primária</p>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primary_color ?? '#329fd7'} onChange={(e) => set('primary_color', e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-xl border border-[#512314]/25 bg-transparent" />
              <input value={form.primary_color ?? ''} onChange={(e) => set('primary_color', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#512314]/50">Cor de fundo do formulário</p>
            <div className="flex items-center gap-2">
              <input type="color" value={form.form_bg_color ?? '#ebdbba'} onChange={(e) => set('form_bg_color', e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-xl border border-[#512314]/25 bg-transparent" />
              <input value={form.form_bg_color ?? ''} onChange={(e) => set('form_bg_color', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button onClick={save} disabled={saving}
            className="rounded-full bg-[#512314] px-6 py-2.5 text-sm font-bold text-[#ebdbba] transition hover:opacity-90 disabled:opacity-50">
            {saving ? 'Salvando…' : 'Salvar marca'}
          </button>
          {msg && (
            <p className={`text-[12px] font-semibold ${msg.ok ? 'text-[#166534]' : 'text-red-700'}`}>{msg.text}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Portal() {
  const { workspace = 'atabaque' } = useParams()
  const displayName = workspace.charAt(0).toUpperCase() + workspace.slice(1)
  const [tab, setTab] = useState<Tab>('geral')
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(portalAuthKey(workspace)) === '1' && Boolean(portalToken()),
  )
  const { branding } = useBranding(workspace)
  const [portalData, setPortalData] = useState<PortalDataRemote | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  async function loadPortalData() {
    setPortalLoading(true)
    setPortalData(await api.getPortalData(workspace))
    setPortalLoading(false)
  }

  useEffect(() => {
    if (!unlocked) return
    void loadPortalData()
  }, [unlocked, workspace])

  const liveProps = { data: portalData, loading: portalLoading, reload: () => { void loadPortalData() } }
  if (!unlocked) return <PortalGate workspace={workspace} displayName={branding?.workspace_name ?? displayName} onUnlock={() => setUnlocked(true)} />
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <header className="flex items-center justify-between py-5">
        <div className="flex items-center gap-3">
          <BrandLogo branding={branding} size={36} fallback={<AtabaqueMark size={36} />} />
          <div>
            <p className="text-lg font-bold text-[#512314] leading-none">{branding?.workspace_name ?? displayName}</p>
            <p className="text-[11px] text-[#512314]/60">Sunbeat · área do cliente</p>
          </div>
        </div>
        <span className="sun-chip flex items-center gap-1.5"><Lock size={12} /> Restrito a parceiros</span>
      </header>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-[#512314]">Área do cliente</h1>
        <span className="sun-chip">{branding?.workspace_name ?? displayName} · Operação</span>
      </div>
      <p className="mt-1 text-sm text-[#512314]/65">
        Acompanhe os formulários, as integrações e o andamento da operação em tempo real.
      </p>

      <nav className="mt-5 flex flex-wrap gap-2 border-b border-[#512314]/15 pb-3">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
              tab === t.key ? 'bg-[#512314] text-[#ebdbba]' : 'text-[#512314]/70 hover:bg-[#512314]/8'
            }`}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'geral' && <LiveOverview {...liveProps} />}

      {tab === 'tables' && <LiveTables {...liveProps} />}

      {tab === 'marca' && <BrandingTab workspace={workspace} />}

      {tab === 'emails' && <EmailConfig workspace={workspace} />}

      {tab === 'formulario' && <FormConfig workspace={workspace} />}

      {tab === 'convites' && (
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

      {tab === 'integracoes' && <LiveIntegrations {...liveProps} />}

      {tab === 'drive' && (
        <div className="mt-6 space-y-6">
          <DriveConfigPanel workspace={workspace} driveConfigured={Boolean(portalData?.integrations.drive?.configured)} />
          <LiveDriveFolders {...liveProps} />
        </div>
      )}

      {tab === 'airtable' && <LiveAirtable {...liveProps} />}
      <HelpChat clientName={branding?.workspace_name ?? displayName} workspaceSlug={workspace} />
    </div>
  )
}
