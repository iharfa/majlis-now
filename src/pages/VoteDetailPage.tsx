import { Link, useParams } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { VoteSummaryTiles } from '@/components/votes/VoteSummaryTiles'
import { PartyAlignmentCard } from '@/components/votes/PartyAlignmentCard'
import { MPVoteTable } from '@/components/votes/MPVoteTable'
import { DataMeta } from '@/components/ui/DataMeta'
import { Icon } from '@/components/ui/Icon'
import { NotFoundPage } from './NotFoundPage'
import { voteById, themeById, billById } from '@/data'
import { formatDate } from '@/utils/format'

export function VoteDetailPage() {
  const { id } = useParams()
  const vote = id ? voteById(id) : undefined
  if (!vote) return <NotFoundPage />

  const theme = vote.themeId ? themeById(vote.themeId) : undefined
  const bill = vote.billId ? billById(vote.billId) : undefined
  const acceptance = vote.voteType === 'acceptance'

  return (
    <Container className="py-8 animate-slide">
      <div className="flex items-center gap-2 text-on-surface-variant text-label-sm mb-2">
        <Link to="/votes" className="hover:text-primary">Votes</Link>
        <Icon name="chevron_right" className="text-sm" />
        <span>{formatDate(vote.date)}</span>
      </div>
      <h1 className="font-display-lg text-headline-lg text-on-surface max-w-3xl">{vote.title}</h1>
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        <span
          className={`px-3 py-1 rounded-full text-label-sm font-label-bold ${
            vote.result === 'Passed' ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'
          }`}
        >
          {vote.result.toUpperCase()}
        </span>
        <span className="px-3 py-1 rounded-full text-label-sm font-label-bold bg-surface-container text-on-surface-variant">
          {acceptance ? 'Acceptance vote' : 'Final vote'}
        </span>
        <span className="text-on-surface-variant text-label-sm flex items-center gap-1">
          <Icon name="calendar_month" className="text-sm" /> {formatDate(vote.date)}
        </span>
        {theme && <span className="text-label-sm text-on-surface-variant">{theme.name}</span>}
      </div>

      <section className="mt-8 mb-section-gap">
        <VoteSummaryTiles vote={vote} />
      </section>

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
          {bill && (
            <Link to={`/bills/${bill.id}`} className="bg-white border border-outline-variant p-6 rounded-2xl hover:shadow-md transition-all">
              <h3 className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant mb-2">The bill</h3>
              <p className="font-headline-md text-lg text-on-surface">{bill.title}</p>
              <p className="text-sm text-on-surface-variant mt-2 line-clamp-3">{bill.summary}</p>
              <span className="inline-flex items-center gap-1 text-primary font-label-bold text-label-sm mt-3">
                Read what the bill does <Icon name="arrow_forward" className="text-[16px]" />
              </span>
            </Link>
          )}
          <div className="bg-surface-container-low rounded-2xl p-6">
            <p className="text-label-sm font-label-bold uppercase text-outline mb-1">
              {acceptance ? 'What an acceptance vote is' : 'What a final vote is'}
            </p>
            <p className="text-sm text-on-surface-variant">
              {acceptance
                ? 'After the first debate, MPs vote on whether to take the bill up at all. If accepted it goes to a committee for detailed review before a final vote. Rejection ends the bill.'
                : 'After committee review and the third reading, MPs vote on the final text. If passed, the bill goes to the President to be ratified into law.'}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-section-gap">
        <h2 className="font-headline-md text-headline-md mb-6">Party alignment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {vote.partyBreakdown.map((b) => (
            <PartyAlignmentCard key={b.partyId} breakdown={b} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h2 className="font-headline-md text-headline-md">MP breakdown</h2>
          <span className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-sm font-label-bold">
            <Icon name="verified" className="text-[14px]" /> Official record
          </span>
        </div>
        <p className="text-on-surface-variant mb-4 max-w-3xl">
          Member-by-member result from the official vote-record PDF. Search by name or constituency, or filter by how
          they voted. “Absent” combines members recorded as <em>not present</em> and those <em>present but not voting</em>;
          the exact wording is shown under each result. The presiding Speaker normally does not vote, except where eligible (for example constitutional amendments).
        </p>
        <MPVoteTable vote={vote} />
      </section>

      <DataMeta sources={vote.sources} confidence="High" reportContext={`Vote: ${vote.title}`} className="mt-8" />
    </Container>
  )
}
