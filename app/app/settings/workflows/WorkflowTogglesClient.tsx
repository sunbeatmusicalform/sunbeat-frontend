"use client";

import type { WorkflowRegistryEntry } from "@/lib/form-engine/types";

type Props = {
  workflows: WorkflowRegistryEntry[];
  /** null = all enabled (DB default). Explicit array = only those enabled. */
  initialEnabled: string[] | null;
};

export function WorkflowTogglesClient({ workflows, initialEnabled }: Props) {
  const allTypes = workflows.map((workflow) => workflow.workflowType);
  const enabled = new Set(initialEnabled ?? allTypes);
  const hasDisabledWorkflows = allTypes.some((type) => !enabled.has(type));

  return (
    <div className="rounded-[28px] border border-black/8 bg-white px-7 py-6 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
            Visibilidade
          </div>
          <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.03em] text-[#111111]">
            Workflows ativos neste workspace
          </h2>
          <p className="mt-1 text-sm text-[#6B655C]">
            A persistencia de visibilidade por workflow nao esta incluida nesta
            PR. Esta lista mostra o estado atual em modo somente leitura.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 pt-1">
          <span className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/10 bg-[#F8F5EF] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#8D867B]">
            Somente leitura
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {workflows.map((workflow) => {
          const isOn = enabled.has(workflow.workflowType);
          const isPlanned = workflow.status === "planned";

          return (
            <div
              key={workflow.workflowType}
              className={`flex items-center justify-between gap-4 rounded-[20px] border px-4 py-3.5 text-left ${
                isPlanned
                  ? "border-black/6 bg-[#FAFAF8] opacity-60"
                  : isOn
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-black/8 bg-[#FAFAF8]"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#111111]">
                    {workflow.label}
                  </span>
                  {isPlanned ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                      draft
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 text-[11px] font-mono text-[#9A9590]">
                  {workflow.workflowType}
                </div>
              </div>

              <div
                className={`relative flex h-6 w-11 shrink-0 items-center rounded-full ${
                  isOn ? "bg-emerald-500" : "bg-[#D4D0CA]"
                }`}
                aria-label={isOn ? "Workflow ativo" : "Workflow desabilitado"}
              >
                <span
                  className={`absolute h-4 w-4 rounded-full bg-white shadow-sm ${
                    isOn ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {hasDisabledWorkflows ? (
        <p className="mt-3 text-[11px] text-[#8D867B]">
          Workflows fora da lista aparecem como desabilitados apenas no estado
          lido do workspace.
        </p>
      ) : null}
    </div>
  );
}
