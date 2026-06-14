import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, PageHeader } from '@/components/ui/Container'
import { MPProfileCard } from '@/components/mps/MPProfileCard'
import { FindYourMP } from '@/components/mps/FindYourMP'
import { Icon } from '@/components/ui/Icon'
import { mps, parties, constituencyById } from '@/data'
import { cn } from '@/utils/cn'

export function MPsPage() {
  const [party, setParty] = useState('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return mps
      .filter((m) => (party === 'all' ? true : m.partyId === party))
      .filter((m) => {
        if (!q) return true
        const c = constituencyById(m.constituencyId)
        return `${m.name} ${c?.name ?? ''} ${c?.atoll ?? ''}`.toLowerCase().includes(q)
      })
  }, [party, query])

  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Members"
        title="Find your MP and see their record"
        description="Action-based accountability records — attendance, votes by issue, and recent activity. We show records, not rankings."
      >
        <Link
          to="/compare"
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-label-bold shrink-0"
        >
          <Icon name="compare_arrows" /> Compare MPs
        </Link>
      </PageHeader>

      <div className="mb-8">
        <FindYourMP variant="plain" />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name, constituency, or atoll…"
          className="flex-1 bg-white border border-outline-variant rounded-full px-5 py-3 focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        <Chip active={party === 'all'} onClick={() => setParty('all')}>All parties</Chip>
        {parties.map((p) => (
          <Chip key={p.id} active={party === p.id} onClick={() => setParty(p.id)}>
            {p.shortName}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {filtered.map((m) => (
          <MPProfileCard key={m.id} mp={m} />
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-on-surface-variant py-16">No MPs match.</p>}
    </Container>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
