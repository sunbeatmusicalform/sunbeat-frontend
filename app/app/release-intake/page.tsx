import Link from "next/link";

const formSections = [
  {
    step: "01",
    title: "Release details",
    description:
      "Core metadata such as title, main artist, release type, release date and territory context.",
    status: "Ready for premium form build",
  },
  {
    step: "02",
    title: "Assets and delivery",
    description:
      "Artwork, audio files, version data, content notes and operational assets required by the team.",
    status: "Needs configurable field layer",
  },
  {
    step: "03",
    title: "Credits and metadata",
    description:
      "Writers, producers, publishers, ISRC/UPC handling and completion guidance.",
    status: "AI contextual help recommended",
  },
  {
    step: "04",
    title: "Review and submission",
    description:
      "Validation, final review, success state and downstream routing to operations.",
    status: "Ready for submit architecture",
  },
];

const configurationModules = [
  {
    title: "Helped text per field",
    description:
      "Each field can have instructional copy, examples and validation guidance.",
  },
  {
    title: "Field visibility and order",
    description:
      "Clients can control what appears, when it appears and how the flow is organized.",
  },
  {
    title: "Contextual AI guide",
    description:
      "The assistant responds based on field, step and client rules instead of generic chat.",
  },
  {
    title: "Branding and client experience",
    description:
      "The form can reflect each workspace with its own introduction, tone and messaging.",
  },
];

const exampleFields = [
  {
    field: "Release Title",
    helper:
      "Use the exact commercial title that should appear in DSPs and internal operations.",
    type: "Text",
    required: "Yes",
  },
  {
    field: "Main Artist",
    helper:
      "Enter the primary credited artist name exactly as it should be distributed.",
    type: "Text",
    required: "Yes",
  },
  {
    field: "Release Date",
    helper:
      "Choose the intended go-live date. This can later connect to validation and delivery rules.",
    type: "Date",
    required: "Yes",
  },
  {
    field: "Focus Track",
    helper:
      "Indicate the priority track for campaign and release strategy alignment.",
    type: "Select",
    required: "Optional",
  },
];

export default function ReleaseIntakePage() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="glass-panel-strong premium-border rounded-[32px] p-7 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="sunbeat-badge">
              <span className="sunbeat-dot" />
              Release Intake
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/50">
              Product architecture view
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
            Public submission flow,
            <span className="block text-white/68">built for premium label operations.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-white/62">
            This page should evolve into the client-facing Release Intake experience of
            Sunbeat. It must feel polished, guided and trustworthy for artists, managers,
            labels and distribution teams.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/app/settings/fields" className="sunbeat-button sunbeat-button-primary">
              Configure fields
            </Link>
            <Link
              href="/app/settings/ai-guide"
              className="sunbeat-button sunbeat-button-secondary"
            >
              Configure AI guide
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <MetricCard value="Public" label="client-facing experience" />
            <MetricCard value="Configurable" label="field logic direction" />
            <MetricCard value="Guided" label="help + AI architecture" />
          </div>
        </div>

        <div className="sunbeat-card rounded-[32px] p-7 md:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Vision
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Shine Brighter, Work Smarter.
          </h2>

          <p className="mt-4 text-sm leading-7 text-white/60">
            The slogan fits the product direction perfectly:
          </p>

          <div className="mt-5 grid gap-3">
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">Shine Brighter</div>
              <p className="mt-2 text-sm leading-7 text-white/55">
                The user-facing experience should feel elevated, beautiful and confident.
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">Work Smarter</div>
              <p className="mt-2 text-sm leading-7 text-white/55">
                The internal system should reduce mistakes, back-and-forth and operational
                friction through structure, guidance and configuration.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-yellow-300/20 bg-yellow-300/8 p-4 text-sm leading-7 text-yellow-100/85">
            This intake should not behave like a generic form. It should behave like a
            premium infrastructure layer for music metadata operations.
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="sunbeat-card rounded-[32px] p-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Intake structure
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Recommended multi-step architecture
          </h2>

          <div className="mt-6 grid gap-4">
            {formSections.map((item) => (
              <div
                key={item.step}
                className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-sm font-semibold text-white">
                      {item.step}
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">{item.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/35">
                        {item.status}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-white/58">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="sunbeat-card rounded-[32px] p-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Configurable system
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            What the workspace should control
          </h2>

          <div className="mt-6 grid gap-3">
            {configurationModules.map((item) => (
              <div
                key={item.title}
                className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4"
              >
                <div className="text-sm font-semibold text-white">{item.title}</div>
                <p className="mt-2 text-sm leading-7 text-white/55">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="sunbeat-card rounded-[32px] p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Example form model
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Field architecture preview
              </h2>
            </div>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/50">
              Help-ready
            </span>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10">
            <div className="grid grid-cols-[1.1fr_1.7fr_0.7fr_0.6fr] border-b border-white/10 bg-white/[0.04] px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/42">
              <div>Field</div>
              <div>Helped text</div>
              <div>Type</div>
              <div>Required</div>
            </div>

            {exampleFields.map((item) => (
              <div
                key={item.field}
                className="grid grid-cols-[1.1fr_1.7fr_0.7fr_0.6fr] border-b border-white/10 bg-black/10 px-5 py-5 text-sm last:border-b-0"
              >
                <div className="pr-4 font-medium text-white/92">{item.field}</div>
                <div className="pr-4 leading-7 text-white/55">{item.helper}</div>
                <div className="pr-4 text-white/72">{item.type}</div>
                <div className="text-white/72">{item.required}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            AI assistance
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Contextual guidance by field and step
          </h2>

          <p className="mt-4 text-sm leading-7 text-white/60">
            The AI guide should appear as operational support, not as a loose chatbot.
            It should understand:
          </p>

          <div className="mt-5 grid gap-3">
            {[
              "Current field name and purpose",
              "Allowed values and validation rules",
              "Current step in the intake flow",
              "Client-specific instructions and tone",
              "Examples for labels, artists and managers",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/78"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[24px] border border-blue-400/20 bg-blue-400/10 p-4">
            <div className="text-sm font-semibold text-blue-100">Recommended UX</div>
            <p className="mt-2 text-sm leading-7 text-blue-100/78">
              A right-side assistant panel or inline “Need help?” interaction per field,
              with short, reliable and operational answers.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="glass-panel rounded-[32px] p-7 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Next product move
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Build the real form engine next.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
                This page is now positioned as the premium architectural shell for the
                Release Intake module. The next step is turning it into a real multi-step
                form with configurable fields, helper text, draft persistence and
                contextual AI assistance.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/app/settings/fields"
                className="sunbeat-button sunbeat-button-primary"
              >
                Go to field config
              </Link>
              <Link
                href="/app"
                className="sunbeat-button sunbeat-button-secondary"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-white/55">{label}</div>
    </div>
  );
}