import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

const quickLinks = [
  {
    title: "Intake publico",
    description: "Abrir a versao atual do formulario e revisar a experiencia do cliente.",
    href: "/app/release-intake",
    cta: "Abrir intake",
  },
  {
    title: "Modo edit",
    description: "Controlar campos, obrigatoriedade, helper texts e notificacoes.",
    href: "/app/settings/fields",
    cta: "Editar formulario",
  },
  {
    title: "Submissoes",
    description: "Acompanhar envios recentes e rascunhos salvos.",
    href: "/app/submissions",
    cta: "Ver submissoes",
  },
];

export default async function AppHome() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email ?? "workspace@sunbeat.pro";

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)] md:px-8 md:py-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Dashboard
        </div>
        <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#111111]">
          Controle do workspace e do intake.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-[#605A52]">
          Esta area concentra a operacao interna da Sunbeat: edicao do formulario,
          revisao das entradas e configuracao do fluxo usado pelos clientes.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <MetricCard value="OTP" label="acesso autenticado" />
          <MetricCard value="Live" label="workspace em operacao" />
          <MetricCard value={userEmail} label="usuario conectado" compact />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {quickLinks.map((item) => (
          <article
            key={item.title}
            className="rounded-[28px] border border-black/8 bg-white px-6 py-6 shadow-[0_18px_48px_rgba(0,0,0,0.04)]"
          >
            <h3 className="text-xl font-semibold text-[#111111]">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[#605A52]">
              {item.description}
            </p>
            <Link
              href={item.href}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[#111111] px-4 text-sm font-semibold text-white"
            >
              {item.cta}
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}

function MetricCard({
  value,
  label,
  compact = false,
}: {
  value: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-black/8 bg-[#F8F5EF] p-5">
      <div
        className={
          compact
            ? "break-all text-base font-semibold text-[#111111]"
            : "text-2xl font-semibold text-[#111111]"
        }
      >
        {value}
      </div>
      <div className="mt-2 text-sm text-[#6F695F]">{label}</div>
    </div>
  );
}
