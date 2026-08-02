import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FieldDef, FormConfig, FormValues, StepDef, VisibleWhen } from './types'
import { CONSENT_ERROR } from './consent'

export type EngineStep = 'welcome' | 'revisao' | 'sucesso' | string
export type Mode = 'new' | 'draft' | 'edit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const URL_RE = /^https?:\/\/.+/

export function isVisible(visibleWhen: VisibleWhen[] | undefined, values: FormValues) {
  if (!visibleWhen || visibleWhen.length === 0) return true
  return visibleWhen.every((c) => {
    if ('contains' in c && c.contains !== undefined) {
      const v = values[c.key]
      return Array.isArray(v) && v.includes(c.contains)
    }
    return values[c.key] === c.equals
  })
}

export function activeSteps(config: FormConfig, values: FormValues): StepDef[] {
  return config.steps.filter((s) => isVisible(s.visibleWhen, values))
}

function emptyValues(config: FormConfig): FormValues {
  const v: FormValues = { consentTruth: false }
  for (const step of config.steps) {
    for (const f of step.fields) {
      if (f.type === 'chips') v[f.key] = []
      else if (f.type === 'repeater') v[f.key] = []
      else if (f.type === 'file') v[f.key] = null
      else v[f.key] = ''
    }
  }
  return v
}

export type ValidationPhase = 'step' | 'submit'

function requiredAt(f: FieldDef, phase: ValidationPhase): boolean {
  if (f.enabled === false) return false
  if (!f.requirement) return !!f.required
  return f.requirement === 'on_step' || (phase === 'submit' && f.requirement === 'on_submit')
}

function validateField(f: FieldDef, value: unknown, phase: ValidationPhase): string | null {
  const empty =
    value === '' || value === null || value === undefined ||
    (Array.isArray(value) && value.length === 0)
  if (requiredAt(f, phase) && empty) {
    if (f.type === 'chips') return 'Escolha pelo menos uma opção.'
    if (f.type === 'file') return 'Anexe o arquivo.'
    if (f.type === 'yesno' || f.type === 'radio' || f.type === 'select') return 'Selecione uma opção.'
    return 'Campo obrigatório.'
  }
  if (!empty && f.validate === 'email' && !EMAIL_RE.test(String(value))) return 'Use um e-mail válido.'
  if (!empty && f.validate === 'url' && !URL_RE.test(String(value))) return 'Cole o link completo, começando com https://'
  return null
}

export function fieldErrors(step: StepDef, values: FormValues, phase: ValidationPhase = 'step'): Record<string, string> {
  const e: Record<string, string> = {}
  for (const f of step.fields) {
    if (f.enabled === false || !isVisible(f.visibleWhen, values)) continue
    if (f.type === 'repeater') {
      const items = (values[f.key] as FormValues[]) ?? []
      if (requiredAt(f, phase) && items.length < (f.minItems ?? 1)) {
        e[f.key] = `Adicione ao menos ${(f.minItems ?? 1)} ${f.itemLabel ?? 'item'}.`
      }
      items.forEach((item, i) => {
        for (const sub of f.fields ?? []) {
          if (sub.enabled === false || !isVisible(sub.visibleWhen, item)) continue
          const msg = validateField(sub, item[sub.key], phase)
          if (msg) e[`${f.key}.${i}.${sub.key}`] = `${f.itemLabel ?? 'Item'} ${i + 1}: ${msg}`
        }
      })
      continue
    }
    const msg = validateField(f, values[f.key], phase)
    if (msg) e[f.key] = msg
  }
  if (step.customValidate) {
    Object.assign(e, step.customValidate(values))
  }
  return e
}

export function useFormEngine(config: FormConfig, prefill?: Partial<FormValues>, initialMode: Mode = 'new') {
  const DRAFT_KEY = `sunbeat.${config.slug}.draft`
  const [step, setStep] = useState<EngineStep>(() => initialMode === 'edit' ? activeSteps(config, { ...emptyValues(config), ...prefill })[0]?.id ?? 'revisao' : 'welcome')
  const [values, setValuesState] = useState<FormValues>(() => ({ ...emptyValues(config), ...prefill }))
  const [mode, setMode] = useState<Mode>(initialMode)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const steps = useMemo(() => activeSteps(config, values), [config, values])

  // autosave (draft mode)
  useEffect(() => {
    if (step === 'welcome' || step === 'sucesso') return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ values, step, savedAt: new Date().toISOString() }))
      setSavedAt(new Date())
    }, 800)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [values, step, DRAFT_KEY])

  const setValue = useCallback((key: string, value: unknown) => {
    setValuesState((v) => ({ ...v, [key]: value }))
  }, [])

  const resumeDraft = useCallback(() => {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return false
    try {
      const parsed = JSON.parse(raw)
      setValuesState({ ...emptyValues(config), ...parsed.values })
      setStep(parsed.step === 'welcome' || parsed.step === 'sucesso' ? steps[0]?.id ?? 'revisao' : parsed.step)
      setMode('draft')
      setSavedAt(parsed.savedAt ? new Date(parsed.savedAt) : new Date())
      return true
    } catch { return false }
  }, [config, DRAFT_KEY, steps])

  const hasDraft = useCallback(() => !!localStorage.getItem(DRAFT_KEY), [DRAFT_KEY])

  const loadForEdit = useCallback(() => {
    setValuesState({ ...emptyValues(config), ...config.sampleEdit, consentTruth: true })
    setMode('edit')
    setStep(activeSteps(config, { ...emptyValues(config), ...config.sampleEdit })[0]?.id ?? 'revisao')
  }, [config])

  const submit = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY)
    setStep('sucesso')
  }, [DRAFT_KEY])

  /** erros de um passo pelo id; 'revisao' valida o consentimento */
  const errorsFor = useCallback((stepId: EngineStep, phase: ValidationPhase = 'step'): Record<string, string> => {
    if (stepId === 'revisao') {
      return values.consentTruth ? {} : { consentTruth: CONSENT_ERROR }
    }
    const def = activeSteps(config, values).find((s) => s.id === stepId)
    return def ? fieldErrors(def, values, phase) : {}
  }, [config, values])

  return {
    step, setStep, values, setValue, mode, savedAt,
    steps, errorsFor, resumeDraft, hasDraft, loadForEdit, submit,
  }
}

export type Engine = ReturnType<typeof useFormEngine>
