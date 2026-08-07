import { useEffect, useMemo, useState } from 'react'
import { Bot, Check, ChevronLeft, ChevronRight, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import {
  api,
  type OnboardingInitialRemote,
  type OnboardingIntegration,
  type OnboardingOperationType,
  type OnboardingPreviewRemote,
  type OnboardingProfileRemote,
} from '../lib/api'

const OPERATIONS: { value: OnboardingOperationType; en: string; pt: string }[] = [
  { value: 'label', en: 'Label', pt: 'Gravadora' },
  { value: 'artist_management', en: 'Artist management', pt: 'Gestão artística' },
  { value: 'publisher', en: 'Publisher', pt: 'Editora' },
  { value: 'agency', en: 'Creative agency', pt: 'Agência criativa' },
  { value: 'distributor', en: 'Distributor', pt: 'Distribuidora' },
  { value: 'independent_artist', en: 'Independent artist', pt: 'Artista independente' },
  { value: 'other', en: 'Other', pt: 'Outro' },
]

const INTEGRATIONS: { value: OnboardingIntegration; label: string }[] = [
  { value: 'airtable', label: 'Airtable' },
  { value: 'google_drive', label: 'Google Drive' },
  { value: 'email', label: 'E-mail' },
  { value: 'slack', label: 'Slack' },
  { value: 'webhooks', label: 'Webhooks' },
]

const WORKFLOWS = [
  { value: 'release_intake', en: 'Release Intake', pt: 'Intake de lançamentos', enBody: 'Metadata, assets and file auditing.', ptBody: 'Metadados, assets e auditoria de arquivos.' },
  { value: 'rights_clearance', en: 'Rights Clearance', pt: 'Liberação de direitos', enBody: 'Rights, participants and licensing.', ptBody: 'Direitos, participantes e licenciamento.' },
  { value: 'company_registry', en: 'Company Registry', pt: 'Cadastro de empresas', enBody: 'Contractual and operational company data.', ptBody: 'Dados contratuais e operacionais de empresas.' },
  { value: 'people_registry', en: 'People Registry', pt: 'Cadastro de pessoas', enBody: 'People, roles and payment information.', ptBody: 'Pessoas, funções e dados de pagamento.' },
]

const COPY = {
  en: {
    eyebrow: 'Guided onboarding · MotoSchema', title: 'Turn your operation into a ready workspace.',
    intro: 'Tell MotoSchema how you work. It prepares the access map; you review it before anything changes.',
    steps: ['Operation', 'Workflows', 'Priorities', 'Review'], operation: 'What kind of operation are you setting up?',
    team: 'Team size', volume: 'Monthly volume', workflows: 'Choose the workflows you want active',
    workflowNote: 'Your plan controls access. Release Intake and file auditing remain the Free foundation.',
    included: 'Included', locked: 'Requires upgrade', priorities: 'What should Sunbeat connect first?',
    goal: 'Primary goal', placeholder: 'Example: stop receiving incomplete release assets by email.',
    review: 'Review the secure MotoSchema preview', generate: 'Generate secure preview', generating: 'Generating…',
    apply: 'Confirm and finish onboarding', applying: 'Applying…', back: 'Back', next: 'Continue',
    done: 'Workspace ready', doneBody: 'The operational profile was saved with a complete audit trail.',
    update: 'This workspace is already configured. You can safely review and update it.',
    loadError: 'We could not load onboarding. Your session may have expired.', retry: 'Try again',
    assistant: ['First I need to understand your operation.', 'I will only show workflows included in your current plan.', 'Choose integration priorities; they can be connected later.', 'I will generate a signed preview. Nothing changes until you confirm.'],
  },
  pt: {
    eyebrow: 'Onboarding guiado · MotoSchema', title: 'Transforme sua operação em um workspace pronto.',
    intro: 'Conte ao MotoSchema como você trabalha. Ele prepara o mapa de acesso; você revisa antes de qualquer mudança.',
    steps: ['Operação', 'Workflows', 'Prioridades', 'Revisão'], operation: 'Que tipo de operação você está configurando?',
    team: 'Tamanho da equipe', volume: 'Volume mensal', workflows: 'Escolha os workflows que ficarão ativos',
    workflowNote: 'Seu plano define o acesso. O Release Intake e a auditoria de arquivos continuam sendo a base do Free.',
    included: 'Incluído', locked: 'Requer upgrade', priorities: 'O que a Sunbeat deve conectar primeiro?',
    goal: 'Objetivo principal', placeholder: 'Ex.: parar de receber assets incompletos de lançamento por e-mail.',
    review: 'Revise a prévia segura do MotoSchema', generate: 'Gerar prévia segura', generating: 'Gerando…',
    apply: 'Confirmar e concluir onboarding', applying: 'Aplicando…', back: 'Voltar', next: 'Continuar',
    done: 'Workspace pronto', doneBody: 'O perfil operacional foi salvo com uma trilha completa de auditoria.',
    update: 'Este workspace já foi configurado. Você pode revisar e atualizar com segurança.',
    loadError: 'Não foi possível carregar o onboarding. Sua sessão pode ter expirado.', retry: 'Tentar novamente',
    assistant: ['Primeiro preciso entender sua operação.', 'Vou mostrar apenas os workflows incluídos no seu plano atual.', 'Escolha prioridades de integração; a conexão pode ser feita depois.', 'Vou gerar uma prévia assinada. Nada muda até você confirmar.'],
  },
} as const

function isPortugueseDomain() {
  return typeof window !== 'undefined' && window.location.hostname.endsWith('.com.br')
}

export function OnboardingPanel({ workspace }: { workspace: string }) {
  const copy = isPortugueseDomain() ? COPY.pt : COPY.en
  const locale = isPortugueseDomain() ? 'pt' : 'en'
  const [initial, setInitial] = useState<OnboardingInitialRemote | null>(null)
  const [profile, setProfile] = useState<OnboardingProfileRemote | null>(null)
  const [preview, setPreview] = useState<OnboardingPreviewRemote | null>(null)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState<'initial' | 'preview' | 'apply' | null>('initial')
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const selectedWorkflows = useMemo(() => new Set(profile?.workflowTypes ?? []), [profile?.workflowTypes])

  async function load() {
    setLoading('initial')
    setError(null)
    const response = await api.getOnboarding(workspace)
    const data = response?.data
    if (!data) {
      setError(copy.loadError)
      setLoading(null)
      return
    }
    setInitial(data)
    setProfile(data.profile)
    setStep(data.completedAt ? 3 : 0)
    setLoading(null)
  }

  useEffect(() => {
    let cancelled = false
    api.getOnboarding(workspace).then((response) => {
      if (cancelled) return
      const data = response?.data
      if (!data) {
        setError(copy.loadError)
        setLoading(null)
        return
      }
      setInitial(data)
      setProfile(data.profile)
      setStep(data.completedAt ? 3 : 0)
      setLoading(null)
    })
    return () => { cancelled = true }
  }, [workspace, copy.loadError])

  function updateProfile(patch: Partial<OnboardingProfileRemote>) {
    setProfile((current) => current ? { ...current, ...patch } : current)
    setPreview(null)
    setError(null)
  }

  function toggleWorkflow(workflow: string) {
    if (!profile || workflow === 'release_intake' || !initial?.allowedWorkflowTypes.includes(workflow)) return
    const next = new Set(profile.workflowTypes)
    if (next.has(workflow)) next.delete(workflow)
    else next.add(workflow)
    updateProfile({ workflowTypes: Array.from(next) })
  }

  function toggleIntegration(integration: OnboardingIntegration) {
    if (!profile) return
    const next = new Set(profile.integrations)
    if (next.has(integration)) next.delete(integration)
    else next.add(integration)
    updateProfile({ integrations: Array.from(next) })
  }

  async function run(operation: 'preview_patch' | 'apply_patch') {
    if (!profile) return
    setLoading(operation === 'preview_patch' ? 'preview' : 'apply')
    setError(null)
    const response = await api.configureOnboarding(workspace, operation, profile, preview?.previewToken)
    if (!response.ok || !response.data) {
      setError(response.error ?? copy.loadError)
      setLoading(null)
      return
    }
    if (operation === 'preview_patch') {
      setPreview(response.data)
      setProfile(response.data.profile)
    } else {
      setCompleted(true)
    }
    setLoading(null)
  }

  if (loading === 'initial') {
    return <div className="mt-6 sun-card p-8 text-sm text-[#512314]/60">MotoSchema is preparing your workspace…</div>
  }

  if (!initial || !profile) {
    return (
      <div className="mt-6 sun-card p-7">
        <p className="text-sm font-semibold text-red-700">{error ?? copy.loadError}</p>
        <button type="button" onClick={() => void load()} className="mt-4 rounded-full bg-[#512314] px-5 py-2 text-sm font-bold text-[#ebdbba]">{copy.retry}</button>
      </div>
    )
  }

  if (completed) {
    return (
      <section className="mt-6 sun-card border border-emerald-700/20 p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 text-white"><Check size={24} /></div>
        <h2 className="mt-5 text-3xl font-bold text-[#512314]">{copy.done}</h2>
        <p className="mt-2 max-w-xl text-sm text-[#512314]/65">{copy.doneBody}</p>
        <button type="button" onClick={() => { setCompleted(false); void load() }} className="mt-6 rounded-full bg-[#512314] px-5 py-2.5 text-sm font-bold text-[#ebdbba]">{copy.review}</button>
      </section>
    )
  }

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <section className="rounded-3xl bg-[#512314] p-6 text-[#ebdbba] shadow-[0_20px_50px_rgba(81,35,20,0.18)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffbe45]">{copy.eyebrow}</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold leading-tight">{copy.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#ebdbba]/65">{copy.intro}</p>
          {initial.completedAt ? <p className="mt-3 text-xs font-semibold text-emerald-300">✓ {copy.update}</p> : null}
          <div className="mt-6 grid grid-cols-4 gap-2">
            {copy.steps.map((label, index) => (
              <button type="button" key={label} onClick={() => index <= step && setStep(index)} className="text-left" aria-current={index === step ? 'step' : undefined}>
                <span className={`block h-1 rounded-full ${index <= step ? 'bg-[#ffbe45]' : 'bg-white/15'}`} />
                <span className={`mt-2 block text-[9px] font-bold uppercase tracking-wide ${index === step ? 'text-white' : 'text-white/40'}`}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="sun-card p-6">
          {step === 0 ? (
            <div>
              <h3 className="text-xl font-bold text-[#512314]">{copy.operation}</h3>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {OPERATIONS.map((operation) => (
                  <button type="button" key={operation.value} onClick={() => updateProfile({ operationType: operation.value })} className={`rounded-2xl border p-3.5 text-left text-sm font-semibold transition ${profile.operationType === operation.value ? 'border-[#ffb53e] bg-[#ffb53e]/15 text-[#512314]' : 'border-[#512314]/12 bg-white/35 text-[#512314]/75 hover:border-[#512314]/30'}`}>
                    {locale === 'pt' ? operation.pt : operation.en}
                  </button>
                ))}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <SelectField label={copy.team} value={profile.teamSize} options={['1', '2-5', '6-15', '16+']} onChange={(value) => updateProfile({ teamSize: value as OnboardingProfileRemote['teamSize'] })} />
                <SelectField label={copy.volume} value={profile.monthlyVolume} options={['1-10', '11-50', '51-200', '200+']} onChange={(value) => updateProfile({ monthlyVolume: value as OnboardingProfileRemote['monthlyVolume'] })} />
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <h3 className="text-xl font-bold text-[#512314]">{copy.workflows}</h3>
              <p className="mt-2 text-sm leading-6 text-[#512314]/60">{copy.workflowNote}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {WORKFLOWS.map((workflow) => {
                  const allowed = initial.allowedWorkflowTypes.includes(workflow.value)
                  const selected = selectedWorkflows.has(workflow.value)
                  return (
                    <button type="button" key={workflow.value} disabled={!allowed || workflow.value === 'release_intake'} onClick={() => toggleWorkflow(workflow.value)} className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-emerald-700/30 bg-emerald-50/70' : 'border-[#512314]/12 bg-white/35'} ${!allowed ? 'cursor-not-allowed opacity-50' : ''}`}>
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-bold text-[#512314]">{locale === 'pt' ? workflow.pt : workflow.en}</span>
                        <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${allowed ? 'bg-emerald-700/10 text-emerald-800' : 'bg-[#ffb53e]/20 text-[#7a5100]'}`}>{allowed ? copy.included : copy.locked}</span>
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-[#512314]/60">{locale === 'pt' ? workflow.ptBody : workflow.enBody}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h3 className="text-xl font-bold text-[#512314]">{copy.priorities}</h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {INTEGRATIONS.map((integration) => (
                  <button type="button" key={integration.value} onClick={() => toggleIntegration(integration.value)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${profile.integrations.includes(integration.value) ? 'border-[#ffb53e] bg-[#ffb53e]/15 text-[#512314]' : 'border-[#512314]/15 text-[#512314]/70'}`}>{integration.label}</button>
                ))}
              </div>
              <label className="mt-6 block text-sm font-bold text-[#512314]">
                {copy.goal}
                <textarea value={profile.primaryGoal} onChange={(event) => updateProfile({ primaryGoal: event.target.value })} placeholder={copy.placeholder} className="mt-2 min-h-32 w-full rounded-2xl border border-[#512314]/20 bg-white/45 p-4 text-sm font-normal outline-none focus:border-[#ffb53e]" />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h3 className="text-xl font-bold text-[#512314]">{copy.review}</h3>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#512314]/55"><ShieldCheck size={15} /> Signed preview · 30 min · human confirmation</div>
              <button type="button" disabled={Boolean(loading)} onClick={() => void run('preview_patch')} className="mt-5 rounded-full border border-[#512314]/20 bg-white/45 px-5 py-2.5 text-sm font-bold text-[#512314] disabled:opacity-50">{loading === 'preview' ? copy.generating : copy.generate}</button>
              {preview ? (
                <div className="mt-5 space-y-3">
                  {preview.changes.map((change) => (
                    <div key={change.key} className="rounded-2xl border border-[#512314]/10 bg-white/40 p-4">
                      <p className="text-sm font-bold text-[#512314]">{change.title}</p>
                      <p className="mt-1 text-xs leading-5 text-[#512314]/60">{change.detail}</p>
                    </div>
                  ))}
                  {preview.warnings.map((warning) => <p key={warning} className="rounded-2xl border border-[#ffb53e]/40 bg-[#ffb53e]/12 p-4 text-xs font-semibold leading-5 text-[#6f4900]">{warning}</p>)}
                  <button type="button" disabled={Boolean(loading)} onClick={() => void run('apply_patch')} className="mt-2 flex items-center gap-2 rounded-full bg-[#512314] px-5 py-3 text-sm font-bold text-[#ebdbba] disabled:opacity-50"><LockKeyhole size={15} /> {loading === 'apply' ? copy.applying : copy.apply}</button>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? <p role="alert" className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p> : null}
          <div className="mt-7 flex items-center justify-between border-t border-[#512314]/10 pt-5">
            <button type="button" disabled={step === 0 || Boolean(loading)} onClick={() => setStep((current) => Math.max(0, current - 1))} className="flex items-center gap-1 rounded-full border border-[#512314]/15 px-4 py-2 text-sm font-semibold text-[#512314] disabled:opacity-30"><ChevronLeft size={15} /> {copy.back}</button>
            {step < 3 ? <button type="button" onClick={() => setStep((current) => Math.min(3, current + 1))} className="flex items-center gap-1 rounded-full bg-[#512314] px-4 py-2 text-sm font-bold text-[#ebdbba]">{copy.next} <ChevronRight size={15} /></button> : null}
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-3xl border border-[#512314]/12 bg-[#512314] p-5 text-[#ebdbba] lg:sticky lg:top-5">
        <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffb53e] text-[#512314]"><Bot size={18} /></span><div><p className="text-sm font-bold">MotoSchema</p><p className="text-[10px] text-white/45">online · consultive mode</p></div></div>
        <div className="mt-5 rounded-2xl bg-white/8 p-4 text-xs leading-6 text-white/70">{copy.assistant[step]}</div>
        <div className="mt-3 rounded-2xl border border-[#ffb53e]/25 p-4">
          <p className="flex items-center gap-2 text-xs font-bold text-[#ffbe45]"><Sparkles size={14} /> {initial.planId.toUpperCase()}</p>
          <p className="mt-2 text-[11px] leading-5 text-white/55">{initial.allowedWorkflowTypes.length} workflow{initial.allowedWorkflowTypes.length === 1 ? '' : 's'} available. Every change requires a signed preview.</p>
        </div>
      </aside>
    </div>
  )
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-bold text-[#512314]">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-[#512314]/20 bg-white/45 px-4 text-sm font-normal outline-none focus:border-[#ffb53e]">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}
