import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronLeft, ChevronRight, CloudUpload, Loader2, Lock, PencilLine, Send, Workflow } from 'lucide-react'
import { useIntakeForm, STEPS, stepValid, fieldErrors, type StepId } from '@/hooks/useIntakeForm'
import { AtabaqueMark } from '@/components/AtabaqueMark'
import { useBranding, BrandLogo } from '@/lib/brand'
import { Welcome } from '@/sections/Welcome'
import { Identificacao } from '@/sections/Identificacao'
import { Projeto } from '@/sections/Projeto'
import { Faixas } from '@/sections/Faixas'
import { Marketing } from '@/sections/Marketing'
import { Revisao } from '@/sections/Revisao'
import { Sucesso } from '@/sections/Sucesso'
import { AutomationDialog } from '@/sections/AutomationDialog'
import { HelpChat } from '@/components/HelpChat'
import {
  buildIntakePayload,
  saveIntakeDraft,
  submitIntake,
  uploadIntakeFile,
  type UploadedFileRef,
} from '@/lib/intake-api'

export default function Home() {
  const { workspace } = useParams<{ workspace?: string }>()
  const workspaceSlug = workspace ?? 'atabaque'
  const { branding } = useBranding(workspaceSlug)
  const form = useIntakeForm()
  const [showErrors, setShowErrors] = useState(false)
  const [autoOpen, setAutoOpen] = useState(false)
  const [whiteLabel, setWhiteLabel] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { step } = form

  // painel de automações é restrito ao cliente-adm (?adm=1 na URL ou localStorage)
  const isClientAdm = useMemo(() => {
    const qs = new URLSearchParams(window.location.search)
    return qs.has('adm') || window.localStorage.getItem('sunbeat-client-adm') === '1'
  }, [])

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const isFormStep = stepIndex >= 0
  const progress = isFormStep ? Math.round(((stepIndex + 1) / STEPS.length) * 100) : 0

  function goTo(s: StepId) {
    setShowErrors(false)
    form.setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function next() {
    if (!stepValid(step, form.data)) {
      setShowErrors(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setShowErrors(false)
    const nextStep = STEPS[stepIndex + 1].id
    if (step === 'identificacao' || step === 'projeto') {
      try {
        await saveIntakeDraft({
          data: form.data,
          workspaceSlug,
          draftToken: form.draftToken,
          currentStep: nextStep,
        })
      } catch (error) {
        console.warn('[intake] rascunho remoto não foi salvo:', error)
      }
    }
    goTo(nextStep)
  }

  function back() {
    setShowErrors(false)
    goTo(stepIndex === 0 ? 'welcome' : STEPS[stepIndex - 1].id)
  }

  async function submit() {
    const invalid = STEPS.find((s) => Object.keys(fieldErrors(s.id, form.data)).length > 0)
    if (invalid) {
      goTo(invalid.id)
      setShowErrors(true)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const coverFile = form.coverFile
        ? await uploadIntakeFile({
            file: form.coverFile,
            kind: 'cover',
            workspaceSlug,
            draftToken: form.draftToken,
          })
        : null

      const audioEntries = await Promise.all(form.data.tracks.map(async (track) => {
        const file = form.audioFiles[track.id]
        if (!file) throw new Error(`Selecione novamente o áudio da faixa “${track.title}”.`)
        const uploaded = await uploadIntakeFile({
          file,
          kind: 'audio',
          workspaceSlug,
          draftToken: form.draftToken,
          trackLocalId: track.id,
        })
        return [track.id, uploaded] as const
      }))
      const audioFiles = Object.fromEntries(audioEntries) as Record<string, UploadedFileRef>
      const payload = buildIntakePayload({
        data: form.data,
        workspaceSlug,
        draftToken: form.draftToken,
        coverFile,
        audioFiles,
      })
      await submitIntake(payload)
      form.submit()
      window.scrollTo({ top: 0 })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível enviar o formulário.')
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* top bar */}
      <header className="sticky top-0 z-20 border-b-2 border-foreground/10 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            {branding?.logo_url ? (
              <BrandLogo branding={branding} size={40} fallback={<AtabaqueMark size={40} />} />
            ) : (
              <>
                <AtabaqueMark size={36} />
                <div className="font-display font-black text-lg">{branding?.workspace_name ?? 'Atabaque'}</div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:flex border-foreground/25 text-muted-foreground gap-1.5 font-semibold">
              <Lock className="h-3 w-3" /> Restrito a parceiros
            </Badge>
            {form.mode === 'edit' && (
              <Badge className="bg-[#329fd7]/15 text-[#1c6e99] gap-1"><PencilLine className="h-3 w-3" /> Editando submissão</Badge>
            )}
            {isFormStep && form.savedAt && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <CloudUpload className="h-3.5 w-3.5 text-emerald-600" />
                Rascunho salvo {form.savedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {isClientAdm && (
              <Button variant="ghost" size="sm" className="font-semibold text-xs" onClick={() => setAutoOpen(true)}>
                <Workflow className="mr-1 h-3.5 w-3.5" /> Automações
              </Button>
            )}
          </div>
        </div>

        {/* progress */}
        {isFormStep && (
          <div className="mx-auto max-w-4xl px-4 pb-3">
            <div className="flex items-center justify-between gap-1">
              {STEPS.map((s, i) => {
                const done = i < stepIndex
                const active = i === stepIndex
                const hasErr = showErrors && Object.keys(fieldErrors(s.id, form.data)).length > 0
                return (
                  <button key={s.id} onClick={() => (i < stepIndex ? goTo(s.id) : undefined)}
                    className={`group flex flex-1 flex-col items-center gap-1 ${i < stepIndex ? 'cursor-pointer' : 'cursor-default'}`}>
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
        {step === 'welcome' && (
          <Welcome
            hasDraft={form.hasDraft()}
            onStart={() => goTo('identificacao')}
            onResume={() => { if (form.resumeDraft()) window.scrollTo({ top: 0 }) }}
            onEdit={() => { form.loadForEdit(); window.scrollTo({ top: 0 }) }}
          />
        )}
        {step === 'identificacao' && <Identificacao form={form} showErrors={showErrors} />}
        {step === 'projeto' && <Projeto form={form} showErrors={showErrors} />}
        {step === 'faixas' && <Faixas form={form} showErrors={showErrors} />}
        {step === 'marketing' && <Marketing form={form} showErrors={showErrors} />}
        {step === 'revisao' && <Revisao form={form} goTo={goTo} showErrors={showErrors} />}
        {step === 'sucesso' && (
          <Sucesso email={form.data.responsibleEmail} project={form.data.projectName} onRestart={() => location.reload()} />
        )}
        {submitError && step !== 'sucesso' && (
          <div role="alert" className="mx-auto mt-6 max-w-2xl rounded-2xl border-2 border-accent/60 bg-accent/10 p-4 text-sm font-semibold text-accent">
            {submitError}
          </div>
        )}
      </main>

      {/* footer: navegação + barra Sunbeat (ocultável por plano white-label) */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t-2 border-foreground/10 bg-background/90 backdrop-blur">
        {isFormStep && (
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Button variant="ghost" className="font-bold" onClick={back}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
            <span className="text-xs font-semibold text-muted-foreground hidden sm:block">
              Etapa {stepIndex + 1} de {STEPS.length} — {STEPS[stepIndex].hint}
            </span>
            {step !== 'revisao' ? (
              <Button className="bg-foreground text-background hover:bg-foreground/90 font-bold rounded-full px-6" onClick={next}>
                Próximo <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button disabled={submitting} className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold rounded-full px-6 shadow-[3px_3px_0_0_rgba(81,35,20,0.3)]" onClick={submit}>
                {submitting ? 'Enviando…' : form.mode === 'edit' ? 'Salvar alterações' : 'Enviar formulário'}
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
              · intake inteligente para operações criativas
            </div>
          </div>
        )}
      </footer>

      <AutomationDialog open={autoOpen} onOpenChange={setAutoOpen} whiteLabel={whiteLabel} onWhiteLabelChange={setWhiteLabel} />

      {/* chat de dúvidas — só depois da identificação inicial */}
      {stepIndex > 0 && <HelpChat clientName={branding?.workspace_name ?? 'Atabaque'} />}
    </div>
  )
}
