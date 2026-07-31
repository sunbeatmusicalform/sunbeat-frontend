// Área informativa — leitura direta, sem cliques, sem formulários.
export function IntelligentForms() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <p className="story-kicker text-center">The product</p>
      <h2 className="mt-4 text-center font-display text-3xl leading-tight md:text-4xl">
        Intelligent forms, for an intelligent era.
      </h2>

      <div className="mt-14 space-y-10 text-base leading-relaxed text-white/65 md:text-lg">
        <p>
          AI is everywhere. Configuration shouldn't be.
          Sunbeat forms are generated from a simple conversation — fields, validation,
          branding and integrations assembled by our MotorSchema engine, reviewed by you.
        </p>
        <p>
          They support continuous operations, not one-off submissions:
          <span className="text-white/90"> draft mode</span> saves every keystroke and resumes by link,
          <span className="text-white/90"> edit mode</span> lets teams correct what was already sent,
          and every entry lands structured in your internal processes — Airtable, Google Drive, email, your stack.
        </p>
        <p>
          Audio is analyzed. Artwork is measured. Metadata is checked before it costs you.
          People fill in less; the form does the rest.
        </p>
      </div>

      <p className="mt-14 text-center text-sm font-semibold uppercase tracking-[0.3em] text-white/40">
        Startups · Agencies · Music operations
      </p>
    </section>
  )
}

const STEPS = [
  {
    num: '01',
    title: 'Conte o que precisa',
    desc: 'Um chat com IA. Arraste documentos, imagens, planilhas — ela entende sua operação e traduz em campos, regras e validações.',
    highlights: ['Análise de áudio e arte', 'Extração de metadados', 'Validação automática'],
  },
  {
    num: '02',
    title: 'Veja o formulário nascer',
    desc: 'Preview gerado na hora, com a sua marca: logo, cores, textos e fluxo de etapas. Revisa, ajusta, aprova.',
    highlights: ['Branding próprio', 'Preview instantâneo', 'Ajustes por conversa'],
  },
  {
    num: '03',
    title: 'Conecte e opere',
    desc: 'Integrações configuradas — Airtable, Google Drive, e-mail, seu stack. Formulário no ar, submissões organizadas, operação rodando.',
    highlights: ['Airtable & Drive sync', 'E-mails operacionais', 'Rascunho e edição contínuos'],
  },
]

export function Showcase() {
  return (
    <section className="border-y border-white/10 bg-white/[0.03]">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <p className="story-kicker text-center">Como funciona</p>
        <h2 className="mt-4 text-center font-display text-3xl md:text-4xl">
          Seu formulário, do jeito da sua operação.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center leading-relaxed text-white/55">
          Nada de templates genéricos. Cada formulário nasce de uma conversa sobre o que você realmente faz.
        </p>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <article key={s.num} className="rounded-3xl border border-white/10 bg-[#061a24] p-6">
              <p className="font-display text-4xl text-[#fbbb1e]/30">{s.num}</p>
              <h3 className="mt-3 font-display text-xl">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{s.desc}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {s.highlights.map((h) => (
                  <span
                    key={h}
                    className="rounded-full border border-[#fbbb1e]/30 px-2.5 py-1 text-[10px] font-bold text-white/70"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-xs leading-relaxed text-white/40">
          A prova social? Clientes como a Atabaque já operam com formulários de lançamento,
          clearance, cadastro de pessoas e empresas — todos gerados por essa mesma engrenagem.
        </p>
      </div>
    </section>
  )
}
