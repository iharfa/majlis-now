import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { DataMeta } from '@/components/ui/DataMeta'
import { PartyTag } from '@/components/ui/PartyTag'
import { NotFoundPage } from './NotFoundPage'
import { mpById, partyById, constituencyById, votesByMP, committeesForMP } from '@/data'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'

export function MPDetailPage() {
  const { id } = useParams()
  const mp = id ? mpById(id) : undefined
  const [following, setFollowing] = useState(false)
  if (!mp) return <NotFoundPage />

  const party = partyById(mp.partyId)
  const constituency = constituencyById(mp.constituencyId)
  // Only real, sourced roll-call votes are shown for a named member.
  const recordedVotes = votesByMP(mp.id).filter(({ vote }) => vote.provenance === 'official-rollcall')
  // Real committee memberships (chair/vice first).
  const committeeRoles = committeesForMP(mp.id).sort((a, b) => {
    const rank = { Chair: 0, 'Vice Chair': 1, Member: 2 } as const
    return rank[a.role] - rank[b.role] || a.committee.name.localeCompare(b.committee.name)
  })

  return (
    <Container className="py-8">
      {/* Hero */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-section-gap">
        <div className="md:col-span-4">
          <div className="aspect-[4/5] rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-surface-dim flex items-center justify-center">
            {mp.photoUrl ? (
              <img
                src={mp.photoUrl}
                alt={mp.name}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <Avatar mp={mp} size="lg" className="!w-28 !h-28 !text-4xl" />
            )}
          </div>
        </div>
        <div className="md:col-span-8 flex flex-col justify-center gap-stack-gap py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-secondary text-on-secondary px-3 py-1 rounded-full text-xs font-label-bold status-pill">
              {mp.active ? 'Sitting member' : 'Former member'}
            </span>
            <PartyTag partyId={mp.partyId} />
            {mp.leadershipRole && (
              <span className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-label-bold status-pill">
                {mp.leadershipRole}
              </span>
            )}
          </div>
          <h1 className="font-display-lg text-display-lg text-on-background">{mp.name}</h1>
          <p className="font-body-lg text-on-surface-variant">
            {constituency?.name} constituency · {constituency?.atoll} · {party?.name}
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <button
              onClick={() => setFollowing((t) => !t)}
              className={
                following
                  ? 'px-6 py-3 rounded-xl font-label-bold flex items-center gap-2 bg-secondary text-on-secondary'
                  : 'px-6 py-3 rounded-xl font-label-bold flex items-center gap-2 bg-primary text-white hover:brightness-110 transition-all'
              }
            >
              <Icon name={following ? 'check_circle' : 'notifications_active'} />
              {following ? 'Following' : 'Follow this MP'}
            </button>
            <Link
              to={`/compare?a=${mp.id}`}
              className="border-2 border-primary text-primary px-6 py-3 rounded-xl font-label-bold flex items-center gap-2 hover:bg-primary-fixed transition-colors"
            >
              <Icon name="compare_arrows" /> Compare
            </Link>
            {mp.profileUrl && (
              <a
                href={mp.profileUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="px-6 py-3 rounded-xl font-label-bold flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <Icon name="open_in_new" /> Official profile
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Verified facts */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-gutter">
        <Fact icon="how_to_reg" label="Constituency" value={constituency?.name ?? '—'} />
        <Fact icon="map" label="Atoll / city" value={constituency?.atoll ?? '—'} />
        <Fact icon="diversity_3" label="Party" value={party?.name ?? '—'} />
      </section>

      {/* Committee memberships (real) */}
      {committeeRoles.length > 0 && (
        <section className="bg-white rounded-2xl border border-outline-variant/30 p-6 mb-gutter">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="groups" className="text-primary" />
            <h2 className="font-headline-md text-headline-md">Committee memberships</h2>
            <span className="text-label-sm text-outline">({committeeRoles.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {committeeRoles.map(({ committee, role }) => (
              <Link
                key={committee.id}
                to={`/committees/${committee.id}`}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-variant transition-colors"
              >
                <span className="font-label-bold text-on-surface text-sm min-w-0 truncate">{committee.name}</span>
                <span
                  className={cn(
                    'shrink-0 text-label-sm font-label-bold px-2 py-0.5 rounded-full',
                    role === 'Member'
                      ? 'bg-surface-container text-on-surface-variant'
                      : 'bg-primary-fixed text-on-primary-fixed-variant',
                  )}
                >
                  {role}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Real recorded votes (official roll calls only) */}
      {recordedVotes.length > 0 && (
        <section className="bg-white rounded-2xl border border-outline-variant/30 p-6 mb-gutter">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-headline-md text-headline-md">Recorded votes</h2>
            <span className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-sm font-label-bold">
              <Icon name="verified" className="text-[14px]" /> Official
            </span>
          </div>
          <ul className="divide-y divide-outline-variant/40">
            {recordedVotes.map(({ vote, mpVote }) => (
              <li key={vote.id} className="py-3 flex items-center justify-between gap-3">
                <Link to={`/votes/${vote.id}`} className="min-w-0">
                  <p className="font-label-bold text-on-surface truncate hover:text-primary">{vote.title}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {vote.result} · {formatDate(vote.date)}
                    {mpVote.detail && mpVote.detail !== mpVote.choice ? ` · ${mpVote.detail}` : ''}
                  </p>
                </Link>
                <span
                  className={cn(
                    'shrink-0 font-bold flex items-center gap-1 text-sm',
                    mpVote.choice === 'Yes' && 'text-secondary',
                    mpVote.choice === 'No' && 'text-error',
                    mpVote.choice === 'Abstain' && 'text-tertiary',
                    mpVote.choice === 'Absent' && 'text-on-surface-variant',
                  )}
                >
                  {mpVote.choice}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Open data notice — instead of fabricating attendance/voting records */}
      <section className="bg-tertiary-fixed/60 border border-tertiary/30 rounded-2xl p-8">
        <div className="flex items-start gap-4">
          <Icon name="info" className="text-tertiary text-3xl shrink-0" />
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2">
              Voting & attendance records are not yet open data
            </h2>
            <p className="text-on-surface-variant max-w-2xl">
              The People’s Majlis publishes this member’s name, constituency, party, photo, and committee
              memberships — but it does <span className="font-label-bold">not</span> publish per-member voting
              records or attendance as structured open data. To keep Majlis Now evidence-first and non-partisan,
              we don’t show numbers we can’t source. When an official open-data feed becomes available, this
              section will populate automatically.
            </p>
            {mp.profileUrl && (
              <a
                href={mp.profileUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-4 inline-flex items-center gap-1 text-primary font-label-bold text-label-bold hover:underline"
              >
                View this member on majlis.gov.mv <Icon name="arrow_forward" className="text-[18px]" />
              </a>
            )}
          </div>
        </div>
      </section>

      <DataMeta sources={mp.sources} confidence="High" reportContext={`MP: ${mp.name}`} className="mt-8" />
    </Container>
  )
}

function Fact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 flex items-center gap-4">
      <span className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
        <Icon name={icon} className="text-2xl" />
      </span>
      <div className="min-w-0">
        <p className="text-label-sm font-label-bold uppercase text-outline">{label}</p>
        <p className="font-headline-md text-on-surface text-lg truncate">{value}</p>
      </div>
    </div>
  )
}
