import { headers } from "next/headers";
import { resolveMarket, type Market } from "@/lib/billing/catalog";
import MarketingPageChrome from "@/components/marketing/MarketingPageChrome";
import Link from "next/link";

// ─── Copy ────────────────────────────────────────────────────────────────────

const COPY = {
  global: {
    eyebrow: "Security",
    title: "Security by design, governance by default.",
    subtitle:
      "Sunbeat keeps public intake separated from operational systems and treats sensitive actions as controlled workflow steps.",
    ctaSales: "Talk to sales",
    ctaPricing: "View pricing",

    trustStrip: [
      "Public intake boundary",
      "Server-side integration pattern",
      "Human confirmation",
      "Tenant-aware configuration",
    ],

    sections: [
      {
        title: "Public intake is not the backend",
        body: "Submitters interact with the intake surface only — not Airtable, Drive or any internal service. Form structure and routing stay server-side.",
        items: [
          "No Airtable credentials exposed to the browser",
          "No Drive tokens in client code",
          "Routing and schema validation run server-side",
        ],
      },
      {
        title: "Secrets stay server-side",
        body: "API keys, integration tokens and service credentials never reach client code. All integrations run through server-side services with least-privilege access.",
        items: [
          "Credentials scoped to least privilege",
          "Tokens never sent to the browser",
          "Integration calls proxied through server routes",
        ],
      },
      {
        title: "AI is governed",
        body: "AI can suggest, validate and draft operational context. It cannot approve requests, publish changes or execute irreversible actions without explicit human confirmation.",
        items: [
          "AI suggests — humans confirm",
          "No autonomous publishing",
          "No autonomous approval",
        ],
      },
      {
        title: "Configuration boundaries",
        body: "Workspaces, workflow settings, branding and field mappings are treated as tenant configuration boundaries. Each operation's context is scoped to their workspace.",
        items: [
          "Workspace-scoped settings",
          "Branding and mappings isolated per tenant",
          "No cross-workspace data leakage by design",
        ],
      },
    ],

    notClaimTitle: "No inflated security claims.",
    notClaimBody:
      "We do not claim certifications or guarantees that are not documented. If your organization needs a specific requirement, we review it explicitly during setup.",
    notClaimItems: [
      "No SOC 2 certification claim",
      "No HIPAA certification claim",
      "No autonomous AI approval",
      "No autonomous publishing",
    ],

    ctaHeadline: "Review security for your operation.",
    ctaSubcopy:
      "We can walk through how Sunbeat handles data, access and integrations for your specific setup.",
  },

  brazil: {
    eyebrow: "Segurança",
    title: "Segurança por design, governança por padrão.",
    subtitle:
      "A Sunbeat mantém o intake público separado dos sistemas operacionais e trata ações sensíveis como etapas de workflow controladas.",
    ctaSales: "Falar com vendas",
    ctaPricing: "Ver planos",

    trustStrip: [
      "Limite de intake público",
      "Padrão de integração server-side",
      "Confirmação humana",
      "Configuração por tenant",
    ],

    sections: [
      {
        title: "O intake público não é o backend",
        body: "Os solicitantes interagem apenas com a superfície de intake — não com o Airtable, Drive ou qualquer serviço interno. A estrutura dos formulários e o roteamento ficam no servidor.",
        items: [
          "Nenhuma credencial do Airtable exposta no navegador",
          "Nenhum token do Drive em código cliente",
          "Roteamento e validação de schema rodam no servidor",
        ],
      },
      {
        title: "Secrets ficam no servidor",
        body: "Chaves de API, tokens de integração e credenciais de serviço nunca chegam ao código cliente. Todas as integrações rodam por serviços server-side com acesso de menor privilégio.",
        items: [
          "Credenciais com menor privilégio",
          "Tokens nunca enviados ao navegador",
          "Chamadas de integração proxiadas por rotas de servidor",
        ],
      },
      {
        title: "A IA é governada",
        body: "A IA pode sugerir, validar e rascunhar contexto operacional. Ela não pode aprovar solicitações, publicar alterações ou executar ações irreversíveis sem confirmação humana explícita.",
        items: [
          "IA sugere — humanos confirmam",
          "Sem publicação autônoma",
          "Sem aprovação autônoma",
        ],
      },
      {
        title: "Limites de configuração",
        body: "Workspaces, configurações de workflow, branding e mapeamentos de campos são tratados como limites de configuração por tenant. O contexto de cada operação fica no escopo do seu workspace.",
        items: [
          "Configurações com escopo por workspace",
          "Branding e mapeamentos isolados por tenant",
          "Sem vazamento de dados entre workspaces por design",
        ],
      },
    ],

    notClaimTitle: "Sem afirmações de segurança infladas.",
    notClaimBody:
      "Não afirmamos certificações ou garantias que não estão documentadas. Se sua organização precisar de um requisito específico, revisamos explicitamente durante o setup.",
    notClaimItems: [
      "Sem certificação SOC 2",
      "Sem certificação HIPAA",
      "Sem aprovação autônoma de IA",
      "Sem publicação autônoma",
    ],

    ctaHeadline: "Revise a segurança para sua operação.",
    ctaSubcopy:
      "Podemos detalhar como a Sunbeat lida com dados, acessos e integrações para o seu setup específico.",
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

export default async function SecurityPage() {
  const host = (await headers()).get("host") ?? "";
  const market: Market = resolveMarket(host);
  const c = COPY[market];

  return (
    <MarketingPageChrome market={market}>
      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-12 md:pt-28">
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

      {/* ── Trust strip ── */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="flex flex-wrap gap-3">
          {c.trustStrip.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-medium text-[#111111] shadow-[0_2px_6px_rgba(20,16,10,0.05)]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── Security sections ── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid gap-5 sm:grid-cols-2">
          {c.sections.map((sec) => (
            <div
              key={sec.title}
              className="rounded-[28px] border border-black/8 bg-white p-7 shadow-[0_10px_24px_rgba(20,16,10,0.06)]"
            >
              <div className="text-sm font-semibold text-[#111111]">
                {sec.title}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#5E5A54]">
                {sec.body}
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {sec.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#9B948D]" />
                    <span className="text-sm leading-relaxed text-[#7A746A]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── No inflated claims ── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="rounded-[28px] bg-[#111111] px-8 py-10 shadow-[0_10px_32px_rgba(20,16,10,0.14)] md:px-12 md:py-14">
          <h2 className="text-xl font-semibold text-[#FCFBF8] md:text-2xl">
            {c.notClaimTitle}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#E5E0D8] md:text-base">
            {c.notClaimBody}
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {c.notClaimItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#CFC8BC]" />
                <span className="text-sm leading-relaxed text-[#E5E0D8]">
                  {item}
                </span>
              </li>
            ))}
          </ul>
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
            <DarkBtn href="/contact" label={c.ctaSales} />
            <LightBtn href="/pricing" label={c.ctaPricing} />
          </div>
        </div>
      </section>
    </MarketingPageChrome>
  );
}
