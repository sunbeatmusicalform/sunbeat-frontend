import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";
import { listRegisteredWorkflows, buildWorkflowPublicPath } from "@/lib/form-engine/workflow-registry";
import { WorkflowTogglesClient } from "./WorkflowTogglesClient";

export const metadata = { title: "Workflows — Sunbeat" };

// ─── Static capability data per workflow ─────────────────────────────────────

const WORKFLOW_STEPS: Record<string, { label: string }[]> = {
  release_intake: [
    { label: "Introdução" }, { label: "Identificação" }, { label: "Projeto" },
    { label: "Faixas" }, { label: "Marketing" }, { label: "Revisão" },
  ],
  rights_clearance: [
    { label: "Introdução" }, { label: "Solicitante" }, { label: "Formato" },
    { label: "Contexto" }, { label: "Faixas" }, { label: "Escopo" },
    { label: "Assets" }, { label: "Revisão" },
  ],
  company_registry: [
    { label: "Boas-vindas" }, { label: "Dados da empresa" }, { label: "Resp. legal" },
    { label: "Resp. contrato" }, { label: "Resp. financeiro" }, { label: "Bancário" },
    { label: "Revisão" },
  ],
  people_registry: [
    { label: "Identificação" }, { label: "Contato" }, { label: "Endereço" },
    { label: "Bancário" }, { label: "Informações adicionais" },
  ],
};

const WORKFLOW_AIRTABLE_TARGET: Record<string, string> = {
  release_intake: "[V2] Projetos + Faixas Musicais",
  rights_clearance: "[V2] Clearance — Case · Itens · Partes",
  company_registry: "Tabela de clientes efetivos (configurar)",
  people_registry: "Dados Cadastrais (pendente configuração)",
};

const WORKFLOW_DRIVE_NOTE: Record<string, string> = {
  release_intake: "Root folder do workspace",
  rights_clearance: "Pasta Clearance Musical / Não-Musical",
  company_registry: "Não mapeado ainda",
  people_registry: "Não mapeado ainda",
};

const WORKFLOW_PREVIEW_PATH: Record<string, string | null> = {
  release_intake: "/app/release-intake",
  rights_clearance: "/app/rights-clearance",
  company_registry: null,
  people_registry: null,
};

// ─── Types ────────────────────────────────────────────────────────────────────

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

type AirtableMappingRow = { workflow_type: string | null; is_enabled: boolean | null };

// ─── Page ─────────────────────────────────────────────────────────────────────

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
        .select("public_edit_allowed, submission_email_enabled, primary_color, form_bg_color, logo_url, badge_url, social_image_url, enabled_workflows")
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
    // graceful fallback
  }

  const editModeEnabled = branding?.public_edit_allowed === true;
  const emailEnabled = branding?.submission_email_enabled !== false;
  const brandingConfigured = !!(branding?.logo_url || branding?.primary_color);

  const airtableEnabledWorkflows = new Set(
    airtableMappings.filter((m) => m.is_enabled).map((m) => m.workflow_type ?? "")
  );

  return (
    <div className="grid gap-6">

      {/* Header */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Workflows
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#111111]">
          Capability matrix
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5F5A53]">
          Visão operacional de cada formulário — etapas, integrações, edit mode e links públicos.{" "}
          Workspace:{" "}
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
            Editar campos →
          </Link>
        </div>
      </section>

      {/* Workspace-level flags summary */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-6 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B] mb-4">
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
            value={brandingConfigured ? "Configurado" : "Padrão"}
            active={brandingConfigured}
          />
          <StatusTile
            label="Airtable"
            value={airtableMappings.length > 0 ? `${airtableMappings.length} mapping(s)` : "Sem mapeamento"}
            active={airtableMappings.length > 0}
          />
        </div>
      </section>

      {/* Workflow visibility toggles */}
      <WorkflowTogglesClient
        workspaceSlug={workspaceSlug}
        workflows={workflows}
        initialEnabled={branding?.enabled_workflows ?? null}
      />

      {/* Workflow cards grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        {workflows.map((wf) => {
          const publicPath = buildWorkflowPublicPath({ workspaceSlug, workflowType: wf.workflowType });
          const previewPath = WORKFLOW_PREVIEW_PATH[wf.workflowType] ?? null;
          const steps = WORKFLOW_STEPS[wf.workflowType] ?? [];
          const airtableTarget = WORKFLOW_AIRTABLE_TARGET[wf.workflowType] ?? "—";
          const driveNote = WORKFLOW_DRIVE_NOTE[wf.workflowType] ?? "—";
          const airtableConnected = airtableEnabledWorkflows.has(wf.workflowType);
          const isActive = wf.status === "active";

          return (
            <div
              key={wf.workflowType}
              className="rounded-[28px] border border-black/8 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.03)] overflow-hidden"
            >
              {/* Card header */}
              <div className="px-6 pt-6 pb-5 border-b border-black/6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {wf.status}
                      </span>
                      <span className="text-[10px] font-mono text-[#9A9590]">{wf.workflowType}</span>
                    </div>
                    <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#111111]">
                      {wf.label}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[#6B655C]">{wf.description}</p>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="px-6 py-4 border-b border-black/6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B] mb-2.5">
                  Etapas — {steps.length} passos
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {steps.map((step, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-[#F4F1EA] px-2.5 py-1 text-[11px] font-medium text-[#6B655C]"
                    >
                      <span className="text-[9px] text-[#9A9590] font-mono">{i + 1}</span>
                      {step.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Integrations */}
              <div className="px-6 py-4 border-b border-black/6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B] mb-3">
                  Integrações
                </div>
                <div className="grid gap-2">
                  <IntegrationRow
                    icon="AT"
                    label="Airtable"
                    detail={airtableTarget}
                    active={airtableConnected}
                    note={airtableConnected ? "Mapeamento ativo" : "Sem mapeamento registrado"}
                  />
                  <IntegrationRow
                    icon="GD"
                    label="Google Drive"
                    detail={driveNote}
                    active={wf.workflowType === "release_intake"}
                    note={wf.workflowType === "release_intake" ? "Ativo via env" : "Pendente configuração"}
                  />
                  <IntegrationRow
                    icon="EM"
                    label="E-mail"
                    detail="Notificação de submissão"
                    active={emailEnabled}
                    note={emailEnabled ? "Habilitado" : "Desabilitado"}
                  />
                  <IntegrationRow
                    icon="ED"
                    label="Edit mode"
                    detail="Permite reenvio por token"
                    active={editModeEnabled && isActive}
                    note={editModeEnabled && isActive ? "Ativo (public_edit_allowed)" : "Desativado"}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 flex flex-wrap gap-2">
                {isActive && (
                  <a
                    href={publicPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-2xl border border-black/10 bg-[#111111] px-4 text-xs font-semibold text-white transition hover:bg-[#222222]"
                  >
                    Abrir formulário →
                  </a>
                )}
                {previewPath && (
                  <Link
                    href={previewPath}
                    className="inline-flex h-9 items-center justify-center rounded-2xl border border-black/10 bg-[#F8F5EF] px-4 text-xs font-medium text-[#111111] transition hover:bg-[#F0EDE6]"
                  >
                    Preview interno
                  </Link>
                )}
                {!isActive && (
                  <span className="inline-flex h-9 items-center px-4 text-xs text-[#9A9590]">
                    Formulário em desenvolvimento
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Self-service gap callout */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-6 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B] mb-2">
          Pendências de self-service
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <GapCard
            title="Visibilidade por workflow"
            detail="Ativar/desativar workflows individualmente por tenant ainda depende de env vars globais."
            cta="Branding"
            ctaHref="/app/settings/branding"
          />
          <GapCard
            title="Google Drive por workflow"
            detail="Clearance e Company precisam de CLEARANCE_MUSICAL_ROOT_FOLDER_ID configurado no Fly.io."
            cta="Documentação"
            ctaHref="https://fly.io/apps/sunbeat-backend"
            external
          />
          <GapCard
            title="People registry"
            detail="Workflow em draft — Airtable sync pendente e edit mode a conectar ao pipeline DB."
            cta="Fields"
            ctaHref="/app/settings/fields"
          />
        </div>
      </section>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusTile({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className="rounded-[20px] border border-black/8 bg-[#FAFAF8] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8D867B]">{label}</div>
      <div className={`mt-1.5 text-sm font-semibold ${active ? "text-emerald-700" : "text-[#9A9590]"}`}>
        {value}
      </div>
    </div>
  );
}

function IntegrationRow({
  icon, label, detail, active, note,
}: {
  icon: string;
  label: string;
  detail: string;
  active: boolean;
  note: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-black/6 bg-[#FAFAF8] px-3 py-2.5">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[9px] font-bold ${
        active ? "bg-emerald-100 text-emerald-700" : "bg-[#F0EDE6] text-[#9A9590]"
      }`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-[#111111]">{label}</div>
        <div className="truncate text-[11px] text-[#8D867B]">{detail}</div>
      </div>
      <div className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-[#F4F1EA] text-[#9A9590]"
      }`}>
        {note}
      </div>
    </div>
  );
}

function GapCard({
  title, detail, cta, ctaHref, external,
}: {
  title: string;
  detail: string;
  cta: string;
  ctaHref: string;
  external?: boolean;
}) {
  const cls = "mt-3 inline-flex h-8 items-center justify-center rounded-xl border border-black/10 bg-[#F8F5EF] px-3 text-xs font-medium text-[#111111] hover:bg-[#F0EDE6] transition";
  return (
    <div className="rounded-[22px] border border-amber-100 bg-amber-50/60 px-5 py-4">
      <div className="text-sm font-semibold text-[#111111]">{title}</div>
      <p className="mt-1.5 text-[12px] leading-5 text-[#6B655C]">{detail}</p>
      {external ? (
        <a href={ctaHref} target="_blank" rel="noopener noreferrer" className={cls}>
          {cta} →
        </a>
      ) : (
        <Link href={ctaHref} className={cls}>
          {cta} →
        </Link>
      )}
    </div>
  );
}
