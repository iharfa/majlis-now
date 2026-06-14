import { Link, useParams } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { DataMeta } from '@/components/ui/DataMeta'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { NotFoundPage } from './NotFoundPage'
import { issueById, themeById, billById, voteById } from '@/data'
import { formatDate, pct } from '@/utils/format'

export function IssueDetailPage() {
  const { id } = useParams()
  const issue = id ? issueById(id) : undefined
  if (!issue) return <NotFoundPage />
  const theme = themeById(issue.themeId)

  return (
    <Container className="py-8 max-w-4xl">
      <div className="flex items-center gap-2 text-on-surface-variant text-label-sm mb-3">
        <Link to="/issues" className="hover:text-primary">Issues</Link>
        <Icon name="chevron_right" className="text-sm" />
        {theme && (
          <Link to={`/issues/theme/${theme.id}`} className="hover:text-primary">
            {theme.name}
          </Link>
        )}
      </div>

      <h1 className="font-headline-lg text-headline-lg">{issue.title}</h1>

      <section className="mt-6 bg-primary-fixed rounded-2xl p-8">
        <p className="text-label-sm font-label-bold uppercase tracking-widest text-on-primary-fixed-variant mb-2">
          The question
        </p>
        <h2 className="font-headline-md text-on-primary-fixed">{issue.plainLanguageQuestion}</h2>
        <p className="mt-4 text-on-primary-fixed-variant font-body-lg leading-relaxed">{issue.whyItMatters}</p>
      </section>

      <section className="mt-8">
        <h2 className="font-headline-md text-headline-md mb-4">Decision points</h2>
        <div className="space-y-4">
          {issue.decisionPoints.map((dp) => (
            <div key={dp.id} className="bg-white rounded-2xl border border-outline-variant/30 p-6">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-label-bold text-on-surface">{dp.question}</h3>
                <ConfidenceBadge level={dp.confidence} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {dp.classificationOptions.map((o) => (
                  <span key={o} className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-label-sm font-label-bold">
                    {o}
                  </span>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {dp.relatedVoteIds.map((vid) => {
                  const v = voteById(vid)
                  if (!v) return null
                  const total = v.yesCount + v.noCount + v.abstainCount + v.absentCount
                  return (
                    <Link
                      key={vid}
                      to={`/votes/${vid}`}
                      className="flex items-center justify-between bg-surface-container-low rounded-xl p-4 hover:bg-surface-variant transition-colors"
                    >
                      <div>
                        <p className="font-label-bold text-on-surface">{v.title}</p>
                        <p className="text-label-sm text-on-surface-variant">
                          {v.result} · {pct(v.yesCount, total)}% Yes · {formatDate(v.date)}
                        </p>
                      </div>
                      <Icon name="arrow_forward" className="text-primary" />
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {issue.relatedBillIds.length > 0 && (
        <section className="mt-8">
          <h2 className="font-headline-md text-headline-md mb-4">Related bills</h2>
          <div className="space-y-3">
            {issue.relatedBillIds.map((bid) => {
              const b = billById(bid)
              if (!b) return null
              return (
                <Link
                  key={bid}
                  to={`/bills/${bid}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-outline-variant/30 p-5 hover:shadow-md transition-all"
                >
                  <div>
                    <p className="font-label-bold text-on-surface">{b.title}</p>
                    <p className="text-label-sm text-on-surface-variant">{b.ref} · {b.status}</p>
                  </div>
                  <Icon name="arrow_forward" className="text-primary" />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <DataMeta sources={issue.sources} reportContext={`Issue: ${issue.title}`} className="mt-8" />
    </Container>
  )
}
