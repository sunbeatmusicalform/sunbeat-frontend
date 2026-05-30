import { headers } from "next/headers";
import { resolveMarket, type Market } from "@/lib/billing/catalog";
import MarketingPageChrome from "@/components/marketing/MarketingPageChrome";
import Link from "next/link";

// ─── Copy ────────────────────────────────────────────────────────────────────

const COPY = {
  global: {
    eyebrow: "How it works",
    title: "How Sunbeat turns intake into execution.",
    subtitle:
      "A request enters once, then moves through structure, validation, review and operational handoff.",
    ctaStart: "Start free",
    ctaPlatform: "See the platform",
    ctaSales: "Talk to sales",

    steps: [
      {
        number: "01",
        title: "Capture",
        body: "Receive requests, briefs, files and metadata through a structured intake your operation can trust.",
        output: "A structured request",
        teamNote: "No more chasing missing files by email.",
      },
      {
        number: "02",
        title: "Validate",
        body: "Required fields, file checks and schema validations catch issues before work moves forward.",
        output: "Required context and files checked",
        teamNote: "Issues surface before review, not after.",
      },
      {
        number: "03",
        title: "Review",
        body: "Owners, blockers and notes stay visible throughout the review stage. Nothing falls silent.",
        output: "Owners, blockers and notes visible",
        teamNote: "Everyone knows what is waiting and why.",
      },
      {
        number: "04",
        title: "Operate",
        body: "Approved work connects to the tools, automations and handoffs your operation already uses.",
        output: "Approved work connected to the next step",
        teamNote: "Delivery starts from a clean, confirmed state.",
      },
    ],

    cracksTitle: "What stops falling through the cracks",
    cracksItems: [
      "Missing files",
      "Incomplete metadata",
      "Unclear ownership",
      "Silent blockers",
      "Lost follow-ups",
      "Manual status chasing",
    ],

    aiTitle: "AI assists the workflow. People stay in control.",
    aiRows: [
      {
        label: "Suggests missing context",
        body: "Flags fields or files that are absent before the request moves forward.",
      },
      {
        label: "Flags inconsistent inputs",
        body: "Identifies mismatches between submitted data and expected formats.",
      },
      {
        label: "Drafts operational summaries",
        body: "Produces review-ready context so teams start informed, not from scratch.",
      },
      {
        label: "Recommends next steps",
        body: "Surfaces workflow-aware suggestions based on current request state.",
      },
    ],
    governanceNote:
      "AI does not publish, approve or execute irreversible actions on its own.",

    ctaHeadline: "Give every request a path your team can follow.",
    ctaSubcopy:
      "One intake flow, clear ownership and a visible path from submission to delivery.",
  },

  brazil: {
    eyebrow: "Como funciona",
    title: "Como a Sunbeat transforma intake em execução.",
    subtitle:
      "A solicitação entra uma vez e passa por estrutura, validação, revisão e handoff operacional.",
    ctaStart: "Começar grátis",
    ctaPlatform: "Ver a plataforma",
    ctaSales: "Falar com vendas",

    steps: [
      {
        number: "01",
        title: "Receba",
        body: "Receba solicitações, briefings, arquivos e metadados por um intake estruturado em que sua operação pode confiar.",
        output: "Uma solicitação estruturada",
        teamNote: "Sem mais busca de arquivos por e-mail.",
      },
      {
        number: "02",
        title: "Valide",
        body: "Campos obrigatórios, verificações de arquivo e validações de schema detectam problemas antes de avançar.",
        output: "Contexto e arquivos obrigatórios verificados",
        teamNote: "Os problemas aparecem antes da revisão, não depois.",
      },
      {
        number: "03",
        title: "Revise",
        body: "Responsáveis, bloqueios e notas ficam visíveis durante todo o estágio de revisão. Nada fica em silêncio.",
        output: "Responsáveis, bloqueios e notas visíveis",
        teamNote: "Todos sabem o que está esperando e por quê.",
      },
      {
        number: "04",
        title: "Opere",
        body: "O trabalho aprovado conecta às ferramentas, automações e handoffs que sua operação já usa.",
        output: "Trabalho aprovado conectado ao próximo passo",
        teamNote: "A entrega começa a partir de um estado limpo e confirmado.",
      },
    ],

    cracksTitle: "O que para de se perder",
    cracksItems: [
      "Arquivos ausentes",
      "Metadados incompletos",
      "Responsabilidade pouco clara",
      "Bloqueios silenciosos",
      "Follow-ups perdidos",
      "Status manual em busca constante",
    ],

    aiTitle: "A IA auxilia o workflow. As pessoas ficam no controle.",
    aiRows: [
      {
        label: "Sugere contexto ausente",
        body: "Sinaliza campos ou arquivos ausentes antes da solicitação avançar.",
      },
      {
        label: "Sinaliza entradas inconsistentes",
        body: "Identifica divergências entre os dados enviados e os formatos esperados.",
      },
      {
        label: "Rascunha resumos operacionais",
        body: "Produz contexto pronto para revisão para que os times comecem bem informados.",
      },
      {
        label: "Recomenda próximos passos",
        body: "Apresenta sugestões baseadas no contexto atual da solicitação.",
      },
    ],
    governanceNote:
      "A IA não publica, aprova nem executa ações irreversíveis por conta própria.",

    ctaHeadline: "Dê a cada solicitação um caminho que seu time consiga seguir.",
    ctaSubcopy:
      "Um fluxo de intake, responsabilidade clara e um caminho visível da submissão à entrega.",
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

export default async function HowItWorksPage() {
  const host = (await headers()).get("host") ?? "";
  const market: Market = resolveMarket(host);
  const c = COPY[market];

  return (
    <MarketingPageChrome market={market}>
      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 md:pt-28">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#9B948D]">
          {c.eyebrow}
        </div>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.12] tracking-tight text-[#111111] md:text-5xl">
          {c.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#5E5A54] md:text-lg">
          {c.subtitle}
        </p>
      </section>

      {/* ── Steps ── */}
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
              <div className="mt-5 rounded-xl bg-[#F4F1EA] px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#9B948D]">
                  Output
                </div>
                <div className="mt-0.5 text-xs font-medium text-[#5E5A54]">
                  {step.output}
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#9B948D]">
                {step.teamNote}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What stops falling through the cracks ── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-[#111111] md:text-3xl">
          {c.cracksTitle}
        </h2>
        <div className="mt-8 flex flex-wrap gap-3">
          {c.cracksItems.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-black/8 bg-white px-5 py-3 text-sm font-medium text-[#5E5A54] shadow-[0_2px_6px_rgba(20,16,10,0.05)]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* ── AI panel ── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="rounded-[28px] bg-[#111111] px-8 py-10 shadow-[0_10px_32px_rgba(20,16,10,0.14)] md:px-12 md:py-14">
          <h2 className="text-xl font-semibold text-[#FCFBF8] md:text-2xl">
            {c.aiTitle}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {c.aiRows.map((row) => (
              <div
                key={row.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5"
              >
                <div className="text-xs font-semibold uppercase tracking-widest text-[#CFC8BC]">
                  {row.label}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#E5E0D8]">
                  {row.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-[#CFC8BC]">{c.governanceNote}</p>
        </div>
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
            <LightBtn href="/product" label={c.ctaPlatform} />
            <LightBtn href="/contact" label={c.ctaSales} />
          </div>
        </div>
      </section>
    </MarketingPageChrome>
  );
}
