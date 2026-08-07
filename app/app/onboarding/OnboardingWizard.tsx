"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  OnboardingInitialData,
  OnboardingPreview,
  WorkspaceOnboardingProfile,
} from "@/lib/onboarding/types";

type WorkflowOption = {
  workflowType: string;
  label: string;
  description: string;
  allowed: boolean;
};

const OPERATION_OPTIONS = [
  ["label", "Label", "Gravadora"],
  ["artist_management", "Artist management", "Gestão artística"],
  ["publisher", "Publisher", "Editora"],
  ["agency", "Creative agency", "Agência criativa"],
  ["distributor", "Distributor", "Distribuidora"],
  ["independent_artist", "Independent artist", "Artista independente"],
  ["other", "Other", "Outro"],
] as const;

const INTEGRATION_OPTIONS = [
  ["airtable", "Airtable"],
  ["google_drive", "Google Drive"],
  ["email", "E-mail"],
  ["slack", "Slack"],
  ["webhooks", "Webhooks"],
] as const;

const COPY = {
  en: {
    eyebrow: "Guided onboarding · MotoSchema",
    title: "Turn your operation into a ready workspace.",
    intro: "Describe how you work, review the generated access map and confirm it. Nothing is applied before your approval.",
    steps: ["Operation", "Workflows", "Priorities", "Review"],
    operationTitle: "What kind of operation are you setting up?",
    team: "Team size",
    volume: "Monthly volume",
    workflowsTitle: "Choose the workflows you want active",
    workflowsIntro: "Your plan controls what can be activated. Release Intake remains the Free foundation, including file auditing.",
    included: "Included",
    locked: "Requires upgrade",
    prioritiesTitle: "What should Sunbeat connect first?",
    goal: "Primary goal",
    goalPlaceholder: "Example: stop receiving incomplete release assets by email.",
    reviewTitle: "Review the MotoSchema preview",
    reviewIntro: "The preview is signed and expires in 30 minutes. Applying it requires this explicit confirmation.",
    generate: "Generate secure preview",
    generating: "Generating preview…",
    apply: "Confirm and finish onboarding",
    applying: "Applying configuration…",
    back: "Back",
    next: "Continue",
    ready: "Workspace ready",
    readyBody: "Your operational profile and workflow access were saved with an audit trail.",
    dashboard: "Open dashboard",
    plan: "Continue to plan activation",
    error: "We could not complete this step. Please try again.",
    saved: "Already configured. You can review and update it safely at any time.",
  },
  pt: {
    eyebrow: "Onboarding guiado · MotoSchema",
    title: "Transforme sua operação em um workspace pronto.",
    intro: "Descreva como você trabalha, revise o mapa de acesso gerado e confirme. Nada é aplicado antes da sua aprovação.",
    steps: ["Operação", "Workflows", "Prioridades", "Revisão"],
    operationTitle: "Que tipo de operação você está configurando?",
    team: "Tamanho da equipe",
    volume: "Volume mensal",
    workflowsTitle: "Escolha os workflows que ficarão ativos",
    workflowsIntro: "Seu plano define o que pode ser ativado. O Release Intake continua sendo a base do Free, incluindo auditoria de arquivos.",
    included: "Incluído",
    locked: "Requer upgrade",
    prioritiesTitle: "O que a Sunbeat deve conectar primeiro?",
    goal: "Objetivo principal",
    goalPlaceholder: "Ex.: parar de receber assets incompletos de lançamento por e-mail.",
    reviewTitle: "Revise a prévia do MotoSchema",
    reviewIntro: "A prévia é assinada e expira em 30 minutos. A aplicação exige esta confirmação explícita.",
    generate: "Gerar prévia segura",
    generating: "Gerando prévia…",
    apply: "Confirmar e concluir onboarding",
    applying: "Aplicando configuração…",
    back: "Voltar",
    next: "Continuar",
    ready: "Workspace pronto",
    readyBody: "Seu perfil operacional e os acessos aos workflows foram salvos com trilha de auditoria.",
    dashboard: "Abrir dashboard",
    plan: "Continuar para ativar o plano",
    error: "Não foi possível concluir esta etapa. Tente novamente.",
    saved: "Já configurado. Você pode revisar e atualizar com segurança a qualquer momento.",
  },
} as const;

export default function OnboardingWizard({
  initialData,
  workflows,
  locale,
  planIntent,
}: {
  initialData: OnboardingInitialData;
  workflows: WorkflowOption[];
  locale: "en" | "pt-BR";
  planIntent: "starter" | "pro" | null;
}) {
  const copy = locale === "pt-BR" ? COPY.pt : COPY.en;
  const [step, setStep] = useState(initialData.completedAt ? 3 : 0);
  const [profile, setProfile] = useState<WorkspaceOnboardingProfile>(initialData.profile);
  const [preview, setPreview] = useState<OnboardingPreview | null>(null);
  const [loading, setLoading] = useState<"preview" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const selected = useMemo(() => new Set(profile.workflowTypes), [profile.workflowTypes]);

  function patchProfile(patch: Partial<WorkspaceOnboardingProfile>) {
    setProfile((current) => ({ ...current, ...patch }));
    setPreview(null);
    setError(null);
  }

  function toggleWorkflow(workflowType: string) {
    if (workflowType === "release_intake") return;
    const next = new Set(profile.workflowTypes);
    if (next.has(workflowType)) next.delete(workflowType);
    else next.add(workflowType);
    patchProfile({ workflowTypes: Array.from(next) });
  }

  function toggleIntegration(integration: WorkspaceOnboardingProfile["integrations"][number]) {
    const next = new Set(profile.integrations);
    if (next.has(integration)) next.delete(integration);
    else next.add(integration);
    patchProfile({ integrations: Array.from(next) });
  }

  async function run(operation: "preview_patch" | "apply_patch") {
    setLoading(operation === "preview_patch" ? "preview" : "apply");
    setError(null);
    try {
      const response = await fetch(
        `/api/workspaces/${encodeURIComponent(initialData.workspaceSlug)}/onboarding`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation,
            profile,
            preview_token: operation === "apply_patch" ? preview?.previewToken : undefined,
          }),
        }
      );
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || copy.error);
      if (operation === "preview_patch") {
        setPreview(payload.data);
        setProfile(payload.data.profile);
      } else {
        setCompleted(true);
      }
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : copy.error);
    } finally {
      setLoading(null);
    }
  }

  if (completed) {
    return (
      <section className="mx-auto max-w-3xl rounded-[32px] border border-emerald-200 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)] md:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl text-white">✓</div>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">{copy.ready}</h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[#625A51]">{copy.readyBody}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/app" className="rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white">
            {copy.dashboard}
          </Link>
          {planIntent ? (
            <Link
              href={`/app/settings/plan?plan_intent=${planIntent}`}
              className="rounded-2xl border border-black/10 bg-[#F8F5EF] px-5 py-3 text-sm font-semibold"
            >
              {copy.plan}
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <section className="rounded-[32px] border border-black/8 bg-[#111111] p-7 text-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] md:p-9">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">{copy.eyebrow}</div>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.045em] md:text-5xl">{copy.title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">{copy.intro}</p>
        {initialData.completedAt ? <p className="mt-3 text-xs text-emerald-300">{copy.saved}</p> : null}
        <div className="mt-7 grid grid-cols-4 gap-2">
          {copy.steps.map((label, index) => (
            <button key={label} type="button" onClick={() => index <= step && setStep(index)} className="text-left">
              <span className={`block h-1.5 rounded-full ${index <= step ? "bg-amber-300" : "bg-white/15"}`} />
              <span className={`mt-2 block text-[10px] font-semibold uppercase tracking-[0.12em] ${index === step ? "text-white" : "text-white/40"}`}>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-black/8 bg-white p-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)] md:p-9">
        {step === 0 ? (
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.035em]">{copy.operationTitle}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {OPERATION_OPTIONS.map(([value, en, pt]) => (
                <button key={value} type="button" onClick={() => patchProfile({ operationType: value })} className={`rounded-[20px] border p-4 text-left text-sm font-semibold transition ${profile.operationType === value ? "border-amber-400 bg-amber-50" : "border-black/8 bg-[#FAFAF8] hover:border-black/20"}`}>
                  {locale === "pt-BR" ? pt : en}
                </button>
              ))}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <SelectField label={copy.team} value={profile.teamSize} options={["1", "2-5", "6-15", "16+"]} onChange={(value) => patchProfile({ teamSize: value as WorkspaceOnboardingProfile["teamSize"] })} />
              <SelectField label={copy.volume} value={profile.monthlyVolume} options={["1-10", "11-50", "51-200", "200+"]} onChange={(value) => patchProfile({ monthlyVolume: value as WorkspaceOnboardingProfile["monthlyVolume"] })} />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.035em]">{copy.workflowsTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#625A51]">{copy.workflowsIntro}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {workflows.map((workflow) => {
                const isSelected = selected.has(workflow.workflowType);
                return (
                  <button key={workflow.workflowType} type="button" disabled={!workflow.allowed || workflow.workflowType === "release_intake"} onClick={() => toggleWorkflow(workflow.workflowType)} className={`rounded-[22px] border p-5 text-left transition ${isSelected ? "border-emerald-300 bg-emerald-50" : "border-black/8 bg-[#FAFAF8]"} disabled:cursor-not-allowed ${!workflow.allowed ? "opacity-55" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold">{workflow.label}</span>
                      <span className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${workflow.allowed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{workflow.allowed ? copy.included : copy.locked}</span>
                    </div>
                    <p className="mt-2 text-xs leading-6 text-[#6B655C]">{workflow.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.035em]">{copy.prioritiesTitle}</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {INTEGRATION_OPTIONS.map(([value, label]) => (
                <button key={value} type="button" onClick={() => toggleIntegration(value)} className={`rounded-full border px-4 py-2.5 text-sm font-semibold ${profile.integrations.includes(value) ? "border-amber-400 bg-amber-50" : "border-black/10 bg-[#FAFAF8]"}`}>{label}</button>
              ))}
            </div>
            <label className="mt-7 block text-sm font-semibold">
              {copy.goal}
              <textarea value={profile.primaryGoal} onChange={(event) => patchProfile({ primaryGoal: event.target.value })} placeholder={copy.goalPlaceholder} className="mt-2 min-h-32 w-full rounded-[20px] border border-black/10 bg-[#FAFAF8] p-4 text-sm font-normal outline-none focus:border-amber-400" />
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.035em]">{copy.reviewTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#625A51]">{copy.reviewIntro}</p>
            <button type="button" disabled={Boolean(loading)} onClick={() => run("preview_patch")} className="mt-6 rounded-2xl border border-black/10 bg-[#F8F5EF] px-5 py-3 text-sm font-semibold disabled:opacity-50">
              {loading === "preview" ? copy.generating : copy.generate}
            </button>
            {preview ? (
              <div className="mt-6 grid gap-3">
                {preview.changes.map((change) => (
                  <div key={change.key} className="rounded-[20px] border border-black/8 bg-[#FAFAF8] p-4">
                    <div className="text-sm font-semibold">{change.title}</div>
                    <p className="mt-1 text-xs leading-6 text-[#625A51]">{change.detail}</p>
                  </div>
                ))}
                {preview.warnings.map((warning) => <p key={warning} className="rounded-[18px] border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">{warning}</p>)}
                <button type="button" disabled={Boolean(loading)} onClick={() => run("apply_patch")} className="mt-2 rounded-2xl bg-[#111111] px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-50">
                  {loading === "apply" ? copy.applying : copy.apply}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mt-5 rounded-[16px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}

        <div className="mt-8 flex items-center justify-between border-t border-black/8 pt-5">
          <button type="button" disabled={step === 0 || Boolean(loading)} onClick={() => setStep((current) => Math.max(0, current - 1))} className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold disabled:opacity-35">{copy.back}</button>
          {step < 3 ? <button type="button" onClick={() => setStep((current) => Math.min(3, current + 1))} className="rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white">{copy.next}</button> : null}
        </div>
      </section>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-12 w-full rounded-[18px] border border-black/10 bg-[#FAFAF8] px-4 text-sm font-normal outline-none focus:border-amber-400">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
