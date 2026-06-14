import type { Issue } from '@/types'
import { mockSource } from './sources'

// MOCK issues. Each maps a theme to a concrete decision point voters can track.
export const issues: Issue[] = [
  {
    id: 'issue-debt-oversight',
    themeId: 'public-finance',
    title: 'Oversight of new national debt',
    plainLanguageQuestion: 'Should the full Parliament or a committee approve new government loans?',
    whyItMatters:
      'Who approves borrowing affects how visible new national debt is to the public and how quickly it is taken on.',
    relatedBillIds: ['bill-public-finance'],
    relatedVoteIds: ['vote-public-finance'],
    decisionPoints: [
      {
        id: 'dp-debt-1',
        issueId: 'issue-debt-oversight',
        question: 'Did this vote increase or reduce oversight of new debt?',
        classificationOptions: ['Improved oversight', 'Reduced oversight'],
        relatedVoteIds: ['vote-public-finance'],
        confidence: 'High',
        sources: [mockSource('src-dp-debt', 'Vote record (mock)')],
      },
    ],
    sources: [mockSource('src-issue-debt', 'Issue brief — debt oversight (mock)')],
  },
  {
    id: 'issue-online-speech',
    themeId: 'media',
    title: 'Regulation of online expression',
    plainLanguageQuestion: 'Did this vote expand or restrict online expression?',
    whyItMatters:
      'How online content is regulated affects what people can say and publish, and how the state can intervene.',
    relatedBillIds: ['bill-online-speech'],
    relatedVoteIds: ['vote-online-speech'],
    decisionPoints: [
      {
        id: 'dp-speech-1',
        issueId: 'issue-online-speech',
        question: 'Did this vote expand or restrict online expression?',
        classificationOptions: ['Expanded public rights', 'Restricted public rights'],
        relatedVoteIds: ['vote-online-speech'],
        confidence: 'Medium',
        sources: [mockSource('src-dp-speech', 'Vote record (mock)')],
      },
    ],
    sources: [mockSource('src-issue-speech', 'Issue brief — online speech (mock)')],
  },
  {
    id: 'issue-reef-protection',
    themeId: 'environment',
    title: 'Protection of reefs and marine resources',
    plainLanguageQuestion: 'Did this vote strengthen or weaken protection of reefs?',
    whyItMatters: 'Reef protection affects fishing livelihoods, tourism, and coastal resilience.',
    relatedBillIds: ['bill-fisheries'],
    relatedVoteIds: ['vote-reef', 'vote-fisheries'],
    decisionPoints: [
      {
        id: 'dp-reef-1',
        issueId: 'issue-reef-protection',
        question: 'Did this vote expand or restrict environmental protection?',
        classificationOptions: ['Expanded public rights', 'Restricted public rights'],
        relatedVoteIds: ['vote-reef'],
        confidence: 'High',
        sources: [mockSource('src-dp-reef', 'Vote record (mock)')],
      },
    ],
    sources: [mockSource('src-issue-reef', 'Issue brief — reef protection (mock)')],
  },
]

export const issueById = (id: string) => issues.find((i) => i.id === id)
