import type { ConceptLocale } from '@/concept/copy'
import { ArrowRight, Check, Database, FileSpreadsheet, Sparkles } from 'lucide-react'

const INFO_COPY = {
  en: {
    productKicker: 'The product',
    productTitle: 'Intelligent forms, for an intelligent era.',
    productParagraphs: [
      <>AI is everywhere. Configuration should not be. Sunbeat forms are generated from a simple conversation. MotorSchema assembles fields, validation, branding and integrations for your review.</>,
      <>They support continuous operations, not one-off submissions. <span className="text-white/90">Draft mode</span> saves every keystroke and resumes by link. <span className="text-white/90">Edit mode</span> lets teams correct what was already sent. Every entry arrives structured in Airtable, Google Drive, email or your chosen stack.</>,
      <>Audio is analyzed. Artwork is measured. Metadata is checked before it costs you. People fill in less; the form does the rest.</>,
    ],
    audience: 'Startups · Agencies · Music operations',
    musicKicker: 'Music intake',
    musicTitle: 'Built for the way music releases move.',
    musicBody: 'From the first artist match to delivery-ready assets, Sunbeat helps teams collect cleaner data and catch technical issues before they reach distribution.',
    musicFeatures: [
      { number: '01', title: 'Contact lookup', description: 'Search the client’s people and artist registry, confirm the right match, and prevent duplicate records before submission.', details: ['Existing records', 'Match confirmation', 'Duplicate prevention'] },
      { number: '02', title: 'WAV validation', description: 'Upload a master and verify format, duration, sample rate, bit depth and channels. The result shows what is approved and what needs attention.', details: ['Format', 'Duration', 'Sample rate', 'Bit depth', 'Channels'] },
      { number: '03', title: 'Artwork validation', description: 'Check cover dimensions, file format, size and technical compatibility before the release moves forward.', details: ['Dimensions', 'File format', 'File size', 'Compatibility'] },
    ],
    musicFlow: 'Find the right people → validate delivery assets → submit structured release data.',
    demoKicker: 'See the operation move',
    demoTitle: 'From scattered spreadsheets to a living workflow.',
    demoBody: 'Bring in the structure your team already has. Sunbeat maps each column, validates the data and prepares a clean destination for the next step.',
    demoSource: 'Source data',
    demoSourceName: 'Google Sheets · Releases 2026',
    demoRows: [['Midnight Sun', 'Audio ready', 'Credits missing'], ['Open Water', 'Artwork review', 'Ready to map'], ['New Signals', 'Metadata ready', 'Approved']],
    demoMap: 'MotorSchema mapping',
    demoMapTitle: 'Spreadsheet columns become operational fields.',
    demoMapBody: '18 columns recognized. 4 rules suggested. Human approval required before publishing.',
    demoMappings: ['Artist → contact', 'Status → workflow', 'Files → audit'],
    demoDestinationsLabel: 'Destinations',
    demoDestinations: [
      { name: 'Airtable', status: 'Available now' },
      { name: 'Google Sheets', status: 'Next connector' },
      { name: 'Notion', status: 'Under evaluation' },
    ],
    demoNote: 'Conceptual integration preview. Availability depends on the connector, plan and customer authorization.',
    howKicker: 'How it works',
    howTitle: 'Your form, built around your operation.',
    howBody: 'No generic templates. Each form starts with a conversation about how your work actually happens.',
    steps: [
      { num: '01', title: 'Describe what you need', desc: 'Start with an AI conversation. Add documents, images or spreadsheets. Sunbeat translates your operation into fields, rules and validations.', highlights: ['Audio and artwork analysis', 'Metadata extraction', 'Automatic validation'] },
      { num: '02', title: 'Watch your form take shape', desc: 'Get an instant preview with your brand, colors, copy and workflow. Review it, refine it and approve it.', highlights: ['Custom branding', 'Instant preview', 'Conversational updates'] },
      { num: '03', title: 'Connect and operate', desc: 'Connect Airtable, Google Drive, email and the tools you already use. Publish the form and keep every submission organized.', highlights: ['Airtable and Drive sync', 'Operational emails', 'Continuous drafts and editing'] },
    ],
    platformNote: 'One platform can support release intake, rights clearance, people registration and company onboarding. Every workflow runs on the same operational engine.',
  },
  'pt-BR': {
    productKicker: 'O produto',
    productTitle: 'Formulários inteligentes para uma nova era.',
    productParagraphs: [
      <>A IA está em todo lugar. A configuração não deveria estar. Os formulários Sunbeat nascem de uma conversa simples. O MotorSchema organiza campos, validações, identidade visual e integrações para sua revisão.</>,
      <>Eles sustentam operações contínuas, não envios isolados. O <span className="text-white/90">modo rascunho</span> salva o progresso e permite continuar por link. O <span className="text-white/90">modo edição</span> permite corrigir o que já foi enviado. Cada entrada chega estruturada no Airtable, Google Drive, e-mail ou na stack escolhida.</>,
      <>O áudio é analisado. A capa é medida. Os metadados são verificados antes de virarem um problema. As pessoas preenchem menos; o formulário faz o restante.</>,
    ],
    audience: 'Startups · Agências · Operações musicais',
    musicKicker: 'Intake musical',
    musicTitle: 'Construída para o movimento dos lançamentos musicais.',
    musicBody: 'Da identificação inicial do artista aos assets prontos para distribuição, a Sunbeat ajuda equipes a coletar dados melhores e encontrar problemas técnicos antes da entrega.',
    musicFeatures: [
      { number: '01', title: 'Busca de contatos', description: 'Consulte os cadastros de pessoas e artistas, confirme a correspondência correta e evite registros duplicados antes do envio.', details: ['Cadastros existentes', 'Confirmação', 'Prevenção de duplicados'] },
      { number: '02', title: 'Validação de WAV', description: 'Envie o master e verifique formato, duração, sample rate, bit depth e canais. O resultado mostra o que foi aprovado e o que precisa de atenção.', details: ['Formato', 'Duração', 'Sample rate', 'Bit depth', 'Canais'] },
      { number: '03', title: 'Validação de capa', description: 'Confira dimensões, formato, tamanho e compatibilidade técnica da capa antes que o lançamento avance.', details: ['Dimensões', 'Formato', 'Tamanho', 'Compatibilidade'] },
    ],
    musicFlow: 'Encontre as pessoas certas → valide os assets → envie os dados estruturados.',
    demoKicker: 'Veja a operação avançar',
    demoTitle: 'De planilhas dispersas para um fluxo vivo.',
    demoBody: 'Traga a estrutura que sua equipe já possui. A Sunbeat mapeia cada coluna, valida os dados e prepara um destino organizado para a próxima etapa.',
    demoSource: 'Dados de origem',
    demoSourceName: 'Google Sheets · Lançamentos 2026',
    demoRows: [['Sol da Meia-noite', 'Áudio pronto', 'Créditos pendentes'], ['Mar Aberto', 'Revisão de capa', 'Pronto para mapear'], ['Novos Sinais', 'Metadados prontos', 'Aprovado']],
    demoMap: 'Mapeamento do MotorSchema',
    demoMapTitle: 'As colunas da planilha se transformam em campos operacionais.',
    demoMapBody: '18 colunas reconhecidas. 4 regras sugeridas. Aprovação humana necessária antes da publicação.',
    demoMappings: ['Artista → contato', 'Status → workflow', 'Arquivos → auditoria'],
    demoDestinationsLabel: 'Destinos',
    demoDestinations: [
      { name: 'Airtable', status: 'Disponível agora' },
      { name: 'Google Sheets', status: 'Próximo conector' },
      { name: 'Notion', status: 'Em avaliação' },
    ],
    demoNote: 'Prévia conceitual de integração. A disponibilidade depende do conector, do plano e da autorização do cliente.',
    howKicker: 'Como funciona',
    howTitle: 'Seu formulário, construído ao redor da sua operação.',
    howBody: 'Nada de templates genéricos. Cada formulário começa com uma conversa sobre como o seu trabalho realmente acontece.',
    steps: [
      { num: '01', title: 'Descreva o que você precisa', desc: 'Comece por uma conversa com IA. Adicione documentos, imagens ou planilhas. A Sunbeat traduz sua operação em campos, regras e validações.', highlights: ['Análise de áudio e capa', 'Extração de metadados', 'Validação automática'] },
      { num: '02', title: 'Veja o formulário tomar forma', desc: 'Receba um preview com sua marca, cores, textos e fluxo. Revise, refine e aprove antes de publicar.', highlights: ['Identidade personalizada', 'Preview instantâneo', 'Atualizações por conversa'] },
      { num: '03', title: 'Conecte e opere', desc: 'Conecte Airtable, Google Drive, e-mail e as ferramentas que sua equipe já utiliza. Publique e mantenha cada submissão organizada.', highlights: ['Sincronização com Airtable e Drive', 'E-mails operacionais', 'Rascunhos e edição contínua'] },
    ],
    platformNote: 'Uma única plataforma pode atender intake de lançamentos, liberação de direitos, cadastro de pessoas e onboarding de empresas. Todos os fluxos usam o mesmo motor operacional.',
  },
} as const

export function IntelligentForms({ locale = 'en' }: { locale?: ConceptLocale }) {
  const copy = INFO_COPY[locale]
  return (
    <>
      <section className="mx-auto max-w-3xl px-6 py-24 md:py-32">
        <p className="story-kicker text-center">{copy.productKicker}</p>
        <h2 className="mt-4 text-center font-display text-3xl leading-tight md:text-4xl">{copy.productTitle}</h2>
        <div className="mt-14 space-y-10 text-base leading-relaxed text-white/65 md:text-lg">
          {copy.productParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
        <p className="mt-14 text-center text-sm font-semibold uppercase tracking-[0.3em] text-white/40">{copy.audience}</p>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <p className="story-kicker text-center">{copy.musicKicker}</p>
          <h2 className="mt-4 text-center font-display text-3xl leading-tight md:text-4xl">{copy.musicTitle}</h2>
          <p className="mx-auto mt-5 max-w-3xl text-center leading-relaxed text-white/55">{copy.musicBody}</p>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {copy.musicFeatures.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-white/10 bg-[#061a24] p-6">
                <p className="font-display text-4xl text-[#fbbb1e]/30">{feature.number}</p>
                <h3 className="mt-3 font-display text-xl">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{feature.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {feature.details.map((detail) => <span key={detail} className="rounded-full border border-[#fbbb1e]/30 px-2.5 py-1 text-[10px] font-bold text-white/70">{detail}</span>)}
                </div>
              </article>
            ))}
          </div>
          <p className="mt-10 text-center text-sm font-medium text-white/45">{copy.musicFlow}</p>
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(14,165,233,0.10),transparent_42%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <p className="story-kicker text-center">{copy.demoKicker}</p>
          <h2 className="mx-auto mt-4 max-w-4xl text-center font-display text-3xl leading-tight text-white md:text-5xl">{copy.demoTitle}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-center leading-7 text-white/55">{copy.demoBody}</p>

          <div className="mt-14 grid gap-4 lg:grid-cols-[1.08fr_0.84fr_0.78fr] lg:items-stretch">
            <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#061a24] shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300"><FileSpreadsheet size={18} /></span>
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">{copy.demoSource}</p><p className="mt-1 text-sm font-semibold text-white">{copy.demoSourceName}</p></div>
                </div>
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
              </div>
              <div className="divide-y divide-white/5">
                {copy.demoRows.map((row, index) => (
                  <div key={row[0]} className="grid grid-cols-[28px_1.3fr_1fr] items-center gap-3 px-5 py-4 text-xs">
                    <span className="font-mono text-white/25">{String(index + 2).padStart(2, '0')}</span>
                    <div><p className="font-semibold text-white/85">{row[0]}</p><p className="mt-1 text-white/35">{row[1]}</p></div>
                    <span className={`justify-self-end rounded-full px-2.5 py-1 text-[9px] font-bold ${index === 2 ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-300/10 text-amber-200'}`}>{row[2]}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="flex flex-col rounded-2xl border border-[#fbbb1e]/25 bg-[#fbbb1e]/[0.06] p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-[#fbbb1e] text-[#001018]"><Sparkles size={18} /></span>
              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#fbbb1e]">{copy.demoMap}</p>
              <h3 className="mt-3 font-display text-2xl leading-tight text-white">{copy.demoMapTitle}</h3>
              <p className="mt-4 text-sm leading-6 text-white/55">{copy.demoMapBody}</p>
              <div className="mt-auto pt-7">
                {copy.demoMappings.map((item) => <p key={item} className="mt-2 flex items-center gap-2 text-xs text-white/65"><Check className="size-3.5 text-[#fbbb1e]" />{item}</p>)}
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[#061a24] p-5">
              <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-sky-400/10 text-sky-300"><Database size={18} /></span><p className="text-sm font-semibold text-white">{copy.demoDestinationsLabel}</p></div>
              <div className="mt-5 space-y-3">
                {copy.demoDestinations.map((destination, index) => (
                  <div key={destination.name} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3.5">
                    <span className={`size-2 rounded-full ${index === 0 ? 'bg-emerald-400' : index === 1 ? 'bg-[#fbbb1e]' : 'bg-white/25'}`} />
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-white/85">{destination.name}</p><p className="mt-0.5 text-[10px] text-white/35">{destination.status}</p></div>
                    <ArrowRight className="size-4 text-white/25" />
                  </div>
                ))}
              </div>
            </article>
          </div>
          <p className="mx-auto mt-6 max-w-3xl text-center text-[10px] leading-5 text-white/30">{copy.demoNote}</p>
        </div>
      </section>
    </>
  )
}

export function Showcase({ locale = 'en' }: { locale?: ConceptLocale }) {
  const copy = INFO_COPY[locale]
  return (
    <section className="border-y border-white/10 bg-white/[0.03]">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <p className="story-kicker text-center">{copy.howKicker}</p>
        <h2 className="mt-4 text-center font-display text-3xl md:text-4xl">{copy.howTitle}</h2>
        <p className="mx-auto mt-4 max-w-xl text-center leading-relaxed text-white/55">{copy.howBody}</p>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {copy.steps.map((step) => (
            <article key={step.num} className="rounded-3xl border border-white/10 bg-[#061a24] p-6">
              <p className="font-display text-4xl text-[#fbbb1e]/30">{step.num}</p>
              <h3 className="mt-3 font-display text-xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{step.desc}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {step.highlights.map((highlight) => <span key={highlight} className="rounded-full border border-[#fbbb1e]/30 px-2.5 py-1 text-[10px] font-bold text-white/70">{highlight}</span>)}
              </div>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-12 max-w-2xl text-center text-xs leading-relaxed text-white/40">{copy.platformNote}</p>
      </div>
    </section>
  )
}
