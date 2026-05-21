import { headers } from "next/headers";
import {
  LegalDocumentPage,
  type LegalDocumentSection,
} from "@/components/marketing/LegalDocumentPage";
import { resolveMarket, type Market } from "@/lib/billing/catalog";

const PRIVACY_COPY: Record<
  Market,
  {
    title: string;
    summary: string;
    noticeTitle: string;
    notice: string;
    lastUpdatedLabel: string;
    lastUpdated: string;
    sections: LegalDocumentSection[];
    relatedLinks: Array<{ href: string; label: string }>;
  }
> = {
  brazil: {
    title: "Politica de Privacidade",
    summary:
      "Esta pagina resume, em linguagem direta, como a Sunbeat trata dados pessoais e dados operacionais nas experiencias publicas e convidadas do produto.",
    noticeTitle: "Versao publica temporaria",
    notice:
      "Esta versao e um resumo temporario enquanto a redacao juridica final e consolidada para producao. Regras complementares podem existir em contratos, planos, convites de workspace ou fluxos operacionais especificos.",
    lastUpdatedLabel: "Atualizado em",
    lastUpdated: "11 de maio de 2026",
    sections: [
      {
        heading: "1. Dados que podemos coletar",
        paragraphs: [
          "A Sunbeat pode receber dados de contato, dados de conta, informacoes de workspace, conteudo enviado em formularios, arquivos, metadados, registros tecnicos e sinais operacionais necessarios para funcionamento do servico.",
          "A natureza exata desses dados depende da superficie utilizada, do plano ativo e do fluxo configurado para cada workspace.",
        ],
      },
      {
        heading: "2. Como usamos esses dados",
        paragraphs: [
          "Usamos dados para permitir acesso, operar formularios e workflows, responder solicitacoes, autenticar usuarios, suportar onboarding, proteger a plataforma, investigar incidentes e melhorar a experiencia do produto.",
          "Tambem podemos usar dados de forma interna para auditoria, prevencao de abuso, suporte tecnico e continuidade operacional.",
        ],
      },
      {
        heading: "3. Compartilhamento e operadores",
        paragraphs: [
          "Quando necessario para prestar o servico, a Sunbeat pode utilizar provedores de infraestrutura, autenticacao, armazenamento, e-mail, banco de dados, analytics, billing e ferramentas operacionais.",
          "Tambem podemos compartilhar dados quando houver obrigacao legal, protecao de direitos, investigacao de fraude, defesa de seguranca ou solicitacao autorizada pelo cliente ou titular dos dados.",
        ],
      },
      {
        heading: "4. Retencao",
        paragraphs: [
          "Os dados podem ser mantidos pelo tempo necessario para operar o servico, sustentar o relacionamento com o cliente, preservar trilhas de auditoria e cumprir obrigacoes contratuais, legais ou de seguranca.",
          "Quando aplicavel, a Sunbeat pode revisar pedidos de exclusao ou anonimizacao considerando as obrigacoes existentes e a viabilidade tecnica.",
        ],
      },
      {
        heading: "5. Seguranca",
        paragraphs: [
          "A Sunbeat adota medidas razoaveis de seguranca tecnica e operacional compativeis com o contexto do servico, mas nenhum sistema pode ser considerado totalmente livre de risco.",
          "Usuarios e clientes tambem tem responsabilidade por boas praticas de acesso, permissoes, compartilhamento de arquivos e gestao do workspace.",
        ],
      },
      {
        heading: "6. Duvidas, correcoes e solicitacoes",
        paragraphs: [
          "Se voce precisar atualizar dados, pedir esclarecimentos, relatar preocupacoes ou solicitar uma versao complementar aplicavel ao seu caso, use o canal publico de contato da Sunbeat.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/legal/terms", label: "Termos de Uso" },
      { href: "/contact", label: "Falar com a Sunbeat" },
      { href: "/", label: "Voltar para o site" },
    ],
  },
  global: {
    title: "Privacy Policy",
    summary:
      "This page provides a direct, temporary summary of how Sunbeat handles personal and operational data across public and invited product experiences.",
    noticeTitle: "Temporary public version",
    notice:
      "This is a temporary summary while Sunbeat consolidates the final production legal wording. Supplemental rules may also apply through contracts, plans, workspace invitations or specific operational flows.",
    lastUpdatedLabel: "Last updated",
    lastUpdated: "May 11, 2026",
    sections: [
      {
        heading: "1. Data we may collect",
        paragraphs: [
          "Sunbeat may receive contact information, account data, workspace information, form submissions, uploaded files, metadata, technical logs and operational signals needed to run the service.",
          "The exact data involved depends on the surface being used, the active plan and the workflow configured for each workspace.",
        ],
      },
      {
        heading: "2. How we use data",
        paragraphs: [
          "We use data to provide access, run forms and workflows, respond to requests, authenticate users, support onboarding, protect the platform, investigate incidents and improve the product experience.",
          "We may also use data internally for audit trails, abuse prevention, technical support and operational continuity.",
        ],
      },
      {
        heading: "3. Sharing and processors",
        paragraphs: [
          "Where needed to provide the service, Sunbeat may rely on infrastructure, authentication, storage, email, database, analytics, billing and operational service providers.",
          "We may also share data when required by law, to protect rights, investigate fraud, support security or respond to an authorized request from the customer or data subject.",
        ],
      },
      {
        heading: "4. Retention",
        paragraphs: [
          "Data may be retained for as long as reasonably needed to operate the service, maintain the customer relationship, preserve auditability and meet contractual, legal or security obligations.",
          "Where applicable, Sunbeat may review deletion or anonymization requests in light of those obligations and technical feasibility.",
        ],
      },
      {
        heading: "5. Security",
        paragraphs: [
          "Sunbeat applies reasonable technical and operational safeguards appropriate to the service context, but no system can be guaranteed to be entirely risk-free.",
          "Users and customers also share responsibility for secure access practices, permissions, file sharing and workspace administration.",
        ],
      },
      {
        heading: "6. Questions, corrections and requests",
        paragraphs: [
          "If you need to update data, request clarification, report a concern or obtain a supplemental version that applies to your situation, please use Sunbeat's public contact channel.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/legal/terms", label: "Terms of Service" },
      { href: "/contact", label: "Contact Sunbeat" },
      { href: "/", label: "Back to the website" },
    ],
  },
};

export default async function PrivacyPage() {
  const host = (await headers()).get("host") ?? "";
  const market: Market = resolveMarket(host);
  const copy = PRIVACY_COPY[market];

  return (
    <LegalDocumentPage
      eyebrow="Legal"
      title={copy.title}
      summary={copy.summary}
      noticeTitle={copy.noticeTitle}
      notice={copy.notice}
      lastUpdatedLabel={copy.lastUpdatedLabel}
      lastUpdated={copy.lastUpdated}
      sections={copy.sections}
      relatedLinks={copy.relatedLinks}
    />
  );
}
