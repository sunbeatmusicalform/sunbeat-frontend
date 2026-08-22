import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Database,
  Eye,
  FileAudio,
  Filter,
  Folder,
  Image,
  Layers3,
  ListTodo,
  Music2,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import type {
  PortalDataRemote,
  PortalDemandRemote,
  PortalProjectRemote,
  PortalStageRemote,
} from '../lib/api'

type Props = {
  data: PortalDataRemote | null
  loading: boolean
  reload: () => void
}

type ModuleKey = 'projects' | 'stages' | 'demands'
type ViewKey = 'all' | 'attention' | 'upcoming'
type SourceRecord = PortalProjectRemote | PortalStageRemote | PortalDemandRemote

type TableRecord = {
  id: string
  module: ModuleKey
  title: string
  subtitle: string
  status: string
  date?: string | null
  health: 'healthy' | 'attention' | 'neutral'
  healthLabel: string
  context: string
  source: SourceRecord
}

const moduleOptions: Array<{ key: ModuleKey; label: string; icon: typeof Music2 }> = [
  { key: 'projects', label: 'Projetos', icon: Music2 },
  { key: 'stages', label: 'Etapas', icon: Layers3 },
  { key: 'demands', label: 'Demandas', icon: ListTodo },
]

const viewOptions: Array<{ key: ViewKey; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'attention', label: 'Precisam de atenção' },
  { key: 'upcoming', label: 'Próximos 30 dias' },
]

function normalized(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function dateValue(value?: string | null) {
  if (!value) return null
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
}

function formatDate(value?: string | null) {
  const parsed = dateValue(value)
  return parsed === null ? 'Sem data' : new Intl.DateTimeFormat('pt-BR').format(new Date(parsed))
}

function projectHealth(project: PortalProjectRemote): Pick<TableRecord, 'health' | 'healthLabel'> {
  const syncFailed = /fail|erro|error/i.test(project.sync_status)
  const missingAsset = [project.cover_status, project.audio_status, project.isrc_status]
    .some((status) => status === 'pending')
  if (syncFailed) return { health: 'attention', healthLabel: 'Falha de sincronização' }
  if (missingAsset) return { health: 'attention', healthLabel: 'Assets pendentes' }
  if ([project.cover_status, project.audio_status, project.isrc_status].every((status) => status === 'unknown')) {
    return { health: 'neutral', healthLabel: 'Ainda sem diagnóstico' }
  }
  return { health: 'healthy', healthLabel: 'Estrutura consistente' }
}

function stageHealth(stage: PortalStageRemote): Pick<TableRecord, 'health' | 'healthLabel'> {
  if (/atras|risco|bloq|cr[ií]tic/i.test(`${stage.risk} ${stage.status}`)) {
    return { health: 'attention', healthLabel: stage.risk || 'Prazo em risco' }
  }
  if (/conclu|aprova|n[aã]o se aplica/i.test(stage.status)) {
    return { health: 'healthy', healthLabel: 'Etapa resolvida' }
  }
  return { health: 'neutral', healthLabel: stage.active ? 'Etapa ativa' : 'Etapa planejada' }
}

function demandHealth(demand: PortalDemandRemote): Pick<TableRecord, 'health' | 'healthLabel'> {
  const deadline = dateValue(demand.deadline)
  const closed = /conclu|finaliz|cancelad|entreg/i.test(demand.status)
  if (!closed && deadline !== null && deadline < Date.now()) {
    return { health: 'attention', healthLabel: 'Prazo vencido' }
  }
  if (/falh|erro|pendente/i.test(`${demand.upload_status} ${demand.status}`)) {
    return { health: 'attention', healthLabel: 'Ação necessária' }
  }
  return closed
    ? { health: 'healthy', healthLabel: 'Demanda resolvida' }
    : { health: 'neutral', healthLabel: 'Em acompanhamento' }
}

function recordsFor(data: PortalDataRemote, module: ModuleKey): TableRecord[] {
  if (module === 'projects') {
    return data.projects.map((project) => ({
      id: project.id,
      module,
      title: project.title || 'Projeto sem título',
      subtitle: project.artist || 'Artista não informado',
      status: project.status || 'Sem status',
      date: project.release_date,
      context: `${project.release_type || 'Formato não informado'} · ${project.track_count} faixa${project.track_count === 1 ? '' : 's'}`,
      source: project,
      ...projectHealth(project),
    }))
  }

  if (module === 'stages') {
    return data.stages.map((stage) => ({
      id: stage.id,
      module,
      title: stage.name || stage.macroarea || 'Etapa sem nome',
      subtitle: stage.project || 'Projeto não vinculado',
      status: stage.status || 'Sem status',
      date: stage.end_date || stage.start_date,
      context: `${stage.macroarea || 'Sem macroárea'}${stage.responsible ? ` · ${stage.responsible}` : ''}`,
      source: stage,
      ...stageHealth(stage),
    }))
  }

  return data.demands.map((demand) => ({
    id: demand.id,
    module,
    title: demand.project_title || demand.product || demand.ticket || 'Demanda sem título',
    subtitle: demand.ticket || demand.product || 'Ticket não informado',
    status: demand.status || 'Sem status',
    date: demand.deadline || demand.release_date,
    context: `${demand.type || 'Tipo não informado'}${demand.upload_status ? ` · ${demand.upload_status}` : ''}`,
    source: demand,
    ...demandHealth(demand),
  }))
}

function HealthBadge({ record }: { record: TableRecord }) {
  const styles = {
    healthy: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    attention: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
    neutral: 'border-border bg-muted text-muted-foreground',
  }
  const Icon = record.health === 'healthy' ? CheckCircle2 : record.health === 'attention' ? CircleAlert : Eye
  return <Badge variant="outline" className={styles[record.health]}><Icon />{record.healthLabel}</Badge>
}

function DetailField({ label, value }: { label: string; value: unknown }) {
  const shown = value === null || value === undefined || value === '' ? 'Não informado' : String(value)
  return <div className="grid gap-1 border-b border-border/70 py-3 sm:grid-cols-[140px_1fr]">
    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
    <dd className="break-words text-sm text-foreground">{shown}</dd>
  </div>
}

function RecordDetails({ record }: { record: TableRecord }) {
  if (record.module === 'projects') {
    const project = record.source as PortalProjectRemote
    return <dl>
      <DetailField label="Artista" value={project.artist} />
      <DetailField label="Formato" value={project.release_type} />
      <DetailField label="Data de lançamento" value={formatDate(project.release_date)} />
      <DetailField label="Faixas" value={project.track_count} />
      <DetailField label="Gênero" value={project.genre} />
      <DetailField label="Capa" value={project.cover_status} />
      <DetailField label="Áudio" value={project.audio_status} />
      <DetailField label="ISRC" value={project.isrc_status} />
      <DetailField label="Sincronização" value={project.sync_status} />
    </dl>
  }

  if (record.module === 'stages') {
    const stage = record.source as PortalStageRemote
    return <dl>
      <DetailField label="Projeto" value={stage.project} />
      <DetailField label="Macroárea" value={stage.macroarea} />
      <DetailField label="Responsável" value={stage.responsible} />
      <DetailField label="Início" value={formatDate(stage.start_date)} />
      <DetailField label="Fim" value={formatDate(stage.end_date)} />
      <DetailField label="Concluída em" value={formatDate(stage.completion_date)} />
      <DetailField label="Risco" value={stage.risk} />
      <DetailField label="Ativa" value={stage.active ? 'Sim' : 'Não'} />
    </dl>
  }

  const demand = record.source as PortalDemandRemote
  return <div>
    <dl>
      <DetailField label="Ticket" value={demand.ticket} />
      <DetailField label="Projeto" value={demand.project_title} />
      <DetailField label="Produto" value={demand.product} />
      <DetailField label="Tipo" value={demand.type} />
      <DetailField label="Prazo" value={formatDate(demand.deadline)} />
      <DetailField label="Upload" value={demand.upload_status} />
    </dl>
    {demand.file_links?.length ? <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Arquivos vinculados</p>
      <div className="mt-3 space-y-2">{demand.file_links.map((file, index) => {
        const Icon = file.label === 'Pasta do projeto' ? Folder : file.label === 'Capa' ? Image : FileAudio
        return <a key={`${file.url}-${index}`} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
          <Icon className="size-4 text-primary" />{file.label}<ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
        </a>
      })}</div>
    </div> : null}
  </div>
}

export function SunbeatTables({ data, loading, reload }: Props) {
  const [module, setModule] = useState<ModuleKey>('projects')
  const [workspaceViews, setWorkspaceViews] = useState<Record<string, ViewKey>>({})
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<TableRecord | null>(null)

  const savedView = data
    ? window.localStorage.getItem(`sunbeat:tables:view:${data.workspace_slug}`)
    : null
  const view: ViewKey = data
    ? workspaceViews[data.workspace_slug]
      ?? (viewOptions.some((option) => option.key === savedView) ? savedView as ViewKey : 'all')
    : 'all'

  const selectView = (nextView: ViewKey) => {
    if (!data) return
    window.localStorage.setItem(`sunbeat:tables:view:${data.workspace_slug}`, nextView)
    setWorkspaceViews((current) => ({ ...current, [data.workspace_slug]: nextView }))
  }

  const records = useMemo(() => data ? recordsFor(data, module) : [], [data, module])
  const filtered = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const horizon = today.getTime() + (30 * 24 * 60 * 60 * 1000)
    const needle = normalized(query)
    return records.filter((record) => {
      const searchable = normalized(`${record.title} ${record.subtitle} ${record.status} ${record.context} ${record.healthLabel}`)
      if (needle && !searchable.includes(needle)) return false
      if (view === 'attention' && record.health !== 'attention') return false
      if (view === 'upcoming') {
        const date = dateValue(record.date)
        if (date === null || date < today.getTime() || date > horizon) return false
      }
      return true
    })
  }, [query, records, view])

  if (loading) return <div className="mt-6 sun-card p-6 text-sm text-muted-foreground">Carregando a operação deste workspace…</div>
  if (!data) return <div className="mt-6 sun-card p-6">
    <p className="text-sm font-semibold text-foreground">Os dados operacionais estão temporariamente indisponíveis.</p>
    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={reload}><RefreshCw />Tentar novamente</Button>
  </div>

  const automation = data.integrations.automation
  const attentionCount = records.filter((record) => record.health === 'attention').length
  const activeModule = moduleOptions.find((option) => option.key === module) ?? moduleOptions[0]
  const ActiveModuleIcon = activeModule.icon

  return <div className="mt-6 space-y-4">
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-gradient-to-br from-card via-card to-primary/[0.05] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary"><Database />Sunbeat Tables</Badge>
              <Badge variant="outline" className="text-muted-foreground"><ShieldCheck />Somente leitura</Badge>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">A operação musical em uma única visão.</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Projetos, calendário e demandas são organizados sem duplicar a fonte oficial. Cada linha abaixo vem do workspace autenticado.
            </p>
          </div>
          <div className="grid min-w-64 grid-cols-3 gap-2">
            <div className="rounded-lg border border-border bg-background/55 p-3"><strong className="text-xl text-foreground">{records.length}</strong><p className="text-[10px] uppercase tracking-wide text-muted-foreground">registros</p></div>
            <div className="rounded-lg border border-border bg-background/55 p-3"><strong className="text-xl text-foreground">{attentionCount}</strong><p className="text-[10px] uppercase tracking-wide text-muted-foreground">atenção</p></div>
            <div className="rounded-lg border border-border bg-background/55 p-3"><strong className="text-xl text-foreground">{data.sync_summary.failed}</strong><p className="text-[10px] uppercase tracking-wide text-muted-foreground">falhas</p></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-background/35 p-3 lg:border-r lg:border-b-0">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tabelas</p>
          <div className="grid grid-cols-3 gap-1 lg:grid-cols-1">{moduleOptions.map((option) => {
            const Icon = option.icon
            const count = recordsFor(data, option.key).length
            const active = module === option.key
            return <button key={option.key} type="button" onClick={() => { setModule(option.key); setSelected(null) }} aria-pressed={active} className={`flex min-h-10 items-center gap-2 rounded-lg px-3 text-left text-xs font-medium transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <Icon className="size-4" /><span className="truncate">{option.label}</span><span className="ml-auto hidden text-[10px] opacity-70 sm:inline">{count}</span>
            </button>
          })}</div>
          <div className="mt-4 hidden border-t border-border pt-4 lg:block">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Fonte</p>
            <div className="mt-2 flex items-center gap-2 px-2 text-xs text-foreground"><span className="size-2 rounded-full bg-emerald-400" />{data.source === 'airtable' ? 'Airtable conectado' : 'Banco Sunbeat'}</div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="space-y-3 border-b border-border p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="flex items-center gap-2">
                <ActiveModuleIcon className="size-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">{activeModule.label}</p>
                <Badge variant="secondary">{filtered.length}</Badge>
              </div>
              <div className="relative min-w-0 flex-1 xl:ml-4">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar em ${activeModule.label.toLocaleLowerCase('pt-BR')}…`} className="pl-9" />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={reload}><RefreshCw />Atualizar</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground"><Filter className="size-3.5" />Visões rápidas</span>
              {viewOptions.map((option) => <button key={option.key} type="button" onClick={() => selectView(option.key)} aria-pressed={view === option.key} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${view === option.key ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{option.label}</button>)}
            </div>
          </div>

          {filtered.length ? <Table>
            <TableHeader><TableRow className="bg-muted/25">
              <TableHead className="w-[36%] pl-4">Registro</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Contexto</TableHead>
              <TableHead className="pr-4">Diagnóstico</TableHead>
            </TableRow></TableHeader>
            <TableBody>{filtered.map((record) => <TableRow key={`${record.module}-${record.id}`} className="group">
              <TableCell className="pl-4">
                <button type="button" onClick={() => setSelected(record)} className="block max-w-[360px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">{record.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{record.subtitle}</span>
                </button>
              </TableCell>
              <TableCell><Badge variant="secondary" className="max-w-44 truncate">{record.status}</Badge></TableCell>
              <TableCell className="text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{formatDate(record.date)}</span></TableCell>
              <TableCell className="max-w-64 truncate text-xs text-muted-foreground">{record.context}</TableCell>
              <TableCell className="pr-4"><HealthBadge record={record} /></TableCell>
            </TableRow>)}</TableBody>
          </Table> : <div className="grid min-h-56 place-items-center p-8 text-center"><div><Search className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm font-semibold text-foreground">Nenhum registro nesta visão.</p><p className="mt-1 text-xs text-muted-foreground">Limpe a busca ou selecione outra visão rápida.</p></div></div>}
        </div>
      </div>
    </section>

    <section className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary"><Bot className="size-4" /></span>
        <div><p className="text-sm font-semibold text-foreground">Automação externa</p><p className="mt-0.5 text-xs text-muted-foreground">Eventos assinados e auditáveis, liberados individualmente por workspace. Regras críticas continuam na Sunbeat.</p></div>
      </div>
      <Badge variant="outline" className={automation?.configured ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'text-muted-foreground'}>{automation?.configured ? <CheckCircle2 /> : <CircleAlert />}{automation?.configured ? 'Pronta' : 'Desativada com segurança'}</Badge>
    </section>

    <Sheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null) }}>
      <SheetContent className="w-full overflow-y-auto bg-card sm:max-w-lg">
        {selected ? <>
          <SheetHeader className="border-b border-border pr-12">
            <div className="flex items-center gap-2"><Badge variant="outline">{moduleOptions.find((item) => item.key === selected.module)?.label}</Badge><HealthBadge record={selected} /></div>
            <SheetTitle className="pt-2 text-xl">{selected.title}</SheetTitle>
            <SheetDescription>{selected.subtitle}. Visualização protegida e somente leitura.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-8"><RecordDetails record={selected} /></div>
        </> : null}
      </SheetContent>
    </Sheet>
  </div>
}
