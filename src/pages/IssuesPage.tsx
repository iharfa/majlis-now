import { Container, PageHeader } from '@/components/ui/Container'
import { IssueThemeCard } from '@/components/cards/IssueThemeCard'
import { themes } from '@/data'

export function IssuesPage() {
  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Issues & themes"
        title="Track the issues you care about"
        description="Ten policy themes. Open one to see the real bills and recorded votes in that area."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {themes.map((t) => (
          <IssueThemeCard key={t.id} theme={t} />
        ))}
      </div>
    </Container>
  )
}
