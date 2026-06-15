import { Link, useParams } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Avatar } from '@/components/ui/Avatar'
import { PartyTag } from '@/components/ui/PartyTag'
import { Icon } from '@/components/ui/Icon'
import { DataMeta } from '@/components/ui/DataMeta'
import { NotFoundPage } from './NotFoundPage'
import { committeeById, mpById, constituencyById } from '@/data'
import { formatDate } from '@/utils/format'

export function CommitteeDetailPage() {
  const { id } = useParams()
  const c = id ? committeeById(id) : undefined
  if (!c) return <NotFoundPage />

  const chair = c.chairMpId ? mpById(c.chairMpId) : undefined
  const vice = c.viceChairMpId ? mpById(c.viceChairMpId) : undefined
  const members = c.memberMpIds.map((m) => mpById(m)).filter(Boolean)
  const formerMembers = (c.formerMemberMpIds ?? []).map((m) => mpById(m)).filter(Boolean)

  return (
    <Container className="py-8">
      <div className="flex items-center gap-2 text-on-surface-variant text-label-sm mb-3">
        <Link to="/committees" className="hover:text-primary">Committees</Link>
        <Icon name="chevron_right" className="text-sm" />
        <span>{c.name}</span>
      </div>

      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="text-label-bold font-label-bold uppercase tracking-widest text-primary">{c.category}</span>
        {c.status === 'Completed' && (
          <span className="text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-label-bold">
            Completed
          </span>
        )}
      </div>
      <h1 className="font-headline-lg text-headline-lg">{c.name}</h1>
      <p className="text-on-surface-variant mt-1">
        {chair ? `Chair: ${chair.name}` : 'Chair: —'} · {members.length} members
        {c.latestActionDate ? ` · last met ${formatDate(c.latestActionDate)}` : ''}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mt-6">
        <Stat value={members.length} label="Members" icon="groups" />
        <Stat value={c.meetings.length} label="Recorded meetings" icon="event" />
        <Stat value={formerMembers.length} label="Former members" icon="history" />
        <Stat value={c.worksCount ?? 0} label="Works handled" icon="description" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mt-8">
        <div className="lg:col-span-2 space-y-gutter">
          {/* Leadership */}
          {(chair || vice) && (
            <section className="bg-white rounded-2xl border border-outline-variant/30 p-6">
              <h2 className="font-headline-md text-headline-md mb-4">Leadership</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
                {chair && <LeaderCard role="Chairperson" mpId={chair.id} />}
                {vice && <LeaderCard role="Vice Chairperson" mpId={vice.id} />}
              </div>
            </section>
          )}

          {/* Members */}
          <section className="bg-white rounded-2xl border border-outline-variant/30 p-6">
            <h2 className="font-headline-md text-headline-md mb-4">Members</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {members.map((m) => {
                const con = constituencyById(m!.constituencyId)
                return (
                  <Link key={m!.id} to={`/mps/${m!.id}`} className="flex items-center gap-3 group">
                    <Avatar mp={m!} size="md" />
                    <div className="min-w-0">
                      <p className="font-label-bold text-on-surface group-hover:text-primary truncate">
                        {m!.name}
                        {m!.id === c.chairMpId && <span className="text-label-sm text-primary"> · Chair</span>}
                        {m!.id === c.viceChairMpId && <span className="text-label-sm text-primary"> · Vice</span>}
                      </p>
                      <p className="text-label-sm text-on-surface-variant truncate flex items-center gap-1">
                        <PartyTag partyId={m!.partyId} /> {con?.name}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* Former members */}
          {formerMembers.length > 0 && (
            <section className="bg-surface-container-low rounded-2xl p-6">
              <h2 className="font-headline-md text-lg mb-3 flex items-center gap-2">
                <Icon name="history" className="text-on-surface-variant" /> Former members
              </h2>
              <div className="flex flex-wrap gap-2">
                {formerMembers.map((m) => (
                  <Link
                    key={m!.id}
                    to={`/mps/${m!.id}`}
                    className="inline-flex items-center gap-2 bg-white border border-outline-variant/40 rounded-full pl-1 pr-3 py-1 hover:border-primary/50"
                  >
                    <Avatar mp={m!} size="sm" />
                    <span className="text-label-sm font-label-bold">{m!.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <DataMeta sources={c.sources} confidence="High" reportContext={`Committee: ${c.name}`} />
        </div>

        {/* Meetings */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 lg:sticky lg:top-24">
            <h3 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
              <Icon name="event" /> Recent meetings
            </h3>
            {c.meetings.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No meetings recorded.</p>
            ) : (
              <ol className="relative space-y-5">
                <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-outline-variant" aria-hidden />
                {[...c.meetings]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((m) => (
                    <li key={m.id} className="relative pl-6">
                      <span className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                      <p className="font-label-bold text-on-surface text-sm">{formatDate(m.date)}</p>
                    </li>
                  ))}
              </ol>
            )}
            {c.sourceUrl && (
              <a
                href={c.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-5 inline-flex items-center gap-1 text-primary font-label-bold text-label-sm hover:underline"
              >
                Full committee record <Icon name="open_in_new" className="text-[16px]" />
              </a>
            )}
          </div>
        </aside>
      </div>
    </Container>
  )
}

function LeaderCard({ role, mpId }: { role: string; mpId: string }) {
  const mp = mpById(mpId)
  if (!mp) return null
  const con = constituencyById(mp.constituencyId)
  return (
    <Link to={`/mps/${mp.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-variant transition-colors">
      <Avatar mp={mp} size="lg" />
      <div className="min-w-0">
        <p className="text-label-sm font-label-bold uppercase text-primary">{role}</p>
        <p className="font-label-bold text-on-surface truncate">{mp.name}</p>
        <p className="text-label-sm text-on-surface-variant truncate">{con?.name}</p>
      </div>
    </Link>
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
