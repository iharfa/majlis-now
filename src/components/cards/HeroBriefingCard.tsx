import { Link } from 'react-router-dom'
import type { Bill, ParliamentSignal } from '@/types'
import { themeById, votesForBill } from '@/data'
import { SEVERITY_STYLES, SIGNAL_META } from '@/utils/signals'
import { Icon } from '@/components/ui/Icon'
import { SeverityBadge } from '@/components/ui/SignalBadge'
import { SourceLink } from '@/components/ui/SourceLink'
import { cn } from '@/utils/cn'

/** The dominant homepage card: the single most important current development. */
export function HeroBriefingCard({ bill, signal }: { bill: Bill; signal: ParliamentSignal }) {
  const theme = themeById(bill.themeId)
  const meta = SIGNAL_META[signal.type]
  const sev = SEVERITY_STYLES[signal.severity]
  const relatedVote = votesForBill(bill.id)[0]

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30">
      <div className="grid grid-cols-1 lg:grid-cols-5">
        <div className="lg:col-span-3 p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge severity={signal.severity} />
              <span className={cn('inline-flex items-center gap-1 text-label-sm font-label-bold', sev.text)}>
                <Icon name={meta.icon} className="text-[16px]" /> {meta.label}
              </span>
            </div>
            <h3 className="font-display-lg text-headline-lg leading-tight text-on-surface">{signal.title}</h3>
            <p className="font-body-lg text-on-surface-variant">{signal.summary}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Field label="Why it matters" value={signal.whyItMatters ?? bill.whyItMatters} />
              <Field label="Current stage" value={bill.currentStage} />
              <Field label="Theme" value={theme?.name ?? '—'} />
              <Field label="Evidence" value={signal.evidenceMetric} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/bills/${bill.id}`}
              className="bg-primary text-on-primary font-label-bold text-label-bold px-6 py-3 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
            >
              View timeline <Icon name="timeline" className="text-[18px]" />
            </Link>
            {relatedVote && (
              <Link
                to={`/votes/${relatedVote.id}`}
                className="border-2 border-primary text-primary font-label-bold text-label-bold px-6 py-3 rounded-xl hover:bg-primary-fixed transition-colors flex items-center gap-2"
              >
                See how MPs voted <Icon name="how_to_vote" className="text-[18px]" />
              </Link>
            )}
            <SourceLink source={signal.sources[0]} className="ml-1" />
          </div>
        </div>

        <div className="lg:col-span-2 relative min-h-[220px] bg-primary-fixed flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
          <Icon name={theme?.icon ?? 'account_balance'} className="text-primary/40 text-[140px]" />
          <div className="absolute bottom-6 left-6 right-6 p-5 rounded-xl glass-card">
            <div className="flex justify-between items-center mb-2">
              <span className="font-label-bold text-label-sm text-primary uppercase">Bill {bill.ref}</span>
              <span className="font-label-bold text-label-sm text-primary">{bill.status}</span>
            </div>
            <p className="text-sm text-on-surface-variant line-clamp-2">{bill.summary}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-3">
      <p className="text-label-sm font-label-bold uppercase text-outline">{label}</p>
      <p className="text-sm text-on-surface font-label-bold mt-0.5">{value}</p>
    </div>
  )
}
