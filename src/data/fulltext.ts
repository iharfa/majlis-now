import type { ReactNode } from 'react'
import { createElement, Fragment } from 'react'

/** English bill translations, one string per page (public/billsearch.json, built by scripts/build_doc_texts.py). */
export interface BillText { workId: string; pages: string[] }
export interface TextHit { workId: string; page: number; snippet: string }

let cache: Promise<BillText[]> | null = null
// Fetched on first full-text search only, so it stays out of the main bundle.
export const loadBillTexts = () => (cache ??= fetch('/billsearch.json').then((r) => (r.ok ? r.json() : [])).catch(() => []))

/** Case-insensitive match starting at a word boundary ("hang" finds "hanging", not "changing"). */
export const matcher = (q: string) => new RegExp(`\\b(${q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')

/** Every page whose English text matches q, with a snippet around the first match. */
export function searchBillTexts(texts: BillText[], query: string): TextHit[] {
  const q = query.trim()
  if (q.length < 3) return []
  const re = matcher(q)
  const hits: TextHit[] = []
  for (const t of texts)
    t.pages.forEach((p, i) => {
      re.lastIndex = 0
      const m = re.exec(p)
      if (!m) return
      const at = m.index
      const start = Math.max(0, at - 80)
      const end = Math.min(p.length, at + q.length + 80)
      hits.push({ workId: t.workId, page: i + 1, snippet: `${start ? '…' : ''}${p.slice(start, end).replace(/\s+/g, ' ')}${end < p.length ? '…' : ''}` })
    })
  return hits
}

/** Wrap matches of q in <mark>. */
export function highlight(text: string, q: string): ReactNode {
  if (!q.trim()) return text
  const parts = text.split(matcher(q))
  return parts.map((s, i) => (i % 2 ? createElement('mark', { key: i, className: 'bg-amber-200 rounded px-0.5' }, s) : createElement(Fragment, { key: i }, s)))
}
