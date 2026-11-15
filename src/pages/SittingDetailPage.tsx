import { Link, useParams } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { DataMeta } from '@/components/ui/DataMeta'
import { AiBadge } from '@/components/ui/AiBadge'
import { NotFoundPage } from './NotFoundPage'
import { sittingById, billById } from '@/data'
import { formatDate } from '@/utils/format'

const KIND_ICON: Record<string, string> = {
  procedural: 'rule', bill: 'description', resolution: 'gavel', report: 'summarize',
  vote: 'how_to_vote', question: 'help', other: 'more_horiz',
}

export function SittingDetailPage() {
  const { id } = useParams()
  const s = id ? sittingById(id) : undefined
  if (!s) return <NotFoundPage />
  const bills = s.billIds.map(billById).filter((b): b is NonNullable<typeof b> => !!b)

  return (
    <Container className="py-8">
      <div className="flex items-center gap-2 text-on-surface-variant text-label-sm mb-3">
        <Link to="/sittings" className="hover:text-primary">Sittings</Link>
        <Icon name="chevron_right" className="text-sm" />
        <span>{formatDate(s.date)}</span>
      </div>
      <h1 className="font-headline-lg text-headline-lg text-on-surface">{s.title}</h1>
      <p className="text-on-surface-variant mt-1">
        {formatDate(s.date)} · Agenda {s.agendaNo || '—'}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mt-8">
        <div className="lg:col-span-2 space-y-gutter">
          {s.agenda ? (
            <>
              <section className="bg-primary-fixed rounded-2xl p-8">
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                  <h2 className="font-headline-md text-on-primary-fixed">In short</h2>
                  <AiBadge confidence={s.agenda.confidence} model={s.agenda.model} generatedAt={s.agenda.generatedAt} />
                </div>
                <p className="font-body-lg text-on-primary-fixed-variant leading-relaxed">{s.agenda.summary}</p>
              </section>
              <section className="bg-white rounded-2xl border border-outline-variant/30 p-6">
                <h2 className="font-headline-md text-headline-md mb-4">Agenda</h2>
                <ol className="divide-y divide-outline-variant/40">
                  {s.agenda.items.map((item) => {
                    const bill = item.workId ? billById(`bill-${item.workId}`) : undefined
                    return (
                      <li key={item.n} className="py-3 flex items-start gap-3">
                        <span className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
                          <Icon name={KIND_ICON[item.kind] ?? 'more_horiz'} className="text-[18px]" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-on-surface">
                            <span className="text-outline text-label-sm mr-2">{item.n}.</span>
                            {item.text}
                          </p>
                          {bill && (
                            <Link to={`/bills/${bill.id}`} className="text-primary text-label-sm font-label-bold hover:underline inline-flex items-center gap-1 mt-1">
                              <Icon name="description" className="text-[14px]" /> {bill.title}
                            </Link>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </section>
            </>
          ) : (
            <section className="bg-surface-container-low rounded-2xl p-6 text-on-surface-variant">
              The agenda for this sitting has not been translated yet. The official Dhivehi PDF is linked on the right.
            </section>
          )}
          {s.minutes && (
            <>
              <section className="bg-white rounded-2xl border border-outline-variant/30 p-6">
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                  <h2 className="font-headline-md text-headline-md">What happened (from the minutes)</h2>
                  <AiBadge confidence={s.minutes.confidence} model={s.minutes.model} generatedAt={s.minutes.generatedAt} />
                </div>
                <p className="text-on-surface leading-relaxed">{s.minutes.summary}</p>
                <p className="text-label-sm text-outline mt-3">
                  Presiding: {s.minutes.presiding || '—'}
                  {s.minutes.attendance.present != null ? ` · ${s.minutes.attendance.present} members present at roll call` : ''}
                  {s.minutes.attendance.onLeave != null ? ` · ${s.minutes.attendance.onLeave} on leave` : ''}
                  {s.minutes.attendance.officialTravel != null ? ` · ${s.minutes.attendance.officialTravel} on official travel` : ''}
                </p>
                {s.minutes.decisions.length > 0 && (
                  <>
                    <h3 className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant mt-5 mb-2">Decisions</h3>
                    <ul className="space-y-2">
                      {s.minutes.decisions.map((d) => (
                        <li key={d} className="flex items-start gap-2 text-on-surface">
                          <Icon name="task_alt" className="text-primary mt-0.5 shrink-0 text-[18px]" /> <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {s.minutes.votes.length > 0 && (
                  <>
                    <h3 className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant mt-5 mb-2">Votes taken</h3>
                    <ul className="space-y-1 text-sm text-on-surface">
                      {s.minutes.votes.map((v) => (
                        <li key={v.what}>
                          {v.what}
                          {v.yes != null && <span className="text-on-surface-variant"> — {v.yes} yes / {v.no ?? 0} no{v.abstain ? ` / ${v.abstain} abstain` : ''}</span>}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
              {s.minutes.speakers.length > 0 && (
                <section className="bg-white rounded-2xl border border-outline-variant/30 p-6">
                  <h2 className="font-headline-md text-headline-md mb-1">Who spoke</h2>
                  <p className="text-label-sm text-outline mb-4">{s.minutes.speakers.length} members took the floor. Positions are Claude's one-line reading of each member's remarks in the minutes.</p>
                  <ul className="divide-y divide-outline-variant/40">
                    {[...s.minutes.speakers].sort((a, b) => b.turns - a.turns).map((sp) => (
                      <li key={`${sp.name}-${sp.constituency}`} className="py-3">
                        <div className="flex items-center justify-between gap-3">
                          {sp.mpId ? (
                            <Link to={`/mps/${sp.mpId}`} className="font-label-bold text-on-surface hover:text-primary">{sp.name}</Link>
                          ) : (
                            <span className="font-label-bold text-on-surface">{sp.name}</span>
                          )}
                          <span className="text-label-sm text-outline shrink-0">{sp.constituency} · {sp.turns} turn{sp.turns === 1 ? '' : 's'}</span>
                        </div>
                        {sp.positions.length > 0 && (
                          <ul className="mt-1 text-sm text-on-surface-variant list-disc pl-5 space-y-0.5">
                            {sp.positions.map((p) => <li key={p}>{p}</li>)}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
          <DataMeta sources={s.sources} confidence="High" reportContext={`Sitting: ${s.title}`} />
        </div>

        <aside className="space-y-gutter">
          {bills.length > 0 && (
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-6">
              <h3 className="font-headline-md text-headline-md mb-3">Bills at this sitting</h3>
              <ul className="space-y-2">
                {bills.map((b) => (
                  <li key={b.id}>
                    <Link to={`/bills/${b.id}`} className="text-on-surface hover:text-primary font-label-bold text-sm">
                      {b.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {s.minutesPdf && (
            <a
              href={s.minutesPdf}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center justify-between bg-surface-container-low rounded-xl p-5 hover:bg-surface-variant transition-colors"
            >
              <span className="font-label-bold text-on-surface flex items-center gap-2">
                <Icon name="picture_as_pdf" /> Official minutes (Dhivehi PDF)
              </span>
              <Icon name="open_in_new" className="text-primary" />
            </a>
          )}
          {s.agendaPdf && (
            <a
              href={s.agendaPdf}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center justify-between bg-surface-container-low rounded-xl p-5 hover:bg-surface-variant transition-colors"
            >
              <span className="font-label-bold text-on-surface flex items-center gap-2">
                <Icon name="picture_as_pdf" /> Official agenda (Dhivehi PDF)
              </span>
              <Icon name="open_in_new" className="text-primary" />
            </a>
          )}
        </aside>
      </div>
    </Container>
  )
}
