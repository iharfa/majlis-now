import type { BillTimelineEvent } from '@/types'
import { SIGNAL_META } from '@/utils/signals'
import { formatDate } from '@/utils/format'
import { Icon } from '@/components/ui/Icon'
import { SourceLink } from '@/components/ui/SourceLink'
import { cn } from '@/utils/cn'

/**
 * Vertical legislative timeline. Compact (sticky sidebar) and full variants.
 */
export function BillTimeline({
  events,
  variant = 'full',
}: {
  events: BillTimelineEvent[]
  variant?: 'full' | 'compact'
}) {
  return (
    <ol className="relative space-y-8">
      {/* spine */}
      <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-outline-variant" aria-hidden />
      {events.map((e) => {
        const isCurrent = e.state === 'current'
        const isDone = e.state === 'completed'
        return (
          <li key={e.id} className={cn('relative pl-10', e.state === 'upcoming' && 'opacity-60')}>
            <span
              className={cn(
                'absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center z-10',
                isDone && 'bg-primary text-white',
                isCurrent && 'border-4 border-primary bg-white',
                e.state === 'upcoming' && 'border-2 border-outline-variant bg-surface-container',
              )}
            >
              {isDone && <Icon name="check" className="text-white text-[14px]" />}
            </span>
            {isCurrent && (
              <span className="absolute -left-1 -top-0.5 w-8 h-8 rounded-full bg-primary/20 animate-ping" aria-hidden />
            )}

            <h4
              className={cn(
                'font-label-bold text-label-bold leading-tight',
                isCurrent ? 'text-primary' : 'text-on-surface',
              )}
            >
              {e.title}
            </h4>
            <p className="text-label-sm text-on-surface-variant mt-1">
              {e.date ? formatDate(e.date) : <span className="italic">{e.expectedLabel ?? 'Pending'}</span>}
              {e.daysSincePreviousStage != null && variant === 'full' && (
                <span className="text-outline"> · +{e.daysSincePreviousStage}d</span>
              )}
            </p>

            {variant === 'full' && e.description && (
              <p className="text-sm text-on-surface-variant mt-1">{e.description}</p>
            )}

            {e.signalType && (
              <span className="mt-1 inline-flex items-center gap-1 text-label-sm font-label-bold text-tertiary">
                <Icon name={SIGNAL_META[e.signalType].icon} className="text-[14px]" />
                {SIGNAL_META[e.signalType].phrase}
              </span>
            )}

            {variant === 'full' && e.source && (
              <div className="mt-1">
                <SourceLink source={e.source} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
