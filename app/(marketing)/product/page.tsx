import { headers } from "next/headers";
import { resolveMarket, type Market } from "@/lib/billing/catalog";
import MarketingPageChrome from "@/components/marketing/MarketingPageChrome";
import Link from "next/link";

// ─── Copy ────────────────────────────────────────────────────────────────────

const COPY = {
  global: {
    eyebrow: "Platform",
    title: "Structure every request from intake to operation.",
    subtitle:
      "Sunbeat gives creative teams a single operational layer for briefs, files, metadata, approvals and follow-up — so work does not disappear inside inboxes, chats or spreadsheets.",
    ctaStart: "Start free",
    ctaPricing: "View pricing",
    ctaSales: "Talk to sales",

    mockLabel: "Live request",
    mockRows: [
      { status: "✓", label: "New submission" },
      { status: "✓", label: "Metadata check" },
      { status: "✓", label: "Files attached" },
      { status: "✓", label: "Owner assigned" },
      { status: "→", label: "Ready for review" },
    ],
    mockNote: "Example workflow — not real data.",

    structuresTitle: "What Sunbeat structures",
    cards: [
      {
        title: "Requests",
        body: "Every project starts with the information your operation needs: requester, files, deadlines, metadata and notes.",
      },
      {
        title: "Validation",
        body: "Required fields, file expectations and review signals help your team catch issues before work moves forward.",
      },
      {
        title: "Workflow",
        body: "Owners, statuses, blockers and next actions stay attached to the request from submission to delivery.",
      },
      {
        title: "Handoff",
        body: "Approved work can move into the tools and routines your operation already uses.",
      },
    ],

    layerTitle: "The layer between a form and the real work.",
    layerBody:
      "A form captures input. Sunbeat keeps the structure around it: schema, files, validation, routing, visibility and review.",
    layerCols: [
      {
        title: "Collect",
        body: "Structured intake captures files, fields and context in one place.",
      },
      {
        title: "Normalize",
        body: "Required validations and schema enforcement keep submissions consistent.",
      },
      {
        title: "Review",
        body: "Owners, blockers and status stay visible throughout the review cycle.",
      },
      {
        title: "Connect",
        body: "Approved work routes into the systems and workflows already in use.",
      },
    ],

    builtTitle: "Built for creative operations",
    builtCards: [
      {
        title: "Music operations",
        body: "Release intake, metadata routing, approval chains and delivery pipelines for labels and their teams.",
      },
      {
        title: "Creative services",
        body: "Standardize how briefs come in, how files are collected and how reviews get completed.",
      },
      {
        title: "Production teams",
        body: "Track project requests, deadlines and handoffs across multiple campaigns or releases.",
      },
      {
        title: "Ops leads",
        body: "Build consistent intake flows without code and get visibility into every in-progress request.",
      },
    ],

    integrationsTitle: "Integrations",
    integrationsBody:
      "Connect structured intake to the systems where your team operates. Availability depends on plan and setup.",
    integrationsNote: "Available integrations vary by plan and setup.",
    integrations: [
      "Airtable",
      "Google Drive",
      "Google Sheets",
      "Webhooks",
      "API",
      "Automations",
    ],

    ctaHeadline: "Ready to stop operating from scattered intake?",
    ctaSubcopy:
      "Start with one workspace, one intake flow and a clearer path from request to execution.",
  },

  brazil: {
    eyebrow: "Plataforma",
    title: "Estruture cada solicitação do intake à operação.",
    subtitle:
      "A Sunbeat dá a equipes criativas uma camada operacional única para briefings, arquivos, metadados, aprovações e acompanhamento — para o trabalho não se perder em e-mails, chats ou planilhas.",
    ctaStart: "Começar grátis",
    ctaPricing: "Ver planos",
    ctaSales: "Falar com vendas",

    mockLabel: "Solicitação ativa",
    mockRows: [
      { status: "✓", label: "Nova submissão" },
      { status: "✓", label: "Verificação de metadados" },
      { status: "✓", label: "Arquivos anexados" },
      { status: "✓", label: "Responsável atribuído" },
      { status: "→", label: "Pronto para revisão" },
    ],
    mockNote: "Exemplo de workflow — não são dados reais.",

    structuresTitle: "O que a Sunbeat estrutura",
    cards: [
      {
        title: "Solicitações",
        body: "Cada projeto começa com as informações que sua operação precisa: solicitante, arquivos, prazos, metadados e notas.",
      },
      {
        title: "Validação",
        body: "Campos obrigatórios, expectativas de arquivo e sinais de revisão ajudam seu time a detectar problemas antes de avançar.",
      },
      {
        title: "Workflow",
        body: "Responsáveis, status, bloqueios e próximas ações ficam vinculados à solicitação da submissão à entrega.",
      },
      {
        title: "Handoff",
        body: "O trabalho aprovado pode seguir para as ferramentas e rotinas que sua operação já usa.",
      },
    ],

    layerTitle: "A camada entre um formulário e o trabalho real.",
    layerBody:
      "Um formulário captura respostas. A Sunbeat mantém a estrutura ao redor delas: schema, arquivos, validação, roteamento, visibilidade e revisão.",
    layerCols: [
      {
        title: "Receber",
        body: "O intake estruturado captura arquivos, campos e contexto em um só lugar.",
      },
      {
        title: "Normalizar",
        body: "Validações obrigatórias e schema garantem que as submissões cheguem consistentes.",
      },
      {
        title: "Revisar",
        body: "Responsáveis, bloqueios e status ficam visíveis durante todo o ciclo de revisão.",
      },
      {
        title: "Conectar",
        body: "O trabalho aprovado segue para os sistemas e workflows já em uso.",
      },
    ],

    builtTitle: "Feito para operações criativas",
    builtCards: [
      {
        title: "Operações musicais",
        body: "Intake de lançamentos, roteamento de metadados, cadeias de aprovação e pipelines de entrega.",
      },
      {
        title: "Serviços criativos",
        body: "Padronize como os briefings chegam, como os arquivos são coletados e como as revisões são concluídas.",
      },
      {
        title: "Times de produção",
        body: "Acompanhe solicitações, prazos e handoffs em múltiplas campanhas ou lançamentos.",
      },
      {
        title: "Líderes de operação",
        body: "Construa fluxos de intake consistentes sem código e tenha visibilidade de cada solicitação em andamento.",
      },
    ],

    integrationsTitle: "Integrações",
    integrationsBody:
      "Conecte o intake estruturado aos sistemas onde seu time opera. A disponibilidade depende do plano e da configuração.",
    integrationsNote: "As integrações disponíveis variam conforme plano e configuração.",
    integrations: [
      "Airtable",
      "Google Drive",
      "Google Sheets",
      "Webhooks",
      "API",
      "Automações",
    ],

    ctaHeadline: "Pronto para parar de operar com intake espalhado?",
    ctaSubcopy:
      "Comece com um workspace, um fluxo de intake e um caminho mais claro da solicitação à execução.",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function DarkBtn({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-w-[132px] items-center justify-center rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold leading-none !text-white transition-colors hover:bg-[#1D1D1D]"
      style={{ color: "#ffffff" }}
    >
      <span className="relative z-10 !text-white" style={{ color: "#ffffff" }}>
        {label}
      </span>
    </Link>
  );
}

function LightBtn({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-w-[132px] items-center justify-center rounded-full border border-black/12 bg-white px-6 py-3 text-sm font-medium leading-none text-[#111111] transition-colors hover:bg-black/5"
    >
      {label}
    </Link>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ProductPage() {
  const host = (await headers()).get("host") ?? "";
  const market: Market = resolveMarket(host);
  const c = COPY[market];

  return (
    <MarketingPageChrome market={market}>
      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 md:pt-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:items-start">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#9B948D]">
              {c.eyebrow}
            </div>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.12] tracking-tight text-[#111111] md:text-5xl">
              {c.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#5E5A54] md:text-lg">
              {c.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <DarkBtn href="/signup" label={c.ctaStart} />
              <LightBtn href="/pricing" label={c.ctaPricing} />
            </div>
          </div>

          {/* Mock workflow panel */}
          <div className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_10px_32px_rgba(20,16,10,0.08)]">
            <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#9B948D]">
              {c.mockLabel}
            </div>
            <ul className="flex flex-col gap-2.5">
              {c.mockRows.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center gap-3 rounded-xl bg-[#F8F4EC] px-4 py-3"
                >
                  <span className="text-xs font-bold text-[#111111]">
                    {row.status}
                  </span>
                  <span className="text-sm text-[#5E5A54]">{row.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[10px] text-[#C4BDB4]">{c.mockNote}</p>
          </div>
        </div>
      </section>

      {/* ── What Sunbeat structures ── */}
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

      {/* ── Operating layer ── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="rounded-[28px] bg-[#111111] px-8 py-10 shadow-[0_10px_32px_rgba(20,16,10,0.14)] md:px-12 md:py-14">
          <h2 className="text-xl font-semibold text-[#FCFBF8] md:text-2xl">
            {c.layerTitle}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#E5E0D8] md:text-base">
            {c.layerBody}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.layerCols.map((col) => (
              <div
                key={col.title}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5"
              >
                <div className="text-sm font-semibold text-[#FCFBF8]">
                  {col.title}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#E5E0D8]">
                  {col.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Built for ── */}
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

      {/* ── Integrations ── */}
      <section
        id="integrations"
        className="mx-auto max-w-6xl px-4 py-16 md:py-20"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-[#111111] md:text-3xl">
          {c.integrationsTitle}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5E5A54]">
          {c.integrationsBody}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {c.integrations.map((name) => (
            <span
              key={name}
              className="inline-flex items-center rounded-full border border-black/8 bg-white px-5 py-2.5 text-sm font-medium text-[#111111] shadow-[0_2px_6px_rgba(20,16,10,0.06)]"
            >
              {name}
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-[#9B948D]">{c.integrationsNote}</p>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="rounded-[28px] border border-black/8 bg-[#F8F4EC] px-8 py-10 md:px-12 md:py-14">
          <h2 className="text-2xl font-semibold tracking-tight text-[#111111] md:text-3xl">
            {c.ctaHeadline}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5E5A54] md:text-base">
            {c.ctaSubcopy}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <DarkBtn href="/signup" label={c.ctaStart} />
            <LightBtn href="/pricing" label={c.ctaPricing} />
            <LightBtn href="/contact" label={c.ctaSales} />
          </div>
        </div>
      </section>
    </MarketingPageChrome>
  );
}
