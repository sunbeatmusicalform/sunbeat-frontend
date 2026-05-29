import { headers } from "next/headers";
import { resolveMarket, type Market } from "@/lib/billing/catalog";
import MarketingPageChrome from "@/components/marketing/MarketingPageChrome";
import Link from "next/link";

const COPY = {
  global: {
    eyebrow: "Platform",
    title: "An operating layer for creative work.",
    subtitle:
      "Sunbeat turns intake, files, metadata and operational context into workflows your team can track, validate and execute.",
    structuresTitle: "What Sunbeat structures",
    cards: [
      {
        title: "Intake & briefs",
        body: "Collect the right information up front with structured forms, files, metadata and required fields.",
      },
      {
        title: "Workflow context",
        body: "Keep status, owners, blockers and next steps attached to the work instead of scattered across inboxes.",
      },
      {
        title: "Files & metadata",
        body: "Connect audio, artwork, campaign assets and structured fields to the request they belong to.",
      },
      {
        title: "Operational visibility",
        body: "See what is draft, submitted, in review, blocked or ready for the next step.",
      },
    ],
    builtTitle: "Built for creative operations",
    builtItems: [
      "Labels and music teams",
      "Managers and production teams",
      "Agencies and creative service teams",
      "Operations handling files, deadlines, approvals and metadata",
    ],
    notFormTitle: "Not a form builder",
    notFormBody:
      "Forms collect answers. Sunbeat keeps the operational layer around those answers: schema, validation, files, status, integrations and human review.",
    integrationsTitle: "Integrations",
    integrationsNote: "Available integrations vary by plan and setup.",
    integrations: [
      "Airtable",
      "Google Drive",
      "Google Sheets",
      "Webhooks",
      "API",
      "Automations",
    ],
    ctaStart: "Start free",
    ctaPricing: "View pricing",
    ctaSales: "Talk to sales",
  },
  brazil: {
    eyebrow: "Plataforma",
    title: "Uma camada operacional para trabalho criativo.",
    subtitle:
      "A Sunbeat transforma intake, arquivos, metadados e contexto operacional em workflows que seu time consegue acompanhar, validar e executar.",
    structuresTitle: "O que a Sunbeat estrutura",
    cards: [
      {
        title: "Intake & briefings",
        body: "Colete as informações certas desde o início com formulários estruturados, arquivos, metadados e campos obrigatórios.",
      },
      {
        title: "Contexto de workflow",
        body: "Mantenha status, responsáveis, bloqueios e próximos passos vinculados ao trabalho, não espalhados em e-mails.",
      },
      {
        title: "Arquivos & metadados",
        body: "Conecte áudio, arte, assets de campanha e campos estruturados à solicitação à qual pertencem.",
      },
      {
        title: "Visibilidade operacional",
        body: "Veja o que está em rascunho, enviado, em revisão, bloqueado ou pronto para o próximo passo.",
      },
    ],
    builtTitle: "Feito para operações criativas",
    builtItems: [
      "Gravadoras e times de música",
      "Managers e equipes de produção",
      "Agências e times de serviços criativos",
      "Operações com arquivos, prazos, aprovações e metadados",
    ],
    notFormTitle: "Não é um criador de formulários",
    notFormBody:
      "Formulários coletam respostas. A Sunbeat mantém a camada operacional em torno dessas respostas: schema, validação, arquivos, status, integrações e revisão humana.",
    integrationsTitle: "Integrações",
    integrationsNote: "As integrações disponíveis variam conforme plano e configuração.",
    integrations: [
      "Airtable",
      "Google Drive",
      "Google Sheets",
      "Webhooks",
      "API",
      "Automações",
    ],
    ctaStart: "Começar grátis",
    ctaPricing: "Ver planos",
    ctaSales: "Falar com vendas",
  },
};

export default async function ProductPage() {
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
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1D1D1D] transition-colors"
          >
            {c.ctaStart}
          </Link>
          <Link
            href="/pricing"
            className="inline-flex rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-[#111111] hover:bg-black/5 transition-colors"
          >
            {c.ctaPricing}
          </Link>
        </div>
      </section>

      {/* What Sunbeat structures */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-[#111111] md:text-3xl">
          {c.structuresTitle}
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {c.cards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm"
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

      {/* Built for */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-[#111111] md:text-3xl">
          {c.builtTitle}
        </h2>
        <ul className="mt-6 flex flex-col gap-3">
          {c.builtItems.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#9B948D]" />
              <span className="text-sm text-[#5E5A54]">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Not a form builder */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="rounded-2xl bg-[#111111] px-8 py-10 md:px-12">
          <h2 className="text-xl font-semibold text-white md:text-2xl">
            {c.notFormTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#A09A94]">
            {c.notFormBody}
          </p>
        </div>
      </section>

      {/* Integrations */}
      <section
        id="integrations"
        className="mx-auto max-w-6xl px-4 py-14 md:py-20"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-[#111111] md:text-3xl">
          {c.integrationsTitle}
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {c.integrations.map((name) => (
            <span
              key={name}
              className="inline-flex items-center rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-medium text-[#111111]"
            >
              {name}
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-[#9B948D]">{c.integrationsNote}</p>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="rounded-2xl border border-black/8 bg-[#F8F4EC] px-8 py-10 md:px-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#111111]">
                {c.ctaStart}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1D1D1D] transition-colors"
              >
                {c.ctaStart}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-[#111111] hover:bg-black/5 transition-colors"
              >
                {c.ctaPricing}
              </Link>
              <Link
                href="/contact"
                className="inline-flex rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-[#111111] hover:bg-black/5 transition-colors"
              >
                {c.ctaSales}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingPageChrome>
  );
}
