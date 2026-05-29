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
    ctaStart: "Start free",
    ctaPricing: "View pricing",
    ctaSales: "Talk to sales",

    structuresTitle: "What Sunbeat structures",
    cards: [
      {
        title: "Intake & briefs",
        body: "Collect the right information up front with structured forms, files, metadata and required fields. Every submission starts clean.",
      },
      {
        title: "Workflow context",
        body: "Status, owners, blockers and next steps stay attached to the work — not scattered across inboxes or spreadsheets.",
      },
      {
        title: "Files & metadata",
        body: "Audio, artwork, campaign assets and structured fields are connected to the request they belong to.",
      },
      {
        title: "Operational visibility",
        body: "See what is draft, submitted, in review, blocked or ready for the next step at any moment.",
      },
    ],

    layerTitle: "The operating layer",
    layerCols: [
      {
        label: "Before intake",
        items: ["Request context", "Files & metadata", "Requirements"],
      },
      {
        label: "During review",
        items: ["Blockers & owners", "Validation", "AI suggestions"],
      },
      {
        label: "After approval",
        items: ["Integrations", "Handoff", "Operational visibility"],
      },
    ],

    builtTitle: "Built for creative operations",
    builtCards: [
      {
        title: "Labels & music teams",
        body: "Release intake, metadata routing, approval chains and delivery pipelines.",
      },
      {
        title: "Managers & production",
        body: "Centralize briefs, track project status and keep stakeholders aligned.",
      },
      {
        title: "Agencies & creative services",
        body: "Standardize how work comes in and how it moves through review.",
      },
      {
        title: "Operations teams",
        body: "Handle files, deadlines, approvals and metadata with full visibility.",
      },
    ],

    notFormTitle: "Not a form builder",
    notFormBody:
      "Forms collect answers. Sunbeat keeps the operational layer around those answers.",
    notFormCompare: [
      { label: "Form builder", value: "Collects answers" },
      { label: "Sunbeat", value: "Structures work" },
      { label: "Your team", value: "Reviews, approves and operates" },
    ],

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

    ctaHeadline: "Ready to turn intake into operations?",
    ctaSubcopy:
      "Start with a structured workspace, then connect the workflows your team already runs.",
  },

  brazil: {
    eyebrow: "Plataforma",
    title: "Uma camada operacional para trabalho criativo.",
    subtitle:
      "A Sunbeat transforma intake, arquivos, metadados e contexto operacional em workflows que seu time consegue acompanhar, validar e executar.",
    ctaStart: "Começar grátis",
    ctaPricing: "Ver planos",
    ctaSales: "Falar com vendas",

    structuresTitle: "O que a Sunbeat estrutura",
    cards: [
      {
        title: "Intake & briefings",
        body: "Colete as informações certas desde o início com formulários estruturados, arquivos, metadados e campos obrigatórios.",
      },
      {
        title: "Contexto de workflow",
        body: "Status, responsáveis, bloqueios e próximos passos ficam vinculados ao trabalho — não espalhados em e-mails.",
      },
      {
        title: "Arquivos & metadados",
        body: "Áudio, arte, assets de campanha e campos estruturados conectados à solicitação correspondente.",
      },
      {
        title: "Visibilidade operacional",
        body: "Veja o que está em rascunho, enviado, em revisão, bloqueado ou pronto para o próximo passo.",
      },
    ],

    layerTitle: "A camada operacional",
    layerCols: [
      {
        label: "Antes do intake",
        items: ["Contexto da solicitação", "Arquivos & metadados", "Requisitos"],
      },
      {
        label: "Durante a revisão",
        items: ["Bloqueios & responsáveis", "Validação", "Sugestões de IA"],
      },
      {
        label: "Após aprovação",
        items: ["Integrações", "Handoff", "Visibilidade operacional"],
      },
    ],

    builtTitle: "Feito para operações criativas",
    builtCards: [
      {
        title: "Gravadoras & times de música",
        body: "Intake de lançamentos, roteamento de metadados, cadeias de aprovação e pipelines de entrega.",
      },
      {
        title: "Managers & produção",
        body: "Centralize briefings, acompanhe o status de projetos e mantenha stakeholders alinhados.",
      },
      {
        title: "Agências & serviços criativos",
        body: "Padronize como o trabalho entra e como avança pelo processo de revisão.",
      },
      {
        title: "Times de operação",
        body: "Gerencie arquivos, prazos, aprovações e metadados com visibilidade completa.",
      },
    ],

    notFormTitle: "Não é um criador de formulários",
    notFormBody:
      "Formulários coletam respostas. A Sunbeat mantém a camada operacional em torno dessas respostas.",
    notFormCompare: [
      { label: "Criador de formulários", value: "Coleta respostas" },
      { label: "Sunbeat", value: "Estrutura o trabalho" },
      { label: "Seu time", value: "Revisa, aprova e opera" },
    ],

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

    ctaHeadline: "Pronto para transformar intake em operação?",
    ctaSubcopy:
      "Comece com um workspace estruturado e conecte os workflows que seu time já usa.",
  },
};

export default async function ProductPage() {
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
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex min-w-[120px] items-center justify-center rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-[#FCFBF8] hover:bg-[#1D1D1D] transition-colors"
          >
            {c.ctaStart}
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-w-[120px] items-center justify-center rounded-full border border-black/12 bg-white px-6 py-3 text-sm font-medium text-[#111111] hover:bg-black/5 transition-colors"
          >
            {c.ctaPricing}
          </Link>
        </div>
      </section>

      {/* What Sunbeat structures */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-[#111111] md:text-3xl">
          {c.structuresTitle}
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {c.cards.map((card) => (
            <div
              key={card.title}
              className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_10px_24px_rgba(20,16,10,0.06)]"
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

      {/* The operating layer */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-[#111111] md:text-3xl">
          {c.layerTitle}
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {c.layerCols.map((col) => (
            <div
              key={col.label}
              className="rounded-[28px] border border-black/8 bg-[#F8F4EC] p-6 shadow-[0_10px_24px_rgba(20,16,10,0.04)]"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-[#9B948D]">
                {col.label}
              </div>
              <ul className="mt-4 flex flex-col gap-2">
                {col.items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#C4BDB4]" />
                    <span className="text-sm text-[#5E5A54]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Built for creative operations */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-[#111111] md:text-3xl">
          {c.builtTitle}
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {c.builtCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_10px_24px_rgba(20,16,10,0.06)]"
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

      {/* Not a form builder */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="rounded-[28px] bg-[#111111] px-8 py-10 md:px-12 md:py-14 shadow-[0_10px_24px_rgba(20,16,10,0.12)]">
          <h2 className="text-xl font-semibold text-[#FCFBF8] md:text-2xl">
            {c.notFormTitle}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#E5E0D8] md:text-base">
            {c.notFormBody}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-5">
            {c.notFormCompare.map((row) => (
              <div
                key={row.label}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
              >
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#CFC8BC]">
                  {row.label}
                </div>
                <div className="mt-1.5 text-sm font-medium text-[#FCFBF8]">
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section
        id="integrations"
        className="mx-auto max-w-6xl px-4 py-16 md:py-20"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-[#111111] md:text-3xl">
          {c.integrationsTitle}
        </h2>
        <div className="mt-8 flex flex-wrap gap-3">
          {c.integrations.map((name) => (
            <span
              key={name}
              className="inline-flex items-center rounded-full border border-black/8 bg-white px-5 py-2.5 text-sm font-medium text-[#111111] shadow-[0_2px_6px_rgba(20,16,10,0.06)]"
            >
              {name}
            </span>
          ))}
        </div>
        <p className="mt-5 text-xs text-[#9B948D]">{c.integrationsNote}</p>
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
              href="/pricing"
              className="inline-flex min-w-[120px] items-center justify-center rounded-full border border-black/12 bg-white px-6 py-3 text-sm font-medium text-[#111111] hover:bg-black/5 transition-colors"
            >
              {c.ctaPricing}
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
