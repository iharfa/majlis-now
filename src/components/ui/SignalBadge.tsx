import type { SignalSeverity, SignalType } from '@/types'
import { SEVERITY_STYLES, SIGNAL_META } from '@/utils/signals'
import { cn } from '@/utils/cn'
import { Icon } from './Icon'

interface SignalBadgeProps {
  type: SignalType
  severity?: SignalSeverity
  className?: string
  showLabel?: boolean
}

/** Compact process-signal chip used on bill cards and timelines. */
export function SignalBadge({ type, severity = 'Watch', className, showLabel = true }: SignalBadgeProps) {
  const meta = SIGNAL_META[type]
  const styles = SEVERITY_STYLES[severity]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-label-bold',
        styles.badge,
        className,
      )}
      title={`${meta.label} · ${severity}`}
    >
      <Icon name={meta.icon} className="text-[14px]" />
      {showLabel && meta.label}
    </span>
  )
}

export function SeverityBadge({ severity, className }: { severity: SignalSeverity; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block px-3 py-1 rounded-full text-label-sm font-label-bold status-pill',
        SEVERITY_STYLES[severity].badge,
        className,
      )}
    >
      {severity}
    </span>
  )
}
