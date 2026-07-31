import { Link } from 'react-router'
import { ArrowRight, Building2, FileCheck2, LayoutDashboard, Rocket, UserRound } from 'lucide-react'
import { AtabaqueMark } from '@/components/AtabaqueMark'

const FORMS = [
  {
    to: '/intake/atabaque', icon: Rocket, title: 'Lançamento musical',
    desc: 'Intake completo de release: projeto, faixas com análise de WAV, capa, divulgação e revisão.',
    tag: 'Aprovado',
  },
  {
    to: '/clearance/atabaque', icon: FileCheck2, title: 'Rights clearance',
    desc: 'Pedidos de clearance em três formatos — lançamento com faixas, faixa avulsa e audiovisual / sync.',
    tag: 'Protótipo',
  },
  {
    to: '/people/atabaque', icon: UserRound, title: 'Cadastro de pessoas',
    desc: 'PF e PJ no mesmo fluxo, com deduplicação por documento ou e-mail e dados bancários.',
    tag: 'Protótipo',
  },
  {
    to: '/company/atabaque', icon: Building2, title: 'Cadastro de empresa',
    desc: 'Dados fiscais, responsáveis legais / contrato / financeiro e dados bancários para formalização.',
    tag: 'Protótipo',
  },
  {
    to: '/portal', icon: LayoutDashboard, title: 'Área do cliente',
    desc: 'Visão da operação para o cliente: Gantt, integrações (Resend, Drive, Airtable) e acompanhamento por etapa.',
    tag: 'Novo',
  },
]

export default function FormsIndex() {
  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-foreground/10 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-2.5 px-4 py-3">
          <AtabaqueMark size={36} />
          <div className="font-display font-black text-lg">Atabaque</div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="sun-chip mb-3">Atabaque · Suíte de formulários Sunbeat</div>
        <h1 className="font-display text-4xl md:text-5xl font-black leading-tight">
          Formulários da <span className="text-accent">operação</span>
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground leading-relaxed">
          Quatro fluxos gerados pelo motor de formulários da Sunbeat, configurados por chat
          a partir do manual de marca da Atabaque. Todos com rascunho automático, modo de edição,
          revisão com aceite LGPD e triggers de e-mail por etapa.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {FORMS.map(({ to, icon: Icon, title, desc, tag }) => (
            <Link key={title} to={to}
              className="sun-card group rounded-3xl p-6 transition-all hover:scale-[1.015] hover:shadow-[8px_8px_0_0_rgba(81,35,20,0.16)]">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/12">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <span className={`sun-chip ${tag === 'Aprovado' ? 'bg-emerald-500/15 border-emerald-600/30' : ''}`}>{tag}</span>
              </div>
              <h2 className="mt-4 font-display text-xl font-black">{title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-accent">
                Abrir formulário <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-[11px] font-semibold text-muted-foreground">
          Estes formulários rodam na plataforma{' '}
          <a href="https://sunbeat.pro" target="_blank" rel="noreferrer" className="font-black text-foreground/70 underline underline-offset-2">
            Sunbeat
          </a>{' '}
          · formulários inteligentes para operações criativas
        </p>
      </main>
    </div>
  )
}
