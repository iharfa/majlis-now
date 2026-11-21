import index from './hansard.json'

// Hansard: verbatim sitting minutes, transcribed and translated speech by speech (scripts/build_hansard.py).
// The index is bundled; each sitting's speeches live in public/hansard/<id>.json and are fetched on open.

export interface HansardSpeech {
  n: number
  page: number | null
  pageEnd: number | null
  item: string | null
  role: 'member' | 'chair' | 'minister' | 'official' | 'other'
  mpId: string | null
  name: string
  constituency: string
  heading: string | null
  dv: string
  en: string
  words: number
  /** the source could not be read clearly somewhere in this speech ([unclear], [?] or an unreadable scan) */
  lowConfidence?: boolean
}

export interface HansardSitting {
  id: string
  date: string
  title: string
  pages: number
  sourceUrl: string | null
  items: { n: string; title: string }[]
  speeches: HansardSpeech[]
}

export interface HansardIndexEntry {
  id: string
  date: string
  title: string
  pages: number
  speeches: number
  words: number
  /** distinct people who spoke from the floor (members, ministers, officials) */
  voices: number
  speakers: { mpId: string; speeches: number; words: number }[]
  lowConfidenceSpeeches: number
  /** many speeches carry unclear-source markers, or a known problem with the source (see issue) */
  lowConfidence: boolean
  issue: string | null
}

export const hansard = index as {
  coverage: { sittingsDone: number; sittingsTotal: number; pagesDone: number; pagesTotal: number; speeches: number }
  sittings: HansardIndexEntry[]
}

/** Raw Majlis sitting id ("1085") from the app's sitting id ("sitting-1085"). */
export const hansardFor = (sittingId: string) => hansard.sittings.find((s) => s.id === sittingId.replace(/^sitting-/, ''))

/** Sittings in the Hansard where this MP spoke as a member (not from the chair). */
export const hansardForMP = (mpId: string) =>
  hansard.sittings.flatMap((s) => {
    const sp = s.speakers.find((x) => x.mpId === mpId)
    return sp ? [{ sitting: s, speeches: sp.speeches, words: sp.words }] : []
  })

/** Members ranked by words spoken across every sitting in the Hansard so far. */
export const hansardSpeakers = () => {
  const m = new Map<string, { mpId: string; speeches: number; words: number; sittings: number }>()
  for (const s of hansard.sittings)
    for (const sp of s.speakers) {
      const v = m.get(sp.mpId) ?? { mpId: sp.mpId, speeches: 0, words: 0, sittings: 0 }
      v.speeches += sp.speeches
      v.words += sp.words
      v.sittings += 1
      m.set(sp.mpId, v)
    }
  return [...m.values()].sort((a, b) => b.words - a.words)
}
