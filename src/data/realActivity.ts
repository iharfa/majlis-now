// ---------------------------------------------------------------------------
// REAL activity feed items, derived from the official roll-call votes.
//
// These are NOT invented: each item maps to a real, sourced vote in
// REAL_ROLLCALLS (see realRollcalls.ts / realData.ts). They carry the official
// vote-record PDF as their source and link to the real vote page.
// ---------------------------------------------------------------------------
import type { ActivityFeedItem, SourceDocument } from '@/types'
import { REAL_ROLLCALLS } from './realRollcalls'
import { relativeFromNow } from '@/utils/format'

// Newest first, so real records lead the feed.
const sorted = [...REAL_ROLLCALLS].sort((a, b) => (a.date < b.date ? 1 : -1))

export const realActivity: ActivityFeedItem[] = sorted.map((rc) => {
  const passed = rc.result === 'Passed'
  const source: SourceDocument = {
    id: `feed-real-${rc.id}-src`,
    label: 'Official vote record (PDF)',
    url: rc.votePdf,
    lastUpdated: rc.date,
    kind: 'official',
  }
  return {
    id: `feed-real-${rc.id}`,
    kind: passed ? 'vote-passed' : 'vote-rejected',
    title: passed ? 'Vote passed' : 'Vote rejected',
    summary: `${rc.title} was ${rc.result.toLowerCase()} on a recorded floor vote, ${rc.yes} in favour to ${rc.no} against.`,
    timestamp: rc.date,
    relativeLabel: relativeFromNow(rc.date),
    icon: 'how_to_vote',
    markerColor: passed ? 'bg-primary' : 'bg-error',
    themeId: rc.theme,
    relatedEntityType: 'vote',
    relatedEntityId: `vote-${rc.id}`,
    source,
  }
})
