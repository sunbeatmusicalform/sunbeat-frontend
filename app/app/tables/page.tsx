import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { isSunbeatTablesEnabled } from "@/lib/features/sunbeat-tables";
import {
  buildWorkflowPublicPath,
  listRegisteredWorkflows,
} from "@/lib/form-engine/workflow-registry";
import { createSupabaseServer } from "@/lib/supabase/server";
import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";
import { loadOperationalTablesReadModel } from "@/lib/tables/read-model";
import {
  canAccessWorkspace,
  listAccessibleWorkspacesForUser,
} from "@/lib/workspace-access";
import type {
  OperationalRiskLevel,
  OperationalRowStatus,
  OperationalSyncStatus,
  OperationalTableRow,
  OperationalTablesReadModel,
} from "@/lib/tables/types";

export const metadata = { title: "Tables - Sunbeat" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUS_STYLES: Record<OperationalRowStatus, string> = {
  draft: "border-[#E5E0D8] bg-[#F8F5EF] text-[#6B655C]",
  submitted: "border-blue-200 bg-blue-50 text-blue-700",
  in_review: "border-amber-200 bg-amber-50 text-amber-800",
  blocked: "border-red-200 bg-red-50 text-red-700",
  synced: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-red-200 bg-red-50 text-red-700",
};

const RISK_STYLES: Record<OperationalRiskLevel, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-red-200 bg-red-50 text-red-700",
};

const SYNC_STYLES: Record<OperationalSyncStatus, string> = {
  synced: "bg-emerald-500",
  pending: "bg-amber-500",
  failed: "bg-red-500",
  skipped: "bg-[#C8C0B6]",
  unknown: "bg-[#9A9590]",
};

const SYNC_LABELS: Record<OperationalSyncStatus, string> = {
  synced: "Ok",
  pending: "Pendente",
  failed: "Falhou",
  skipped: "Sem sync",
  unknown: "Indefinido",
};

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function buildTablesHref(args: {
  workflowType?: string | null;
  query?: string | null;
}) {
  const params = new URLSearchParams();

  if (args.workflowType) {
    params.set("workflow_type", args.workflowType);
  }

  if (args.query) {
    params.set("q", args.query);
  }

  const suffix = params.toString();
  return suffix ? `/app/tables?${suffix}` : "/app/tables";
}

function formatDate(iso: string | null) {
  if (!iso) {
    return "--";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function riskLabel(level: OperationalRiskLevel) {
  if (level === "high") return "Alto";
  if (level === "medium") return "Medio";
  return "Baixo";
}

export default async function TablesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const workflowType = getParam(params.workflow_type);
  const query = getParam(params.q);
  const workspaceSlug = await resolveWorkspaceSlugFromHeaders();
  if (!isSunbeatTablesEnabled(workspaceSlug)) {
    notFound();
  }

  const workflows = listRegisteredWorkflows();
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/app/tables");
  }

  const accessibleWorkspaces = await listAccessibleWorkspacesForUser({
    userId: user.id,
    email: user.email ?? null,
    metadataWorkspaceSlug: user.user_metadata?.workspace_slug,
  });

  if (!canAccessWorkspace({ workspaceSlug, workspaces: accessibleWorkspaces })) {
    return (
      <div className="rounded-[24px] border border-red-100 bg-red-50 px-6 py-5 text-sm leading-6 text-red-700">
        Workspace nao disponivel para este usuario.
      </div>
    );
  }

  let model: OperationalTablesReadModel | null = null;
  let loadError: string | null = null;

  try {
    model = await loadOperationalTablesReadModel({
      workspaceSlug,
      workflowType,
      query,
    });
  } catch (error: unknown) {
    loadError =
      error instanceof Error
        ? error.message
        : "Nao foi possivel carregar Sunbeat Tables.";
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
              Sunbeat Tables
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#111111]">
              Operacao consolidada
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#5F5A53]">
              Read model dos registros vivos do workspace{" "}
              <span className="font-medium text-[#111111]">{workspaceSlug}</span>:
              formularios publicos, Airtable, Drive, email e proximas acoes em
              uma fila unica.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/app/settings/workflows"
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/10 bg-[#F8F5EF] px-4 text-sm font-medium text-[#111111] transition hover:bg-[#F0EDE6]"
            >
              Workflows
            </Link>
            <a
              href={`/api/workspaces/${workspaceSlug}/tables`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-[#111111] transition hover:bg-[#F8F5EF]"
            >
              API JSON
            </a>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatTile label="Total" value={String(model?.summary.total ?? "--")} />
          <StatTile
            label="Precisa revisao"
            value={String(model?.summary.needsReview ?? "--")}
          />
          <StatTile
            label="Sync falhou"
            value={String(model?.summary.syncFailed ?? "--")}
          />
          <StatTile label="Rascunhos" value={String(model?.summary.drafts ?? "--")} />
          <StatTile
            label="Duplicidades"
            value={String(model?.summary.peopleDuplicates ?? "--")}
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-black/8 bg-white px-6 py-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterChip
              href={buildTablesHref({ query })}
              active={!workflowType}
              label="Todos"
            />
            {workflows.map((workflow) => (
              <FilterChip
                key={workflow.workflowType}
                href={buildTablesHref({
                  workflowType: workflow.workflowType,
                  query,
                })}
                active={workflowType === workflow.workflowType}
                label={workflow.label}
              />
            ))}
          </div>

          <form action="/app/tables" className="flex min-w-0 flex-col gap-2 sm:flex-row">
            {workflowType && (
              <input type="hidden" name="workflow_type" value={workflowType} />
            )}
            <input
              name="q"
              defaultValue={query ?? ""}
              placeholder="Buscar por nome, email, documento..."
              className="h-10 min-w-0 rounded-2xl border border-black/10 bg-[#F8F5EF] px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#9A9590] focus:border-black/20 focus:bg-white sm:w-80"
            />
            <button className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#111111] px-4 text-sm font-semibold text-white transition hover:bg-[#2A2927]">
              Buscar
            </button>
            {query && (
              <Link
                href={buildTablesHref({ workflowType })}
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-[#111111] transition hover:bg-[#F8F5EF]"
              >
                Limpar
              </Link>
            )}
          </form>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {workflows.map((workflow) => {
            const publicPath = buildWorkflowPublicPath({
              workspaceSlug,
              workflowType: workflow.workflowType,
            });

            return (
              <div
                key={`path-${workflow.workflowType}`}
                className="rounded-[18px] border border-black/8 bg-[#F8F5EF] px-4 py-3"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
                  {workflow.label}
                </div>
                {publicPath ? (
                  <a
                    href={publicPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block truncate text-xs font-medium text-[#111111] underline decoration-black/20 underline-offset-4"
                  >
                    {publicPath}
                  </a>
                ) : (
                  <div className="mt-1 text-xs text-[#8D867B]">Sem rota publica</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {loadError && (
        <div className="rounded-[20px] border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {model?.warnings.map((warning) => (
        <div
          key={warning}
          className="rounded-[20px] border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-800"
        >
          {warning}
        </div>
      ))}

      {!loadError && model && (
        <section className="overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
          <div className="hidden border-b border-black/8 bg-[#F8F5EF] px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8D867B] xl:grid xl:grid-cols-[minmax(240px,1.5fr)_150px_120px_220px_minmax(180px,1fr)_130px]">
            <div>Registro</div>
            <div>Workflow</div>
            <div>Status</div>
            <div>Sync</div>
            <div>Proxima acao</div>
            <div>Atualizado</div>
          </div>

          {model.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-7 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-[#F8F5EF] text-sm font-semibold text-[#6B655C]">
                ST
              </div>
              <div className="mt-4 text-sm font-semibold text-[#111111]">
                Nenhum registro encontrado
              </div>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#8D867B]">
                Ajuste os filtros ou abra um dos formularios publicos para
                registrar novas entradas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {model.rows.map((row) => (
                <OperationalRow key={`${row.sourceTable}:${row.id}`} row={row} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-black/8 bg-[#F8F5EF] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
        {value}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition ${
        active
          ? "border-[#111111] bg-[#111111] text-white"
          : "border-black/10 bg-[#F8F5EF] text-[#111111] hover:bg-[#F0EDE6]"
      }`}
    >
      {label}
    </Link>
  );
}

function OperationalRow({ row }: { row: OperationalTableRow }) {
  const updatedAt = row.updatedAt ?? row.submittedAt ?? row.createdAt;

  return (
    <article className="bg-white px-6 py-5 xl:grid xl:grid-cols-[minmax(240px,1.5fr)_150px_120px_220px_minmax(180px,1fr)_130px] xl:items-center xl:gap-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${RISK_STYLES[row.riskLevel]}`}
          >
            Risco {riskLabel(row.riskLevel)}
          </span>
          <span className="font-mono text-[10px] text-[#9A9590]">
            {row.id.slice(0, 8)}
          </span>
        </div>
        <div className="mt-2 truncate text-sm font-semibold text-[#111111]">
          {row.title}
        </div>
        <div className="mt-1 truncate text-xs text-[#6B655C]">{row.subtitle}</div>
        {(row.primaryContactEmail || row.metadata.documentId) && (
          <div className="mt-1 truncate text-xs text-[#9A9590]">
            {row.primaryContactEmail ?? row.metadata.documentId}
          </div>
        )}
      </div>

      <div className="mt-4 xl:mt-0">
        <MobileLabel>Workflow</MobileLabel>
        <div className="text-sm font-medium text-[#111111]">{row.workflowLabel}</div>
        <div className="mt-1 text-[11px] font-mono text-[#9A9590]">
          {row.formVersion ?? "--"}
        </div>
      </div>

      <div className="mt-4 xl:mt-0">
        <MobileLabel>Status</MobileLabel>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[row.status]}`}
        >
          {row.statusLabel}
        </span>
      </div>

      <div className="mt-4 xl:mt-0">
        <MobileLabel>Sync</MobileLabel>
        <SyncStack row={row} />
      </div>

      <div className="mt-4 min-w-0 xl:mt-0">
        <MobileLabel>Proxima acao</MobileLabel>
        <div className="text-sm font-medium text-[#111111]">{row.nextAction}</div>
        {row.riskReasons.length > 0 && (
          <div className="mt-1 truncate text-xs text-[#8D867B]">
            {row.riskReasons.join(" / ")}
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {row.publicUrl && (
            <a
              href={row.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-[#111111] underline decoration-black/20 underline-offset-4"
            >
              Publico
            </a>
          )}
          {row.editUrl && (
            <a
              href={row.editUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-[#111111] underline decoration-black/20 underline-offset-4"
            >
              Editar
            </a>
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-[#6B655C] xl:mt-0">
        <MobileLabel>Atualizado</MobileLabel>
        {formatDate(updatedAt)}
      </div>
    </article>
  );
}

function SyncStack({ row }: { row: OperationalTableRow }) {
  const items: Array<[string, OperationalSyncStatus]> = [
    ["SB", row.sync.supabase],
    ["AT", row.sync.airtable],
    ["GD", row.sync.drive],
    ["EM", row.sync.email],
  ];

  return (
    <div className="grid gap-1.5">
      {items.map(([label, status]) => (
        <div key={`${row.id}-${label}`} className="flex items-center gap-2 text-xs">
          <span className={`h-2 w-2 rounded-full ${SYNC_STYLES[status]}`} />
          <span className="w-6 font-mono text-[10px] text-[#8D867B]">{label}</span>
          <span className="text-[#6B655C]">{SYNC_LABELS[status]}</span>
        </div>
      ))}
    </div>
  );
}

function MobileLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B] xl:hidden">
      {children}
    </div>
  );
}
