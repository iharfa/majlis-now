/**
 * Pick a readable text colour (near-black or white) for a given background hex,
 * using the YIQ brightness formula. Lets us use true party brand colours —
 * including bright yellow/orange — without unreadable white-on-yellow chips.
 */
export function readableText(hex: string): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq > 140 ? '#1b1b23' : '#ffffff'
}
