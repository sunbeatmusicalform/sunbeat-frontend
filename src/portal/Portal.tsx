import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { Lock, Folder, File, CheckCircle2, Clock, RefreshCw, Zap } from 'lucide-react'
import { AtabaqueMark } from '../components/AtabaqueMark'
import { Tables } from './Tables'
import { EmailConfig } from './EmailConfig'
import { FormConfig } from './FormConfig'
import {
  STAGES, RELEASES, EMAIL_LOG, DRIVE_TREE, AIRTABLE_ROWS, INTEGRATIONS,
  loadDriveConfig, saveDriveConfig, resetDriveConfig,
  type DriveNode, type StageKey, type DriveWorkflowConfig,
} from './data'
import { INVITE_STATUS_LABEL, invitesWithStatus, lookupPerson, VERDICT_STYLE, type LookupResult, type PersonBaseHit } from '../forms/invites'
import { api, apiEnabled } from '../lib/api'
import { useBranding, patchBranding, createPortalSession, portalToken, BrandLogo, type WorkspaceBranding } from '../lib/brand'

const stageOf = (k: StageKey) => STAGES.find((s) => s.key === k)!

/* ---------- Gantt ---------- */
const GANTT_START = new Date('2026-06-29T00:00:00')
const GANTT_DAYS = 98 // até 2026-10-04
const day = (iso: string) => (new Date(iso + 'T00:00:00').getTime() - GANTT_START.getTime()) / 86400000
const fmtDay = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

function Gantt() {
  const weeks = useMemo(
    () => Array.from({ length: Math.ceil(GANTT_DAYS / 7) }, (_, i) => {
      const d = new Date(GANTT_START.getTime() + i * 7 * 86400000)
      return fmtDay.format(d)
    }),
    [],
  )
  const todayX = (day('2026-07-28') / GANTT_DAYS) * 100
  return (
    <div className="sun-card p-5 overflow-x-auto">
      <div className="min-w-[820px]">
        <div className="grid" style={{ gridTemplateColumns: '220px 1fr' }}>
          <div />
          <div className="relative h-6 border-b border-[#512314]/15">
            {weeks.map((w, i) => (
              <span key={i} className="absolute top-0 text-[10px] text-[#512314]/55"
                style={{ left: `${(i * 7 / GANTT_DAYS) * 100}%` }}>{w}</span>
            ))}
          </div>
          {RELEASES.map((r) => (
            <FragmentRow key={r.id} r={r} />
          ))}
          <div />
          <div className="relative h-3">
            <div className="absolute -top-[calc(4*3.25rem+1.5rem)] bottom-0 w-px bg-[#ff5639]" style={{ left: `${todayX}%` }} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {STAGES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-[#512314]/70">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
          <span className="ml-auto text-[11px] text-[#ff5639] font-medium">— hoje</span>
        </div>
      </div>
    </div>
  )
}

function FragmentRow({ r }: { r: (typeof RELEASES)[number] }) {
  const st = stageOf(r.stage)
  return (
    <>
      <div className="py-2 pr-3">
        <p className="text-[13px] font-semibold text-[#512314] leading-tight">{r.project}</p>
        <p className="text-[11px] text-[#512314]/60">{r.artist} · {r.type}</p>
      </div>
      <div className="relative h-9 border-b border-[#512314]/8">
        {r.segments.map((sg, i) => {
          const l = (day(sg.from) / GANTT_DAYS) * 100
          const w = ((day(sg.to) - day(sg.from)) / GANTT_DAYS) * 100
          return (
            <div key={i} title={`${stageOf(sg.stage).label} · ${sg.from} → ${sg.to}`}
              className="absolute top-2 h-5 rounded-full opacity-90"
              style={{ left: `${l}%`, width: `${Math.max(w, 1)}%`, background: stageOf(sg.stage).color }} />
          )
        })}
        <span className="absolute top-2.5 ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
          style={{ left: `calc(${(day(r.releaseDate) / GANTT_DAYS) * 100}% + 4px)`, background: st.color }}>
          {st.label} · {fmtDay.format(new Date(r.releaseDate + 'T00:00:00'))}
        </span>
      </div>
    </>
  )
}

/* ---------- Abas ---------- */
type Tab = 'geral' | 'tables' | 'convites' | 'integracoes' | 'formulario' | 'emails' | 'drive' | 'airtable' | 'marca'
const TABS: { key: Tab; label: string }[] = [
  { key: 'geral', label: 'Visão geral' },
  { key: 'tables', label: 'Tables' },
  { key: 'convites', label: 'Convites' },
  { key: 'integracoes', label: 'Integrações' },
  { key: 'formulario', label: 'Formulário' },
  { key: 'emails', label: 'E-mails' },
  { key: 'drive', label: 'Drive' },
  { key: 'airtable', label: 'Airtable' },
  { key: 'marca', label: 'Minha marca' },
]

const EMAIL_STATUS: Record<string, { label: string; cls: string }> = {
  entregue: { label: 'entregue', cls: 'bg-[#329fd7]/15 text-[#1f6f9e]' },
  aberto: { label: 'aberto', cls: 'bg-[#ffb53e]/25 text-[#8a5b00]' },
  clicado: { label: 'clicado', cls: 'bg-[#16a34a]/15 text-[#166534]' },
}
const ORIGIN_CLS: Record<string, string> = {
  'Formulário Sunbeat': 'bg-[#ff5639]/15 text-[#b3261e]',
  'Airtable (equipe)': 'bg-[#329fd7]/15 text-[#1f6f9e]',
  'Automação': 'bg-[#7c3aed]/15 text-[#5b21b6]',
}

/* ---------- Verificação de cadastro nas duas bases ---------- */
function PeopleLookupCard() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<LookupResult | null>(null)
  const [source, setSource] = useState<'demo' | 'api'>('demo')

  async function runLookup() {
    // resposta imediata do mock local; refina com a API real quando habilitada
    setResult(lookupPerson(query))
    setSource('demo')
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
      setSource('api')
    }
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
        <button onClick={runLookup}
          className="rounded-full bg-[#512314] px-4 py-1.5 text-[12px] font-bold text-[#ebdbba] hover:opacity-90">
          verificar
        </button>
      </div>

      {result && (
        <div className="mt-3 rounded-2xl border border-[#512314]/15 bg-white/50 p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${VERDICT_STYLE[result.verdict].cls}`}>
              {VERDICT_STYLE[result.verdict].label}
            </span>
            {result.hit && <span className="text-[13px] font-bold text-[#512314]">{result.hit.nome}</span>}
            <span className="ml-auto rounded-full bg-[#512314]/8 px-2 py-0.5 text-[10px] font-semibold text-[#512314]/55">
              fonte: {source === 'api' ? 'backend (2 tabelas Airtable)' : 'demo local'}
            </span>
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
function DriveConfigPanel() {
  const [cfg, setCfg] = useState<DriveWorkflowConfig[]>(loadDriveConfig)
  const [saved, setSaved] = useState(false)
  const [remoteOk, setRemoteOk] = useState(false)

  // Quando a API está habilitada, puxa a config real do workspace (clearance)
  // e sobrepõe os campos editáveis do painel local.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const remote = await api.getDriveConfig('rights_clearance')
      if (cancelled || !remote) return
      setRemoteOk(true)
      setCfg((c) =>
        c.map((w) => {
          if (w.workflow !== 'rights_clearance') return w
          return {
            ...w,
            subpastas: remote.subfolders?.length ? remote.subfolders : w.subpastas,
            raiz: (remote.overrides?.root_folder_id as string) ?? w.raiz,
          }
        }),
      )
    })()
    return () => { cancelled = true }
  }, [])

  function update(idx: number, patch: Partial<DriveWorkflowConfig>) {
    setCfg((c) => c.map((w, i) => (i === idx ? { ...w, ...patch } : w)))
    setSaved(false)
  }

  async function save() {
    saveDriveConfig(cfg)
    setSaved(true)
    // espelha no backend (workflows de clearance usam o mesmo endpoint por tipo)
    const edited = cfg.filter((w) => w.workflow === 'rights_clearance')
    await Promise.all(
      edited.map((w) =>
        api.patchDriveConfig('rights_clearance', {
          workflow_type: 'rights_clearance',
          subfolders: w.subpastas,
          overrides: { root_folder_id: w.raiz || null },
        }),
      ),
    )
  }

  return (
    <div className="sun-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[#512314]">Configuração de pastas por workflow</h3>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className={`rounded-full px-2 py-0.5 text-[10px] ${remoteOk ? 'bg-[#16a34a]/15 text-[#166534]' : 'bg-[#512314]/10 text-[#512314]/55'}`}>
            fonte: {remoteOk ? 'backend do workspace' : 'local (demo)'}
          </span>
          {saved && <span className="text-[#166534]">✓ salvo</span>}
          <button className="text-[#512314]/60 hover:text-[#512314]" onClick={() => { resetDriveConfig(); setCfg(loadDriveConfig()); setSaved(false) }}>
            restaurar padrão
          </button>
          <button className="rounded-full bg-[#512314] px-3.5 py-1.5 text-[#ebdbba] hover:opacity-90"
            onClick={save}>
            salvar configuração
          </button>
        </div>
      </div>
      <p className="mt-0.5 text-[12px] text-[#512314]/60">
        Como a Sunbeat localiza ou cria pastas no envio de cada formulário. Editável internamente —
        na produção vira configuração do workspace, sem deploy.
      </p>

      <div className="mt-4 space-y-4">
        {cfg.map((w, idx) => (
          <div key={`${w.workflow}-${w.label}`} className="rounded-2xl border border-[#512314]/15 bg-white/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-bold text-[#512314]">{w.label}</p>
              {w.raiz
                ? <span className="rounded-full bg-[#16a34a]/15 px-2 py-0.5 text-[10px] font-semibold text-[#166534]">destino ativo</span>
                : <span className="rounded-full bg-[#ffb53e]/25 px-2 py-0.5 text-[10px] font-semibold text-[#8a5b00]">sem destino — pendente de definição</span>}
              {w.fallbackBloqueado && (
                <span className="rounded-full bg-[#512314]/10 px-2 py-0.5 text-[10px] font-semibold text-[#512314]/60" title="Falha explícita é melhor que sucesso na pasta errada">
                  root_fallback bloqueado
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#512314]/70">
              <span className="font-semibold text-[#512314]/50">resolução:</span>
              {w.resolucao.map((step, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-[#512314]/35">→</span>}
                  <span className="rounded-lg bg-[#512314]/8 px-2 py-0.5">{step}</span>
                </span>
              ))}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#512314]/50">Pasta raiz</span>
                <input value={w.raiz} onChange={(e) => update(idx, { raiz: e.target.value })}
                  placeholder="vazio = sem destino operacional"
                  className="mt-1 h-8 w-full rounded-lg border border-[#512314]/20 bg-white/70 px-3 text-[12px] outline-none focus:border-[#512314]/50" />
              </label>
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#512314]/50">Subpastas padrão (separadas por vírgula)</span>
                <input value={w.subpastas.join(', ')} onChange={(e) => update(idx, { subpastas: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  className="mt-1 h-8 w-full rounded-lg border border-[#512314]/20 bg-white/70 px-3 text-[12px] outline-none focus:border-[#512314]/50" />
              </label>
            </div>

            <label className="mt-2.5 flex items-center gap-2 text-[12px] text-[#512314]/75">
              <input type="checkbox" checked={w.criarSeAusente} onChange={(e) => update(idx, { criarSeAusente: e.target.checked })} />
              Criar pasta automaticamente se não existir (desligado = falha explícita e alerta)
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

function DriveTree({ node, depth = 0 }: { node: DriveNode; depth?: number }) {  const Icon = node.kind === 'folder' ? Folder : File
  return (
    <div>
      <div className="flex items-center gap-2 py-1.5" style={{ paddingLeft: depth * 20 }}>
        <Icon size={15} className={node.kind === 'folder' ? 'text-[#ffb53e]' : 'text-[#512314]/50'} />
        <span className={`text-[13px] ${node.kind === 'folder' ? 'font-semibold text-[#512314]' : 'text-[#512314]/85'}`}>
          {node.name}
        </span>
        {node.meta && <span className="text-[11px] text-[#512314]/45">· {node.meta}</span>}
      </div>
      {node.children?.map((c, i) => <DriveTree key={i} node={c} depth={depth + 1} />)}
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

      {tab === 'geral' && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {RELEASES.map((r) => {
              const st = stageOf(r.stage)
              return (
                <div key={r.id} className="sun-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-semibold text-[#512314]">{r.project}</p>
                      <p className="text-[11px] text-[#512314]/60">{r.artist} · {r.type} · {r.tracks} faixa{r.tracks > 1 ? 's' : ''}</p>
                    </div>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: st.color }}>
                      {st.label}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2 text-[10px] text-[#512314]/65">
                    <span>Capa: {r.cover === 'ok' ? '✓' : 'pendente'}</span>
                    <span>Áudio: {r.audio === 'ok' ? '✓' : 'pendente'}</span>
                    <span>ISRC: {r.isrc}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div>
            <h2 className="mb-2 text-[15px] font-semibold text-[#512314]">Cronograma da operação</h2>
            <Gantt />
          </div>
        </div>
      )}

      {tab === 'tables' && <Tables />}

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
          <div className="sun-card overflow-x-auto p-2">
            <table className="w-full min-w-[860px] text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#512314]/15 text-[10px] uppercase tracking-wide text-[#512314]/50">
                  <th className="px-3 py-2">Parte</th><th className="pr-3">Função</th><th className="pr-3">Caso de clearance</th>
                  <th className="pr-3">Projeto</th><th className="pr-3">Status</th><th className="pr-3">Criado em</th><th>Link</th>
                </tr>
              </thead>
              <tbody>
                {invitesWithStatus().map((inv) => (
                  <tr key={inv.token} className="border-b border-[#512314]/8 align-top">
                    <td className="px-3 py-2.5 font-semibold text-[#512314]">{inv.parte}</td>
                    <td className="pr-3 py-2.5 text-[#512314]/70">{inv.papel}</td>
                    <td className="pr-3 py-2.5 text-[#512314]/70">
                      {inv.caso}
                      <span className="block font-mono text-[10px] text-[#512314]/45">{inv.casoId}</span>
                    </td>
                    <td className="pr-3 py-2.5 text-[#512314]/70">{inv.projeto}</td>
                    <td className="pr-3 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        inv.status === 'respondido' ? 'bg-[#16a34a]/15 text-[#166534]'
                        : inv.status === 'aberto' ? 'bg-[#329fd7]/15 text-[#1f6f9e]'
                        : 'bg-[#ffb53e]/25 text-[#8a5b00]'
                      }`}>
                        {INVITE_STATUS_LABEL[inv.status]}
                      </span>
                    </td>
                    <td className="pr-3 py-2.5 whitespace-nowrap text-[#512314]/60">{inv.criadoEm}</td>
                    <td className="py-2.5 whitespace-nowrap">
                      {inv.status !== 'respondido' ? (
                        <a href={`/people?invite=${inv.token}`} className="font-semibold text-[#329fd7] hover:underline">
                          abrir /people?invite={inv.token} ↗
                        </a>
                      ) : (
                        <span className="text-[#512314]/40">vinculado à parte ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-[#512314]/45">
            Estados: enviado → aberto → respondido. Criação automática de convites no sync do clearance permanece
            desligada até aprovação (flag <code>people_invite_auto_create_enabled</code>).
          </p>
        </div>
      )}

      {tab === 'integracoes' && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {INTEGRATIONS.map((it) => (
              <div key={it.id} className="sun-card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-bold text-[#512314]">{it.name}</p>
                  <span className="flex items-center gap-1 rounded-full bg-[#16a34a]/15 px-2 py-0.5 text-[10px] font-semibold text-[#166534]">
                    <CheckCircle2 size={11} /> {it.status}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-[#512314]/65">{it.tagline}</p>
                <ul className="mt-3 space-y-2">
                  {it.points.map((p, i) => (
                    <li key={i} className="flex gap-2 text-[12px] text-[#512314]/80">
                      <Zap size={12} className="mt-0.5 shrink-0 text-[#ff5639]" /> {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 flex items-center gap-1 text-[11px] text-[#512314]/50">
                  <Clock size={11} /> {it.latency}
                </p>
              </div>
            ))}
          </div>
          <div className="sun-card p-5">
            <h3 className="text-[14px] font-semibold text-[#512314]">Log de e-mails (Resend)</h3>
            <table className="mt-3 w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#512314]/15 text-[11px] uppercase tracking-wide text-[#512314]/50">
                  <th className="py-2 pr-3">Data</th><th className="pr-3">Para</th><th className="pr-3">Assunto</th>
                  <th className="pr-3">Trigger</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {EMAIL_LOG.map((e, i) => (
                  <tr key={i} className="border-b border-[#512314]/8">
                    <td className="py-2 pr-3 whitespace-nowrap text-[#512314]/60">{e.at}</td>
                    <td className="pr-3 text-[#512314]/80">{e.to}</td>
                    <td className="pr-3 text-[#512314]">{e.subject}</td>
                    <td className="pr-3 text-[#512314]/60">{e.trigger}</td>
                    <td><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${EMAIL_STATUS[e.status].cls}`}>
                      {EMAIL_STATUS[e.status].label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'drive' && (
        <div className="mt-6 space-y-6">
          <DriveConfigPanel />
          <div className="sun-card p-5">
            <h3 className="text-[14px] font-semibold text-[#512314]">Google Drive — estrutura criada automaticamente</h3>
            <p className="mt-0.5 text-[12px] text-[#512314]/60">
              Pasta do projeto criada no envio do formulário, com subpastas padrão e arquivos alocados pela lógica de nomenclatura.
            </p>
            <div className="mt-4"><DriveTree node={DRIVE_TREE} /></div>
          </div>
        </div>
      )}

      {tab === 'airtable' && (
        <div className="mt-6 sun-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-[#512314]">Airtable — base da operação (2-way sync)</h3>
            <span className="flex items-center gap-1.5 text-[11px] text-[#512314]/55">
              <RefreshCw size={11} className="animate-spin" style={{ animationDuration: '3s' }} /> sincronizado
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-[#512314]/60">
            O que a equipe já opera no Airtable aparece aqui como bônus — e cada submissão Sunbeat vira registro na base.
          </p>
          <table className="mt-4 w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-[#512314]/15 text-[11px] uppercase tracking-wide text-[#512314]/50">
                <th className="py-2 pr-3">Tabela</th><th className="pr-3">Registro</th><th className="pr-3">Status</th>
                <th className="pr-3">Origem</th><th className="pr-3">Atualizado</th><th>Sync</th>
              </tr>
            </thead>
            <tbody>
              {AIRTABLE_ROWS.map((r) => (
                <tr key={r.key} className="border-b border-[#512314]/8">
                  <td className="py-2 pr-3 text-[#512314]/70">{r.table}</td>
                  <td className="pr-3 text-[#512314]">{r.record}</td>
                  <td className="pr-3 text-[#512314]/80">{r.status}</td>
                  <td className="pr-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ORIGIN_CLS[r.origin]}`}>{r.origin}</span></td>
                  <td className="pr-3 whitespace-nowrap text-[#512314]/60">{r.updatedAt}</td>
                  <td className="text-[#512314]/70">{r.sync}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
