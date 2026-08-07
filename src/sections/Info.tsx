import type { ConceptLocale } from '@/concept/copy'

const INFO_COPY = {
  en: {
    productKicker: 'The product',
    productTitle: 'Intelligent forms, for an intelligent era.',
    productParagraphs: [
      <>AI is everywhere. Configuration should not be. Sunbeat forms are generated from a simple conversation — fields, validation, branding and integrations assembled by our MotorSchema engine, reviewed by you.</>,
      <>They support continuous operations, not one-off submissions: <span className="text-white/90">draft mode</span> saves every keystroke and resumes by link, <span className="text-white/90">edit mode</span> lets teams correct what was already sent, and every entry lands structured in your internal processes — Airtable, Google Drive, email, your stack.</>,
      <>Audio is analyzed. Artwork is measured. Metadata is checked before it costs you. People fill in less; the form does the rest.</>,
    ],
    audience: 'Startups · Agencies · Music operations',
    musicKicker: 'Music intake',
    musicTitle: 'Built for the way music releases move.',
    musicBody: 'From the first artist match to delivery-ready assets, Sunbeat helps teams collect cleaner data and catch technical issues before they reach distribution.',
    musicFeatures: [
      { number: '01', title: 'Contact lookup', description: 'Search the client’s people and artist registry, confirm the right match, and prevent duplicate records before submission.', details: ['Existing records', 'Match confirmation', 'Duplicate prevention'] },
      { number: '02', title: 'WAV validation', description: 'Upload a master and verify format, duration, sample rate, bit depth and channels — with clear approval or action-needed feedback.', details: ['Format', 'Duration', 'Sample rate', 'Bit depth', 'Channels'] },
      { number: '03', title: 'Artwork validation', description: 'Check cover dimensions, file format, size and technical compatibility before the release moves forward.', details: ['Dimensions', 'File format', 'File size', 'Compatibility'] },
    ],
    musicFlow: 'Find the right people → validate delivery assets → submit structured release data.',
    howKicker: 'How it works',
    howTitle: 'Your form, built around your operation.',
    howBody: 'No generic templates. Each form starts with a conversation about how your work actually happens.',
    steps: [
      { num: '01', title: 'Describe what you need', desc: 'Start with an AI conversation. Add documents, images or spreadsheets — Sunbeat translates your operation into fields, rules and validations.', highlights: ['Audio and artwork analysis', 'Metadata extraction', 'Automatic validation'] },
      { num: '02', title: 'Watch your form take shape', desc: 'Get an instant preview with your brand, colors, copy and workflow. Review it, refine it and approve it.', highlights: ['Custom branding', 'Instant preview', 'Conversational updates'] },
      { num: '03', title: 'Connect and operate', desc: 'Connect Airtable, Google Drive, email and the tools you already use. Publish the form and keep every submission organized.', highlights: ['Airtable and Drive sync', 'Operational emails', 'Continuous drafts and editing'] },
    ],
    platformNote: 'One platform can support release intake, rights clearance, people registration and company onboarding — all powered by the same operational engine.',
  },
  'pt-BR': {
    productKicker: 'O produto',
    productTitle: 'Formulários inteligentes para uma nova era.',
    productParagraphs: [
      <>A IA está em todo lugar. A configuração não deveria estar. Os formulários Sunbeat nascem de uma conversa simples — campos, validações, identidade visual e integrações estruturados pelo MotorSchema e revisados por você.</>,
      <>Eles sustentam operações contínuas, não envios isolados: o <span className="text-white/90">modo rascunho</span> salva o progresso e permite continuar por link, o <span className="text-white/90">modo edição</span> permite corrigir o que já foi enviado, e cada entrada chega estruturada aos seus processos — Airtable, Google Drive, e-mail e sua stack.</>,
      <>O áudio é analisado. A capa é medida. Os metadados são verificados antes de virarem um problema. As pessoas preenchem menos; o formulário faz o restante.</>,
    ],
    audience: 'Startups · Agências · Operações musicais',
    musicKicker: 'Intake musical',
    musicTitle: 'Construída para o movimento dos lançamentos musicais.',
    musicBody: 'Da identificação inicial do artista aos assets prontos para distribuição, a Sunbeat ajuda equipes a coletar dados melhores e encontrar problemas técnicos antes da entrega.',
    musicFeatures: [
      { number: '01', title: 'Busca de contatos', description: 'Consulte os cadastros de pessoas e artistas, confirme a correspondência correta e evite registros duplicados antes do envio.', details: ['Cadastros existentes', 'Confirmação', 'Prevenção de duplicados'] },
      { number: '02', title: 'Validação de WAV', description: 'Envie o master e verifique formato, duração, sample rate, bit depth e canais, com um retorno claro de aprovação ou ajuste.', details: ['Formato', 'Duração', 'Sample rate', 'Bit depth', 'Canais'] },
      { number: '03', title: 'Validação de capa', description: 'Confira dimensões, formato, tamanho e compatibilidade técnica da capa antes que o lançamento avance.', details: ['Dimensões', 'Formato', 'Tamanho', 'Compatibilidade'] },
    ],
    musicFlow: 'Encontre as pessoas certas → valide os assets → envie os dados estruturados.',
    howKicker: 'Como funciona',
    howTitle: 'Seu formulário, construído ao redor da sua operação.',
    howBody: 'Nada de templates genéricos. Cada formulário começa com uma conversa sobre como o seu trabalho realmente acontece.',
    steps: [
      { num: '01', title: 'Descreva o que você precisa', desc: 'Comece por uma conversa com IA. Adicione documentos, imagens ou planilhas — a Sunbeat traduz sua operação em campos, regras e validações.', highlights: ['Análise de áudio e capa', 'Extração de metadados', 'Validação automática'] },
      { num: '02', title: 'Veja o formulário tomar forma', desc: 'Receba um preview com sua marca, cores, textos e fluxo. Revise, refine e aprove antes de publicar.', highlights: ['Identidade personalizada', 'Preview instantâneo', 'Atualizações por conversa'] },
      { num: '03', title: 'Conecte e opere', desc: 'Conecte Airtable, Google Drive, e-mail e as ferramentas que sua equipe já utiliza. Publique e mantenha cada submissão organizada.', highlights: ['Sincronização com Airtable e Drive', 'E-mails operacionais', 'Rascunhos e edição contínua'] },
    ],
    platformNote: 'Uma única plataforma pode atender intake de lançamentos, liberação de direitos, cadastro de pessoas e onboarding de empresas — tudo sobre o mesmo motor operacional.',
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
