import type { SourceDocument } from '@/types'
import { cn } from '@/utils/cn'
import { Icon } from './Icon'

export function SourceLink({ source, className }: { source: SourceDocument; className?: string }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        'inline-flex items-center gap-1 text-label-sm font-label-bold text-primary hover:underline',
        className,
      )}
    >
      <Icon name={source.kind === 'official' ? 'verified' : 'open_in_new'} className="text-[14px]" />
      {source.label}
    </a>
  )
}
