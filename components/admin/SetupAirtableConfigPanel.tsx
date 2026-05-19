"use client";

import { useMemo, useState } from "react";

import {
  SETUP_AI_AIRTABLE_WORKFLOWS,
  SetupAiAirtableResponse,
  SetupAiAirtableWorkflow,
  SyncMode,
  buildSetupAiAirtablePatch,
  stableJson,
} from "@/lib/setup-ai/airtable-config";

type Props = {
  workspaceSlug: string;
};

type PanelRequestState = "idle" | "reading" | "previewing" | "applying";

const EMPTY_PATCH_DRAFT = {
  syncMode: "keep" as SyncMode,
  baseIdOverride: "",
  tableOverride: "",
  mergeKeysJson: "",
  fieldMapJson: "",
};

export default function SetupAirtableConfigPanel({ workspaceSlug }: Props) {
  const [workspaceInput, setWorkspaceInput] = useState(workspaceSlug);
  const [workflowType, setWorkflowType] =
    useState<SetupAiAirtableWorkflow>("company_registry");
  const [syncMode, setSyncMode] = useState<SyncMode>("keep");
  const [baseIdOverride, setBaseIdOverride] = useState("");
  const [tableOverride, setTableOverride] = useState("");
  const [mergeKeysJson, setMergeKeysJson] = useState("");
  const [fieldMapJson, setFieldMapJson] = useState("");
  const [current, setCurrent] = useState<SetupAiAirtableResponse | null>(null);
  const [preview, setPreview] = useState<SetupAiAirtableResponse | null>(null);
  const [applied, setApplied] = useState<SetupAiAirtableResponse | null>(null);
  const [requestState, setRequestState] = useState<PanelRequestState>("idle");
  const [error, setError] = useState("");
  const [confirmApply, setConfirmApply] = useState(false);
  const [lastPreviewSignature, setLastPreviewSignature] = useState("");

  const patchDraft = useMemo(
    () => ({
      syncMode,
      baseIdOverride,
      tableOverride,
      mergeKeysJson,
      fieldMapJson,
    }),
    [baseIdOverride, fieldMapJson, mergeKeysJson, syncMode, tableOverride]
  );

  const patchBuild = useMemo(
    () => buildSetupAiAirtablePatch(patchDraft),
    [patchDraft]
  );

  const patchSignature = patchBuild.ok
    ? stableJson({
        workspaceSlug: workspaceInput.trim(),
        workflowType,
        patch: patchBuild.payload,
      })
    : "";
  const canApply =
    Boolean(preview) &&
    Boolean(patchSignature) &&
    patchSignature === lastPreviewSignature &&
    confirmApply &&
    requestState === "idle";

  function resetPatchFeedback() {
    setPreview(null);
    setApplied(null);
    setConfirmApply(false);
    setLastPreviewSignature("");
  }

  function resetPatchDraft() {
    setSyncMode(EMPTY_PATCH_DRAFT.syncMode);
    setBaseIdOverride(EMPTY_PATCH_DRAFT.baseIdOverride);
    setTableOverride(EMPTY_PATCH_DRAFT.tableOverride);
    setMergeKeysJson(EMPTY_PATCH_DRAFT.mergeKeysJson);
    setFieldMapJson(EMPTY_PATCH_DRAFT.fieldMapJson);
    resetPatchFeedback();
  }

  async function callSetupAiAirtable(
    payload: Record<string, unknown>,
    nextState: PanelRequestState
  ) {
    const slug = workspaceInput.trim();
    if (!slug) {
      throw new Error("workspace_slug is required.");
    }

    setRequestState(nextState);
    setError("");

    const response = await fetch(
      `/api/workspaces/${encodeURIComponent(slug)}/setup-ai/airtable`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          workflow_type: workflowType,
        }),
      }
    );
    const data = (await response.json().catch(() => null)) as
      | SetupAiAirtableResponse
      | null;

    if (!response.ok || !data?.ok) {
      const message =
        data?.error ||
        (typeof data?.detail === "string"
          ? data.detail
          : data?.detail
            ? stableJson(data.detail)
            : "") ||
        "Setup AI Airtable request failed.";
      throw new Error(message);
    }

    return data;
  }

  async function handleRead() {
    try {
      resetPatchFeedback();
      const data = await callSetupAiAirtable({ operation: "read" }, "reading");
      setCurrent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load config.");
    } finally {
      setRequestState("idle");
    }
  }

  async function handlePreview() {
    if (!patchBuild.ok) {
      setError(patchBuild.error);
      return;
    }

    try {
      setApplied(null);
      setConfirmApply(false);
      const data = await callSetupAiAirtable(
        {
          operation: "preview_patch",
          ...patchBuild.payload,
        },
        "previewing"
      );
      setPreview(data);
      setLastPreviewSignature(patchSignature);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not preview patch.");
    } finally {
      setRequestState("idle");
    }
  }

  async function handleApply() {
    if (!patchBuild.ok) {
      setError(patchBuild.error);
      return;
    }

    if (!canApply) {
      setError("Preview the current patch and confirm before applying.");
      return;
    }

    try {
      const data = await callSetupAiAirtable(
        {
          operation: "apply_patch",
          confirm_apply: true,
          ...patchBuild.payload,
        },
        "applying"
      );
      setApplied(data);
      setCurrent(data);
      setPreview(null);
      setConfirmApply(false);
      setLastPreviewSignature("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply patch.");
    } finally {
      setRequestState("idle");
    }
  }

  const selectedWorkflow = SETUP_AI_AIRTABLE_WORKFLOWS.find(
    (workflow) => workflow.value === workflowType
  );
  const disabled = requestState !== "idle";
  const metadataWarnings = patchBuild.ok ? patchBuild.metadataWarnings : [];

  return (
    <section className="glass-panel-strong premium-border rounded-[32px] p-7 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="sunbeat-badge">
          <span className="sunbeat-dot" />
          Setup AI Airtable
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/50">
          Structured read, preview and apply
        </span>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
            Airtable configuration,
            <span className="block text-white/60">with human confirmation.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
            This internal surface reads the same Airtable contract used by the
            backend, previews a structured patch, and only writes after an
            explicit confirmation. It does not run syncs or interpret free text.
          </p>
        </div>

        <div className="rounded-[24px] border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-7 text-amber-100/85">
          <div className="font-semibold text-amber-100">Runtime guardrail</div>
          <p className="mt-1">
            <code className="font-mono">merge_keys</code> and{" "}
            <code className="font-mono">field_map</code> remain metadata-only in
            this phase. Sync services keep their existing runtime behavior.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="font-semibold text-white">workspace_slug</span>
              <input
                value={workspaceInput}
                onChange={(event) => {
                  setWorkspaceInput(event.target.value);
                  resetPatchFeedback();
                }}
                className="rounded-[18px] border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/30"
                placeholder="atabaque"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-semibold text-white">workflow_type</span>
              <select
                value={workflowType}
                onChange={(event) => {
                  setWorkflowType(event.target.value as SetupAiAirtableWorkflow);
                  resetPatchFeedback();
                }}
                className="rounded-[18px] border border-white/15 bg-[#171717] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-white/30"
              >
                {SETUP_AI_AIRTABLE_WORKFLOWS.map((workflow) => (
                  <option key={workflow.value} value={workflow.value}>
                    {workflow.label}
                    {" -> "}
                    {workflow.tableLabel}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-semibold text-white">airtable_sync_enabled</span>
              <select
                value={syncMode}
                onChange={(event) => {
                  setSyncMode(event.target.value as SyncMode);
                  resetPatchFeedback();
                }}
                className="rounded-[18px] border border-white/15 bg-[#171717] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-white/30"
              >
                <option value="keep">Keep current value</option>
                <option value="enabled">Set enabled</option>
                <option value="disabled">Set disabled</option>
              </select>
            </label>

            <FieldInput
              label="base_id_override"
              value={baseIdOverride}
              placeholder="app..."
              onChange={(value) => {
                setBaseIdOverride(value);
                resetPatchFeedback();
              }}
            />

            <FieldInput
              label="table_override"
              value={tableOverride}
              placeholder={selectedWorkflow?.tableLabel ?? "[V2] - Empresas"}
              onChange={(value) => {
                setTableOverride(value);
                resetPatchFeedback();
              }}
            />

            <JsonTextarea
              label="merge_keys"
              value={mergeKeysJson}
              placeholder={'[\n  {\n    "source": "document",\n    "airtable_field": "Documento",\n    "priority": 1\n  }\n]'}
              onChange={(value) => {
                setMergeKeysJson(value);
                resetPatchFeedback();
              }}
            />

            <JsonTextarea
              label="field_map"
              value={fieldMapJson}
              placeholder={'{\n  "form.company_name": "Nome da empresa"\n}'}
              onChange={(value) => {
                setFieldMapJson(value);
                resetPatchFeedback();
              }}
            />

            {metadataWarnings.length > 0 && (
              <div className="rounded-[20px] border border-amber-300/20 bg-amber-300/10 p-4 text-xs leading-6 text-amber-100/80">
                {metadataWarnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-[20px] border border-red-400/25 bg-red-400/10 p-4 text-sm leading-6 text-red-100">
                {error}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleRead}
                disabled={disabled}
                className="sunbeat-button sunbeat-button-secondary disabled:cursor-not-allowed disabled:opacity-45"
              >
                {requestState === "reading" ? "Loading..." : "Load current"}
              </button>
              <button
                type="button"
                onClick={resetPatchDraft}
                disabled={disabled}
                className="sunbeat-button sunbeat-button-secondary disabled:cursor-not-allowed disabled:opacity-45"
              >
                Reset patch
              </button>
              <button
                type="button"
                onClick={handlePreview}
                disabled={disabled || !patchBuild.ok}
                className="sunbeat-button sunbeat-button-primary disabled:cursor-not-allowed disabled:opacity-45"
              >
                {requestState === "previewing" ? "Previewing..." : "Preview changes"}
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!canApply}
                className="sunbeat-button sunbeat-button-primary disabled:cursor-not-allowed disabled:opacity-45"
              >
                {requestState === "applying" ? "Applying..." : "Apply changes"}
              </button>
            </div>

            <label className="flex items-start gap-3 rounded-[20px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/65">
              <input
                type="checkbox"
                checked={confirmApply}
                onChange={(event) => setConfirmApply(event.target.checked)}
                disabled={!preview || disabled}
                className="mt-1 h-4 w-4 accent-white"
              />
              <span>
                I reviewed the latest preview and want to persist this patch to
                <code className="mx-1 font-mono text-white/85">
                  workspace_workflow_settings.extra_settings.airtable
                </code>
                .
              </span>
            </label>
          </div>
        </div>

        <div className="grid gap-5">
          <JsonBlock
            title="Current config"
            description="Loaded through read."
            data={current}
            empty="Load current config to inspect effective, raw, origins and warnings."
          />
          <JsonBlock
            title="Patch draft"
            description="This is the structured payload that will be previewed."
            data={patchBuild.ok ? patchBuild.payload : { error: patchBuild.error }}
          />
          <JsonBlock
            title="Preview result"
            description="Projected response from preview_patch. This does not persist."
            data={preview}
            empty="Preview a patch before enabling apply."
          />
          <JsonBlock
            title="Apply result"
            description="Final response returned after apply_patch."
            data={applied}
            empty="Apply result appears here after confirmation."
          />
        </div>
      </div>
    </section>
  );
}

function FieldInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-semibold text-white">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-[18px] border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/30"
        placeholder={placeholder}
      />
    </label>
  );
}

function JsonTextarea({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-semibold text-white">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        className="resize-y rounded-[18px] border border-white/15 bg-white/[0.06] px-4 py-3 font-mono text-xs leading-6 text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/30"
        placeholder={placeholder}
      />
    </label>
  );
}

function JsonBlock({
  title,
  description,
  data,
  empty,
}: {
  title: string;
  description: string;
  data?: unknown;
  empty?: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <p className="mt-1 text-xs leading-5 text-white/40">{description}</p>
        </div>
      </div>
      <pre className="mt-4 max-h-[360px] overflow-auto rounded-[20px] border border-white/10 bg-black/35 p-4 text-xs leading-6 text-white/70">
        {data ? stableJson(data) : empty}
      </pre>
    </div>
  );
}
