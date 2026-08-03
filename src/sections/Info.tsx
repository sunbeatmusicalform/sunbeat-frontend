// Área informativa — leitura direta, sem cliques, sem formulários.
export function IntelligentForms() {
  return (
    <>
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

      <section className="border-y border-white/10 bg-white/[0.025] px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <p className="story-kicker text-center">Music intake</p>
          <h2 className="mt-4 text-center font-display text-3xl leading-tight md:text-4xl">
            Built for the way music releases move.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-center leading-relaxed text-white/55">
            From the first artist match to delivery-ready assets, Sunbeat helps teams collect
            cleaner data and catch technical issues before they reach distribution.
          </p>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                number: '01',
                title: 'Contact lookup',
                description:
                  'Search the client’s people and artist registry, confirm the right match, and prevent duplicate records before submission.',
                details: ['Existing records', 'Match confirmation', 'Duplicate prevention'],
              },
              {
                number: '02',
                title: 'WAV validation',
                description:
                  'Upload a master and verify format, duration, sample rate, bit depth and channels — with clear approval or action-needed feedback.',
                details: ['Format', 'Duration', 'Sample rate', 'Bit depth', 'Channels'],
              },
              {
                number: '03',
                title: 'Artwork validation',
                description:
                  'Check cover dimensions, file format, size and technical compatibility before the release moves forward.',
                details: ['Dimensions', 'File format', 'File size', 'Compatibility'],
              },
            ].map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-white/10 bg-[#061a24] p-6">
                <p className="font-display text-4xl text-[#fbbb1e]/30">{feature.number}</p>
                <h3 className="mt-3 font-display text-xl">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{feature.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {feature.details.map((detail) => (
                    <span
                      key={detail}
                      className="rounded-full border border-[#fbbb1e]/30 px-2.5 py-1 text-[10px] font-bold text-white/70"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <p className="mt-10 text-center text-sm font-medium text-white/45">
            Find the right people → validate delivery assets → submit structured release data.
          </p>
        </div>
      </section>
    </>
  )
}

const STEPS = [
  {
    num: '01',
    title: 'Describe what you need',
    desc: 'Start with an AI conversation. Add documents, images or spreadsheets — Sunbeat translates your operation into fields, rules and validations.',
    highlights: ['Audio and artwork analysis', 'Metadata extraction', 'Automatic validation'],
  },
  {
    num: '02',
    title: 'Watch your form take shape',
    desc: 'Get an instant preview with your brand, colors, copy and workflow. Review it, refine it and approve it.',
    highlights: ['Custom branding', 'Instant preview', 'Conversational updates'],
  },
  {
    num: '03',
    title: 'Connect and operate',
    desc: 'Connect Airtable, Google Drive, email and the tools you already use. Publish the form and keep every submission organized.',
    highlights: ['Airtable and Drive sync', 'Operational emails', 'Continuous drafts and editing'],
  },
]

export function Showcase() {
  return (
    <section className="border-y border-white/10 bg-white/[0.03]">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <p className="story-kicker text-center">How it works</p>
        <h2 className="mt-4 text-center font-display text-3xl md:text-4xl">
          Your form, built around your operation.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center leading-relaxed text-white/55">
          No generic templates. Each form starts with a conversation about how your work actually happens.
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
          One platform can support release intake, rights clearance, people registration
          and company onboarding — all powered by the same operational engine.
        </p>
      </div>
    </section>
  )
}
