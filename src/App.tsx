import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { Layout } from '@/components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { BillsPage } from '@/pages/BillsPage'
import { BillDetailPage } from '@/pages/BillDetailPage'
import { VotesPage } from '@/pages/VotesPage'
import { VoteDetailPage } from '@/pages/VoteDetailPage'
import { MPsPage } from '@/pages/MPsPage'
import { MPDetailPage } from '@/pages/MPDetailPage'
import { ComparePage } from '@/pages/ComparePage'
import { IssuesPage } from '@/pages/IssuesPage'
import { ThemeDetailPage } from '@/pages/ThemeDetailPage'
import { IssueDetailPage } from '@/pages/IssueDetailPage'
import { CommitteesPage } from '@/pages/CommitteesPage'
import { CommitteeDetailPage } from '@/pages/CommitteeDetailPage'
import { SearchPage } from '@/pages/SearchPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
          <Route path="issues/:id" element={<IssueDetailPage />} />
          <Route path="committees" element={<CommitteesPage />} />
          <Route path="committees/:id" element={<CommitteeDetailPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <Analytics />
    </BrowserRouter>
  )
}
