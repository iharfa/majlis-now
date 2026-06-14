import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/** Page content wrapper with the shared max-width and responsive margins. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('max-w-7xl mx-auto px-container-margin-mobile md:px-container-margin-desktop', className)}>
      {children}
    </div>
  )
}

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  children?: ReactNode
}

export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div className="space-y-2">
        {eyebrow && (
          <span className="text-label-bold font-label-bold uppercase tracking-widest text-primary">{eyebrow}</span>
        )}
        <h1 className="font-headline-lg text-headline-lg text-on-surface max-w-3xl">{title}</h1>
        {description && <p className="font-body-lg text-on-surface-variant max-w-2xl">{description}</p>}
      </div>
      {children}
    </div>
  )
}
