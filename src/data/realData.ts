// ---------------------------------------------------------------------------
// REAL, sourced parliamentary data from majlis.gov.mv.
//
// Built from official vote-record PDFs (OCR'd, mapped to the roster by
// constituency, and validated so row tallies match each PDF's printed summary).
// See scripts/build_real_votes.py + src/data/realRollcalls.ts.
// ---------------------------------------------------------------------------
import type {
  Bill,
  BillTimelineEvent,
  MPVote,
  PartyVoteBreakdown,
  SourceDocument,
  Vote,
} from '@/types'
import { mps } from './roster'
import { REAL_ROLLCALLS, type RealRollcall } from './realRollcalls'

const mpByConstituency = new Map(mps.map((m) => [m.constituencyId, m]))

const src = (id: string, label: string, url: string, date: string): SourceDocument => ({
  id,
  label,
  url,
  lastUpdated: date,
  kind: 'official',
})

function buildVote(rc: RealRollcall): Vote {
  const voteId = `vote-${rc.id}`
  const mpVotes: MPVote[] = rc.rows.flatMap((row) => {
    const mp = mpByConstituency.get(row.constituencyId)
    if (!mp) return []
    return [
      {
        mpId: mp.id,
        voteId,
        choice: row.choice,
        partyId: mp.partyId,
        constituencyId: row.constituencyId,
        detail: row.detail,
      },
    ]
  })

  const partyBreakdown: PartyVoteBreakdown[] = Object.values(
    mpVotes.reduce<Record<string, PartyVoteBreakdown>>((acc, v) => {
      const b = (acc[v.partyId] ??= { partyId: v.partyId, yes: 0, no: 0, abstain: 0, absent: 0 })
      if (v.choice === 'Yes') b.yes++
      else if (v.choice === 'No') b.no++
      else if (v.choice === 'Abstain') b.abstain++
      else b.absent++
      return acc
    }, {}),
  )

  const passed = rc.result === 'Passed'
  return {
    id: voteId,
    title: rc.title,
    billId: `bill-${rc.id}`,
    date: rc.date,
    result: rc.result,
    yesCount: rc.yes,
    noCount: rc.no,
    abstainCount: rc.abstain,
    absentCount: rc.absent,
    themeId: rc.theme,
    summary: `Recorded floor vote on the ${rc.title}. Result: ${rc.result.toLowerCase()} (${rc.yes} in favour, ${rc.no} against).`,
    whatItDecided: `This was the recorded vote on the ${rc.title}. It was ${rc.result.toLowerCase()} — ${rc.no} members voted against and ${rc.yes} in favour${
      passed ? ', so the change takes effect' : ', so it did not pass'
    }. Each member’s position is on the public record below.`,
    keyEffects: [
      `${passed ? 'Passed' : 'Rejected'} with ${rc.yes} in favour and ${rc.no} against.`,
      'Recorded as an open vote — every member’s position is public.',
      '“Absent” combines members recorded as not present or not voted.',
    ],
    partyBreakdown,
    mpVotes,
    provenance: 'official-rollcall',
    sources: [
      src(`src-${rc.id}-vote`, 'Official vote record (PDF)', rc.votePdf, rc.date),
      src(`src-${rc.id}-work`, 'Parliament work item — People’s Majlis', rc.workUrl, rc.date),
    ],
  }
}

function buildBill(rc: RealRollcall): Bill {
  const passed = rc.result === 'Passed'
  const timeline: BillTimelineEvent[] = [
    {
      id: `t-${rc.id}-vote`,
      billId: `bill-${rc.id}`,
      stage: 'Vote',
      title: `Floor vote — ${rc.result.toLowerCase()}`,
      date: rc.date,
      state: 'completed',
      source: src(`s-${rc.id}-vote`, 'Official vote record (PDF)', rc.votePdf, rc.date),
    },
    {
      id: `t-${rc.id}-result`,
      billId: `bill-${rc.id}`,
      stage: 'Passed or rejected',
      title: passed ? 'Passed at Parliament' : 'Rejected by vote',
      date: rc.date,
      daysSincePreviousStage: 0,
      state: 'completed',
    },
  ]
  return {
    id: `bill-${rc.id}`,
    ref: `Majlis work #${rc.id}`,
    title: rc.title,
    summary: `${rc.title}. Decided by recorded vote in the 20th Parliament — ${rc.result.toLowerCase()} (${rc.yes}–${rc.no}).`,
    whyItMatters:
      'This was decided by a recorded, open vote, so you can see exactly how each MP acted — the core accountability record this platform exists to surface.',
    themeId: rc.theme,
    sponsor: 'See official record',
    status: passed ? 'Passed' : 'Rejected',
    currentStage: 'Passed or rejected',
    introducedDate: rc.date,
    lastActionDate: rc.date,
    voteIds: [`vote-${rc.id}`],
    documents: [
      { id: `doc-${rc.id}-vote`, label: 'Vote record (PDF)', url: rc.votePdf, kind: 'report', lastUpdated: rc.date },
    ],
    signalIds: [],
    context:
      'Real data: this bill and its member-by-member vote are sourced from the People’s Majlis and validated against the official tally.',
    timeline,
    sources: [src(`src-${rc.id}-billwork`, 'Parliament work item — People’s Majlis', rc.workUrl, rc.date)],
  }
}

export const realVotes: Vote[] = REAL_ROLLCALLS.map(buildVote)
export const realBills: Bill[] = REAL_ROLLCALLS.map(buildBill)
