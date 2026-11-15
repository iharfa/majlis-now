import { Link } from 'react-router-dom'
import type { Bill } from '@/types'
import { themeById, signalsForBill, mpById, constituencyById } from '@/data'
import { StatusPill } from '@/components/ui/StatusPill'
import { Avatar } from '@/components/ui/Avatar'
import { PartyTag } from '@/components/ui/PartyTag'
import { SignalBadge } from '@/components/ui/SignalBadge'
import { Icon } from '@/components/ui/Icon'
import { daysSince, formatDate } from '@/utils/format'

export function BillCard({ bill }: { bill: Bill }) {
  const theme = themeById(bill.themeId)
  const sigs = signalsForBill(bill.id)
  const sponsor = bill.sponsorMpId ? mpById(bill.sponsorMpId) : undefined
  return (
    <Link
      to={`/bills/${bill.id}`}
      className="group block bg-white rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all p-6"
    >
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <StatusPill status={bill.status} />
        {theme && (
          <span className="text-label-sm font-label-bold text-on-surface-variant inline-flex items-center gap-1">
            <Icon name={theme.icon} className="text-[16px]" /> {theme.name}
          </span>
        )}
        <span className="text-label-sm text-outline ml-auto">{bill.ref}</span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
        {bill.title}
      </h3>
      <p className="mt-2 text-on-surface-variant line-clamp-2">{bill.summary}</p>

      {(sponsor || bill.sponsor) && (
        <div className="mt-4 flex items-center gap-3">
          {sponsor && <Avatar mp={sponsor} size="md" />}
          <div className="min-w-0">
            <p className="text-label-sm text-outline">Introduced by</p>
            <p className="text-sm text-on-surface font-label-bold flex items-center gap-2 min-w-0">
              <span className="truncate">{sponsor?.name ?? bill.sponsor}</span>
              {sponsor && <PartyTag partyId={sponsor.partyId} />}
              {sponsor && <span className="text-label-sm text-outline font-normal truncate hidden sm:inline">{constituencyById(sponsor.constituencyId)?.name}</span>}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {sigs.map((s) => (
          <SignalBadge key={s.id} type={s.type} severity={s.severity} />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-outline-variant/40 flex items-center justify-between text-label-sm">
        <span className="text-outline">Current stage: <span className="text-on-surface font-label-bold">{bill.currentStage}</span></span>
        <span className="text-outline">
          {bill.status === 'Passed' || bill.status === 'Rejected' || bill.status === 'Withdrawn'
            ? `Closed ${formatDate(bill.lastActionDate)}`
            : `${daysSince(bill.lastActionDate)}d since last action`}
        </span>
      </div>
    </Link>
  )
}
