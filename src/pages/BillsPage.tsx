import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, PageHeader } from '@/components/ui/Container'
import { BillCard } from '@/components/bills/BillCard'
import { StatusPill } from '@/components/ui/StatusPill'
import { bills, themes } from '@/data'
import type { BillStatus } from '@/types'
import { cn } from '@/utils/cn'
import { formatShortDate } from '@/utils/format'

const STATUS_ORDER: BillStatus[] = ['Passed', 'Ratified', 'In committee', 'Active debate', 'Vote scheduled', 'Introduced', 'Rejected', 'Withdrawn', 'Stalled']

/** Every dated timeline event across all bills, newest first, grouped by month. */
const timelineByMonth = (() => {
  const events = bills
    .flatMap((b) => b.timeline.filter((e) => e.date).map((e) => ({ ...e, bill: b })))
    .sort((a, b) => b.date!.localeCompare(a.date!) || a.bill.title.localeCompare(b.bill.title))
  const groups: Array<{ month: string; events: typeof events }> = []
  for (const e of events) {
    const month = new Date(e.date! + 'T00:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    const g = groups.at(-1)
    if (g && g.month === month) g.events.push(e)
    else groups.push({ month, events: [e] })
  }
  return groups
})()

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

function Timeline() {
  return (
    <div className="space-y-8">
      {timelineByMonth.map((g) => (
        <section key={g.month}>
          <h2 className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant mb-3 sticky top-16 bg-background py-2 z-10">{g.month} · {g.events.length} event{g.events.length === 1 ? '' : 's'}</h2>
          <ol className="relative border-l-2 border-outline-variant/40 ml-3 space-y-3">
            {g.events.map((e) => (
              <li key={e.id} className="pl-5 relative">
                <span className={cn('absolute -left-[7px] top-2 w-3 h-3 rounded-full border-2 border-white', e.stage === 'Passed or rejected' ? (e.bill.status === 'Rejected' ? 'bg-error' : 'bg-primary') : e.stage === 'Introduced' || e.stage === 'First reading' ? 'bg-secondary' : 'bg-outline')} />
                <Link to={`/bills/${e.bill.id}`} className="block bg-white rounded-xl border border-outline-variant/30 p-3 hover:shadow-sm">
                  <p className="text-label-sm text-outline">{formatShortDate(e.date)} · {e.title}</p>
                  <p className="text-sm text-on-surface font-label-bold mt-0.5 line-clamp-2">{e.bill.title}</p>
                  <StatusPill status={e.bill.status} className="mt-2 text-[10px] px-2 py-0.5" />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
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

      {tab === 'timeline' ? (
        <Timeline />
      ) : (
        <>
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
