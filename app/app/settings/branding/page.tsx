import Link from "next/link";

const brandingAreas = [
  {
    title: "Public form intro",
    description:
      "Headline, subheadline and supporting copy shown at the top of the Release Intake.",
  },
  {
    title: "Client trust layer",
    description:
      "Workspace name, logo, tone, reassurance copy and premium visual consistency.",
  },
  {
    title: "Success and status messaging",
    description:
      "Submission confirmation, next-step instructions and follow-up expectations.",
  },
  {
    title: "Helper tone",
    description:
      "How helped text and AI guidance should sound for this client experience.",
  },
];

const brandTokens = [
  { label: "Workspace Name", value: "Sunbeat Platform" },
  { label: "Slogan", value: "Shine Brighter, Work Smarter." },
  { label: "Primary Positioning", value: "Premium metadata infrastructure for labels" },
  { label: "Client Experience Direction", value: "Elegant, operational, trustworthy" },
];

const messagingExamples = [
  {
    title: "Intro headline",
    text: "Submit your release with clarity and confidence.",
  },
  {
    title: "Intro support copy",
    text:
      "This guided intake helps labels, artists and managers deliver cleaner metadata for faster operations.",
  },
  {
    title: "Success message",
    text:
      "Your release information has been received. Our team will review the submission and continue the workflow.",
  },
  {
    title: "AI tone direction",
    text:
      "Calm, precise, premium and operational. Helpful without sounding robotic.",
  },
];

export default function BrandingSettingsPage() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="glass-panel-strong premium-border rounded-[32px] p-7 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="sunbeat-badge">
              <span className="sunbeat-dot" />
              Branding Configuration
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/50">
              Client-facing experience
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
            Shape the experience,
            <span className="block text-white/68">not only the interface.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-white/62">
            Branding in Sunbeat should go beyond visual identity. It should define how the
            workspace is presented, how the intake feels and how users trust the process
            from start to confirmation.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <MetricCard value="Premium" label="public-facing tone" />
            <MetricCard value="Trusted" label="client experience" />
            <MetricCard value="Aligned" label="form + AI + messaging" />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/app/release-intake"
              className="sunbeat-button sunbeat-button-primary"
            >
              Preview intake
            </Link>
            <Link
              href="/app/settings/fields"
              className="sunbeat-button sunbeat-button-secondary"
            >
              Open fields
            </Link>
          </div>
        </div>

        <div className="sunbeat-card rounded-[32px] p-7 md:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Sunbeat identity
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Shine Brighter, Work Smarter.
          </h2>

          <p className="mt-4 text-sm leading-7 text-white/60">
            This slogan connects the two product promises:
          </p>

          <div className="mt-5 grid gap-3">
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">Shine Brighter</div>
              <p className="mt-2 text-sm leading-7 text-white/55">
                The label experience should feel elevated, polished and globally credible.
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">Work Smarter</div>
              <p className="mt-2 text-sm leading-7 text-white/55">
                The operational system should save time, reduce rework and guide cleaner submissions.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-yellow-300/20 bg-yellow-300/8 p-4 text-sm leading-7 text-yellow-100/85">
            Branding should be reflected in the landing page, login, dashboard, intake form,
            helped text and AI guidance tone.
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="sunbeat-card rounded-[32px] p-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Branding surface
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            What should be configurable
          </h2>

          <div className="mt-6 grid gap-4">
            {brandingAreas.map((item) => (
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
            Brand tokens
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Current positioning model
          </h2>

          <div className="mt-6 grid gap-3">
            {brandTokens.map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4"
              >
                <div className="text-xs uppercase tracking-[0.16em] text-white/38">
                  {item.label}
                </div>
                <div className="mt-2 text-sm font-medium text-white/88">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="sunbeat-card rounded-[32px] p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Messaging examples
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Client-facing copy direction
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">
                These examples show how branding can influence the Release Intake and the
                overall product experience.
              </p>
            </div>

            <button className="sunbeat-button sunbeat-button-secondary">
              Edit copy blocks
            </button>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {messagingExamples.map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="text-xs uppercase tracking-[0.16em] text-white/38">
                  {item.title}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/76">{item.text}</p>
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
                Connect branding settings to the actual intake experience.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
                The design direction is ready. The next step is storing workspace name, slogan,
                intro copy, success copy and tone settings so the public intake and assistant
                can render a fully branded client experience.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/app/settings/ai-guide"
                className="sunbeat-button sunbeat-button-primary"
              >
                Open AI guide
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