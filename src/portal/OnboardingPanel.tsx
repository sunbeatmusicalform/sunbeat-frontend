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
    doneProvisioned: 'Your selected workflows are active. External integrations remain pending until you authorize them.',
    doneManaged: 'The profile was saved. Existing workflows and integrations were left unchanged.',
    update: 'This workspace is already configured. You can safely review and update it.',
    loadError: 'We could not load onboarding. Your session may have expired.', retry: 'Try again',
    previewExpired: 'The secure preview expired or changed. Generate a new preview and confirm again.',
    guidedMode: 'guided mode', customAccess: 'Custom access', workflowAvailable: 'workflow available', workflowsAvailable: 'workflows available', signedChanges: 'Every change requires a signed preview.',
    freeRetention: 'On Free, uploaded assets remain available for 60 days. Metadata and audit history are preserved.',
    managedWarning: 'This is a managed workspace. MotoSchema will save the profile without changing active forms, integrations or workflows.',
    changeTitles: { operation: 'Operational profile', workflows: 'Workflow access', integrations: 'Integration priorities', governance: 'MotoSchema governance', provisioning: 'Safe application' },
    governanceDetail: 'Signed preview, human confirmation and audit record before application.',
    provisioningSelfService: 'Selected workflows will be activated; external integrations wait for authorization.',
    provisioningManaged: 'Only the profile will be updated; the existing operation remains unchanged.',
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
    doneProvisioned: 'Os workflows selecionados estão ativos. As integrações externas aguardam sua autorização.',
    doneManaged: 'O perfil foi salvo. Os workflows e integrações existentes permaneceram inalterados.',
    update: 'Este workspace já foi configurado. Você pode revisar e atualizar com segurança.',
    loadError: 'Não foi possível carregar o onboarding. Sua sessão pode ter expirado.', retry: 'Tentar novamente',
    previewExpired: 'A prévia segura expirou ou mudou. Gere uma nova prévia e confirme novamente.',
    guidedMode: 'modo guiado', customAccess: 'Acesso personalizado', workflowAvailable: 'workflow disponível', workflowsAvailable: 'workflows disponíveis', signedChanges: 'Toda alteração exige uma prévia assinada.',
    freeRetention: 'No Free, os assets enviados ficam disponíveis por 60 dias. Os metadados e a auditoria são preservados.',
    managedWarning: 'Este é um workspace gerenciado. O MotoSchema salvará o perfil sem alterar formulários, integrações ou workflows ativos.',
    changeTitles: { operation: 'Perfil operacional', workflows: 'Acesso aos workflows', integrations: 'Prioridades de integração', governance: 'Governança do MotoSchema', provisioning: 'Aplicação segura' },
    governanceDetail: 'Prévia assinada, confirmação humana e registro de auditoria antes da aplicação.',
    provisioningSelfService: 'Os workflows selecionados serão ativados; integrações externas aguardam autorização.',
    provisioningManaged: 'Somente o perfil será atualizado; a operação existente permanecerá intacta.',
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
  const accessLabel = initial?.accessMode === 'custom' ? copy.customAccess : initial?.planId.toUpperCase()

  function previewDetail(key: string) {
    if (!profile) return ''
    if (key === 'operation') {
      const operation = OPERATIONS.find((item) => item.value === profile.operationType)
      const label = locale === 'pt' ? operation?.pt : operation?.en
      return locale === 'pt'
        ? `${label} · equipe ${profile.teamSize} · ${profile.monthlyVolume} operações/mês`
        : `${label} · team ${profile.teamSize} · ${profile.monthlyVolume} operations/month`
    }
    if (key === 'workflows') {
      return profile.workflowTypes.map((value) => {
        const workflow = WORKFLOWS.find((item) => item.value === value)
        return locale === 'pt' ? workflow?.pt : workflow?.en
      }).filter(Boolean).join(', ')
    }
    if (key === 'integrations') {
      return profile.integrations.map((value) => INTEGRATIONS.find((item) => item.value === value)?.label).filter(Boolean).join(', ') || (locale === 'pt' ? 'Configurar depois' : 'Configure later')
    }
    if (key === 'governance') return copy.governanceDetail
    if (key === 'provisioning') return initial?.provisioningMode === 'self_service' ? copy.provisioningSelfService : copy.provisioningManaged
    return ''
  }

  function localizedWarnings(remote: OnboardingPreviewRemote) {
    if (!remote.warningCodes?.length) return remote.warnings
    return remote.warningCodes.map((code) => code === 'free_asset_retention_60_days' ? copy.freeRetention : copy.managedWarning)
  }

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
      setError(response.status === 409 ? copy.previewExpired : copy.loadError)
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
    return <div className="mt-6 sun-card p-8 text-sm text-muted-foreground">{locale === 'pt' ? 'O MotoSchema está preparando seu workspace…' : 'MotoSchema is preparing your workspace…'}</div>
  }

  if (!initial || !profile) {
    return (
      <div className="mt-6 sun-card p-7">
        <p className="text-sm font-semibold text-red-700">{error ?? copy.loadError}</p>
        <button type="button" onClick={() => void load()} className="mt-4 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">{copy.retry}</button>
      </div>
    )
  }

  if (completed) {
    return (
      <section className="mt-6 sun-card border border-emerald-700/20 p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 text-white"><Check size={24} /></div>
        <h2 className="mt-5 text-3xl font-bold text-foreground">{copy.done}</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{copy.doneBody} {initial.provisioningMode === 'self_service' ? copy.doneProvisioned : copy.doneManaged}</p>
        <button type="button" onClick={() => { setCompleted(false); void load() }} className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">{copy.review}</button>
      </section>
    )
  }

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#071c25_0%,#082630_52%,#071820_100%)] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] before:absolute before:-right-20 before:-top-24 before:h-64 before:w-64 before:rounded-full before:bg-sky-400/10 before:blur-3xl">
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{copy.eyebrow}</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-bold leading-tight">{copy.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">{copy.intro}</p>
            {initial.completedAt ? <p className="mt-3 text-xs font-semibold text-emerald-300">✓ {copy.update}</p> : null}
            <div className="mt-6 grid grid-cols-4 gap-2">
              {copy.steps.map((label, index) => (
                <button type="button" key={label} onClick={() => index <= step && setStep(index)} className="text-left" aria-current={index === step ? 'step' : undefined}>
                  <span className={`block h-1 rounded-full ${index <= step ? 'bg-primary' : 'bg-white/10'}`} />
                  <span className={`mt-2 block text-[9px] font-bold uppercase tracking-wide ${index === step ? 'text-white' : 'text-white/35'}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="sun-card p-6">
          {step === 0 ? (
            <div>
              <h3 className="text-xl font-bold text-foreground">{copy.operation}</h3>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {OPERATIONS.map((operation) => (
                  <button type="button" key={operation.value} onClick={() => updateProfile({ operationType: operation.value })} className={`rounded-xl border p-3.5 text-left text-sm font-semibold transition ${profile.operationType === operation.value ? 'border-primary/60 bg-primary/10 text-foreground shadow-[inset_3px_0_0_hsl(var(--primary))]' : 'border-border bg-background/35 text-muted-foreground hover:border-sky-400/35 hover:text-foreground'}`}>
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
              <h3 className="text-xl font-bold text-foreground">{copy.workflows}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.workflowNote}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {WORKFLOWS.map((workflow) => {
                  const allowed = initial.allowedWorkflowTypes.includes(workflow.value)
                  const selected = selectedWorkflows.has(workflow.value)
                  return (
                    <button type="button" key={workflow.value} disabled={!allowed || workflow.value === 'release_intake'} onClick={() => toggleWorkflow(workflow.value)} className={`rounded-xl border p-4 text-left transition ${selected ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-border bg-background/35'} ${!allowed ? 'cursor-not-allowed opacity-45' : 'hover:border-sky-400/35'}`}>
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-bold text-foreground">{locale === 'pt' ? workflow.pt : workflow.en}</span>
                        <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${allowed ? 'bg-emerald-400/10 text-emerald-300' : 'bg-primary/10 text-primary'}`}>{allowed ? copy.included : copy.locked}</span>
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-muted-foreground">{locale === 'pt' ? workflow.ptBody : workflow.enBody}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h3 className="text-xl font-bold text-foreground">{copy.priorities}</h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {INTEGRATIONS.map((integration) => (
                  <button type="button" key={integration.value} onClick={() => toggleIntegration(integration.value)} className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${profile.integrations.includes(integration.value) ? 'border-primary/60 bg-primary/10 text-foreground' : 'border-border bg-background/25 text-muted-foreground hover:border-sky-400/35 hover:text-foreground'}`}>{integration.label}</button>
                ))}
              </div>
              <label className="mt-6 block text-sm font-bold text-foreground">
                {copy.goal}
                <textarea value={profile.primaryGoal} onChange={(event) => updateProfile({ primaryGoal: event.target.value })} placeholder={copy.placeholder} className="mt-2 min-h-32 w-full rounded-xl border border-input bg-background/35 p-4 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20" />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h3 className="text-xl font-bold text-foreground">{copy.review}</h3>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><ShieldCheck size={15} /> Signed preview · 30 min · human confirmation</div>
              <button type="button" disabled={Boolean(loading)} onClick={() => void run('preview_patch')} className="mt-5 rounded-md border border-border bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80 disabled:opacity-50">{loading === 'preview' ? copy.generating : copy.generate}</button>
              {preview ? (
                <div className="mt-5 space-y-3">
                  {preview.changes.map((change) => (
                    <div key={change.key} className="rounded-xl border border-border bg-background/35 p-4">
                      <p className="text-sm font-bold text-foreground">{copy.changeTitles[change.key as keyof typeof copy.changeTitles] ?? change.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{previewDetail(change.key) || change.detail}</p>
                    </div>
                  ))}
                  {localizedWarnings(preview).map((warning) => <p key={warning} className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-xs font-semibold leading-5 text-primary">{warning}</p>)}
                  <button type="button" disabled={Boolean(loading)} onClick={() => void run('apply_patch')} className="mt-2 flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"><LockKeyhole size={15} /> {loading === 'apply' ? copy.applying : copy.apply}</button>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? <p role="alert" className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p> : null}
          <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
            <button type="button" disabled={step === 0 || Boolean(loading)} onClick={() => setStep((current) => Math.max(0, current - 1))} className="flex items-center gap-1 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-30"><ChevronLeft size={15} /> {copy.back}</button>
            {step < 3 ? <button type="button" onClick={() => setStep((current) => Math.min(3, current + 1))} className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">{copy.next} <ChevronRight size={15} /></button> : null}
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#08232d_0%,#071820_100%)] p-5 text-white shadow-[0_18px_50px_rgba(0,0,0,0.22)] lg:sticky lg:top-5">
        <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary"><Bot size={18} /></span><div><p className="text-sm font-bold">MotoSchema</p><p className="text-[10px] text-white/40">{copy.guidedMode}</p></div></div>
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-4 text-xs leading-6 text-white/65">{copy.assistant[step]}</div>
        <div className="mt-3 rounded-xl border border-sky-400/15 bg-sky-400/[0.035] p-4">
          <p className="flex items-center gap-2 text-xs font-bold text-primary"><Sparkles size={14} /> {accessLabel}</p>
          <p className="mt-2 text-[11px] leading-5 text-white/50">{initial.allowedWorkflowTypes.length} {initial.allowedWorkflowTypes.length === 1 ? copy.workflowAvailable : copy.workflowsAvailable}. {copy.signedChanges}</p>
        </div>
      </aside>
    </div>
  )
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-bold text-foreground">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background/35 px-4 text-sm font-normal text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}
