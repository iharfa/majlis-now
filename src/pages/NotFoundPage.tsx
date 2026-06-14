import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'

export function NotFoundPage() {
  return (
    <Container className="py-24 text-center">
      <Icon name="travel_explore" className="text-primary text-6xl" />
      <h1 className="font-headline-lg text-headline-lg mt-4">We couldn’t find that page</h1>
      <p className="text-on-surface-variant mt-2">The record may have moved, or the link is incomplete.</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 mt-6 bg-primary text-white px-6 py-3 rounded-xl font-label-bold"
      >
        <Icon name="arrow_back" /> Back to the briefing
      </Link>
    </Container>
  )
}
