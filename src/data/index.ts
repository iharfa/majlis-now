// Central data access layer. Pages/components import from here so swapping the
// mock dataset for a real API later only touches this module.
import type {
  ActivityFeedItem,
  Bill,
  Committee,
  Issue,
  IssueTheme,
  MP,
  MPVote,
  ParliamentSignal,
  Vote,
} from '@/types'

import { parties, partyById } from './parties'
import { constituencies, constituencyById } from './constituencies'
import { themes, themeById } from './themes'
import { mps, mpById } from './mps'
import { committees, committeeById } from './committees'
import { bills as illustrativeBills } from './bills'
import { votes as illustrativeVotes } from './votes'
import { signals, signalById } from './signals'
import { issues, issueById } from './issues'
import { activity } from './activity'
import { realBill1845, realVote1845 } from './realData'

// Real, sourced records lead; illustrative samples follow.
export const bills: Bill[] = [realBill1845, ...illustrativeBills]
export const votes: Vote[] = [realVote1845, ...illustrativeVotes]
export const billById = (id: string) => bills.find((b) => b.id === id)
export const voteById = (id: string) => votes.find((v) => v.id === id)

export {
  parties,
  partyById,
  constituencies,
  constituencyById,
  themes,
  themeById,
  mps,
  mpById,
  committees,
  committeeById,
  signals,
  signalById,
  issues,
  issueById,
  activity,
}

// --- Derived selectors ------------------------------------------------------

export const billsForTheme = (themeId: string): Bill[] =>
  bills.filter((b) => b.themeId === themeId)

export const votesForTheme = (themeId: string): Vote[] =>
  votes.filter((v) => v.themeId === themeId)

export const signalsForTheme = (themeId: string): ParliamentSignal[] =>
  signals.filter((s) => s.themeId === themeId)

export const signalsForBill = (billId: string): ParliamentSignal[] =>
  signals.filter((s) => s.billId === billId)

export const signalsForCommittee = (committeeId: string): ParliamentSignal[] =>
  signals.filter((s) => s.committeeId === committeeId)

export const votesForBill = (billId: string): Vote[] =>
  votes.filter((v) => v.billId === billId)

export const billsForCommittee = (committeeId: string): Bill[] =>
  bills.filter((b) => b.committeeId === committeeId)

export const mpsForCommittee = (committeeId: string): MP[] =>
  mps.filter((m) => m.committeeIds?.includes(committeeId) ?? false)

export const mpsForParty = (partyId: string): MP[] =>
  mps.filter((m) => m.partyId === partyId)

/** All recorded votes cast by a given MP, paired with the parent Vote. */
export function votesByMP(mpId: string): Array<{ vote: Vote; mpVote: MPVote }> {
  const out: Array<{ vote: Vote; mpVote: MPVote }> = []
  for (const v of votes) {
    const mv = v.mpVotes.find((x) => x.mpId === mpId)
    if (mv) out.push({ vote: v, mpVote: mv })
  }
  return out
}

export function themeForBill(bill: Bill): IssueTheme | undefined {
  return themeById(bill.themeId)
}

export function issuesForTheme(themeId: string): Issue[] {
  return issues.filter((i) => i.themeId === themeId)
}

/** Severity-ordered signals for the homepage briefing. */
export function rankedSignals(): ParliamentSignal[] {
  const order = { 'High concern': 0, Concern: 1, Watch: 2 }
  return [...signals].sort((a, b) => order[a.severity] - order[b.severity])
}

/** Simple cross-entity search used by the global search page. */
export interface SearchHit {
  type: 'bill' | 'vote' | 'mp' | 'committee' | 'issue' | 'theme'
  id: string
  title: string
  subtitle: string
}

export function search(query: string): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits: SearchHit[] = []

  for (const b of bills)
    if (`${b.title} ${b.ref} ${b.summary}`.toLowerCase().includes(q))
      hits.push({ type: 'bill', id: b.id, title: b.title, subtitle: `Bill · ${b.ref}` })

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

  for (const i of issues)
    if (`${i.title} ${i.plainLanguageQuestion}`.toLowerCase().includes(q))
      hits.push({ type: 'issue', id: i.id, title: i.title, subtitle: 'Issue' })

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
    return `${m.name} ${c?.name ?? ''} ${c?.atoll ?? ''} ${c?.islands.join(' ') ?? ''}`
      .toLowerCase()
      .includes(q)
  })
}

export type { ActivityFeedItem, Committee }
