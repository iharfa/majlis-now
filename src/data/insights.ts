// Cross-cutting metrics derived from the sitting agendas, minutes digests and
// committee data already in the repo. No new ingestion; everything here is
// computed once at module load from the same JSON the detail pages use.
import type { MP, Sitting } from '@/types'
import { mps, sittings, committees } from '@/data'

type Minuted = Sitting & { minutes: NonNullable<Sitting['minutes']> }
export const minuted: Minuted[] = sittings.filter((s): s is Minuted => !!s.minutes)
const agendaed = sittings.filter((s) => s.agenda)

// --- Floor time --------------------------------------------------------------

export interface FloorRow { mp: MP; turns: number; sittingsSpoken: number; positions: number }

export const floorTime: FloorRow[] = (() => {
  const acc = new Map<string, FloorRow>()
  // The Speaker presides rather than speaks, so is not ranked.
  for (const m of mps) if (m.active && !/^speaker/i.test(m.leadershipRole ?? '')) acc.set(m.id, { mp: m, turns: 0, sittingsSpoken: 0, positions: 0 })
  for (const s of minuted)
    for (const sp of s.minutes.speakers) {
      const row = sp.mpId ? acc.get(sp.mpId) : undefined
      if (!row) continue
      row.turns += sp.turns
      row.sittingsSpoken += 1
      row.positions += sp.positions.length
    }
  return [...acc.values()].sort((a, b) => b.turns - a.turns || b.sittingsSpoken - a.sittingsSpoken)
})()

/** 1-based rank of an MP by floor turns, or undefined if not an active member. */
export function floorRank(mpId: string): { rank: number; of: number } | undefined {
  const i = floorTime.findIndex((r) => r.mp.id === mpId)
  return i < 0 ? undefined : { rank: i + 1, of: floorTime.length }
}

export const silentMPs: MP[] = floorTime.filter((r) => r.turns === 0).map((r) => r.mp)

/** Average turns per active member, by party. */
export const floorByParty: Array<{ partyId: string; members: number; turns: number; perMember: number }> = (() => {
  const acc = new Map<string, { members: number; turns: number }>()
  for (const r of floorTime) {
    const a = acc.get(r.mp.partyId) ?? { members: 0, turns: 0 }
    a.members += 1
    a.turns += r.turns
    acc.set(r.mp.partyId, a)
  }
  return [...acc].map(([partyId, a]) => ({ partyId, ...a, perMember: a.turns / a.members })).sort((a, b) => b.perMember - a.perMember)
})()

// --- Attendance trend --------------------------------------------------------

export interface AttendancePoint { id: string; date: string; title: string; term?: string; present: number }

/** Opening roll-call "present" per sitting, oldest first. Vote-time counts are usually higher. */
export const attendanceTrend: AttendancePoint[] = minuted
  // Counts under 15 are dropped digits in the text layer (a sitting cannot open with so few).
  .filter((s) => (s.minutes.attendance.present ?? 0) >= 15)
  .map((s) => ({ id: s.id, date: s.date, title: s.title, term: s.term, present: s.minutes.attendance.present as number }))
  .sort((a, b) => a.date.localeCompare(b.date))

// --- Tally votes (from minutes) ----------------------------------------------

export interface TallyVote { sittingId: string; date: string; what: string; yes: number; no: number; abstain: number; passed: boolean; unanimous: boolean; marginPct: number }

export const tallyVotes: TallyVote[] = minuted
  .flatMap((s) =>
    s.minutes.votes
      .filter((v) => v.yes != null && v.no != null)
      .map((v) => {
        const yes = v.yes as number, no = v.no as number, abstain = v.abstain ?? 0
        const cast = yes + no
        return { sittingId: s.id, date: s.date, what: v.what, yes, no, abstain, passed: yes > no, unanimous: no === 0 && abstain === 0, marginPct: cast ? Math.abs(yes - no) / cast : 1 }
      }),
  )
  .sort((a, b) => b.date.localeCompare(a.date))

export const closestVotes: TallyVote[] = [...tallyVotes].filter((v) => v.yes + v.no >= 20).sort((a, b) => a.marginPct - b.marginPct).slice(0, 8)
export const failedVotes: TallyVote[] = tallyVotes.filter((v) => !v.passed)

const NOMINATION = /ambassador|nominee|nominat|appoint|commission|judge|justice|governor|auditor|prosecutor|board|tribunal|minister|cabinet|removal|dismiss/i
export const nominationVotes: TallyVote[] = tallyVotes.filter((v) => NOMINATION.test(v.what))

// --- Term scorecard ----------------------------------------------------------

export interface TermCard {
  term: string
  sittings: number
  minuted: number
  billItems: number
  questionItems: number
  reportItems: number
  votes: number
  passed: number
  failed: number
  unanimousPct: number
  decisions: number
  speakers: number
  medianPresent: number | null
}

export const termCards: TermCard[] = (() => {
  const order: string[] = []
  const acc = new Map<string, TermCard & { _sp: Set<string>; _pres: number[] }>()
  for (const s of sittings) {
    const term = s.term ?? 'Other'
    if (!acc.has(term)) {
      order.push(term)
      acc.set(term, { term, sittings: 0, minuted: 0, billItems: 0, questionItems: 0, reportItems: 0, votes: 0, passed: 0, failed: 0, unanimousPct: 0, decisions: 0, speakers: 0, medianPresent: null, _sp: new Set(), _pres: [] })
    }
    const t = acc.get(term)!
    t.sittings += 1
    for (const it of s.agenda?.items ?? []) {
      if (it.kind === 'bill') t.billItems += 1
      else if (it.kind === 'question') t.questionItems += 1
      else if (it.kind === 'report') t.reportItems += 1
    }
    if (s.minutes) {
      t.minuted += 1
      t.decisions += s.minutes.decisions.length
      for (const sp of s.minutes.speakers) if (sp.mpId) t._sp.add(sp.mpId)
      if (s.minutes.attendance.present != null) t._pres.push(s.minutes.attendance.present)
    }
  }
  for (const v of tallyVotes) {
    const term = sittings.find((s) => s.id === v.sittingId)?.term ?? 'Other'
    const t = acc.get(term)!
    t.votes += 1
    if (v.passed) t.passed += 1
    else t.failed += 1
    if (v.unanimous) t.unanimousPct += 1
  }
  return order.map((k) => {
    const t = acc.get(k)!
    const pres = [...t._pres].sort((a, b) => a - b)
    const { _sp, _pres, ...card } = t
    return { ...card, speakers: _sp.size, unanimousPct: t.votes ? Math.round((t.unanimousPct / t.votes) * 100) : 0, medianPresent: pres.length ? pres[Math.floor(pres.length / 2)] : null }
  })
})()

// --- Minister question time --------------------------------------------------

/** Count of agenda question items per ministry (text match on "Minister of X"). */
export const questionsByMinistry: Array<{ ministry: string; count: number }> = (() => {
  const acc = new Map<string, number>()
  const rx = /Minister of ([A-Z][A-Za-z&' ]+?(?:,\s?[A-Z][A-Za-z&' ]+?)*?)(?=\s(?:on|about|regarding|is|was|to|for|at|by|answers|replies|will|asks|asked)\b|[,.;:(]|$)/
  for (const s of agendaed)
    for (const it of s.agenda!.items) {
      if (it.kind !== 'question') continue
      const m = rx.exec(it.text)
      const key = m ? m[1].trim().replace(/\s+and\s+/g, ' & ') : 'Minister (unnamed)'
      acc.set(key, (acc.get(key) ?? 0) + 1)
    }
  return [...acc].map(([ministry, count]) => ({ ministry, count })).sort((a, b) => b.count - a.count)
})()

export const questionItemsTotal = questionsByMinistry.reduce((n, q) => n + q.count, 0)

// --- Committee referrals -----------------------------------------------------

/** How often each committee is named as the destination in minutes outcomes and decisions. */
export const committeeReferrals: Array<{ committeeId: string; name: string; count: number }> = (() => {
  const keys = committees
    .filter((c) => !/sub.?committee|joint|select|whole house/i.test(c.name))
    .map((c) => ({ c, key: c.name.toLowerCase().replace(/^committee on /, '').replace(/ committee$/, '').replace(/\s*\(.*\)$/, '').trim() }))
  const acc = new Map<string, number>()
  for (const s of minuted) {
    const texts = [...s.minutes.items.map((i) => i.outcome), ...s.minutes.decisions].map((t) => t.toLowerCase())
    for (const t of texts) {
      if (!/committee/.test(t)) continue
      for (const { c, key } of keys) if (t.includes(key)) acc.set(c.id, (acc.get(c.id) ?? 0) + 1)
    }
  }
  return [...acc]
    .map(([committeeId, count]) => ({ committeeId, name: committees.find((c) => c.id === committeeId)!.name, count }))
    .sort((a, b) => b.count - a.count)
})()

// --- Presiding ---------------------------------------------------------------

export const presiding: { speaker: number; deputy: number; unnamed: number } = minuted.reduce(
  (acc, s) => {
    const p = s.minutes.presiding.toLowerCase()
    if (!p) acc.unnamed += 1
    else if (/deputy|nazim|saleem/.test(p)) acc.deputy += 1
    else acc.speaker += 1
    return acc
  },
  { speaker: 0, deputy: 0, unnamed: 0 },
)

// --- Headline numbers --------------------------------------------------------

export const headline = {
  sittings: sittings.length,
  minuted: minuted.length,
  agendaed: agendaed.length,
  turns: floorTime.reduce((n, r) => n + r.turns, 0),
  tallyVotes: tallyVotes.length,
  unanimousPct: tallyVotes.length ? Math.round((tallyVotes.filter((v) => v.unanimous).length / tallyVotes.length) * 100) : 0,
  decisions: minuted.reduce((n, s) => n + s.minutes.decisions.length, 0),
  agendaItems: agendaed.reduce((n, s) => n + (s.agenda?.items.length ?? 0), 0),
}

/** Activity in the last N days: sittings held, votes taken, busiest speaker. */
export function recentWindow(days: number, today = new Date().toISOString().slice(0, 10)) {
  const since = new Date(Date.parse(today) - days * 86400000).toISOString().slice(0, 10)
  const recent = minuted.filter((s) => s.date >= since)
  const turns = new Map<string, number>()
  for (const s of recent) for (const sp of s.minutes.speakers) if (sp.mpId) turns.set(sp.mpId, (turns.get(sp.mpId) ?? 0) + sp.turns)
  const top = [...turns].sort((a, b) => b[1] - a[1])[0]
  return {
    since,
    sittings: recent.length,
    votes: tallyVotes.filter((v) => v.date >= since).length,
    topSpeaker: top ? { mp: mps.find((m) => m.id === top[0])!, turns: top[1] } : undefined,
  }
}
