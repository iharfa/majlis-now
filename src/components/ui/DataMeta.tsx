import type { Confidence, SourceDocument } from '@/types'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import { ConfidenceBadge } from './ConfidenceBadge'
import { SourceLink } from './SourceLink'
import { ReportIssueButton } from './ReportIssueButton'

interface DataMetaProps {
  sources: SourceDocument[]
  confidence?: Confidence
  reportContext: string
  className?: string
}

/**
 * The standard evidence footer used on every data card:
 * Source · Last updated · Confidence · Report issue.
 */
export function DataMeta({ sources, confidence, reportContext, className }: DataMetaProps) {
  const lastUpdated = sources
    .map((s) => s.lastUpdated)
    .sort()
    .at(-1)
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 mt-4 border-t border-outline-variant/60 text-on-surface-variant',
        className,
      )}
    >
      {sources.map((s) => (
        <SourceLink key={s.id} source={s} />
      ))}
      {lastUpdated && (
        <span className="text-label-sm font-label-sm text-outline">Updated {formatDate(lastUpdated)}</span>
      )}
      {confidence && <ConfidenceBadge level={confidence} />}
      <ReportIssueButton context={reportContext} className="ml-auto" />
    </div>
  )
}
