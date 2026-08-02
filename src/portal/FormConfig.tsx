import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Eye, EyeOff, FileSliders, Lock, RotateCcw } from 'lucide-react'
import { api, type FieldRequirement, type FormConfigRemote, type FormFieldConfigRemote } from '../lib/api'
import { HelpConfig } from './HelpConfig'

const REQUIREMENTS: { value: FieldRequirement; label: string; description: string }[] = [
  { value: 'optional', label: 'Opcional', description: 'Nunca bloqueia o preenchimento.' },
  { value: 'on_submit', label: 'No envio final', description: 'Pode avançar e completar depois.' },
  { value: 'on_step', label: 'Na etapa', description: 'Precisa preencher para avançar.' },
]

const WORKFLOWS = [
  { value: 'release_intake', label: 'Intake de lançamento' },
  { value: 'rights_clearance', label: 'Clearance de direitos' },
  { value: 'people_registry', label: 'Cadastro de pessoas' },
  { value: 'company_registry', label: 'Cadastro de empresa' },
] as const

const FEATURE_FIELDS = new Set(['track.audioAnalysis', 'track.lyricsSync'])
const CONTENT_PREFIXES = ['welcome.', 'footer.', 'intro.', 'review.', 'project.assetGuide']

function requirementLabel(value: FieldRequirement) {
  return REQUIREMENTS.find((item) => item.value === value)?.label ?? value
}

function FieldEditor({ field, onChange }: { field: FormFieldConfigRemote; onChange: (patch: Partial<FormFieldConfigRemote>) => void }) {
  const isFeature = FEATURE_FIELDS.has(field.key)
  const isContent = CONTENT_PREFIXES.some((prefix) => field.key.startsWith(prefix))
  return (
    <article className={`rounded-2xl border p-4 ${field.visible ? 'border-[#512314]/15 bg-white/35' : 'border-dashed border-[#512314]/15 bg-[#512314]/[0.03]'}`}>
      <div className="flex flex-wrap items-start gap-3">
        <button type="button" disabled={field.locked} aria-label={field.visible ? `Ocultar ${field.label}` : `Exibir ${field.label}`}
          onClick={() => onChange({ visible: !field.visible })}
          className="mt-0.5 rounded-full border border-[#512314]/20 p-2 text-[#512314] disabled:cursor-not-allowed disabled:opacity-40">
          {field.visible ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[13px] font-bold text-[#512314]">{field.label}</h4>
            {field.locked ? <span title={field.lock_reason} className="inline-flex items-center gap-1 rounded-full bg-[#512314]/8 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#512314]/60"><Lock size={10} /> protegido</span> : null}
            {!field.visible ? <span className="rounded-full bg-[#512314]/8 px-2 py-0.5 text-[9px] font-bold uppercase text-[#512314]/50">oculto</span> : null}
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-[#512314]/40">{field.key}</p>
          {field.locked ? <p className="mt-1 text-[10px] text-[#8a5b00]">{field.lock_reason}</p> : null}
        </div>
        {isFeature || isContent ? <span className="rounded-full bg-[#329fd7]/12 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#1f6f9e]">{isFeature ? 'Recurso auxiliar' : 'Bloco de conteúdo'}</span> : <label className="min-w-40 text-[10px] font-bold uppercase tracking-wide text-[#512314]/50">
          Exigência
          <select value={field.requirement} disabled={field.locked || !field.visible}
            onChange={(event) => onChange({ requirement: event.target.value as FieldRequirement })}
            className="mt-1 block w-full rounded-xl border border-[#512314]/20 bg-white/60 px-3 py-2 text-[12px] font-semibold normal-case text-[#512314] disabled:opacity-50">
            {REQUIREMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>}
      </div>

      <details className="mt-3 border-t border-[#512314]/10 pt-3">
        <summary className="cursor-pointer text-[11px] font-semibold text-[#512314]/60">Personalizar texto</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-[10px] font-bold uppercase tracking-wide text-[#512314]/50">{isContent ? 'Título ou texto principal' : 'Label'}
            <input value={field.label} onChange={(event) => onChange({ label: event.target.value })}
              className="mt-1 w-full rounded-xl border border-[#512314]/20 bg-white/60 px-3 py-2 text-[12px] normal-case text-[#512314]" />
          </label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-[#512314]/50">{isFeature ? 'Texto do botão' : isContent ? 'Palavra de destaque / complemento' : 'Placeholder'}
            <input value={field.placeholder} onChange={(event) => onChange({ placeholder: event.target.value })}
              className="mt-1 w-full rounded-xl border border-[#512314]/20 bg-white/60 px-3 py-2 text-[12px] normal-case text-[#512314]" />
          </label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-[#512314]/50 sm:col-span-2">{isContent ? 'Texto complementar' : 'Descrição de ajuda'}
            <textarea rows={2} value={field.hint} onChange={(event) => onChange({ hint: event.target.value })}
              className="mt-1 w-full rounded-xl border border-[#512314]/20 bg-white/60 px-3 py-2 text-[12px] font-normal normal-case text-[#512314]" />
          </label>
        </div>
      </details>
    </article>
  )
}

export function FormConfig({ workspace }: { workspace: string }) {
  const [workflowType, setWorkflowType] = useState<(typeof WORKFLOWS)[number]['value']>('release_intake')
  const [config, setConfig] = useState<FormConfigRemote | null>(null)
  const [published, setPublished] = useState<FormConfigRemote | null>(null)
  const [selectedStep, setSelectedStep] = useState('identificacao')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    let active = true
    void api.getFormConfig(workspace, workflowType).then((result) => {
      if (!active) return
      setConfig(result)
      setPublished(result)
      const firstStep = result ? Object.keys(result.steps)[0] : undefined
      if (firstStep) setSelectedStep(firstStep)
      if (!result) setMessage({ ok: false, text: 'Não foi possível carregar a configuração do formulário.' })
    })
    return () => { active = false }
  }, [workspace, workflowType])

  const fields = useMemo(
    () => config ? Object.values(config.fields).filter((field) => field.step === selectedStep) : [],
    [config, selectedStep],
  )
  const changed = config && published
    ? JSON.stringify(config.fields) !== JSON.stringify(published.fields)
    : false

  function updateField(key: string, patch: Partial<FormFieldConfigRemote>) {
    setConfig((current) => current ? {
      ...current,
      fields: { ...current.fields, [key]: { ...current.fields[key], ...patch } },
    } : current)
  }

  async function publish() {
    if (!config) return
    setSaving(true)
    setMessage(null)
    const result = await api.patchFormConfig(workspace, {
      fields: Object.fromEntries(Object.values(config.fields).map((field) => [field.key, {
        visible: field.visible,
        requirement: field.requirement,
        label: field.label,
        hint: field.hint,
        placeholder: field.placeholder,
      }])),
    }, workflowType)
    setSaving(false)
    if (!result) {
      setMessage({ ok: false, text: 'Não foi possível publicar. Confira a sessão do portal e tente novamente.' })
      return
    }
    setConfig(result)
    setPublished(result)
    setMessage({ ok: true, text: 'Formulário publicado. Novos acessos já usam esta configuração.' })
  }

  if (!config) return <div className="mt-6 text-sm text-[#512314]/60">Carregando configuração do formulário…</div>

  return (
    <div className="mt-6 space-y-5">
      <HelpConfig workspace={workspace} />
      <section className="sun-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <FileSliders className="mt-0.5 text-[#329fd7]" size={20} />
            <div>
              <h2 className="text-[15px] font-bold text-[#512314]">Campos dos formulários</h2>
              <p className="mt-0.5 max-w-2xl text-[12px] text-[#512314]/60">Escolha quando cada informação será exigida, oculte o que não faz parte da operação e ajuste os textos exibidos. Alterações só entram no ar ao publicar.</p>
            </div>
          </div>
          <label className="min-w-56 text-[10px] font-bold uppercase tracking-wide text-[#512314]/50">
            Formulário
            <select value={workflowType} onChange={(event) => {
              setConfig(null); setPublished(null); setMessage(null)
              setWorkflowType(event.target.value as typeof workflowType)
            }}
              className="mt-1 block w-full rounded-xl border border-[#512314]/20 bg-white/60 px-3 py-2 text-[12px] font-semibold normal-case text-[#512314]">
              {WORKFLOWS.map((workflow) => <option key={workflow.value} value={workflow.value}>{workflow.label}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button type="button" disabled={!changed || saving} onClick={() => { setConfig(published); setMessage(null) }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#512314]/20 px-3 py-2 text-[11px] font-bold text-[#512314] disabled:opacity-40">
              <RotateCcw size={13} /> Descartar
            </button>
            <button type="button" disabled={!changed || saving} onClick={publish}
              className="rounded-full bg-[#512314] px-5 py-2 text-[12px] font-bold text-[#ebdbba] disabled:opacity-40">
              {saving ? 'Publicando…' : 'Publicar formulário'}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-b border-[#512314]/12 pb-3">
          {Object.keys(config.steps).map((step) => {
            const stepFields = Object.values(config.fields).filter((field) => field.step === step)
            const visibleCount = stepFields.filter((field) => field.visible).length
            return (
              <button key={step} type="button" onClick={() => setSelectedStep(step)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${selectedStep === step ? 'bg-[#512314] text-[#ebdbba]' : 'bg-[#512314]/7 text-[#512314]/65'}`}>
                {config.steps[step] ?? step} · {visibleCount}/{stepFields.length}
              </button>
            )
          })}
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-[1.45fr_.75fr]">
          <div className="space-y-3">
            {fields.map((field) => <FieldEditor key={field.key} field={field} onChange={(patch) => updateField(field.key, patch)} />)}
          </div>

          <aside className="h-fit rounded-3xl border-2 border-[#512314]/12 bg-[#ebdbba]/55 p-4 lg:sticky lg:top-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#512314]/45">Prévia da etapa</p>
            <h3 className="mt-1 font-display text-xl font-black text-[#512314]">{config.steps[selectedStep]}</h3>
            <div className="mt-4 space-y-3">
              {fields.filter((field) => field.visible).map((field) => (
                <div key={field.key} className="rounded-2xl border border-[#512314]/12 bg-white/50 p-3">
                  <p className="text-[12px] font-bold text-[#512314]">{field.label}{FEATURE_FIELDS.has(field.key) || CONTENT_PREFIXES.some((prefix) => field.key.startsWith(prefix)) || field.requirement === 'optional' ? '' : ' *'}</p>
                  {field.hint ? <p className="mt-0.5 text-[10px] text-[#512314]/55">{field.hint}</p> : null}
                  <div className="mt-2 rounded-xl border border-[#512314]/15 bg-white/70 px-3 py-2 text-[10px] text-[#512314]/35">{field.placeholder || (FEATURE_FIELDS.has(field.key) ? 'Recurso visível no formulário' : 'Campo do formulário')}</div>
                  <p className="mt-1.5 text-[9px] font-semibold text-[#512314]/45">{FEATURE_FIELDS.has(field.key) ? 'Recurso auxiliar' : CONTENT_PREFIXES.some((prefix) => field.key.startsWith(prefix)) ? 'Bloco de conteúdo' : requirementLabel(field.requirement)}</p>
                </div>
              ))}
              {fields.every((field) => !field.visible) ? <p className="rounded-xl bg-white/40 p-3 text-[11px] text-[#512314]/60">Nenhum campo visível nesta etapa.</p> : null}
            </div>
          </aside>
        </div>

        {message ? (
          <p className={`mt-4 flex items-center gap-1.5 text-[12px] font-semibold ${message.ok ? 'text-[#166534]' : 'text-red-700'}`}>
            {message.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{message.text}
          </p>
        ) : null}
      </section>
    </div>
  )
}
