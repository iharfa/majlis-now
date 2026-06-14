import { Link } from 'react-router-dom'
import { Container, PageHeader } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { votes, themeById } from '@/data'
import { formatDate, pct } from '@/utils/format'

export function VotesPage() {
  const sorted = [...votes].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Key votes"
        title="How Parliament decided"
        description="Every recorded vote, what it decided in plain language, and how the parties split."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {sorted.map((v) => {
          const theme = v.themeId ? themeById(v.themeId) : undefined
          const total = v.yesCount + v.noCount + v.abstainCount + v.absentCount
          return (
            <Link
              key={v.id}
              to={`/votes/${v.id}`}
              className="group block bg-white rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all p-6"
            >
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-label-sm font-label-bold ${
                    v.result === 'Passed'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-error-container text-on-error-container'
                  }`}
                >
                  {v.result}
                </span>
                {v.provenance === 'official-rollcall' && (
                  <span className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-label-sm font-label-bold">
                    <Icon name="verified" className="text-[13px]" /> Official
                  </span>
                )}
                {theme && <span className="text-label-sm text-on-surface-variant">{theme.name}</span>}
                <span className="text-label-sm text-outline ml-auto">{formatDate(v.date)}</span>
              </div>
              <h3 className="font-headline-md text-lg text-on-surface group-hover:text-primary transition-colors">
                {v.title}
              </h3>
              <p className="mt-2 text-sm text-on-surface-variant line-clamp-2">{v.whatItDecided}</p>

              <div className="mt-4 h-2 bg-surface-variant rounded-full overflow-hidden flex">
                <div className="h-full bg-secondary" style={{ width: `${pct(v.yesCount, total)}%` }} />
                <div className="h-full bg-error" style={{ width: `${pct(v.noCount, total)}%` }} />
                <div className="h-full bg-tertiary" style={{ width: `${pct(v.abstainCount, total)}%` }} />
                <div className="h-full bg-outline" style={{ width: `${pct(v.absentCount, total)}%` }} />
              </div>
              <div className="mt-3 flex items-center gap-4 text-label-sm text-on-surface-variant">
                <span className="text-secondary font-label-bold">{v.yesCount} Yes</span>
                <span className="text-error font-label-bold">{v.noCount} No</span>
                <span className="text-outline">{v.absentCount} Absent</span>
                <Icon name="arrow_forward" className="text-primary ml-auto" />
              </div>
            </Link>
          )
        })}
      </div>
    </Container>
  )
}
