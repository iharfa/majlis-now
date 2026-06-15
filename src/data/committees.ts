import type { Committee, CommitteeMeeting } from '@/types'
import { mps } from './roster'
import { REAL_COMMITTEES, type RealCommittee } from './realCommittees'

// Real committees scraped from majlis.gov.mv (names, chairs, membership, meeting
// dates). Member profile IDs map directly to roster MP ids (mp-<id>).

const ROSTER_IDS = new Set(mps.map((m) => m.id))
const toMp = (id: string | null): string | undefined => {
  if (!id) return undefined
  const mpId = `mp-${id}`
  return ROSTER_IDS.has(mpId) ? mpId : undefined
}
const toMps = (ids: string[]): string[] => ids.map((i) => `mp-${i}`).filter((id) => ROSTER_IDS.has(id))

const MONTHS: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
}

/** "14 May 2026" -> "2026-05-14" */
function toISO(d: string): string {
  const m = d.match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/)
  if (!m) return d
  return `${m[3]}-${MONTHS[m[2]] ?? '01'}-${m[1].padStart(2, '0')}`
}

function build(rc: RealCommittee): Committee {
  const meetings: CommitteeMeeting[] = rc.meetingDates.map((d, i) => ({
    id: `m-${rc.id}-${i}`,
    date: toISO(d),
  }))
  const dates = meetings.map((m) => m.date).sort()
  const latest = dates.at(-1)
  return {
    id: `cmt-${rc.id}`,
    name: rc.name,
    category: rc.category,
    status: rc.status,
    chairMpId: toMp(rc.chairId),
    viceChairMpId: toMp(rc.viceChairId),
    memberMpIds: toMps(rc.memberIds),
    formerMemberMpIds: toMps(rc.formerMemberIds),
    meetings,
    billsReviewedIds: [],
    worksCount: rc.works,
    latestAction: latest ? 'Most recent committee meeting' : undefined,
    latestActionDate: latest,
    stalledItems: [],
    signalIds: [],
    sourceUrl: rc.url,
    sources: [
      {
        id: `src-cmt-${rc.id}`,
        label: 'Committee page — People’s Majlis',
        url: rc.url,
        lastUpdated: '2026-06-15',
        kind: 'official',
      },
    ],
  }
}

export const committees: Committee[] = REAL_COMMITTEES.map(build)

export const committeeById = (id: string) => committees.find((c) => c.id === id)
