import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

export function Field({
  label, hint, error, required, children, className, htmlFor,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
  htmlFor?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="block text-sm font-bold leading-snug">
          {label} {required && <span className="text-accent">*</span>}
        </label>
      ) : (
        <div className="block text-sm font-bold leading-snug">
          {label} {required && <span className="text-accent">*</span>}
        </div>
      )}
      {hint && <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      {children}
      {error && (
        <p className="flex items-start gap-1.5 text-xs font-semibold text-accent animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  )
}

export function inputCls(invalid?: boolean) {
  return cn(
    'h-11 rounded-xl border bg-white/75 px-3.5 font-medium shadow-[0_1px_2px_rgba(81,35,20,0.04)] transition-[border-color,box-shadow,background-color] placeholder:font-normal placeholder:text-muted-foreground/55 hover:bg-white/90 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20',
    invalid ? 'border-accent ring-2 ring-accent/10' : 'border-foreground/15'
  )
}

export function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl md:text-4xl font-display font-black text-foreground">{title}</h2>
      <p className="mt-2 text-muted-foreground max-w-xl leading-relaxed">{description}</p>
    </div>
  )
}
