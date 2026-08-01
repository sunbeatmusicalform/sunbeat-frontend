import { useEffect, useState } from 'react'
import { api, type FieldRequirement, type FormConfigRemote, type FormFieldConfigRemote } from './api'
import type { FieldDef, FormConfig } from '@/engine/types'

export type ValidationPhase = 'step' | 'submit'

const DEFAULT_REQUIREMENTS: Record<string, FieldRequirement> = {
  responsibleName: 'on_step',
  responsibleEmail: 'on_step',
  projectName: 'on_step',
  releaseType: 'on_step',
  releaseDate: 'on_step',
  genre: 'on_step',
  'track.title': 'on_step',
  'track.mainArtists': 'on_step',
  'track.composers': 'on_step',
  'track.hasISRC': 'on_step',
  'track.isrc': 'on_step',
  'track.producer': 'on_step',
  'track.audio': 'on_step',
  focusTrack: 'on_step',
  focusDescription: 'on_step',
  goals: 'on_step',
  hasSpecialGuests: 'on_step',
  guestsBio: 'on_step',
  consentTruth: 'on_submit',
}

export function fieldConfig(config: FormConfigRemote | null | undefined, key: string): FormFieldConfigRemote {
  return config?.fields[key] ?? {
    key,
    step: '',
    label: '',
    hint: '',
    placeholder: '',
    visible: true,
    requirement: DEFAULT_REQUIREMENTS[key] ?? 'optional',
    locked: false,
    lock_reason: '',
    _origin: 'default',
  }
}

export function fieldVisible(config: FormConfigRemote | null | undefined, key: string): boolean {
  return fieldConfig(config, key).visible
}

export function fieldRequired(
  config: FormConfigRemote | null | undefined,
  key: string,
  phase: ValidationPhase = 'step',
): boolean {
  const field = fieldConfig(config, key)
  if (!field.visible || field.requirement === 'optional') return false
  return field.requirement === 'on_step' || phase === 'submit'
}

export function fieldText(
  config: FormConfigRemote | null | undefined,
  key: string,
  property: 'label' | 'hint' | 'placeholder',
  fallback: string,
): string {
  return fieldConfig(config, key)[property] || fallback
}

export function usePublicFormConfig(workspace: string, workflowType = 'release_intake') {
  const [config, setConfig] = useState<FormConfigRemote | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    void api.getFormConfig(workspace, workflowType).then((result) => {
      if (!active) return
      setConfig(result)
      setLoaded(true)
    })
    return () => { active = false }
  }, [workspace, workflowType])

  return { config, loaded }
}

function configuredField(field: FieldDef, remote: FormConfigRemote | null, parentKey?: string): FieldDef {
  const remoteKey = parentKey ? `${parentKey}.${field.key}` : field.key
  const published = remote?.fields[remoteKey] ?? remote?.fields[field.key]
  const nested = field.fields?.map((child) => configuredField(child, remote, field.key))
  if (!published) return nested ? { ...field, fields: nested } : field
  return {
    ...field,
    fields: nested,
    enabled: published.visible,
    requirement: published.requirement,
    required: published.requirement !== 'optional',
    label: published.label || field.label,
    hint: published.hint || field.hint,
    placeholder: published.placeholder || field.placeholder,
  }
}

/** Aplica a configuração pública sem alterar opções, condicionais ou validadores do formulário. */
export function applyPublishedFormConfig(config: FormConfig, remote: FormConfigRemote | null): FormConfig {
  if (!remote) return config
  return {
    ...config,
    steps: config.steps.map((step) => ({
      ...step,
      fields: step.fields.map((field) => configuredField(field, remote)),
    })),
  }
}
