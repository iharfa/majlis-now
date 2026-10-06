import { Link } from 'react-router-dom'
import { Container, PageHeader } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { sittings } from '@/data'
import { formatDate } from '@/utils/format'

export function SittingsPage() {
  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Sittings"
        title="What was on the agenda"
        description="Every sitting of the 20th Parliament since May 2024, with its agenda and a digest of the official minutes translated from Dhivehi."
      />
      <div className="space-y-3">
        {sittings.map((s, i) => (
          <div key={s.id}>
          {(i === 0 || sittings[i - 1].term !== s.term) && (
            <h2 className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant mt-6 mb-3">{s.term || 'Sittings'}</h2>
          )}
          <Link
            to={`/sittings/${s.id}`}
            className="flex items-start gap-4 bg-white rounded-2xl border border-outline-variant/30 p-5 hover:shadow-md transition-all"
          >
            <span className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
              <Icon name="event" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-label-sm text-outline">{formatDate(s.date)}</p>
              <h3 className="font-headline-md text-lg text-on-surface">{s.title}</h3>
              <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
                {s.minutes?.summary ?? s.agenda?.summary ?? 'Not yet translated — official PDFs linked on the sitting page.'}
              </p>
              <p className="text-label-sm text-outline mt-2">
                {[
                  s.minutes ? `${s.minutes.speakers.length} speakers` : null,
                  s.agenda ? `${s.agenda.items.length} agenda items` : null,
                  s.billIds.length ? `${s.billIds.length} bill${s.billIds.length === 1 ? '' : 's'}` : null,
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
            <Icon name="arrow_forward" className="text-primary shrink-0" />
          </Link>
          </div>
        ))}
      </div>
    </Container>
  )
}
