import { Link, useParams } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { VoteSummaryTiles } from '@/components/votes/VoteSummaryTiles'
import { PartyAlignmentCard } from '@/components/votes/PartyAlignmentCard'
import { MPVoteTable } from '@/components/votes/MPVoteTable'
import { DataMeta } from '@/components/ui/DataMeta'
import { Icon } from '@/components/ui/Icon'
import { NotFoundPage } from './NotFoundPage'
import { voteById, themeById, billById, issueById } from '@/data'
import { formatDate } from '@/utils/format'

export function VoteDetailPage() {
  const { id } = useParams()
  const vote = id ? voteById(id) : undefined
  if (!vote) return <NotFoundPage />

  const theme = vote.themeId ? themeById(vote.themeId) : undefined
  const bill = vote.billId ? billById(vote.billId) : undefined
  const issue = vote.issueId ? issueById(vote.issueId) : undefined
  const isOfficial = vote.provenance === 'official-rollcall'

  return (
    <Container className="py-8 animate-slide">
      {/* Breadcrumb + title */}
      <div className="flex items-center gap-2 text-on-surface-variant text-label-sm mb-2">
        <Link to="/votes" className="hover:text-primary">Votes</Link>
        <Icon name="chevron_right" className="text-sm" />
        <span>{formatDate(vote.date)}</span>
      </div>
      <h1 className="font-display-lg text-headline-lg text-on-surface max-w-3xl">{vote.title}</h1>
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        <span
          className={`px-3 py-1 rounded-full text-label-sm font-label-bold ${
            vote.result === 'Passed'
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-error-container text-on-error-container'
          }`}
        >
          {vote.result.toUpperCase()}
        </span>
        <span className="text-on-surface-variant text-label-sm flex items-center gap-1">
          <Icon name="calendar_month" className="text-sm" /> {formatDate(vote.date)}
        </span>
        {bill && (
          <Link to={`/bills/${bill.id}`} className="text-primary text-label-sm font-label-bold hover:underline flex items-center gap-1">
            <Icon name="description" className="text-sm" /> Related bill: {bill.ref}
          </Link>
        )}
      </div>

      {/* Result tiles */}
      <section className="mt-8 mb-section-gap">
        <VoteSummaryTiles vote={vote} />
      </section>

      {/* What it decided + issue classification */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-section-gap">
        <div className="lg:col-span-7 bg-primary-fixed rounded-2xl p-8 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-headline-md text-on-primary-fixed mb-4">What did this vote decide?</h2>
            <p className="font-body-lg text-on-primary-fixed-variant leading-relaxed mb-6">{vote.whatItDecided}</p>
            <ul className="space-y-3">
              {vote.keyEffects.map((eff) => (
                <li key={eff} className="flex items-start gap-3 text-on-primary-fixed-variant">
                  <Icon name="task_alt" className="text-primary mt-0.5" />
                  <span>{eff}</span>
                </li>
              ))}
            </ul>
          </div>
          <Icon name="how_to_vote" className="absolute -right-10 -bottom-10 text-primary/10 text-[200px]" />
        </div>

        <div className="lg:col-span-5 flex flex-col gap-stack-gap">
          {issue ? (
            <div className="bg-white border border-outline-variant p-6 rounded-2xl">
              <h3 className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant mb-3">
                Issue classification
              </h3>
              {theme && (
                <p className="text-sm text-on-surface-variant mb-1">
                  <span className="font-label-bold text-on-surface">Theme:</span> {theme.name}
                </p>
              )}
              <p className="text-sm text-on-surface-variant mb-1">
                <span className="font-label-bold text-on-surface">Issue:</span> {issue.title}
              </p>
              <p className="text-sm text-on-surface-variant mb-4">
                <span className="font-label-bold text-on-surface">Decision point:</span> {issue.plainLanguageQuestion}
              </p>
              <Link
                to={`/issues/${issue.id}`}
                className="inline-flex items-center gap-1 text-primary font-label-bold text-label-sm hover:underline"
              >
                Explore this issue <Icon name="arrow_forward" className="text-[16px]" />
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-outline-variant p-6 rounded-2xl">
              <h3 className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant mb-3">
                Vote meaning
              </h3>
              <p className="text-sm text-on-surface-variant">
                This vote has not been mapped to a tracked issue decision point. The per-MP meaning column below
                classifies each vote (e.g. expanded/restricted rights, improved/reduced oversight).
              </p>
            </div>
          )}
          <div className="bg-surface-container-low rounded-2xl p-6">
            <p className="text-label-sm font-label-bold uppercase text-outline mb-1">Summary</p>
            <p className="text-sm text-on-surface-variant">{vote.summary}</p>
          </div>
        </div>
      </section>

      {/* Party alignment */}
      <section className="mb-section-gap">
        <h2 className="font-headline-md text-headline-md mb-6">Party alignment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {vote.partyBreakdown.map((b) => (
            <PartyAlignmentCard key={b.partyId} breakdown={b} />
          ))}
        </div>
      </section>

      {/* MP breakdown — real roll call when sourced, otherwise an honest notice */}
      <section>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h2 className="font-headline-md text-headline-md">MP breakdown</h2>
          {isOfficial && (
            <span className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-sm font-label-bold">
              <Icon name="verified" className="text-[14px]" /> Official record
            </span>
          )}
        </div>
        {isOfficial ? (
          <>
            <p className="text-on-surface-variant mb-4 max-w-3xl">
              Member-by-member result from the official vote-record PDF. Search by name or constituency, or filter by
              how they voted. “Absent” combines members recorded as <em>not present</em> or <em>not voted</em>.
            </p>
            <MPVoteTable vote={vote} />
          </>
        ) : (
          <div className="bg-tertiary-fixed/60 border border-tertiary/30 rounded-2xl p-8 flex items-start gap-4">
            <Icon name="info" className="text-tertiary text-3xl shrink-0" />
            <div>
              <h3 className="font-headline-md text-lg text-on-surface mb-1">
                Per-member breakdown not available for this sample
              </h3>
              <p className="text-on-surface-variant max-w-2xl">
                This is an illustrative sample vote. Real, member-by-member roll calls are sourced from each bill’s
                official vote-record PDF (see the Land Act vote for a real example). We never attribute a vote to a
                real, named member without that verified source.
              </p>
            </div>
          </div>
        )}
      </section>

      <DataMeta
        sources={vote.sources}
        confidence={isOfficial ? 'High' : 'Low'}
        reportContext={`Vote: ${vote.title}`}
        className="mt-8"
      />
    </Container>
  )
}
