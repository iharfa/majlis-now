import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { ActivityItem } from '@/components/cards/ActivityItem'
import { FindYourMP } from '@/components/mps/FindYourMP'
import { IssueThemeCard } from '@/components/cards/IssueThemeCard'
import { Icon } from '@/components/ui/Icon'
import { votes, activity, themes, billById, sittings, bills } from '@/data'
import { formatDate, pct } from '@/utils/format'

function ResultBadge({ result }: { result: string }) {
  const passed = result === 'Passed'
  return (
    <span className={`px-3 py-1 rounded-full text-label-sm font-label-bold ${passed ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'}`}>
      {result.toUpperCase()}
    </span>
  )
}

function CountBar({ v }: { v: (typeof votes)[number] }) {
  const total = v.yesCount + v.noCount + v.abstainCount + v.absentCount
  return (
    <>
      <div className="h-2 bg-surface-variant rounded-full overflow-hidden flex">
        <div className="h-full bg-secondary" style={{ width: `${pct(v.yesCount, total)}%` }} />
        <div className="h-full bg-error" style={{ width: `${pct(v.noCount, total)}%` }} />
        <div className="h-full bg-tertiary" style={{ width: `${pct(v.abstainCount, total)}%` }} />
        <div className="h-full bg-outline" style={{ width: `${pct(v.absentCount, total)}%` }} />
      </div>
      <div className="mt-2 flex items-center gap-4 text-label-sm">
        <span className="text-secondary font-label-bold">{v.yesCount} Yes</span>
        <span className="text-error font-label-bold">{v.noCount} No</span>
        <span className="text-outline">{v.absentCount} absent / not voting</span>
      </div>
    </>
  )
}

export function HomePage() {
  const recent = [...votes].sort((a, b) => b.date.localeCompare(a.date))
  const hero = recent[0]
  const more = recent.slice(1, 5)
  const heroBill = hero?.billId ? billById(hero.billId) : undefined
  const latestSitting = sittings.find((s) => s.date)
  const inProgress = bills
    .filter((b) => b.status !== 'Passed' && b.status !== 'Rejected' && b.status !== 'Withdrawn')
    .sort((a, b) => b.lastActionDate.localeCompare(a.lastActionDate))
    .slice(0, 4)
  const topThemes = themes.filter((t) => bills.some((b) => b.themeId === t.id)).slice(0, 4)

  return (
    <Container className="py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-8 space-y-section-gap">
        {latestSitting && (
          <section className="space-y-stack-gap">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">What Parliament is doing now</h2>
              <Link to="/sittings" className="text-primary font-label-bold text-label-sm hover:underline shrink-0">All sittings</Link>
            </div>
            <Link to={`/sittings/${latestSitting.id}`} className="block rounded-2xl bg-secondary-container/40 border border-secondary/20 p-6 hover:shadow-md transition-all">
              <p className="text-label-sm font-label-bold uppercase text-on-secondary-container flex items-center gap-1">
                <Icon name="event" className="text-[16px]" /> Latest sitting · {formatDate(latestSitting.date)}
              </p>
              <h3 className="font-headline-md text-headline-md text-on-surface mt-1">{latestSitting.title}</h3>
              <p className="mt-2 text-on-surface-variant">
                {latestSitting.agenda?.summary ?? 'Agenda published; translation pending.'}
              </p>
              <span className="inline-flex items-center gap-1 text-primary font-label-bold text-label-sm mt-3">
                Read the agenda in English <Icon name="arrow_forward" className="text-[16px]" />
              </span>
            </Link>
          </section>
        )}

        {hero && (
          <section className="space-y-stack-gap">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Latest recorded vote</h2>
              <span className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full shrink-0">
                <Icon name="verified" className="text-[16px]" />
                <span className="font-label-bold text-label-sm">OFFICIAL RECORD</span>
              </span>
            </div>
            <div className="rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 p-8">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <ResultBadge result={hero.result} />
                <span className="px-3 py-1 rounded-full text-label-sm font-label-bold bg-surface-container text-on-surface-variant">
                  {hero.voteType === 'acceptance' ? 'Acceptance vote' : 'Final vote'}
                </span>
                <span className="text-on-surface-variant text-label-sm flex items-center gap-1">
                  <Icon name="calendar_month" className="text-sm" /> {formatDate(hero.date)}
                </span>
              </div>
              <h3 className="font-display-lg text-headline-lg leading-tight text-on-surface">{hero.title.replace(/ — .*$/, '')}</h3>
              <p className="mt-3 font-body-lg text-on-surface-variant max-w-2xl">{hero.whatItDecided}</p>
              <div className="mt-5 max-w-md">
                <CountBar v={hero} />
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to={`/votes/${hero.id}`} className="bg-primary text-on-primary font-label-bold text-label-bold px-6 py-3 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                  See how MPs voted <Icon name="how_to_vote" className="text-[18px]" />
                </Link>
                {heroBill && (
                  <Link to={`/bills/${heroBill.id}`} className="border-2 border-primary text-primary font-label-bold text-label-bold px-6 py-3 rounded-xl hover:bg-primary-fixed transition-colors flex items-center gap-2">
                    What the bill does <Icon name="description" className="text-[18px]" />
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {inProgress.length > 0 && (
          <section className="space-y-stack-gap">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Bills in progress</h2>
              <Link to="/bills" className="text-primary font-label-bold text-label-sm hover:underline">All bills</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {inProgress.map((b) => (
                <Link key={b.id} to={`/bills/${b.id}`} className="group block bg-white rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all p-6">
                  <p className="text-label-sm text-outline mb-2">{b.status} · {formatDate(b.lastActionDate)}</p>
                  <h3 className="font-headline-md text-lg text-on-surface group-hover:text-primary transition-colors line-clamp-2">{b.title}</h3>
                  <p className="mt-2 text-sm text-on-surface-variant line-clamp-3">{b.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-stack-gap">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Latest decisions</h2>
            <Link to="/votes" className="text-primary font-label-bold text-label-sm hover:underline">All votes</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {more.map((v) => (
              <Link key={v.id} to={`/votes/${v.id}`} className="group block bg-white rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex items-center gap-2 mb-3">
                  <ResultBadge result={v.result} />
                  <span className="text-label-sm text-on-surface-variant">{v.voteType === 'acceptance' ? 'Acceptance' : 'Final'}</span>
                  <span className="text-label-sm text-outline ml-auto">{formatDate(v.date)}</span>
                </div>
                <h3 className="font-headline-md text-lg text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                  {v.title.replace(/ — .*$/, '')}
                </h3>
                <div className="mt-4">
                  <CountBar v={v} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <aside className="md:col-span-4 space-y-section-gap">
        <FindYourMP />

        <section className="space-y-stack-gap">
          <h3 className="font-headline-md text-headline-md text-on-surface px-1">Activity feed</h3>
          <div className="space-y-3">
            {activity.slice(0, 10).map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
            <Link to="/sittings" className="w-full py-3 text-primary font-label-bold text-label-bold text-center border-2 border-dashed border-primary/20 rounded-xl hover:bg-primary-fixed transition-colors flex items-center justify-center gap-2">
              All sittings <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
          </div>
        </section>

        <section className="space-y-stack-gap">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-headline-md text-headline-md text-on-surface">Issue themes</h3>
            <Link to="/issues" className="text-primary font-label-bold text-label-sm hover:underline">See all</Link>
          </div>
          <div className="grid grid-cols-1 gap-gutter">
            {topThemes.map((t) => (
              <IssueThemeCard key={t.id} theme={t} />
            ))}
          </div>
        </section>
      </aside>
    </Container>
  )
}
