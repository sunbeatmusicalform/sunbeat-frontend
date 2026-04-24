import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/app/app/logout-button";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";

// ─── Nav structure ───────────────────────────────────────────────────────────

const navSections = [
  {
    section: "Visão geral",
    items: [
      {
        label: "Dashboard",
        href: "/app",
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        description: "Visão geral do workspace",
      },
      {
        label: "Submissões",
        href: "/app/submissions",
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        description: "Entradas e rascunhos",
      },
    ],
  },
  {
    section: "Formulários",
    items: [
      {
        label: "Release intake",
        href: "/app/release-intake",
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        ),
        description: "Preview interno do formulário",
      },
      {
        label: "Rights clearance",
        href: "/app/rights-clearance",
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
        description: "Preview interno — clearance",
      },
    ],
  },
  {
    section: "Configurações",
    items: [
      {
        label: "Editar campos",
        href: "/app/settings/fields",
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
        description: "Campos, regras e notificações",
      },
      {
        label: "Branding",
        href: "/app/settings/branding",
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        ),
        description: "Identidade e personalização",
      },
      {
        label: "Plano",
        href: "/app/settings/plan",
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        description: "Plano ativo, limites e upgrade",
      },
    ],
  },
];

// ─── Layout ──────────────────────────────────────────────────────────────────

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/app");
  }

  const userEmail = user.email ?? "workspace@sunbeat.pro";

  const workspaceSlug = await resolveWorkspaceSlugFromHeaders();

  // Fetch workspace + plan info
  let workspaceName = workspaceSlug;
  let planName = "Pro";
  let planId = "pro";

  try {
    const admin = createSupabaseAdmin();
    const { data: ws } = await admin
      .from("workspaces")
      .select("name, plan_id, plans(name)")
      .eq("slug", workspaceSlug)
      .maybeSingle();

    if (ws) {
      workspaceName = ws.name;
      planId = ws.plan_id;
      const plansData = ws.plans as { name: string }[] | { name: string } | null;
      const planEntry = Array.isArray(plansData) ? plansData[0] : plansData;
      planName = planEntry?.name ?? planId;
    }
  } catch {
    // graceful fallback
  }

  const planColors: Record<string, string> = {
    free: "#6B7280",
    starter: "#2563EB",
    pro: "#7C3AED",
    enterprise: "#111111",
  };
  const planColor = planColors[planId] ?? "#111111";

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#111111]">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[280px_minmax(0,1fr)]">

        {/* ── Sidebar ── */}
        <aside className="border-r border-black/8 bg-[#F8F5EF]">
          <div className="sticky top-0 flex min-h-screen flex-col px-5 py-5">

            {/* Workspace card */}
            <Link
              href="/"
              className="rounded-[28px] border border-black/8 bg-white px-4 py-4 shadow-[0_18px_42px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-[#F6F2EA]">
                  <img
                    src="/sunbeat-logan-transparent-black.ico"
                    alt="Sunbeat"
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold uppercase tracking-[0.22em] text-[#111111]">
                    {workspaceName}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#7A746A]">
                    {workspaceSlug}.sunbeat.pro
                  </div>
                </div>
              </div>

              {/* Plan badge */}
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ backgroundColor: planColor + '15', color: planColor }}
                >
                  {planName}
                </span>
                <span className="text-[10px] text-[#9A9590]">Plano ativo</span>
              </div>
            </Link>

            {/* User info */}
            <div className="mt-3 rounded-[20px] border border-black/8 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8D867B]">
                Conta
              </div>
              <div className="mt-1.5 break-all text-xs leading-5 text-[#6B655C]">
                {userEmail}
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-5 flex-1">
              {navSections.map((section) => (
                <div key={section.section} className="mb-5">
                  <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
                    {section.section}
                  </div>
                  <nav className="grid gap-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 rounded-[18px] border border-transparent px-3 py-3 transition hover:border-black/8 hover:bg-white"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-black/8 bg-white text-[#6B655C]">
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#111111]">
                            {item.label}
                          </div>
                          <div className="truncate text-[11px] text-[#6F695F]">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </nav>
                </div>
              ))}
            </div>

            {/* Bottom actions */}
            <div className="flex flex-col gap-2 pt-4 border-t border-black/8">
              {/* Links to public intake — opens public URL in new tab */}
              <a
                href={`/intake/${workspaceSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold"
                style={{ backgroundColor: '#111111', color: '#ffffff' }}
              >
                Abrir formulário público
              </a>
              <div className="flex gap-2">
                <Link
                  href="/"
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-[#111111]"
                >
                  Site público
                </Link>
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-black/8 bg-[#F4F1EA]/95 backdrop-blur-xl">
            <div className="flex flex-col gap-3 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
                  {workspaceName}
                </div>
                <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
                  Operações do workspace
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
                  style={{ borderColor: planColor + '30', color: planColor, backgroundColor: planColor + '10' }}
                >
                  {planName}
                </span>
                <Link
                  href="/app/settings/fields"
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-[#111111] hover:bg-[#F4F1EA] transition"
                >
                  Editar campos
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
