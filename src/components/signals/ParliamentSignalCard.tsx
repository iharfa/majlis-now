import { Link } from 'react-router-dom'
import type { ParliamentSignal } from '@/types'
import { SIGNAL_META, SEVERITY_STYLES, SEVERITY_EVIDENCE } from '@/utils/signals'
import { themeById } from '@/data'
import { Icon } from '@/components/ui/Icon'
import { SeverityBadge } from '@/components/ui/SignalBadge'
import { DataMeta } from '@/components/ui/DataMeta'
import { cn } from '@/utils/cn'

interface Props {
  signal: ParliamentSignal
  compact?: boolean
}

/** Full Parliament Signal card: what happened, why, evidence, comparison. */
export function ParliamentSignalCard({ signal, compact }: Props) {
  const meta = SIGNAL_META[signal.type]
  const sev = SEVERITY_STYLES[signal.severity]
  const ev = SEVERITY_EVIDENCE[signal.severity]
  const theme = signal.themeId ? themeById(signal.themeId) : undefined
  const target = signal.billId
    ? `/bills/${signal.billId}`
    : signal.voteId
      ? `/votes/${signal.voteId}`
      : signal.committeeId
        ? `/committees/${signal.committeeId}`
        : '#'

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-white border border-outline-variant/30 shadow-sm hover:shadow-md transition-all flex flex-col">
      <div className="flex justify-between items-start mb-5">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', sev.badge)}>
          <Icon name={meta.icon} className="text-2xl" />
        </div>
        <SeverityBadge severity={signal.severity} />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className={cn('text-label-sm font-label-bold uppercase tracking-wider', sev.text)}>{meta.label}</span>
        {theme && <span className="text-label-sm text-outline">· {theme.name}</span>}
      </div>

      <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{signal.title}</h3>
      <p className="font-body-md text-on-surface-variant">{signal.summary}</p>

      {!compact && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={cn('rounded-xl p-4 flex gap-3', ev.box)}>
            <Icon name={ev.icon} className={cn('text-2xl shrink-0 mt-0.5', ev.iconColor)} />
            <div>
              <p className={cn('text-label-sm font-label-bold uppercase mb-1', ev.label)}>Evidence</p>
              <p className="font-label-bold text-on-surface">{signal.evidenceMetric}</p>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4">
            <p className="text-label-sm font-label-bold uppercase text-outline mb-1">Comparison</p>
            <p className="text-sm text-on-surface-variant">{signal.comparisonText}</p>
          </div>
        </div>
      )}

      {signal.whyItMatters && (
        <p className="mt-4 text-sm text-on-surface-variant">
          <span className="font-label-bold text-on-surface">Why it matters: </span>
          {signal.whyItMatters}
        </p>
      )}

      <div className="mt-auto">
        <DataMeta
          sources={signal.sources}
          confidence={signal.confidence}
          reportContext={`Signal: ${signal.title}`}
          className="!mt-5"
        />
        {target !== '#' && (
          <Link
            to={target}
            className="mt-4 inline-flex items-center gap-1 text-primary font-label-bold text-label-bold hover:underline"
          >
            View evidence <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
        )}
      </div>
    </div>
  )
}
