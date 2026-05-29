import { headers } from "next/headers";
import { resolveMarket, type Market } from "@/lib/billing/catalog";
import MarketingPageChrome from "@/components/marketing/MarketingPageChrome";
import Link from "next/link";

const COPY = {
  global: {
    eyebrow: "Security",
    title: "Security by design, governance by default.",
    subtitle:
      "Sunbeat separates public intake from operational systems and keeps sensitive actions behind controlled workflows.",
    ctaSales: "Talk to sales",
    ctaPricing: "View pricing",

    trustStrip: [
      "Public intake separated from operations",
      "Server-side integrations",
      "Human approval for irreversible actions",
    ],

    sections: [
      {
        title: "Protected public intake",
        items: [
          "Public forms do not expose Airtable, Drive or internal automation details.",
          "Submitters interact with the intake surface only, not the operational backend.",
          "Form structure and routing stay server-side.",
        ],
      },
      {
        title: "Server-side integrations",
        items: [
          "Integrations run through server-side services with least-privilege credentials.",
          "Secrets are never exposed to the browser.",
          "API keys and tokens stay out of client code.",
        ],
      },
      {
        title: "Human approval for irreversible actions",
        items: [
          "AI can suggest, validate and draft context.",
          "People confirm every irreversible action before it executes.",
          "Automated publishing without review is not allowed by design.",
        ],
      },
      {
        title: "Tenant-aware configuration boundaries",
        items: [
          "Workspaces, workflow settings, branding and mappings are treated as configuration boundaries.",
          "Each tenant's operational context is scoped to their workspace.",
        ],
      },
    ],

    guardrailsTitle: "Operational guardrails",
    guardrails: [
      "Secrets stay server-side",
      "AI does not publish changes autonomously",
      "Setup and proposals require review",
      "Sensitive workflows remain protected",
    ],

    notClaimTitle: "What we do not claim",
    notClaimIntro:
      "We avoid inflated security claims. If a requirement matters for your organization, we document it clearly during setup.",
    notClaimItems: [
      "SOC 2 certified",
      "HIPAA or GDPR certification",
      "Unlimited or autonomous AI",
      "Autonomous publishing without human review",
    ],

    ctaHeadline: "Want to review security for your operation?",
    ctaSubcopy:
      "We can walk through how Sunbeat handles data, access and integrations for your specific setup.",
  },

  brazil: {
    eyebrow: "Segurança",
    title: "Segurança por design, governança por padrão.",
    subtitle:
      "A Sunbeat separa o intake público dos sistemas operacionais e mantém ações sensíveis dentro de fluxos controlados.",
    ctaSales: "Falar com vendas",
    ctaPricing: "Ver planos",

    trustStrip: [
      "Intake público separado das operações",
      "Integrações server-side",
      "Aprovação humana para ações irreversíveis",
    ],

    sections: [
      {
        title: "Intake público protegido",
        items: [
          "Formulários públicos não expõem Airtable, Drive ou detalhes de automação interna.",
          "Os solicitantes interagem apenas com a superfície de intake, não com o backend operacional.",
          "A estrutura e o roteamento dos formulários ficam no servidor.",
        ],
      },
      {
        title: "Integrações server-side",
        items: [
          "As integrações rodam por serviços server-side com credenciais de menor privilégio.",
          "Secrets nunca são expostos ao navegador.",
          "Chaves de API e tokens ficam fora do código cliente.",
        ],
      },
      {
        title: "Aprovação humana para ações irreversíveis",
        items: [
          "A IA pode sugerir, validar e rascunhar contexto.",
          "As pessoas confirmam toda ação irreversível antes de ser executada.",
          "Publicação automatizada sem revisão não é permitida por design.",
        ],
      },
      {
        title: "Limites de configuração por tenant",
        items: [
          "Workspaces, configurações de workflow, branding e mapeamentos são tratados como limites de configuração.",
          "O contexto operacional de cada tenant fica dentro do escopo do seu workspace.",
        ],
      },
    ],

    guardrailsTitle: "Controles operacionais",
    guardrails: [
      "Secrets ficam no servidor",
      "A IA não publica alterações de forma autônoma",
      "Configurações e propostas exigem revisão",
      "Workflows sensíveis permanecem protegidos",
    ],

    notClaimTitle: "O que não afirmamos",
    notClaimIntro:
      "Evitamos afirmações de segurança infladas. Se um requisito for importante para sua organização, documentamos com clareza durante o setup.",
    notClaimItems: [
      "Certificação SOC 2",
      "Certificação HIPAA ou GDPR",
      "IA ilimitada ou autônoma",
      "Publicação autônoma sem revisão humana",
    ],

    ctaHeadline: "Quer revisar segurança para sua operação?",
    ctaSubcopy:
      "Podemos detalhar como a Sunbeat lida com dados, acessos e integrações para o seu setup específico.",
  },
};

export default async function SecurityPage() {
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

      {/* Trust strip */}
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

      {/* Security sections */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid gap-5 sm:grid-cols-2">
          {c.sections.map((sec) => (
            <div
              key={sec.title}
              className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_10px_24px_rgba(20,16,10,0.06)]"
            >
              <div className="text-sm font-semibold text-[#111111]">
                {sec.title}
              </div>
              <ul className="mt-3 flex flex-col gap-2.5">
                {sec.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#9B948D]" />
                    <span className="text-sm leading-relaxed text-[#5E5A54]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Operational guardrails */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-[#111111] md:text-3xl">
          {c.guardrailsTitle}
        </h2>
        <div className="mt-8 flex flex-wrap gap-3">
          {c.guardrails.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-black/8 bg-[#F8F4EC] px-5 py-3 text-sm font-medium text-[#5E5A54] shadow-[0_2px_6px_rgba(20,16,10,0.04)]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* What we do not claim */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="rounded-[28px] bg-[#111111] px-8 py-10 md:px-12 md:py-14 shadow-[0_10px_24px_rgba(20,16,10,0.12)]">
          <h2 className="text-xl font-semibold text-[#FCFBF8] md:text-2xl">
            {c.notClaimTitle}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#E5E0D8] md:text-base">
            {c.notClaimIntro}
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
              href="/contact"
              className="inline-flex min-w-[120px] items-center justify-center rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-[#FCFBF8] hover:bg-[#1D1D1D] transition-colors"
            >
              {c.ctaSales}
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-w-[120px] items-center justify-center rounded-full border border-black/12 bg-white px-6 py-3 text-sm font-medium text-[#111111] hover:bg-black/5 transition-colors"
            >
              {c.ctaPricing}
            </Link>
          </div>
        </div>
      </section>
    </MarketingPageChrome>
  );
}
