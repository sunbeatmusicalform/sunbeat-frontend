import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

const quickActions = [
  {
    title: "Open Release Intake",
    description:
      "Access the current intake flow and continue shaping the public submission experience.",
    href: "/app/release-intake",
    cta: "Open flow",
  },
  {
    title: "Usage and operations",
    description:
      "Review workspace activity, future submission volume and client operational signals.",
    href: "/app/usage",
    cta: "View usage",
  },
];

const roadmap = [
  "Premium dashboard shell and workspace navigation",
  "Configurable field system for each client",
  "Helped text and contextual AI guidance",
  "Professional public intake for labels and partners",
];

export default async function AppHome() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email ?? "unknown user";

  return (
    <div className="sunbeat-shell min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-panel-strong premium-border rounded-[32px] p-7 md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="sunbeat-badge">
                <span className="sunbeat-dot" />
                Internal workspace
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/50">
                Authenticated area
              </span>
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
              Welcome to Sunbeat.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-white/62">
              This is the operational core of your premium metadata product. The next
              phase is to evolve this area into a real client workspace with
              configurable fields, guided intake and contextual AI support.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <MetricCard value="OTP" label="secure authentication" />
              <MetricCard value="Live" label="domain and deploy running" />
              <MetricCard value="Ready" label="premium evolution phase" />
            </div>
          </div>

          <div className="sunbeat-card rounded-[32px] p-7 md:p-8">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Account
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-white">Workspace identity</h2>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="text-sm text-white/45">Signed in as</div>
              <div className="mt-2 break-all text-sm font-medium text-white/92">
                {userEmail}
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-sm text-white/45">Current focus</div>
              <div className="mt-2 text-sm leading-7 text-white/68">
                Turn the current authenticated area into a premium dashboard with
                configurable release intake infrastructure for labels.
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="sunbeat-card rounded-[32px] p-7">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Quick actions
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Continue building the product
            </h2>

            <div className="mt-6 grid gap-4">
              {quickActions.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="text-lg font-semibold text-white">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-white/58">
                    {item.description}
                  </p>
                  <Link
                    href={item.href}
                    className="sunbeat-button sunbeat-button-secondary mt-5"
                  >
                    {item.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="sunbeat-card rounded-[32px] p-7">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Product roadmap
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              What this workspace should become next
            </h2>

            <div className="mt-6 grid gap-3">
              {roadmap.map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div className="text-sm leading-7 text-white/68">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="glass-panel rounded-[32px] p-7">
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                  Strategic direction
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  Sunbeat should operate like premium infrastructure, not just a form.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                  The dashboard is now positioned to become the command layer for labels:
                  submissions, drafts, field config, help text, branding and contextual
                  AI assistance inside one coherent workspace.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "Client-facing form experience",
                  "Internal configuration workspace",
                  "Airtable-ready operational outputs",
                  "Future AI guidance per field and step",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/10 bg-white/[0.04] px-5 py-5 text-sm font-medium text-white/88"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
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