import type { Committee } from '@/types'
import { mockSource } from './sources'

// Committee NAMES are real standing committees of the People's Majlis. Meeting
// schedules, attendance and membership are NOT published as structured open
// data, so those are left empty / illustrative and clearly labelled in the UI.
// `chairMpId` / `memberMpIds` are intentionally empty: we do not attribute
// committee membership to real, named members without a verified source.
export const committees: Committee[] = [
  {
    id: 'cmt-finance',
    name: 'Public Accounts Committee',
    chairMpId: '',
    memberMpIds: [],
    meetings: [
      { id: 'm-fin-1', date: '2026-06-10', subject: 'Public finance amendment — clause review (illustrative)', attendance: 0 },
    ],
    attendance: 0,
    billsReviewedIds: ['bill-public-finance', 'bill-youth-employment'],
    reportsProduced: 0,
    latestAction: 'Reviewed the public finance amendment (illustrative)',
    latestActionDate: '2026-06-10',
    stalledItems: [],
    signalIds: [],
    sources: [mockSource('src-cmt-fin', 'Committee directory (names from People’s Majlis)')],
  },
  {
    id: 'cmt-environment',
    name: 'Environment and Climate Change Committee',
    chairMpId: '',
    memberMpIds: [],
    meetings: [
      { id: 'm-env-1', date: '2026-05-28', subject: 'Waste management policy (illustrative)', attendance: 0 },
    ],
    attendance: 0,
    billsReviewedIds: ['bill-fisheries'],
    reportsProduced: 0,
    latestAction: 'Hearing on waste management policy (illustrative)',
    latestActionDate: '2026-05-28',
    stalledItems: ['Plastic Waste Management Bill — report pending (illustrative)'],
    signalIds: ['sig-fisheries-quiet'],
    sources: [mockSource('src-cmt-env', 'Committee directory (names from People’s Majlis)')],
  },
  {
    id: 'cmt-rights',
    name: 'Human Rights and Gender Committee',
    chairMpId: '',
    memberMpIds: [],
    meetings: [
      { id: 'm-rights-1', date: '2026-05-30', subject: 'Online speech bill — definitions (illustrative)', attendance: 0 },
    ],
    attendance: 0,
    billsReviewedIds: ['bill-online-speech', 'bill-anti-corruption'],
    reportsProduced: 0,
    latestAction: 'Hearing on the online speech bill (illustrative)',
    latestActionDate: '2026-05-30',
    stalledItems: ['Anti-Corruption Amendment — no recorded action (illustrative)'],
    signalIds: ['sig-anti-corruption-stall'],
    sources: [mockSource('src-cmt-rights', 'Committee directory (names from People’s Majlis)')],
  },
  {
    id: 'cmt-economy',
    name: 'Economic Affairs Committee',
    chairMpId: '',
    memberMpIds: [],
    meetings: [
      { id: 'm-eco-1', date: '2026-06-05', subject: 'Youth employment scope (illustrative)', attendance: 0 },
    ],
    attendance: 0,
    billsReviewedIds: ['bill-youth-employment', 'bill-tourism-rent'],
    reportsProduced: 0,
    latestAction: 'Reviewed youth employment scope (illustrative)',
    latestActionDate: '2026-06-05',
    stalledItems: [],
    signalIds: ['sig-tourism-ready'],
    sources: [mockSource('src-cmt-eco', 'Committee directory (names from People’s Majlis)')],
  },
  {
    id: 'cmt-security',
    name: 'Committee on National Security Services (241 Committee)',
    chairMpId: '',
    memberMpIds: [],
    meetings: [
      { id: 'm-sec-1', date: '2026-06-09', subject: 'Border management briefing (illustrative)', attendance: 0 },
    ],
    attendance: 0,
    billsReviewedIds: [],
    reportsProduced: 0,
    latestAction: 'Briefing on border management (illustrative)',
    latestActionDate: '2026-06-09',
    stalledItems: [],
    signalIds: [],
    sources: [mockSource('src-cmt-sec', 'Committee directory (names from People’s Majlis)')],
  },
  {
    id: 'cmt-welfare',
    name: 'Social Affairs Committee',
    chairMpId: '',
    memberMpIds: [],
    meetings: [
      { id: 'm-wel-1', date: '2026-05-26', subject: 'Disability allowance framework (illustrative)', attendance: 0 },
    ],
    attendance: 0,
    billsReviewedIds: [],
    reportsProduced: 0,
    latestAction: 'Reviewed disability allowance framework (illustrative)',
    latestActionDate: '2026-05-26',
    stalledItems: [],
    signalIds: [],
    sources: [mockSource('src-cmt-wel', 'Committee directory (names from People’s Majlis)')],
  },
]

export const committeeById = (id: string) => committees.find((c) => c.id === id)
