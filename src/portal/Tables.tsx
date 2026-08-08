import { useEffect, useMemo, useState } from 'react'
import { CloudCog, Database, RefreshCw } from 'lucide-react'
import { TABLE_VIEWS, WORKFLOW_LABEL, ETAPA_ROWS, DEMANDA_ROWS, AUTOMATION_ROWS, type RowStatus, type SyncState, type TableRow, type TableView } from './data'
import { fetchTableRows, type TablesResult } from './airtable'

const STATUS_LABEL: Record<RowStatus, { label: string; cls: string }> = {
  draft: { label: 'rascunho', cls: 'bg-[#512314]/10 text-[#512314]/70' },
  submitted: { label: 'enviado', cls: 'bg-[#329fd7]/15 text-[#1f6f9e]' },
  in_review: { label: 'em revisão', cls: 'bg-[#ffb53e]/25 text-[#8a5b00]' },
  blocked: { label: 'bloqueado', cls: 'bg-[#ff5639]/15 text-[#b3261e]' },
  synced: { label: 'sincronizado', cls: 'bg-[#16a34a]/15 text-[#166534]' },
  failed: { label: 'falhou', cls: 'bg-[#ff5639]/15 text-[#b3261e]' },
}

const SYNC_STYLE: Record<SyncState, { glyph: string; cls: string; title: string }> = {
  ok: { glyph: '✓', cls: 'text-[#166534]', title: 'ok' },
  synced: { glyph: '✓', cls: 'text-[#166534]', title: 'sincronizado' },
  sent: { glyph: '✓', cls: 'text-[#166534]', title: 'enviado' },
  pending: { glyph: '…', cls: 'text-[#8a5b00]', title: 'pendente' },
  failed: { glyph: '✕', cls: 'text-[#b3261e]', title: 'falhou' },
  skipped: { glyph: '—', cls: 'text-[#512314]/35', title: 'não se aplica' },
}

const RISK_DOT: Record<TableRow['risk'], string> = {
  low: '#16a34a', medium: '#ffb53e', high: '#ff5639',
}

const SECTION_LABEL: { key: Section; label: string }[] = [
  { key: 'registros', label: 'Registros (read model)' },
  { key: 'etapas', label: '[V2] Etapas do Lançamento' },
  { key: 'demandas', label: '[V2] Demandas Operacionais' },
  { key: 'gantt', label: 'Gantt (timeline)' },
  { key: 'automacoes', label: 'Automações' },
]

type Section = 'registros' | 'etapas' | 'demandas' | 'gantt' | 'automacoes'

const AUTOMATION_STATUS_CLS: Record<string, { label: string; cls: string }> = {
  ativa: { label: 'ativa', cls: 'bg-[#16a34a]/15 text-[#166534]' },
  em_validacao: { label: 'em validação', cls: 'bg-[#329fd7]/15 text-[#1f6f9e]' },
  pausada: { label: 'pausada', cls: 'bg-[#ffb53e]/25 text-[#8a5b00]' },
}

const ETAPA_STATUS_CLS: Record<string, string> = {
  'Não iniciado': 'bg-[#512314]/10 text-[#512314]/70',
  'Em andamento': 'bg-[#329fd7]/15 text-[#1f6f9e]',
  'Concluído': 'bg-[#16a34a]/15 text-[#166534]',
  'Cancelado': 'bg-[#ff5639]/15 text-[#b3261e]',
  'Não Iniciado': 'bg-[#512314]/10 text-[#512314]/70',
}

const RISCO_CLS: Record<string, string> = {
  verde: 'bg-[#16a34a]/15 text-[#166534]',
  amarelo: 'bg-[#ffb53e]/25 text-[#8a5b00]',
  vermelho: 'bg-[#ff5639]/15 text-[#b3261e]',
}

const RISCO_BAR: Record<string, string> = {
  verde: '#16a34a', amarelo: '#ffb53e', vermelho: '#ff5639',
}

/* ---------- Gantt (timeline) ---------- */
const DAY = 86400000
const GANTT_TODAY = '2026-07-29' // âncora da demo, alinhada aos dados
const toTs = (s: string) => new Date(`${s}T00:00:00`).getTime()

function GanttView() {
  const rows = ETAPA_ROWS.filter((e) => e.ativa)
  const min = Math.min(...rows.map((e) => toTs(e.inicio))) - 3 * DAY
  const max = Math.max(...rows.map((e) => toTs(e.fim))) + 3 * DAY
  const span = max - min
  const pct = (t: number) => ((t - min) / span) * 100

  const projetos: { id: string; nome: string; etapas: typeof rows }[] = []
  for (const e of rows) {
    let p = projetos.find((x) => x.id === e.projetoId)
    if (!p) { p = { id: e.projetoId, nome: e.projeto, etapas: [] }; projetos.push(p) }
    p.etapas.push(e)
  }

  const months: { t: number; label: string }[] = []
  const cursor = new Date(min)
  cursor.setDate(1)
  cursor.setMonth(cursor.getMonth() + 1)
  while (cursor.getTime() < max) {
    months.push({ t: cursor.getTime(), label: cursor.toLocaleDateString('pt-BR', { month: 'short' }) })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  const todayPct = pct(toTs(GANTT_TODAY))

  return (
    <div className="sun-card overflow-x-auto p-4">
      <div className="min-w-[960px]">
        <div className="relative ml-64 h-6 border-b border-[#512314]/15">
          {months.map((m) => (
            <span key={m.t} className="absolute top-0 -translate-x-1/2 text-[10px] font-semibold uppercase text-[#512314]/50" style={{ left: `${pct(m.t)}%` }}>
              {m.label}
            </span>
          ))}
          <span className="absolute top-1 h-3 w-0.5 bg-[#ff5639]" style={{ left: `${todayPct}%` }} title={`hoje · ${GANTT_TODAY}`} />
        </div>
        {projetos.map((p) => (
          <div key={p.id} className="mt-4">
            <p className="text-[12px] font-bold text-[#512314]">
              {p.nome} <span className="font-mono text-[10px] font-normal text-[#512314]/45">({p.id})</span>
            </p>
            {p.etapas.map((e) => (
              <div key={e.id} className="mt-1 flex items-center">
                <span className="w-64 shrink-0 truncate pr-2 text-[11px] text-[#512314]/75" title={e.etapa}>{e.etapa}</span>
                <div className="relative h-5 flex-1">
                  {months.map((m) => (
                    <span key={m.t} className="absolute top-0 h-full border-l border-[#512314]/8" style={{ left: `${pct(m.t)}%` }} />
                  ))}
                  <span className="absolute top-0 h-full border-l-2 border-[#ff5639]/50" style={{ left: `${todayPct}%` }} />
                  <div
                    className="absolute top-0.5 flex h-4 items-center rounded-full px-2"
                    style={{
                      left: `${pct(toTs(e.inicio))}%`,
                      width: `${Math.max(pct(toTs(e.fim)) - pct(toTs(e.inicio)), 1.5)}%`,
                      background: RISCO_BAR[e.risco],
                      opacity: e.status === 'Concluído' ? 0.45 : 0.9,
                    }}
                    title={`${e.etapa} · ${e.inicio} → ${e.fim} · ${e.status} · ${e.responsavel}`}
                  >
                    <span className="truncate text-[9px] font-bold text-white">{e.macroarea}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-[#512314]/60">
          {(['verde', 'amarelo', 'vermelho'] as const).map((r) => (
            <span key={r} className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: RISCO_BAR[r] }} /> risco {r}
            </span>
          ))}
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-0.5 bg-[#ff5639]/60" /> hoje ({GANTT_TODAY})</span>
          <span className="text-[#512314]/40">etapas concluídas aparecem esmaecidas</span>
        </div>
      </div>
    </div>
  )
}

function SyncCell({ s }: { s: SyncState }) {
  const st = SYNC_STYLE[s]
  return <span title={st.title} className={`font-bold ${st.cls}`}>{st.glyph}</span>
}

export function Tables() {
  const [view, setView] = useState<TableView>('todas')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [section, setSection] = useState<Section>('registros')
  const [data, setData] = useState<TablesResult | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setData(await fetchTableRows())
    setLoading(false)
  }
  useEffect(() => {
    let cancelled = false
    void fetchTableRows().then((result) => {
      if (cancelled) return
      setData(result)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const rows = useMemo(() => {
    const viewFilter = TABLE_VIEWS.find((v) => v.key === view)!.filter
    return (data?.rows ?? []).filter(viewFilter).filter((r) => {
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return [r.title, r.subtitle, r.contact, r.stage].filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [data, view, query])

  const summary = useMemo(() => {
    const all = data?.rows ?? []
    return {
      total: all.length,
      revisao: all.filter((r) => r.status === 'in_review' || r.status === 'submitted').length,
      syncPendente: all.filter((r) => Object.values(r.sync).some((s) => s === 'pending' || s === 'failed')).length,
      rascunhos: all.filter((r) => r.status === 'draft').length,
    }
  }, [data])

  return (
    <div className="mt-6 space-y-4">
      <div className="sun-card flex flex-wrap items-center gap-3 p-4">
        <Database size={16} className="text-[#512314]/60" />
        <p className="text-[13px] text-[#512314]/75">
          <strong>Sunbeat Tables</strong> — leitura operacional normalizada dos 4 fluxos.
          O Airtable continua sendo o cockpit; aqui você vê o que precisa de ação.
        </p>
        <span className={`ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
          data?.source === 'airtable' ? 'bg-[#16a34a]/15 text-[#166534]' : 'bg-[#ffb53e]/25 text-[#8a5b00]'
        }`}>
          <CloudCog size={11} />
          {data?.source === 'airtable' ? 'dados ao vivo' : 'dados de demonstração'}
        </span>
        <button onClick={load} className="flex items-center gap-1 text-[11px] font-semibold text-[#512314]/60 hover:text-[#512314]">
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> atualizar
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {SECTION_LABEL.map((s) => (
          <button key={s.key} onClick={() => setSection(s.key)}
            className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition ${
              section === s.key ? 'bg-[#512314] text-[#ebdbba]' : 'bg-white/50 text-[#512314]/70 hover:bg-white/80'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {section === 'registros' && (<>
      <div className="flex flex-wrap items-center gap-2">
        {TABLE_VIEWS.map((v) => (
          <button key={v.key} onClick={() => setView(v.key)}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition ${
              view === v.key ? 'bg-[#512314] text-[#ebdbba]' : 'bg-white/50 text-[#512314]/70 hover:bg-white/80'
            }`}>
            {v.label}
          </button>
        ))}
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar registro, contato, etapa…"
          className="ml-auto h-8 w-56 rounded-full border border-[#512314]/20 bg-white/60 px-3.5 text-[12px] outline-none focus:border-[#512314]/50" />
      </div>

      <div className="flex gap-2 text-[11px]">
        <span className="sun-chip">{summary.total} registros</span>
        <span className="sun-chip">{summary.revisao} em revisão</span>
        <span className="sun-chip">{summary.syncPendente} sync pendente</span>
        <span className="sun-chip">{summary.rascunhos} rascunhos</span>
      </div>

      <div className="sun-card overflow-x-auto p-2">
        <table className="w-full min-w-[900px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-[#512314]/15 text-[10px] uppercase tracking-wide text-[#512314]/50">
              <th className="px-3 py-2">Registro</th><th className="pr-3">Workflow</th><th className="pr-3">Status</th>
              <th className="pr-3">Etapa / próxima ação</th><th className="pr-3">Contato</th>
              <th className="pr-3 text-center" title="Airtable">AT</th><th className="pr-3 text-center" title="Drive">DR</th>
              <th className="pr-3 text-center" title="E-mail">@</th>
              <th className="pr-3">Atualizado</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <>
              <tr key={r.id} className="border-b border-[#512314]/8 align-top">
                <td className="px-3 py-2.5">
                  <span className="flex items-start gap-2">
                    <span className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: RISK_DOT[r.risk] }} />
                    <span>
                      {r.v2Fields ? (
                        <button onClick={() => setOpenId(openId === r.id ? null : r.id)}
                          className="block text-left font-semibold text-[#512314] underline decoration-[#512314]/25 decoration-dotted underline-offset-2 hover:decoration-[#512314]"
                          title="Ver campos reais da tabela v2">
                          {r.title}
                        </button>
                      ) : (
                        <span className="block font-semibold text-[#512314]">{r.title}</span>
                      )}
                      {r.subtitle && <span className="block text-[11px] text-[#512314]/55">{r.subtitle}</span>}
                    </span>
                  </span>
                </td>
                <td className="pr-3 py-2.5 text-[#512314]/70">
                  <span className="block">{WORKFLOW_LABEL[r.workflow]}</span>
                  {r.airtableTable && <span className="block text-[10px] text-[#512314]/45">{r.airtableTable}</span>}
                </td>
                <td className="pr-3 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_LABEL[r.status].cls}`}>
                    {STATUS_LABEL[r.status].label}
                  </span>
                </td>
                <td className="pr-3 py-2.5">
                  <span className="block text-[#512314]">{r.stage}</span>
                  {r.nextAction && (
                    <span className="block text-[11px] text-[#512314]/55">
                      → {r.nextAction}{r.nextActionAt ? ` · ${r.nextActionAt}` : ''}
                    </span>
                  )}
                </td>
                <td className="pr-3 py-2.5 text-[#512314]/70">{r.contact ?? '—'}</td>
                <td className="pr-3 py-2.5 text-center"><SyncCell s={r.sync.airtable} /></td>
                <td className="pr-3 py-2.5 text-center"><SyncCell s={r.sync.drive} /></td>
                <td className="pr-3 py-2.5 text-center"><SyncCell s={r.sync.email} /></td>
                <td className="pr-3 py-2.5 whitespace-nowrap text-[#512314]/60">{r.updatedAt}</td>
                <td className="py-2.5 whitespace-nowrap">
                  {r.editUrl && <a href={r.editUrl} className="mr-2 font-semibold text-[#329fd7] hover:underline">editar</a>}
                  {r.airtableRef && <span title={`${r.airtableTable ?? 'Airtable'} · registro ${r.airtableRef}`} className="cursor-default font-semibold text-[#512314]/50">airtable↗</span>}
                </td>
              </tr>
              {openId === r.id && r.v2Fields && (
                <tr key={`${r.id}-v2`} className="border-b border-[#512314]/15 bg-[#512314]/[0.03]">
                  <td colSpan={10} className="px-6 py-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#512314]/50">
                      {r.airtableTable ?? 'Airtable v2'} · campos reais do registro{r.airtableRef ? ` ${r.airtableRef}` : ''}
                    </p>
                    <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5 md:grid-cols-3">
                      {r.v2Fields.map((f) => (
                        <div key={f.field}>
                          <dt className="text-[10px] uppercase tracking-wide text-[#512314]/45">{f.field}</dt>
                          <dd className="text-[12px] text-[#512314]">{f.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </td>
                </tr>
              )}
              </>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-8 text-center text-[#512314]/50">
                Nenhum registro nesta view{query ? ' para a busca atual' : ''}.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      </>)}

      {section === 'etapas' && (
      <div className="sun-card overflow-x-auto p-2">
        <table className="w-full min-w-[900px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-[#512314]/15 text-[10px] uppercase tracking-wide text-[#512314]/50">
              <th className="px-3 py-2">Etapa</th><th className="pr-3">Projeto</th><th className="pr-3">Status</th>
              <th className="pr-3">Responsável</th><th className="pr-3">Início</th><th className="pr-3">Fim</th>
              <th className="pr-3">Risco</th><th>E-mail D+</th>
            </tr>
          </thead>
          <tbody>
            {ETAPA_ROWS.filter((e) => e.ativa).map((e) => (
              <tr key={e.id} className="border-b border-[#512314]/8 align-top">
                <td className="px-3 py-2.5">
                  <span className="block font-semibold text-[#512314]">{e.etapa}</span>
                  <span className="block text-[11px] text-[#512314]/55">{e.macroarea}</span>
                </td>
                <td className="pr-3 py-2.5 text-[#512314]/70">
                  {e.projeto} <span className="text-[10px] text-[#512314]/45" title="Origem Projeto ID">({e.projetoId})</span>
                </td>
                <td className="pr-3 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ETAPA_STATUS_CLS[e.status]}`}>{e.status}</span>
                </td>
                <td className="pr-3 py-2.5 text-[#512314]/70">{e.responsavel}</td>
                <td className="pr-3 py-2.5 whitespace-nowrap text-[#512314]/70">{e.inicio}</td>
                <td className="pr-3 py-2.5 whitespace-nowrap text-[#512314]/70">{e.fim}</td>
                <td className="pr-3 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${RISCO_CLS[e.risco]}`}>{e.risco}</span>
                </td>
                <td className="py-2.5 text-[#512314]/60">{e.emailEnviadoEm ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {section === 'gantt' && <GanttView />}

      {section === 'automacoes' && (
      <div className="sun-card overflow-x-auto p-2">
        <table className="w-full min-w-[960px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-[#512314]/15 text-[10px] uppercase tracking-wide text-[#512314]/50">
              <th className="px-3 py-2">Automação</th><th className="pr-3">Gatilho</th><th className="pr-3">Efeito</th>
              <th className="pr-3">Status</th><th className="pr-3">Último disparo</th><th>Trava anti-reenvio</th>
            </tr>
          </thead>
          <tbody>
            {AUTOMATION_ROWS.map((a) => (
              <tr key={a.id} className="border-b border-[#512314]/8 align-top">
                <td className="px-3 py-2.5">
                  <span className="block font-semibold text-[#512314]">{a.nome}</span>
                  <span className="block text-[11px] text-[#512314]/55">{a.escopo}</span>
                </td>
                <td className="max-w-[240px] pr-3 py-2.5 text-[#512314]/75">{a.gatilho}</td>
                <td className="max-w-[240px] pr-3 py-2.5 text-[#512314]/75">
                  {a.efeito}
                  {a.observacao && <span className="mt-1 block text-[11px] italic text-[#8a5b00]">⚠ {a.observacao}</span>}
                </td>
                <td className="pr-3 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${AUTOMATION_STATUS_CLS[a.status].cls}`}>
                    {AUTOMATION_STATUS_CLS[a.status].label}
                  </span>
                </td>
                <td className="pr-3 py-2.5 whitespace-nowrap text-[#512314]/70">{a.ultimoDisparo ?? '—'}</td>
                <td className="max-w-[240px] py-2.5 text-[11px] text-[#512314]/65">{a.travaAntiReenvio}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-3 py-2.5 text-[11px] text-[#512314]/50">
          Regra do handoff: automações v2 (Gantt, Calendário/Demandas, Relatórios D+) permanecem pausadas até dry run e teste
          controlado de idempotência. Nenhuma ativação em escala sem aprovação de Felipe/Mylena.
        </p>
      </div>
      )}

      {section === 'demandas' && (
      <div className="sun-card overflow-x-auto p-2">
        <table className="w-full min-w-[900px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-[#512314]/15 text-[10px] uppercase tracking-wide text-[#512314]/50">
              <th className="px-3 py-2">Ticket</th><th className="pr-3">Produto</th><th className="pr-3">Tipo de Demanda</th>
              <th className="pr-3">Cliente</th><th className="pr-3">Status</th><th className="pr-3">Upload</th>
              <th className="pr-3">Data limite</th><th>Chave idempotente</th>
            </tr>
          </thead>
          <tbody>
            {DEMANDA_ROWS.map((d) => (
              <tr key={d.id} className="border-b border-[#512314]/8 align-top">
                <td className="px-3 py-2.5 font-semibold text-[#512314]">{d.ticket}</td>
                <td className="pr-3 py-2.5 text-[#512314]/70">
                  {d.produto}
                  <span className="block text-[10px] text-[#512314]/45">lançamento {d.dataLancamento}</span>
                </td>
                <td className="pr-3 py-2.5 text-[#512314]/70">{d.tipo}</td>
                <td className="pr-3 py-2.5 text-[#512314]/70">{d.cliente}</td>
                <td className="pr-3 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ETAPA_STATUS_CLS[d.status]}`}>{d.status}</span>
                </td>
                <td className="pr-3 py-2.5 text-[#512314]/70">{d.upload}</td>
                <td className="pr-3 py-2.5 whitespace-nowrap text-[#512314]/70">{d.dataLimite}</td>
                <td className="py-2.5 font-mono text-[10px] text-[#512314]/55">{d.chave}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <p className="text-[11px] text-[#512314]/45">
        V1 é somente leitura: abrir link de edição e registro Airtable, copiar resumo. Escrita e merge ficam para fases auditáveis.
      </p>
    </div>
  )
}
