import { useState } from 'react'
import { Link } from 'react-router-dom'
import { findMPs, constituencyById, partyById } from '@/data'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'

const SUGGESTIONS = ['Malé', 'Addu City', 'Hulhumalé', 'Haa Alif']

/** "Find your MP" widget — search by name, constituency, island, or atoll. */
export function FindYourMP({ variant = 'panel' }: { variant?: 'panel' | 'plain' }) {
  const [q, setQ] = useState('')
  const results = findMPs(q).slice(0, 5)
  const onPanel = variant === 'panel'

  return (
    <div className={onPanel ? 'p-8 rounded-2xl bg-primary-container text-on-primary-container shadow-lg' : ''}>
      <div className="flex items-center gap-3 mb-4">
        <Icon name="person_search" className="text-3xl" />
        <h3 className="font-headline-md text-headline-md">Find your MP</h3>
      </div>
      <p className={`font-body-md mb-5 ${onPanel ? 'opacity-90' : 'text-on-surface-variant'}`}>
        Enter your island, atoll, or constituency to see who represents you and how they have voted.
      </p>
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Malé, Addu City, Hoarafushi…"
          className={
            onPanel
              ? 'w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-white outline-none'
              : 'w-full px-5 py-4 rounded-xl bg-white border border-outline-variant focus:ring-2 focus:ring-primary outline-none'
          }
        />
        <Icon
          name="search"
          className={`absolute right-4 top-4 ${onPanel ? 'text-white/80' : 'text-on-surface-variant'}`}
        />
      </div>

      {!q && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`text-label-sm ${onPanel ? 'opacity-70' : 'text-outline'}`}>Popular:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setQ(s)}
              className={`text-label-sm font-label-bold underline ${onPanel ? '' : 'text-primary'}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {q && (
        <div className="mt-4 space-y-2">
          {results.length === 0 && (
            <p className={`text-label-sm ${onPanel ? 'opacity-80' : 'text-on-surface-variant'}`}>
              No match in the mock dataset. Try an atoll like “Addu City”.
            </p>
          )}
          {results.map((mp) => {
            const c = constituencyById(mp.constituencyId)
            const party = partyById(mp.partyId)
            return (
              <Link
                key={mp.id}
                to={`/mps/${mp.id}`}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  onPanel ? 'bg-white/10 hover:bg-white/20' : 'bg-surface-container-low hover:bg-surface-variant'
                }`}
              >
                <Avatar mp={mp} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-label-bold truncate">{mp.name}</p>
                  <p className={`text-label-sm truncate ${onPanel ? 'opacity-80' : 'text-on-surface-variant'}`}>
                    {c?.name} · {party?.shortName}
                  </p>
                </div>
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
