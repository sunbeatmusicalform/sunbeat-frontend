import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

export function Field({
  label, hint, error, required, children, className,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-sm font-bold">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
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
    'border-2 bg-white/70 font-medium placeholder:font-normal placeholder:text-muted-foreground/60 focus-visible:ring-accent',
    invalid ? 'border-accent' : 'border-foreground/20'
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
