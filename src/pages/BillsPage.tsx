import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, PageHeader } from '@/components/ui/Container'
import { BillCard } from '@/components/bills/BillCard'
import { StatusPill } from '@/components/ui/StatusPill'
import { bills, committeeById, themes } from '@/data'
import type { BillStatus } from '@/types'
import { cn } from '@/utils/cn'
import { TODAY, daysBetween, formatShortDate } from '@/utils/format'

const STATUS_ORDER: BillStatus[] = ['Passed', 'Ratified', 'In committee', 'Active debate', 'Vote scheduled', 'Introduced', 'Rejected', 'Withdrawn', 'Stalled']

function StatusCards({ active, onPick }: { active: BillStatus | 'all'; onPick: (s: BillStatus | 'all') => void }) {
  const counts = new Map<BillStatus, number>()
  for (const b of bills) counts.set(b.status, (counts.get(b.status) ?? 0) + 1)
  const cards: Array<{ key: BillStatus | 'all'; label: string; n: number }> = [
    { key: 'all', label: 'All bills', n: bills.length },
    ...STATUS_ORDER.filter((s) => counts.has(s)).map((s) => ({ key: s, label: s, n: counts.get(s)! })),
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onPick(active === c.key ? 'all' : c.key)}
          aria-pressed={active === c.key}
          className={cn(
            'text-left bg-white rounded-2xl border p-4 transition-all hover:shadow-md',
            active === c.key ? 'border-primary ring-2 ring-primary/30' : 'border-outline-variant/30',
          )}
        >
          <p className="font-headline-lg text-3xl text-on-surface">{c.n}</p>
          {c.key === 'all' ? (
            <p className="text-label-sm font-label-bold uppercase text-outline mt-1">{c.label}</p>
          ) : (
            <StatusPill status={c.key} className="mt-1" />
          )}
          {c.key !== 'all' && <p className="text-label-sm text-on-surface-variant mt-1">{Math.round((c.n / bills.length) * 100)}% of bills</p>}
        </button>
      ))}
    </div>
  )
}

const DONE = new Set<BillStatus>(['Passed', 'Ratified', 'Rejected', 'Withdrawn'])
const TRACK: Record<string, string> = { Passed: 'bg-primary', Ratified: 'bg-primary', Rejected: 'bg-error', Withdrawn: 'bg-outline', Stalled: 'bg-error' }

/** One row per bill: a bar from introduction to its last action (or today if still moving), with a dot per dated stage. */
function Timeline({ list }: { list: typeof bills }) {
  const today = TODAY.toISOString().slice(0, 10)
  const rows = [...list].sort((a, b) => b.introducedDate.localeCompare(a.introducedDate))
  const min = rows.reduce((m, b) => (b.introducedDate < m ? b.introducedDate : m), today)
  const span = Math.max(1, daysBetween(min, today))
  const x = (d: string) => (daysBetween(min, d) / span) * 100
  const months: Array<{ label: string; left: number }> = []
  for (let d = new Date(min.slice(0, 7) + '-01T00:00:00Z'); d.toISOString().slice(0, 10) <= today; d.setUTCMonth(d.getUTCMonth() + 1)) {
    const iso = d.toISOString().slice(0, 10)
    if (iso >= min) months.push({ label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' }), left: x(iso) })
  }
  return (
    <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,3fr)_minmax(0,6fr)] gap-3 items-end mb-1 text-label-sm font-label-bold uppercase text-outline">
          <p>Bill</p>
          <p>Committee</p>
          <div className="relative h-4 normal-case font-normal">
            {months.filter((_, i) => months.length <= 6 || i % Math.ceil(months.length / 6) === 0).map((m) => (
              <span key={m.label} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${m.left}%` }}>{m.label}</span>
            ))}
          </div>
        </div>
        <ol className="divide-y divide-outline-variant/15">
          {rows.map((b) => {
            const end = DONE.has(b.status) ? b.lastActionDate : today
            const left = x(b.introducedDate)
            const width = Math.max(0.6, x(end) - left)
            const events = b.timeline.filter((e) => e.date)
            const cmt = b.committeeId ? committeeById(b.committeeId) : undefined
            const range = `${formatShortDate(b.introducedDate)} → ${DONE.has(b.status) ? formatShortDate(b.lastActionDate) : 'now'} · ${daysBetween(b.introducedDate, end)} days`
            return (
              <li key={b.id} className="grid grid-cols-[minmax(0,5fr)_minmax(0,3fr)_minmax(0,6fr)] gap-3 items-center py-1">
                <Link to={`/bills/${b.id}`} className="min-w-0 flex items-center gap-2 hover:underline" title={`${b.title}
${range}`}>
                  <StatusPill status={b.status} className="text-[10px] px-2 py-0 shrink-0" />
                  <span className="text-sm text-on-surface truncate">{b.title}</span>
                </Link>
                {cmt ? (
                  <Link to={`/committees/${cmt.id}`} className="text-label-sm text-on-surface-variant truncate hover:underline hover:text-primary" title={cmt.name}>
                    {cmt.name.replace(/^Committee on /, '').replace(/ Committee$/, '')}
                  </Link>
                ) : (
                  <span className="text-label-sm text-outline">—</span>
                )}
                <div className="relative h-4" title={range}>
                  {months.map((m) => <span key={m.label} className="absolute top-0 bottom-0 border-l border-outline-variant/30" style={{ left: `${m.left}%` }} />)}
                  <div className={cn('absolute top-1.5 h-1.5 rounded-full', TRACK[b.status] ?? 'bg-secondary', !DONE.has(b.status) && 'opacity-60')} style={{ left: `${left}%`, width: `${width}%` }} />
                  {events.map((e) => (
                    <span key={e.id} className="absolute top-0.5 w-3 h-3 -translate-x-1/2 rounded-full bg-white border-2 border-on-surface-variant hover:scale-125 transition-transform" style={{ left: `${x(e.date!)}%` }} title={`${formatShortDate(e.date)} · ${e.title}`} />
                  ))}
                </div>
              </li>
            )
          })}
        </ol>
        <p className="text-label-sm text-outline mt-3">Bar runs from introduction to the last recorded action, or to today for bills still in progress. Dots are the dated stages on the Majlis work page; hover a dot for the stage, a row for the dates. Committee is the one the Majlis lists the bill under.</p>
      </div>
    </div>
  )
}

export function BillsPage() {
  const [theme, setTheme] = useState<string>('all')
  const [status, setStatus] = useState<BillStatus | 'all'>('all')
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'bills' | 'timeline'>('bills')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bills
      .filter((b) => (theme === 'all' ? true : b.themeId === theme))
      .filter((b) => (status === 'all' ? true : b.status === status))
      .filter((b) => !q || `${b.title} ${b.ref} ${b.summary}`.toLowerCase().includes(q))
  }, [theme, status, query])

  const usedThemes = themes.filter((t) => bills.some((b) => b.themeId === t.id))

  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Bill tracker"
        title="Every bill, and whether it’s moving"
        description="Every bill before the 20th Parliament: what it does in plain English, where it is in the process, and how MPs voted."
      />

      <StatusCards active={status} onPick={setStatus} />

      <div role="tablist" aria-label="View" className="flex gap-1 mb-6 bg-surface-container rounded-full p-1 w-fit">
        {([['bills', 'Bills'], ['timeline', 'Timeline']] as const).map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn('px-5 py-2 rounded-full text-label-sm font-label-bold transition-colors', tab === k ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bills by title or reference…"
            aria-label="Search bills"
            className="w-full bg-white border border-outline-variant rounded-full px-5 py-3 focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        <FilterChip active={theme === 'all'} onClick={() => setTheme('all')}>
          All themes
        </FilterChip>
        {usedThemes.map((t) => (
          <FilterChip key={t.id} active={theme === t.id} onClick={() => setTheme(t.id)}>
            {t.name}
          </FilterChip>
        ))}
      </div>

      {tab === 'timeline' ? (
        <Timeline list={filtered} />
      ) : (
        <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {filtered.map((b) => (
          <BillCard key={b.id} bill={b} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-on-surface-variant py-16">No bills match your filters.</p>
      )}
        </>
      )}
    </Container>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-label-sm font-label-bold transition-colors',
        active ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant',
      )}
    >
      {children}
    </button>
  )
}
