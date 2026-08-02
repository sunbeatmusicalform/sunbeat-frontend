import { CheckCircle2, CircleAlert, ExternalLink, Folder, RefreshCw, ShieldCheck } from 'lucide-react'
import type { PortalDataRemote, PortalProjectRemote } from '../lib/api'

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
  return <div className="mt-6 space-y-6"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-[#166534]">Dados reais · fonte: {data.source === 'airtable' ? 'Airtable Atabaque' : 'submissões Sunbeat'}</p><button onClick={props.reload} className="flex items-center gap-1 text-xs text-[#512314]/60"><RefreshCw size={12}/> atualizar</button></div><ProjectCards projects={data.projects}/><section className="sun-card p-5"><div className="flex items-start gap-3"><span className="rounded-full bg-[#166534]/10 p-2 text-[#166534]"><ShieldCheck size={18}/></span><div><h2 className="text-[15px] font-semibold text-[#512314]">Segurança e tratamento dos dados</h2><p className="mt-1 text-xs leading-relaxed text-[#512314]/65">A operação é isolada pelo tenant Atabaque, o portal exige sessão de acesso e as integrações usam credenciais mantidas somente no servidor. O tráfego é protegido por HTTPS; dados estruturados seguem para o Airtable configurado e arquivos para o Google Drive da Atabaque, respeitando as permissões administradas pela equipe.</p><p className="mt-2 text-[11px] leading-relaxed text-[#512314]/50">Serviços técnicos envolvidos: Sunbeat/Fly, Supabase, Airtable, Google Drive e Resend. Processamento por IA só acontece quando um recurso identificado como IA é acionado; a geração de timestamps está desativada no formulário atual.</p></div></div></section><section><h2 className="mb-2 text-[15px] font-semibold text-[#512314]">Etapas reais da operação</h2>{data.stages.length ? <div className="sun-card overflow-x-auto p-4"><table className="w-full min-w-[700px] text-left text-xs"><thead><tr className="border-b border-[#512314]/15 text-[#512314]/50"><th className="py-2">Projeto</th><th>Etapa</th><th>Status</th><th>Responsável</th><th>Prazo</th></tr></thead><tbody>{data.stages.slice(0, 30).map(s => <tr key={s.id} className="border-b border-[#512314]/8"><td className="py-2 font-semibold text-[#512314]">{s.project}</td><td>{s.name}</td><td>{s.status}</td><td>{s.responsible || '—'}</td><td>{fmt(s.end_date || s.release_date)}</td></tr>)}</tbody></table></div> : <Empty>Nenhuma etapa real vinculada aos projetos atuais.</Empty>}</section></div>
}

export function LiveTables(props: Props) {
  const state = State(props); if (state) return <div className="mt-6">{state}</div>
  const data = props.data!
  return <div className="mt-6 space-y-5"><section><h2 className="mb-2 text-[15px] font-semibold text-[#512314]">Projetos musicais</h2><ProjectCards projects={data.projects}/></section><section><h2 className="mb-2 text-[15px] font-semibold text-[#512314]">Demandas operacionais</h2>{data.demands.length ? <div className="sun-card overflow-x-auto p-4"><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b border-[#512314]/15 text-[#512314]/50"><th className="py-2">Ticket</th><th>Produto</th><th>Tipo</th><th>Status</th><th>Prazo</th><th>Upload</th></tr></thead><tbody>{data.demands.map(d => <tr key={d.id} className="border-b border-[#512314]/8"><td className="py-2 font-mono">{d.ticket || '—'}</td><td className="font-semibold">{d.product || '—'}</td><td>{d.type || '—'}</td><td>{d.status}</td><td>{fmt(d.deadline)}</td><td>{d.upload_status || '—'}</td></tr>)}</tbody></table></div> : <Empty>Nenhuma demanda operacional real encontrada.</Empty>}</section></div>
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
