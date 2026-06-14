import { useMemo, useState } from 'react'
import { Container, PageHeader } from '@/components/ui/Container'
import { BillCard } from '@/components/bills/BillCard'
import { bills, themes } from '@/data'
import { cn } from '@/utils/cn'

export function BillsPage() {
  const [theme, setTheme] = useState<string>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bills
      .filter((b) => (theme === 'all' ? true : b.themeId === theme))
      .filter((b) => !q || `${b.title} ${b.ref} ${b.summary}`.toLowerCase().includes(q))
  }, [theme, query])

  const usedThemes = themes.filter((t) => bills.some((b) => b.themeId === t.id))

  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Bill tracker"
        title="Every bill, and whether it’s moving"
        description="Track each bill’s legislative journey, time in stage, and any process signals — fast, slow, stalled, or ready but not voted."
      />

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bills by title or reference…"
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
