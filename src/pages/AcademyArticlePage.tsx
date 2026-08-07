import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router'
import { ACADEMY_COPY, FEATURED_ARTICLE_SLUG } from '@/academy/content'
import { resolveConceptLocale, type ConceptLocale } from '@/concept/copy'

export default function AcademyArticlePage() {
  const { slug } = useParams()
  const [locale] = useState<ConceptLocale>(() => resolveConceptLocale())
  const copy = ACADEMY_COPY[locale]
  const article = copy.article
  const origin = locale === 'pt-BR' ? 'https://sunbeat.com.br' : 'https://sunbeat.pro'
  const path = `/academy/${FEATURED_ARTICLE_SLUG}`
  const canonicalUrl = `${origin}${path}`
  const pageTitle = locale === 'pt-BR'
    ? 'Checklist de intake para lançamentos | Sunbeat Academy'
    : 'Music release intake checklist | Sunbeat Academy'

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = pageTitle
    document.querySelector('meta[name="description"]')?.setAttribute('content', article.description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', article.title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', article.description)
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonicalUrl)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl)
  }, [article.description, article.title, canonicalUrl, locale, pageTitle])

  if (slug !== FEATURED_ARTICLE_SLUG) return <Navigate to="/academy" replace />

  const shareLinks = [
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}` },
    { name: 'Reddit', href: `https://www.reddit.com/submit?url=${encodeURIComponent(canonicalUrl)}&title=${encodeURIComponent(article.title)}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}` },
    { name: 'X', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(article.title)}` },
  ]

  return (
    <main className="min-h-screen bg-[#000e14] text-[#f5eeda]">
      <header className="border-b border-white/10">
        <nav aria-label={locale === 'pt-BR' ? 'Navegação principal' : 'Main navigation'} className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/academy" className="font-display text-xl text-white">Sunbeat Academy</Link>
          <Link to="/academy" className="inline-flex items-center gap-2 text-xs font-bold text-white/55 transition hover:text-[#fbbb1e]"><ArrowLeft className="h-4 w-4" />Academy</Link>
        </nav>
      </header>

      <article>
        <header className="mx-auto max-w-4xl px-6 pb-16 pt-20 md:pb-24 md:pt-28">
          <p className="story-kicker">{article.category}</p>
          <h1 className="mt-5 font-display text-4xl leading-[1.08] text-white md:text-7xl">{article.title}</h1>
          <p className="mt-7 text-xl leading-relaxed text-white/65">{article.intro}</p>
          <div className="mt-7 flex flex-wrap gap-3 text-xs text-white/35"><span>{article.published}</span><span aria-hidden="true">·</span><span>{article.readingTime}</span></div>
        </header>

        <div className="mx-auto max-w-3xl px-6 pb-20">
          {article.sections.map((section) => (
            <section key={section.heading} className="border-t border-white/10 py-10 first:border-t-0">
              <h2 className="font-display text-3xl leading-tight text-white md:text-4xl">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-5 text-[17px] leading-8 text-white/65">{paragraph}</p>)}
              {section.items ? (
                <ul className="mt-6 space-y-3">
                  {section.items.map((item) => <li key={item} className="flex gap-3 text-[15px] leading-7 text-white/55"><span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#fbbb1e]" /><span>{item}</span></li>)}
                </ul>
              ) : null}
            </section>
          ))}

          <aside className="my-8 rounded-3xl border border-[#fbbb1e]/25 bg-[#fbbb1e]/[0.07] p-7 md:p-10">
            <h2 className="font-display text-3xl text-white">{article.closingTitle}</h2>
            <p className="mt-4 leading-relaxed text-white/60">{article.closingBody}</p>
            <Link to="/#chat" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#fbbb1e] px-6 py-3 text-sm font-bold text-[#000e14]">{article.closingCta}<ArrowRight className="h-4 w-4" /></Link>
          </aside>

          <aside className="border-t border-white/10 pt-10">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/40">{copy.share}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {shareLinks.map((link) => <a key={link.name} href={link.href} target="_blank" rel="noreferrer" className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-white/60 transition hover:border-[#fbbb1e]/50 hover:text-[#fbbb1e]">{link.name}</a>)}
            </div>
          </aside>
        </div>
      </article>
    </main>
  )
}
