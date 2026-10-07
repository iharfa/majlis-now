import { Link, useParams } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { BillTimeline } from '@/components/bills/BillTimeline'
import { StatusPill } from '@/components/ui/StatusPill'
import { Icon } from '@/components/ui/Icon'
import { DataMeta } from '@/components/ui/DataMeta'
import { AiBadge } from '@/components/ui/AiBadge'
import { NotFoundPage } from './NotFoundPage'
import { billById, themeById, committeeById, votesForBill, sittingsForBill, mpById, constituencyById } from '@/data'
import { Avatar } from '@/components/ui/Avatar'
import { PartyTag } from '@/components/ui/PartyTag'
import { daysSince, formatDate } from '@/utils/format'

export function BillDetailPage() {
  const { id } = useParams()
  const bill = id ? billById(id) : undefined
  if (!bill) return <NotFoundPage />

  const theme = themeById(bill.themeId)
  const sponsor = bill.sponsorMpId ? mpById(bill.sponsorMpId) : undefined
  const committee = bill.committeeId ? committeeById(bill.committeeId) : undefined
  const relatedVotes = votesForBill(bill.id)
  const sittings = sittingsForBill(bill.id)
  const officialSource = bill.sources.find((s) => s.kind === 'official')
  const ai = bill.aiSummary
  const closed = bill.status === 'Passed' || bill.status === 'Rejected' || bill.status === 'Withdrawn'

  const downloadCsv = () => {
    const rows = [
      ['stage', 'title', 'date', 'state'],
      ...bill.timeline.map((e) => [e.stage, e.title, e.date ?? '', e.state]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${bill.id}-timeline.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Container className="py-8">
      <div className="flex items-center gap-2 text-on-surface-variant text-label-sm mb-3">
        <Link to="/bills" className="hover:text-primary">Bills</Link>
        <Icon name="chevron_right" className="text-sm" />
        <span>{bill.ref}</span>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <StatusPill status={bill.status} />
          {theme && (
            <Link to={`/issues/theme/${theme.id}`} className="text-label-sm font-label-bold text-on-surface-variant inline-flex items-center gap-1 hover:text-primary">
              <Icon name={theme.icon} className="text-[16px]" /> {theme.name}
            </Link>
          )}
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface max-w-3xl">{bill.title}</h1>
        {sponsor ? (
          <Link to={`/mps/${sponsor.id}`} className="mt-3 inline-flex items-center gap-3 bg-white rounded-2xl border border-outline-variant/30 px-4 py-2 hover:shadow-md transition-all">
            <Avatar mp={sponsor} size="md" />
            <span className="min-w-0">
              <span className="block text-label-sm text-outline">Introduced by</span>
              <span className="flex items-center gap-2 text-sm text-on-surface font-label-bold">
                {sponsor.name} <PartyTag partyId={sponsor.partyId} />
                <span className="text-label-sm text-outline font-normal">{constituencyById(sponsor.constituencyId)?.name}</span>
              </span>
            </span>
          </Link>
        ) : bill.sponsor ? (
          <p className="mt-3 text-on-surface-variant text-label-sm">Introduced by {bill.sponsor}</p>
        ) : null}
        {ai?.titleDv && <p className="text-on-surface-variant font-body-lg mt-1" lang="dv" dir="rtl">{ai.titleDv}</p>}
        <p className="text-on-surface-variant font-body-lg mt-2 max-w-2xl">{bill.officialSummary}</p>
        {officialSource && (
          <a href={officialSource.url} target="_blank" rel="noreferrer noopener" className="mt-3 inline-flex items-center gap-1.5 text-label-bold font-label-bold text-primary hover:underline">
            <Icon name="open_in_new" className="text-[16px]" /> View on People’s Majlis
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
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
                <p className="font-headline-md text-on-surface">{closed ? '—' : daysSince(bill.lastActionDate)}</p>
                <p className="text-[10px] font-label-bold uppercase text-outline">{closed ? `Closed ${formatDate(bill.lastActionDate)}` : 'Days since last action'}</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="md:col-span-8 lg:col-span-9 space-y-gutter">
          <section className="bg-primary-fixed rounded-2xl p-8 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <h2 className="font-headline-md text-on-primary-fixed">What this bill does</h2>
                {ai && <AiBadge confidence={ai.confidence} model={ai.model} generatedAt={ai.generatedAt} />}
              </div>
              <p className="font-body-lg text-on-primary-fixed-variant leading-relaxed max-w-2xl">{bill.summary}</p>
              <h3 className="font-label-bold text-label-bold uppercase tracking-widest text-on-primary-fixed mt-6 mb-2">Why it matters</h3>
              <p className="font-body-lg text-on-primary-fixed-variant leading-relaxed max-w-2xl">{bill.whyItMatters}</p>
            </div>
            <Icon name={theme?.icon ?? 'account_balance'} className="absolute -right-8 -bottom-8 text-primary/10 text-[180px]" />
          </section>

          {ai && (
            <section className="bg-white rounded-2xl border border-outline-variant/30 p-6">
              <h2 className="font-headline-md text-headline-md mb-4">Key provisions</h2>
              <ul className="space-y-3">
                {ai.keyProvisions.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-on-surface">
                    <Icon name="task_alt" className="text-primary mt-0.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-label-sm font-label-bold uppercase text-outline">Who is affected</dt>
                  <dd className="text-on-surface-variant mt-1">{ai.whoIsAffected}</dd>
                </div>
                {ai.statedReasons && (
                  <div>
                    <dt className="text-label-sm font-label-bold uppercase text-outline">The bill’s stated reasons</dt>
                    <dd className="text-on-surface-variant mt-1">{ai.statedReasons}</dd>
                  </div>
                )}
              </dl>
              <p className="text-label-sm text-outline mt-4">
                Translated from the “{ai.sourceDoc}” document ({ai.pagesRead} of {ai.pagesTotal} pages read). Check the
                official PDF below for anything that matters.
              </p>
            </section>
          )}

          <section className="bg-white rounded-2xl border border-outline-variant/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-md text-headline-md flex items-center gap-2">
                <Icon name="description" className="text-primary" /> Official documents
              </h2>
              <button onClick={downloadCsv} className="inline-flex items-center gap-1 text-label-sm font-label-bold text-primary hover:underline">
                <Icon name="download" className="text-[16px]" /> Timeline CSV
              </button>
            </div>
            <ul className="divide-y divide-outline-variant/40">
              {bill.documents.map((d) => (
                <li key={d.id} className="py-3">
                  <a href={d.url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-3 text-on-surface hover:text-primary">
                    <Icon name="picture_as_pdf" className="text-on-surface-variant shrink-0" />
                    <span className="font-label-bold">{d.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {relatedVotes.length > 0 && (
            <section className="space-y-stack-gap">
              <h2 className="font-headline-md text-headline-md">Recorded votes</h2>
              {relatedVotes.map((v) => (
                <Link key={v.id} to={`/votes/${v.id}`} className="flex items-center justify-between bg-white rounded-xl border border-outline-variant/30 p-5 hover:shadow-md transition-all">
                  <div>
                    <p className="font-label-bold text-on-surface">{v.voteType === 'acceptance' ? 'Vote to accept the bill' : 'Final vote'}</p>
                    <p className="text-label-sm text-on-surface-variant">
                      {v.result} · {formatDate(v.date)} · {v.yesCount} yes / {v.noCount} no / {v.absentCount} absent
                    </p>
                  </div>
                  <Icon name="arrow_forward" className="text-primary" />
                </Link>
              ))}
            </section>
          )}

          {sittings.length > 0 && (
            <section className="bg-white rounded-2xl border border-outline-variant/30 p-6">
              <h2 className="font-headline-md text-headline-md mb-3">On the agenda at</h2>
              <ul className="divide-y divide-outline-variant/40">
                {sittings.map((s) => (
                  <li key={s.id} className="py-2">
                    <Link to={`/sittings/${s.id}`} className="flex items-center justify-between text-on-surface hover:text-primary">
                      <span className="font-label-bold text-sm">{s.title}</span>
                      <span className="text-label-sm text-outline">{formatDate(s.date)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {committee && (
            <Link to={`/committees/${committee.id}`} className="flex items-center justify-between bg-surface-container-low rounded-xl p-5 hover:bg-surface-variant transition-colors">
              <span className="font-label-bold text-on-surface">Reviewed by {committee.name}</span>
              <Icon name="arrow_forward" className="text-primary" />
            </Link>
          )}

          <DataMeta sources={bill.sources} confidence="High" reportContext={`Bill: ${bill.title}`} />
        </div>
      </div>
    </Container>
  )
}
