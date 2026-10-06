// ---------------------------------------------------------------------------
// Majlis Now — core data model
//
// These types describe parliamentary entities. Every record is built from
// official majlis.gov.mv pages/PDFs (see src/data + scripts/), and carries
// source / confidence / last-updated fields so provenance is always visible.
// ---------------------------------------------------------------------------

export type Confidence = 'High' | 'Medium' | 'Low' | 'Unknown'

/** Evidence pointer attached to almost every record. */
export interface SourceDocument {
  id: string
  label: string
  url: string
  /** ISO date the source was last checked/updated. */
  lastUpdated: string
  /** Whether this is a verified real source or placeholder mock data. */
  kind: 'official' | 'press' | 'mock'
}

// --- Process signals --------------------------------------------------------

export type SignalSeverity = 'Watch' | 'Concern' | 'High concern'

export type SignalType =
  | 'moving-fast'
  | 'delayed'
  | 'stalled'
  | 'high-impact-fast-track'
  | 'missing-public-trace'
  | 'high-absence'
  | 'quiet-committee-movement'
  | 'ready-not-voted'
  | 'late-amendment'
  | 'end-of-session-risk'
  | 'committee-delay'

export type SignalReviewStatus = 'Auto-flagged' | 'Reviewed' | 'Explained'

export interface ParliamentSignal {
  id: string
  type: SignalType
  severity: SignalSeverity
  title: string
  /** Plain-language "what happened". */
  summary: string
  /** Why it matters to the public. */
  whyItMatters?: string
  themeId?: string
  billId?: string
  voteId?: string
  committeeId?: string
  /** The hard number behind the flag, e.g. "Passed in 4 days". */
  evidenceMetric: string
  /** Comparison to the typical case, e.g. "Similar bills took a median of 28 days". */
  comparisonText: string
  confidence: Confidence
  reviewStatus: SignalReviewStatus
  sources: SourceDocument[]
  createdAt: string
  updatedAt: string
}

// --- People & parties -------------------------------------------------------

export type Alignment = 'Government' | 'Opposition' | 'Coalition' | 'Independent'

export interface Party {
  id: string
  name: string
  shortName: string
  /** Tailwind-friendly hex used for chips/bars. */
  color: string
  alignment: Alignment
}

export interface Constituency {
  id: string
  name: string
  atoll: string
  /** Islands / cities covered, used by Find-your-MP search. */
  islands: string[]
}

export type VoteChoice = 'Yes' | 'No' | 'Abstain' | 'Absent'

export type VoteMeaning =
  | 'Expanded public rights'
  | 'Restricted public rights'
  | 'Expanded state power'
  | 'Improved oversight'
  | 'Reduced oversight'
  | 'Procedural vote'
  | 'Absent'
  | 'Unclear'

export interface IssueRecord {
  themeId: string
  expandedOversight: number
  restrictedOversight: number
  absent: number
  /** Short description of the latest key vote in this theme. */
  latestKeyVote: string
}

export interface MPActivityItem {
  id: string
  date: string
  /** e.g. "voted", "inquiry", "committee", "absence". */
  kind: 'vote-for' | 'vote-against' | 'inquiry' | 'committee' | 'absence' | 'sponsor'
  title: string
  description: string
  relatedEntityType?: EntityType
  relatedEntityId?: string
}

export interface MP {
  id: string
  name: string
  /** Official photo (from majlis.gov.mv). When absent the UI renders initials. */
  photoUrl?: string
  initials: string
  constituencyId: string
  partyId: string
  /** Leadership role, e.g. "Speaker", "Deputy Speaker", "Majority Leader". */
  leadershipRole?: string
  /** Link to the official member profile page. */
  profileUrl?: string
  committeeIds?: string[]
  bio?: string
  active: boolean
  // --- The fields below are NOT published as open data by the Majlis. They are
  // optional and left undefined for real members so the UI never attributes a
  // fabricated voting/attendance record to a real, named person.
  /** 0–100. */
  sittingAttendance?: number
  committeeAttendance?: number
  votesCast?: number
  keyVoteAbsences?: number
  billsSponsored?: number
  questionsAsked?: number
  recentActivity?: MPActivityItem[]
  issueRecords?: IssueRecord[]
  sources: SourceDocument[]
}

// --- Bills ------------------------------------------------------------------

export type BillStage =
  | 'Introduced'
  | 'First reading'
  | 'Sent to committee'
  | 'Committee meetings'
  | 'Committee report'
  | 'Amendments'
  | 'Debate'
  | 'Vote'
  | 'Passed or rejected'
  | 'Ratified or published'
  | 'Withdrawn'

export type BillStatus =
  | 'Introduced'
  | 'In committee'
  | 'Active debate'
  | 'Vote scheduled'
  | 'Passed'
  | 'Rejected'
  | 'Ratified'
  | 'Stalled'
  | 'Withdrawn'

export interface BillTimelineEvent {
  id: string
  billId: string
  stage: BillStage
  title: string
  /** ISO date, or undefined if the stage is expected/not yet reached. */
  date?: string
  /** "Expected Apr 15" style hint for future stages. */
  expectedLabel?: string
  description?: string
  source?: SourceDocument
  daysSincePreviousStage?: number
  signalType?: SignalType
  /** completed | current | upcoming */
  state: 'completed' | 'current' | 'upcoming'
}

export interface BillDocument {
  id: string
  label: string
  url: string
  kind: 'pdf' | 'report' | 'amendment' | 'link'
  lastUpdated: string
}

export interface Bill {
  id: string
  /** Public-facing bill reference: the Majlis bill number, e.g. "20/2026/ބ-26". */
  ref: string
  title: string
  /** Plain-language summary (AI-translated from the Dhivehi bill when available). */
  summary: string
  /** The one-liner published on the Majlis work page. */
  officialSummary: string
  whyItMatters: string
  themeId: string
  sponsor: string
  sponsorMpId?: string
  /** AI translation/summary of the bill text, with its own provenance fields. */
  aiSummary?: BillSummary
  /** Sittings at which this bill was on the agenda (newest first). */
  sittingIds: string[]
  status: BillStatus
  currentStage: BillStage
  introducedDate: string
  lastActionDate: string
  committeeId?: string
  timeline: BillTimelineEvent[]
  voteIds: string[]
  documents: BillDocument[]
  signalIds: string[]
  /** "Did you know" contextual note shown on the bill page. */
  context?: string
  sources: SourceDocument[]
}

// --- Votes ------------------------------------------------------------------

export type VoteResult = 'Passed' | 'Rejected' | 'Tied'

export interface PartyVoteBreakdown {
  partyId: string
  yes: number
  no: number
  abstain: number
  absent: number
}

export interface MPVote {
  mpId: string
  voteId: string
  choice: VoteChoice
  partyId: string
  constituencyId: string
  /** Issue-classification of this vote. Optional — real roll calls don't carry one. */
  meaning?: VoteMeaning
  /** Official wording behind the 4-way choice, e.g. "Not Present" vs "Not Voted". */
  detail?: string
}

/** Whether a vote's per-member breakdown is real (sourced) or illustrative. */
export type VoteProvenance = 'official-rollcall' | 'illustrative'

/** What a floor vote was for. */
export type VoteType = 'acceptance' | 'passage'

export interface Vote {
  id: string
  title: string
  /** acceptance = vote to take the bill up (sends it to committee); passage = final vote. */
  voteType: VoteType
  billId?: string
  issueId?: string
  date: string
  result: VoteResult
  yesCount: number
  noCount: number
  abstainCount: number
  absentCount: number
  summary: string
  /** Plain-language answer to "what did this vote decide?". */
  whatItDecided: string
  /** Bulleted key effects of the vote. */
  keyEffects: string[]
  themeId?: string
  partyBreakdown: PartyVoteBreakdown[]
  mpVotes: MPVote[]
  /** 'official-rollcall' = per-member data is real & sourced; default illustrative. */
  provenance?: VoteProvenance
  sources: SourceDocument[]
}

// --- Committees -------------------------------------------------------------

export interface CommitteeMeeting {
  id: string
  date: string
  subject?: string
  attendance?: number // 0–100, when published
  source?: SourceDocument
}

export interface Committee {
  id: string
  name: string
  /** Grouping, e.g. "State Institutions related Standing Committees". */
  category?: string
  status?: 'Ongoing' | 'Completed'
  chairMpId?: string
  viceChairMpId?: string
  memberMpIds: string[]
  formerMemberMpIds?: string[]
  meetings: CommitteeMeeting[]
  /** Average attendance, when published. */
  attendance?: number
  billsReviewedIds?: string[]
  reportsProduced?: number
  worksCount?: number
  latestAction?: string
  latestActionDate?: string
  stalledItems?: string[]
  signalIds?: string[]
  /** Link to the official committee page. */
  sourceUrl?: string
  attendanceRecord?: CommitteeAttendance
  sources: SourceDocument[]
}

// --- Issues & themes --------------------------------------------------------

export interface IssueTheme {
  id: string
  name: string
  description: string
  /** Material Symbols icon name. */
  icon: string
  /** Tailwind color token (without the bg-/text- prefix) used for accents. */
  accent: string
  publicImpact: string
}

export interface DecisionPoint {
  id: string
  issueId: string
  question: string
  classificationOptions: VoteMeaning[]
  relatedVoteIds: string[]
  confidence: Confidence
  sources: SourceDocument[]
}

export interface Issue {
  id: string
  themeId: string
  title: string
  plainLanguageQuestion: string
  whyItMatters: string
  relatedBillIds: string[]
  relatedVoteIds: string[]
  decisionPoints: DecisionPoint[]
  sources: SourceDocument[]
}

// --- Activity feed ----------------------------------------------------------

export type EntityType = 'bill' | 'vote' | 'mp' | 'committee' | 'issue' | 'theme' | 'sitting'

export type ActivityKind =
  | 'vote-passed'
  | 'vote-rejected'
  | 'bill-tabled'
  | 'bill-movement'
  | 'committee-hearing'
  | 'sitting'
  | 'signal'

export interface ActivityFeedItem {
  id: string
  kind: ActivityKind
  title: string
  summary: string
  timestamp: string
  /** Human relative label e.g. "15m ago". */
  relativeLabel: string
  icon: string
  /** Tailwind color token for the marker. */
  markerColor: string
  themeId?: string
  relatedEntityType?: EntityType
  relatedEntityId?: string
  source?: SourceDocument
}

// --- AI-translated documents (Dhivehi PDFs read by Claude) -----------------

export interface BillSummary {
  workId: string
  titleDv: string
  summary: string
  whyItMatters: string
  keyProvisions: string[]
  whoIsAffected: string
  statedReasons: string
  sourceDoc: string
  pagesRead: number
  pagesTotal: number
  confidence: Confidence
  model: string
  generatedAt: string
}

export interface AgendaItem {
  n: number
  text: string
  workId?: string
  kind: 'procedural' | 'bill' | 'resolution' | 'report' | 'vote' | 'question' | 'other'
}

export interface AgendaDoc {
  sittingId: string
  date: string
  title: string
  agendaNo: string
  items: AgendaItem[]
  summary: string
  pagesRead: number
  pagesTotal: number
  confidence: Confidence
  model: string
  generatedAt: string
}

// --- Sittings ---------------------------------------------------------------

export interface Sitting {
  id: string
  title: string
  date: string
  /** e.g. "2026 Second Term" */
  term?: string
  agendaNo: string
  agendaPdf?: string
  minutesPdf?: string
  pointOfOrderPdf?: string
  /** Bills listed on the sitting's work page. */
  billIds: string[]
  url: string
  agenda?: AgendaDoc
  minutes?: MinutesDigest
  sources: SourceDocument[]
}

/** Claude's digest of a sitting's official minutes (Dhivehi text layer). */
export interface MinutesDigest {
  sittingId: string
  date: string
  title: string
  presiding: string
  attendance: { present: number | null; onLeave: number | null; officialTravel: number | null }
  summary: string
  items: Array<{ n: string; title: string; outcome: string; workId?: string }>
  speakers: Array<{ name: string; constituency: string; mpId?: string; turns: number; positions: string[] }>
  decisions: string[]
  votes: Array<{ what: string; yes: number | null; no: number | null; abstain: number | null }>
  pagesTotal: number
  parts: number
  confidence: Confidence
  model: string
  generatedAt: string
}

/** Committee attendance record read from the committee's published attendance sheets. */
export interface CommitteeAttendance {
  committeeId: string
  period: string
  meetings: number
  codes: Record<string, string>
  members: Array<{
    mpId: string | null
    name: string
    constituency: string
    present: number
    onLeave: number
    absent: number
    officialTravel: number
    eligible: number
  }>
  meetingsList: Array<{ date: string; n: number; present: number; total: number }>
  sourceDocs: string[]
  pagesRead: number
  pagesTotal: number
  confidence: Confidence
  model: string
  generatedAt: string
}
