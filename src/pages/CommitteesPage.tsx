import { Link } from 'react-router-dom'
import { Container, PageHeader } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { committees, mpById } from '@/data'
import { formatDate } from '@/utils/format'

function shortCategory(c?: string): string {
  if (!c) return 'Committee'
  if (c.includes('Joint')) return 'Joint committee'
  if (c.includes('Select')) return 'Select committee'
  if (c.includes('Parliamentary work')) return 'Standing committee'
  if (c.includes('State Institutions')) return 'Standing committee'
  return 'Committee'
}

export function CommitteesPage() {
  // Group: main standing committees first, then select/joint/sub-committees.
  const standing = committees.filter((c) => c.category?.includes('Standing'))
  const others = committees.filter((c) => !c.category?.includes('Standing'))

  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Committees"
        title="Where the detailed work happens"
        description="Real committee membership, leadership and meeting records from the People’s Majlis — all 39 committees of the 20th Parliament."
      />
      <Section title="Standing committees" items={standing} />
      <Section title="Select, joint & sub-committees" items={others} />
    </Container>
  )
}

function Section({ title, items }: { title: string; items: typeof committees }) {
  if (items.length === 0) return null
  return (
    <section className="mb-section-gap">
      <h2 className="font-headline-md text-headline-md mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {items.map((c) => {
          const chair = c.chairMpId ? mpById(c.chairMpId) : undefined
          return (
            <Link
              key={c.id}
              to={`/committees/${c.id}`}
              className="group block bg-white rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all p-6"
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-label-sm font-label-bold uppercase tracking-wider text-primary">
                  {shortCategory(c.category)}
                </span>
                {c.status === 'Completed' && (
                  <span className="text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-label-bold">
                    Completed
                  </span>
                )}
              </div>
              <h3 className="font-headline-md text-lg group-hover:text-primary transition-colors">{c.name}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">
                {chair ? `Chair: ${chair.name}` : 'Chair: —'} · {c.memberMpIds.length} members
              </p>
              <div className="mt-4 pt-4 border-t border-outline-variant/40 flex items-center justify-between text-label-sm text-outline">
                <span className="inline-flex items-center gap-1">
                  <Icon name="event" className="text-[16px]" /> {c.meetings.length} meetings
                </span>
                {c.latestActionDate && <span>Last met {formatDate(c.latestActionDate)}</span>}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
