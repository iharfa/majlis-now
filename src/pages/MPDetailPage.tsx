import { Link, useParams } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { DataMeta } from '@/components/ui/DataMeta'
import { PartyTag } from '@/components/ui/PartyTag'
import { StatusPill } from '@/components/ui/StatusPill'
import { NotFoundPage } from './NotFoundPage'
import { mpById, partyById, constituencyById, votesByMP, committeesForMP, attendanceForMP, billsSponsoredBy, speechesByMP, committeeAttendanceForMP } from '@/data'
import { floorRank } from '@/data/insights'
import { cn } from '@/utils/cn'
import { formatDate, pct } from '@/utils/format'

export function MPDetailPage() {
  const { id } = useParams()
  const mp = id ? mpById(id) : undefined
  if (!mp) return <NotFoundPage />

  const party = partyById(mp.partyId)
  const constituency = constituencyById(mp.constituencyId)
  const recordedVotes = votesByMP(mp.id)
  const attendance = attendanceForMP(mp.id)
  const sponsored = billsSponsoredBy(mp.id)
  const speeches = speechesByMP(mp.id)
  const cmtAttendance = committeeAttendanceForMP(mp.id)
  const rank = floorRank(mp.id)
  const isSpeaker = mp.leadershipRole === 'Speaker'
  const committeeRoles = committeesForMP(mp.id).sort((a, b) => {
    const rank = { Chair: 0, 'Vice Chair': 1, Member: 2 } as const
    return rank[a.role] - rank[b.role] || a.committee.name.localeCompare(b.committee.name)
  })

  return (
    <Container className="py-8">
      <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-section-gap">
        <div className="md:col-span-4">
          <div className="aspect-[4/5] rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-surface-dim flex items-center justify-center">
            <Avatar mp={mp} size="lg" className="!w-full !h-full !rounded-none !text-6xl" />
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
            <Link
              to={`/compare?a=${mp.id}`}
              className="bg-primary text-white px-6 py-3 rounded-xl font-label-bold flex items-center gap-2 hover:brightness-110 transition-all"
            >
              <Icon name="compare_arrows" /> Compare
            </Link>
            {mp.profileUrl && (
              <a
                href={mp.profileUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="border-2 border-primary text-primary px-6 py-3 rounded-xl font-label-bold flex items-center gap-2 hover:bg-primary-fixed transition-colors"
              >
                <Icon name="open_in_new" /> Official profile
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-gutter">
        <Fact icon="record_voice_over" label="Floor time" value={speeches.length ? `${speeches.reduce((n, s) => n + s.turns, 0)} turns${rank ? ` · #${rank.rank} of ${rank.of}` : ''}` : rank ? `No turns · #${rank.rank} of ${rank.of}` : '—'} />
        <Fact
          icon="groups"
          label="Committee attendance"
          value={cmtAttendance.length ? `${pct(cmtAttendance.reduce((n, r) => n + r.present, 0), cmtAttendance.reduce((n, r) => n + r.eligible, 0))}%` : '—'}
        />
        <Fact
          icon="event_available"
          label="Present at recorded votes"
          value={isSpeaker ? 'Presides' : attendance.total ? `${attendance.present} of ${attendance.total} (${pct(attendance.present, attendance.total)}%)` : '—'}
        />
        <Fact icon="description" label="Bills sponsored" value={String(sponsored.length)} />
      </section>

      {committeeRoles.length > 0 && (
        <section className="bg-white rounded-2xl border border-outline-variant/30 p-6 mb-gutter">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="groups" className="text-primary" />
            <h2 className="font-headline-md text-headline-md">Committee memberships</h2>
            <span className="text-label-sm text-outline">({committeeRoles.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {committeeRoles.map(({ committee, role }) => {
              const att = cmtAttendance.find((r) => r.committee.id === committee.id)
              return (
              <Link
                key={committee.id}
                to={`/committees/${committee.id}`}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-variant transition-colors"
              >
                <span className="min-w-0">
                  <span className="font-label-bold text-on-surface text-sm block truncate">{committee.name}</span>
                  {att && <span className="text-label-sm text-outline">Attended {att.present} of {att.eligible} meetings</span>}
                </span>
                <span
                  className={cn(
                    'shrink-0 text-label-sm font-label-bold px-2 py-0.5 rounded-full',
                    role === 'Member' ? 'bg-surface-container text-on-surface-variant' : 'bg-primary-fixed text-on-primary-fixed-variant',
                  )}
                >
                  {role}
                </span>
              </Link>
              )
            })}
          </div>
        </section>
      )}

      {speeches.length > 0 && (
        <section className="bg-white rounded-2xl border border-outline-variant/30 p-6 mb-gutter">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-headline-md text-headline-md">In the chamber</h2>
            <span className="inline-flex items-center gap-1 bg-white/70 border border-outline-variant/40 text-on-surface-variant px-3 py-1 rounded-full text-label-sm font-label-bold">
              <Icon name="translate" className="text-[14px]" /> From the official minutes, AI-translated
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mb-4">Sittings where the minutes record this member speaking, with Claude's one-line reading of each contribution.</p>
          <ul className="divide-y divide-outline-variant/40">
            {speeches.slice(0, 12).map(({ sitting, turns, positions }) => (
              <li key={sitting.id} className="py-3">
                <Link to={`/sittings/${sitting.id}`} className="flex items-center justify-between gap-3">
                  <span className="font-label-bold text-on-surface hover:text-primary truncate">{sitting.title}</span>
                  <span className="text-label-sm text-outline shrink-0">{formatDate(sitting.date)} · {turns} turn{turns === 1 ? '' : 's'}</span>
                </Link>
                {positions.length > 0 && <p className="text-sm text-on-surface-variant mt-1">{positions[0]}</p>}
              </li>
            ))}
          </ul>
          {speeches.length > 12 && <p className="text-label-sm text-outline mt-3">Showing the 12 most recent of {speeches.length} sittings.</p>}
        </section>
      )}

      {sponsored.length > 0 && (
        <section className="bg-white rounded-2xl border border-outline-variant/30 p-6 mb-gutter">
          <h2 className="font-headline-md text-headline-md mb-4">Bills sponsored</h2>
          <ul className="divide-y divide-outline-variant/40">
            {sponsored.map((b) => (
              <li key={b.id} className="py-3 flex items-center justify-between gap-3">
                <Link to={`/bills/${b.id}`} className="min-w-0 font-label-bold text-on-surface hover:text-primary truncate">
                  {b.title}
                </Link>
                <StatusPill status={b.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-white rounded-2xl border border-outline-variant/30 p-6 mb-gutter">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="font-headline-md text-headline-md">Recorded votes</h2>
          <span className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-sm font-label-bold">
            <Icon name="verified" className="text-[14px]" /> Official
          </span>
        </div>
        <p className="text-sm text-on-surface-variant mb-4">
          {isSpeaker
            ? 'As Speaker, this member presides over sittings and normally does not vote. The exceptions below are votes where the Speaker was eligible, such as constitutional amendments.'
            : !mp.active
              ? 'Votes recorded while this member was sitting. The seat has since been vacated.'
              : 'Every roll-call vote published by the Majlis, taken from the official vote-record PDFs. Attendance is derived from the same records.'}
        </p>
        {recordedVotes.length === 0 ? (
          <p className="text-sm text-outline">No roll-call votes recorded for this member.</p>
        ) : (
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
        )}
      </section>

      <DataMeta sources={mp.sources} confidence="High" reportContext={`MP: ${mp.name}`} className="mt-8" />
    </Container>
  )
}

function Fact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-outline-variant/30 flex items-center gap-3">
      <span className="w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
        <Icon name={icon} className="text-2xl" />
      </span>
      <div className="min-w-0">
        <p className="text-label-sm font-label-bold uppercase text-outline">{label}</p>
        <p className="font-headline-md text-on-surface text-base truncate">{value}</p>
      </div>
    </div>
  )
}
