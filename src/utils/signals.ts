// ---------------------------------------------------------------------------
// Parliament Signals engine
//
// Turns timeline data into evidence-based process signals using the fixed
// thresholds from the product brief. Language is deliberately neutral:
// "unusually fast", "no visible movement" — never "corrupt" / "suspicious".
// ---------------------------------------------------------------------------
import type { Bill, SignalSeverity, SignalType, Vote } from '@/types'
import { daysBetween, daysSince } from './format'

export interface SignalMeta {
  label: string
  icon: string
  /** Short neutral phrase describing the pattern. */
  phrase: string
}

export const SIGNAL_META: Record<SignalType, SignalMeta> = {
  'moving-fast': { label: 'Moving fast', icon: 'bolt', phrase: 'Unusually fast' },
  delayed: { label: 'Delayed', icon: 'schedule', phrase: 'Unusually delayed' },
  stalled: { label: 'Stalled', icon: 'pause_circle', phrase: 'No visible movement' },
  'high-impact-fast-track': {
    label: 'High-impact fast-track',
    icon: 'priority_high',
    phrase: 'High-impact bill fast-tracked',
  },
  'missing-public-trace': {
    label: 'Missing public trace',
    icon: 'visibility_off',
    phrase: 'Missing public trace',
  },
  'high-absence': { label: 'High absence', icon: 'person_off', phrase: 'High absence on a key vote' },
  'quiet-committee-movement': {
    label: 'Quiet committee movement',
    icon: 'meeting_room',
    phrase: 'Quiet committee movement',
  },
  'ready-not-voted': { label: 'Ready but not voted', icon: 'how_to_vote', phrase: 'Ready but not voted' },
  'late-amendment': { label: 'Late amendment', icon: 'edit_note', phrase: 'Late amendment introduced' },
  'end-of-session-risk': {
    label: 'End-of-session risk',
    icon: 'hourglass_bottom',
    phrase: 'At risk of lapsing at session end',
  },
  'committee-delay': { label: 'Committee delay', icon: 'gavel', phrase: 'Extended time in committee' },
}

export const SEVERITY_STYLES: Record<
  SignalSeverity,
  { badge: string; text: string; ring: string }
> = {
  Watch: {
    badge: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    text: 'text-tertiary',
    ring: 'border-tertiary',
  },
  Concern: {
    badge: 'bg-tertiary-container text-on-tertiary',
    text: 'text-tertiary',
    ring: 'border-tertiary',
  },
  'High concern': {
    badge: 'bg-error-container text-on-error-container',
    text: 'text-error',
    ring: 'border-error',
  },
}

// --- Threshold helpers (from the brief) ------------------------------------

/** Classify how fast a bill passed (days from introduction to passed). */
export function fastMovementSeverity(daysToPass: number): SignalSeverity | null {
  if (daysToPass < 7) return 'High concern'
  if (daysToPass < 14) return 'Concern'
  if (daysToPass < 20) return 'Watch'
  return null
}

/** Classify slow movement by days since last action. */
export function slowMovementSeverity(daysSinceLastAction: number): SignalSeverity | null {
  if (daysSinceLastAction >= 120) return 'High concern'
  if (daysSinceLastAction >= 60) return 'Concern'
  return null
}

/** Classify a stall by days with no activity at all. */
export function stalledSeverity(daysInactive: number): SignalSeverity | null {
  if (daysInactive >= 180) return 'High concern'
  if (daysInactive >= 90) return 'Concern'
  if (daysInactive >= 45) return 'Watch'
  return null
}

/** Classify time spent in committee. */
export function committeeDelaySeverity(daysInCommittee: number): SignalSeverity | null {
  if (daysInCommittee > 120) return 'High concern'
  if (daysInCommittee > 60) return 'Concern'
  if (daysInCommittee > 30) return 'Watch'
  return null
}

/** High-absence on a vote, by share of the chamber absent. */
export function absenceSeverity(absentPct: number): SignalSeverity | null {
  if (absentPct >= 25) return 'High concern'
  if (absentPct >= 15) return 'Concern'
  if (absentPct >= 10) return 'Watch'
  return null
}

// --- Derived metrics --------------------------------------------------------

export function daysToPass(bill: Bill): number | null {
  const passed = bill.timeline.find(
    (e) => e.stage === 'Passed or rejected' && e.date,
  )
  if (!passed?.date) return null
  return daysBetween(bill.introducedDate, passed.date)
}

export function daysSinceLastAction(bill: Bill): number {
  return daysSince(bill.lastActionDate)
}

export function absentShare(vote: Vote): number {
  const total = vote.yesCount + vote.noCount + vote.abstainCount + vote.absentCount
  return total ? Math.round((vote.absentCount / total) * 100) : 0
}

/**
 * Compute live signals for a bill from its precomputed values. The mock
 * dataset also carries authored signals (with richer copy); this function
 * exists to demonstrate the engine runs off raw timeline data.
 */
export function computeBillSignals(bill: Bill): Array<{
  type: SignalType
  severity: SignalSeverity
  metric: string
}> {
  const out: Array<{ type: SignalType; severity: SignalSeverity; metric: string }> = []

  const dtp = daysToPass(bill)
  if (dtp != null) {
    const sev = fastMovementSeverity(dtp)
    if (sev) out.push({ type: 'moving-fast', severity: sev, metric: `Passed in ${dtp} days` })
  }

  const inactive = daysSinceLastAction(bill)
  if (bill.status !== 'Passed' && bill.status !== 'Ratified' && bill.status !== 'Rejected') {
    const stall = stalledSeverity(inactive)
    if (stall) {
      out.push({ type: 'stalled', severity: stall, metric: `No recorded action for ${inactive} days` })
    } else {
      const slow = slowMovementSeverity(inactive)
      if (slow) out.push({ type: 'delayed', severity: slow, metric: `${inactive} days since last action` })
    }
  }

  return out
}
