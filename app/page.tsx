import Link from "next/link";

const platformPillars = [
  {
    title: "Public Release Intake",
    description:
      "A polished external form experience for artists, managers and partners to submit release data without friction.",
  },
  {
    title: "Configurable field system",
    description:
      "Helped text, placeholders, order, requirements and visibility built for each client workspace.",
  },
  {
    title: "Contextual AI guidance",
    description:
      "Field-aware assistance that helps users fill the form correctly, reducing revisions and operational noise.",
  },
  {
    title: "Ops-ready delivery",
    description:
      "Structured data routed to Airtable, backend validation and an extensible workflow for label operations.",
  },
];

const metrics = [
  { value: "Premium", label: "product positioning" },
  { value: "OTP", label: "secure email access" },
  { value: "Airtable", label: "ops integration ready" },
  { value: "Global", label: "B2B interface direction" },
];

const workstreams = [
  "Dashboard profissional para labels e operações",
  "Release Intake público com experiência premium",
  "Configuração de campos dentro da área do cliente",
  "Guided help text e IA contextual por etapa",
];

export default function HomePage() {
  return (
    <main className="sunbeat-shell relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.12),transparent_22%),radial-gradient(circle_at_15%_20%,rgba(245,158,11,0.08),transparent_16%),radial-gradient(circle_at_85%_14%,rgba(96,165,250,0.1),transparent_18%)]" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <SunbeatLogo />
          <div>
            <div className="text-sm font-semibold tracking-[0.18em] text-white/95">
              SUNBEAT
            </div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
              Music infrastructure
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
          <a href="#platform" className="transition hover:text-white">
            Platform
          </a>
          <a href="#vision" className="transition hover:text-white">
            Vision
          </a>
          <a href="#workflow" className="transition hover:text-white">
            Workflow
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="sunbeat-button sunbeat-button-secondary">
            Sign in
          </Link>
          <Link href="/app" className="sunbeat-button sunbeat-button-primary">
            Open app
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-10 lg:px-8 lg:pb-24 lg:pt-14">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="sunbeat-badge">
              <span className="sunbeat-dot" />
              Premium metadata infrastructure for labels
            </div>

            <h1 className="sunbeat-title mt-7 max-w-4xl">
              Release operations,
              <span className="block text-white/72">with premium product clarity.</span>
            </h1>

            <p className="sunbeat-subtitle mt-6 max-w-2xl">
              Sunbeat is being built as the professional layer between label operations,
              release metadata, public intake and structured delivery. A premium SaaS
              experience for teams that need cleaner inputs, clearer workflows and
              scalable client-facing forms.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="sunbeat-button sunbeat-button-primary">
                Enter platform
              </Link>
              <Link
                href="/app/release-intake"
                className="sunbeat-button sunbeat-button-secondary"
              >
                Preview intake flow
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((item) => (
                <div key={item.label} className="sunbeat-card rounded-[24px] p-5">
                  <div className="text-2xl font-semibold text-white">{item.value}</div>
                  <div className="mt-2 text-sm text-white/55">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-yellow-300/20 via-white/5 to-transparent blur-3xl" />
            <div className="glass-panel-strong premium-border relative rounded-[32px] p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-white/50">Workspace preview</div>
                  <h2 className="mt-1 text-2xl font-semibold text-white">
                    Sunbeat Client Operations
                  </h2>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  Premium build
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                <PreviewCard
                  title="Dashboard"
                  text="Executive visibility for active submissions, recent drafts, client actions and operational priorities."
                />
                <PreviewCard
                  title="Release Intake"
                  text="Public multi-step flow with premium UI, guided help and future AI completion support."
                />
                <PreviewCard
                  title="Field Config"
                  text="Each client can configure copy, order, requirement rules and contextual help for every field."
                />
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-white/45">Current strategic direction</div>
                    <div className="mt-1 text-sm font-medium text-white/90">
                      Productizing metadata intake for global music operations
                    </div>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-yellow-300 shadow-[0_0_22px_rgba(250,204,21,0.8)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-10">
        <div className="mb-10 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            Platform
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            The premium operating layer for release metadata.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/62">
            The next step is not just adding more pages. It is turning the current
            foundation into a configurable product with strong UX, durable architecture
            and operational trust.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {platformPillars.map((item) => (
            <article key={item.title} className="sunbeat-card rounded-[28px] p-6">
              <div className="mb-4 h-2 w-20 rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-blue-400" />
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/58">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="vision" className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="sunbeat-card rounded-[32px] p-7">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Product vision
            </div>
            <h3 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
              A client-facing system that reduces operational back-and-forth.
            </h3>
            <p className="mt-4 text-sm leading-7 text-white/60">
              Sunbeat should feel premium for the end user and reliable for the ops team.
              The public experience must be clean and guided. The internal experience
              must be configurable, auditable and scalable.
            </p>
          </div>

          <div className="sunbeat-card rounded-[32px] p-7">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Immediate workstreams
            </div>
            <div className="mt-5 grid gap-3">
              {workstreams.map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-white/68">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-6 pb-24 pt-6 lg:px-8">
        <div className="sunbeat-card rounded-[36px] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Workflow
              </div>
              <h3 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                From public intake to structured operations.
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
                The product experience should connect external submission, contextual
                guidance, internal configuration and operational delivery without forcing
                labels to improvise process outside the system.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                "Client enters public intake",
                "Guided help reduces mistakes",
                "Data validated and reviewed",
                "Structured delivery reaches ops stack",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[22px] border border-white/10 bg-black/20 px-5 py-5 text-sm font-medium text-white/88"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="sunbeat-button sunbeat-button-primary">
              Continue to platform
            </Link>
            <Link href="/app" className="sunbeat-button sunbeat-button-secondary">
              Open internal area
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function PreviewCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <div className="text-sm font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-7 text-white/56">{text}</p>
    </div>
  );
}

function SunbeatLogo() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
      <div className="absolute h-6 w-6 rounded-full bg-yellow-300/90 blur-[1px]" />
      <div className="absolute h-3 w-3 rounded-full bg-[#0b1220]" />
      <div className="absolute h-8 w-8 rounded-full border border-yellow-300/35" />
    </div>
  );
}