import { cn } from '@/utils/cn'
import { Icon } from './Icon'

const REPO = 'https://github.com/iharfa/majlis-now/issues/new'

/** "Report an issue with this data" — opens a pre-filled GitHub issue. */
export function ReportIssueButton({ context, className }: { context: string; className?: string }) {
  const page = typeof window !== 'undefined' ? window.location.href : ''
  const url = `${REPO}?title=${encodeURIComponent(`Data issue: ${context}`)}&body=${encodeURIComponent(`Page: ${page}\n\nWhat looks wrong?\n`)}`
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className={cn('inline-flex items-center gap-1 text-label-sm font-label-bold text-on-surface-variant hover:text-primary transition-colors', className)}
      title={`Report a data issue: ${context}`}
    >
      <Icon name="flag" className="text-[14px]" /> Report issue
    </a>
  )
}
