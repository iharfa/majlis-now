// ---------------------------------------------------------------------------
// REAL, sourced parliamentary data from majlis.gov.mv.
//
//  - works.json      every bill's work page (scripts/fetch_works.py)
//  - realRollcalls   OCR'd roll-call votes, validated (scripts/build_real_votes.py)
//  - sittings.json   sittings + agenda PDFs (scripts/fetch_sittings.py)
//  - summaries/*.json, agendas/*.json  Claude translations of the Dhivehi PDFs
// ---------------------------------------------------------------------------
import type {
  AgendaDoc,
  Bill,
  MinutesDigest,
  BillDocument,
  BillStage,
  BillStatus,
  BillSummary,
  BillTimelineEvent,
  MPVote,
  PartyVoteBreakdown,
  Sitting,
  SourceDocument,
  Vote,
} from '@/types'
import { mps, slug, TENURE } from './roster'
import { REAL_ROLLCALLS, type RealRollcall } from './realRollcalls'
import works from './works.json'
import sittingsJson from './sittings.json'

const summaryByWork = new Map(
  Object.values(import.meta.glob<BillSummary>('./summaries/*.json', { eager: true, import: 'default' })).map((s) => [s.workId, s]),
)
const agendaBySitting = new Map(
  Object.values(import.meta.glob<AgendaDoc>('./agendas/*.json', { eager: true, import: 'default' })).map((a) => [a.sittingId, a]),
)
const minutesBySitting = new Map(
  Object.values(import.meta.glob<MinutesDigest>('./minutes/*.json', { eager: true, import: 'default' })).map((m) => [m.sittingId, m]),
)
const mpBySlug = new Map(mps.map((m) => [m.constituencyId, m]))
const mpByName = new Map(mps.map((m) => [m.name.toLowerCase().replace(/^dr\.?\s+/, ''), m]))

/** Attach roster ids to the speakers Claude named in the minutes (by constituency, then by name). */
function linkSpeakers(d: MinutesDigest): MinutesDigest {
  return {
    ...d,
    speakers: d.speakers.map((sp) => {
      const mp = mpBySlug.get(slug(sp.constituency || '')) ?? mpByName.get((sp.name || '').toLowerCase().replace(/^dr\.?\s+/, ''))
      return mp ? { ...sp, mpId: mp.id } : sp
    }),
  }
}

/** The member who held a seat on a given date (seats that changed hands use TENURE). */
function mpForSeat(constituencyId: string, date: string) {
  const holders = mps.filter((m) => m.constituencyId === constituencyId)
  if (holders.length <= 1) return holders[0]
  return holders.find((m) => {
    const t = TENURE[m.id.replace('mp-', '')] ?? {}
    return (!t.from || date >= t.from) && (!t.until || date <= t.until)
  })
}
const mpByConstituency = new Map(mps.map((m) => [m.constituencyId, m]))

const src = (id: string, label: string, url: string, date: string): SourceDocument => ({
  id, label, url, lastUpdated: date, kind: 'official',
})

// --- Theme by title keyword (whole words; "land" must not match "Islands") ----
const THEME_RULES: Array<[RegExp, string]> = [
  [/\btransport\b/, 'economy'],
  [/\bland\b|\bhousing\b|\bresidency\b|islands and lagoons/, 'housing'],
  [/\bconstitution\b|asset recovery/, 'governance'],
  [/decentraliz/, 'councils'],
  [/\bpension\b|\bhealth\b|\beducation\b/, 'welfare'],
  [/\bemployment\b|\bexport\b|\bimport\b|\btourism\b|\btax\b|\bcurrency\b|\bpayment\b|\butility\b|digital transformation/, 'economy'],
  [/\bfisheries\b|\bwaste\b|\benvironment\b|\bclimate\b/, 'environment'],
  [/\bpenal\b|\bcriminal\b|\bsexual\b|\bpolice\b|\bcourt/, 'justice'],
  [/national service|\bimmigration\b|\bsecurity\b(?! bill)/, 'security'],
  [/data protection|digital identity|\bcyber\b|\bmedia\b|\bspeech\b/, 'media'],
]
export const themeOf = (title: string): string => {
  const t = title.toLowerCase()
  return THEME_RULES.find(([rx]) => rx.test(t))?.[1] ?? 'governance'
}

// --- Majlis stage/status names -> app enums ---------------------------------
const STATUS: Record<string, BillStatus> = {
  'First Reading': 'Introduced', 'Parliamentary Debate': 'Active debate', 'Committee Stage': 'In committee',
  'Third Reading': 'Vote scheduled', 'Passed at Parliament': 'Passed', 'Rejected by Vote': 'Rejected', Withdrawn: 'Withdrawn',
}
const STAGE: Record<string, BillStage> = {
  'First Reading': 'First reading', 'Parliamentary Debate': 'Debate', 'Committee Stage': 'Committee meetings',
  'Third Reading': 'Vote', 'Passed at Parliament': 'Passed or rejected', 'Rejected by Vote': 'Passed or rejected', Withdrawn: 'Withdrawn',
}
const STAGE_TITLE: Record<string, string> = {
  'First Reading': 'Introduced (first reading)', 'Parliamentary Debate': 'Debated on the floor',
  'Committee Stage': 'In committee', 'Third Reading': 'Third reading', 'Passed at Parliament': 'Passed at Parliament',
  'Rejected by Vote': 'Rejected by vote', Withdrawn: 'Withdrawn',
}

type Work = (typeof works)[number]

// --- Votes -------------------------------------------------------------------
function buildVote(rc: RealRollcall): Vote {
  const voteId = `vote-${rc.id}`
  const mpVotes: MPVote[] = rc.rows.flatMap((row) => {
    const mp = mpForSeat(row.constituencyId, rc.date)
    return mp ? [{ mpId: mp.id, voteId, choice: row.choice, partyId: mp.partyId, constituencyId: row.constituencyId, detail: row.detail }] : []
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
  const notPresent = rc.rows.filter((r) => r.detail === 'Not Present').length
  const notVoted = rc.rows.filter((r) => r.detail === 'Not Voted').length
  const passed = rc.result === 'Passed'
  const acceptance = rc.voteType === 'acceptance'
  const counts = `${rc.yes} in favour, ${rc.no} against`
  const whatItDecided = acceptance
    ? passed
      ? `Parliament voted to accept the bill for consideration (${counts}), so it moves to committee stage. This is not the final vote on the bill.`
      : `Parliament voted not to take the bill up (${counts}), so it goes no further.`
    : passed
      ? `This was the final vote on the bill. It passed (${counts}) and now goes to the President for ratification.`
      : `This was the final vote on the bill. It was rejected (${counts}) and goes no further.`
  return {
    id: voteId,
    title: `${rc.title} — ${acceptance ? 'vote to accept the bill' : 'final vote'}`,
    voteType: rc.voteType,
    billId: `bill-${rc.workId}`,
    date: rc.date,
    result: rc.result,
    yesCount: rc.yes, noCount: rc.no, abstainCount: rc.abstain, absentCount: rc.absent,
    themeId: themeOf(rc.title),
    summary: `${acceptance ? 'Vote to accept' : 'Final vote on'} the ${rc.title}: ${rc.result.toLowerCase()}, ${counts}.`,
    whatItDecided,
    keyEffects: [
      `${rc.result} with ${counts}.`,
      `${notPresent} members were not present; ${notVoted} were present but did not vote. Both count as “Absent” below.`,
      'Recorded as an open vote — every member’s position is public.',
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

export const realVotes: Vote[] = REAL_ROLLCALLS.map(buildVote)
const rollcallsByWork = new Map<string, RealRollcall[]>()
for (const rc of REAL_ROLLCALLS) rollcallsByWork.set(rc.workId, [...(rollcallsByWork.get(rc.workId) ?? []), rc])

// --- Bills -------------------------------------------------------------------
function buildBill(w: Work): Bill {
  const id = `bill-${w.id}`
  const rcs = rollcallsByWork.get(w.id) ?? []
  const acceptance = rcs.find((r) => r.voteType === 'acceptance')
  const passage = rcs.find((r) => r.voteType === 'passage')
  const sittingDates = w.sittings.map((s) => s.date).filter((d): d is string => !!d).sort()
  const introduced = sittingDates[0] ?? acceptance?.date ?? passage?.date ?? w.fetchedAt
  const lastAction = [sittingDates.at(-1), acceptance?.date, passage?.date].filter((d): d is string => !!d).sort().at(-1) ?? introduced

  const stageDate = (name: string): string | undefined => {
    if (name === 'First Reading') return introduced
    if (name === 'Committee Stage') return acceptance?.date
    if (name === 'Passed at Parliament' || name === 'Rejected by Vote') return passage?.date ?? lastAction
    if (name === 'Withdrawn') return lastAction
    return undefined
  }
  const timeline: BillTimelineEvent[] = w.stages.map((s, i) => ({
    id: `t-${w.id}-${i}`,
    billId: id,
    stage: STAGE[s.name] ?? 'Debate',
    title: STAGE_TITLE[s.name] ?? s.name,
    date: s.state === 'upcoming' ? undefined : stageDate(s.name),
    state: s.state as BillTimelineEvent['state'],
  }))

  const sponsorMp = mpByConstituency.get(slug(w.sponsor.constituency))
  const ai = summaryByWork.get(w.id)
  const documents: BillDocument[] = w.documents.map((d, i) => ({
    id: `doc-${w.id}-${i}`, label: d.label, url: d.url, kind: 'pdf', lastUpdated: w.fetchedAt,
  }))
  return {
    id,
    ref: w.number || `Majlis work #${w.id}`,
    title: w.title,
    summary: ai?.summary ?? w.summary,
    officialSummary: w.summary,
    whyItMatters: ai?.whyItMatters ?? 'The bill text is in Dhivehi; a plain-language summary has not been generated yet. The official documents are linked below.',
    themeId: themeOf(w.title),
    sponsor: w.sponsor.name ? `${w.sponsor.name}, MP for ${w.sponsor.constituency}` : 'Not stated',
    sponsorMpId: sponsorMp?.id,
    aiSummary: ai,
    status: STATUS[w.status] ?? 'Introduced',
    currentStage: STAGE[w.status] ?? 'Introduced',
    introducedDate: introduced,
    lastActionDate: lastAction,
    committeeId: w.committeeId ? `cmt-${w.committeeId}` : undefined,
    sittingIds: w.sittings.map((s) => `sitting-${s.id}`),
    voteIds: rcs.map((r) => `vote-${r.id}`),
    documents,
    signalIds: [],
    timeline,
    sources: [src(`src-${w.id}-work`, 'Parliament work item — People’s Majlis', w.url, w.fetchedAt)],
  }
}

export const realBills: Bill[] = works.map(buildBill)

// --- Sittings ----------------------------------------------------------------
export const realSittings: Sitting[] = sittingsJson.map((s) => {
  const minutes = minutesBySitting.get(s.id)
  return {
    id: `sitting-${s.id}`,
    title: s.title,
    date: s.date ?? '',
    term: s.term,
    agendaNo: s.agendaNo,
    agendaPdf: s.agendaPdf ?? undefined,
    minutesPdf: s.minutesPdf ?? undefined,
    pointOfOrderPdf: s.pointOfOrderPdf ?? undefined,
    billIds: s.workIds.map((w) => `bill-${w}`),
    url: s.url,
    agenda: agendaBySitting.get(s.id),
    minutes: minutes ? linkSpeakers(minutes) : undefined,
    sources: [src(`src-sitting-${s.id}`, 'Sitting page — People’s Majlis', s.url, s.fetchedAt)],
  }
})
