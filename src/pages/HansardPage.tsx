import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { mpById } from '@/data'
import { hansard, hansardSpeakers } from '@/data/hansard'
import { formatDate } from '@/utils/format'

const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0)

export function HansardPage() {
  const c = hansard.coverage
  const speakers = hansardSpeakers()
  const pagePct = pctOf(c.pagesDone, c.pagesTotal)

  return (
    <Container className="py-8">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Hansard</h1>
      <p className="text-on-surface-variant mt-1 max-w-3xl">
        Who said what in the chamber. Every speech from the official verbatim minutes (ޔައުމިއްޔާ), transcribed from the Dhivehi PDF,
        translated into English and linked to the member who spoke.
      </p>

      <section className="bg-primary-fixed rounded-2xl p-6 md:p-8 mt-8" aria-labelledby="coverage">
        <h2 id="coverage" className="font-headline-md text-on-primary-fixed">How much is in so far</h2>
        <p className="text-on-primary-fixed-variant mt-1">
          The full record is every sitting's minutes the Majlis has published for the 20th Parliament. We are adding it in batches.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Stat label="Sittings in the Hansard" value={`${c.sittingsDone} of ${c.sittingsTotal}`} />
          <Stat label="Minutes pages transcribed" value={`${c.pagesDone.toLocaleString()} of ${c.pagesTotal.toLocaleString()}`} />
          <Stat label="Of the full record" value={`${pagePct}%`} />
          <Stat label="Speeches attributed" value={c.speeches.toLocaleString()} />
        </div>
        <div className="mt-5 h-3 rounded-full bg-white/60 overflow-hidden" role="progressbar" aria-valuenow={pagePct} aria-valuemin={0} aria-valuemax={100} aria-label="Share of minutes pages transcribed">
          <div className="h-full bg-primary" style={{ width: `${Math.max(pagePct, 0.5)}%` }} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mt-gutter">
        <section className="lg:col-span-2 bg-white rounded-2xl border border-outline-variant/30 p-6">
          <h2 className="font-headline-md text-headline-md mb-4">Sittings</h2>
          {hansard.sittings.length === 0 && <p className="text-on-surface-variant">No sittings transcribed yet.</p>}
          <ul className="divide-y divide-outline-variant/40">
            {hansard.sittings.map((s) => (
              <li key={s.id} className="py-4">
                <Link to={`/hansard/${s.id}`} className="block group">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-label-bold text-on-surface group-hover:text-primary">{s.title}</span>
                    <span className="text-label-sm text-outline shrink-0">{formatDate(s.date)}</span>
                  </div>
                  <p className="text-label-sm text-on-surface-variant mt-1">
                    {s.speeches} speeches · {s.voices} {s.voices === 1 ? 'person' : 'people'} spoke from the floor · {s.pages} pages · ~{s.words.toLocaleString()} words in English
                  </p>
                  <div className="flex -space-x-2 mt-2">
                    {s.speakers.slice(0, 12).map((sp) => {
                      const mp = mpById(sp.mpId)
                      return mp ? <Avatar key={sp.mpId} mp={mp} size="sm" className="ring-2 ring-white" /> : null
                    })}
                    {s.speakers.length > 12 && <span className="text-label-sm text-outline pl-4 self-center">+{s.speakers.length - 12}</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-gutter">
          <section className="bg-white rounded-2xl border border-outline-variant/30 p-6">
            <h2 className="font-headline-md text-headline-md mb-1">Who spoke most</h2>
            <p className="text-label-sm text-outline mb-4">Members ranked by words spoken (English translation) in the sittings transcribed so far. Remarks from the chair are not counted.</p>
            <ol className="space-y-3">
              {speakers.slice(0, 15).map((sp, i) => {
                const mp = mpById(sp.mpId)
                if (!mp) return null
                return (
                  <li key={sp.mpId}>
                    <Link to={`/mps/${mp.id}`} className="flex items-center gap-3 group">
                      <span className="w-5 text-label-sm text-outline text-right">{i + 1}</span>
                      <Avatar mp={mp} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-label-bold text-on-surface group-hover:text-primary truncate">{mp.name}</span>
                        <span className="block text-label-sm text-outline">{sp.speeches} speeches · {sp.sittings} sittings</span>
                      </span>
                      <span className="text-label-sm text-on-surface-variant shrink-0">{sp.words.toLocaleString()} words</span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </section>
          <section className="bg-surface-container-low rounded-2xl p-6 text-sm text-on-surface-variant space-y-2">
            <h2 className="font-label-bold text-on-surface flex items-center gap-2"><Icon name="info" className="text-[18px]" /> How this is made</h2>
            <p>Claude reads each page image of the official minutes PDF and transcribes the Dhivehi, then splits it at every speaker heading and translates each speech into English.</p>
            <p>Speakers are matched to the member roster by constituency. The Dhivehi original sits beside every translation, and the official PDF is the authority.</p>
          </section>
        </aside>
      </div>
    </Container>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/70 rounded-xl p-4">
      <p className="font-headline-md text-on-primary-fixed">{value}</p>
      <p className="text-label-sm text-on-primary-fixed-variant mt-1">{label}</p>
    </div>
  )
}
