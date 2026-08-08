import { cn } from '@/lib/utils'

export function SunbeatLogo({ className, alt = 'Sunbeat' }: { className?: string; alt?: string }) {
  return (
    <img
      src="/brand/logo-horizontal.svg"
      alt={alt}
      className={cn('h-10 w-auto', className)}
    />
  )
}
