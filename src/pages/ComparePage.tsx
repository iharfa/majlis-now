import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Container, PageHeader } from '@/components/ui/Container'
import { Avatar } from '@/components/ui/Avatar'
import { PartyTag } from '@/components/ui/PartyTag'
import { Icon } from '@/components/ui/Icon'
import { mps, mpById, constituencyById, partyById, votes, attendanceForMP, committeesForMP, billsSponsoredBy } from '@/data'
import { cn } from '@/utils/cn'
import { formatDate, pct } from '@/utils/format'

const CHOICE_CLASS: Record<string, string> = {
  Yes: 'text-secondary', No: 'text-error', Abstain: 'text-tertiary', Absent: 'text-on-surface-variant',
}

export function ComparePage() {
  const [params] = useSearchParams()
  const [a, setA] = useState(params.get('a') ?? mps[0].id)
  const [b, setB] = useState(params.get('b') ?? mps[1].id)

  const mpA = mpById(a)
  const mpB = mpById(b)
  const sorted = [...votes].sort((x, y) => y.date.localeCompare(x.date))

  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Compare MPs"
        title="Side-by-side records"
        description="Roster facts, committee seats and every recorded roll-call vote, side by side. Records, not rankings."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter mb-8">
        <Picker label="Representative A" value={a} onChange={setA} exclude={b} />
        <Picker label="Representative B" value={b} onChange={setB} exclude={a} />
      </div>

      {mpA && mpB && (
        <>
          <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-outline-variant/40">
              {[mpA, mpB].map((m) => (
                <Link key={m.id} to={`/mps/${m.id}`} className="p-6 flex flex-col items-center text-center gap-2 hover:bg-surface-container-low">
                  <Avatar mp={m} size="lg" />
                  <h3 className="font-headline-md text-lg">{m.name}</h3>
                  <PartyTag partyId={m.partyId} />
                  <p className="text-label-sm text-on-surface-variant">{constituencyById(m.constituencyId)?.name}</p>
                </Link>
              ))}
            </div>
            <Row label="Atoll / city" a={constituencyById(mpA.constituencyId)?.atoll ?? '—'} b={constituencyById(mpB.constituencyId)?.atoll ?? '—'} />
            <Row label="Party" a={partyById(mpA.partyId)?.name ?? '—'} b={partyById(mpB.partyId)?.name ?? '—'} />
            <Row label="Role" a={mpA.leadershipRole ?? 'Member'} b={mpB.leadershipRole ?? 'Member'} />
            <Row label="Committees" a={String(committeesForMP(mpA.id).length)} b={String(committeesForMP(mpB.id).length)} />
            <Row label="Bills sponsored" a={String(billsSponsoredBy(mpA.id).length)} b={String(billsSponsoredBy(mpB.id).length)} />
            <Row label="Present at votes" a={attendanceLabel(mpA.id)} b={attendanceLabel(mpB.id)} />
          </div>

          <h2 className="font-headline-md text-headline-md mt-10 mb-4">Roll-call votes</h2>
          <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden">
            {sorted.map((v) => {
              const va = v.mpVotes.find((x) => x.mpId === mpA.id)
              const vb = v.mpVotes.find((x) => x.mpId === mpB.id)
              return (
                <div key={v.id} className="grid grid-cols-[1fr_auto_1fr] items-center border-t first:border-t-0 border-outline-variant/40">
                  <div className={cn('px-4 py-3 text-right font-label-bold', CHOICE_CLASS[va?.choice ?? ''] ?? 'text-outline')}>
                    {va?.choice ?? '—'}
                  </div>
                  <Link to={`/votes/${v.id}`} className="px-3 py-3 text-center w-40 md:w-72 hover:text-primary">
                    <p className="text-label-sm font-label-bold text-on-surface line-clamp-2">{v.title.replace(/ — .*$/, '')}</p>
                    <p className="text-[11px] text-outline">
                      {v.voteType === 'acceptance' ? 'Acceptance' : 'Final'} · {formatDate(v.date)} · {v.result}
                    </p>
                  </Link>
                  <div className={cn('px-4 py-3 font-label-bold', CHOICE_CLASS[vb?.choice ?? ''] ?? 'text-outline')}>
                    {vb?.choice ?? '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <p className="mt-4 text-label-sm text-outline flex items-center gap-1">
        <Icon name="info" className="text-[14px]" /> Roster and votes from majlis.gov.mv official records. “—” means the member
        was not on that roll call (for example the presiding Speaker).
      </p>
    </Container>
  )
}

function attendanceLabel(mpId: string): string {
  const mp = mpById(mpId)
  if (mp?.leadershipRole === 'Speaker') return 'Presides'
  const { present, total } = attendanceForMP(mpId)
  return total ? `${present} of ${total} (${pct(present, total)}%)` : '—'
}

function Picker({ label, value, onChange, exclude }: { label: string; value: string; onChange: (v: string) => void; exclude: string }) {
  return (
    <label className="block">
      <span className="text-label-sm font-label-bold uppercase text-outline">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-white border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
      >
        {mps
          .filter((m) => m.id !== exclude)
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} · {constituencyById(m.constituencyId)?.name}
            </option>
          ))}
      </select>
    </label>
  )
}

function Row({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center border-t border-outline-variant/40">
      <div className="px-4 py-4 text-right font-label-bold text-on-surface text-sm">{a}</div>
      <div className="px-3 py-4 text-center text-label-sm text-on-surface-variant w-28 md:w-40">{label}</div>
      <div className="px-4 py-4 font-label-bold text-on-surface text-sm">{b}</div>
    </div>
  )
}
