// ---------------------------------------------------------------------------
// REAL, sourced parliamentary data fetched from majlis.gov.mv.
//
// parliament-work/1845 — "Bill to amend the Maldivian Land Act (1/2002)".
// The per-member roll call is built from the official vote-record PDF, so this
// bill + vote are genuinely real (not illustrative). The same pipeline
// (page → vote PDF → roll call) applies to every bill on the site.
// ---------------------------------------------------------------------------
import type {
  Bill,
  MPVote,
  PartyVoteBreakdown,
  SourceDocument,
  Vote,
  VoteChoice,
} from '@/types'
import { mps } from './roster'
import { ROLLCALL_1845 } from './rollcall1845'

const WORK_URL = 'https://majlis.gov.mv/en/20-parliament/parliament-work/1845'
const VOTE_PDF = 'https://majlis.gov.mv/storage/action_files/1845/qcVvV56lun3HtGc9Cd3z0wh3Yi1wn585U7qRhKYt.pdf'
const BILL_PDF = 'https://majlis.gov.mv/storage/action_files/1845/WuJHehbjieZ10hErpnYlgtYDprIxXlrg7gF4AJZu.pdf'

const officialSource = (id: string, label: string, url: string): SourceDocument => ({
  id,
  label,
  url,
  lastUpdated: '2026-04-13',
  kind: 'official',
})

// Resolve each roll-call row to a real MP via constituency.
const mpByConstituency = new Map(mps.map((m) => [m.constituencyId, m]))

const realMpVotes: MPVote[] = ROLLCALL_1845.flatMap((row) => {
  const mp = mpByConstituency.get(row.constituencyId)
  if (!mp) return []
  return [
    {
      mpId: mp.id,
      voteId: 'vote-land-act-1845',
      choice: row.choice,
      partyId: mp.partyId,
      constituencyId: row.constituencyId,
      detail: row.detail,
    },
  ]
})

function tally(choice: VoteChoice) {
  return realMpVotes.filter((v) => v.choice === choice).length
}

// Party breakdown computed from the real roll call.
const partyBreakdown: PartyVoteBreakdown[] = Object.values(
  realMpVotes.reduce<Record<string, PartyVoteBreakdown>>((acc, v) => {
    const b = (acc[v.partyId] ??= { partyId: v.partyId, yes: 0, no: 0, abstain: 0, absent: 0 })
    if (v.choice === 'Yes') b.yes++
    else if (v.choice === 'No') b.no++
    else if (v.choice === 'Abstain') b.abstain++
    else b.absent++
    return acc
  }, {}),
)

export const realVote1845: Vote = {
  id: 'vote-land-act-1845',
  title: 'Amendment to the Maldivian Land Act (1/2002)',
  billId: 'bill-land-act-1845',
  date: '2026-04-13',
  result: 'Rejected',
  yesCount: tally('Yes'),
  noCount: tally('No'),
  abstainCount: tally('Abstain'),
  absentCount: tally('Absent'),
  themeId: 'housing',
  summary:
    'Open vote on the amendment to the Maldivian Land Act. The amendment was rejected (10 in favour, 49 against).',
  whatItDecided:
    'This was the floor vote on a bill to amend the Maldivian Land Act (No. 1/2002). The amendment did not pass — 49 members voted against and 10 in favour, so the existing Land Act remains unchanged.',
  keyEffects: [
    'The proposed amendment to the Land Act was rejected.',
    'Recorded as an open vote, so each member’s position is on the public record.',
    'Voting split largely along party lines; the bill was sponsored by an opposition member.',
  ],
  partyBreakdown,
  mpVotes: realMpVotes,
  provenance: 'official-rollcall',
  sources: [
    officialSource('src-1845-vote', 'Official vote record (PDF)', VOTE_PDF),
    officialSource('src-1845-work', 'Parliament work item — People’s Majlis', WORK_URL),
  ],
}

export const realBill1845: Bill = {
  id: 'bill-land-act-1845',
  ref: '20/2026/ބ-7',
  title: 'Amendment to the Maldivian Land Act (1/2002)',
  summary:
    'A bill proposing amendments to the Maldivian Land Act (No. 1/2002). Introduced in the 20th Parliament and rejected at the vote on 13 April 2026.',
  whyItMatters:
    'The Land Act governs how land is owned, allocated and transferred in the Maldives. Changes to it affect housing, development rights and who controls land.',
  themeId: 'housing',
  sponsor: 'Hon. Mohamed Ibrahim (North Galolhu)',
  status: 'Rejected',
  currentStage: 'Passed or rejected',
  introducedDate: '2026-02-17',
  lastActionDate: '2026-04-13',
  voteIds: ['vote-land-act-1845'],
  documents: [
    { id: 'doc-1845-bill', label: 'Bill text (PDF)', url: BILL_PDF, kind: 'pdf', lastUpdated: '2026-02-17' },
    { id: 'doc-1845-vote', label: 'Vote record (PDF)', url: VOTE_PDF, kind: 'report', lastUpdated: '2026-04-13' },
  ],
  signalIds: [],
  context:
    'Real data: this bill and its member-by-member vote are sourced from the People’s Majlis (parliament-work/1845). It was rejected at its first reading vote.',
  timeline: [
    { id: 't-1845-1', billId: 'bill-land-act-1845', stage: 'Introduced', title: 'Introduced (4th sitting)', date: '2026-02-17', state: 'completed', source: officialSource('s-1845-intro', 'Parliament work item', WORK_URL) },
    { id: 't-1845-2', billId: 'bill-land-act-1845', stage: 'First reading', title: 'First reading', date: '2026-02-17', state: 'completed' },
    { id: 't-1845-3', billId: 'bill-land-act-1845', stage: 'Debate', title: 'Parliamentary debate (6th sitting)', date: '2026-04-13', daysSincePreviousStage: 55, state: 'completed' },
    { id: 't-1845-4', billId: 'bill-land-act-1845', stage: 'Vote', title: 'Vote — rejected', date: '2026-04-13', daysSincePreviousStage: 0, state: 'completed', source: officialSource('s-1845-vote', 'Official vote record (PDF)', VOTE_PDF) },
    { id: 't-1845-5', billId: 'bill-land-act-1845', stage: 'Passed or rejected', title: 'Rejected by vote', date: '2026-04-13', daysSincePreviousStage: 0, state: 'completed' },
  ],
  sources: [
    officialSource('src-1845-billwork', 'Parliament work item — People’s Majlis', WORK_URL),
    officialSource('src-1845-billpdf', 'Bill text (PDF)', BILL_PDF),
  ],
}
