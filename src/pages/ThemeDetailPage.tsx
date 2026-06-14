import { Link, useParams } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { BillCard } from '@/components/bills/BillCard'
import { ParliamentSignalCard } from '@/components/signals/ParliamentSignalCard'
import { Icon } from '@/components/ui/Icon'
import { NotFoundPage } from './NotFoundPage'
import {
  themeById,
  billsForTheme,
  votesForTheme,
  signalsForTheme,
  issuesForTheme,
} from '@/data'
import { accentClasses } from '@/utils/accents'
import { formatDate } from '@/utils/format'

export function ThemeDetailPage() {
  const { id } = useParams()
  const theme = id ? themeById(id) : undefined
  if (!theme) return <NotFoundPage />

  const bills = billsForTheme(theme.id)
  const votes = votesForTheme(theme.id)
  const signals = signalsForTheme(theme.id)
  const issues = issuesForTheme(theme.id)

  return (
    <Container className="py-8">
      <div className="flex items-center gap-2 text-on-surface-variant text-label-sm mb-3">
        <Link to="/issues" className="hover:text-primary">Issues</Link>
        <Icon name="chevron_right" className="text-sm" />
        <span>{theme.name}</span>
      </div>

      <div className="flex items-start gap-4 mb-8">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${accentClasses(theme.accent)}`}>
          <Icon name={theme.icon} className="text-3xl" />
        </div>
        <div>
          <h1 className="font-headline-lg text-headline-lg">{theme.name}</h1>
          <p className="text-on-surface-variant font-body-lg mt-1 max-w-2xl">{theme.description}</p>
          <p className="text-sm text-on-surface-variant mt-2">
            <span className="font-label-bold text-on-surface">Public impact:</span> {theme.publicImpact}
          </p>
        </div>
      </div>

      {signals.length > 0 && (
        <section className="mb-section-gap">
          <h2 className="font-headline-md text-headline-md mb-4">Signals in this theme</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {signals.map((s) => (
              <ParliamentSignalCard key={s.id} signal={s} />
            ))}
          </div>
        </section>
      )}

      {issues.length > 0 && (
        <section className="mb-section-gap">
          <h2 className="font-headline-md text-headline-md mb-4">Decision points</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {issues.map((i) => (
              <Link key={i.id} to={`/issues/${i.id}`} className="block bg-white rounded-2xl border border-outline-variant/30 p-6 hover:shadow-md transition-all">
                <h3 className="font-headline-md text-lg">{i.title}</h3>
                <p className="text-sm text-on-surface-variant mt-1">{i.plainLanguageQuestion}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {bills.length > 0 && (
        <section className="mb-section-gap">
          <h2 className="font-headline-md text-headline-md mb-4">Related bills</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {bills.map((b) => (
              <BillCard key={b.id} bill={b} />
            ))}
          </div>
        </section>
      )}

      {votes.length > 0 && (
        <section>
          <h2 className="font-headline-md text-headline-md mb-4">Related votes</h2>
          <div className="space-y-3">
            {votes.map((v) => (
              <Link
                key={v.id}
                to={`/votes/${v.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-outline-variant/30 p-5 hover:shadow-md transition-all"
              >
                <div>
                  <p className="font-label-bold text-on-surface">{v.title}</p>
                  <p className="text-label-sm text-on-surface-variant">{v.result} · {formatDate(v.date)}</p>
                </div>
                <Icon name="arrow_forward" className="text-primary" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </Container>
  )
}
