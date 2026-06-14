import type { Vote } from '@/types'
import { Icon } from '@/components/ui/Icon'

const TILES = [
  { key: 'yesCount', label: 'Yes', icon: 'check_circle', border: 'border-secondary', text: 'text-secondary', grad: 'from-secondary-fixed-dim to-secondary' },
  { key: 'noCount', label: 'No', icon: 'cancel', border: 'border-error', text: 'text-error', grad: 'from-error-container to-error' },
  { key: 'abstainCount', label: 'Abstain', icon: 'remove_circle', border: 'border-tertiary', text: 'text-tertiary', grad: 'from-tertiary-fixed to-tertiary' },
  { key: 'absentCount', label: 'Absent', icon: 'person_off', border: 'border-outline', text: 'text-on-surface-variant', grad: 'from-surface-variant to-outline' },
] as const

export function VoteSummaryTiles({ vote }: { vote: Vote }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
      {TILES.map((t) => (
        <div
          key={t.key}
          className={`bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border-l-8 ${t.border} flex items-center justify-between`}
        >
          <div>
            <p className={`font-label-bold uppercase tracking-widest text-xs mb-1 ${t.text}`}>{t.label}</p>
            <p className="font-display-lg text-display-lg text-on-surface leading-none">{vote[t.key]}</p>
          </div>
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${t.grad} flex items-center justify-center text-white`}>
            <Icon name={t.icon} className="text-3xl" />
          </div>
        </div>
      ))}
    </div>
  )
}
