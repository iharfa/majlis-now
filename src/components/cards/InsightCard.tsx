import { Link } from 'react-router-dom'
import type { ParliamentSignal } from '@/types'
import { themeById } from '@/data'
import { SEVERITY_STYLES, SIGNAL_META } from '@/utils/signals'
import { SeverityBadge } from '@/components/ui/SignalBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { SourceLink } from '@/components/ui/SourceLink'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/utils/cn'

/** Compact "key things to know" briefing card. */
export function InsightCard({ signal }: { signal: ParliamentSignal }) {
  const meta = SIGNAL_META[signal.type]
  const sev = SEVERITY_STYLES[signal.severity]
  const theme = signal.themeId ? themeById(signal.themeId) : undefined
  const target = signal.billId ? `/bills/${signal.billId}` : signal.voteId ? `/votes/${signal.voteId}` : '/issues'

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <span className={cn('inline-flex items-center gap-1 text-label-sm font-label-bold', sev.text)}>
          <Icon name={meta.icon} className="text-[16px]" /> {meta.label}
        </span>
        <SeverityBadge severity={signal.severity} />
      </div>
      <Link to={target} className="font-headline-md text-lg text-on-surface hover:text-primary transition-colors">
        {signal.title}
      </Link>
      <p className="mt-1 text-sm text-on-surface-variant line-clamp-2">{signal.summary}</p>
      <div className="mt-3 flex items-center gap-3 flex-wrap text-label-sm">
        {theme && <span className="text-outline">{theme.name}</span>}
        <ConfidenceBadge level={signal.confidence} />
      </div>
      <div className="mt-auto pt-3">
        <SourceLink source={signal.sources[0]} className="!text-label-sm" />
      </div>
    </div>
  )
}
