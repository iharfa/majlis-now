import type { Party } from '@/types'

// Real parties represented in the 20th People's Majlis (source: majlis.gov.mv).
// Alignment is a broad, widely-reported characterisation, not an official field.
export const parties: Party[] = [
  { id: 'pnc', name: 'People’s National Congress', shortName: 'PNC', color: '#009688', alignment: 'Government' },
  { id: 'mdp', name: 'Maldivian Democratic Party', shortName: 'MDP', color: '#f4c20d', alignment: 'Opposition' },
  { id: 'mnp', name: 'Maldives National Party', shortName: 'MNP', color: '#1565c0', alignment: 'Opposition' },
  { id: 'jp', name: 'Jumhooree Party', shortName: 'JP', color: '#d32f2f', alignment: 'Coalition' },
  { id: 'mda', name: 'Maldives Development Alliance', shortName: 'MDA', color: '#f57c00', alignment: 'Coalition' },
  { id: 'ind', name: 'Independent', shortName: 'IND', color: '#767586', alignment: 'Independent' },
]

export const partyById = (id: string) => parties.find((p) => p.id === id)
