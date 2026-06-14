import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Vote, VoteChoice } from '@/types'
import { constituencyById, mpById } from '@/data'
import { Avatar } from '@/components/ui/Avatar'
import { PartyTag } from '@/components/ui/PartyTag'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/utils/cn'

const CHOICE_STYLE: Record<VoteChoice, { text: string; icon: string }> = {
  Yes: { text: 'text-secondary', icon: 'check_circle' },
  No: { text: 'text-error', icon: 'cancel' },
  Abstain: { text: 'text-tertiary', icon: 'remove_circle' },
  Absent: { text: 'text-on-surface-variant', icon: 'person_off' },
}

const PAGE = 12

/** Searchable, paginated member-by-member breakdown for a real roll-call vote. */
export function MPVoteTable({ vote }: { vote: Vote }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<VoteChoice | 'All'>('All')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return vote.mpVotes
      .map((mv) => ({ mv, mp: mpById(mv.mpId), constituency: constituencyById(mv.constituencyId) }))
      .filter((r) => r.mp)
      .filter((r) => (filter === 'All' ? true : r.mv.choice === filter))
      .filter(
        (r) =>
          !q ||
          r.mp!.name.toLowerCase().includes(q) ||
          (r.constituency?.name.toLowerCase().includes(q) ?? false),
      )
  }, [vote, query, filter])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const safePage = Math.min(page, pages - 1)
  const visible = rows.slice(safePage * PAGE, safePage * PAGE + PAGE)

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Yes', 'No', 'Abstain', 'Absent'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f)
                setPage(0)
              }}
              className={cn(
                'px-3 py-1 rounded-full text-label-sm font-label-bold transition-colors',
                filter === f ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
            placeholder="Search MP or constituency…"
            className="w-full bg-white border border-outline-variant rounded-full pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
          <Icon name="search" className="absolute left-3 top-2.5 text-on-surface-variant" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant font-label-bold text-sm">
                <th className="px-6 py-4">Representative</th>
                <th className="px-6 py-4">Constituency</th>
                <th className="px-6 py-4">Party</th>
                <th className="px-6 py-4">Vote</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {visible.map(({ mv, mp, constituency }) => {
                const style = CHOICE_STYLE[mv.choice]
                return (
                  <tr key={mv.mpId} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar mp={mp!} size="md" />
                        <span className="font-label-bold text-on-surface">{mp!.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface">{constituency?.name}</td>
                    <td className="px-6 py-4"><PartyTag partyId={mv.partyId} /></td>
                    <td className="px-6 py-4">
                      <span className={cn('font-bold flex items-center gap-1', style.text)}>
                        <Icon name={style.icon} className="text-sm" /> {mv.choice}
                      </span>
                      {mv.detail && mv.detail !== mv.choice && (
                        <span className="block text-label-sm text-outline">{mv.detail}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/mps/${mv.mpId}`} className="text-primary hover:underline text-sm font-label-bold">
                        View profile
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">
                    No representatives match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant flex justify-between items-center">
          <p className="text-sm text-on-surface-variant">
            Showing {rows.length === 0 ? 0 : safePage * PAGE + 1}–{Math.min(rows.length, safePage * PAGE + PAGE)} of{' '}
            {rows.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-3 py-1 border border-outline-variant rounded-lg text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={safePage >= pages - 1}
              className="px-3 py-1 bg-primary text-white rounded-lg text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
