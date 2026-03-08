import Link from "next/link";

const guidePrinciples = [
  {
    title: "Field-aware responses",
    description:
      "The assistant should know the current field name, its purpose and its allowed values.",
  },
  {
    title: "Step-aware context",
    description:
      "Guidance should change depending on whether the user is in release details, assets, credits or review.",
  },
  {
    title: "Workspace-specific rules",
    description:
      "Each client may want different instructions, examples, terminology and operational constraints.",
  },
  {
    title: "Short operational answers",
    description:
      "The guide should help complete the form, not drift into generic long-form conversation.",
  },
];

const inputSignals = [
  "field_name",
  "field_label",
  "field_type",
  "field_description",
  "helper_text",
  "validation_rules",
  "current_step",
  "workspace_prompt",
  "client_tone",
];

const responseModes = [
  {
    mode: "Inline hint",
    description:
      "Short answer under the field when the user needs quick clarification.",
  },
  {
    mode: "Right-side assistant panel",
    description:
      "Persistent contextual help area showing examples and completion guidance.",
  },
  {
    mode: "Validation support",
    description:
      "Explain why an entry may be invalid and what a correct input should look like.",
  },
];

export default function AIGuideSettingsPage() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="glass-panel-strong premium-border rounded-[32px] p-7 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="sunbeat-badge">
              <span className="sunbeat-dot" />
              AI Guide Configuration
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/50">
              Contextual assistance layer
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
            AI that supports completion,
            <span className="block text-white/68">not generic conversation.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-white/62">
            The Sunbeat assistant should behave like a guided operational layer inside the
            Release Intake. It exists to reduce doubt, improve data quality and help users
            finish the form correctly.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <MetricCard value="Contextual" label="field + step aware" />
            <MetricCard value="Reliable" label="short operational answers" />
            <MetricCard value="Configurable" label="workspace prompt logic" />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/app/settings/fields"
              className="sunbeat-button sunbeat-button-primary"
            >
              Open field config
            </Link>
            <Link
              href="/app/release-intake"
              className="sunbeat-button sunbeat-button-secondary"
            >
              Preview intake
            </Link>
          </div>
        </div>

        <div className="sunbeat-card rounded-[32px] p-7 md:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Strategy
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Shine Brighter, Work Smarter.
          </h2>

          <div className="mt-5 grid gap-3">
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">User-facing value</div>
              <p className="mt-2 text-sm leading-7 text-white/55">
                Guidance feels premium when it is precise, contextual and calm.
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">Operational value</div>
              <p className="mt-2 text-sm leading-7 text-white/55">
                Smarter assistance means fewer errors, fewer follow-ups and better submissions.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-4">
            <div className="text-sm font-semibold text-emerald-100">Recommended role</div>
            <p className="mt-2 text-sm leading-7 text-emerald-100/80">
              Treat the AI guide as a completion assistant, not as a standalone chatbot product.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="sunbeat-card rounded-[32px] p-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Core principles
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            How the guide should behave
          </h2>

          <div className="mt-6 grid gap-4">
            {guidePrinciples.map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="text-lg font-semibold text-white">{item.title}</div>
                <p className="mt-3 text-sm leading-7 text-white/56">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Prompt inputs
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Recommended runtime context
          </h2>

          <div className="mt-6 space-y-3">
            {inputSignals.map((item) => (
              <div
                key={item}
                className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4 font-mono text-sm text-white/80"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[24px] border border-blue-400/20 bg-blue-400/10 p-4">
            <div className="text-sm font-semibold text-blue-100">Implementation note</div>
            <p className="mt-2 text-sm leading-7 text-blue-100/80">
              Keep the AI prompt grounded in actual field configuration so the assistant stays
              aligned with workspace logic.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="sunbeat-card rounded-[32px] p-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            UX patterns
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Recommended response modes
          </h2>

          <div className="mt-6 grid gap-4">
            {responseModes.map((item) => (
              <div
                key={item.mode}
                className="rounded-[24px] border border-white/10 bg-black/20 p-5"
              >
                <div className="text-lg font-semibold text-white">{item.mode}</div>
                <p className="mt-3 text-sm leading-7 text-white/56">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="sunbeat-card rounded-[32px] p-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Workspace prompt direction
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            What the client should be able to configure
          </h2>

          <div className="mt-6 grid gap-3">
            {[
              "Tone of voice for guidance",
              "Examples specific to the label workflow",
              "Terms that should be preferred",
              "Rules around codes, credits and delivery",
              "What to do when the user is unsure",
              "Fallback copy when no answer is available",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/78"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="glass-panel rounded-[32px] p-7 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Next implementation layer
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Bind the AI guide to the real form state.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
                The frontend direction is now defined. The next step is connecting the assistant
                to field metadata, current step context and workspace-level prompt settings so the
                guidance can be generated reliably during completion.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/app/settings/branding"
                className="sunbeat-button sunbeat-button-primary"
              >
                Open branding
              </Link>
              <Link
                href="/app/settings/fields"
                className="sunbeat-button sunbeat-button-secondary"
              >
                Back to fields
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