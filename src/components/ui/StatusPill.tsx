import type { BillStatus } from '@/types'
import { cn } from '@/utils/cn'

const STATUS_STYLES: Record<BillStatus, string> = {
  Introduced: 'bg-surface-container text-on-surface-variant',
  'In committee': 'bg-secondary-fixed text-on-secondary-fixed-variant',
  'Active debate': 'bg-secondary-container text-on-secondary-container',
  'Vote scheduled': 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Passed: 'bg-primary-container text-on-primary-container',
  Rejected: 'bg-error-container text-on-error-container',
  Ratified: 'bg-primary-container text-on-primary-container',
  Stalled: 'bg-error-container text-on-error-container',
}

export function StatusPill({ status, className }: { status: BillStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block px-3 py-1 rounded-full text-label-sm font-label-bold status-pill',
        STATUS_STYLES[status],
        className,
      )}
    >
      {status}
    </span>
  )
}
