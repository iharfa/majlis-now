import { Link, useParams } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { DataMeta } from '@/components/ui/DataMeta'
import { ParliamentSignalCard } from '@/components/signals/ParliamentSignalCard'
import { NotFoundPage } from './NotFoundPage'
import { committeeById, mpById, billById, signalsForCommittee, constituencyById } from '@/data'
import { formatDate } from '@/utils/format'

export function CommitteeDetailPage() {
  const { id } = useParams()
  const c = id ? committeeById(id) : undefined
  if (!c) return <NotFoundPage />

  const chair = mpById(c.chairMpId)
  const members = c.memberMpIds.map((m) => mpById(m)).filter(Boolean)
  const sigs = signalsForCommittee(c.id)

  return (
    <Container className="py-8">
      <div className="flex items-center gap-2 text-on-surface-variant text-label-sm mb-3">
        <Link to="/committees" className="hover:text-primary">Committees</Link>
        <Icon name="chevron_right" className="text-sm" />
        <span>{c.name}</span>
      </div>

      <h1 className="font-headline-lg text-headline-lg">{c.name}</h1>
      <p className="text-on-surface-variant mt-1">
        Chair: {chair?.name} · {members.length} members · {c.attendance}% average attendance
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mt-6">
        <Stat value={c.meetings.length} label="Meetings" icon="event" />
        <Stat value={c.billsReviewedIds.length} label="Bills reviewed" icon="description" />
        <Stat value={c.reportsProduced} label="Reports produced" icon="summarize" />
        <Stat value={c.stalledItems.length} label="Stalled items" icon="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mt-8">
        <div className="lg:col-span-2 space-y-gutter">
          {sigs.length > 0 && (
            <section className="space-y-stack-gap">
              <h2 className="font-headline-md text-headline-md">Process signals</h2>
              {sigs.map((s) => (
                <ParliamentSignalCard key={s.id} signal={s} />
              ))}
            </section>
          )}

          {c.stalledItems.length > 0 && (
            <section className="bg-error-container/40 border border-error/30 rounded-2xl p-6">
              <h2 className="font-headline-md text-headline-md text-on-error-container mb-3 flex items-center gap-2">
                <Icon name="warning" /> Stalled items
              </h2>
              <ul className="space-y-2">
                {c.stalledItems.map((s) => (
                  <li key={s} className="text-on-error-container text-sm flex items-start gap-2">
                    <Icon name="pause_circle" className="text-[16px] mt-0.5" /> {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Meetings */}
          <section className="bg-white rounded-2xl border border-outline-variant/30 p-6">
            <h2 className="font-headline-md text-headline-md mb-4">Meetings</h2>
            <ul className="divide-y divide-outline-variant/40">
              {c.meetings.map((m) => (
                <li key={m.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-label-bold text-on-surface">{m.subject}</p>
                    <p className="text-label-sm text-on-surface-variant">{formatDate(m.date)}</p>
                  </div>
                  <span className="text-label-sm font-label-bold text-on-surface-variant">{m.attendance}% present</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Bills reviewed */}
          {c.billsReviewedIds.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-headline-md text-headline-md">Bills reviewed</h2>
              {c.billsReviewedIds.map((bid) => {
                const b = billById(bid)
                if (!b) return null
                return (
                  <Link
                    key={bid}
                    to={`/bills/${bid}`}
                    className="flex items-center justify-between bg-white rounded-xl border border-outline-variant/30 p-5 hover:shadow-md transition-all"
                  >
                    <div>
                      <p className="font-label-bold text-on-surface">{b.title}</p>
                      <p className="text-label-sm text-on-surface-variant">{b.ref} · {b.status}</p>
                    </div>
                    <Icon name="arrow_forward" className="text-primary" />
                  </Link>
                )
              })}
            </section>
          )}

          <DataMeta sources={c.sources} reportContext={`Committee: ${c.name}`} />
        </div>

        {/* Members */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 lg:sticky lg:top-24">
            <h3 className="font-headline-md text-headline-md mb-4">Members</h3>
            <ul className="space-y-3">
              {members.map((m) => {
                const con = constituencyById(m!.constituencyId)
                return (
                  <li key={m!.id}>
                    <Link to={`/mps/${m!.id}`} className="flex items-center gap-3 group">
                      <Avatar mp={m!} size="md" />
                      <div className="min-w-0">
                        <p className="font-label-bold text-on-surface group-hover:text-primary truncate">
                          {m!.name}
                          {m!.id === c.chairMpId && <span className="text-label-sm text-primary"> · Chair</span>}
                        </p>
                        <p className="text-label-sm text-on-surface-variant truncate">{con?.name}</p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>
      </div>
    </Container>
  )
}

function Stat({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-outline-variant/30 text-center">
      <Icon name={icon} className="text-primary text-2xl" />
      <p className="font-headline-md text-on-surface mt-1">{value}</p>
      <p className="text-[10px] font-label-bold uppercase text-outline">{label}</p>
    </div>
  )
}
