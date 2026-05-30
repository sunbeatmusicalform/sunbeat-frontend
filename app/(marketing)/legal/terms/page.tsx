import { headers } from "next/headers";
import { resolveMarket, type Market } from "@/lib/billing/catalog";
import MarketingPageChrome from "@/components/marketing/MarketingPageChrome";
import Link from "next/link";

// ─── Copy ────────────────────────────────────────────────────────────────────

const COPY = {
  global: {
    eyebrow: "Legal",
    title: "Terms of Service",
    subtitle: "The basic terms for using Sunbeat websites, workspaces and workflow tools.",
    lastUpdated: "Last updated: May 30, 2026",
    transparencyNote:
      "This page is provided for transparency and may be updated as Sunbeat evolves.",
    contact: "Contact",
    contactHref: "/contact",
    pricing: "View pricing",
    pricingHref: "/pricing",
    sections: [
      {
        id: "overview",
        title: "1. Overview",
        body: "These terms describe the use of Sunbeat websites and product workflows. By using Sunbeat, users agree to use it responsibly and within configured permissions.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "accounts",
        title: "2. Accounts and workspaces",
        body: "Users are responsible for maintaining the security of their account access. Workspace owners and administrators are responsible for configuring workflows, forms, permissions and integrations within their workspace.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "submissions",
        title: "3. Intake, files and submitted content",
        body: "Users and submitters may provide text, metadata, files or other content through Sunbeat workflows. The submitting party is responsible for having the rights to upload or share the content submitted. Do not upload unlawful, harmful or unauthorized content.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "acceptable-use",
        title: "4. Acceptable use",
        body: "When using Sunbeat, you agree to the following:",
        bullets: [
          "Do not misuse the service or attempt unauthorized access.",
          "Do not upload malicious files or content.",
          "Do not use Sunbeat to violate rights or applicable laws.",
          "Do not interfere with service reliability or other users.",
        ],
        showContact: false,
        showPricing: false,
      },
      {
        id: "integrations",
        title: "5. Workflow and integration configuration",
        body: "Sunbeat may connect to external systems when configured by a workspace. Users are responsible for their external account permissions and configuration choices. Integration availability may vary by plan and setup.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "ai-features",
        title: "6. AI-assisted features",
        body: "AI features in Sunbeat may suggest, validate, summarize or draft operational context. AI output should be reviewed by a human before acting on it. Sunbeat does not present AI suggestions as automatic final approval.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "billing",
        title: "7. Plans and billing",
        body: "Paid plan details are described on the pricing page or within the checkout flow. Prices and plan features may change, and material changes should be presented through the product, pricing page, checkout flow or account notice where appropriate.",
        bullets: [],
        showContact: false,
        showPricing: true,
      },
      {
        id: "service-changes",
        title: "8. Service changes",
        body: "Sunbeat may improve, modify, suspend or discontinue features or the service at any time. We will make reasonable efforts to communicate significant changes.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "disclaimers",
        title: "9. Disclaimers",
        body: "The service is provided as available. Sunbeat does not provide legal, financial or professional advice. Use of the service is at the user's own discretion.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "liability",
        title: "10. Limitation of liability",
        body: "To the extent permitted by applicable law, Sunbeat's liability for any claims arising from use of the service is limited. We do not guarantee uninterrupted availability or freedom from errors.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "contact",
        title: "11. Contact",
        body: "For questions about these terms or your use of Sunbeat, please use the contact page.",
        bullets: [],
        showContact: true,
        showPricing: false,
      },
    ],
  },

  brazil: {
    eyebrow: "Legal",
    title: "Termos de Serviço",
    subtitle: "Termos básicos para usar os sites, workspaces e ferramentas de workflow da Sunbeat.",
    lastUpdated: "Atualizado em: 30 de maio de 2026",
    transparencyNote:
      "Esta página é fornecida para transparência e pode ser atualizada conforme a Sunbeat evolui.",
    contact: "Contato",
    contactHref: "/contact",
    pricing: "Ver planos",
    pricingHref: "/pricing",
    sections: [
      {
        id: "overview",
        title: "1. Visão geral",
        body: "Estes termos descrevem o uso dos sites e workflows do produto Sunbeat. Ao usar a Sunbeat, os usuários concordam em utilizá-la de forma responsável e dentro das permissões configuradas.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "accounts",
        title: "2. Contas e workspaces",
        body: "Os usuários são responsáveis por manter a segurança do acesso à sua conta. Os responsáveis e administradores do workspace são responsáveis por configurar workflows, formulários, permissões e integrações dentro do seu workspace.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "submissions",
        title: "3. Intake, arquivos e conteúdo submetido",
        body: "Usuários e solicitantes podem fornecer texto, metadados, arquivos ou outro conteúdo pelos workflows da Sunbeat. A parte que envia o conteúdo é responsável por ter os direitos para fazer o upload ou compartilhamento. Não envie conteúdo ilegal, prejudicial ou não autorizado.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "acceptable-use",
        title: "4. Uso aceitável",
        body: "Ao usar a Sunbeat, você concorda com o seguinte:",
        bullets: [
          "Não use o serviço de forma inadequada nem tente acesso não autorizado.",
          "Não envie arquivos ou conteúdo malicioso.",
          "Não use a Sunbeat para violar direitos ou leis aplicáveis.",
          "Não interfira na confiabilidade do serviço ou na experiência de outros usuários.",
        ],
        showContact: false,
        showPricing: false,
      },
      {
        id: "integrations",
        title: "5. Configuração de workflow e integrações",
        body: "A Sunbeat pode se conectar a sistemas externos quando configurada por um workspace. Os usuários são responsáveis pelas permissões de suas contas externas e pelas escolhas de configuração. A disponibilidade de integrações pode variar conforme plano e setup.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "ai-features",
        title: "6. Recursos com assistência de IA",
        body: "Os recursos de IA da Sunbeat podem sugerir, validar, resumir ou rascunhar contexto operacional. O resultado da IA deve ser revisado por uma pessoa antes de ser utilizado. A Sunbeat não apresenta sugestões de IA como aprovação final automática.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "billing",
        title: "7. Planos e cobrança",
        body: "Os detalhes dos planos pagos estão descritos na página de planos ou no fluxo de checkout. Preços e recursos dos planos podem mudar, e alterações relevantes devem ser apresentadas pelo produto, pela página de planos, pelo checkout ou por aviso de conta quando apropriado.",
        bullets: [],
        showContact: false,
        showPricing: true,
      },
      {
        id: "service-changes",
        title: "8. Alterações no serviço",
        body: "A Sunbeat pode melhorar, modificar, suspender ou descontinuar recursos ou o serviço a qualquer momento. Faremos esforços razoáveis para comunicar alterações significativas.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "disclaimers",
        title: "9. Isenções de responsabilidade",
        body: "O serviço é disponibilizado conforme disponível. A Sunbeat não fornece aconselhamento jurídico, financeiro ou profissional. O uso do serviço é de responsabilidade do usuário.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "liability",
        title: "10. Limitação de responsabilidade",
        body: "Na extensão permitida pela lei aplicável, a responsabilidade da Sunbeat por quaisquer reclamações decorrentes do uso do serviço é limitada. Não garantimos disponibilidade ininterrupta ou ausência de erros.",
        bullets: [],
        showContact: false,
        showPricing: false,
      },
      {
        id: "contact",
        title: "11. Contato",
        body: "Para dúvidas sobre estes termos ou sobre o uso da Sunbeat, use a página de contato.",
        bullets: [],
        showContact: true,
        showPricing: false,
      },
    ],
  },
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function TermsPage() {
  const host = (await headers()).get("host") ?? "";
  const market: Market = resolveMarket(host);
  const c = COPY[market];

  return (
    <MarketingPageChrome market={market}>
      {/* ── Header ── */}
      <section className="mx-auto max-w-3xl px-4 pt-20 pb-10 md:pt-28">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#9B948D]">
          {c.eyebrow}
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#111111] md:text-4xl">
          {c.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[#5E5A54]">
          {c.subtitle}
        </p>
        <p className="mt-2 text-xs text-[#9B948D]">{c.lastUpdated}</p>

        {/* Transparency callout */}
        <div className="mt-6 rounded-2xl border border-black/8 bg-[#F8F4EC] px-5 py-4">
          <p className="text-sm leading-relaxed text-[#7A746A]">
            {c.transparencyNote}
          </p>
        </div>
      </section>

      {/* ── Sections ── */}
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="flex flex-col gap-5">
          {c.sections.map((sec) => (
            <div
              id={sec.id}
              key={sec.id}
              className="rounded-[28px] border border-black/8 bg-white p-7 shadow-[0_4px_16px_rgba(20,16,10,0.05)]"
            >
              <h2 className="text-sm font-semibold text-[#111111]">
                {sec.title}
              </h2>
              {sec.body ? (
                <p className="mt-2 text-sm leading-relaxed text-[#5E5A54]">
                  {sec.body}
                </p>
              ) : null}
              {sec.bullets.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {sec.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#9B948D]" />
                      <span className="text-sm leading-relaxed text-[#5E5A54]">
                        {b}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {sec.showContact ? (
                <Link
                  href={c.contactHref}
                  className="mt-4 inline-flex items-center text-sm font-medium text-[#111111] underline underline-offset-2 hover:text-[#5E5A54] transition-colors"
                >
                  {c.contact} →
                </Link>
              ) : null}
              {sec.showPricing ? (
                <Link
                  href={c.pricingHref}
                  className="mt-4 inline-flex items-center text-sm font-medium text-[#111111] underline underline-offset-2 hover:text-[#5E5A54] transition-colors"
                >
                  {c.pricing} →
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </MarketingPageChrome>
  );
}
