// Date / number formatting helpers. The app uses a fixed "today" so the mock
// dataset and computed "days since" values stay stable and reproducible.

/** Reference "now" for the prototype. Real builds would use new Date(). */
export const TODAY = new Date('2026-06-14T00:00:00Z')

export function parseDate(iso: string): Date {
  return new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''))
}

export function daysBetween(a: string, b: string): number {
  const ms = parseDate(b).getTime() - parseDate(a).getTime()
  return Math.round(ms / 86_400_000)
}

/** Whole days between an ISO date and the prototype's TODAY. */
export function daysSince(iso: string): number {
  const ms = TODAY.getTime() - parseDate(iso).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

export function formatDate(iso?: string): string {
  if (!iso) return '—'
  return parseDate(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatShortDate(iso?: string): string {
  if (!iso) return '—'
  return parseDate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** "2d ago", "3w ago", "5mo ago" from the prototype TODAY. */
export function relativeFromNow(iso: string): string {
  const d = daysSince(iso)
  if (d <= 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 14) return `${d}d ago`
  if (d < 60) return `${Math.round(d / 7)}w ago`
  if (d < 365) return `${Math.round(d / 30)}mo ago`
  return `${Math.round(d / 365)}y ago`
}

export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 100)
}
