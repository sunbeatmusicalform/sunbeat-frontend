import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";

export default async function AppHome() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email ?? "workspace@sunbeat.pro";

  const workspaceSlug = await resolveWorkspaceSlugFromHeaders();

  // Branding status
  let hasBranding = false;
  let workspaceName = workspaceSlug;
  let planName = "Free";
  let planId = "free";
  let submissionCount: number | null = null;
  let hasAirtable = false;
  let emailEnabled: boolean | null = null;

  try {
    const admin = createSupabaseAdmin();

    const [wsResult, brandingResult, submissionsResult, airtableResult] = await Promise.all([
      admin
        .from("workspaces")
        .select("name, plan_id, plans(name)")
        .eq("slug", workspaceSlug)
        .maybeSingle(),
      admin
        .from("workspace_branding")
        .select("workspace_name, submission_email_enabled")
        .eq("workspace_slug", workspaceSlug)
        .maybeSingle(),
      admin
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("client_slug", workspaceSlug),
      admin
        .from("workspace_airtable_mapping")
        .select("id", { count: "exact", head: true })
        .eq("workspace_slug", workspaceSlug)
        .eq("is_enabled", true),
    ]);

    if (wsResult.data) {
      workspaceName = wsResult.data.name ?? workspaceSlug;
      planId = wsResult.data.plan_id ?? "free";
      const plansData = wsResult.data.plans as { name: string }[] | { name: string } | null;
      const planEntry = Array.isArray(plansData) ? plansData[0] : plansData;
      planName = planEntry?.name ?? planId;
    }

    hasBranding = brandingResult.data !== null;
    const brandingData = brandingResult.data as { workspace_name?: string | null; submission_email_enabled?: boolean | null } | null;
    emailEnabled = brandingData?.submission_email_enabled ?? null;
    submissionCount = submissionsResult.count ?? null;
    hasAirtable = (airtableResult.count ?? 0) > 0;
  } catch {
    // graceful fallback — workspace is live, just can't enrich the dashboard
  }

  const planColors: Record<string, string> = {
    free: "#6B7280",
    starter: "#2563EB",
    pro: "#7C3AED",
    enterprise: "#111111",
    enterprise_core: "#111111",
    enterprise_ops: "#111111",
    enterprise_distribution: "#0A0A0A",
  };
  const planColor = planColors[planId] ?? "#111111";

  return (
    <div className="grid gap-6">

      {/* Status strip */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-6 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Dashboard
        </div>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#111111]">
          {workspaceName}
        </h2>
        <p className="mt-1 text-sm text-[#5F5A53]">
          {userEmail} · {workspaceSlug}.sunbeat.pro
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Plan */}
          <StatusCard
            label="Plano"
            value={planName}
            indicator="dot"
            indicatorColor={planColor}
            href="/app/settings/plan"
          />
          {/* Branding */}
          <StatusCard
            label="Branding"
            value={hasBranding ? "Configurado" : "Sem branding"}
            indicator="dot"
            indicatorColor={hasBranding ? "#16a34a" : "#9A9590"}
            href="/app/settings/branding"
          />
          {/* Airtable */}
          <StatusCard
            label="Airtable"
            value={hasAirtable ? "Conectado" : "Não conectado"}
            indicator="dot"
            indicatorColor={hasAirtable ? "#16a34a" : "#9A9590"}
            href="/app/settings/fields"
          />
          {/* Submissions */}
          <StatusCard
            label="Submissões"
            value={submissionCount !== null ? String(submissionCount) : "—"}
            indicator="none"
            href="/app/submissions"
          />
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        {/* Preview do formulário (internal) */}
        <QuickCard
          tag="Preview interno"
          title="Formulário Release Intake"
          description="Visualize e teste o formulário que seus clientes preenchem. Submissões aqui são reais."
          href="/app/release-intake"
          cta="Abrir preview"
          ctaStyle="secondary"
        />

        {/* Formulário público */}
        <QuickCard
          tag="Formulário público"
          title="Abrir intake público"
          description={`Link público do formulário: ${workspaceSlug}.sunbeat.pro/intake/${workspaceSlug}`}
          href={`/intake/${workspaceSlug}`}
          external
          cta="Abrir formulário →"
          ctaStyle="primary"
        />

        {/* Editar campos */}
        <QuickCard
          tag="Configuração"
          title="Editar campos"
          description="Controle obrigatoriedade, helper texts, visibilidade e notificações do formulário."
          href="/app/settings/fields"
          cta="Editar campos"
          ctaStyle="secondary"
        />

      </section>

      {/* Integrations status */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-6 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Integrações
        </div>
        <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#111111]">
          Status das conexões
        </h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <IntegrationStatus
            name="Airtable"
            status={hasAirtable ? "connected" : "not_configured"}
            note={hasAirtable ? "Mapeamento ativo" : "Nenhum mapeamento habilitado"}
          />
          <IntegrationStatus
            name="Google Drive"
            status="deferred"
            note="Configuração via Sunbeat"
          />
          <IntegrationStatus
            name="E-mail (Resend)"
            status={
              emailEnabled === true
                ? "connected"
                : emailEnabled === false
                ? "not_configured"
                : "deferred"
            }
            note={
              emailEnabled === true
                ? "Notificações de submissão ativas"
                : emailEnabled === false
                ? "Notificações desativadas"
                : "Não verificado"
            }
          />
        </div>
      </section>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusCard({
  label,
  value,
  indicator,
  indicatorColor,
  href,
}: {
  label: string;
  value: string;
  indicator: "dot" | "none";
  indicatorColor?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[20px] border border-black/8 bg-[#F8F5EF] px-4 py-4 transition hover:border-black/15 hover:bg-[#F0EDE6]"
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
        {label}
      </div>
      <div className="mt-2 flex items-center gap-2">
        {indicator === "dot" && indicatorColor && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: indicatorColor }}
          />
        )}
        <span className="text-sm font-semibold text-[#111111]">{value}</span>
      </div>
    </Link>
  );
}

function QuickCard({
  tag,
  title,
  description,
  href,
  cta,
  ctaStyle,
  external = false,
}: {
  tag: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  ctaStyle: "primary" | "secondary";
  external?: boolean;
}) {
  const linkProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <article className="flex flex-col rounded-[24px] border border-black/8 bg-white px-6 py-6 shadow-[0_14px_34px_rgba(0,0,0,0.04)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
        {tag}
      </div>
      <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#111111]">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-7 text-[#5F5A53]">{description}</p>
      <Link
        href={href}
        {...linkProps}
        className={[
          "mt-5 inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition",
          ctaStyle === "primary"
            ? "bg-[#111111] text-white hover:bg-[#1D1D1D]"
            : "border border-black/10 bg-[#F8F5EF] text-[#111111] hover:bg-[#F0EDE6]",
        ].join(" ")}
      >
        {cta}
      </Link>
    </article>
  );
}

function IntegrationStatus({
  name,
  status,
  note,
}: {
  name: string;
  status: "connected" | "not_configured" | "deferred";
  note: string;
}) {
  const colors = {
    connected: { dot: "#16a34a", label: "text-[#15803d]", text: "Conectado" },
    not_configured: { dot: "#9A9590", label: "text-[#7A746A]", text: "Não configurado" },
    deferred: { dot: "#D4A017", label: "text-[#92630B]", text: "Sob demanda" },
  };
  const c = colors[status];

  return (
    <div className="rounded-[18px] border border-black/8 bg-[#F8F5EF] px-4 py-4">
      <div className="text-sm font-semibold text-[#111111]">{name}</div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
        <span className={`text-xs font-medium ${c.label}`}>{c.text}</span>
      </div>
      <div className="mt-1 text-xs text-[#9A9590]">{note}</div>
    </div>
  );
}
