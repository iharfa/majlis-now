import { useMemo, useState } from 'react'
import { Container, PageHeader } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { AiBadge } from '@/components/ui/AiBadge'
import { DocText } from '@/components/ui/DocText'
import { cn } from '@/utils/cn'
import worksJson from '@/data/works_other.json'
import docTextsJson from '@/data/doctexts.json'

interface OtherWork {
  id: string; number?: string; type: string; status: string; title: string; url: string; sitting?: string
  sponsor?: { name?: string; constituency?: string }
  documents?: Array<{ label: string; url: string }>
}
interface WorkSummary { workId: string; summary: string; keyPoints: string[]; outcome: string; confidence: 'High' | 'Medium' | 'Low'; model: string; generatedAt: string }

const works = (worksJson as OtherWork[]).slice().sort((a, b) => Number(b.id) - Number(a.id))
const docTexts = docTextsJson as Array<{ key: string; workId: string; label: string; pages: number }>
const summaries = Object.fromEntries(
  Object.values(import.meta.glob<WorkSummary>('../data/worksummaries/*.json', { eager: true, import: 'default' })).map((s) => [s.workId, s]),
)
const TYPES = ['Petition', 'Parliamentary Questions', 'Parliamentary Approvals', 'Resolutions', 'Emergency Motion', 'Other']

/** Non-bill business: petitions, questions to ministers, approvals of appointments, resolutions, motions and reports. */
export function BusinessPage() {
  const [type, setType] = useState('all')
  const [query, setQuery] = useState('')
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return works.filter((w) => (type === 'all' || w.type === type) && (!q || `${w.title} ${w.number ?? ''} ${w.sponsor?.name ?? ''}`.toLowerCase().includes(q)))
  }, [type, query])
  const shown = list.slice(0, 60)

  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Other business"
        title="Petitions, questions, approvals and motions"
        description="Everything before Parliament that is not a bill: petitions from the public, MPs' questions to ministers, approvals of appointments, resolutions, motions and committee reports. Newest first."
      />

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search titles, reference numbers or who submitted it…"
        aria-label="Search other business"
        className="w-full bg-white border border-outline-variant rounded-full px-5 py-3 mb-4 focus:ring-2 focus:ring-primary outline-none"
      />
      <div className="flex gap-2 flex-wrap mb-6">
        {['all', ...TYPES].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn('px-4 py-2 rounded-full text-label-sm font-label-bold transition-colors', type === t ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant')}
          >
            {t === 'all' ? 'All' : t} <span className="opacity-70">{t === 'all' ? works.length : works.filter((w) => w.type === t).length}</span>
          </button>
        ))}
      </div>

      <ul className="space-y-gutter">
        {shown.map((w) => {
          const s = summaries[w.id]
          const texts = docTexts.filter((d) => d.workId === w.id)
          return (
            <li key={w.id} className="bg-white rounded-2xl border border-outline-variant/30 p-6">
              <div className="flex items-center gap-2 flex-wrap mb-2 text-label-sm">
                <span className="font-label-bold text-primary">{w.type}</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-bold">{w.status}</span>
                {w.number && <span className="text-outline ml-auto">{w.number}</span>}
              </div>
              <h2 className="font-headline-md text-on-surface text-lg">{w.title}</h2>
              {w.sponsor?.name && (
                <p className="text-label-sm text-on-surface-variant mt-1">
                  {w.sponsor.name}{w.sponsor.constituency ? ` · ${w.sponsor.constituency}` : ''}{w.sitting ? ` · ${w.sitting}` : ''}
                </p>
              )}
              {s && (
                <div className="mt-4 bg-surface-container-low rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-label-sm font-label-bold uppercase text-outline">What this is</p>
                    <AiBadge confidence={s.confidence} model={s.model} generatedAt={s.generatedAt} />
                  </div>
                  <p className="text-on-surface">{s.summary}</p>
                  {s.keyPoints.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {s.keyPoints.map((k) => (
                        <li key={k} className="flex items-start gap-2 text-sm text-on-surface-variant"><Icon name="task_alt" className="text-primary text-base mt-0.5 shrink-0" />{k}</li>
                      ))}
                    </ul>
                  )}
                  {s.outcome && <p className="text-label-sm text-on-surface-variant mt-2"><span className="font-label-bold">Where it stands:</span> {s.outcome}</p>}
                </div>
              )}
              {texts.map((d) => (
                <DocText key={d.key} url={`/doctexts/${d.key}.json`} title={`${d.label}: full text`} source={d.label.toLowerCase()} className="mt-3 !p-4" />
              ))}
              <a href={w.url} target="_blank" rel="noreferrer noopener" className="mt-3 inline-flex items-center gap-1 text-label-sm font-label-bold text-primary hover:underline">
                <Icon name="open_in_new" className="text-[16px]" /> View on People’s Majlis
              </a>
            </li>
          )
        })}
      </ul>
      {list.length > shown.length && <p className="text-center text-label-sm text-outline mt-6">Showing 60 of {list.length}. Search or filter to narrow down.</p>}
      {list.length === 0 && <p className="text-center text-on-surface-variant py-16">Nothing matches.</p>}
    </Container>
  )
}
