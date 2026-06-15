import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { BillTimeline } from '@/components/bills/BillTimeline'
import { ParliamentSignalCard } from '@/components/signals/ParliamentSignalCard'
import { StatusPill } from '@/components/ui/StatusPill'
import { Icon } from '@/components/ui/Icon'
import { DataMeta } from '@/components/ui/DataMeta'
import { NotFoundPage } from './NotFoundPage'
import {
  billById,
  themeById,
  committeeById,
  signalsForBill,
  votesForBill,
} from '@/data'
import { daysSince } from '@/utils/format'
import { cn } from '@/utils/cn'

export function BillDetailPage() {
  const { id } = useParams()
  const bill = id ? billById(id) : undefined
  const [tracking, setTracking] = useState(false)
  if (!bill) return <NotFoundPage />

  const theme = themeById(bill.themeId)
  const committee = bill.committeeId ? committeeById(bill.committeeId) : undefined
  const sigs = signalsForBill(bill.id)
  const relatedVotes = votesForBill(bill.id)
  // Reference link back to the bill's page on the official Majlis site, shown
  // only when a real (official) source backs this bill.
  const officialSource = bill.sources.find((s) => s.kind === 'official')

  const downloadCsv = () => {
    const rows = [
      ['stage', 'title', 'date', 'state', 'days_since_previous'],
      ...bill.timeline.map((e) => [e.stage, e.title, e.date ?? '', e.state, String(e.daysSincePreviousStage ?? '')]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${bill.ref.replace(/\//g, '-')}-timeline.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Container className="py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-on-surface-variant text-label-sm mb-3">
        <Link to="/bills" className="hover:text-primary">Bills</Link>
        <Icon name="chevron_right" className="text-sm" />
        <span>{bill.ref}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusPill status={bill.status} />
            {theme && (
              <Link
                to={`/issues/theme/${theme.id}`}
                className="text-label-sm font-label-bold text-on-surface-variant inline-flex items-center gap-1 hover:text-primary"
              >
                <Icon name={theme.icon} className="text-[16px]" /> {theme.name}
              </Link>
            )}
            <span className="text-on-surface-variant text-label-sm">· Sponsor: {bill.sponsor}</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface max-w-3xl">{bill.title}</h1>
          <p className="text-on-surface-variant font-body-lg mt-2 max-w-2xl">{bill.summary}</p>
          {officialSource && (
            <a
              href={officialSource.url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 inline-flex items-center gap-1.5 text-label-bold font-label-bold text-primary hover:underline"
            >
              <Icon name="open_in_new" className="text-[16px]" /> View on People’s Majlis
            </a>
          )}
        </div>
        <button
          onClick={() => setTracking((t) => !t)}
          className={cn(
            'flex items-center gap-2 px-6 py-4 rounded-xl font-label-bold text-label-bold shadow-lg transition-all shrink-0',
            tracking ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary animate-pulse-shadow',
          )}
        >
          <Icon name={tracking ? 'check_circle' : 'notifications_active'} />
          {tracking ? 'Tracking' : 'Track this bill'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Sticky timeline */}
        <aside className="md:col-span-4 lg:col-span-3">
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 md:sticky md:top-24">
            <h3 className="font-label-bold text-label-bold text-on-surface-variant uppercase mb-6 flex items-center gap-2">
              <Icon name="alt_route" className="text-sm" /> Legislative journey
            </h3>
            <BillTimeline events={bill.timeline} variant="compact" />
            <div className="mt-6 pt-4 border-t border-outline-variant/40 grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="font-headline-md text-on-surface">{daysSince(bill.introducedDate)}</p>
                <p className="text-[10px] font-label-bold uppercase text-outline">Days since introduced</p>
              </div>
              <div>
                <p className="font-headline-md text-on-surface">{daysSince(bill.lastActionDate)}</p>
                <p className="text-[10px] font-label-bold uppercase text-outline">Days since last action</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="md:col-span-8 lg:col-span-9 space-y-gutter">
          {/* Why it matters */}
          <section className="bg-primary-fixed rounded-2xl p-8 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="font-headline-md text-on-primary-fixed mb-3">Why this matters</h2>
              <p className="font-body-lg text-on-primary-fixed-variant leading-relaxed max-w-2xl">{bill.whyItMatters}</p>
            </div>
            <Icon name={theme?.icon ?? 'account_balance'} className="absolute -right-8 -bottom-8 text-primary/10 text-[180px]" />
          </section>

          {/* Process signals */}
          {sigs.length > 0 && (
            <section className="space-y-stack-gap">
              <h2 className="font-headline-md text-headline-md">Process signals</h2>
              <div className="grid grid-cols-1 gap-gutter">
                {sigs.map((s) => (
                  <ParliamentSignalCard key={s.id} signal={s} />
                ))}
              </div>
            </section>
          )}

          {/* Documents */}
          <section className="bg-white rounded-2xl border border-outline-variant/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-md text-headline-md flex items-center gap-2">
                <Icon name="description" className="text-primary" /> Documents
              </h2>
              <button
                onClick={downloadCsv}
                className="inline-flex items-center gap-1 text-label-sm font-label-bold text-primary hover:underline"
              >
                <Icon name="download" className="text-[16px]" /> Download timeline CSV
              </button>
            </div>
            <ul className="divide-y divide-outline-variant/40">
              {bill.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-3">
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-3 text-on-surface hover:text-primary"
                  >
                    <Icon name="picture_as_pdf" className="text-on-surface-variant" />
                    <span className="font-label-bold">{d.label}</span>
                  </a>
                  <span className="text-label-sm text-outline">{d.kind}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Related votes */}
          {relatedVotes.length > 0 && (
            <section className="space-y-stack-gap">
              <h2 className="font-headline-md text-headline-md">Related votes</h2>
              {relatedVotes.map((v) => (
                <Link
                  key={v.id}
                  to={`/votes/${v.id}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-outline-variant/30 p-5 hover:shadow-md transition-all"
                >
                  <div>
                    <p className="font-label-bold text-on-surface">{v.title}</p>
                    <p className="text-label-sm text-on-surface-variant">
                      {v.result} · {v.yesCount} yes / {v.noCount} no / {v.absentCount} absent
                    </p>
                  </div>
                  <Icon name="arrow_forward" className="text-primary" />
                </Link>
              ))}
            </section>
          )}

          {/* Context / did you know */}
          {bill.context && (
            <section className="rounded-2xl bg-inverse-surface text-inverse-on-surface p-8">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="lightbulb" className="text-primary-fixed" />
                <h3 className="font-label-bold text-label-bold uppercase tracking-widest text-primary-fixed">
                  Did you know?
                </h3>
              </div>
              <p className="font-body-lg leading-relaxed max-w-2xl">{bill.context}</p>
            </section>
          )}

          {committee && (
            <Link
              to={`/committees/${committee.id}`}
              className="flex items-center justify-between bg-surface-container-low rounded-xl p-5 hover:bg-surface-variant transition-colors"
            >
              <span className="font-label-bold text-on-surface">Reviewed by {committee.name}</span>
              <Icon name="arrow_forward" className="text-primary" />
            </Link>
          )}

          <DataMeta sources={bill.sources} reportContext={`Bill: ${bill.title}`} />
        </div>
      </div>
    </Container>
  )
}
