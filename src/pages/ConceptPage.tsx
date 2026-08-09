import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CONCEPT_COPY, resolveConceptLocale, type ConceptLocale } from '@/concept/copy'

const SunbeatCanvas = lazy(() => import('@/concept/SunbeatCanvas'))

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
  } catch {
    return false
  }
}

function StaticJourneyFallback() {
  return (
    <div className="concept-static-scene" aria-hidden="true">
      <div className="concept-static-ray" />
      <div className="concept-static-sun" />
      <div className="concept-static-wave concept-static-wave-1" />
      <div className="concept-static-wave concept-static-wave-2" />
    </div>
  )
}

function localeHref(locale: ConceptLocale, conceptRoute: boolean) {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const path = conceptRoute ? '/concept' : '/'
  if (isLocal) return `${path}?lang=${locale === 'pt-BR' ? 'pt' : 'en'}`
  const domain = locale === 'pt-BR' ? 'https://sunbeat.com.br' : 'https://sunbeat.pro'
  return `${domain}${path}`
}

const DRIFT_WORDS = ['CREATE', 'RIGHTS', 'WAV', 'DEADLINES', 'PEOPLE', 'ARTWORK', 'METADATA']

function ReducedMotionJourney({ locale, standalone }: { locale: ConceptLocale; standalone: boolean }) {
  const copy = CONCEPT_COPY[locale]
  return (
    <div className="min-h-screen bg-[#00070c] text-[#f8f0dc]">
      <header className="flex items-center justify-between px-5 py-5 md:px-10 md:py-7">
        <a href="/" aria-label="Sunbeat home"><img src="/brand/logo-horizontal.svg" alt="Sunbeat" className="h-9 w-auto" /></a>
        <div className="flex rounded-full border border-white/15 p-1 text-[10px] font-bold">
          <a href={localeHref('en', standalone)} aria-current={locale === 'en' ? 'page' : undefined} className={`rounded-full px-3 py-1.5 ${locale === 'en' ? 'bg-white text-[#00070c]' : 'text-white/50'}`}>EN</a>
          <a href={localeHref('pt-BR', standalone)} aria-current={locale === 'pt-BR' ? 'page' : undefined} className={`rounded-full px-3 py-1.5 ${locale === 'pt-BR' ? 'bg-white text-[#00070c]' : 'text-white/50'}`}>PT</a>
        </div>
      </header>
      <section className="relative flex min-h-[78vh] items-end overflow-hidden px-6 pb-16 md:px-12 md:pb-24 lg:px-20">
        <StaticJourneyFallback />
        <div className="concept-vignette absolute inset-0" />
        <div className="relative z-10 max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#fbbb1e]">{copy.chapters[0].kicker}</p>
          <h1 className="mt-5 font-display text-4xl leading-tight text-white md:text-7xl">{copy.chapters[0].title}</h1>
          <p className="mt-5 max-w-xl leading-7 text-white/65">{copy.chapters[0].body}</p>
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        {copy.chapters.slice(1).map((chapter) => (
          <section key={chapter.number} className="border-t border-white/10 py-14 md:grid md:grid-cols-[120px_1fr] md:gap-8 md:py-20">
            <p className="text-xs font-bold text-[#fbbb1e]">{chapter.number}</p>
            <div>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#fbbb1e]/75 md:mt-0">{chapter.kicker}</p>
              <h2 className="mt-4 max-w-3xl font-display text-3xl leading-tight text-white md:text-5xl">{chapter.title}</h2>
              <p className="mt-5 max-w-2xl leading-7 text-white/55">{chapter.body}</p>
            </div>
          </section>
        ))}
      </div>
      <section className="border-t border-white/10 px-6 py-20 text-center">
        <a href="/signup" className="inline-flex items-center gap-2 rounded-full bg-[#fbbb1e] px-6 py-3.5 text-sm font-bold text-[#00070c]">{copy.primaryCta}<ArrowRight className="h-4 w-4" /></a>
      </section>
    </div>
  )
}

export function CinematicJourney({ standalone = false }: { standalone?: boolean }) {
  const [locale] = useState<ConceptLocale>(() => resolveConceptLocale())
  const [activeChapter, setActiveChapter] = useState(0)
  const storyRef = useRef<HTMLElement>(null)
  const progressRef = useRef(0)
  const prefersReducedMotion = useReducedMotion()
  const [webGLAvailable] = useState(supportsWebGL)
  const [lightweightExperience] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const copy = CONCEPT_COPY[locale]
  const renderCanvas = webGLAvailable && !prefersReducedMotion && !lightweightExperience

  useEffect(() => {
    if (!standalone) return
    const previousTitle = document.title
    const previousLang = document.documentElement.lang
    document.documentElement.lang = locale
    document.title = locale === 'pt-BR'
      ? 'Sunbeat — Do caos à clareza'
      : 'Sunbeat — From chaos to clarity'
    return () => {
      document.title = previousTitle
      document.documentElement.lang = previousLang
    }
  }, [locale, standalone])

  useEffect(() => {
    if (prefersReducedMotion || !storyRef.current) return
    gsap.registerPlugin(ScrollTrigger)
    const trigger = ScrollTrigger.create({
      trigger: storyRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.35,
      onUpdate: (self) => {
        progressRef.current = self.progress
        const nextChapter = Math.min(copy.chapters.length - 1, Math.floor(self.progress * copy.chapters.length))
        setActiveChapter((current) => current === nextChapter ? current : nextChapter)
      },
    })
    return () => trigger.kill()
  }, [copy.chapters.length, prefersReducedMotion])

  const chapter = copy.chapters[activeChapter]

  if (prefersReducedMotion) return <ReducedMotionJourney locale={locale} standalone={standalone} />

  const journey = (
    <section ref={storyRef} className="relative h-[600vh]" aria-label={copy.eyebrow}>
        <div className="sticky top-0 h-screen overflow-hidden">
          <div className="absolute inset-0">
            {renderCanvas ? (
              <Suspense fallback={<StaticJourneyFallback />}>
                <SunbeatCanvas progress={progressRef} />
              </Suspense>
            ) : <StaticJourneyFallback />}
          </div>

          <div className="concept-vignette absolute inset-0 pointer-events-none" />

          <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-5 md:px-10 md:py-7">
            <a href="/" aria-label="Sunbeat home">
              <img src="/brand/logo-horizontal.svg" alt="Sunbeat" className="h-8 w-auto md:h-10" />
            </a>
            <div className="flex items-center gap-3 md:gap-5">
              <span className="hidden text-[9px] font-bold uppercase tracking-[0.32em] text-white/40 lg:block">{copy.brandLine}</span>
              <div className="flex rounded-full border border-white/15 bg-black/20 p-1 text-[10px] font-bold backdrop-blur-md">
                <a href={localeHref('en', standalone)} aria-current={locale === 'en' ? 'page' : undefined} className={`rounded-full px-2.5 py-1.5 ${locale === 'en' ? 'bg-white text-[#00070c]' : 'text-white/50'}`}>EN</a>
                <a href={localeHref('pt-BR', standalone)} aria-current={locale === 'pt-BR' ? 'page' : undefined} className={`rounded-full px-2.5 py-1.5 ${locale === 'pt-BR' ? 'bg-white text-[#00070c]' : 'text-white/50'}`}>PT</a>
              </div>
              <a href={standalone ? '#concept-end' : '#product'} className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 transition hover:text-[#fbbb1e]">{copy.skip}</a>
            </div>
          </header>

          <div className={`concept-data-drift absolute inset-0 transition-opacity duration-1000 ${activeChapter < 2 ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true">
            {DRIFT_WORDS.map((word, index) => (
              <span
                key={word}
                style={{
                  '--drift-index': index,
                  '--drift-x': `${8 + index * 13}%`,
                  '--drift-y': `${18 + (index % 4) * 17}%`,
                } as CSSProperties}
              >{word}</span>
            ))}
          </div>

          <div className="absolute inset-0 z-20 flex items-center px-6 pb-20 pt-28 md:px-12 lg:px-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${locale}-${activeChapter}`}
                initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
                transition={{ duration: 0.65, ease: [0.2, 0.8, 0.2, 1] }}
                className={`max-w-2xl ${activeChapter >= 4 ? 'mx-auto text-center' : ''}`}
              >
                <div className={`flex items-center gap-3 ${activeChapter >= 4 ? 'justify-center' : ''}`}>
                  <span className="text-xs font-bold text-[#fbbb1e]">{chapter.number}</span>
                  <span className="h-px w-10 bg-[#fbbb1e]/45" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#fbbb1e]/80">{chapter.kicker}</p>
                </div>
                <h1 className="mt-5 font-display text-4xl leading-[1.04] tracking-[-0.035em] text-white drop-shadow-[0_3px_30px_rgba(0,0,0,0.55)] md:text-6xl lg:text-7xl">
                  {chapter.title}
                </h1>
                <p className={`mt-6 max-w-xl text-base leading-7 text-white/62 md:text-lg md:leading-8 ${activeChapter >= 4 ? 'mx-auto' : ''}`}>
                  {chapter.body}
                </p>
                {activeChapter === 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-7 flex flex-wrap gap-2">
                    {copy.streams.map((stream) => <span key={stream} className="rounded-full border border-[#fbbb1e]/35 bg-[#fbbb1e]/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#fbbb1e]">{stream}</span>)}
                  </motion.div>
                )}
                {activeChapter === 5 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <a href="/signup" className="pointer-events-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#fbbb1e] px-6 py-3.5 text-sm font-bold text-[#00070c] transition hover:bg-[#ffd45e]">{copy.primaryCta}<ArrowRight className="h-4 w-4" /></a>
                    <a href={standalone ? '/#product' : '#product'} className="pointer-events-auto inline-flex items-center justify-center rounded-full border border-white/25 bg-black/15 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/10">{copy.secondaryCta}</a>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute bottom-6 left-6 right-6 z-30 flex items-end justify-between md:bottom-8 md:left-10 md:right-10">
            <div className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.24em] text-white/35 transition-opacity ${activeChapter === 5 ? 'opacity-0' : 'opacity-100'}`}>
              <ArrowDown className="h-3.5 w-3.5 animate-bounce text-[#fbbb1e]" />{copy.scroll}
            </div>
            <div className="w-28 md:w-44">
              <div className="mb-2 flex justify-between text-[9px] font-bold text-white/35"><span>{chapter.number}</span><span>06</span></div>
              <div className="h-px bg-white/15"><motion.div className="h-px origin-left bg-[#fbbb1e]" animate={{ scaleX: (activeChapter + 1) / copy.chapters.length }} transition={{ duration: 0.4 }} /></div>
              <span className="sr-only">{copy.progress}: {activeChapter + 1} / {copy.chapters.length}</span>
            </div>
          </div>
        </div>
    </section>
  )

  if (!standalone) return <div className="concept-page bg-[#00070c] text-[#f8f0dc]">{journey}</div>

  return (
    <main className="concept-page bg-[#00070c] text-[#f8f0dc]">
      {journey}

      <section id="concept-end" className="relative border-t border-white/10 bg-[#000e14] px-6 py-24 text-center md:py-32">
        <p className="story-kicker">{copy.endKicker}</p>
        <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl leading-tight text-white md:text-6xl">{copy.endTitle}</h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/55">{copy.endBody}</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fbbb1e] px-6 py-3.5 text-sm font-bold text-[#00070c]">{copy.primaryCta}<ArrowRight className="h-4 w-4" /></a>
          <a href="/" className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3.5 text-sm font-bold text-white">Sunbeat home</a>
        </div>
      </section>
    </main>
  )
}

export default function ConceptPage() {
  return <CinematicJourney standalone />
}
