// Activity feed built from real records only: every roll-call vote and every
// sitting (with its translated agenda when available). Newest first.
import type { ActivityFeedItem } from '@/types'
import { realSittings, realVotes } from './realData'
import { relativeFromNow } from '@/utils/format'

const voteItems: ActivityFeedItem[] = realVotes.map((v) => {
  const passed = v.result === 'Passed'
  const acceptance = v.voteType === 'acceptance'
  return {
    id: `feed-${v.id}`,
    kind: passed ? 'vote-passed' : 'vote-rejected',
    title: acceptance ? (passed ? 'Bill accepted for debate' : 'Bill not taken up') : passed ? 'Bill passed' : 'Bill rejected',
    summary: `${v.title.replace(/ — .*$/, '')}: ${v.yesCount} in favour, ${v.noCount} against.`,
    timestamp: v.date,
    relativeLabel: relativeFromNow(v.date),
    icon: 'how_to_vote',
    markerColor: passed ? 'bg-primary' : 'bg-error',
    themeId: v.themeId,
    relatedEntityType: 'vote',
    relatedEntityId: v.id,
    source: v.sources[0],
  }
})

const sittingItems: ActivityFeedItem[] = realSittings
  .filter((s) => s.date)
  .map((s) => ({
    id: `feed-${s.id}`,
    kind: 'sitting',
    title: s.title,
    summary: s.agenda?.summary ?? `${s.billIds.length} bills on the agenda.`,
    timestamp: s.date,
    relativeLabel: relativeFromNow(s.date),
    icon: 'event',
    markerColor: 'bg-secondary',
    relatedEntityType: 'sitting',
    relatedEntityId: s.id,
    source: s.sources[0],
  }))

export const realActivity: ActivityFeedItem[] = [...voteItems, ...sittingItems].sort((a, b) =>
  b.timestamp.localeCompare(a.timestamp),
)
