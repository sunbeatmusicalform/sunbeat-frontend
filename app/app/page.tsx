import Link from "next/link";
import { headers } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";
import { buildWorkspaceUrl, resolveWorkspaceBaseDomain } from "@/lib/tenant";

export default async function AppHome() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email ?? "workspace@sunbeat.pro";

  const workspaceSlug = await resolveWorkspaceSlugFromHeaders();
  const host = (await headers()).get("host");
  const workspaceDomain = resolveWorkspaceBaseDomain(host);
  const publicIntakeUrl = buildWorkspaceUrl(
    workspaceSlug,
    `/intake/${workspaceSlug}`,
    { domain: workspaceDomain }
  );

  // Branding status
  let hasBranding = false;
  let workspaceName = workspaceSlug;
  let planName = "Free";
  let planId = "free";
  let submissionCount: number | null = null;
  let hasAirtable = false;
  let emailEnabled: boolean | null = null;
  let brandingCustomized = false;
  let fieldsReviewed = false;

  try {
    const admin = createSupabaseAdmin();

    const [wsResult, brandingResult, submissionsResult, airtableResult, fieldsResult] = await Promise.all([
      admin
        .from("workspaces")
        .select("name, plan_id, plans(name)")
        .eq("slug", workspaceSlug)
        .maybeSingle(),
      admin
        .from("workspace_branding")
        .select("workspace_name, submission_email_enabled, logo_url, primary_color, form_title, intro_text")
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
      admin
        .from("workspace_field_overrides")
        .select("id", { count: "exact", head: true })
        .eq("workspace_slug", workspaceSlug),
    ]);

    if (wsResult.data) {
      workspaceName = wsResult.data.name ?? workspaceSlug;
      planId = wsResult.data.plan_id ?? "free";
      const plansData = wsResult.data.plans as { name: string }[] | { name: string } | null;
      const planEntry = Array.isArray(plansData) ? plansData[0] : plansData;
      planName = planEntry?.name ?? planId;
    }

    hasBranding = brandingResult.data !== null;
    const brandingData = brandingResult.data as {
      workspace_name?: string | null;
      submission_email_enabled?: boolean | null;
      logo_url?: string | null;
      primary_color?: string | null;
      form_title?: string | null;
      intro_text?: string | null;
    } | null;
    emailEnabled = brandingData?.submission_email_enabled ?? null;
    brandingCustomized = Boolean(
      brandingData?.logo_url ||
      brandingData?.primary_color ||
      brandingData?.form_title ||
      brandingData?.intro_text
    );
    submissionCount = submissionsResult.count ?? null;
    hasAirtable = (airtableResult.count ?? 0) > 0;
    fieldsReviewed = (fieldsResult.count ?? 0) > 0;
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
  const onboardingSteps = [
    {
      title: "Workspace criado",
      description: "Sua conta, acesso de proprietário e ambiente estão prontos.",
      complete: true,
      href: "/app",
      cta: "Pronto",
    },
    {
      title: "Personalize a experiência",
      description: "Revise textos, cores e identidade do formulário público.",
      complete: brandingCustomized,
      href: "/app/settings/branding",
      cta: "Configurar branding",
    },
    {
      title: "Revise os campos",
      description: "Ajuste pelo menos um campo para validar seu fluxo de coleta.",
      complete: fieldsReviewed,
      href: "/app/settings/fields",
      cta: "Revisar formulário",
    },
    {
      title: "Envie uma submissão de teste",
      description: "Percorra o formulário como um cliente e confira o resultado.",
      complete: (submissionCount ?? 0) > 0,
      href: publicIntakeUrl,
      cta: "Fazer teste",
      external: true,
    },
  ];
  const completedOnboardingSteps = onboardingSteps.filter((step) => step.complete).length;

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
          {userEmail} · {workspaceSlug}.{workspaceDomain}
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

      {planId === "free" && (
        <section className="flex flex-col gap-4 rounded-[24px] border border-amber-200 bg-amber-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
              Política do plano Free
            </div>
            <p className="mt-1 text-sm leading-6 text-amber-950/75">
              Os assets enviados ficam disponíveis por 60 dias. A trilha de auditoria,
              os metadados e o histórico da submissão permanecem registrados.
            </p>
          </div>
          <Link
            href="/app/settings/plan"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl border border-amber-300 bg-white px-4 text-xs font-semibold text-amber-900"
          >
            Ver limites do plano
          </Link>
        </section>
      )}

      {completedOnboardingSteps < onboardingSteps.length && (
        <section className="rounded-[28px] border border-black/8 bg-[#111111] px-7 py-7 text-white shadow-[0_20px_54px_rgba(0,0,0,0.12)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                Primeiros passos
              </div>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                Prepare seu workspace para operar
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
                Complete o fluxo abaixo antes de convidar clientes reais para preencher seus formulários.
              </p>
            </div>
            <div className="shrink-0 text-sm font-semibold text-white/75">
              {completedOnboardingSteps} de {onboardingSteps.length} concluídos
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/12">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${(completedOnboardingSteps / onboardingSteps.length) * 100}%` }}
            />
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {onboardingSteps.map((step, index) => (
              <OnboardingStep key={step.title} index={index + 1} {...step} />
            ))}
          </div>
        </section>
      )}

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
          description={`Link público do formulário: ${workspaceSlug}.${workspaceDomain}/intake/${workspaceSlug}`}
          href={publicIntakeUrl}
          external
          cta="Abrir formulário →"
          ctaStyle="primary"
        />

        {/* Gantt operacional */}
        <QuickCard
          tag="Sunbeat Tables"
          title="Gantt operacional"
          description="Acompanhe projetos, macroáreas e prazos em uma linha do tempo interna."
          href="/app/gantt"
          cta="Abrir Gantt"
          ctaStyle="secondary"
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

function OnboardingStep({
  index,
  title,
  description,
  complete,
  href,
  cta,
  external = false,
}: {
  index: number;
  title: string;
  description: string;
  complete: boolean;
  href: string;
  cta: string;
  external?: boolean;
}) {
  return (
    <div className="flex gap-4 rounded-[20px] border border-white/10 bg-white/[0.06] p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold">
        {complete ? "✓" : index}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <p className="mt-1 text-xs leading-5 text-white/60">{description}</p>
        {!complete && (
          <Link
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="mt-3 inline-flex text-xs font-semibold text-white underline decoration-white/30 underline-offset-4"
          >
            {cta} →
          </Link>
        )}
      </div>
    </div>
  );
}

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
