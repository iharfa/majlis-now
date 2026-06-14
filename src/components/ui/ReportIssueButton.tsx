import { useState } from 'react'
import { cn } from '@/utils/cn'
import { Icon } from './Icon'

/** Lightweight "report an issue with this data" affordance (prototype only). */
export function ReportIssueButton({ context, className }: { context: string; className?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={() => setDone(true)}
      className={cn(
        'inline-flex items-center gap-1 text-label-sm font-label-bold text-on-surface-variant hover:text-primary transition-colors',
        className,
      )}
      title={`Report a data issue: ${context}`}
    >
      <Icon name={done ? 'check_circle' : 'flag'} className="text-[14px]" />
      {done ? 'Thanks — logged (demo)' : 'Report issue'}
    </button>
  )
}
