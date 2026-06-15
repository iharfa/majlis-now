import type { Confidence, SourceDocument } from '@/types'

/**
 * The confidence badge must never claim more trust than the underlying data
 * supports. If a card has no official source behind it (i.e. it's still an
 * illustrative sample), its stated confidence is capped at "Low" regardless of
 * what the authored data says — so "High confidence" and a "(mock)" source can
 * never appear on the same card.
 */
export function effectiveConfidence(
  stated: Confidence | undefined,
  sources: SourceDocument[] | undefined,
): Confidence {
  const hasOfficial = sources?.some((s) => s.kind === 'official') ?? false
  if (!hasOfficial) return 'Low'
  return stated ?? 'High'
}
