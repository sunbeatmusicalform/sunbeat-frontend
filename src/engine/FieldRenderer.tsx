import { Plus, Trash2, UploadCloud } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Field, inputCls } from '@/sections/ui'
import { isVisible, type Engine } from './useFormEngine'
import type { FieldDef, FormValues } from './types'

function optLabel(f: FieldDef, value: unknown) {
  return f.options?.find((o) => o.value === value)?.label ?? String(value ?? '')
}

function ChoiceButtons({
  f, value, onChange, invalid, multi,
}: {
  f: FieldDef
  value: unknown
  onChange: (v: unknown) => void
  invalid?: boolean
  multi?: boolean
}) {
  const arr = multi ? ((value as string[]) ?? []) : null
  return (
    <div className="flex flex-wrap gap-2">
      {(f.options ?? []).map((o) => {
        const active = multi ? arr!.includes(o.value) : value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              if (multi) {
                onChange(active ? arr!.filter((v) => v !== o.value) : [...arr!, o.value])
              } else {
                onChange(o.value)
              }
            }}
            className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-all
              ${active
                ? 'border-foreground bg-foreground text-background shadow-[2px_2px_0_0_rgba(81,35,20,0.25)]'
                : `${invalid ? 'border-accent' : 'border-foreground/25'} bg-white/60 text-foreground/80 hover:border-foreground/50`}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function FieldRenderer({
  f, engine, errors, showErrors, prefix = '',
}: {
  f: FieldDef
  engine: Engine
  errors: Record<string, string>
  showErrors: boolean
  prefix?: string
}) {
  const errKey = prefix + f.key
  const error = showErrors ? errors[errKey] : undefined
  const value = engine.values[f.key]

  switch (f.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'date':
      return (
        <Field label={f.label} hint={f.hint} error={error} required={f.required} className={f.className}>
          <Input
            type={f.type === 'text' ? 'text' : f.type}
            placeholder={f.placeholder}
            value={String(value ?? '')}
            onChange={(e) => engine.setValue(f.key, e.target.value)}
            className={inputCls(!!error)}
          />
        </Field>
      )

    case 'textarea':
      return (
        <Field label={f.label} hint={f.hint} error={error} required={f.required} className={f.className}>
          <Textarea
            placeholder={f.placeholder}
            value={String(value ?? '')}
            onChange={(e) => engine.setValue(f.key, e.target.value)}
            className={inputCls(!!error) + ' min-h-[110px]'}
          />
        </Field>
      )

    case 'select':
      return (
        <Field label={f.label} hint={f.hint} error={error} required={f.required} className={f.className}>
          <select
            value={String(value ?? '')}
            onChange={(e) => engine.setValue(f.key, e.target.value)}
            className={inputCls(!!error) + ' flex h-9 w-full rounded-md px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1'}
          >
            <option value="">Selecione</option>
            {(f.options ?? []).filter((o) => o.value !== '').map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      )

    case 'radio':
    case 'chips':
      return (
        <Field label={f.label} hint={f.hint} error={error} required={f.required} className={f.className}>
          <ChoiceButtons f={f} value={value} invalid={!!error} multi={f.type === 'chips'}
            onChange={(v) => engine.setValue(f.key, v)} />
        </Field>
      )

    case 'yesno':
      return (
        <Field label={f.label} hint={f.hint} error={error} required={f.required} className={f.className}>
          <ChoiceButtons
            f={{ ...f, options: [{ label: 'Sim', value: 'yes' }, { label: 'Não', value: 'no' }] }}
            value={value} invalid={!!error}
            onChange={(v) => engine.setValue(f.key, v)} />
        </Field>
      )

    case 'file':
      return (
        <Field label={f.label} hint={f.hint} error={error} required={f.required} className={f.className}>
          <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-5 text-sm font-semibold transition-colors
            ${error ? 'border-accent bg-accent/5' : 'border-foreground/25 bg-white/50 hover:border-foreground/50'}`}>
            <UploadCloud className="h-5 w-5 text-accent" />
            <span>{value ? String(value) : (f.placeholder ?? 'Toque para anexar')}</span>
            <input type="file" accept={f.accept} className="hidden"
              onChange={(e) => engine.setValue(f.key, e.target.files?.[0]?.name ?? null)} />
          </label>
        </Field>
      )

    case 'repeater': {
      const items = (value as FormValues[]) ?? []
      return (
        <Field label={f.label} hint={f.hint} error={showErrors ? errors[f.key] : undefined} required={f.required} className={f.className}>
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="sun-card rounded-3xl p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="sun-chip">{f.itemLabel ?? 'Item'} {i + 1}</span>
                  <Button variant="ghost" size="sm" className="text-accent font-bold"
                    onClick={() => engine.setValue(f.key, items.filter((_, j) => j !== i))}>
                    <Trash2 className="mr-1 h-4 w-4" /> Remover
                  </Button>
                </div>
                <div className="grid gap-5">
                  {(f.fields ?? []).filter((sub) => sub.enabled !== false && isVisible(sub.visibleWhen, item)).map((sub) => (
                    <RepeaterField key={sub.key} sub={sub} index={i} parentKey={f.key}
                      engine={engine} errors={errors} showErrors={showErrors} />
                  ))}
                </div>
              </div>
            ))}
            <Button variant="outline" className="rounded-full border-2 font-bold"
              onClick={() => {
                const empty: FormValues = {}
                for (const sub of f.fields ?? []) {
                  empty[sub.key] = sub.type === 'chips' ? [] : sub.type === 'file' ? null : ''
                }
                engine.setValue(f.key, [...items, empty])
              }}>
              <Plus className="mr-1 h-4 w-4" /> Adicionar {f.itemLabel ?? 'item'}
            </Button>
          </div>
        </Field>
      )
    }
  }
}

/** campo dentro de um repeater — lê/escreve em values[parentKey][index] */
function RepeaterField({
  sub, index, parentKey, engine, errors, showErrors,
}: {
  sub: FieldDef
  index: number
  parentKey: string
  engine: Engine
  errors: Record<string, string>
  showErrors: boolean
}) {
  const items = (engine.values[parentKey] as FormValues[]) ?? []
  const item = items[index] ?? {}
  const error = showErrors ? errors[`${parentKey}.${index}.${sub.key}`] : undefined
  const value = item[sub.key]

  function setSub(v: unknown) {
    const next = items.map((it, j) => (j === index ? { ...it, [sub.key]: v } : it))
    engine.setValue(parentKey, next)
  }

  const label = sub.label
  const common = { label, hint: sub.hint, error, required: sub.required, className: sub.className }

  switch (sub.type) {
    case 'text': case 'email': case 'tel': case 'date':
      return (
        <Field {...common}>
          <Input type={sub.type === 'text' ? 'text' : sub.type} placeholder={sub.placeholder}
            value={String(value ?? '')} onChange={(e) => setSub(e.target.value)} className={inputCls(!!error)} />
        </Field>
      )
    case 'textarea':
      return (
        <Field {...common}>
          <Textarea placeholder={sub.placeholder} value={String(value ?? '')}
            onChange={(e) => setSub(e.target.value)} className={inputCls(!!error) + ' min-h-[90px]'} />
        </Field>
      )
    case 'select':
      return (
        <Field {...common}>
          <select value={String(value ?? '')} onChange={(e) => setSub(e.target.value)}
            className={inputCls(!!error) + ' flex h-9 w-full rounded-md px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1'}>
            <option value="">Selecione</option>
            {(sub.options ?? []).filter((o) => o.value !== '').map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      )
    case 'radio': case 'chips':
      return (
        <Field {...common}>
          <ChoiceButtons f={sub} value={value} invalid={!!error} multi={sub.type === 'chips'} onChange={setSub} />
        </Field>
      )
    case 'yesno':
      return (
        <Field {...common}>
          <ChoiceButtons f={{ ...sub, options: [{ label: 'Sim', value: 'yes' }, { label: 'Não', value: 'no' }] }}
            value={value} invalid={!!error} onChange={setSub} />
        </Field>
      )
    case 'file':
      return (
        <Field {...common}>
          <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-5 text-sm font-semibold transition-colors
            ${error ? 'border-accent bg-accent/5' : 'border-foreground/25 bg-white/50 hover:border-foreground/50'}`}>
            <UploadCloud className="h-5 w-5 text-accent" />
            <span>{value ? String(value) : (sub.placeholder ?? 'Toque para anexar')}</span>
            <input type="file" accept={sub.accept} className="hidden"
              onChange={(e) => setSub(e.target.files?.[0]?.name ?? null)} />
          </label>
        </Field>
      )
    default:
      return null
  }
}

/** valor formatado para a tela de revisão */
// eslint-disable-next-line react-refresh/only-export-components
export function reviewValue(f: FieldDef, value: unknown, allValues?: FormValues): string | null {
  if (!isVisible(f.visibleWhen, allValues ?? {})) return null
  if (value === '' || value === null || value === undefined) return null
  if (Array.isArray(value) && f.type !== 'repeater') {
    if (value.length === 0) return null
    return value.map((v) => f.options?.find((o) => o.value === v)?.label ?? String(v)).join(' · ')
  }
  if (f.type === 'yesno') return value === 'yes' ? 'Sim' : 'Não'
  if (f.type === 'select' || f.type === 'radio') return optLabel(f, value)
  return String(value)
}
