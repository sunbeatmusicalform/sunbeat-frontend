import { headers } from "next/headers";
import { resolveMarket, type Market } from "@/lib/billing/catalog";
import MarketingPageChrome from "@/components/marketing/MarketingPageChrome";
import Link from "next/link";

const COPY = {
  global: {
    eyebrow: "How it works",
    title: "From incoming work to structured execution.",
    subtitle:
      "Sunbeat gives every request a clear path: capture, standardize, track and operate. No scattered briefs, no lost files.",
    ctaStart: "Start free",
    ctaPlatform: "See the platform",
    ctaSales: "Talk to sales",

    steps: [
      {
        number: "01",
        title: "Capture",
        body: "Receive requests, briefs, files and metadata through a structured intake your operation can trust.",
        output: "Structured request",
      },
      {
        number: "02",
        title: "Standardize",
        body: "Turn scattered inputs into consistent fields, validations and operational context ready for review.",
        output: "Clean fields",
      },
      {
        number: "03",
        title: "Track",
        body: "Follow status, blockers, owners and next actions from submission through every review stage.",
        output: "Visible status",
      },
      {
        number: "04",
        title: "Operate",
        body: "Connect approved work to the tools, automations and human decisions that move it forward.",
        output: "Connected handoff",
      },
    ],

    teamTitle: "What the team sees",
    teamCards: [
      {
        title: "Status",
        body: "Draft, submitted, in review, blocked or approved — always visible.",
      },
      {
        title: "Blockers",
        body: "Missing fields, failed validations or pending approvals surfaced clearly.",
      },
      {
        title: "Files",
        body: "Audio, artwork and documents attached to the request they belong to.",
      },
      {
        title: "Next action",
        body: "Who needs to act, what is needed and what comes after.",
      },
    ],

    aiTitle: "Where AI helps",
    aiRows: [
      {
        label: "Suggests missing context",
        body: "Flags fields or files that are absent before the request moves forward.",
      },
      {
        label: "Flags inconsistencies",
        body: "Identifies mismatches between submitted data and expected formats.",
      },
      {
        label: "Drafts summaries",
        body: "Produces operational context so reviewers start informed.",
      },
      {
        label: "Humans confirm",
        body: "Every irreversible action requires explicit human approval.",
      },
    ],
    governanceNote:
      "AI assists the workflow. People confirm every irreversible decision.",

    ctaHeadline: "A clearer path for every incoming request.",
    ctaSubcopy:
      "Stop chasing briefs across inboxes. Sunbeat gives each request a structured home.",
  },

  brazil: {
    eyebrow: "Como funciona",
    title: "Da entrada de demanda à execução estruturada.",
    subtitle:
      "A Sunbeat dá a cada solicitação um caminho claro: receber, padronizar, acompanhar e operar. Sem briefings perdidos, sem arquivos dispersos.",
    ctaStart: "Começar grátis",
    ctaPlatform: "Ver a plataforma",
    ctaSales: "Falar com vendas",

    steps: [
      {
        number: "01",
        title: "Receba",
        body: "Receba solicitações, briefings, arquivos e metadados por um intake estruturado em que sua operação pode confiar.",
        output: "Solicitação estruturada",
      },
      {
        number: "02",
        title: "Padronize",
        body: "Transforme entradas dispersas em campos consistentes, validações e contexto operacional prontos para revisão.",
        output: "Campos limpos",
      },
      {
        number: "03",
        title: "Acompanhe",
        body: "Siga status, bloqueios, responsáveis e próximas ações da submissão até cada etapa de revisão.",
        output: "Status visível",
      },
      {
        number: "04",
        title: "Opere",
        body: "Conecte o trabalho aprovado às ferramentas, automações e decisões humanas que o fazem avançar.",
        output: "Handoff conectado",
      },
    ],

    teamTitle: "O que o time vê",
    teamCards: [
      {
        title: "Status",
        body: "Rascunho, enviado, em revisão, bloqueado ou aprovado — sempre visível.",
      },
      {
        title: "Bloqueios",
        body: "Campos ausentes, validações com falha ou aprovações pendentes visíveis com clareza.",
      },
      {
        title: "Arquivos",
        body: "Áudio, arte e documentos vinculados à solicitação correspondente.",
      },
      {
        title: "Próxima ação",
        body: "Quem precisa agir, o que é necessário e o que vem depois.",
      },
    ],

    aiTitle: "Onde a IA ajuda",
    aiRows: [
      {
        label: "Sugere contexto ausente",
        body: "Sinaliza campos ou arquivos ausentes antes da solicitação avançar.",
      },
      {
        label: "Sinaliza inconsistências",
        body: "Identifica divergências entre os dados enviados e os formatos esperados.",
      },
      {
        label: "Rascunha resumos",
        body: "Produz contexto operacional para que revisores comecem bem informados.",
      },
      {
        label: "Humanos confirmam",
        body: "Toda ação irreversível exige aprovação humana explícita.",
      },
    ],
    governanceNote:
      "A IA auxilia o workflow. As pessoas confirmam cada decisão irreversível.",

    ctaHeadline: "Um caminho mais claro para cada solicitação.",
    ctaSubcopy:
      "Pare de rastrear briefings em e-mails. A Sunbeat dá a cada solicitação um lugar estruturado.",
  },
};

export default async function HowItWorksPage() {
  const host = (await headers()).get("host") ?? "";
  const market: Market = resolveMarket(host);
  const c = COPY[market];

  return (
    <MarketingPageChrome market={market}>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 md:pt-28">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#9B948D]">
          {c.eyebrow}
        </div>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-[#111111] md:text-5xl leading-[1.12]">
          {c.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#5E5A54] md:text-lg">
          {c.subtitle}
        </p>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {c.steps.map((step) => (
            <div
              key={step.number}
              className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_10px_24px_rgba(20,16,10,0.06)]"
            >
              <div className="text-3xl font-bold tracking-tight text-[#EDE8E0]">
                {step.number}
              </div>
              <div className="mt-4 text-sm font-semibold text-[#111111]">
                {step.title}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#5E5A54]">
                {step.body}
              </p>
              <div className="mt-5 inline-flex items-center rounded-full bg-[#F4F1EA] px-3 py-1 text-[11px] font-medium text-[#9B948D]">
                → {step.output}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What the team sees */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-[#111111] md:text-3xl">
          {c.teamTitle}
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {c.teamCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[28px] border border-black/8 bg-[#F8F4EC] p-6 shadow-[0_10px_24px_rgba(20,16,10,0.04)]"
            >
              <div className="text-sm font-semibold text-[#111111]">
                {card.title}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#5E5A54]">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Where AI helps */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="rounded-[28px] bg-[#111111] px-8 py-10 md:px-12 md:py-14 shadow-[0_10px_24px_rgba(20,16,10,0.12)]">
          <h2 className="text-xl font-semibold text-[#FCFBF8] md:text-2xl">
            {c.aiTitle}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {c.aiRows.map((row) => (
              <div
                key={row.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
              >
                <div className="text-xs font-semibold uppercase tracking-widest text-[#CFC8BC]">
                  {row.label}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[#E5E0D8]">
                  {row.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-[#CFC8BC]">{c.governanceNote}</p>
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="rounded-[28px] border border-black/8 bg-[#F8F4EC] px-8 py-10 md:px-12 md:py-14">
          <h2 className="text-2xl font-semibold tracking-tight text-[#111111] md:text-3xl">
            {c.ctaHeadline}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5E5A54] md:text-base">
            {c.ctaSubcopy}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex min-w-[120px] items-center justify-center rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-[#FCFBF8] hover:bg-[#1D1D1D] transition-colors"
            >
              {c.ctaStart}
            </Link>
            <Link
              href="/product"
              className="inline-flex min-w-[120px] items-center justify-center rounded-full border border-black/12 bg-white px-6 py-3 text-sm font-medium text-[#111111] hover:bg-black/5 transition-colors"
            >
              {c.ctaPlatform}
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-w-[120px] items-center justify-center rounded-full border border-black/12 bg-white px-6 py-3 text-sm font-medium text-[#111111] hover:bg-black/5 transition-colors"
            >
              {c.ctaSales}
            </Link>
          </div>
        </div>
      </section>
    </MarketingPageChrome>
  );
}
