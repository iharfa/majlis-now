import { partyById } from '@/data'
import { cn } from '@/utils/cn'
import { readableText } from '@/utils/contrast'

/** Small party chip coloured by the party's brand colour. */
export function PartyTag({ partyId, className }: { partyId: string; className?: string }) {
  const party = partyById(partyId)
  if (!party) return null
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-bold', className)}
      style={{ backgroundColor: party.color, color: readableText(party.color) }}
      title={party.name}
    >
      {party.shortName}
    </span>
  )
}
