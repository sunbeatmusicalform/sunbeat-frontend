import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, BookOpen, Check, CircleCheck, FileCheck2, X } from 'lucide-react'
import { resolveConceptLocale, type ConceptLocale } from '@/concept/copy'
import { IntelligentForms, Showcase } from '@/sections/Info'

const CinematicJourney = lazy(() => import('./ConceptPage').then((module) => ({ default: module.CinematicJourney })))

const LANDING_COPY = {
  en: {
    metaTitle: 'Sunbeat | AI operations for music teams',
    metaDescription: 'Collect release data, validate audio, artwork and credits, and connect your music operation to Airtable, Google Drive and email.',
    proposition: {
      kicker: 'AI operations for music teams',
      title: 'Music operations, ready to move.',
      body: 'Collect release data, validate audio, artwork and credits, then keep every handoff organized. Sunbeat connects the work to Airtable, Google Drive and the tools your team already uses.',
      audience: 'Built for labels, managers, publishers and creative agencies.',
      primaryCta: 'Start free',
      secondaryCta: 'See the product',
      proof: ['Human approval before configuration', 'Signed previews', 'Audit-ready history'],
      flow: [
        { number: '01', title: 'Collect', body: 'Intelligent forms shaped around your operation.' },
        { number: '02', title: 'Validate', body: 'Audio, artwork, metadata and credits checked early.' },
        { number: '03', title: 'Operate', body: 'Structured data connected to the tools you already use.' },
        { number: '04', title: 'Control', body: 'Your team reviews every configuration before it changes.' },
      ],
    },
    plansKicker: 'Plans',
    plansTitle: 'Start with the core. Add power as your operation grows.',
    plansBody: "Every plan includes Sunbeat's file audit for audio, artwork and metadata. Paid plans expand volume, retention, integrations and operational control.",
    coreIncluded: 'Core included',
    startFree: 'Start Free',
    choosePlan: (name: string) => `Choose ${name}`,
    enterpriseTitle: 'Enterprise from $199/mo',
    enterpriseBody: 'Unlimited scale, dedicated onboarding, SLA and custom operational architecture.',
    enterpriseCta: 'Talk to Sunbeat',
    clientArea: 'Client area',
    terms: 'Terms of Use',
    privacyPolicy: 'Privacy Policy',
    footer: 'Intelligent infrastructure for creative markets',
    academyKicker: 'Sunbeat Academy',
    academyTitle: 'Learn the systems behind reliable creative work.',
    academyBody: 'Practical guides on music data, release operations, rights, files and intelligent intake, built from real operational problems.',
    academyCta: 'Explore the Academy',
    dialog: {
      close: 'Close form', early: 'Early access', enterprise: 'Enterprise',
      waitlistTitle: (plan: string) => `Join the ${plan} waitlist`, enterpriseTitle: 'Talk to Sunbeat Enterprise',
      waitlistBody: 'Leave your details and we will contact you when onboarding opens.', enterpriseBody: 'Tell us about your operation, scale and integration needs.',
      name: 'Name', email: 'Email', company: 'Company or operation', optional: '(optional)', message: 'Message',
      enterprisePlaceholder: 'Team size, monthly volume, integrations…', waitlistPlaceholder: 'Anything you would like us to know?',
      sendEnterprise: 'Send Enterprise request', join: 'Join the waitlist', sending: 'Sending…',
      privacy: 'Your details are sent directly to Sunbeat and used only to reply to this request.',
      error: 'We could not send your message. Please try again.', success: 'Message received.',
      successBody: 'Thank you. Felipe will receive your details and get back to you.', done: 'Done',
    },
    plans: [
      { name: 'Free', price: '$0', description: 'A real workflow for testing Sunbeat with no time-limited trial.', features: ['50 submissions per month', '1 live intake form', 'Audio, artwork and metadata file audit', 'Assets stored for 60 days', 'Structured database with a fair-use limit during early access', 'Drafts and submission summaries'], note: 'File auditing stays free because it is part of the Sunbeat core.', featured: true },
      { name: 'Starter', price: '$19/mo', description: 'For teams running a steady intake operation with connected data.', features: ['500 submissions per month', '2 live intake forms', 'Everything in Free, including file audit', 'Extended asset retention', 'Airtable two-way sync and visual field mapping', 'Larger upload limits and priority email support'], note: 'Best for small labels, managers and creative teams.', featured: false },
      { name: 'Pro', price: '$49/mo', description: 'For complete operations that need automation, AI and their own brand.', features: ['2,000 submissions per month', '5 live intake forms', 'Everything in Starter, including file audit', 'Google Drive and Google Sheets integrations', 'AI-assisted setup and operational guidance', 'Custom branding, white-label and higher upload limits'], note: 'Best for growing operations with multiple workflows.', featured: false },
    ],
  },
  'pt-BR': {
    metaTitle: 'Sunbeat | Operações com IA para equipes de música',
    metaDescription: 'Colete dados de lançamentos, valide áudio, capas e créditos e conecte sua operação musical ao Airtable, Google Drive e e-mail.',
    proposition: {
      kicker: 'Operações com IA para equipes de música',
      title: 'Operações musicais prontas para avançar.',
      body: 'Colete dados de lançamentos, valide áudio, capas e créditos e organize cada passagem da operação. A Sunbeat conecta o trabalho ao Airtable, Google Drive e às ferramentas que sua equipe já utiliza.',
      audience: 'Feita para labels, managers, editoras e agências criativas.',
      primaryCta: 'Começar grátis',
      secondaryCta: 'Conhecer o produto',
      proof: ['Aprovação humana antes da configuração', 'Prévias assinadas', 'Histórico auditável'],
      flow: [
        { number: '01', title: 'Coletar', body: 'Formulários inteligentes construídos ao redor da sua operação.' },
        { number: '02', title: 'Validar', body: 'Áudio, capas, metadados e créditos conferidos cedo.' },
        { number: '03', title: 'Operar', body: 'Dados estruturados conectados às ferramentas que você já usa.' },
        { number: '04', title: 'Controlar', body: 'Sua equipe revisa cada configuração antes de qualquer mudança.' },
      ],
    },
    plansKicker: 'Planos',
    plansTitle: 'Comece com o essencial. Ganhe potência conforme sua operação cresce.',
    plansBody: 'Todos os planos incluem a auditoria Sunbeat para áudio, capas e metadados. Os planos pagos ampliam volume, retenção, integrações e controle operacional.',
    coreIncluded: 'Essencial incluído',
    startFree: 'Começar grátis',
    choosePlan: (name: string) => `Escolher ${name}`,
    enterpriseTitle: 'Enterprise a partir de R$ 990/mês',
    enterpriseBody: 'Escala ilimitada, onboarding dedicado, SLA e arquitetura operacional personalizada.',
    enterpriseCta: 'Falar com a Sunbeat',
    clientArea: 'Área do cliente',
    terms: 'Termos de Uso',
    privacyPolicy: 'Política de Privacidade',
    footer: 'Infraestrutura inteligente para mercados criativos',
    academyKicker: 'Sunbeat Academy',
    academyTitle: 'Aprenda os sistemas por trás de um trabalho criativo confiável.',
    academyBody: 'Guias práticos sobre dados musicais, operações de lançamento, direitos, arquivos e intake inteligente, criados a partir de problemas reais.',
    academyCta: 'Conhecer a Academy',
    dialog: {
      close: 'Fechar formulário', early: 'Acesso antecipado', enterprise: 'Enterprise',
      waitlistTitle: (plan: string) => `Entrar na lista do plano ${plan}`, enterpriseTitle: 'Fale com a Sunbeat Enterprise',
      waitlistBody: 'Deixe seus dados e entraremos em contato quando o onboarding estiver disponível.', enterpriseBody: 'Conte sobre sua operação, escala e necessidades de integração.',
      name: 'Nome', email: 'E-mail', company: 'Empresa ou operação', optional: '(opcional)', message: 'Mensagem',
      enterprisePlaceholder: 'Tamanho da equipe, volume mensal, integrações…', waitlistPlaceholder: 'Algo que você gostaria que soubéssemos?',
      sendEnterprise: 'Enviar solicitação Enterprise', join: 'Entrar na lista', sending: 'Enviando…',
      privacy: 'Seus dados são enviados diretamente à Sunbeat e utilizados apenas para responder a esta solicitação.',
      error: 'Não foi possível enviar sua mensagem. Tente novamente.', success: 'Mensagem recebida.',
      successBody: 'Obrigado. Felipe receberá seus dados e entrará em contato.', done: 'Concluir',
    },
    plans: [
      { name: 'Free', price: 'R$ 0', description: 'Um fluxo real para experimentar a Sunbeat, sem prazo de teste.', features: ['50 submissões por mês', '1 formulário de intake ativo', 'Auditoria de áudio, capa e metadados', 'Assets armazenados por 60 dias', 'Base estruturada com limite de uso razoável no acesso antecipado', 'Rascunhos e resumos de submissão'], note: 'A auditoria de arquivos permanece gratuita porque faz parte do núcleo da Sunbeat.', featured: true },
      { name: 'Starter', price: 'R$ 97/mês', description: 'Para equipes com uma operação contínua de intake e dados conectados.', features: ['500 submissões por mês', '2 formulários de intake ativos', 'Tudo do Free, incluindo auditoria', 'Retenção estendida de assets', 'Sincronização Airtable em duas vias e mapeamento visual', 'Uploads maiores e suporte prioritário por e-mail'], note: 'Ideal para pequenas labels, managers e equipes criativas.', featured: false },
      { name: 'Pro', price: 'R$ 247/mês', description: 'Para operações completas que precisam de automação, IA e marca própria.', features: ['2.000 submissões por mês', '5 formulários de intake ativos', 'Tudo do Starter, incluindo auditoria', 'Integrações com Google Drive e Google Sheets', 'Configuração assistida por IA e orientação operacional', 'Marca personalizada, white-label e uploads maiores'], note: 'Ideal para operações em crescimento com múltiplos fluxos.', featured: false },
    ],
  },
} as const

type LeadForm = { type: 'waitlist'; plan: string } | { type: 'enterprise' }

function LeadDialog({ lead, locale, onClose }: { lead: LeadForm; locale: ConceptLocale; onClose: () => void }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const copy = LANDING_COPY[locale].dialog

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_type: lead.type,
          plan: lead.type === 'waitlist' ? lead.plan : undefined,
          name: form.get('name'),
          email: form.get('email'),
          company: form.get('company'),
          message: form.get('message'),
          website: form.get('website'),
        }),
      })
      if (!response.ok) throw new Error('Request failed')
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  const title = lead.type === 'enterprise' ? copy.enterpriseTitle : copy.waitlistTitle(lead.plan)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000e14]/85 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-form-title"
        className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#061a24] p-6 shadow-2xl md:p-8"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label={copy.close} className="absolute right-5 top-5 text-white/45 transition hover:text-white">
          <X className="h-5 w-5" />
        </button>

        {status === 'sent' ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400"><Check /></div>
            <h3 id="lead-form-title" className="mt-5 font-display text-2xl text-white">{copy.success}</h3>
            <p className="mt-2 text-sm text-white/60">{copy.successBody}</p>
            <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-[#fbbb1e] px-6 py-3 text-sm font-bold text-[#000e14]">{copy.done}</button>
          </div>
        ) : (
          <>
            <p className="story-kicker">{lead.type === 'enterprise' ? copy.enterprise : copy.early}</p>
            <h3 id="lead-form-title" className="mt-3 pr-8 font-display text-2xl text-white md:text-3xl">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              {lead.type === 'enterprise' ? copy.enterpriseBody : copy.waitlistBody}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-white/70">{copy.name}
                  <input name="name" required minLength={2} autoComplete="name" className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#000e14]/60 px-4 py-3 text-sm text-white outline-none transition focus:border-[#fbbb1e]/70" />
                </label>
                <label className="text-xs font-semibold text-white/70">{copy.email}
                  <input name="email" type="email" required autoComplete="email" className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#000e14]/60 px-4 py-3 text-sm text-white outline-none transition focus:border-[#fbbb1e]/70" />
                </label>
              </div>
              <label className="block text-xs font-semibold text-white/70">{copy.company} <span className="font-normal text-white/35">{copy.optional}</span>
                <input name="company" autoComplete="organization" className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#000e14]/60 px-4 py-3 text-sm text-white outline-none transition focus:border-[#fbbb1e]/70" />
              </label>
              <label className="block text-xs font-semibold text-white/70">{copy.message} <span className="font-normal text-white/35">{copy.optional}</span>
                <textarea name="message" rows={3} placeholder={lead.type === 'enterprise' ? copy.enterprisePlaceholder : copy.waitlistPlaceholder} className="mt-1.5 w-full resize-none rounded-xl border border-white/15 bg-[#000e14]/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#fbbb1e]/70" />
              </label>
              <label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
              {status === 'error' && <p role="alert" className="text-sm text-red-300">{copy.error}</p>}
              <button type="submit" disabled={status === 'sending'} className="w-full rounded-xl bg-[#fbbb1e] px-5 py-3.5 text-sm font-bold text-[#000e14] transition hover:bg-[#fbbb1e]/90 disabled:cursor-wait disabled:opacity-60">
                {status === 'sending' ? copy.sending : lead.type === 'enterprise' ? copy.sendEnterprise : copy.join}
              </button>
              <p className="text-center text-[11px] text-white/35">{copy.privacy}</p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [locale] = useState<ConceptLocale>(() => resolveConceptLocale())
  const [leadForm, setLeadForm] = useState<LeadForm | null>(null)
  const copy = LANDING_COPY[locale]

  useEffect(() => {
    const original = {
      lang: document.documentElement.lang,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? '',
      ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? '',
    }

    document.documentElement.lang = locale
    document.title = copy.metaTitle
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      copy.metaDescription,
    )
    document.querySelector('meta[property="og:title"]')?.setAttribute(
      'content',
      copy.metaTitle,
    )
    document.querySelector('meta[property="og:description"]')?.setAttribute(
      'content',
      copy.metaDescription,
    )

    return () => {
      document.documentElement.lang = original.lang
      document.title = original.title
      document.querySelector('meta[name="description"]')?.setAttribute('content', original.description)
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', original.ogTitle)
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', original.ogDescription)
    }
  }, [copy.metaDescription, copy.metaTitle, locale])

  // links antigos de edição apontavam para a raiz com ?edit_token=... — redireciona para o intake
  useEffect(() => {
    const qs = window.location.search
    if (qs.includes('edit_token=') || qs.includes('draft_token=')) {
      navigate(`/intake/atabaque${qs}`, { replace: true })
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#000e14] text-[#f5eeda]">
      <Suspense fallback={<div className="relative min-h-screen overflow-hidden" aria-label={locale === 'pt-BR' ? 'Carregando experiência Sunbeat' : 'Loading Sunbeat experience'}><div className="concept-static-scene" /></div>}>
        <CinematicJourney />
      </Suspense>

      {/* ===== proposta — clareza comercial sem interromper a jornada ===== */}
      <section id="product" className="relative overflow-hidden border-y border-white/10 bg-[#000e14] px-6 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(251,187,30,0.10),transparent_32%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
            <div>
              <p className="story-kicker">{copy.proposition.kicker}</p>
              <h2 className="mt-5 max-w-4xl font-display text-4xl leading-[1.04] tracking-[-0.035em] text-white md:text-6xl">
                {copy.proposition.title}
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/62 md:text-lg">
                {copy.proposition.body}
              </p>
              <p className="mt-5 text-sm font-semibold text-white/45">{copy.proposition.audience}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fbbb1e] px-6 py-3.5 text-sm font-bold text-[#000e14] transition hover:bg-[#ffd45e]">
                  {copy.proposition.primaryCta}<ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/product" className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3.5 text-sm font-bold text-white transition hover:border-white/35 hover:bg-white/5">
                  {copy.proposition.secondaryCta}
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#061a24]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] md:p-8">
              <div className="grid gap-6 sm:grid-cols-2">
                {copy.proposition.flow.map((item) => (
                  <div key={item.number} className="border-t border-white/10 pt-4">
                    <p className="text-[10px] font-bold tracking-[0.22em] text-[#fbbb1e]">{item.number}</p>
                    <h3 className="mt-2 font-display text-xl text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/50">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-3 border-t border-white/10 pt-6 md:grid-cols-3">
            {copy.proposition.proof.map((item) => (
              <p key={item} className="flex items-center gap-2 text-xs font-semibold text-white/55">
                <CircleCheck className="h-4 w-4 shrink-0 text-[#fbbb1e]" />{item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ===== área informativa — leitura direta ===== */}
      <div id="forms"><IntelligentForms locale={locale} /></div>

      {/* ===== vitrine ===== */}
      <Showcase locale={locale} />

      {/* ===== Academy — conteúdo e inbound ===== */}
      <section className="border-y border-white/10 bg-white/[0.025] px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div className="flex h-56 items-center justify-center rounded-3xl border border-[#fbbb1e]/25 bg-[radial-gradient(circle_at_center,rgba(251,187,30,0.18),transparent_52%)] text-[#fbbb1e]">
            <BookOpen className="h-16 w-16" />
          </div>
          <div>
            <p className="story-kicker">{copy.academyKicker}</p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-white md:text-5xl">{copy.academyTitle}</h2>
            <p className="mt-5 max-w-2xl leading-relaxed text-white/55">{copy.academyBody}</p>
            <Link to="/academy" className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#fbbb1e]/45 px-6 py-3 text-sm font-bold text-[#fbbb1e] transition hover:bg-[#fbbb1e]/10">{copy.academyCta}<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* ===== planos — chat temporariamente oculto ===== */}
      <section id="chat" className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="story-kicker">{copy.plansKicker}</p>
          <h2 className="mt-4 font-display text-3xl leading-tight md:text-5xl">
            {copy.plansTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-white/60">
            {copy.plansBody}
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {copy.plans.map((plan) => (
            <article
              key={plan.name}
              className={`flex h-full flex-col rounded-3xl border p-6 ${
                plan.featured
                  ? 'border-[#fbbb1e]/60 bg-[#fbbb1e]/10 shadow-[0_0_50px_rgba(251,187,30,0.08)]'
                  : 'border-white/10 bg-[#061a24]/80'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl text-white">{plan.name}</h3>
                  <p className="mt-1 text-2xl font-bold text-[#fbbb1e]">{plan.price}</p>
                </div>
                {plan.featured && (
                  <span className="rounded-full border border-[#fbbb1e]/40 bg-[#fbbb1e]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#fbbb1e]">
                    {copy.coreIncluded}
                  </span>
                )}
              </div>

              <p className="mt-5 min-h-16 text-sm leading-relaxed text-white/60">
                {plan.description}
              </p>

              <ul className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-sm leading-relaxed text-white/75">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#fbbb1e]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <p className="flex min-h-12 items-start gap-2 text-xs leading-relaxed text-white/45">
                  <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{plan.note}</span>
                </p>
                {plan.name === 'Free' ? (
                  <a
                    href="/signup"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#fbbb1e] px-4 py-3 text-sm font-bold text-[#000e14] transition hover:bg-[#fbbb1e]/90"
                  >
                    {copy.startFree}
                  </a>
                ) : (
                  <a
                    href={`/signup?plan=${plan.name.toLowerCase()}`}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#fbbb1e] px-4 py-3 text-sm font-bold text-[#000e14] transition hover:bg-[#fbbb1e]/90"
                  >
                    {copy.choosePlan(plan.name)}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg text-white">{copy.enterpriseTitle}</p>
            <p className="mt-1 text-sm text-white/50">{copy.enterpriseBody}</p>
          </div>
          <button
            type="button"
            onClick={() => setLeadForm({ type: 'enterprise' })}
            className="shrink-0 rounded-xl border border-[#fbbb1e]/50 px-5 py-2.5 text-sm font-bold text-[#fbbb1e] transition hover:bg-[#fbbb1e]/10"
          >
            {copy.enterpriseCta}
          </button>
        </div>
      </section>

      {leadForm && <LeadDialog lead={leadForm} locale={locale} onClose={() => setLeadForm(null)} />}

      {/* ===== footer ===== */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 py-16 text-center">
          <img src="/brand/logo-stacked.svg" alt="Sunbeat" className="h-28 w-auto" />
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/academy" className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-bold text-white/60 transition hover:border-[#fbbb1e]/50 hover:text-[#fbbb1e]">Sunbeat Academy</Link>
            <a href="/portal" className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-bold text-white/60 transition hover:border-[#fbbb1e]/50 hover:text-[#fbbb1e]">{copy.clientArea}</a>
            <Link to="/terms" className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-bold text-white/60 transition hover:border-[#fbbb1e]/50 hover:text-[#fbbb1e]">{copy.terms}</Link>
            <Link to="/privacy" className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-bold text-white/60 transition hover:border-[#fbbb1e]/50 hover:text-[#fbbb1e]">{copy.privacyPolicy}</Link>
          </div>
          <p className="text-[11px] text-white/25">© 2026 Sunbeat · {copy.footer}</p>
        </div>
      </footer>
    </div>
  )
}
