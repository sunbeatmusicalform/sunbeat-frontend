import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, Mail } from 'lucide-react'
import { Link } from 'react-router'
import { ACADEMY_COPY, FEATURED_ARTICLE_SLUG } from '@/academy/content'
import { resolveConceptLocale, type ConceptLocale } from '@/concept/copy'

function applyPageMeta(locale: ConceptLocale, title: string, description: string, path: string) {
  const origin = locale === 'pt-BR' ? 'https://sunbeat.com.br' : 'https://sunbeat.pro'
  document.documentElement.lang = locale
  document.title = title
  document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', `${origin}${path}`)
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', `${origin}${path}`)
}

export default function AcademyPage() {
  const [locale] = useState<ConceptLocale>(() => resolveConceptLocale())
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const copy = ACADEMY_COPY[locale]

  useEffect(() => {
    applyPageMeta(locale, copy.metaTitle, copy.metaDescription, '/academy')
  }, [copy.metaDescription, copy.metaTitle, locale])

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    const form = new FormData(event.currentTarget)
    const params = new URLSearchParams(window.location.search)
    const attribution = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
      .map((key) => [key, params.get(key)] as const)
      .filter((entry) => entry[1])
      .map(([key, value]) => `${key}=${value}`)
      .join(' · ')
    const subscriptionMessage = locale === 'pt-BR'
      ? 'Inscrição na Sunbeat Academy · pt-BR'
      : 'Sunbeat Academy subscription · en'
    try {
      const response = await fetch('/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_type: 'academy',
          name: form.get('name'),
          email: form.get('email'),
          message: attribution ? `${subscriptionMessage} · ${attribution}` : subscriptionMessage,
          website: form.get('website'),
        }),
      })
      if (!response.ok) throw new Error('Request failed')
      setStatus('sent')
      event.currentTarget.reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-[#000e14] text-[#f5eeda]">
      <header className="border-b border-white/10">
        <nav aria-label={locale === 'pt-BR' ? 'Navegação principal' : 'Main navigation'} className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" aria-label={copy.home}>
            <img src="/brand/logo-horizontal.svg" alt="Sunbeat" className="h-9 w-auto" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-white/55 transition hover:text-[#fbbb1e]"><ArrowLeft className="h-4 w-4" />{copy.home}</Link>
        </nav>
      </header>

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-24 md:py-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_20%,rgba(251,187,30,0.14),transparent_34%),radial-gradient(circle_at_10%_80%,rgba(50,159,215,0.13),transparent_35%)]" />
        <div className="relative mx-auto max-w-6xl">
          <p className="story-kicker">{copy.kicker}</p>
          <h1 className="mt-5 max-w-4xl font-display text-4xl leading-[1.05] text-white md:text-7xl">{copy.title}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/65 md:text-xl">{copy.intro}</p>
          <p className="mt-5 max-w-2xl border-l-2 border-[#fbbb1e]/60 pl-5 text-sm leading-relaxed text-white/45">{copy.promise}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="story-kicker">{copy.featured}</p>
        <article className="mt-5 grid overflow-hidden rounded-3xl border border-[#fbbb1e]/30 bg-[#061a24] lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative min-h-64 overflow-hidden bg-[#020d13] p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_40%,rgba(251,187,30,0.28),transparent_18%),radial-gradient(circle_at_65%_60%,rgba(50,159,215,0.22),transparent_26%)]" />
            <div className="relative flex h-full items-end"><BookOpen className="h-14 w-14 text-[#fbbb1e]" /></div>
          </div>
          <div className="p-8 md:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#fbbb1e]">{copy.article.category}</p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-white md:text-5xl">{copy.article.title}</h2>
            <p className="mt-5 max-w-2xl leading-relaxed text-white/60">{copy.article.description}</p>
            <div className="mt-7 flex flex-wrap items-center gap-4 text-xs text-white/35"><span>{copy.article.published}</span><span aria-hidden="true">·</span><span>{copy.article.readingTime}</span></div>
            <Link to={`/academy/${FEATURED_ARTICLE_SLUG}`} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#fbbb1e] px-6 py-3 text-sm font-bold text-[#000e14] transition hover:bg-[#ffd05b]">{copy.readArticle}<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </article>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="story-kicker">{copy.comingSoon}</p>
          <h2 className="mt-4 font-display text-3xl text-white md:text-5xl">{copy.pillarsTitle}</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {copy.pillars.map((pillar, index) => (
              <article key={pillar.title} className="rounded-3xl border border-white/10 bg-[#061a24]/75 p-7">
                <span className="text-xs font-bold text-[#fbbb1e]">0{index + 1}</span>
                <h3 className="mt-8 font-display text-2xl text-white">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/50">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <div className="rounded-3xl border border-[#fbbb1e]/25 bg-[#fbbb1e]/[0.07] p-7 md:p-12">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fbbb1e]/15 text-[#fbbb1e]"><Mail className="h-5 w-5" /></div>
          <p className="story-kicker mt-7">{copy.newsletter.kicker}</p>
          <h2 className="mt-3 font-display text-3xl text-white md:text-5xl">{copy.newsletter.title}</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-white/55">{copy.newsletter.body}</p>

          {status === 'sent' ? (
            <p role="status" className="mt-7 flex items-center gap-2 text-sm font-semibold text-emerald-300"><Check className="h-4 w-4" />{copy.newsletter.success}</p>
          ) : (
            <form onSubmit={subscribe} className="mt-7 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="sr-only" htmlFor="academy-name">{copy.newsletter.name}</label>
              <input id="academy-name" name="name" required minLength={2} autoComplete="name" placeholder={copy.newsletter.name} className="rounded-xl border border-white/15 bg-[#000e14]/70 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#fbbb1e]/70" />
              <label className="sr-only" htmlFor="academy-email">{copy.newsletter.email}</label>
              <input id="academy-email" name="email" type="email" required autoComplete="email" placeholder={copy.newsletter.email} className="rounded-xl border border-white/15 bg-[#000e14]/70 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#fbbb1e]/70" />
              <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <button type="submit" disabled={status === 'sending'} className="rounded-xl bg-[#fbbb1e] px-5 py-3 text-sm font-bold text-[#000e14] disabled:opacity-60">{status === 'sending' ? copy.newsletter.sending : copy.newsletter.button}</button>
            </form>
          )}
          {status === 'error' ? <p role="alert" className="mt-3 text-sm text-red-300">{copy.newsletter.error}</p> : null}
          <p className="mt-3 text-[11px] text-white/30">{copy.newsletter.privacy}</p>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10 text-center text-[11px] text-white/30">© 2026 Sunbeat Academy</footer>
    </main>
  )
}
