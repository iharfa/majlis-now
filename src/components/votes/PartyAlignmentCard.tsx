import type { PartyVoteBreakdown } from '@/types'
import { partyById } from '@/data'
import { pct } from '@/utils/format'
import { readableText } from '@/utils/contrast'

export function PartyAlignmentCard({ breakdown }: { breakdown: PartyVoteBreakdown }) {
  const party = partyById(breakdown.partyId)
  const total = breakdown.yes + breakdown.no + breakdown.abstain + breakdown.absent
  const yesPct = pct(breakdown.yes, total)
  const noPct = pct(breakdown.no, total)
  const otherPct = Math.max(0, 100 - yesPct - noPct)

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
          style={{ backgroundColor: party?.color, color: party ? readableText(party.color) : '#fff' }}
        >
          {party?.shortName}
        </div>
        <div>
          <h4 className="font-label-bold text-on-surface">{party?.shortName}</h4>
          <p className="text-xs text-on-surface-variant">{party?.alignment}</p>
        </div>
      </div>
      <div className="h-2 bg-surface-variant rounded-full overflow-hidden flex mb-2">
        <div className="h-full bg-secondary" style={{ width: `${yesPct}%` }} />
        <div className="h-full bg-error" style={{ width: `${noPct}%` }} />
        <div className="h-full bg-outline" style={{ width: `${otherPct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] font-label-bold uppercase text-on-surface-variant">
        <span>{yesPct}% Yes</span>
        <span>{noPct}% No</span>
      </div>
    </div>
  )
}
