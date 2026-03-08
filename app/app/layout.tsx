import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

const navigation = [
  {
    label: "Overview",
    href: "/app",
    description: "Workspace and product direction",
  },
  {
    label: "Release Intake",
    href: "/app/release-intake",
    description: "Public-facing metadata intake flow",
  },
  {
    label: "Submissions",
    href: "/app/submissions",
    description: "Incoming releases and drafts",
  },
  {
    label: "Field Config",
    href: "/app/settings/fields",
    description: "Configure fields and helped text",
  },
  {
    label: "AI Guide",
    href: "/app/settings/ai-guide",
    description: "Contextual assistant behavior",
  },
  {
    label: "Branding",
    href: "/app/settings/branding",
    description: "Client-facing style and messaging",
  },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/app");
  }

  const userEmail = user.email ?? "unknown@workspace";

  return (
    <div className="sunbeat-shell min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-r border-white/8 bg-black/20 backdrop-blur-2xl">
          <div className="sticky top-0 flex min-h-screen flex-col px-5 py-5">
            <div className="mb-6 flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4">
              <SunbeatLogo />
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-[0.16em] text-white">
                  SUNBEAT
                </div>
                <div className="truncate text-[11px] uppercase tracking-[0.18em] text-white/40">
                  Shine Brighter, Work Smarter.
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Workspace
              </div>
              <div className="mt-2 text-sm font-medium text-white/90">Sunbeat Platform</div>
              <div className="mt-2 break-all text-xs leading-6 text-white/45">
                {userEmail}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Navigation
              </div>

              <nav className="grid gap-2">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-[22px] border border-transparent bg-transparent px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.05]"
                  >
                    <div className="text-sm font-semibold text-white/92">{item.label}</div>
                    <div className="mt-1 text-xs leading-6 text-white/45 transition group-hover:text-white/58">
                      {item.description}
                    </div>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-gradient-to-b from-yellow-300/10 via-white/[0.04] to-transparent p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Product direction
              </div>
              <div className="mt-3 text-sm font-semibold text-white">
                Premium metadata infrastructure
              </div>
              <p className="mt-2 text-xs leading-6 text-white/50">
                Intake, configuration, guided help and operational delivery for labels.
              </p>
            </div>

            <div className="mt-auto space-y-3 pt-6">
              <Link
                href="/"
                className="sunbeat-button sunbeat-button-secondary w-full justify-center"
              >
                Public site
              </Link>
              <Link
                href="/login"
                className="sunbeat-button w-full justify-center rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/8"
              >
                Back to login
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-white/8 bg-[#07111f]/80 backdrop-blur-2xl">
            <div className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/38">
                  Authenticated workspace
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                  Sunbeat Operations
                </h1>
                <p className="mt-1 text-sm text-white/52">
                  Shine Brighter, Work Smarter.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-200">
                  Auth active
                </div>
                <Link
                  href="/app/release-intake"
                  className="sunbeat-button sunbeat-button-primary"
                >
                  Open Intake
                </Link>
              </div>
            </div>
          </header>

          <main className="min-w-0 px-6 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function SunbeatLogo() {
  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
      <div className="absolute h-6 w-6 rounded-full bg-yellow-300/90 blur-[1px]" />
      <div className="absolute h-3 w-3 rounded-full bg-[#0b1220]" />
      <div className="absolute h-8 w-8 rounded-full border border-yellow-300/35" />
    </div>
  );
}