import type { MP } from '@/types'
import { partyById } from '@/data'
import { cn } from '@/utils/cn'

interface AvatarProps {
  mp: MP
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-14 h-14 text-base',
}

/**
 * MP avatar. Renders the official photo when present; otherwise neutral
 * initials on the party colour — we deliberately avoid fabricated likenesses.
 */
export function Avatar({ mp, size = 'md', className }: AvatarProps) {
  const party = partyById(mp.partyId)
  if (mp.photoUrl) {
    return (
      <img
        src={mp.photoUrl}
        alt={mp.name}
        className={cn('rounded-full object-cover', SIZES[size], className)}
      />
    )
  }
  return (
    <span
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white shrink-0',
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: party?.color ?? '#767586' }}
      aria-hidden
    >
      {mp.initials}
    </span>
  )
}
