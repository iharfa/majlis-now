import type { Confidence } from '@/types'
import { cn } from '@/utils/cn'
import { Icon } from './Icon'

const STYLES: Record<Confidence, string> = {
  High: 'text-secondary',
  Medium: 'text-tertiary',
  Low: 'text-error',
  Unknown: 'text-on-surface-variant',
}

export function ConfidenceBadge({ level, className }: { level: Confidence; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-label-sm font-label-bold', STYLES[level], className)}>
      <Icon name="verified" className="text-[14px]" />
      {level} confidence
    </span>
  )
}
