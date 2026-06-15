import { Link } from 'react-router-dom'
import type { MP } from '@/types'
import { constituencyById, partyById, committeesForMP } from '@/data'
import { Avatar } from '@/components/ui/Avatar'
import { PartyTag } from '@/components/ui/PartyTag'
import { Icon } from '@/components/ui/Icon'

/** Compact MP preview used in lists and Find-your-MP results (real roster). */
export function MPProfileCard({ mp }: { mp: MP }) {
  const c = constituencyById(mp.constituencyId)
  const party = partyById(mp.partyId)
  const committeeCount = committeesForMP(mp.id).length
  return (
    <Link
      to={`/mps/${mp.id}`}
      className="group block bg-white rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all p-6"
    >
      <div className="flex items-center gap-4">
        <Avatar mp={mp} size="lg" />
        <div className="min-w-0">
          <h3 className="font-headline-md text-lg text-on-surface truncate group-hover:text-primary transition-colors">
            {mp.name}
          </h3>
          <p className="text-sm text-on-surface-variant truncate">{c?.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <PartyTag partyId={mp.partyId} />
            {mp.leadershipRole && (
              <span className="text-label-sm font-label-bold text-primary">{mp.leadershipRole}</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-outline-variant/40 flex items-center justify-between">
        <span className="text-label-sm text-outline truncate inline-flex items-center gap-1">
          <Icon name="groups" className="text-[14px]" />
          {committeeCount} committee{committeeCount === 1 ? '' : 's'} · {party?.shortName}
        </span>
        <span className="inline-flex items-center gap-1 text-primary font-label-bold text-label-sm shrink-0">
          View record <Icon name="arrow_forward" className="text-[16px]" />
        </span>
      </div>
    </Link>
  )
}
