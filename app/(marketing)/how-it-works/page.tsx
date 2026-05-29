import { headers } from "next/headers";
import { resolveMarket, type Market } from "@/lib/billing/catalog";
import MarketingPageChrome from "@/components/marketing/MarketingPageChrome";
import Link from "next/link";

const COPY = {
  global: {
    eyebrow: "How it works",
    title: "From incoming work to structured execution.",
    subtitle:
      "Sunbeat gives every request a clear path: capture, standardize, track and operate.",
    steps: [
      {
        number: "01",
        title: "Capture",
        body: "Receive requests, briefs, files and metadata through a structured intake your operation can trust.",
      },
      {
        number: "02",
        title: "Standardize",
        body: "Turn scattered inputs into consistent fields, validations and operational context.",
      },
      {
        number: "03",
        title: "Track",
        body: "Follow status, blockers, owners and next actions from submission to review.",
      },
      {
        number: "04",
        title: "Operate",
        body: "Connect approved work to the tools, automations and human decisions that move it forward.",
      },
    ],
    aiTitle: "Where AI helps",
    aiItems: [
      "Suggests missing context",
      "Flags inconsistencies",
      "Drafts operational summaries",
      "Never replaces human approval",
    ],
    governanceNote:
      "AI assists the workflow. People confirm every irreversible decision.",
    ctaStart: "Start free",
    ctaPlatform: "See the platform",
    ctaSales: "Talk to sales",
  },
  brazil: {
    eyebrow: "Como funciona",
    title: "Da entrada de demanda à execução estruturada.",
    subtitle:
      "A Sunbeat dá a cada solicitação um caminho claro: receber, padronizar, acompanhar e operar.",
    steps: [
      {
        number: "01",
        title: "Receba",
        body: "Receba solicitações, briefings, arquivos e metadados por um intake estruturado em que sua operação pode confiar.",
      },
      {
        number: "02",
        title: "Padronize",
        body: "Transforme entradas dispersas em campos consistentes, validações e contexto operacional.",
      },
      {
        number: "03",
        title: "Acompanhe",
        body: "Siga status, bloqueios, responsáveis e próximas ações da submissão até a revisão.",
      },
      {
        number: "04",
        title: "Opere",
        body: "Conecte o trabalho aprovado às ferramentas, automações e decisões humanas que o fazem avançar.",
      },
    ],
    aiTitle: "Onde a IA ajuda",
    aiItems: [
      "Sugere contexto ausente",
      "Sinaliza inconsistências",
      "Rascunha resumos operacionais",
      "Nunca substitui a aprovação humana",
    ],
    governanceNote:
      "A IA auxilia o workflow. As pessoas confirmam cada decisão irreversível.",
    ctaStart: "Começar grátis",
    ctaPlatform: "Ver a plataforma",
    ctaSales: "Falar com vendas",
  },
};

export default async function HowItWorksPage() {
  const host = (await headers()).get("host") ?? "";
  const market: Market = resolveMarket(host);
  const c = COPY[market];

  return (
    <MarketingPageChrome market={market}>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 md:pt-24">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#9B948D]">
          {c.eyebrow}
        </div>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-[#111111] md:text-5xl">
          {c.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#5E5A54]">
          {c.subtitle}
        </p>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {c.steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm"
            >
              <div className="text-2xl font-bold tracking-tight text-[#E8E2D9]">
                {step.number}
              </div>
              <div className="mt-4 text-sm font-semibold text-[#111111]">
                {step.title}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#5E5A54]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Where AI helps */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="rounded-2xl bg-[#111111] px-8 py-10 md:px-12">
          <h2 className="text-xl font-semibold text-white md:text-2xl">
            {c.aiTitle}
          </h2>
          <ul className="mt-6 flex flex-col gap-3">
            {c.aiItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#A09A94]" />
                <span className="text-sm text-[#A09A94]">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-[#7A746A]">{c.governanceNote}</p>
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="rounded-2xl border border-black/8 bg-[#F8F4EC] px-8 py-10 md:px-12">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1D1D1D] transition-colors"
            >
              {c.ctaStart}
            </Link>
            <Link
              href="/product"
              className="inline-flex rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-[#111111] hover:bg-black/5 transition-colors"
            >
              {c.ctaPlatform}
            </Link>
            <Link
              href="/contact"
              className="inline-flex rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-[#111111] hover:bg-black/5 transition-colors"
            >
              {c.ctaSales}
            </Link>
          </div>
        </div>
      </section>
    </MarketingPageChrome>
  );
}
