import type { SourceDocument } from '@/types'

// Helper to mint a placeholder source. In the prototype these point at the
// official Majlis site so the "View source" affordance is wired end-to-end;
// they are clearly flagged as mock where the specific document is invented.
export function mockSource(
  id: string,
  label: string,
  opts: Partial<SourceDocument> = {},
): SourceDocument {
  return {
    id,
    label,
    url: opts.url ?? 'https://majlis.gov.mv/en/20-parliament',
    lastUpdated: opts.lastUpdated ?? '2026-06-12',
    kind: opts.kind ?? 'mock',
  }
}

/** The canonical Majlis reference used across the app. */
export const MAJLIS_SOURCE: SourceDocument = {
  id: 'src-majlis',
  label: 'People’s Majlis — 20th Parliament',
  url: 'https://majlis.gov.mv/en/20-parliament',
  lastUpdated: '2026-06-12',
  kind: 'official',
}
