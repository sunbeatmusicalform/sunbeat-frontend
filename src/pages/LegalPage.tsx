import { useEffect } from 'react'
import { Link } from 'react-router'
import { resolveConceptLocale, type ConceptLocale } from '../concept/copy'

type LegalKind = 'terms' | 'privacy'

type LegalSection = {
  title: string
  paragraphs?: readonly string[]
  items?: readonly string[]
}

const COMPANY = 'Good Corporation Produções e Serviços de Informações na Internet EIRELI'
const CNPJ = '35.231.111/0001-93'
const CONTACT = 'contatofelipefonsek@gmail.com'

const LEGAL_COPY: Record<ConceptLocale, Record<LegalKind, {
  eyebrow: string
  title: string
  intro: string
  effective: string
  sections: readonly LegalSection[]
}>> = {
  'pt-BR': {
    terms: {
      eyebrow: 'Sunbeat · documento legal',
      title: 'Termos de Uso',
      intro: 'Estes Termos regulam o acesso e o uso da plataforma Sunbeat. Ao criar uma conta ou utilizar os serviços, você declara que leu e concorda com este documento e com a Política de Privacidade.',
      effective: 'Versão sunbeat-terms-2026-08-07 · vigente desde 8 de agosto de 2026',
      sections: [
        { title: '1. Quem presta o serviço', paragraphs: [`A Sunbeat é operada por ${COMPANY}, inscrita no CNPJ sob nº ${CNPJ}, com sede em Recife, Pernambuco, Brasil. Contato: ${CONTACT}.`] },
        { title: '2. O serviço', paragraphs: ['A Sunbeat oferece infraestrutura para operações criativas, incluindo formulários inteligentes, coleta e validação de dados e arquivos, organização de workflows, auditoria operacional, integrações e recursos de configuração assistida.', 'Funcionalidades, limites, integrações e níveis de suporte variam conforme o plano contratado. Recursos identificados como beta, acesso antecipado ou prévia podem ser alterados e não devem ser tratados como compromisso de disponibilidade futura.'] },
        { title: '3. Conta e acesso', items: ['Você deve fornecer informações verdadeiras e manter seus dados atualizados.', 'Magic links, senhas e sessões são pessoais. Você é responsável por proteger sua caixa de e-mail e comunicar acessos indevidos.', 'O proprietário do workspace é responsável por autorizar os membros da equipe e por ter poderes para inserir dados, conteúdos e arquivos de terceiros.', 'Você deve ter pelo menos 18 anos e capacidade legal para contratar.'] },
        { title: '4. Uso permitido', paragraphs: ['Você pode usar a Sunbeat para fins profissionais e empresariais lícitos relacionados à sua operação.'], items: ['Não viole direitos autorais, de personalidade, privacidade ou outros direitos de terceiros.', 'Não envie malware, tente contornar controles de acesso, teste vulnerabilidades sem autorização ou prejudique a disponibilidade do serviço.', 'Não use a plataforma para fraude, spam, discriminação, atividade ilegal ou conteúdo cuja posse ou tratamento não esteja autorizado.', 'Não revenda, copie ou explore a plataforma fora do que for expressamente contratado.'] },
        { title: '5. Conteúdo e dados do cliente', paragraphs: ['Você mantém a titularidade sobre os conteúdos enviados. Concede à Sunbeat uma licença limitada, não exclusiva e pelo período necessário para hospedar, processar, validar, transformar e encaminhar esses conteúdos conforme suas instruções e a operação do serviço.', 'Você declara possuir as autorizações necessárias para tratar e compartilhar dados pessoais, áudio, imagem, obras, fonogramas, marcas, contratos e demais materiais inseridos no workspace.'] },
        { title: '6. MotoSchema, prévias e integrações', paragraphs: ['Sugestões do MotoSchema e configurações assistidas são apoio operacional e podem exigir revisão humana. Quando a interface apresentar uma prévia assinada, nenhuma alteração abrangida por ela será aplicada antes da confirmação indicada.', 'Serviços externos, como Supabase, Fly.io, Resend, Airtable e Google Drive, possuem termos próprios. A disponibilidade dessas integrações também depende dos respectivos fornecedores e das permissões concedidas pelo cliente.'] },
        { title: '7. Planos, cobrança e retenção do Free', paragraphs: ['Preços, franquias e condições comerciais exibidos na contratação aplicam-se ao plano selecionado. Cobranças recorrentes, quando habilitadas, devem ser autorizadas antes da ativação.', 'No plano Free, os arquivos enviados ficam disponíveis por 60 dias contados do upload. Depois desse prazo, podem ser excluídos de forma permanente, preservando-se metadados e registros de auditoria necessários à segurança, à rastreabilidade e ao cumprimento de obrigações. Faça cópias próprias antes da expiração.'] },
        { title: '8. Disponibilidade e suporte', paragraphs: ['A Sunbeat adota medidas razoáveis para manter o serviço seguro e disponível, mas não garante operação ininterrupta ou livre de erros. Manutenções, incidentes, limitações de fornecedores e eventos fora do controle razoável podem causar indisponibilidade.', 'Compromissos específicos de nível de serviço somente existem quando formalizados em contrato ou SLA separado.'] },
        { title: '9. Suspensão e encerramento', paragraphs: ['A Sunbeat pode limitar ou suspender acesso diante de risco de segurança, inadimplência, uso ilegal ou violação destes Termos, adotando medidas proporcionais e, quando possível, comunicando o responsável.', 'Você pode solicitar o encerramento pelo canal de contato. Dados e conteúdos serão tratados conforme a Política de Privacidade, obrigações legais, instruções contratuais e rotinas técnicas aplicáveis.'] },
        { title: '10. Propriedade intelectual', paragraphs: ['A plataforma, o software, as marcas, a identidade visual, a documentação e os componentes da Sunbeat pertencem à operadora ou a seus licenciantes. Estes Termos não transferem esses direitos ao usuário.'] },
        { title: '11. Responsabilidade', paragraphs: ['Cada parte responde pelos danos diretos que comprovadamente causar, na medida prevista pela legislação aplicável. A Sunbeat não responde por decisões tomadas exclusivamente com base em sugestões automatizadas, por conteúdo inserido sem autorização, por falhas de serviços de terceiros ou por perdas decorrentes do descumprimento das orientações de segurança e backup do cliente.', 'Nada nestes Termos exclui direitos ou responsabilidades que não possam ser limitados por lei.'] },
        { title: '12. Alterações, lei e foro', paragraphs: ['Podemos atualizar estes Termos para refletir mudanças legais, técnicas ou comerciais. Alterações relevantes serão informadas por meio adequado e uma nova aceitação será solicitada quando necessária.', 'Aplicam-se as leis brasileiras. Fica eleito o foro de Recife–PE, salvo quando a legislação determinar outro foro ou assegurar ao usuário escolha diferente.'] },
      ],
    },
    privacy: {
      eyebrow: 'Sunbeat · documento legal',
      title: 'Política de Privacidade',
      intro: 'Esta Política explica como a Sunbeat trata dados pessoais nos sites, formulários, cadastros, portais, comunicações e integrações da plataforma.',
      effective: 'Versão sunbeat-privacy-2026-08-07 · vigente desde 8 de agosto de 2026',
      sections: [
        { title: '1. Controlador e contato', paragraphs: [`O controlador dos dados pessoais tratados para operar a Sunbeat é ${COMPANY}, CNPJ ${CNPJ}, Recife–PE, Brasil. Para dúvidas, solicitações ou exercício de direitos relacionados à LGPD, escreva para ${CONTACT}.`] },
        { title: '2. Dados que tratamos', items: ['Cadastro e contato: nome, e-mail, empresa, operação, plano de interesse e comunicações.', 'Conta e segurança: identificadores de usuário e workspace, aceites, tokens protegidos por hash, expiração e uso de magic links, sessões, endereço IP transformado em identificador protegido, logs e identificadores de requisição.', 'Operação criativa: informações de projetos, pessoas, empresas, direitos, obras, fonogramas, faixas, créditos, documentos e demais campos configurados pelo workspace.', 'Arquivos e metadados: áudio, capas, documentos, nomes, tipos, tamanhos, checksums, resultados de validação e histórico de retenção.', 'Uso técnico: navegador, dispositivo, origem, páginas e ações necessárias para segurança, diagnóstico e funcionamento.', 'Dados recebidos de integrações autorizadas pelo workspace, como Airtable e Google Drive.'] },
        { title: '3. Finalidades e bases legais', items: ['Executar o contrato e procedimentos solicitados antes da contratação: criar e operar conta, workspace, formulários, submissões, integrações e suporte.', 'Cumprir obrigações legais ou regulatórias e exercer direitos em processos.', 'Atender interesses legítimos, com avaliação de necessidade e impacto: proteger a plataforma, prevenir abuso e fraude, registrar auditoria, diagnosticar falhas e melhorar o serviço.', 'Tratar consentimento quando essa for a base adequada, inclusive comunicações opcionais; o consentimento pode ser revogado sem afetar tratamentos anteriores legítimos.', 'Proteger a vida ou a integridade física e atender outras hipóteses permitidas pela LGPD quando aplicáveis.'] },
        { title: '4. Papéis nas operações dos clientes', paragraphs: ['A Sunbeat atua como controladora dos dados de cadastro, segurança, relacionamento e administração da plataforma. Para dados pessoais inseridos pelo cliente em formulários e workflows próprios, o cliente normalmente define finalidades e meios essenciais e pode atuar como controlador, enquanto a Sunbeat atua como operadora segundo suas instruções. O papel exato depende da operação e do contrato.'] },
        { title: '5. Compartilhamento e fornecedores', paragraphs: ['Compartilhamos somente o necessário para operar o serviço, cumprir instruções do workspace, proteger direitos ou atender obrigação legal. Os principais fornecedores e categorias são:'], items: ['Supabase: banco de dados, autenticação e armazenamento.', 'Fly.io: hospedagem e execução da aplicação.', 'Resend e provedores de e-mail: entrega de magic links e mensagens operacionais.', 'Airtable e Google Drive: integrações ativadas para determinados workflows.', 'Prestadores profissionais e autoridades, quando necessários e permitidos por lei.'], },
        { title: '6. Transferências internacionais', paragraphs: ['Alguns fornecedores podem armazenar ou acessar dados fora do Brasil. Nesses casos, buscamos usar fornecedores com medidas contratuais e de segurança adequadas e realizar a transferência conforme as hipóteses e mecanismos previstos na LGPD e na regulamentação da ANPD.'] },
        { title: '7. Retenção e exclusão', paragraphs: ['Mantemos dados pelo tempo necessário às finalidades informadas, à execução do contrato, à segurança, à auditoria e ao cumprimento ou exercício de obrigações e direitos. O período pode variar conforme o tipo de registro e as instruções do workspace.', 'No plano Free, os arquivos enviados expiram após 60 dias. Metadados técnicos e trilhas de auditoria podem ser preservados após a exclusão do arquivo para comprovação, segurança e rastreabilidade. Magic links e sessões deixam de conceder acesso quando expiram ou são revogados; registros mínimos de segurança podem permanecer enquanto necessários para prevenção de abuso e auditoria.', 'Leads e solicitações comerciais são mantidos durante o atendimento e eventual relacionamento, ou até pedido de eliminação quando não houver outra base legal. Dados de submissões e workflows seguem o contrato e as instruções do respectivo controlador. Backups podem conservar cópias por um período técnico limitado até sua rotação segura.'] },
        { title: '8. Seus direitos', paragraphs: ['Nos termos da LGPD, você pode solicitar confirmação do tratamento, acesso, correção, anonimização, bloqueio ou eliminação quando cabível, portabilidade conforme regulamentação, informação sobre compartilhamentos, revisão de decisões automatizadas aplicáveis, informação sobre consentimento e sua revogação.', `Envie a solicitação para ${CONTACT}. Podemos pedir informações proporcionais para confirmar sua identidade e proteger os dados. Se a Sunbeat atuar como operadora de um cliente, encaminharemos ou apoiaremos a solicitação junto ao controlador responsável.`] },
        { title: '9. Segurança', paragraphs: ['Aplicamos controles técnicos e administrativos proporcionais ao risco, incluindo segregação entre workspaces, restrição de acesso, tokens com expiração, registros de auditoria, validação, rate limiting e proteção de segredos. Nenhum sistema é absolutamente seguro; incidentes serão avaliados e comunicados conforme a legislação aplicável.'] },
        { title: '10. Crianças e adolescentes', paragraphs: ['A Sunbeat é direcionada a profissionais e empresas e não foi projetada para cadastro direto de menores de 18 anos. Se uma operação precisar tratar dados de crianças ou adolescentes, o cliente responsável deve observar as exigências legais específicas e alinhar previamente essa necessidade com a Sunbeat.'] },
        { title: '11. Atualizações', paragraphs: ['Podemos atualizar esta Política para refletir mudanças legais, técnicas ou operacionais. A data e a versão serão atualizadas nesta página, e alterações relevantes serão comunicadas por meio adequado.'] },
      ],
    },
  },
  en: {
    terms: {
      eyebrow: 'Sunbeat · legal document',
      title: 'Terms of Use',
      intro: 'These Terms govern access to and use of the Sunbeat platform. By creating an account or using the services, you confirm that you have read and agree to this document and the Privacy Policy.',
      effective: 'Version sunbeat-terms-2026-08-07 · effective August 8, 2026',
      sections: [
        { title: '1. Service provider', paragraphs: [`Sunbeat is operated by ${COMPANY}, Brazilian company registration CNPJ ${CNPJ}, based in Recife, Pernambuco, Brazil. Contact: ${CONTACT}.`] },
        { title: '2. The service', paragraphs: ['Sunbeat provides infrastructure for creative operations, including intelligent forms, data and file collection and validation, workflow organization, operational auditing, integrations, and assisted configuration.', 'Features, limits, integrations, and support levels vary by plan. Beta, early-access, or preview features may change and are not a commitment of future availability.'] },
        { title: '3. Accounts and access', items: ['Provide accurate information and keep it current.', 'Magic links, passwords, and sessions are personal. Protect your mailbox and report unauthorized access.', 'The workspace owner is responsible for authorizing team members and for having authority to submit third-party data, content, and files.', 'You must be at least 18 and legally able to enter into a contract.'] },
        { title: '4. Acceptable use', items: ['Do not infringe copyright, privacy, personality, or other third-party rights.', 'Do not upload malware, bypass access controls, test vulnerabilities without authorization, or impair the service.', 'Do not use Sunbeat for fraud, spam, discrimination, unlawful activity, or unauthorized content.', 'Do not resell, copy, or exploit the platform beyond your express contractual rights.'] },
        { title: '5. Customer content and data', paragraphs: ['You retain ownership of submitted content and grant Sunbeat a limited, non-exclusive license for the time needed to host, process, validate, transform, and route it according to your instructions and the service operation.', 'You confirm that you hold all necessary permissions for personal data, audio, images, works, recordings, trademarks, contracts, and other materials submitted to the workspace.'] },
        { title: '6. MotoSchema, previews, and integrations', paragraphs: ['MotoSchema suggestions and assisted configurations are operational support and may require human review. When a signed preview is shown, the changes covered by it will not be applied before the indicated confirmation.', 'External services such as Supabase, Fly.io, Resend, Airtable, and Google Drive have their own terms. Integration availability also depends on those providers and customer-granted permissions.'] },
        { title: '7. Plans, billing, and Free retention', paragraphs: ['Prices, allowances, and commercial terms shown at checkout apply to the selected plan. Recurring charges, when enabled, must be authorized before activation.', 'On Free, uploaded assets remain available for 60 days from upload. They may then be permanently deleted while metadata and audit records required for security, traceability, and compliance are preserved. Keep your own copies before expiration.'] },
        { title: '8. Availability and support', paragraphs: ['Sunbeat takes reasonable steps to keep the service secure and available but does not guarantee uninterrupted or error-free operation. Maintenance, incidents, provider limitations, and events beyond reasonable control may cause downtime.', 'Specific service levels apply only when set out in a separate contract or SLA.'] },
        { title: '9. Suspension and termination', paragraphs: ['Sunbeat may limit or suspend access for security risk, non-payment, unlawful use, or breach of these Terms, using proportionate measures and notice when reasonably possible.', 'You may request closure through the contact channel. Data and content will be handled under the Privacy Policy, legal duties, contractual instructions, and applicable technical routines.'] },
        { title: '10. Intellectual property', paragraphs: ['The platform, software, trademarks, visual identity, documentation, and Sunbeat components belong to the operator or its licensors. These Terms do not transfer those rights.'] },
        { title: '11. Liability', paragraphs: ['Each party is responsible for direct damage it demonstrably causes to the extent provided by applicable law. Sunbeat is not responsible for decisions based solely on automated suggestions, unauthorized customer content, third-party service failures, or losses caused by failure to follow customer security and backup guidance.', 'Nothing in these Terms excludes rights or liabilities that cannot lawfully be limited.'] },
        { title: '12. Changes, law, and venue', paragraphs: ['We may update these Terms for legal, technical, or commercial changes. Material changes will be communicated appropriately, and renewed acceptance will be requested when required.', 'Brazilian law applies. Courts in Recife, Pernambuco have jurisdiction unless mandatory law requires another venue or grants the user a different choice.'] },
      ],
    },
    privacy: {
      eyebrow: 'Sunbeat · legal document',
      title: 'Privacy Policy',
      intro: 'This Policy explains how Sunbeat processes personal data across its websites, forms, registration, portals, communications, and platform integrations.',
      effective: 'Version sunbeat-privacy-2026-08-07 · effective August 8, 2026',
      sections: [
        { title: '1. Controller and contact', paragraphs: [`The controller for personal data used to operate Sunbeat is ${COMPANY}, CNPJ ${CNPJ}, Recife, Pernambuco, Brazil. For privacy questions, requests, or Brazilian LGPD rights, email ${CONTACT}.`] },
        { title: '2. Data we process', items: ['Registration and contact data: name, email, company, operation, plan interest, and communications.', 'Account and security data: user and workspace identifiers, acceptance records, hashed tokens, magic-link expiry and use, sessions, IP-derived protected identifiers, logs, and request IDs.', 'Creative-operation data: project, person, company, rights, work, recording, track, credit, document, and other workspace-configured information.', 'Files and metadata: audio, artwork, documents, names, types, sizes, checksums, validation results, and retention history.', 'Technical usage data: browser, device, origin, pages, and actions needed for security, diagnostics, and operation.', 'Data received from workspace-authorized integrations such as Airtable and Google Drive.'] },
        { title: '3. Purposes and legal grounds', items: ['Perform a contract and requested pre-contract steps: create and operate accounts, workspaces, forms, submissions, integrations, and support.', 'Meet legal or regulatory duties and exercise rights in proceedings.', 'Pursue legitimate interests subject to necessity and impact review: protect the platform, prevent abuse and fraud, keep audit records, diagnose failures, and improve the service.', 'Use consent when appropriate, including optional communications; consent may be withdrawn without affecting earlier lawful processing.', 'Protect life or physical safety and rely on other LGPD grounds where applicable.'] },
        { title: '4. Roles in customer operations', paragraphs: ['Sunbeat is a controller for platform registration, security, relationship, and administration data. For personal data customers submit to their own forms and workflows, the customer normally determines the essential purposes and means as controller, while Sunbeat acts as processor under its instructions. The exact role depends on the operation and contract.'] },
        { title: '5. Sharing and providers', paragraphs: ['We share only what is needed to operate the service, follow workspace instructions, protect rights, or meet legal duties. Main provider categories include:'], items: ['Supabase for database, authentication, and storage.', 'Fly.io for application hosting and execution.', 'Resend and email providers for magic links and operational messages.', 'Airtable and Google Drive for integrations activated in selected workflows.', 'Professional advisers and authorities when necessary and legally permitted.'] },
        { title: '6. International transfers', paragraphs: ['Some providers may store or access data outside Brazil. We seek providers with suitable contractual and security measures and transfer data under the grounds and mechanisms permitted by the LGPD and ANPD regulations.'] },
        { title: '7. Retention and deletion', paragraphs: ['We retain data for as long as needed for the stated purposes, contract performance, security, auditing, and compliance or legal claims. Duration varies by record type and workspace instructions.', 'Free-plan assets expire after 60 days. Technical metadata and audit trails may remain after file deletion for evidence, security, and traceability. Magic links and sessions stop granting access when expired or revoked; minimum security records may remain while needed for abuse prevention and auditing.', 'Commercial leads are kept while a request and any resulting relationship are handled, or until a valid deletion request when no other legal ground applies. Submission and workflow data follow the relevant controller’s contract and instructions. Backups may retain copies for a limited technical period until secure rotation.'] },
        { title: '8. Your rights', paragraphs: ['Under the LGPD, you may request confirmation, access, correction, anonymization, blocking or deletion where applicable, portability subject to regulation, sharing information, review of applicable automated decisions, consent information, and withdrawal.', `Send requests to ${CONTACT}. We may request proportionate information to verify identity and protect data. If Sunbeat acts as a processor, we will route or support the request with the responsible controller.`] },
        { title: '9. Security', paragraphs: ['We apply risk-appropriate technical and administrative controls, including workspace segregation, access restrictions, expiring tokens, audit records, validation, rate limiting, and secret protection. No system is completely secure; incidents will be assessed and communicated as required by applicable law.'] },
        { title: '10. Children and teenagers', paragraphs: ['Sunbeat is intended for professionals and organizations and is not designed for direct registration by anyone under 18. If an operation needs to process children’s or teenagers’ data, the responsible customer must meet specific legal duties and discuss the requirement with Sunbeat in advance.'] },
        { title: '11. Updates', paragraphs: ['We may update this Policy for legal, technical, or operational changes. The date and version will be updated here, and material changes will be communicated appropriately.'] },
      ],
    },
  },
}

export default function LegalPage({ kind }: { kind: LegalKind }) {
  const locale = resolveConceptLocale()
  const copy = LEGAL_COPY[locale][kind]
  const pt = locale === 'pt-BR'

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = `${copy.title} | Sunbeat`
  }, [copy.title, locale])

  return (
    <main className="min-h-screen bg-[#000e14] px-5 py-10 text-[#f5f0e5] sm:px-8 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" aria-label="Sunbeat home">
            <img src="/brand/logo-horizontal.svg" alt="Sunbeat" className="h-9 w-auto" />
          </Link>
          <nav aria-label={pt ? 'Documentos legais' : 'Legal documents'} className="flex flex-wrap gap-2 text-xs font-bold">
            <Link to="/terms" className={`rounded-full border px-4 py-2 ${kind === 'terms' ? 'border-[#ffb53e] text-[#ffcf72]' : 'border-white/15 text-white/55 hover:text-white'}`}>{pt ? 'Termos' : 'Terms'}</Link>
            <Link to="/privacy" className={`rounded-full border px-4 py-2 ${kind === 'privacy' ? 'border-[#ffb53e] text-[#ffcf72]' : 'border-white/15 text-white/55 hover:text-white'}`}>{pt ? 'Privacidade' : 'Privacy'}</Link>
          </nav>
        </header>

        <article className="py-10 sm:py-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb53e]">{copy.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{copy.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/65">{copy.intro}</p>
          <p className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/45">{copy.effective}</p>

          <div className="mt-12 space-y-10">
            {copy.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-bold text-[#ffcf72]">{section.title}</h2>
                {section.paragraphs?.map((paragraph) => <p key={paragraph} className="mt-4 text-sm leading-7 text-white/65">{paragraph}</p>)}
                {section.items ? <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-white/65">{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
              </section>
            ))}
          </div>
        </article>

        <footer className="flex flex-col gap-3 border-t border-white/10 py-8 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Sunbeat · Recife–PE, Brasil</p>
          <a href={`mailto:${CONTACT}`} className="hover:text-[#ffcf72]">{CONTACT}</a>
        </footer>
      </div>
    </main>
  )
}
