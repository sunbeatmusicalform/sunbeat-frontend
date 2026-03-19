import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/app/app/logout-button";
import { createSupabaseServer } from "@/lib/supabase/server";

const navigation = [
  {
    label: "Dashboard",
    href: "/app",
    description: "Visao geral do workspace",
  },
  {
    label: "Intake publico",
    href: "/app/release-intake",
    description: "Abrir e revisar o formulario atual",
  },
  {
    label: "Submissoes",
    href: "/app/submissions",
    description: "Entradas e rascunhos recentes",
  },
  {
    label: "Modo edit",
    href: "/app/settings/fields",
    description: "Campos, regras e notificacoes",
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

  const userEmail = user.email ?? "workspace@sunbeat.pro";

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#111111]">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-black/8 bg-[#F8F5EF]">
          <div className="sticky top-0 flex min-h-screen flex-col px-5 py-5">
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
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#111111]">
                    Sunbeat
                  </div>
                  <div className="truncate text-[11px] uppercase tracking-[0.2em] text-[#7A746A]">
                    Workspace
                  </div>
                </div>
              </div>
            </Link>

            <div className="mt-5 rounded-[28px] border border-black/8 bg-white px-4 py-4 shadow-[0_18px_42px_rgba(0,0,0,0.04)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
                Conta conectada
              </div>
              <div className="mt-3 text-sm font-medium text-[#111111]">
                Workspace Sunbeat
              </div>
              <div className="mt-2 break-all text-xs leading-6 text-[#6B655C]">
                {userEmail}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
                Navegacao
              </div>

              <nav className="grid gap-2">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-[22px] border border-transparent bg-transparent px-4 py-4 transition hover:border-black/8 hover:bg-white"
                  >
                    <div className="text-sm font-semibold text-[#111111]">
                      {item.label}
                    </div>
                    <div className="mt-1 text-xs leading-6 text-[#6F695F]">
                      {item.description}
                    </div>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-6">
              <Link
                href="/app/release-intake"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#111111] px-4 text-sm font-semibold text-white"
              >
                Abrir intake
              </Link>
              <div className="flex gap-3">
                <Link
                  href="/"
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-[#111111]"
                >
                  Site publico
                </Link>
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-black/8 bg-[#F4F1EA]/95 backdrop-blur-xl">
            <div className="flex flex-col gap-3 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
                  Workspace autenticado
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
                  Sunbeat client operations
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-black/8 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[#6F695F]">
                  Ativo
                </div>
                <Link
                  href="/app/settings/fields"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-[#111111]"
                >
                  Modo edit
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
