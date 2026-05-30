import { headers } from "next/headers";
import { resolveMarket, type Market } from "@/lib/billing/catalog";
import MarketingPageChrome from "@/components/marketing/MarketingPageChrome";
import Link from "next/link";

// ─── Copy ────────────────────────────────────────────────────────────────────

const COPY = {
  global: {
    eyebrow: "Legal",
    title: "Privacy Policy",
    subtitle: "How Sunbeat handles account, workspace, intake and operational data.",
    lastUpdated: "Last updated: May 30, 2026",
    transparencyNote:
      "This page is provided for transparency and may be updated as Sunbeat evolves.",
    contact: "Contact",
    contactHref: "/contact",
    sections: [
      {
        id: "overview",
        title: "1. Overview",
        body: "Sunbeat helps teams collect intake, files, metadata and operational context through structured workflows. This policy explains the categories of information handled through the Sunbeat website and product tools.",
        bullets: [],
      },
      {
        id: "information-collected",
        title: "2. Information we may collect",
        body: "We may handle the following categories of information:",
        bullets: [
          "Account and contact information you provide.",
          "Workspace and configuration information.",
          "Intake submissions, form responses, files and metadata uploaded through workflows.",
          "Operational records such as status, review notes or support requests.",
          "Basic website and product usage information.",
        ],
      },
      {
        id: "how-we-use",
        title: "3. How we use information",
        body: "We use information to:",
        bullets: [
          "Provide, operate and improve Sunbeat.",
          "Process intake, files, workflow state and operational context.",
          "Support users and respond to requests.",
          "Maintain security, prevent abuse and troubleshoot issues.",
          "Communicate product or account information.",
        ],
      },
      {
        id: "files-submissions",
        title: "4. Files and intake submissions",
        body: "Files and metadata may be provided by submitters or workspace users. Workspace owners are responsible for configuring what they request from submitters. We recommend avoiding requests for sensitive personal information unless it is strictly necessary for your workflow.",
        bullets: [],
      },
      {
        id: "integrations",
        title: "5. Integrations and service providers",
        body: "Sunbeat may connect to third-party services configured by a workspace, such as storage, spreadsheets, databases, email or automation systems. Availability and behavior depend on plan, setup and user configuration. Third-party services have their own privacy practices.",
        bullets: [],
      },
      {
        id: "ai-features",
        title: "6. AI-assisted features",
        body: "AI-assisted features may help summarize, validate or suggest next steps within a workflow. AI does not replace human review and should not be treated as final approval.",
        bullets: [],
      },
      {
        id: "security",
        title: "7. Security",
        body: "Sunbeat is designed to separate public intake from operational systems, and to handle secrets and integration credentials server-side. We take reasonable measures to protect information, but no system is perfectly secure.",
        bullets: [],
      },
      {
        id: "retention",
        title: "8. Retention and deletion",
        body: "Information may be retained as needed to provide the service, maintain records, resolve issues and comply with applicable obligations. Users may contact Sunbeat through the contact page to request support with deletion or access requests.",
        bullets: [],
      },
      {
        id: "choices",
        title: "9. Your choices",
        body: "You may contact Sunbeat through the contact page for privacy-related requests. Workspace owners may manage their workspace configuration and submitted information.",
        bullets: [],
      },
      {
        id: "changes",
        title: "10. Changes to this policy",
        body: "Sunbeat may update this policy as the service evolves. Continued use of the service after an update constitutes acceptance of the revised policy.",
        bullets: [],
      },
      {
        id: "contact",
        title: "11. Contact",
        body: "For privacy-related questions or requests, please use the contact page.",
        bullets: [],
      },
    ],
  },

  brazil: {
    eyebrow: "Legal",
    title: "Política de Privacidade",
    subtitle: "Como a Sunbeat lida com dados de conta, workspace, intake e operação.",
    lastUpdated: "Atualizado em: 30 de maio de 2026",
    transparencyNote:
      "Esta página é fornecida para transparência e pode ser atualizada conforme a Sunbeat evolui.",
    contact: "Contato",
    contactHref: "/contact",
    sections: [
      {
        id: "overview",
        title: "1. Visão geral",
        body: "A Sunbeat ajuda equipes a coletar intake, arquivos, metadados e contexto operacional por meio de workflows estruturados. Esta política explica as categorias de informações tratadas pelo site e pelas ferramentas da Sunbeat.",
        bullets: [],
      },
      {
        id: "information-collected",
        title: "2. Informações que podemos coletar",
        body: "Podemos tratar as seguintes categorias de informações:",
        bullets: [
          "Informações de conta e contato fornecidas por você.",
          "Informações de workspace e configuração.",
          "Submissões de intake, respostas de formulários, arquivos e metadados enviados pelos workflows.",
          "Registros operacionais como status, notas de revisão ou solicitações de suporte.",
          "Informações básicas de uso do site e do produto.",
        ],
      },
      {
        id: "how-we-use",
        title: "3. Como usamos as informações",
        body: "Usamos as informações para:",
        bullets: [
          "Disponibilizar, operar e melhorar a Sunbeat.",
          "Processar intake, arquivos, estado de workflow e contexto operacional.",
          "Apoiar usuários e responder a solicitações.",
          "Manter segurança, prevenir abusos e solucionar problemas.",
          "Comunicar informações sobre produtos ou contas.",
        ],
      },
      {
        id: "files-submissions",
        title: "4. Arquivos e submissões de intake",
        body: "Arquivos e metadados podem ser fornecidos por solicitantes ou usuários do workspace. Os responsáveis pelo workspace são responsáveis por configurar o que solicitam dos submissores. Recomendamos evitar solicitar informações pessoais sensíveis, a menos que sejam estritamente necessárias para o seu workflow.",
        bullets: [],
      },
      {
        id: "integrations",
        title: "5. Integrações e prestadores de serviço",
        body: "A Sunbeat pode se conectar a serviços de terceiros configurados por um workspace, como armazenamento, planilhas, bancos de dados, e-mail ou sistemas de automação. A disponibilidade e o comportamento dependem do plano, da configuração e das escolhas do usuário. Serviços de terceiros possuem suas próprias práticas de privacidade.",
        bullets: [],
      },
      {
        id: "ai-features",
        title: "6. Recursos com assistência de IA",
        body: "Recursos com assistência de IA podem ajudar a resumir, validar ou sugerir próximos passos dentro de um workflow. A IA não substitui a revisão humana e não deve ser tratada como aprovação final.",
        bullets: [],
      },
      {
        id: "security",
        title: "7. Segurança",
        body: "A Sunbeat é projetada para separar o intake público dos sistemas operacionais e para tratar secrets e credenciais de integração no lado do servidor. Adotamos medidas razoáveis para proteger as informações, mas nenhum sistema é perfeitamente seguro.",
        bullets: [],
      },
      {
        id: "retention",
        title: "8. Retenção e exclusão",
        body: "As informações podem ser retidas conforme necessário para fornecer o serviço, manter registros, resolver problemas e cumprir obrigações aplicáveis. Os usuários podem entrar em contato com a Sunbeat pela página de contato para solicitar suporte em pedidos de exclusão ou acesso.",
        bullets: [],
      },
      {
        id: "choices",
        title: "9. Suas escolhas",
        body: "Você pode entrar em contato com a Sunbeat pela página de contato para solicitações relacionadas à privacidade. Os responsáveis pelo workspace podem gerenciar a configuração do workspace e as informações submetidas.",
        bullets: [],
      },
      {
        id: "changes",
        title: "10. Alterações nesta política",
        body: "A Sunbeat pode atualizar esta política conforme o serviço evolui. O uso continuado do serviço após uma atualização constitui aceitação da política revisada.",
        bullets: [],
      },
      {
        id: "contact",
        title: "11. Contato",
        body: "Para dúvidas ou solicitações relacionadas à privacidade, use a página de contato.",
        bullets: [],
      },
    ],
  },
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function PrivacyPage() {
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
              {sec.id === "contact" || sec.id === "choices" ? (
                <Link
                  href={c.contactHref}
                  className="mt-4 inline-flex items-center text-sm font-medium text-[#111111] underline underline-offset-2 hover:text-[#5E5A54] transition-colors"
                >
                  {c.contact} →
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </MarketingPageChrome>
  );
}
