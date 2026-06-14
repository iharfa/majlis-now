import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Container, PageHeader } from '@/components/ui/Container'
import { Avatar } from '@/components/ui/Avatar'
import { PartyTag } from '@/components/ui/PartyTag'
import { Icon } from '@/components/ui/Icon'
import { mps, mpById, constituencyById, partyById } from '@/data'

export function ComparePage() {
  const [params] = useSearchParams()
  const [a, setA] = useState(params.get('a') ?? mps[0].id)
  const [b, setB] = useState(params.get('b') ?? mps[1].id)

  const mpA = mpById(a)
  const mpB = mpById(b)

  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Compare MPs"
        title="Side-by-side records"
        description="Compare verified roster facts. This compares records — it does not rank MPs as good or bad. Voting and attendance figures are not published as open data, so they are not shown."
      />

      <div className="grid grid-cols-2 gap-gutter mb-8">
        <Picker label="Representative A" value={a} onChange={setA} exclude={b} />
        <Picker label="Representative B" value={b} onChange={setB} exclude={a} />
      </div>

      {mpA && mpB && (
        <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-outline-variant/40">
            {[mpA, mpB].map((m) => {
              const c = constituencyById(m.constituencyId)
              return (
                <div key={m.id} className="p-6 flex flex-col items-center text-center gap-2">
                  <Avatar mp={m} size="lg" />
                  <h3 className="font-headline-md text-lg">{m.name}</h3>
                  <PartyTag partyId={m.partyId} />
                  <p className="text-label-sm text-on-surface-variant">{c?.name}</p>
                </div>
              )
            })}
          </div>

          <Row label="Constituency" a={constituencyById(mpA.constituencyId)?.name ?? '—'} b={constituencyById(mpB.constituencyId)?.name ?? '—'} />
          <Row label="Atoll / city" a={constituencyById(mpA.constituencyId)?.atoll ?? '—'} b={constituencyById(mpB.constituencyId)?.atoll ?? '—'} />
          <Row label="Party" a={partyById(mpA.partyId)?.name ?? '—'} b={partyById(mpB.partyId)?.name ?? '—'} />
          <Row label="Alignment" a={partyById(mpA.partyId)?.alignment ?? '—'} b={partyById(mpB.partyId)?.alignment ?? '—'} />
          <Row label="Leadership role" a={mpA.leadershipRole ?? 'Member'} b={mpB.leadershipRole ?? 'Member'} />
          <Row label="Status" a={mpA.active ? 'Sitting member' : 'Former member'} b={mpB.active ? 'Sitting member' : 'Former member'} />
        </div>
      )}

      <p className="mt-4 text-label-sm text-outline flex items-center gap-1">
        <Icon name="info" className="text-[14px]" /> Roster facts from majlis.gov.mv. Voting/attendance comparison
        will appear here when published as open data.
      </p>
    </Container>
  )
}

function Picker({
  label,
  value,
  onChange,
  exclude,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  exclude: string
}) {
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
              {m.name}
            </option>
          ))}
      </select>
    </label>
  )
}

function Row({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center border-t border-outline-variant/40">
      <div className="px-6 py-4 text-right font-label-bold text-on-surface">{a}</div>
      <div className="px-3 py-4 text-center text-label-sm text-on-surface-variant w-32 md:w-40">{label}</div>
      <div className="px-6 py-4 font-label-bold text-on-surface">{b}</div>
    </div>
  )
}
