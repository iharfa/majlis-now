import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { HeroBriefingCard } from '@/components/cards/HeroBriefingCard'
import { InsightCard } from '@/components/cards/InsightCard'
import { RecentActivityCard } from '@/components/cards/RecentActivityCard'
import { ParliamentSignalCard } from '@/components/signals/ParliamentSignalCard'
import { IssueThemeCard } from '@/components/cards/IssueThemeCard'
import { ActivityItem } from '@/components/cards/ActivityItem'
import { FindYourMP } from '@/components/mps/FindYourMP'
import { Icon } from '@/components/ui/Icon'
import { billById, signalById, rankedSignals, activity, themes } from '@/data'

export function HomePage() {
  const heroBill = billById('bill-public-finance')!
  const heroSignal = signalById('sig-finance-fast')!
  const insights = rankedSignals().slice(0, 5)
  const signalsGrid = rankedSignals().slice(0, 4)
  const topThemes = themes.slice(0, 4)

  return (
    <Container className="py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Main column */}
      <div className="md:col-span-8 space-y-section-gap">
        {/* Hero */}
        <section className="space-y-stack-gap">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">What Parliament is doing now</h2>
            <span className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full shrink-0">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse-dot" />
              <span className="font-label-bold text-label-sm">IN SESSION</span>
            </span>
          </div>
          <HeroBriefingCard bill={heroBill} signal={heroSignal} />
        </section>

        {/* Key things to know */}
        <section className="space-y-stack-gap">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Key things to know right now</h2>
            <Link to="/issues" className="text-primary font-label-bold text-label-sm hover:underline">
              All signals
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
            {insights.map((s) => (
              <InsightCard key={s.id} signal={s} />
            ))}
          </div>
        </section>

        {/* Recent activity (what / why / changed) */}
        <section className="space-y-stack-gap">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Latest movements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <RecentActivityCard
              icon="how_to_vote"
              iconBg="bg-primary"
              kicker="Latest vote"
              to="/votes/vote-public-finance"
              whatHappened="Public Finance amendment passed 54–22"
              whyCare="Changes who approves new national debt."
              whatChanged="Sub-$100M loans now go to committee, not the full chamber."
            />
            <RecentActivityCard
              icon="trending_up"
              iconBg="bg-secondary"
              kicker="Latest bill movement"
              to="/bills/bill-online-speech"
              whatHappened="Late amendment added to online speech bill"
              whyCare="Late changes get less scrutiny."
              whatChanged="A new 'harmful content' takedown clause was introduced."
            />
            <RecentActivityCard
              icon="campaign"
              iconBg="bg-tertiary"
              kicker="Latest committee action"
              to="/committees/cmt-129"
              whatHappened="Environment Committee closed waste-policy hearing"
              whyCare="Affects waste management decisions."
              whatChanged="Report now pending — flagged as quiet movement."
            />
          </div>
        </section>

        {/* Parliament Signals */}
        <section className="space-y-stack-gap">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Parliament Signals</h2>
            <span className="text-label-sm text-outline">Evidence-based process flags</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {signalsGrid.map((s) => (
              <ParliamentSignalCard key={s.id} signal={s} />
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <aside className="md:col-span-4 space-y-section-gap">
        <FindYourMP />

        <section className="space-y-stack-gap">
          <h3 className="font-headline-md text-headline-md text-on-surface px-1">Activity feed</h3>
          <div className="space-y-3">
            {activity.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
            <Link
              to="/votes"
              className="w-full py-3 text-primary font-label-bold text-label-bold text-center border-2 border-dashed border-primary/20 rounded-xl hover:bg-primary-fixed transition-colors flex items-center justify-center gap-2"
            >
              View all activity <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
          </div>
        </section>

        <section className="space-y-stack-gap">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-headline-md text-headline-md text-on-surface">Issue themes</h3>
            <Link to="/issues" className="text-primary font-label-bold text-label-sm hover:underline">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-gutter">
            {topThemes.map((t) => (
              <IssueThemeCard key={t.id} theme={t} />
            ))}
          </div>
        </section>
      </aside>
    </Container>
  )
}
