import { Link } from 'react-router-dom'
import { Container, PageHeader } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { SignalBadge } from '@/components/ui/SignalBadge'
import { committees, mpById, signalsForCommittee } from '@/data'
import { formatDate } from '@/utils/format'

export function CommitteesPage() {
  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Committees"
        title="Where the detailed work happens"
        description="Committee membership, meetings, attendance, and any process signals — stalled items, pending reports, or missing documents."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {committees.map((c) => {
          const chair = mpById(c.chairMpId)
          const sigs = signalsForCommittee(c.id)
          return (
            <Link
              key={c.id}
              to={`/committees/${c.id}`}
              className="group block bg-white rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all p-6"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-headline-md text-lg group-hover:text-primary transition-colors">{c.name}</h3>
                {sigs.map((s) => (
                  <SignalBadge key={s.id} type={s.type} severity={s.severity} showLabel={false} />
                ))}
              </div>
              <p className="text-sm text-on-surface-variant">Chair: {chair?.name ?? '—'} · {c.memberMpIds.length} members</p>
              <p className="mt-3 text-sm text-on-surface">
                <span className="font-label-bold">Latest:</span> {c.latestAction}
              </p>
              <div className="mt-4 pt-4 border-t border-outline-variant/40 flex items-center justify-between text-label-sm text-outline">
                <span>{c.meetings.length} meetings · {c.attendance}% attendance</span>
                <span>{formatDate(c.latestActionDate)}</span>
              </div>
              {c.stalledItems.length > 0 && (
                <p className="mt-2 text-label-sm text-error flex items-center gap-1">
                  <Icon name="warning" className="text-[14px]" /> {c.stalledItems.length} stalled item(s)
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </Container>
  )
}
