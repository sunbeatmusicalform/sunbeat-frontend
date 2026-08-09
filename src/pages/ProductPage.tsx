import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowLeft, ArrowRight, AudioLines, Check, CircleCheck, CloudUpload, Database,
  FileImage, FileSpreadsheet, Link2, Mail, Save, Search, ShieldCheck, Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { resolveConceptLocale, type ConceptLocale } from '@/concept/copy'

type DemoStep = 'contact' | 'project' | 'tracks' | 'marketing' | 'review'

const COPY = {
  en: {
    back: 'Back to Sunbeat', kicker: 'Product walkthrough', title: 'See the form do the operational work.',
    body: 'Sunbeat collects release data, checks files while they are uploaded and delivers a structured record your team can actually operate.',
    cta: 'Start free', preview: 'Interactive product preview', safe: 'Demonstration with sample data',
    steps: [['contact', 'Contact'], ['project', 'Project'], ['tracks', 'Tracks'], ['marketing', 'Marketing'], ['review', 'Review']] as [DemoStep, string][],
    featureKicker: 'What the form handles', featureTitle: 'Less chasing. Better data at the source.',
    featureBody: 'Each capability appears at the moment it is useful, so artists and partners receive guidance without seeing the complexity behind the operation.',
    outputKicker: 'After submission', outputTitle: 'One answer becomes an organized operation.',
    outputs: ['Structured Airtable records', 'Files routed to Google Drive', 'Stage emails and edit links', 'History ready for review'],
    note: 'Google Sheets is the next planned connector. Notion remains under evaluation and is not presented as available today.',
    finalTitle: 'Ready to replace the improvised form and the follow-up spreadsheet?', finalCta: 'Create a workspace',
  },
  'pt-BR': {
    back: 'Voltar para a Sunbeat', kicker: 'Visão do produto', title: 'Veja o formulário fazer o trabalho operacional.',
    body: 'A Sunbeat coleta os dados do lançamento, verifica os arquivos durante o envio e entrega um registro estruturado que sua equipe consegue operar.',
    cta: 'Começar grátis', preview: 'Demonstração interativa do produto', safe: 'Demonstração com dados fictícios',
    steps: [['contact', 'Contato'], ['project', 'Projeto'], ['tracks', 'Faixas'], ['marketing', 'Marketing'], ['review', 'Revisão']] as [DemoStep, string][],
    featureKicker: 'O que o formulário resolve', featureTitle: 'Menos cobrança. Dados melhores desde a origem.',
    featureBody: 'Cada recurso aparece no momento em que é útil. Artistas e parceiros recebem orientação sem precisar conhecer a complexidade da operação.',
    outputKicker: 'Depois do envio', outputTitle: 'Uma resposta se transforma em uma operação organizada.',
    outputs: ['Registros estruturados no Airtable', 'Arquivos organizados no Google Drive', 'E-mails de etapa e links de edição', 'Histórico pronto para revisão'],
    note: 'Google Sheets é o próximo conector planejado. Notion continua em avaliação e não é apresentado como disponível hoje.',
    finalTitle: 'Pronto para substituir o formulário improvisado e a planilha de acompanhamento?', finalCta: 'Criar um workspace',
  },
} as const

const FEATURES = {
  en: [
    [Save, 'Continuous drafts', 'Progress is saved and can be resumed from a secure link.'],
    [Search, 'Linked registries', 'Find artists and contacts before creating duplicate records.'],
    [FileImage, 'Artwork audit', 'Dimensions, format and distributor requirements are checked immediately.'],
    [AudioLines, 'Audio audit', 'Duration, sample rate, bit depth and channels are read from the master.'],
    [Sparkles, 'Lyrics assistant', 'AI suggests timestamps that remain under human review.'],
    [ShieldCheck, 'Human review', 'The sender sees a complete summary and confirms truthfulness before submission.'],
    [Mail, 'Operational email', 'Draft, receipt, adjustment and approval messages keep everyone aligned.'],
    [Database, 'Structured destination', 'Answers and files arrive ready for Airtable, Drive and the next connector.'],
  ],
  'pt-BR': [
    [Save, 'Rascunhos contínuos', 'O progresso é salvo e pode ser retomado por um link seguro.'],
    [Search, 'Cadastros vinculados', 'Encontre artistas e contatos antes de criar registros duplicados.'],
    [FileImage, 'Auditoria de capa', 'Dimensões, formato e exigências de distribuição são conferidos na hora.'],
    [AudioLines, 'Auditoria de áudio', 'Duração, sample rate, bit depth e canais são lidos diretamente do master.'],
    [Sparkles, 'Assistente de letras', 'A IA sugere timestamps que continuam sujeitos à revisão humana.'],
    [ShieldCheck, 'Revisão humana', 'A pessoa vê o resumo completo e confirma a veracidade antes do envio.'],
    [Mail, 'E-mail operacional', 'Rascunho, recebimento, ajustes e aprovação mantêm todos alinhados.'],
    [Database, 'Destino estruturado', 'Respostas e arquivos chegam prontos para Airtable, Drive e o próximo conector.'],
  ],
} as const

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div><p className="text-xs font-semibold text-white/75">{label}</p><div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">{value}</div>{hint && <p className="mt-1.5 text-[11px] text-white/35">{hint}</p>}</div>
}

function DemoContent({ step, locale }: { step: DemoStep; locale: ConceptLocale }) {
  const pt = locale === 'pt-BR'
  if (step === 'contact') return <div className="space-y-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#fbbb1e]">{pt ? 'Etapa 1 · Identificação' : 'Step 1 · Contact'}</p><h3 className="mt-2 text-2xl font-semibold text-white">{pt ? 'Quem está enviando?' : 'Who is submitting?'}</h3></div><Field label={pt ? 'Nome e e-mail' : 'Name and email'} value="Marina Costa · marina@example.com" /><div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-sky-200"><Search className="size-4" />{pt ? 'Cadastro encontrado' : 'Existing record found'}</div><p className="mt-2 text-xs leading-5 text-white/45">{pt ? 'Confirme a pessoa correta antes de vincular o envio.' : 'Confirm the right person before linking this submission.'}</p></div><div className="flex items-center gap-2 text-xs text-emerald-300"><CloudUpload className="size-4" />{pt ? 'Rascunho salvo agora' : 'Draft saved just now'}</div></div>
  if (step === 'project') return <div className="space-y-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#fbbb1e]">{pt ? 'Etapa 2 · Projeto' : 'Step 2 · Project'}</p><h3 className="mt-2 text-2xl font-semibold text-white">{pt ? 'Sobre o lançamento' : 'About the release'}</h3></div><div className="grid gap-4 sm:grid-cols-2"><Field label={pt ? 'Nome do projeto' : 'Project name'} value={pt ? 'Sol da Meia-noite' : 'Midnight Sun'} /><Field label={pt ? 'Formato' : 'Format'} value={pt ? 'Single · 1 faixa' : 'Single · 1 track'} /></div><div className="rounded-2xl border border-dashed border-white/20 bg-black/15 p-5 text-center"><FileImage className="mx-auto size-6 text-[#fbbb1e]" /><p className="mt-2 text-sm font-semibold text-white">capa-final.png</p><p className="mt-1 text-xs text-white/40">3000 × 3000 px · PNG · 4.8 MB</p></div><div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-4"><p className="flex items-center gap-2 text-sm font-semibold text-emerald-200"><CircleCheck className="size-4" />{pt ? 'Capa aprovada para distribuição' : 'Artwork ready for distribution'}</p><p className="mt-2 text-xs text-white/45">Spotify · Apple Music · Deezer · ONErpm</p></div></div>
  if (step === 'tracks') return <div className="space-y-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#fbbb1e]">{pt ? 'Etapa 3 · Faixas' : 'Step 3 · Tracks'}</p><h3 className="mt-2 text-2xl font-semibold text-white">{pt ? 'Áudio e créditos' : 'Audio and credits'}</h3></div><Field label={pt ? 'Artista principal' : 'Main artist'} value="Alaíde Tropical · cadastro vinculado" hint={pt ? 'A correspondência foi confirmada.' : 'The registry match was confirmed.'} /><div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-emerald-200"><AudioLines className="size-4" />master-final.wav</div><p className="mt-2 text-xs leading-5 text-white/55">5:49 min · 44.1 kHz · 16 bits · estéreo</p><p className="mt-1 text-xs text-emerald-300">✓ {pt ? 'Compatível com a matriz estéreo configurada' : 'Compatible with the configured stereo matrix'}</p></div><div className="rounded-2xl border border-[#fbbb1e]/20 bg-[#fbbb1e]/[0.05] p-4"><p className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles className="size-4 text-[#fbbb1e]" />{pt ? 'Sincronização de letra' : 'Lyrics synchronization'}</p><p className="mt-2 text-xs leading-5 text-white/45">{pt ? 'A IA sugere os timestamps. Sua equipe revisa antes de exportar.' : 'AI suggests timestamps. Your team reviews them before export.'}</p></div></div>
  if (step === 'marketing') return <div className="space-y-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#fbbb1e]">{pt ? 'Etapa 4 · Marketing' : 'Step 4 · Marketing'}</p><h3 className="mt-2 text-2xl font-semibold text-white">{pt ? 'Plano de divulgação' : 'Release campaign'}</h3></div><Field label={pt ? 'Objetivo principal' : 'Primary goal'} value={pt ? 'Crescer ouvintes recorrentes' : 'Grow returning listeners'} /><div className="grid gap-3 sm:grid-cols-2">{['Spotify pitch', 'Pre-save', pt ? 'Kit visual' : 'Visual kit', pt ? 'Agenda de conteúdo' : 'Content calendar'].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 p-3 text-sm text-white/70"><span className={`grid size-5 place-items-center rounded-full ${index < 2 ? 'bg-emerald-400 text-[#001018]' : 'border border-white/20'}`}>{index < 2 && <Check className="size-3" />}</span>{item}</div>)}</div><p className="text-xs leading-5 text-white/40">{pt ? 'Campos condicionais aparecem de acordo com o plano informado.' : 'Conditional fields appear according to the submitted plan.'}</p></div>
  return <div className="space-y-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#fbbb1e]">{pt ? 'Etapa 5 · Revisão' : 'Step 5 · Review'}</p><h3 className="mt-2 text-2xl font-semibold text-white">{pt ? 'Tudo pronto para enviar' : 'Ready to submit'}</h3></div>{[pt ? 'Identificação confirmada' : 'Contact confirmed', pt ? 'Projeto e capa validados' : 'Project and artwork validated', pt ? 'Áudio e créditos revisados' : 'Audio and credits reviewed', pt ? 'Plano de marketing preenchido' : 'Marketing plan completed'].map((item) => <div key={item} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/15 p-3.5 text-sm text-white/70"><span>{item}</span><CircleCheck className="size-4 text-emerald-300" /></div>)}<div className="rounded-xl border border-white/10 p-4 text-xs leading-5 text-white/45"><ShieldCheck className="mb-2 size-5 text-[#fbbb1e]" />{pt ? 'A pessoa confirma a veracidade das informações e aceita a política aplicável antes do envio.' : 'The sender confirms the information and accepts the applicable policy before submission.'}</div></div>
}

export default function ProductPage() {
  const [locale] = useState<ConceptLocale>(() => resolveConceptLocale())
  const [step, setStep] = useState<DemoStep>('project')
  const copy = COPY[locale]
  const activeIndex = copy.steps.findIndex(([id]) => id === step)
  useEffect(() => { document.title = locale === 'pt-BR' ? 'Produto | Sunbeat' : 'Product | Sunbeat' }, [locale])

  return <div className="min-h-screen bg-[#000e14] text-[#f5eeda]">
    <header className="border-b border-white/10 bg-[#000e14]/90 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8"><Link to="/"><img src="/brand/logo-horizontal.svg" alt="Sunbeat" className="h-8 w-auto" /></Link><div className="flex items-center gap-2"><Button asChild variant="ghost" className="hidden text-white/60 hover:bg-white/5 hover:text-white sm:inline-flex"><Link to="/"><ArrowLeft />{copy.back}</Link></Button><Button asChild><Link to="/signup">{copy.cta}<ArrowRight /></Link></Button></div></div></header>
    <main>
      <section className="relative overflow-hidden px-5 pb-16 pt-20 md:px-8 md:pb-24 md:pt-28"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(14,165,233,0.13),transparent_35%),radial-gradient(circle_at_85%_65%,rgba(251,187,30,0.10),transparent_30%)]" /><div className="relative mx-auto max-w-5xl text-center"><p className="story-kicker">{copy.kicker}</p><h1 className="mx-auto mt-5 max-w-4xl text-4xl font-semibold leading-[1.03] tracking-[-0.04em] text-white md:text-7xl">{copy.title}</h1><p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/55 md:text-lg">{copy.body}</p></div></section>
      <section className="px-4 pb-24 md:px-8 md:pb-32"><div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[#03151e] p-3 shadow-[0_40px_120px_rgba(0,0,0,0.35)] md:p-6"><div className="flex flex-col gap-3 border-b border-white/10 px-2 pb-5 pt-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-white">{copy.preview}</p><p className="mt-1 text-xs text-white/35">Sunbeat · Release intake</p></div><Badge variant="outline" className="border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-200"><ShieldCheck />{copy.safe}</Badge></div><Tabs value={step} onValueChange={(value) => setStep(value as DemoStep)} className="mt-5 gap-6"><TabsList className="grid h-auto w-full grid-cols-5 gap-1 bg-white/[0.04] p-1.5">{copy.steps.map(([id, label], index) => <TabsTrigger key={id} value={id} className="h-auto flex-col gap-1.5 py-2 text-[10px] text-white/45 data-[state=active]:bg-[#fbbb1e] data-[state=active]:text-[#001018] sm:flex-row sm:text-xs"><span className="grid size-5 place-items-center rounded-full border border-current/25 text-[9px]">{index + 1}</span>{label}</TabsTrigger>)}</TabsList><Progress value={((activeIndex + 1) / copy.steps.length) * 100} className="h-1 bg-white/10 [&_[data-slot=progress-indicator]]:bg-[#fbbb1e]" />{copy.steps.map(([id]) => <TabsContent key={id} value={id}><div className="grid gap-6 lg:grid-cols-[1fr_0.68fr]"><Card className="min-h-[470px] rounded-3xl border-white/10 bg-[#061a24] py-0"><CardContent className="p-6 md:p-9"><DemoContent step={id} locale={locale} /></CardContent></Card><Card className="rounded-3xl border-[#fbbb1e]/20 bg-[#fbbb1e]/[0.045]"><CardHeader><CardTitle className="text-xl text-white">MotorSchema</CardTitle><CardDescription className="leading-6 text-white/45">{locale === 'pt-BR' ? 'O formulário adapta campos, regras e orientações à operação aprovada.' : 'The form adapts fields, rules and guidance to the approved operation.'}</CardDescription></CardHeader><CardContent className="space-y-3">{FEATURES[locale].slice(Math.max(0, activeIndex), Math.max(0, activeIndex) + 4).map(([Icon, title]) => <div key={title} className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/10 p-3 text-sm text-white/70"><Icon className="size-4 text-[#fbbb1e]" />{title}</div>)}</CardContent></Card></div></TabsContent>)}</Tabs></div></section>
      <section className="border-y border-white/10 bg-white/[0.025] px-5 py-24 md:px-8 md:py-32"><div className="mx-auto max-w-7xl"><p className="story-kicker text-center">{copy.featureKicker}</p><h2 className="mx-auto mt-4 max-w-3xl text-center text-3xl font-semibold leading-tight text-white md:text-5xl">{copy.featureTitle}</h2><p className="mx-auto mt-5 max-w-2xl text-center leading-7 text-white/50">{copy.featureBody}</p><div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{FEATURES[locale].map(([Icon, title, body]) => <Card key={title} className="border-white/10 bg-[#061a24] transition hover:-translate-y-1 hover:border-[#fbbb1e]/25"><CardHeader><span className="grid size-10 place-items-center rounded-xl bg-[#fbbb1e]/10 text-[#fbbb1e]"><Icon className="size-5" /></span><CardTitle className="mt-3 text-lg text-white">{title}</CardTitle><CardDescription className="leading-6 text-white/45">{body}</CardDescription></CardHeader></Card>)}</div></div></section>
      <section className="px-5 py-24 md:px-8 md:py-32"><div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="story-kicker">{copy.outputKicker}</p><h2 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-5xl">{copy.outputTitle}</h2><div className="mt-7 space-y-3">{copy.outputs.map((item) => <p key={item} className="flex items-center gap-3 text-sm text-white/65"><Check className="size-4 text-[#fbbb1e]" />{item}</p>)}</div></div><div className="grid gap-3 sm:grid-cols-3"><Card className="border-emerald-400/20 bg-emerald-400/[0.05]"><CardHeader><Database className="size-6 text-emerald-300" /><CardTitle className="text-lg text-white">Airtable</CardTitle><CardDescription className="text-emerald-200/55">{locale === 'pt-BR' ? 'Disponível agora' : 'Available now'}</CardDescription></CardHeader></Card><Card className="border-[#fbbb1e]/20 bg-[#fbbb1e]/[0.04]"><CardHeader><FileSpreadsheet className="size-6 text-[#fbbb1e]" /><CardTitle className="text-lg text-white">Google Sheets</CardTitle><CardDescription className="text-white/40">{locale === 'pt-BR' ? 'Próximo conector' : 'Next connector'}</CardDescription></CardHeader></Card><Card className="border-white/10 bg-white/[0.025]"><CardHeader><Link2 className="size-6 text-white/40" /><CardTitle className="text-lg text-white">Notion</CardTitle><CardDescription className="text-white/35">{locale === 'pt-BR' ? 'Em avaliação' : 'Under evaluation'}</CardDescription></CardHeader></Card></div><p className="text-xs leading-5 text-white/30 lg:col-start-2">{copy.note}</p></div></section>
      <section className="border-t border-white/10 px-5 py-20 text-center md:px-8 md:py-28"><h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight text-white md:text-5xl">{copy.finalTitle}</h2><Button asChild size="lg" className="mt-8 rounded-full px-7"><Link to="/signup">{copy.finalCta}<ArrowRight /></Link></Button></section>
    </main>
  </div>
}
