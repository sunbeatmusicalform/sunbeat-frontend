import { headers } from "next/headers";
import {
  LegalDocumentPage,
  type LegalDocumentSection,
} from "@/components/marketing/LegalDocumentPage";
import { resolveMarket, type Market } from "@/lib/billing/catalog";

const TERMS_COPY: Record<
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
    title: "Termos de Uso",
    summary:
      "Estes termos descrevem as regras gerais para acesso ao site publico da Sunbeat, criacao de workspace e uso convidado das superficies do produto.",
    noticeTitle: "Versao publica temporaria",
    notice:
      "Esta versao e um resumo legivel e temporario enquanto o texto juridico final da Sunbeat e consolidado para producao. Contratos, propostas, convites de workspace e termos operacionais especificos podem complementar este documento.",
    lastUpdatedLabel: "Atualizado em",
    lastUpdated: "11 de maio de 2026",
    sections: [
      {
        heading: "1. Escopo do servico",
        paragraphs: [
          "A Sunbeat oferece um site publico, fluxos de contato, criacao de conta, acesso a workspaces e experiencias operacionais relacionadas a intake, workflow e coordenacao de execucao.",
          "Nem todos os recursos ficam disponiveis para todos os visitantes. Alguns acessos dependem de convite, plano ativo, configuracao do workspace ou disponibilidade operacional.",
        ],
      },
      {
        heading: "2. Cadastro, acesso e responsabilidade de conta",
        paragraphs: [
          "Ao criar conta ou solicitar acesso, voce deve fornecer informacoes verdadeiras, atuais e compativeis com o uso pretendido.",
          "Cada usuario e responsavel por manter a seguranca de seus codigos, links de acesso, credenciais e dispositivos. Atividades realizadas na conta ou no workspace sao atribuidas ao respectivo acesso ate evidencia em contrario.",
        ],
      },
      {
        heading: "3. Uso aceitavel",
        paragraphs: [
          "Voce nao deve usar a Sunbeat para violar leis, direitos de terceiros, regras contratuais, medidas de seguranca ou a estabilidade da plataforma.",
          "Tambem nao e permitido tentar contornar limites tecnicos, acessar workspaces sem autorizacao, enviar conteudo malicioso, praticar fraude, engenharia reversa indevida ou se passar por outra pessoa ou organizacao.",
        ],
      },
      {
        heading: "4. Conteudo, submissoes e dados operacionais",
        paragraphs: [
          "Voce permanece responsavel pelo conteudo, arquivos, metadados e instrucoes enviados para a plataforma, inclusive quanto a legitimidade do envio e a autorizacao para compartilhar esses materiais.",
          "Ao usar a Sunbeat, voce concede as permissoes estritamente necessarias para hospedar, processar, armazenar, organizar e exibir esses dados dentro do servico e dos fluxos operacionais relacionados.",
        ],
      },
      {
        heading: "5. Disponibilidade e mudancas",
        paragraphs: [
          "A Sunbeat pode atualizar, corrigir, limitar, pausar ou reorganizar partes do servico para evolucao do produto, estabilidade operacional, seguranca ou conformidade.",
          "Sempre que possivel, mudancas relevantes serao refletidas na experiencia do produto ou em comunicacao apropriada. A disponibilidade pode depender de provedores externos e da configuracao do workspace.",
        ],
      },
      {
        heading: "6. Limites razoaveis de responsabilidade",
        paragraphs: [
          "A Sunbeat busca operar com diligencia e padrao profissional, mas nao garante funcionamento ininterrupto, livre de erros ou adequado a todos os cenarios sem validacao especifica.",
          "Na medida permitida pela legislacao aplicavel, a responsabilidade da Sunbeat deve ser interpretada de forma proporcional ao contexto de uso, ao plano contratado e a natureza do evento relatado.",
        ],
      },
      {
        heading: "7. Contato",
        paragraphs: [
          "Se voce precisar de esclarecimentos contratuais, contexto adicional sobre estes termos ou uma versao complementar aplicavel ao seu workspace, use a rota de contato publico da Sunbeat.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/legal/privacy", label: "Politica de Privacidade" },
      { href: "/contact", label: "Falar com a Sunbeat" },
      { href: "/", label: "Voltar para o site" },
    ],
  },
  global: {
    title: "Terms of Service",
    summary:
      "These terms describe the general rules for access to Sunbeat's public website, workspace creation flows and invited use of product surfaces.",
    noticeTitle: "Temporary public version",
    notice:
      "This public version is a temporary, human-readable summary while Sunbeat consolidates the final legal text for production. Order forms, workspace invitations, service agreements and operational terms may supplement this document.",
    lastUpdatedLabel: "Last updated",
    lastUpdated: "May 11, 2026",
    sections: [
      {
        heading: "1. Scope of service",
        paragraphs: [
          "Sunbeat provides a public website, contact flows, account creation, workspace access and operational experiences related to intake, workflow and execution coordination.",
          "Not every feature is available to every visitor. Some access depends on invitation, active plan, workspace configuration or operational availability.",
        ],
      },
      {
        heading: "2. Accounts, access and responsibility",
        paragraphs: [
          "When you create an account or request access, you must provide accurate, current information that matches your intended use of the service.",
          "Each user is responsible for keeping their access codes, magic links, credentials and devices secure. Activity performed through that access will be associated with the relevant account or workspace unless proven otherwise.",
        ],
      },
      {
        heading: "3. Acceptable use",
        paragraphs: [
          "You may not use Sunbeat to violate laws, third-party rights, contractual restrictions, security controls or the stability of the platform.",
          "This includes attempts to bypass technical limits, access workspaces without authorization, submit malicious content, commit fraud, perform improper reverse engineering or impersonate another person or organization.",
        ],
      },
      {
        heading: "4. Content, submissions and operational data",
        paragraphs: [
          "You remain responsible for the content, files, metadata and instructions submitted through the platform, including your authority to provide and share those materials.",
          "By using Sunbeat, you grant the limited permissions required for us to host, process, store, organize and display that data within the service and its related operational workflows.",
        ],
      },
      {
        heading: "5. Availability and changes",
        paragraphs: [
          "Sunbeat may update, fix, limit, pause or reorganize parts of the service for product evolution, operational stability, security or compliance.",
          "Whenever practical, material changes will be reflected in the product experience or in appropriate communication. Availability may depend on third-party providers and workspace configuration.",
        ],
      },
      {
        heading: "6. Reasonable limits of liability",
        paragraphs: [
          "Sunbeat aims to operate with care and professional standards, but does not guarantee uninterrupted availability, error-free operation or suitability for every scenario without specific validation.",
          "To the extent permitted by applicable law, Sunbeat's responsibility should be interpreted in proportion to the relevant use case, subscribed plan and nature of the reported event.",
        ],
      },
      {
        heading: "7. Contact",
        paragraphs: [
          "If you need contractual clarification, additional context about these terms or a supplemental version that applies to your workspace, please use Sunbeat's public contact channel.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/contact", label: "Contact Sunbeat" },
      { href: "/", label: "Back to the website" },
    ],
  },
};

export default async function TermsPage() {
  const host = (await headers()).get("host") ?? "";
  const market: Market = resolveMarket(host);
  const copy = TERMS_COPY[market];

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
