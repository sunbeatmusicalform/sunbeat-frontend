import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";
import {
  buildWorkflowPublicPath,
  getWorkflowOperationalDefaults,
  listRegisteredWorkflows,
} from "@/lib/form-engine/workflow-registry";
import { WorkflowTogglesClient } from "./WorkflowTogglesClient";

export const metadata = { title: "Workflows - Sunbeat" };

type BrandingRow = {
  public_edit_allowed: boolean | null;
  submission_email_enabled: boolean | null;
  primary_color: string | null;
  form_bg_color: string | null;
  logo_url: string | null;
  badge_url: string | null;
  social_image_url: string | null;
  enabled_workflows: string[] | null;
};

type AirtableMappingRow = {
  workflow_type: string | null;
  is_enabled: boolean | null;
};

export default async function WorkflowsSettingsPage() {
  const workspaceSlug = await resolveWorkspaceSlugFromHeaders();
  const workflows = listRegisteredWorkflows();

  let branding: BrandingRow | null = null;
  let airtableMappings: AirtableMappingRow[] = [];

  try {
    const admin = createSupabaseAdmin();
    const [{ data: b }, { data: a }] = await Promise.all([
      admin
        .from("workspace_branding")
        .select(
          "public_edit_allowed, submission_email_enabled, primary_color, form_bg_color, logo_url, badge_url, social_image_url, enabled_workflows"
        )
        .eq("workspace_slug", workspaceSlug)
        .maybeSingle<BrandingRow>(),
      admin
        .from("workspace_airtable_mapping")
        .select("workflow_type, is_enabled")
        .eq("workspace_slug", workspaceSlug),
    ]);
    branding = b ?? null;
    airtableMappings = (a ?? []) as AirtableMappingRow[];
  } catch {
    // Keep settings readable even when optional config tables are unavailable.
  }

  const editModeEnabled = branding?.public_edit_allowed === true;
  const emailEnabled = branding?.submission_email_enabled !== false;
  const brandingConfigured = !!(branding?.logo_url || branding?.primary_color);

  const airtableEnabledWorkflows = new Set(
    airtableMappings
      .filter((mapping) => mapping.is_enabled)
      .map((mapping) => mapping.workflow_type ?? "")
  );

  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Workflows
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#111111]">
          Capability matrix
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5F5A53]">
          Visao operacional de cada formulario: etapas, integracoes, edit mode
          e links publicos. Workspace:{" "}
          <span className="font-medium text-[#111111]">{workspaceSlug}</span>.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/app/settings/branding"
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/10 bg-[#F8F5EF] px-4 text-sm font-medium text-[#111111] transition hover:bg-[#F0EDE6]"
          >
            Configurar branding
          </Link>
          <Link
            href="/app/settings/fields"
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-[#111111] transition hover:bg-[#F8F5EF]"
          >
            Editar campos
          </Link>
        </div>
      </section>

      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-6 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Estado global do workspace
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatusTile
            label="Edit mode"
            value={editModeEnabled ? "Ativo" : "Desativado"}
            active={editModeEnabled}
          />
          <StatusTile
            label="Email notif."
            value={emailEnabled ? "Ativo" : "Desativado"}
            active={emailEnabled}
          />
          <StatusTile
            label="Branding"
            value={brandingConfigured ? "Configurado" : "Padrao"}
            active={brandingConfigured}
          />
          <StatusTile
            label="Airtable"
            value={
              airtableMappings.length > 0
                ? `${airtableMappings.length} mapping(s)`
                : "Defaults"
            }
            active={workflows.some(
              (workflow) =>
                workflow.capabilities.operationalDefaults.airtableSyncEnabled
            )}
          />
        </div>
      </section>

      <WorkflowTogglesClient
        workflows={workflows}
        initialEnabled={branding?.enabled_workflows ?? null}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {workflows.map((workflow) => {
          const publicPath = buildWorkflowPublicPath({
            workspaceSlug,
            workflowType: workflow.workflowType,
          });
          const { capabilities } = workflow;
          const defaults = getWorkflowOperationalDefaults(workflow.workflowType);
          const mappedInAirtable = airtableEnabledWorkflows.has(
            workflow.workflowType
          );
          const airtableConnected =
            mappedInAirtable || defaults.airtableSyncEnabled;
          const emailConnected =
            emailEnabled && defaults.postSubmitEmailEnabled;
          const isActive = workflow.status === "active";
          const editModeConnected =
            isActive &&
            defaults.editModeEnabled &&
            (workflow.workflowType !== "release_intake" || editModeEnabled);

          return (
            <div
              key={workflow.workflowType}
              className="overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
            >
              <div className="border-b border-black/6 px-6 pb-5 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          isActive
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {workflow.status}
                      </span>
                      <span className="text-[10px] font-mono text-[#9A9590]">
                        {workflow.workflowType}
                      </span>
                    </div>
                    <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#111111]">
                      {workflow.label}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[#6B655C]">
                      {workflow.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b border-black/6 px-6 py-4">
                <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
                  Etapas - {capabilities.steps.length} passos
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {capabilities.steps.map((step, index) => (
                    <span
                      key={`${workflow.workflowType}-${step.label}`}
                      className="inline-flex items-center gap-1 rounded-full bg-[#F4F1EA] px-2.5 py-1 text-[11px] font-medium text-[#6B655C]"
                    >
                      <span className="font-mono text-[9px] text-[#9A9590]">
                        {index + 1}
                      </span>
                      {step.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-b border-black/6 px-6 py-4">
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
                  Integracoes
                </div>
                <div className="grid gap-2">
                  <IntegrationRow
                    icon="AT"
                    label="Airtable"
                    detail={capabilities.airtableTarget}
                    active={airtableConnected}
                    note={
                      mappedInAirtable
                        ? "Mapeamento ativo"
                        : airtableConnected
                        ? "Default operacional"
                        : "Sem mapeamento"
                    }
                  />
                  <IntegrationRow
                    icon="GD"
                    label="Google Drive"
                    detail={capabilities.driveNote}
                    active={defaults.driveSyncEnabled}
                    note={
                      defaults.driveSyncEnabled
                        ? "Default operacional"
                        : "Pendente configuracao"
                    }
                  />
                  <IntegrationRow
                    icon="EM"
                    label="E-mail"
                    detail="Notificacao de submissao"
                    active={emailConnected}
                    note={
                      defaults.postSubmitEmailEnabled
                        ? emailEnabled
                          ? "Habilitado"
                          : "Desabilitado"
                        : "Nao aplicavel"
                    }
                  />
                  <IntegrationRow
                    icon="ED"
                    label="Edit mode"
                    detail="Permite reenvio por token"
                    active={editModeConnected}
                    note={
                      editModeConnected
                        ? workflow.workflowType === "release_intake" &&
                          editModeEnabled
                          ? "Ativo (public_edit_allowed)"
                          : "Ativo por workflow"
                        : "Desativado"
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 px-6 py-4">
                {isActive && publicPath ? (
                  <a
                    href={publicPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-2xl border border-black/10 bg-[#111111] px-4 text-xs font-semibold text-white transition hover:bg-[#222222]"
                  >
                    Abrir formulario
                  </a>
                ) : null}
                {isActive && !publicPath ? (
                  <span className="inline-flex h-9 items-center justify-center rounded-2xl border border-black/8 bg-[#F4F1EA] px-4 text-xs font-medium text-[#8D867B]">
                    Formulario publico indisponivel nesta PR
                  </span>
                ) : null}
                {capabilities.previewPath ? (
                  <Link
                    href={capabilities.previewPath}
                    className="inline-flex h-9 items-center justify-center rounded-2xl border border-black/10 bg-[#F8F5EF] px-4 text-xs font-medium text-[#111111] transition hover:bg-[#F0EDE6]"
                  >
                    Preview interno
                  </Link>
                ) : (
                  <span className="inline-flex h-9 items-center justify-center rounded-2xl border border-black/8 bg-[#F4F1EA] px-4 text-xs font-medium text-[#8D867B]">
                    Preview interno indisponivel
                  </span>
                )}
                {!isActive && (
                  <span className="inline-flex h-9 items-center px-4 text-xs text-[#9A9590]">
                    Formulario em desenvolvimento
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-6 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Pendencias de self-service
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <GapCard
            title="Visibilidade por workflow"
            detail="A lista publica usa enabled_workflows por workspace e segue o registry central."
            cta="Branding"
            ctaHref="/app/settings/branding"
          />
          <GapCard
            title="Google Drive por workflow"
            detail="Clearance e Company ainda dependem de roots especificos para sync de Drive."
            cta="Documentacao"
            ctaHref="https://fly.io/apps/sunbeat-backend"
            external
          />
          <GapCard
            title="People registry"
            detail="Workflow operacional com renderer profile-driven e adapter interno de fields."
            cta="Fields"
            ctaHref="/app/settings/fields"
          />
        </div>
      </section>
    </div>
  );
}

function StatusTile({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-black/8 bg-[#FAFAF8] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8D867B]">
        {label}
      </div>
      <div
        className={`mt-1.5 text-sm font-semibold ${
          active ? "text-emerald-700" : "text-[#9A9590]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function IntegrationRow({
  icon,
  label,
  detail,
  active,
  note,
}: {
  icon: string;
  label: string;
  detail: string;
  active: boolean;
  note: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-black/6 bg-[#FAFAF8] px-3 py-2.5">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[9px] font-bold ${
          active
            ? "bg-emerald-100 text-emerald-700"
            : "bg-[#F0EDE6] text-[#9A9590]"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-[#111111]">{label}</div>
        <div className="truncate text-[11px] text-[#8D867B]">{detail}</div>
      </div>
      <div
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          active
            ? "bg-emerald-50 text-emerald-700"
            : "bg-[#F4F1EA] text-[#9A9590]"
        }`}
      >
        {note}
      </div>
    </div>
  );
}

function GapCard({
  title,
  detail,
  cta,
  ctaHref,
  external,
}: {
  title: string;
  detail: string;
  cta: string;
  ctaHref: string;
  external?: boolean;
}) {
  const className =
    "mt-3 inline-flex h-8 items-center justify-center rounded-xl border border-black/10 bg-[#F8F5EF] px-3 text-xs font-medium text-[#111111] transition hover:bg-[#F0EDE6]";
  return (
    <div className="rounded-[22px] border border-amber-100 bg-amber-50/60 px-5 py-4">
      <div className="text-sm font-semibold text-[#111111]">{title}</div>
      <p className="mt-1.5 text-[12px] leading-5 text-[#6B655C]">
        {detail}
      </p>
      {external ? (
        <a
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {cta}
        </a>
      ) : (
        <Link href={ctaHref} className={className}>
          {cta}
        </Link>
      )}
    </div>
  );
}
