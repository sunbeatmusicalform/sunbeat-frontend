"use client";

import { useState, useTransition } from "react";
import type { WorkflowRegistryEntry } from "@/lib/form-engine/types";

type Props = {
  workspaceSlug: string;
  workflows: WorkflowRegistryEntry[];
  /** null = all enabled (DB default). Explicit array = only those enabled. */
  initialEnabled: string[] | null;
};

export function WorkflowTogglesClient({ workspaceSlug, workflows, initialEnabled }: Props) {
  // null means all are enabled; we compute a Set for UI state
  const allTypes = workflows.map((w) => w.workflowType);
  const [enabled, setEnabled] = useState<Set<string>>(
    () => new Set(initialEnabled ?? allTypes)
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(workflowType: string) {
    setSaved(false);
    setError(null);
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(workflowType)) {
        next.delete(workflowType);
      } else {
        next.add(workflowType);
      }
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      setSaved(false);
      setError(null);
      try {
        // null = all enabled (clean state), explicit array = specific subset
        const allEnabled = allTypes.every((t) => enabled.has(t));
        const payload = allEnabled ? null : Array.from(enabled);

        const res = await fetch(`/api/workspaces/${workspaceSlug}/branding`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled_workflows: payload }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setError(json.error ?? "Erro ao salvar.");
        } else {
          setSaved(true);
        }
      } catch {
        setError("Erro de rede. Tente novamente.");
      }
    });
  }

  const hasChanges = (() => {
    const original = new Set(initialEnabled ?? allTypes);
    if (original.size !== enabled.size) return true;
    for (const t of Array.from(enabled)) {
      if (!original.has(t)) return true;
    }
    return false;
  })();

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
            Desabilitar um workflow não apaga dados — apenas retira o acesso ao formulário público.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 pt-1">
          {saved && (
            <span className="text-sm font-medium text-emerald-700">Salvo ✓</span>
          )}
          {error && (
            <span className="text-sm font-medium text-red-600">{error}</span>
          )}
          <button
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#111111] px-5 text-sm font-semibold text-white transition hover:bg-[#222222] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {workflows.map((wf) => {
          const isOn = enabled.has(wf.workflowType);
          const isPlanned = wf.status === "planned";
          return (
            <button
              key={wf.workflowType}
              onClick={() => !isPlanned && toggle(wf.workflowType)}
              disabled={isPlanned}
              className={`flex items-center justify-between gap-4 rounded-[20px] border px-4 py-3.5 text-left transition ${
                isPlanned
                  ? "cursor-not-allowed border-black/6 bg-[#FAFAF8] opacity-60"
                  : isOn
                  ? "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50"
                  : "border-black/8 bg-[#FAFAF8] hover:bg-[#F4F1EA]"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#111111]">{wf.label}</span>
                  {isPlanned && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                      draft
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[11px] font-mono text-[#9A9590]">
                  {wf.workflowType}
                </div>
              </div>

              {/* Toggle pill */}
              <div
                className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  isOn ? "bg-emerald-500" : "bg-[#D4D0CA]"
                }`}
              >
                <span
                  className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    isOn ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {!allTypes.every((t) => enabled.has(t)) && (
        <p className="mt-3 text-[11px] text-[#8D867B]">
          Atenção: workflows desabilitados continuam acessíveis via URL direta nesta versão.
          Enforcement de acesso público será adicionado em versão futura.
        </p>
      )}
    </div>
  );
}
