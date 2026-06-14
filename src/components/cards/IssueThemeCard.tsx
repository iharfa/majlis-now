import { Link } from 'react-router-dom'
import type { IssueTheme } from '@/types'
import { signalById } from '@/data'
import { Icon } from '@/components/ui/Icon'
import { SignalBadge } from '@/components/ui/SignalBadge'
import { accentClasses } from '@/utils/accents'

export function IssueThemeCard({ theme }: { theme: IssueTheme }) {
  const signal = theme.latestSignalId ? signalById(theme.latestSignalId) : undefined
  return (
    <Link
      to={`/issues/theme/${theme.id}`}
      className="group block bg-white rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accentClasses(theme.accent)}`}>
          <Icon name={theme.icon} className="text-2xl" />
        </div>
        {signal && <SignalBadge type={signal.type} severity={signal.severity} showLabel={false} />}
      </div>
      <h3 className="font-headline-md text-lg text-on-surface group-hover:text-primary transition-colors">
        {theme.name}
      </h3>
      <p className="mt-1 text-sm text-on-surface-variant line-clamp-2">{theme.publicImpact}</p>
      <div className="mt-4 flex items-center gap-4 text-label-sm text-outline">
        <span><span className="font-label-bold text-on-surface">{theme.activeBillCount}</span> active bills</span>
        <span><span className="font-label-bold text-on-surface">{theme.recentVoteCount}</span> recent votes</span>
      </div>
    </Link>
  )
}
