import { Component, Suspense, lazy, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { Layout } from '@/components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Route-level code splitting: the home page is eager, everything else loads on demand.
const BillsPage = lazy(() => import('@/pages/BillsPage').then((m) => ({ default: m.BillsPage })))
const BillDetailPage = lazy(() => import('@/pages/BillDetailPage').then((m) => ({ default: m.BillDetailPage })))
const VotesPage = lazy(() => import('@/pages/VotesPage').then((m) => ({ default: m.VotesPage })))
const VoteDetailPage = lazy(() => import('@/pages/VoteDetailPage').then((m) => ({ default: m.VoteDetailPage })))
const MPsPage = lazy(() => import('@/pages/MPsPage').then((m) => ({ default: m.MPsPage })))
const MPDetailPage = lazy(() => import('@/pages/MPDetailPage').then((m) => ({ default: m.MPDetailPage })))
const ComparePage = lazy(() => import('@/pages/ComparePage').then((m) => ({ default: m.ComparePage })))
const IssuesPage = lazy(() => import('@/pages/IssuesPage').then((m) => ({ default: m.IssuesPage })))
const ThemeDetailPage = lazy(() => import('@/pages/ThemeDetailPage').then((m) => ({ default: m.ThemeDetailPage })))
const CommitteesPage = lazy(() => import('@/pages/CommitteesPage').then((m) => ({ default: m.CommitteesPage })))
const CommitteeDetailPage = lazy(() => import('@/pages/CommitteeDetailPage').then((m) => ({ default: m.CommitteeDetailPage })))
const SittingsPage = lazy(() => import('@/pages/SittingsPage').then((m) => ({ default: m.SittingsPage })))
const SittingDetailPage = lazy(() => import('@/pages/SittingDetailPage').then((m) => ({ default: m.SittingDetailPage })))
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const InsightsPage = lazy(() => import('@/pages/InsightsPage').then((m) => ({ default: m.InsightsPage })))

const TITLES: Array<[RegExp, string]> = [
  [/^\/$/, 'What Parliament is doing now'],
  [/^\/bills/, 'Bills'],
  [/^\/votes/, 'Votes'],
  [/^\/mps/, 'MPs'],
  [/^\/compare/, 'Compare MPs'],
  [/^\/issues/, 'Issues & themes'],
  [/^\/committees/, 'Committees'],
  [/^\/sittings/, 'Sittings'],
  [/^\/search/, 'Search'],
  [/^\/insights/, 'Insights'],
]

function RouteTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const t = TITLES.find(([rx]) => rx.test(pathname))?.[1] ?? 'Page not found'
    document.title = `${t} — Majlis Now`
  }, [pathname])
  return null
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {}
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="max-w-xl mx-auto py-24 px-4 text-center">
          <h1 className="font-headline-lg text-headline-lg">Something went wrong</h1>
          <p className="text-on-surface-variant mt-2">{this.state.error.message}</p>
          <a href="/" className="inline-block mt-6 bg-primary text-white px-6 py-3 rounded-xl font-label-bold">Back to the briefing</a>
        </div>
      )
    }
    return this.props.children
  }
}

const Loading = () => <div className="py-24 text-center text-on-surface-variant" role="status">Loading…</div>

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RouteTitle />
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="bills" element={<BillsPage />} />
              <Route path="bills/:id" element={<BillDetailPage />} />
              <Route path="votes" element={<VotesPage />} />
              <Route path="votes/:id" element={<VoteDetailPage />} />
              <Route path="mps" element={<MPsPage />} />
              <Route path="mps/:id" element={<MPDetailPage />} />
              <Route path="compare" element={<ComparePage />} />
              <Route path="issues" element={<IssuesPage />} />
              <Route path="issues/theme/:id" element={<ThemeDetailPage />} />
              <Route path="committees" element={<CommitteesPage />} />
              <Route path="committees/:id" element={<CommitteeDetailPage />} />
              <Route path="sittings" element={<SittingsPage />} />
              <Route path="sittings/:id" element={<SittingDetailPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <Analytics />
    </BrowserRouter>
  )
}
