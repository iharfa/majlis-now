import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { NotFoundPage } from './NotFoundPage'
import { mpById, partyById } from '@/data'
import { hansardFor, type HansardSitting, type HansardSpeech } from '@/data/hansard'
import { formatDate } from '@/utils/format'

const ROLE_LABEL: Record<HansardSpeech['role'], string> = {
  member: 'Member', chair: 'Presiding', minister: 'Minister', official: 'Official', other: 'Minutes',
}

export function HansardSittingPage() {
  const { id = '' } = useParams()
  const entry = hansardFor(id)
  const [params, setParams] = useSearchParams()
  const [doc, setDoc] = useState<HansardSitting | null | 'error'>(null)
  const mpFilter = params.get('mp') ?? ''
  const [showChair, setShowChair] = useState(true)

  useEffect(() => {
    if (!entry) return
    setDoc(null)
    fetch(`/hansard/${entry.id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setDoc, () => setDoc('error'))
  }, [entry])

  // scroll to a speech permalink (#s12) once the speeches have loaded
  useEffect(() => {
    if (doc && doc !== 'error' && window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView()
  }, [doc])

  const items = useMemo(() => (doc && doc !== 'error' ? new Map(doc.items.map((i) => [i.n, i.title])) : new Map()), [doc])
  // everyone linked to an MP, including the presiding member's remarks from the chair
  const people = useMemo(() => {
    const m = new Map<string, number>()
    if (doc && doc !== 'error') for (const s of doc.speeches) if (s.mpId) m.set(s.mpId, (m.get(s.mpId) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => (mpById(a[0])?.name ?? '').localeCompare(mpById(b[0])?.name ?? ''))
  }, [doc])
  if (!entry) return <NotFoundPage />

  const speeches = doc && doc !== 'error'
    ? doc.speeches.filter((s) => (!mpFilter || s.mpId === mpFilter) && (showChair || s.role !== 'chair'))
    : []

  return (
    <Container className="py-8">
      <div className="flex items-center gap-2 text-on-surface-variant text-label-sm mb-3">
        <Link to="/hansard" className="hover:text-primary">Hansard</Link>
        <Icon name="chevron_right" className="text-sm" />
        <span>{formatDate(entry.date)}</span>
      </div>
      <h1 className="font-headline-lg text-headline-lg text-on-surface">{entry.title}</h1>
      <p className="text-on-surface-variant mt-1">
        {formatDate(entry.date)} · {entry.speeches} speeches · {entry.pages} pages of minutes ·{' '}
        <Link to={`/sittings/sitting-${entry.id}`} className="text-primary hover:underline">Sitting overview</Link>
      </p>
      {entry.lowConfidence && (
        <div className="mt-4 bg-error-container/40 rounded-2xl p-4 text-sm text-on-surface">
          <ConfidenceBadge level="Low" />
          <p className="mt-1">
            {entry.issue ? `${entry.issue} ` : ''}
            {entry.lowConfidenceSpeeches} of {entry.speeches} speeches have passages the source did not show clearly; they are labelled below. Check those against the official minutes.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mt-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-3 bg-surface-container-low rounded-2xl p-4">
            <label className="text-label-sm font-label-bold text-on-surface-variant" htmlFor="mp-filter">Speaker</label>
            <select
              id="mp-filter"
              value={mpFilter}
              onChange={(e) => setParams(e.target.value ? { mp: e.target.value } : {}, { replace: true })}
              className="bg-white border border-outline-variant rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">Everyone</option>
              {people.map(([mpId, n]) => (
                <option key={mpId} value={mpId}>{mpById(mpId)?.name ?? mpId} ({n})</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-on-surface-variant">
              <input type="checkbox" checked={showChair} onChange={(e) => setShowChair(e.target.checked)} /> Show remarks from the chair
            </label>
            {doc && doc !== 'error' && <span className="text-label-sm text-outline ml-auto">{speeches.length} shown</span>}
          </div>

          {doc === null && <p className="py-12 text-center text-on-surface-variant" role="status">Loading speeches…</p>}
          {doc === 'error' && <p className="py-12 text-center text-on-surface-variant">Could not load this sitting's speeches.</p>}
          {speeches.map((s, i) => (
            <Speech key={s.n} s={s} itemTitle={s.item ? items.get(s.item) : undefined} showItem={i === 0 || speeches[i - 1].item !== s.item} sourceUrl={doc && doc !== 'error' ? doc.sourceUrl : null} />
          ))}
        </div>

        <aside className="space-y-gutter">
          <section className="bg-white rounded-2xl border border-outline-variant/30 p-6">
            <h2 className="font-headline-md text-headline-md mb-4">Members who spoke</h2>
            <ul className="space-y-3">
              {entry.speakers.map((sp) => {
                const mp = mpById(sp.mpId)
                if (!mp) return null
                return (
                  <li key={sp.mpId} className="flex items-center gap-3">
                    <Link to={`/mps/${mp.id}`} aria-label={`${mp.name} profile`}><Avatar mp={mp} size="sm" /></Link>
                    <button type="button" onClick={() => setParams({ mp: mp.id }, { replace: true })} className="min-w-0 flex-1 text-left group">
                      <span className="block font-label-bold text-on-surface group-hover:text-primary truncate">{mp.name}</span>
                      <span className="block text-label-sm text-outline">{sp.speeches} speech{sp.speeches === 1 ? '' : 'es'} · {sp.words.toLocaleString()} words</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
          <section className="bg-surface-container-low rounded-2xl p-6 text-sm text-on-surface-variant space-y-2">
            <h2 className="font-label-bold text-on-surface flex items-center gap-2"><Icon name="translate" className="text-[18px]" /> AI transcription and translation</h2>
            <p>Transcribed from the official Dhivehi minutes and translated into English by Claude. Mistakes are possible: open the Dhivehi under each speech, and the official PDF is the authority.</p>
            {doc && doc !== 'error' && doc.sourceUrl && (
              <a href={doc.sourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-primary font-label-bold hover:underline">
                Official minutes (PDF) <Icon name="open_in_new" className="text-[16px]" />
              </a>
            )}
          </section>
        </aside>
      </div>
    </Container>
  )
}

function Speech({ s, itemTitle, showItem, sourceUrl }: { s: HansardSpeech; itemTitle?: string; showItem: boolean; sourceUrl: string | null }) {
  const [dv, setDv] = useState(false)
  const mp = s.mpId ? mpById(s.mpId) : undefined
  const party = mp ? partyById(mp.partyId) : undefined
  const pages = s.page === s.pageEnd ? `p. ${s.page}` : `pp. ${s.page}–${s.pageEnd}`
  return (
    <>
      {showItem && s.item && (
        <h2 className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant pt-4">
          Item {s.item}{itemTitle ? ` · ${itemTitle}` : ''}
        </h2>
      )}
      <article id={`s${s.n}`} className={s.role === 'chair' ? 'bg-surface-container-low rounded-2xl p-5' : 'bg-white rounded-2xl border border-outline-variant/30 p-5'}>
        <header className="flex items-start gap-3 mb-3">
          {mp ? (
            <Link to={`/mps/${mp.id}`} className="shrink-0"><Avatar mp={mp} size="lg" /></Link>
          ) : (
            <span className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center shrink-0"><Icon name="person" className="text-outline" /></span>
          )}
          <div className="min-w-0 flex-1">
            {mp ? (
              <Link to={`/mps/${mp.id}`} className="font-label-bold text-on-surface hover:text-primary">{mp.name}</Link>
            ) : (
              <span className="font-label-bold text-on-surface">{s.name}</span>
            )}
            <p className="text-label-sm text-outline">
              {ROLE_LABEL[s.role]}{s.constituency ? ` · ${s.constituency}` : ''}{party ? ` · ${party.shortName}` : ''}
            </p>
            {s.lowConfidence && (
              <span title="Part of this speech could not be read clearly in the source; look for [unclear] and compare with the Dhivehi or the source page.">
                <ConfidenceBadge level="Low" className="mt-1" />
              </span>
            )}
          </div>
          <a href={`#s${s.n}`} className="text-label-sm text-outline hover:text-primary shrink-0" title="Link to this speech">#{s.n} · {pages}</a>
        </header>
        <div className="text-on-surface leading-relaxed whitespace-pre-line">{s.en}</div>
        <div className="mt-3 flex items-center gap-4">
          <button type="button" onClick={() => setDv(!dv)} aria-expanded={dv} className="text-label-sm font-label-bold text-primary hover:underline inline-flex items-center gap-1">
            <Icon name={dv ? 'expand_less' : 'expand_more'} className="text-[16px]" /> {dv ? 'Hide' : 'Show'} Dhivehi original
          </button>
          {sourceUrl && s.page && (
            <a href={`${sourceUrl}#page=${s.page}`} target="_blank" rel="noreferrer noopener" className="text-label-sm text-outline hover:text-primary">Source page</a>
          )}
        </div>
        {dv && (
          <div className="mt-3 border-t border-outline-variant/40 pt-3 whitespace-pre-line text-on-surface text-lg leading-loose" dir="rtl" lang="dv">
            {s.heading && <p className="text-on-surface-variant text-base mb-2">{s.heading}</p>}
            {s.dv}
          </div>
        )}
      </article>
    </>
  )
}
