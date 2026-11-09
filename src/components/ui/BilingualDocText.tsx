import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { highlight, matcher } from '@/data/fulltext'

interface DocTextFile { sourceUrl: string; pages: string[]; unreadable: number }

/** Dhivehi text and its English translation, page by page side by side, with find-in-English.
 *  Fetched only when opened (or when arriving from a search with ?find=). */
export function BilingualDocText({ docKey, title, source, find = '', page = 0 }: { docKey: string; title: string; source: string; find?: string; page?: number }) {
  const [docs, setDocs] = useState<[DocTextFile, DocTextFile] | 'loading' | 'error' | null>(null)
  const [term, setTerm] = useState(find)
  const ref = useRef<HTMLDetailsElement>(null)

  const load = () => {
    if (docs) return
    setDocs('loading')
    const get = (u: string) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject()))
    Promise.all([get(`/doctexts/${docKey}.json`), get(`/doctexts/${docKey}.en.json`)]).then(setDocs, () => setDocs('error'))
  }

  useEffect(() => {
    if (find && ref.current) ref.current.open = true
  }, [find])

  const loaded = docs && typeof docs === 'object' ? docs : null
  const q = term.trim().toLowerCase()
  const matchPages = loaded && q ? loaded[1].pages.flatMap((p, i) => (matcher(q).test(p) ? [i + 1] : [])) : []

  // Scroll the text box to page n, then bring the box itself into view.
  const box = useRef<HTMLDivElement>(null)
  const goTo = (n: number) => {
    const el = document.getElementById(`page-${n}`)
    if (!el || !box.current) return
    box.current.scrollTop += el.getBoundingClientRect().top - box.current.getBoundingClientRect().top - 40
    box.current.scrollIntoView({ block: 'start', behavior: 'instant' })
  }

  // Arriving from search: jump to the page clicked, else the first page that matches.
  const jumped = useRef(false)
  const target = page || matchPages[0]
  useEffect(() => {
    if (!find || jumped.current || !loaded || !target) return
    jumped.current = true
    goTo(target)
  }, [find, loaded, target])

  return (
    <details ref={ref} className="group bg-white rounded-2xl border border-outline-variant/30 p-6" onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && load()}>
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
        <span className="font-headline-md text-headline-md flex items-center gap-2">
          <Icon name="translate" className="text-primary" /> {title}
        </span>
        <Icon name="expand_more" className="text-on-surface-variant transition-transform group-open:rotate-180" />
      </summary>
      {docs === 'loading' && <p className="text-label-sm text-outline mt-4">Loading…</p>}
      {docs === 'error' && <p className="text-label-sm text-error mt-4">Could not load the text. Use the official PDF below.</p>}
      {loaded && (
        <div className="mt-4">
          <p className="text-label-sm text-outline mb-4">
            Dhivehi transcribed by AI from the {source} PDF; English translated by AI from that transcription ({loaded[0].pages.length} pages
            {loaded[0].unreadable ? `, ${loaded[0].unreadable} unreadable word${loaded[0].unreadable === 1 ? '' : 's'} marked [?]` : ''}). The{' '}
            <a href={loaded[0].sourceUrl} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">official PDF</a> is the authority.
          </p>
          <div className="relative mb-2">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Find in the English text…"
              aria-label="Find in the English text"
              className="w-full bg-surface-container-low border border-outline-variant rounded-full pl-10 pr-4 py-2 text-body-md focus:ring-2 focus:ring-primary outline-none"
            />
            <Icon name="search" className="absolute left-3 top-2.5 text-on-surface-variant" />
          </div>
          {q && (
            <p className="text-label-sm text-on-surface-variant mb-4">
              {matchPages.length ? (
                <>
                  Found on page{matchPages.length === 1 ? '' : 's'}{' '}
                  {matchPages.map((n, i) => (
                    <span key={n}>
                      {i > 0 && ', '}
                      <a href={`#page-${n}`} onClick={(e) => { e.preventDefault(); goTo(n) }} className="text-primary hover:underline">{n}</a>
                    </span>
                  ))}
                </>
              ) : (
                <>No match for “{term.trim()}”.</>
              )}
            </p>
          )}
          <div ref={box} className="max-h-[75vh] overflow-y-auto pr-2 scroll-mt-20">
            <div className="hidden md:grid grid-cols-2 gap-6 sticky top-0 bg-white py-2 text-label-sm font-label-bold uppercase text-outline border-b border-outline-variant/30">
              <span>English (AI translation)</span>
              <span dir="rtl" lang="dv" className="normal-case text-base">ދިވެހި</span>
            </div>
            {loaded[0].pages.map((dv, i) => (
              <div key={i} id={`page-${i + 1}`} className="scroll-mt-12 py-4 border-b border-outline-variant/20">
                <p className="text-label-sm text-outline mb-2">Page {i + 1}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="whitespace-pre-wrap text-on-surface leading-relaxed" lang="en">{highlight(loaded[1].pages[i] ?? '', q)}</div>
                  <div className="whitespace-pre-wrap text-on-surface text-lg leading-loose" dir="rtl" lang="dv">{dv}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </details>
  )
}
