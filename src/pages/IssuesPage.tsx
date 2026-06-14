import { Link } from 'react-router-dom'
import { Container, PageHeader } from '@/components/ui/Container'
import { IssueThemeCard } from '@/components/cards/IssueThemeCard'
import { ParliamentSignalCard } from '@/components/signals/ParliamentSignalCard'
import { Icon } from '@/components/ui/Icon'
import { themes, issues, rankedSignals } from '@/data'

export function IssuesPage() {
  const signals = rankedSignals()
  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Issues & themes"
        title="Track the issues you care about"
        description="Ten themes, the decisions behind them, and the process signals flagged across Parliament."
      />

      <section className="mb-section-gap">
        <h2 className="font-headline-md text-headline-md mb-4">Themes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {themes.map((t) => (
            <IssueThemeCard key={t.id} theme={t} />
          ))}
        </div>
      </section>

      <section className="mb-section-gap">
        <h2 className="font-headline-md text-headline-md mb-4">Tracked decision points</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {issues.map((i) => (
            <Link
              key={i.id}
              to={`/issues/${i.id}`}
              className="group block bg-white rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all p-6"
            >
              <h3 className="font-headline-md text-lg group-hover:text-primary transition-colors">{i.title}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{i.plainLanguageQuestion}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-primary font-label-bold text-label-sm">
                Explore <Icon name="arrow_forward" className="text-[16px]" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-headline-md text-headline-md mb-4">All Parliament Signals</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
          {signals.map((s) => (
            <ParliamentSignalCard key={s.id} signal={s} />
          ))}
        </div>
      </section>
    </Container>
  )
}
