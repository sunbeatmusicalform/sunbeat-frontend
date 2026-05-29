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
    sections: [
      {
        title: "Protected public intake",
        items: [
          "Public forms do not expose Airtable, Drive or internal automation details.",
          "Submitters interact with the intake surface, not the operational backend.",
        ],
      },
      {
        title: "Server-side integrations",
        items: [
          "Integrations run through server-side services and least-privilege credentials.",
          "Secrets are not exposed to the browser.",
        ],
      },
      {
        title: "Human approval for irreversible actions",
        items: [
          "AI can suggest, validate and draft.",
          "People confirm irreversible actions.",
        ],
      },
      {
        title: "Tenant-aware operations",
        items: [
          "Workspaces, workflow settings, branding and mappings are treated as configuration boundaries.",
        ],
      },
    ],
    notClaimTitle: "What we do not claim",
    notClaimItems: [
      "SOC 2 certified",
      "HIPAA or GDPR certification",
      "Unlimited or autonomous AI",
      "Autonomous publishing without human review",
    ],
    ctaSales: "Talk to sales",
    ctaPricing: "View pricing",
  },
  brazil: {
    eyebrow: "Segurança",
    title: "Segurança por design, governança por padrão.",
    subtitle:
      "A Sunbeat separa o intake público dos sistemas operacionais e mantém ações sensíveis dentro de fluxos controlados.",
    sections: [
      {
        title: "Intake público protegido",
        items: [
          "Formulários públicos não expõem Airtable, Drive ou detalhes de automação interna.",
          "Os solicitantes interagem com a superfície de intake, não com o backend operacional.",
        ],
      },
      {
        title: "Integrações server-side",
        items: [
          "As integrações rodam por serviços server-side e credenciais com menor privilégio.",
          "Secrets não são expostos ao navegador.",
        ],
      },
      {
        title: "Aprovação humana para ações irreversíveis",
        items: [
          "A IA pode sugerir, validar e rascunhar.",
          "As pessoas confirmam ações irreversíveis.",
        ],
      },
      {
        title: "Operações tenant-aware",
        items: [
          "Workspaces, configurações de workflow, branding e mapeamentos são tratados como limites de configuração.",
        ],
      },
    ],
    notClaimTitle: "O que não afirmamos",
    notClaimItems: [
      "Certificação SOC 2",
      "Certificação HIPAA ou GDPR",
      "IA ilimitada ou autônoma",
      "Publicação autônoma sem revisão humana",
    ],
    ctaSales: "Falar com vendas",
    ctaPricing: "Ver planos",
  },
};

export default async function SecurityPage() {
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

      {/* Security sections */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="grid gap-5 sm:grid-cols-2">
          {c.sections.map((sec) => (
            <div
              key={sec.title}
              className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm"
            >
              <div className="text-sm font-semibold text-[#111111]">
                {sec.title}
              </div>
              <ul className="mt-3 flex flex-col gap-2">
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

      {/* What we do not claim */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="rounded-2xl bg-[#111111] px-8 py-10 md:px-12">
          <h2 className="text-xl font-semibold text-white md:text-2xl">
            {c.notClaimTitle}
          </h2>
          <ul className="mt-6 flex flex-col gap-3">
            {c.notClaimItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#A09A94]" />
                <span className="text-sm text-[#A09A94]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="rounded-2xl border border-black/8 bg-[#F8F4EC] px-8 py-10 md:px-12">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1D1D1D] transition-colors"
            >
              {c.ctaSales}
            </Link>
            <Link
              href="/pricing"
              className="inline-flex rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-[#111111] hover:bg-black/5 transition-colors"
            >
              {c.ctaPricing}
            </Link>
          </div>
        </div>
      </section>
    </MarketingPageChrome>
  );
}
