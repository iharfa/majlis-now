import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'

interface Props {
  icon: string
  iconBg: string
  kicker: string
  to: string
  whatHappened: string
  whyCare: string
  whatChanged: string
}

/** Secondary homepage card answering: what happened / why care / what changed. */
export function RecentActivityCard({ icon, iconBg, kicker, to, whatHappened, whyCare, whatChanged }: Props) {
  return (
    <Link
      to={to}
      className="group block bg-white rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all p-6 h-full"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${iconBg}`}>
          <Icon name={icon} />
        </span>
        <span className="text-label-sm font-label-bold uppercase tracking-wider text-on-surface-variant">{kicker}</span>
      </div>
      <h4 className="font-headline-md text-lg text-on-surface group-hover:text-primary transition-colors">
        {whatHappened}
      </h4>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-label-sm font-label-bold uppercase text-outline">Why care</dt>
          <dd className="text-on-surface-variant">{whyCare}</dd>
        </div>
        <div>
          <dt className="text-label-sm font-label-bold uppercase text-outline">What changed</dt>
          <dd className="text-on-surface-variant">{whatChanged}</dd>
        </div>
      </dl>
    </Link>
  )
}
