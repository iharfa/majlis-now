import { useMemo, useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { search, type SearchHit } from '@/data'
import { cn } from '@/utils/cn'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'bill', label: 'Bills' },
  { key: 'mp', label: 'MPs' },
  { key: 'vote', label: 'Votes' },
  { key: 'issue', label: 'Issues' },
  { key: 'committee', label: 'Committees' },
] as const

const TYPE_META: Record<SearchHit['type'], { icon: string; path: (id: string) => string }> = {
  bill: { icon: 'description', path: (id) => `/bills/${id}` },
  vote: { icon: 'how_to_vote', path: (id) => `/votes/${id}` },
  mp: { icon: 'person', path: (id) => `/mps/${id}` },
  committee: { icon: 'groups', path: (id) => `/committees/${id}` },
  issue: { icon: 'topic', path: (id) => `/issues/${id}` },
  theme: { icon: 'category', path: (id) => `/issues/theme/${id}` },
}

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('all')

  useEffect(() => {
    const t = setTimeout(() => setParams(q ? { q } : {}, { replace: true }), 200)
    return () => clearTimeout(t)
  }, [q, setParams])

  const hits = useMemo(() => search(q), [q])
  const filtered = tab === 'all' ? hits : hits.filter((h) => h.type === tab)

  return (
    <Container className="py-8">
      <h1 className="font-headline-lg text-headline-lg mb-6">Search Majlis Now</h1>

      <div className="relative mb-6">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search bills, MPs, votes, committees, issues…"
          className="w-full bg-white border border-outline-variant rounded-full pl-12 pr-4 py-4 text-body-lg focus:ring-2 focus:ring-primary outline-none"
        />
        <Icon name="search" className="absolute left-4 top-4 text-on-surface-variant text-2xl" />
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map((t) => {
          const count = t.key === 'all' ? hits.length : hits.filter((h) => h.type === t.key).length
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-4 py-2 rounded-full text-label-sm font-label-bold transition-colors',
                tab === t.key ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant',
              )}
            >
              {t.label} {q && <span className="opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      {!q && <p className="text-on-surface-variant py-10 text-center">Start typing to search the mock dataset.</p>}

      {q && filtered.length === 0 && (
        <p className="text-on-surface-variant py-10 text-center">No results for “{q}”.</p>
      )}

      <div className="space-y-3">
        {filtered.map((h) => {
          const meta = TYPE_META[h.type]
          return (
            <Link
              key={`${h.type}-${h.id}`}
              to={meta.path(h.id)}
              className="flex items-center gap-4 bg-white rounded-xl border border-outline-variant/30 p-4 hover:shadow-md transition-all"
            >
              <span className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                <Icon name={meta.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-label-bold text-on-surface truncate">{h.title}</p>
                <p className="text-label-sm text-on-surface-variant">{h.subtitle}</p>
              </div>
              <Icon name="arrow_forward" className="text-primary" />
            </Link>
          )
        })}
      </div>
    </Container>
  )
}
