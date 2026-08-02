import { useState } from 'react'
import { CalendarClock, CheckCircle2, CircleAlert, ExternalLink, FileAudio, Folder, Image, ListTodo, RefreshCw, ShieldCheck } from 'lucide-react'
import type { PortalDataRemote, PortalProjectRemote, PortalStageRemote } from '../lib/api'

type Props = { data: PortalDataRemote | null; loading: boolean; reload: () => void }

function State({ loading, data, reload }: Props) {
  if (loading) return <div className="sun-card p-6 text-sm text-[#512314]/65">Carregando dados reais da Atabaque…</div>
  if (!data) return <div className="sun-card p-6"><p className="text-sm font-semibold text-[#512314]">Os dados operacionais estão temporariamente indisponíveis.</p><button onClick={reload} className="mt-3 rounded-full bg-[#512314] px-4 py-2 text-xs font-bold text-[#ebdbba]">tentar novamente</button></div>
  return null
}

function Empty({ children }: { children: string }) {
  return <div className="rounded-2xl border border-dashed border-[#512314]/20 p-5 text-sm text-[#512314]/55">{children}</div>
}

const fmt = (value?: string | null) => value ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${value.slice(0, 10)}T12:00:00`)) : '—'
const asset = (value: string) => value === 'ok' || value === 'generated' ? '✓' : value === 'unknown' ? '—' : 'pendente'
const dateValue = (value?: string | null) => value ? new Date(`${value.slice(0, 10)}T12:00:00`).getTime() : null

function stageColor(status: string) {
  const value = status.toLocaleLowerCase('pt-BR')
  if (!value || value.includes('sem status')) return '#8a6a5d'
  if (value.includes('conclu') || value.includes('aprova')) return '#0f9f74'
  if (value.includes('ajuste') || value.includes('risco') || value.includes('atras')) return '#ff5a45'
  if (value.includes('agenda')) return '#8247e5'
  if (value.includes('análise') || value.includes('analise') || value.includes('andamento')) return '#ffb53e'
  if (value.includes('distribu')) return '#512314'
  return '#329fd7'
}

type TimelineRow = {
  id: string
  project: string
  label: string
  phase: string
  status: string
  start: number
  end: number
  milestone: boolean
  duplicateCount: number
}

function timelineRows(projects: PortalProjectRemote[], stages: PortalStageRemote[]): TimelineRow[] {
  const stageRows = stages.flatMap((stage) => {
    const start = dateValue(stage.start_date || stage.end_date)
    const end = dateValue(stage.end_date || stage.start_date)
    if (start === null || end === null) return []
    return [{
      id: `stage-${stage.id}`,
      project: stage.project,
      label: stage.name || stage.macroarea || 'Etapa',
      phase: stage.macroarea || stage.name || 'Outras etapas',
      status: stage.status,
      start: Math.min(start, end),
      end: Math.max(start, end),
      milestone: start === end,
      duplicateCount: 1,
    }]
  })
  const exactStages = new Map<string, TimelineRow>()
  stageRows.forEach((row) => {
    const key = [row.project, row.phase, row.status, row.start, row.end].join('|')
    const existing = exactStages.get(key)
    if (existing) existing.duplicateCount += 1
    else exactStages.set(key, row)
  })
  const releases = projects.flatMap((project) => {
    const release = dateValue(project.release_date)
    if (release === null) return []
    return [{
      id: `release-${project.id}`,
      project: project.title,
      label: 'Lançamento',
      phase: 'Lançamento',
      status: project.status,
      start: release,
      end: release,
      milestone: true,
      duplicateCount: 1,
    }]
  })
  return [...exactStages.values(), ...releases].sort((a, b) => a.start - b.start || a.project.localeCompare(b.project))
}

const phaseOrder = [
  'Clearance', 'Plano de Marketing', 'Operacional', 'Plano de Midia',
  'Videoclipe', 'Imprensa', 'Relatorio D+7', 'Relatorio D+15',
  'Relatorio D+28', 'Lançamento',
]

function phaseRank(value: string) {
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
  const index = phaseOrder.findIndex((phase) => phase.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR') === normalized)
  return index === -1 ? phaseOrder.length : index
}

function groupedTimeline(rows: TimelineRow[]) {
  const grouped = new Map<string, TimelineRow[]>()
  rows.forEach((row) => grouped.set(row.phase, [...(grouped.get(row.phase) || []), row]))
  return [...grouped.entries()]
    .map(([phase, items]) => ({ phase, items: items.sort((a, b) => a.start - b.start || a.project.localeCompare(b.project)) }))
    .sort((a, b) => phaseRank(a.phase) - phaseRank(b.phase) || a.phase.localeCompare(b.phase))
}

function OperationalGantt({ projects, stages }: { projects: PortalProjectRemote[]; stages: PortalStageRemote[] }) {
  const [windowDays, setWindowDays] = useState<30 | 90 | 180>(90)
  const allRows = timelineRows(projects, stages)
  const day = 24 * 60 * 60 * 1000
  const now = new Date(); now.setHours(12, 0, 0, 0)
  const daysBack = windowDays === 30 ? 7 : windowDays === 90 ? 30 : 60
  const first = now.getTime() - (daysBack * day)
  const last = first + (windowDays * day)
  const rows = allRows.filter((row) => row.end >= first && row.start <= last).slice(0, 60)
  const groups = groupedTimeline(rows)
  const duration = Math.max(last - first, day)
  const position = (value: number) => Math.max(0, Math.min(100, ((value - first) / duration) * 100))
  const ticks = Array.from({ length: 6 }, (_, index) => first + ((duration * index) / 5))
  const todayPosition = position(now.getTime())

  return (
    <div className="sun-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#512314]/10 p-4">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[#512314]"><CalendarClock size={17} /> Cronograma da operação</h2>
          <p className="mt-1 text-[11px] text-[#512314]/55">Janela atualizada em torno de hoje; etapas antigas permanecem fora da visão inicial.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full bg-[#512314]/8 p-0.5 text-[10px] font-semibold text-[#512314]/60">
            {([30, 90, 180] as const).map((days) => <button key={days} onClick={() => setWindowDays(days)} className={`rounded-full px-2.5 py-1 ${windowDays === days ? 'bg-white/80 text-[#512314]' : ''}`}>{days} dias</button>)}
          </div>
        </div>
      </div>
      {rows.length ? <div className="overflow-x-auto">
        <div className="min-w-[900px] p-4">
          <div className="grid grid-cols-[230px_1fr] border-b border-[#512314]/10 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#512314]/45">Etapa · projeto</p>
            <div className="relative h-5">
              {ticks.map((tick, index) => <span key={index} className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] text-[#512314]/45" style={{ left: `${position(tick)}%` }}>{fmt(new Date(tick).toISOString())}</span>)}
            </div>
          </div>
          <div className="relative">
            {todayPosition !== null && <div className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-[#ff5a45]" style={{ left: `calc(230px + (100% - 230px) * ${todayPosition / 100})` }}><span className="absolute -top-1 -translate-x-1/2 rounded-full bg-[#ff5a45] px-1.5 py-0.5 text-[8px] font-bold text-white">hoje</span></div>}
            {groups.map((group) => <section key={group.phase} className="border-b border-[#512314]/12 last:border-b-0">
              <div className="grid grid-cols-[230px_1fr] items-center bg-[#512314]/[0.045] py-2">
                <div className="flex items-center gap-2 pr-4"><span className="h-2 w-2 rounded-full bg-[#ff5a45]"/><p className="text-[11px] font-bold uppercase tracking-wide text-[#512314]">{group.phase}</p><span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[9px] font-semibold text-[#512314]/55">{group.items.length}</span></div>
                <p className="text-[9px] text-[#512314]/40">Projetos com esta etapa dentro da janela selecionada</p>
              </div>
              {group.items.map((row) => {
                const left = position(row.start)
                const width = Math.max(1.5, position(row.end) - left)
                return <div key={row.id} className="grid min-h-11 grid-cols-[230px_1fr] items-center border-t border-[#512314]/6">
                  <div className="min-w-0 pr-4 pl-4"><p className="truncate text-[11px] font-semibold text-[#512314]">{row.project}</p><p className="truncate text-[10px] text-[#512314]/55">{row.status}{row.duplicateCount > 1 ? ` · ${row.duplicateCount} registros iguais na base` : ''}</p></div>
                  <div className="relative h-6 rounded-full bg-[#512314]/5">
                    {row.milestone ? <span title={`${row.label}: ${fmt(new Date(row.start).toISOString())}`} className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3px]" style={{ left: `${left}%`, backgroundColor: stageColor(row.status) }} /> : <span title={`${fmt(new Date(row.start).toISOString())} — ${fmt(new Date(row.end).toISOString())}`} className="absolute top-1/2 h-3.5 -translate-y-1/2 rounded-full" style={{ left: `${left}%`, width: `${width}%`, backgroundColor: stageColor(row.status) }} />}
                  </div>
                </div>
              })}
            </section>)}
          </div>
        </div>
      </div> : <div className="p-4"><Empty>Nenhuma etapa ou lançamento possui data dentro desta janela. Selecione um período maior ou atualize as datas no Airtable.</Empty></div>}
    </div>
  )
}

function ProjectCards({ projects }: { projects: PortalProjectRemote[] }) {
  if (!projects.length) return <Empty>Nenhum projeto real encontrado para este tenant.</Empty>
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{projects.slice(0, 12).map((p) => (
    <article key={p.id} className="sun-card p-4">
      <div className="flex items-start justify-between gap-2"><div><p className="text-[14px] font-semibold text-[#512314]">{p.title}</p><p className="text-[11px] text-[#512314]/60">{p.artist || 'Artista não informado'}{p.release_type ? ` · ${p.release_type}` : ''} · {p.track_count} faixa{p.track_count === 1 ? '' : 's'}</p></div><span className="rounded-full bg-[#512314] px-2 py-0.5 text-[10px] font-semibold text-[#ebdbba]">{p.status}</span></div>
      <p className="mt-2 text-[10px] text-[#512314]/60">Lançamento: {fmt(p.release_date)}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[#512314]/65"><span>Capa: {asset(p.cover_status)}</span><span>Áudio: {asset(p.audio_status)}</span><span>ISRC: {asset(p.isrc_status)}</span></div>
    </article>
  ))}</div>
}

export function LiveOverview(props: Props) {
  const state = State(props); if (state) return state
  const data = props.data!
  const now = new Date(); now.setHours(12, 0, 0, 0)
  const inThirtyDays = now.getTime() + (30 * 24 * 60 * 60 * 1000)
  const upcoming = data.projects.filter((project) => { const release = dateValue(project.release_date); return release !== null && release >= now.getTime() && release <= inThirtyDays }).length
  const closedPattern = /conclu|finaliz|cancelad|distribu/i
  const openDemands = data.demands.filter((demand) => !closedPattern.test(demand.status)).length
  return <div className="mt-6 space-y-6"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-[#166534]">Dados reais · fonte: {data.source === 'airtable' ? 'Airtable Atabaque' : 'submissões Sunbeat'}</p><button onClick={props.reload} className="flex items-center gap-1 text-xs text-[#512314]/60"><RefreshCw size={12}/> atualizar</button></div><div className="grid gap-3 sm:grid-cols-3"><div className="sun-card p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#512314]/45">Projetos acompanhados</p><strong className="mt-1 block text-2xl text-[#512314]">{data.projects.length}</strong><p className="text-[11px] text-[#512314]/55">projetos reais no Airtable</p></div><div className="sun-card p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#512314]/45">Próximos 30 dias</p><strong className="mt-1 block text-2xl text-[#512314]">{upcoming}</strong><p className="text-[11px] text-[#512314]/55">lançamentos programados</p></div><div className="sun-card p-4"><p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#512314]/45"><ListTodo size={12}/> Demandas abertas</p><strong className="mt-1 block text-2xl text-[#512314]">{openDemands}</strong><p className="text-[11px] text-[#512314]/55">itens ainda não concluídos</p></div></div><OperationalGantt projects={data.projects} stages={data.stages}/><section className="sun-card p-5"><div className="flex items-start gap-3"><span className="rounded-full bg-[#166534]/10 p-2 text-[#166534]"><ShieldCheck size={18}/></span><div><h2 className="text-[15px] font-semibold text-[#512314]">Segurança e tratamento dos dados</h2><p className="mt-1 text-xs leading-relaxed text-[#512314]/65">A operação é isolada pelo tenant Atabaque, o portal exige sessão de acesso e as integrações usam credenciais mantidas somente no servidor. O tráfego é protegido por HTTPS; dados estruturados seguem para o Airtable configurado e arquivos para o Google Drive da Atabaque, respeitando as permissões administradas pela equipe.</p><p className="mt-2 text-[11px] leading-relaxed text-[#512314]/50">Serviços técnicos envolvidos: Sunbeat/Fly, Supabase, Airtable, Google Drive e Resend. Processamento por IA só acontece quando um recurso identificado como IA é acionado; a geração de timestamps está desativada no formulário atual.</p></div></div></section></div>
}

export function LiveTables(props: Props) {
  const state = State(props); if (state) return <div className="mt-6">{state}</div>
  const data = props.data!
  return <div className="mt-6 space-y-4"><div><h2 className="text-[18px] font-semibold text-[#512314]">Demandas operacionais</h2><p className="mt-1 text-xs text-[#512314]/60">Acompanhamento dos tickets, prazos, uploads e arquivos vinculados aos projetos musicais no Airtable.</p></div>{data.demands.length ? <div className="sun-card overflow-x-auto p-4"><table className="w-full min-w-[900px] text-left text-xs"><thead><tr className="border-b border-[#512314]/15 text-[#512314]/50"><th className="py-2">Ticket</th><th>Projeto / produto</th><th>Tipo</th><th>Status</th><th>Prazo</th><th>Upload</th><th>Arquivos</th></tr></thead><tbody>{data.demands.map(d => <tr key={d.id} className="border-b border-[#512314]/8 align-top"><td className="py-3 font-mono">{d.ticket || '—'}</td><td className="py-3"><p className="font-semibold">{d.project_title || d.product || '—'}</p>{d.project_title && d.product && d.project_title !== d.product ? <p className="mt-0.5 text-[10px] text-[#512314]/45">{d.product}</p> : null}</td><td className="py-3">{d.type || '—'}</td><td className="py-3">{d.status}</td><td className="py-3">{fmt(d.deadline)}</td><td className="py-3">{d.upload_status || '—'}</td><td className="py-3">{d.project_id ? (d.file_links?.length ? <div className="flex max-w-64 flex-wrap gap-1.5">{d.file_links.map((file, index) => <a key={`${file.url}-${index}`} href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[#512314]/15 bg-white/45 px-2 py-1 text-[10px] font-semibold text-[#1f6f9e] hover:bg-white/75">{file.label === 'Pasta do projeto' ? <Folder size={11}/> : file.label === 'Capa' ? <Image size={11}/> : <FileAudio size={11}/>} {file.label}<ExternalLink size={9}/></a>)}</div> : <span className="text-[10px] text-[#512314]/45">Projeto vinculado · arquivos ainda não localizados</span>) : <span className="text-[10px] text-[#512314]/35">Sem projeto musical vinculado</span>}</td></tr>)}</tbody></table></div> : <Empty>Nenhuma demanda operacional real encontrada.</Empty>}</div>
}

export function LiveInvites(props: Props) {
  const state = State(props); if (state) return state
  const items = props.data!.invites
  if (!items.length) return <Empty>Ainda não há convites reais de cadastro criados para a Atabaque.</Empty>
  return <div className="sun-card overflow-x-auto p-3"><table className="w-full min-w-[720px] text-left text-xs"><thead><tr className="border-b border-[#512314]/15 text-[#512314]/50"><th className="py-2">Perfil</th><th>Status</th><th>Criado em</th><th>Expira em</th><th>Link</th></tr></thead><tbody>{items.map(i => <tr key={i.token} className="border-b border-[#512314]/8"><td className="py-2 font-semibold">{i.profile}</td><td>{i.status}</td><td>{fmt(i.created_at)}</td><td>{fmt(i.expires_at)}</td><td><a className="flex items-center gap-1 text-[#1f6f9e]" href={i.invite_url} target="_blank" rel="noreferrer">abrir <ExternalLink size={11}/></a></td></tr>)}</tbody></table></div>
}

export function LiveDriveFolders(props: Props) {
  const state = State(props); if (state) return state
  const items = props.data!.drive_folders
  if (!items.length) return <Empty>Nenhuma pasta real do Drive foi registrada nas submissões deste tenant.</Empty>
  return <div className="sun-card p-5"><h3 className="text-sm font-semibold text-[#512314]">Pastas reais criadas no Google Drive</h3><div className="mt-3 space-y-2">{items.map(f => <a key={`${f.submission_id}-${f.folder_id}`} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-white/40 p-3 text-sm font-semibold text-[#512314] hover:bg-white/65"><Folder size={16} className="text-[#ffb53e]"/>{f.project}<ExternalLink size={12} className="ml-auto"/></a>)}</div></div>
}

export function LiveIntegrations(props: Props) {
  const state = State(props); if (state) return <div className="mt-6">{state}</div>
  const data = props.data!
  const labels: Record<string,string> = { airtable: 'Airtable', drive: 'Google Drive', email: 'E-mail (Resend)', lyrics_ai: 'IA de letras' }
  return <div className="mt-6 space-y-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(data.integrations).map(([key,it]) => <div key={key} className="sun-card p-5"><div className="flex items-center justify-between"><p className="font-bold text-[#512314]">{labels[key] || key}</p>{it.configured ? <CheckCircle2 size={16} className="text-[#166534]"/> : <CircleAlert size={16} className="text-[#b3261e]"/>}</div><p className="mt-2 text-xs text-[#512314]/65">{it.configured ? `Configurado · ${it.status}` : 'Não configurado'}</p></div>)}</div><div className="sun-card p-5"><h3 className="text-sm font-semibold text-[#512314]">Atividade real de e-mails</h3>{data.email_activity.length ? <div className="mt-3 space-y-2">{data.email_activity.map(e => <div key={`${e.submission_id}-${e.sent_at}`} className="flex gap-3 border-b border-[#512314]/8 py-2 text-xs"><strong>{e.project}</strong><span>{e.status}</span><span className="ml-auto">{fmt(e.sent_at)}</span></div>)}</div> : <p className="mt-3 text-sm text-[#512314]/55">Nenhum evento de e-mail real disponível nesta visão.</p>}</div></div>
}

export function LiveAirtable(props: Props) {
  const state = State(props); if (state) return <div className="mt-6">{state}</div>
  const data = props.data!
  return <div className="mt-6 space-y-5"><div className="sun-card p-5"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-[#512314]">Airtable da operação Atabaque</h3><span className="text-xs font-semibold text-[#166534]">{data.source === 'airtable' ? 'conectado' : 'degradado'}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div><strong className="text-2xl text-[#512314]">{data.projects.length}</strong><p className="text-xs text-[#512314]/55">projetos reais</p></div><div><strong className="text-2xl text-[#512314]">{data.sync_summary.synced}</strong><p className="text-xs text-[#512314]/55">submissões sincronizadas</p></div><div><strong className="text-2xl text-[#512314]">{data.sync_summary.failed}</strong><p className="text-xs text-[#512314]/55">falhas de sincronização</p></div></div></div><ProjectCards projects={data.projects}/></div>
}
