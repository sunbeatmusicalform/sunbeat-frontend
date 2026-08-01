import type { LucideIcon } from 'lucide-react'

export type FieldType =
  | 'text' | 'email' | 'tel' | 'date' | 'textarea'
  | 'select' | 'radio' | 'yesno' | 'chips' | 'file' | 'repeater'

export interface Option {
  label: string
  value: string
}

/** Condição de visibilidade: todas precisam ser verdadeiras */
export interface VisibleWhen {
  key: string
  /** igualdade estrita (valores simples) */
  equals?: unknown
  /** para campos de múltipla escolha (chips): verdadeiro se o array contém o valor */
  contains?: unknown
}

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  required?: boolean
  /** exigência publicada pelo portal; quando ausente, usa `required` legado */
  requirement?: 'optional' | 'on_submit' | 'on_step'
  /** false quando o tenant ocultou o campo no portal */
  enabled?: boolean
  hint?: string
  placeholder?: string
  options?: Option[]
  visibleWhen?: VisibleWhen[]
  validate?: 'email' | 'url'
  accept?: string
  /** repeater */
  itemLabel?: string
  fields?: FieldDef[]
  minItems?: number
  /** classes extra no wrapper */
  className?: string
}

export interface StepDef {
  id: string
  label: string
  hint: string
  title: string
  description: string
  fields: FieldDef[]
  /** passo inteiro condicional (ex.: tracks só para um formato) */
  visibleWhen?: VisibleWhen[]
  /** regras que cruzam campos (ex.: CPF ou e-mail, ao menos um) */
  customValidate?: (values: FormValues) => Record<string, string>
}

export interface WelcomeCard {
  icon: LucideIcon
  title: string
  desc: string
}

export interface SuccessStep {
  title: string
  desc: string
}

export type FormValues = Record<string, unknown>

export interface FormConfig {
  slug: string
  /** workflow persistido em workspace_workflow_settings */
  workflowType?: 'release_intake' | 'rights_clearance' | 'people_registry' | 'company_registry'
  clientName: string
  /** chip do topo da welcome, ex.: "Atabaque · Rights Clearance" */
  chip: string
  title: string
  accentWord?: string
  subtitle: string
  estimate: string
  haveReady: string
  welcomeCards: WelcomeCard[]
  steps: StepDef[]
  /** dados simulados para o edit mode ("Editar uma submissão enviada") */
  sampleEdit: FormValues
  successHeading: string
  successLead: string
  successSteps: SuccessStep[]
  restartLabel: string
}
