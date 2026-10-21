import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'

interface DocTextFile { workId: string; sourceUrl: string; pages: string[]; unreadable: number; model: string; generatedAt: string }

/** Full Dhivehi text of a document, transcribed by AI. Fetched only when opened, so it stays out of the bundle. */
export function DocText({ url, title, source, className = '' }: { url: string; title: string; source: string; className?: string }) {
  const [doc, setDoc] = useState<DocTextFile | 'loading' | 'error' | null>(null)
  const load = () => {
    if (doc) return
    setDoc('loading')
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDoc, () => setDoc('error'))
  }
  return (
    <details className={`group bg-white rounded-2xl border border-outline-variant/30 p-6 ${className}`} onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && load()}>
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
        <span className="font-headline-md text-headline-md flex items-center gap-2">
          <Icon name="article" className="text-primary" /> {title}
          
        </span>
        <Icon name="expand_more" className="text-on-surface-variant transition-transform group-open:rotate-180" />
      </summary>
      {doc === 'loading' && <p className="text-label-sm text-outline mt-4">Loading…</p>}
      {doc === 'error' && <p className="text-label-sm text-error mt-4">Could not load the text. Use the official PDF below.</p>}
      {doc && typeof doc === 'object' && (
        <div className="mt-4">
          <p className="text-label-sm text-outline mb-4">
            {url.endsWith(".en.json") ? "Translated by AI into English from the Dhivehi" : "Transcribed by AI from the"} {source} PDF ({doc.pages.length} pages
            {doc.unreadable ? `, ${doc.unreadable} unreadable word${doc.unreadable === 1 ? '' : 's'} marked [?]` : ''}). The{' '}
            <a href={doc.sourceUrl} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">official PDF</a> is the authority.
          </p>
          <div className="max-h-[70vh] overflow-y-auto text-on-surface text-lg leading-loose space-y-6 pl-2">
            {doc.pages.map((p, i) => (
              <div key={i}>
                <p className="text-label-sm text-outline mb-2" dir="ltr">Page {i + 1}</p>
                <div className="whitespace-pre-wrap" dir="auto" lang={/[ހ-޿]/.test(p) ? 'dv' : 'en'}>{p}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </details>
  )
}
