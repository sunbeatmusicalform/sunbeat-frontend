import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  ArrowRight, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert,
  Clock3, CloudUpload, Loader2, Lock, Mail, PencilLine, Send, Sparkles, Workflow,
} from 'lucide-react'
import { AtabaqueMark } from '@/components/AtabaqueMark'
import { useBranding, BrandLogo } from '@/lib/brand'
import { StepHeader } from '@/sections/ui'
import { AutomationDialog } from '@/sections/AutomationDialog'
import { HelpChat } from '@/components/HelpChat'
import { useFormEngine, isVisible, type Engine } from './useFormEngine'
import { FieldRenderer, reviewValue } from './FieldRenderer'
import { CONFIDENTIALITY_NOTICE, consentLabel } from './consent'
import type { FieldDef, FormConfig, FormValues } from './types'
import { applyPublishedFormConfig, usePublicFormConfig } from '@/lib/form-config'

export function FormShell({ config: baseConfig, workspaceSlug, workflowType, prefill, banner, onSubmit, onSubmitted }: { config: FormConfig; workspaceSlug: string; workflowType: string; prefill?: Partial<FormValues>; banner?: ReactNode; onSubmit?: (values: FormValues) => Promise<void>; onSubmitted?: (values: FormValues) => void }) {
  const { config: publishedConfig } = usePublicFormConfig(workspaceSlug, workflowType)
  const config = useMemo(() => applyPublishedFormConfig(baseConfig, publishedConfig), [baseConfig, publishedConfig])
  const engine = useFormEngine(config, prefill)
  const { branding } = useBranding(workspaceSlug)
  const [showErrors, setShowErrors] = useState(false)
  const [autoOpen, setAutoOpen] = useState(false)
  const [whiteLabel, setWhiteLabel] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { step, steps } = engine

  // painel de automações é restrito ao cliente-adm (?adm=1 na URL ou localStorage)
  const isClientAdm = useMemo(() => {
    const qs = new URLSearchParams(window.location.search)
    return qs.has('adm') || window.localStorage.getItem('sunbeat-client-adm') === '1'
  }, [])

  const stepIndex = steps.findIndex((s) => s.id === step)
  const isFormStep = stepIndex >= 0 || step === 'revisao'
  const progress = step === 'revisao'
    ? 100
    : isFormStep ? Math.round(((stepIndex + 1) / (steps.length + 1)) * 100) : 0

  const progressItems = [...steps.map((s) => ({ id: s.id, label: s.label })), { id: 'revisao', label: 'Revisão' }]
  const activeProgressIndex = step === 'revisao' ? progressItems.length - 1 : stepIndex

  function goTo(s: string) {
    setShowErrors(false)
    engine.setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function next() {
    const errs = engine.errorsFor(step)
    if (Object.keys(errs).length > 0) {
      setShowErrors(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setShowErrors(false)
    goTo(stepIndex === steps.length - 1 ? 'revisao' : steps[stepIndex + 1].id)
  }

  function back() {
    setShowErrors(false)
    if (step === 'revisao') return goTo(steps[steps.length - 1].id)
    goTo(stepIndex === 0 ? 'welcome' : steps[stepIndex - 1].id)
  }

  async function submit() {
    const invalid = progressItems.find((p) => Object.keys(engine.errorsFor(p.id, 'submit')).length > 0)
    if (invalid) {
      if (invalid.id !== 'revisao') goTo(invalid.id)
      setShowErrors(true)
      if (invalid.id === 'revisao') window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit?.(engine.values)
      engine.submit()
      onSubmitted?.(engine.values)
      window.scrollTo({ top: 0 })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível enviar o formulário.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  const activeStep = steps[stepIndex]

  return (
    <div className="min-h-screen">
      {/* top bar */}
      <header className="sticky top-0 z-20 border-b-2 border-foreground/10 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <BrandLogo branding={branding} size={36} fallback={<AtabaqueMark size={36} />} />
            <div className="font-display font-black text-lg">{branding?.workspace_name ?? config.clientName}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:flex border-foreground/25 text-muted-foreground gap-1.5 font-semibold">
              <Lock className="h-3 w-3" /> Restrito a parceiros
            </Badge>
            {engine.mode === 'edit' && (
              <Badge className="bg-[#329fd7]/15 text-[#1c6e99] gap-1"><PencilLine className="h-3 w-3" /> Editando submissão</Badge>
            )}
            {isFormStep && engine.savedAt && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <CloudUpload className="h-3.5 w-3.5 text-emerald-600" />
                Rascunho salvo {engine.savedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {isClientAdm && (
              <Button variant="ghost" size="sm" className="font-semibold text-xs" onClick={() => setAutoOpen(true)}>
                <Workflow className="mr-1 h-3.5 w-3.5" /> Automações
              </Button>
            )}
          </div>
        </div>

        {isFormStep && (
          <div className="mx-auto max-w-4xl px-4 pb-3">
            <div className="flex items-center justify-between gap-1">
              {progressItems.map((s, i) => {
                const done = i < activeProgressIndex
                const active = i === activeProgressIndex
                const hasErr = showErrors && Object.keys(engine.errorsFor(s.id)).length > 0
                return (
                  <button key={s.id} onClick={() => (i < activeProgressIndex ? goTo(s.id) : undefined)}
                    className={`group flex flex-1 flex-col items-center gap-1 ${i < activeProgressIndex ? 'cursor-pointer' : 'cursor-default'}`}>
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all
                      ${done ? 'border-emerald-600 bg-emerald-600 text-white' : ''}
                      ${active ? (hasErr ? 'border-accent bg-accent text-accent-foreground' : 'border-foreground bg-foreground text-background') : ''}
                      ${!done && !active ? 'border-foreground/25 text-muted-foreground' : ''}`}>
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {s.label}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </header>

      {/* body */}
      <main className="mx-auto max-w-4xl px-4 py-10 pb-40">
        {submitError && step !== 'sucesso' && (
          <div className="mx-auto mb-6 max-w-2xl rounded-2xl border-2 border-accent/50 bg-accent/10 p-4 text-sm font-semibold text-accent">
            {submitError}
          </div>
        )}
        {step === 'welcome' && (
          <EngineWelcome config={config} engine={engine} onStart={() => goTo(steps[0].id)} />
        )}

        {activeStep && (
          <div className="mx-auto max-w-2xl">
            {banner}
            <StepHeader title={activeStep.title} description={activeStep.description} />
            <div className="grid gap-6">
              {activeStep.fields.filter((f) => f.enabled !== false && isVisible(f.visibleWhen, engine.values)).map((f) => (
                <FieldRenderer key={f.key} f={f} engine={engine}
                  errors={engine.errorsFor(step)} showErrors={showErrors} />
              ))}
            </div>
            {/* erros que cruzam campos (regras do passo) */}
            {showErrors && (() => {
              const errs = engine.errorsFor(step)
              const fieldKeys = new Set(activeStep.fields.map((f) => f.key))
              const orphans = Object.entries(errs).filter(([k]) => !fieldKeys.has(k) && !k.includes('.') && k !== 'consentTruth')
              if (orphans.length === 0) return null
              return (
                <div className="mt-6 rounded-2xl border-2 border-accent/60 bg-accent/10 p-4">
                  {orphans.map(([k, msg]) => (
                    <p key={k} className="text-sm font-semibold text-accent">{msg}</p>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {step === 'revisao' && (
          <EngineReview config={config} engine={engine} goTo={goTo} showErrors={showErrors} />
        )}

        {step === 'sucesso' && <EngineSuccess config={config} engine={engine} />}
      </main>

      {/* footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t-2 border-foreground/10 bg-background/90 backdrop-blur">
        {isFormStep && (
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Button variant="ghost" className="font-bold" onClick={back}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
            <span className="text-xs font-semibold text-muted-foreground hidden sm:block">
              {step === 'revisao'
                ? 'Etapa final — confira e envie'
                : `Etapa ${activeProgressIndex + 1} de ${progressItems.length} — ${activeStep?.hint ?? ''}`}
            </span>
            {step !== 'revisao' ? (
              <Button className="bg-foreground text-background hover:bg-foreground/90 font-bold rounded-full px-6" onClick={next}>
                Próximo <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button disabled={submitting} className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold rounded-full px-6 shadow-[3px_3px_0_0_rgba(81,35,20,0.3)]" onClick={() => void submit()}>
                {submitting ? 'Enviando…' : engine.mode === 'edit' ? 'Salvar alterações' : 'Enviar formulário'}
                {submitting ? <Loader2 className="ml-1.5 h-4 w-4 animate-spin" /> : <Send className="ml-1.5 h-4 w-4" />}
              </Button>
            )}
          </div>
        )}
        {!whiteLabel && (
          <div className="border-t border-foreground/10 bg-foreground/[0.04]">
            <div className="mx-auto flex max-w-4xl items-center justify-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold text-muted-foreground">
              Este formulário roda na plataforma
              <a href="https://sunbeat.pro" target="_blank" rel="noreferrer" className="font-black text-foreground/70 hover:text-foreground underline underline-offset-2">
                Sunbeat
              </a>
              · formulários inteligentes para operações criativas
            </div>
          </div>
        )}
      </footer>

      <AutomationDialog open={autoOpen} onOpenChange={setAutoOpen} whiteLabel={whiteLabel} onWhiteLabelChange={setWhiteLabel} />

      {/* chat de dúvidas — só depois da identificação inicial */}
      {(stepIndex > 0 || step === 'revisao') && <HelpChat clientName={config.clientName} />}
    </div>
  )
}

/* ---------------- welcome ---------------- */

function EngineWelcome({ config, engine, onStart }: { config: FormConfig; engine: Engine; onStart: () => void }) {
  const cards = [
    { icon: Clock3, title: config.estimate, desc: 'E salva rascunho automaticamente — volte quando quiser.' },
    { icon: Sparkles, title: 'Tenha em mãos', desc: config.haveReady },
    ...config.welcomeCards,
    { icon: Mail, title: 'Acompanhamento', desc: 'Você recebe e-mails a cada etapa: recebido, em análise, ajustes e aprovado.' },
  ]
  return (
    <div className="mx-auto max-w-2xl text-center py-10">
      <div className="sun-chip mx-auto mb-3">{config.chip}</div>
      <p className="mb-6 text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1.5">
        🔒 Formulário restrito a parceiros — se você chegou aqui por engano, fale com a equipe {config.clientName}.
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-black leading-tight">
        {config.accentWord
          ? <>{config.title.split(config.accentWord)[0]}<span className="text-accent">{config.accentWord}</span>{config.title.split(config.accentWord)[1]}</>
          : config.title}
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">{config.subtitle}</p>

      <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
        {cards.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="sun-card rounded-2xl p-4">
            <div className="flex items-center gap-2 font-bold text-sm"><Icon className="h-4 w-4 text-accent" />{title}</div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold rounded-full px-8 h-12 text-base shadow-[4px_4px_0_0_rgba(81,35,20,0.25)]" onClick={onStart}>
          Começar <ArrowRight className="ml-1 h-5 w-5" />
        </Button>
        <div className="flex gap-4 text-sm">
          {engine.hasDraft() && (
            <button className="font-semibold underline underline-offset-4 text-foreground/80 hover:text-foreground"
              onClick={() => { if (engine.resumeDraft()) window.scrollTo({ top: 0 }) }}>
              Continuar meu rascunho
            </button>
          )}
          {new URLSearchParams(window.location.search).has('demo') && (
            <button className="font-semibold underline underline-offset-4 text-muted-foreground hover:text-foreground"
              onClick={() => { engine.loadForEdit(); window.scrollTo({ top: 0 }) }}>
              Editar dados de demonstração
            </button>
          )}
        </div>
        <p className="max-w-md text-[11px] leading-relaxed text-muted-foreground">
          Seus dados são usados apenas para operar este fluxo, conforme a política de
          privacidade. Antes de enviar, você revisa tudo e confirma uma declaração de veracidade.
        </p>
      </div>
    </div>
  )
}

/* ---------------- review ---------------- */

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:gap-4">
      <span className="w-44 shrink-0 text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium whitespace-pre-line">{value}</span>
    </div>
  )
}

function RepeaterReview({ f, values }: { f: FieldDef; values: FormValues }) {
  const items = (values[f.key] as FormValues[]) ?? []
  if (items.length === 0) return null
  return (
    <div className="space-y-2 py-1.5">
      <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">{f.label}</span>
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl bg-white/50 p-4">
          <div className="text-sm font-bold">{f.itemLabel ?? 'Item'} {i + 1}</div>
          <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {(f.fields ?? [])
              .map((sub) => reviewValue(sub, item[sub.key], item))
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
      ))}
    </div>
  )
}

function EngineReview({
  config, engine, goTo, showErrors,
}: {
  config: FormConfig
  engine: Engine
  goTo: (s: string) => void
  showErrors: boolean
}) {
  const { steps, values } = engine
  const sectionStatus = steps.map((s) => ({ ...s, errors: engine.errorsFor(s.id) }))

  return (
    <div className="mx-auto max-w-2xl">
      <StepHeader
        title="Revisão final"
        description="Confira o resumo abaixo. Se algo estiver faltando, avisamos aqui — nada de erro genérico só no fim."
      />

      <div className={`mb-8 grid gap-2 sm:grid-cols-${Math.min(steps.length, 4)}`}>
        {sectionStatus.map((s) => {
          const ok = Object.keys(s.errors).length === 0
          return (
            <button key={s.id} onClick={() => goTo(s.id)}
              className={`rounded-2xl border-2 p-3 text-left transition-all hover:scale-[1.02] ${ok ? 'border-emerald-600/40 bg-emerald-500/10' : 'border-accent/60 bg-accent/10'}`}>
              <div className="flex items-center gap-1.5 text-sm font-bold">
                {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <CircleAlert className="h-4 w-4 text-accent" />}
                {s.label}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {ok ? 'Completo' : `${Object.keys(s.errors).length} pendência(s) — toque para revisar`}
              </div>
            </button>
          )
        })}
      </div>

      <div className="sun-card rounded-3xl p-6">
        {steps.map((s, si) => (
          <div key={s.id}>
            {si > 0 && <Separator className="my-4 bg-foreground/10" />}
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{s.label}</p>
            {s.fields.map((f) =>
              f.type === 'repeater'
                ? <RepeaterReview key={f.key} f={f} values={values} />
                : <Row key={f.key} label={f.label} value={reviewValue(f, values[f.key], values)} />
            )}
          </div>
        ))}
      </div>

      {/* aviso de confidencialidade */}
      <p className="mt-5 rounded-xl border-2 border-foreground/10 bg-white/40 p-3.5 text-[11px] leading-relaxed text-muted-foreground">
        🔒 {CONFIDENTIALITY_NOTICE}
      </p>

      {/* consentimento LGPD */}
      <div className={`mt-4 rounded-2xl border-2 p-4 ${showErrors && !values.consentTruth ? 'border-accent bg-accent/5' : 'border-foreground/15 bg-white/50'}`}>
        <Label htmlFor="consent" className="flex cursor-pointer items-start gap-3">
          <Checkbox id="consent" className="mt-0.5" checked={values.consentTruth === true}
            onCheckedChange={(v) => engine.setValue('consentTruth', v === true)} />
          <span className="text-xs leading-relaxed text-foreground/85">
            {consentLabel(config.clientName)}
          </span>
        </Label>
        {showErrors && !values.consentTruth && (
          <p className="mt-2 text-xs font-semibold text-accent">É preciso confirmar a declaração antes de enviar.</p>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Ao enviar, você recebe um e-mail de confirmação com o resumo e o acompanhamento das etapas.
      </p>
    </div>
  )
}

/* ---------------- success ---------------- */

function EngineSuccess({ config, engine }: { config: FormConfig; engine: Engine }) {
  const email = String(
    config.steps.flatMap((s) => s.fields).find((f) => f.validate === 'email')
      ? engine.values[config.steps.flatMap((s) => s.fields).find((f) => f.validate === 'email')!.key] ?? ''
      : ''
  )
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 border-2 border-emerald-600/40">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      </div>
      <h2 className="font-display text-4xl font-black">{config.successHeading}</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        {config.successLead}{email ? <> Enviamos o resumo para <strong>{email}</strong>.</> : null}
      </p>

      <div className="mt-8 space-y-3 text-left">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">O que acontece agora</p>
        {config.successSteps.map(({ title, desc }, i) => (
          <div key={title} className="sun-card flex gap-3 rounded-2xl p-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-foreground/20 text-xs font-black">
              {i + 1}
            </div>
            <div>
              <div className="font-bold text-sm">{title}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="mt-8 rounded-full border-2 font-bold" onClick={() => location.reload()}>
        {config.restartLabel}
      </Button>
    </div>
  )
}
