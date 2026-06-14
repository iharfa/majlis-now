import { Link } from 'react-router-dom'
import type { ActivityFeedItem } from '@/types'
import { Icon } from '@/components/ui/Icon'
import { SourceLink } from '@/components/ui/SourceLink'

function hrefFor(item: ActivityFeedItem): string {
  switch (item.relatedEntityType) {
    case 'bill':
      return `/bills/${item.relatedEntityId}`
    case 'vote':
      return `/votes/${item.relatedEntityId}`
    case 'committee':
      return `/committees/${item.relatedEntityId}`
    case 'mp':
      return `/mps/${item.relatedEntityId}`
    default:
      return '#'
  }
}

export function ActivityItem({ item }: { item: ActivityFeedItem }) {
  // Outer element is a <div> (not a Link) so the inner SourceLink <a> is a
  // sibling, never a nested anchor. The title is the primary link.
  return (
    <div className="group p-4 bg-white rounded-xl border border-outline-variant/30 hover:border-primary/50 transition-colors">
      <div className="flex gap-4">
        <span className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm shrink-0 ${item.markerColor}`}>
          <Icon name={item.icon} className="text-[18px]" />
        </span>
        <div className="flex-grow space-y-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <Link to={hrefFor(item)} className="font-label-bold text-label-bold text-on-surface hover:text-primary transition-colors">
              {item.title}
            </Link>
            <span className="font-label-sm text-label-sm text-outline shrink-0">{item.relativeLabel}</span>
          </div>
          <p className="text-on-surface-variant text-sm">{item.summary}</p>
          {item.source && <SourceLink source={item.source} className="!text-label-sm" />}
        </div>
      </div>
    </div>
  )
}
