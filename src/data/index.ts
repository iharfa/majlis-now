// Central data access layer. Pages/components import from here so the data
// source can change without touching the UI.
import type { ActivityFeedItem, Bill, Committee, IssueTheme, MP, MPVote, ParliamentSignal, Sitting, Vote } from '@/types'

import { parties, partyById } from './parties'
import { constituencies, constituencyById } from './constituencies'
import { themes, themeById } from './themes'
import { mps, mpById } from './mps'
import { committees, committeeById } from './committees'
import { realActivity } from './realActivity'
import { realBills, realSittings, realVotes } from './realData'

// Everything shown is real, sourced data from the People's Majlis.
export const bills: Bill[] = realBills
export const votes: Vote[] = realVotes
export const sittings: Sitting[] = realSittings
export const activity: ActivityFeedItem[] = realActivity
// No authored signals yet; empty array keeps the helper selectors valid.
export const signals: ParliamentSignal[] = []
export const billById = (id: string) => bills.find((b) => b.id === id)
export const voteById = (id: string) => votes.find((v) => v.id === id)
export const sittingById = (id: string) => sittings.find((s) => s.id === id)
export const signalById = (id: string) => signals.find((s) => s.id === id)

export { parties, partyById, constituencies, constituencyById, themes, themeById, mps, mpById, committees, committeeById }

// --- Derived selectors ------------------------------------------------------

export const billsForTheme = (themeId: string): Bill[] => bills.filter((b) => b.themeId === themeId)
export const votesForTheme = (themeId: string): Vote[] => votes.filter((v) => v.themeId === themeId)
export const signalsForTheme = (themeId: string): ParliamentSignal[] => signals.filter((s) => s.themeId === themeId)
export const signalsForBill = (billId: string): ParliamentSignal[] => signals.filter((s) => s.billId === billId)
export const signalsForCommittee = (committeeId: string): ParliamentSignal[] => signals.filter((s) => s.committeeId === committeeId)
export const votesForBill = (billId: string): Vote[] => votes.filter((v) => v.billId === billId)
export const billsForCommittee = (committeeId: string): Bill[] => bills.filter((b) => b.committeeId === committeeId)
export const billsSponsoredBy = (mpId: string): Bill[] => bills.filter((b) => b.sponsorMpId === mpId)
export const sittingsForBill = (billId: string): Sitting[] => sittings.filter((s) => s.billIds.includes(billId))
export const mpsForCommittee = (committeeId: string): MP[] => mps.filter((m) => m.committeeIds?.includes(committeeId) ?? false)

/** Committees a given MP sits on, with their role, derived from real membership. */
export function committeesForMP(mpId: string): Array<{ committee: Committee; role: 'Chair' | 'Vice Chair' | 'Member' }> {
  return committees
    .filter((c) => c.memberMpIds.includes(mpId) || c.chairMpId === mpId || c.viceChairMpId === mpId)
    .map((committee) => ({
      committee,
      role: committee.chairMpId === mpId ? 'Chair' : committee.viceChairMpId === mpId ? 'Vice Chair' : 'Member',
    }))
}

export const mpsForParty = (partyId: string): MP[] => mps.filter((m) => m.partyId === partyId)

/** All recorded votes cast by a given MP, paired with the parent Vote (newest first). */
export function votesByMP(mpId: string): Array<{ vote: Vote; mpVote: MPVote }> {
  const out: Array<{ vote: Vote; mpVote: MPVote }> = []
  for (const v of votes) {
    const mv = v.mpVotes.find((x) => x.mpId === mpId)
    if (mv) out.push({ vote: v, mpVote: mv })
  }
  return out.sort((a, b) => b.vote.date.localeCompare(a.vote.date))
}

/** Sittings whose minutes record this MP speaking (newest first). */
export function speechesByMP(mpId: string): Array<{ sitting: Sitting; turns: number; positions: string[] }> {
  const out: Array<{ sitting: Sitting; turns: number; positions: string[] }> = []
  for (const s of sittings) {
    const sp = s.minutes?.speakers.find((x) => x.mpId === mpId)
    if (sp) out.push({ sitting: s, turns: sp.turns, positions: sp.positions })
  }
  return out.sort((a, b) => b.sitting.date.localeCompare(a.sitting.date))
}

/** Committee attendance rows for an MP, from the published attendance sheets. "present" here = attended (present or on official duty). */
export function committeeAttendanceForMP(mpId: string): Array<{ committee: Committee; present: number; eligible: number }> {
  const out: Array<{ committee: Committee; present: number; eligible: number }> = []
  for (const c of committees) {
    const row = c.attendanceRecord?.members.find((m) => m.mpId === mpId)
    if (row && row.eligible > 0) out.push({ committee: c, present: row.present + row.officialTravel, eligible: row.eligible })
  }
  return out
}

/** Attendance derived from roll calls: present = voted, abstained, or "Not Voted" (in the chamber). */
export function attendanceForMP(mpId: string): { present: number; total: number } {
  const rows = votesByMP(mpId)
  return { present: rows.filter(({ mpVote }) => mpVote.detail !== 'Not Present').length, total: rows.length }
}

export function themeForBill(bill: Bill): IssueTheme | undefined {
  return themeById(bill.themeId)
}

/** Severity-ordered signals for the homepage briefing. */
export function rankedSignals(): ParliamentSignal[] {
  const order = { 'High concern': 0, Concern: 1, Watch: 2 }
  return [...signals].sort((a, b) => order[a.severity] - order[b.severity])
}

/** Simple cross-entity search used by the global search page. */
export interface SearchHit {
  type: 'bill' | 'vote' | 'mp' | 'committee' | 'theme' | 'sitting'
  id: string
  title: string
  subtitle: string
}

export function search(query: string): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits: SearchHit[] = []

  for (const b of bills)
    if (`${b.title} ${b.ref} ${b.summary} ${b.sponsor}`.toLowerCase().includes(q))
      hits.push({ type: 'bill', id: b.id, title: b.title, subtitle: `Bill · ${b.status}` })

  for (const v of votes)
    if (v.title.toLowerCase().includes(q))
      hits.push({ type: 'vote', id: v.id, title: v.title, subtitle: `Vote · ${v.result}` })

  for (const m of mps) {
    const c = constituencyById(m.constituencyId)
    if (`${m.name} ${c?.name ?? ''} ${c?.atoll ?? ''} ${c?.islands.join(' ') ?? ''}`.toLowerCase().includes(q))
      hits.push({ type: 'mp', id: m.id, title: m.name, subtitle: `MP · ${c?.name ?? ''}` })
  }

  for (const c of committees)
    if (c.name.toLowerCase().includes(q))
      hits.push({ type: 'committee', id: c.id, title: c.name, subtitle: 'Committee' })

  for (const s of sittings)
    if (`${s.title} ${s.agenda?.summary ?? ''} ${s.minutes?.summary ?? ''} ${s.minutes?.decisions.join(' ') ?? ''}`.toLowerCase().includes(q))
      hits.push({ type: 'sitting', id: s.id, title: s.title, subtitle: `Sitting · ${s.date}` })

  for (const t of themes)
    if (t.name.toLowerCase().includes(q))
      hits.push({ type: 'theme', id: t.id, title: t.name, subtitle: 'Theme' })

  return hits
}

/** Find-your-MP lookup by name, constituency, island, atoll. */
export function findMPs(query: string): MP[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return mps.filter((m) => {
    const c = constituencyById(m.constituencyId)
    return `${m.name} ${c?.name ?? ''} ${c?.atoll ?? ''} ${c?.islands.join(' ') ?? ''}`.toLowerCase().includes(q)
  })
}

export type { ActivityFeedItem, Committee }
