import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, PageHeader } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { PartyTag } from '@/components/ui/PartyTag'
import { AiBadge } from '@/components/ui/AiBadge'
import { constituencyById, partyById } from '@/data'
import {
  headline, floorTime, silentMPs, floorByParty, attendanceTrend, termCards, tallyVotes, closestVotes, failedVotes,
  nominationVotes, questionsByMinistry, questionItemsTotal, committeeReferrals, presiding, minuted,
} from '@/data/insights'
import { formatShortDate, pct } from '@/utils/format'

function Section({ id, title, lede, caveat, children }: { id: string; title: string; lede: string; caveat?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-4 scroll-mt-24">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">{title}</h2>
        <p className="text-on-surface-variant mt-1 max-w-2xl">{lede}</p>
      </div>
      {children}
      {caveat && <p className="text-label-sm text-outline flex items-start gap-1"><Icon name="info" className="text-base shrink-0" />{caveat}</p>}
    </section>
  )
}

function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-outline-variant/30 p-5">
      <p className="text-label-sm font-label-bold uppercase text-outline">{label}</p>
      <p className="font-headline-lg text-3xl text-on-surface mt-1">{value}</p>
      {sub && <p className="text-label-sm text-on-surface-variant mt-1">{sub}</p>}
    </div>
  )
}

/** Horizontal bar row: thin mark, label and value in text tokens. */
function Bar({ label, value, max, sub, to }: { label: React.ReactNode; value: number; max: number; sub?: string; to?: string }) {
  const inner = (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 items-center py-1.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm text-on-surface truncate">{label}</div>
        <div className="h-2 mt-1 bg-surface-variant rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${pct(value, max)}%` }} />
        </div>
      </div>
      <div className="text-right">
        <p className="font-label-bold text-on-surface tabular-nums">{value}</p>
        {sub && <p className="text-label-sm text-outline whitespace-nowrap">{sub}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to} className="block hover:bg-surface-container-low rounded-lg px-2 -mx-2">{inner}</Link> : <div className="px-2 -mx-2">{inner}</div>
}

function AttendanceChart() {
  const pts = attendanceTrend
  if (pts.length < 2) return null
  const W = 720, H = 200, PL = 36, PR = 12, PT = 12, PB = 28
  const max = Math.max(...pts.map((p) => p.present), 93)
  const x = (i: number) => PL + (i / (pts.length - 1)) * (W - PL - PR)
  const y = (v: number) => PT + (1 - v / max) * (H - PT - PB)
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.present).toFixed(1)}`).join(' ')
  const termStarts = pts.map((p, i) => (i === 0 || pts[i - 1].term !== p.term ? i : -1)).filter((i) => i >= 0)
  const lo = pts.reduce((a, b) => (b.present < a.present ? b : a))
  const hi = pts.reduce((a, b) => (b.present > a.present ? b : a))
  return (
    <figure className="bg-white rounded-2xl border border-outline-variant/30 p-4 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px] h-auto" role="img" aria-label="Members present at the opening roll call, per sitting">
        {[0, 31, 47, 62, 93].map((v) => (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} className="stroke-outline-variant/40" strokeWidth={1} />
            <text x={PL - 6} y={y(v) + 4} textAnchor="end" className="fill-outline" fontSize={11}>{v}</text>
          </g>
        ))}
        {termStarts.map((i) => (
          <g key={i}>
            <line x1={x(i)} x2={x(i)} y1={PT} y2={H - PB} className="stroke-outline-variant/60" strokeDasharray="3 3" strokeWidth={1} />
            <text x={x(i) + 3} y={H - PB + 14} className="fill-outline" fontSize={10}>{pts[i].term?.replace(' Term', '').replace(' Sitting', '')}</text>
          </g>
        ))}
        <path d={d} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={p.id} cx={x(i)} cy={y(p.present)} r={8} fill="transparent" className="hover:fill-primary/15">
            <title>{`${formatShortDate(p.date)} — ${p.present} present\n${p.title}`}</title>
          </circle>
        ))}
        {[lo, hi].map((p) => {
          const i = pts.indexOf(p)
          return (
            <g key={p.id}>
              <circle cx={x(i)} cy={y(p.present)} r={4} className="fill-primary stroke-white" strokeWidth={2} />
              <text x={x(i)} y={y(p.present) + (p === hi ? -8 : 16)} textAnchor="middle" className="fill-on-surface" fontSize={11} fontWeight={700}>{p.present}</text>
            </g>
          )
        })}
      </svg>
      <figcaption className="text-label-sm text-outline mt-2">Lowest {lo.present} ({formatShortDate(lo.date)}), highest {hi.present} ({formatShortDate(hi.date)}). Gridlines at the 93-seat house, quorum-relevant 47, and 31.</figcaption>
    </figure>
  )
}

function VoteRow({ v }: { v: (typeof tallyVotes)[number] }) {
  const total = v.yes + v.no + v.abstain
  return (
    <Link to={`/sittings/${v.sittingId}`} className="block bg-white rounded-xl border border-outline-variant/30 p-3 hover:shadow-sm">
      <p className="text-sm text-on-surface line-clamp-2">{v.what}</p>
      <div className="h-2 mt-2 bg-surface-variant rounded-full overflow-hidden flex gap-px">
        <div className="h-full bg-secondary" style={{ width: `${pct(v.yes, total)}%` }} />
        <div className="h-full bg-error" style={{ width: `${pct(v.no, total)}%` }} />
        <div className="h-full bg-tertiary" style={{ width: `${pct(v.abstain, total)}%` }} />
      </div>
      <p className="text-label-sm mt-1 flex gap-3">
        <span className="text-secondary font-label-bold">{v.yes} yes</span>
        <span className="text-error font-label-bold">{v.no} no</span>
        {v.abstain > 0 && <span className="text-tertiary">{v.abstain} abstain</span>}
        <span className="text-outline ml-auto">{formatShortDate(v.date)} · {v.passed ? 'passed' : 'not passed'}</span>
      </p>
    </Link>
  )
}

export function InsightsPage() {
  const [showAll, setShowAll] = useState(false)
  const top = showAll ? floorTime : floorTime.slice(0, 15)
  const maxTurns = floorTime[0]?.turns ?? 1
  const nav = [
    ['floor', 'Floor time'], ['attendance', 'Attendance'], ['terms', 'Session scorecard'], ['votes', 'Votes'],
    ['questions', 'Question time'], ['nominations', 'Nominations'], ['committees', 'Committee referrals'], ['chair', 'Who presides'],
  ]
  return (
    <Container className="py-8 space-y-12">
      <PageHeader
        eyebrow="Insights"
        title="Parliament by the numbers"
        description="Patterns across every sitting: who speaks, who turns up, what gets voted on and where it goes next. Computed from the translated agendas and minutes digests."
      >
        <AiBadge confidence="Medium" model="claude-sonnet-5-5 (minutes), claude-fable-5-1 (agendas)" generatedAt="2026-10-07" />
      </PageHeader>

      <nav aria-label="Sections" className="flex flex-wrap gap-2 -mt-4">
        {nav.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="px-3 py-1.5 rounded-full bg-surface-container-low text-label-sm font-label-bold text-on-surface-variant hover:bg-surface-container">{label}</a>
        ))}
      </nav>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tile label="Sittings with minutes" value={headline.minuted} sub={`of ${headline.sittings} sittings`} />
        <Tile label="Speaker turns" value={headline.turns.toLocaleString()} sub="counted from minutes headers" />
        <Tile label="Votes recorded" value={headline.tallyVotes} sub={`${headline.unanimousPct}% unanimous`} />
        <Tile label="Agenda items" value={headline.agendaItems.toLocaleString()} sub={`across ${headline.agendaed} agendas`} />
      </div>

      <Section
        id="floor"
        title="Who holds the floor"
        lede="Turns at the microphone per member, summed across every sitting with a minutes digest. Includes points of order."
        caveat="A turn is one speaker header in the official minutes. Members who resume after a chair interruption get a second header, so the count overstates distinct speeches slightly. The Speaker and Deputy Speaker are excluded while presiding."
      >
        <div className="grid md:grid-cols-[2fr_1fr] gap-6">
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-4">
            {top.map((r, i) => (
              <Bar
                key={r.mp.id}
                to={`/mps/${r.mp.id}`}
                label={<><span className="text-outline tabular-nums w-6 shrink-0">{i + 1}</span><span className="truncate">{r.mp.name}</span><PartyTag partyId={r.mp.partyId} /><span className="text-outline text-label-sm truncate hidden sm:inline">{constituencyById(r.mp.constituencyId)?.name}</span></>}
                value={r.turns}
                max={maxTurns}
                sub={`${r.sittingsSpoken} sittings`}
              />
            ))}
            <button type="button" onClick={() => setShowAll(!showAll)} className="mt-3 text-primary font-label-bold text-label-sm hover:underline">
              {showAll ? 'Show top 15' : `Show all ${floorTime.length} members`}
            </button>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-4">
              <h3 className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant mb-2">Turns per member, by party</h3>
              {floorByParty.map((p) => (
                <Bar key={p.partyId} label={<><PartyTag partyId={p.partyId} /><span>{partyById(p.partyId)?.name}</span></>} value={Math.round(p.perMember)} max={Math.round(floorByParty[0].perMember)} sub={`${p.members} MPs`} />
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-4">
              <h3 className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant mb-2">Not yet recorded speaking</h3>
              <p className="text-sm text-on-surface-variant mb-2">{silentMPs.length} of {floorTime.length} active members have no turn in the {minuted.length} digested sittings.</p>
              <ul className="text-sm space-y-1">
                {silentMPs.map((m) => (
                  <li key={m.id}><Link to={`/mps/${m.id}`} className="text-primary hover:underline">{m.name}</Link> <span className="text-outline">· {constituencyById(m.constituencyId)?.name}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="attendance"
        title="How many members turn up"
        lede="Members present at the opening roll call of each sitting, as announced by the chair."
        caveat="The opening count is taken minutes after the sitting starts. Vote-time counts later in the same sitting are usually 15 to 30 higher as members arrive. Sittings without a legible count are skipped."
      >
        <AttendanceChart />
      </Section>

      <Section
        id="terms"
        title="Session scorecard"
        lede="What each term of the 20th Majlis scheduled, debated and decided."
        caveat="Agenda counts come from the translated agendas (all sittings). Votes, decisions and speakers come from minutes digests, so terms with fewer digested sittings undercount."
      >
        <div className="overflow-x-auto bg-white rounded-2xl border border-outline-variant/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-label-sm uppercase text-outline border-b border-outline-variant/30">
                {['Term', 'Sittings', 'Digested', 'Bill items', 'Questions', 'Reports', 'Votes', 'Passed', 'Failed', 'Unanimous', 'Decisions', 'MPs spoke', 'Median present'].map((h) => (
                  <th key={h} className="px-3 py-2 font-label-bold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {termCards.map((t) => (
                <tr key={t.term} className="border-b border-outline-variant/20 last:border-0">
                  <td className="px-3 py-2 font-label-bold text-on-surface whitespace-nowrap">{t.term}</td>
                  {[t.sittings, t.minuted, t.billItems, t.questionItems, t.reportItems, t.votes, t.passed, t.failed, `${t.unanimousPct}%`, t.decisions, t.speakers, t.medianPresent ?? '—'].map((v, i) => (
                    <td key={i} className="px-3 py-2 tabular-nums text-on-surface-variant">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        id="votes"
        title="How the chamber votes"
        lede={`${tallyVotes.length} votes with recorded counts in the minutes. ${headline.unanimousPct}% had no votes against and no abstentions. ${failedVotes.length} did not pass.`}
        caveat="These are tallies announced by the chair, not per-member records. Per-member roll calls for bills are on the Votes page."
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant mb-2">Closest votes</h3>
            <div className="space-y-2">{closestVotes.map((v, i) => <VoteRow key={i} v={v} />)}</div>
          </div>
          <div>
            <h3 className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant mb-2">Did not pass</h3>
            <div className="space-y-2">{failedVotes.slice(0, 8).map((v, i) => <VoteRow key={i} v={v} />)}</div>
            {failedVotes.length > 8 && <p className="text-label-sm text-outline mt-2">Showing 8 of {failedVotes.length}.</p>}
          </div>
        </div>
      </Section>

      <Section
        id="questions"
        title="Which ministers face questions"
        lede={`${questionItemsTotal} question items scheduled across all agendas, grouped by the ministry named.`}
        caveat="Grouped by the “Minister of …” phrase in the translated agenda item, so a ministry renamed mid-term appears twice. Written questions answered in the chamber are included."
      >
        <div className="bg-white rounded-2xl border border-outline-variant/30 p-4">
          {questionsByMinistry.slice(0, 15).map((q) => (
            <Bar key={q.ministry} label={q.ministry} value={q.count} max={questionsByMinistry[0]?.count ?? 1} />
          ))}
        </div>
      </Section>

      <Section
        id="nominations"
        title="Nominations and removals"
        lede={`${nominationVotes.length} votes on presidential nominees, commission members, judges and dismissals, newest first.`}
        caveat="Selected by keyword from the vote description in the minutes. Nominees sent to committee without a vote are on each sitting's agenda, not here."
      >
        <div className="grid md:grid-cols-2 gap-2">{nominationVotes.slice(0, 16).map((v, i) => <VoteRow key={i} v={v} />)}</div>
        {nominationVotes.length > 16 && <p className="text-label-sm text-outline">Showing 16 of {nominationVotes.length}.</p>}
      </Section>

      <Section
        id="committees"
        title="Where business gets sent"
        lede="How often each standing committee is named as the destination of a bill, nominee or report in the minutes."
        caveat="Counted by matching committee names in the English digest. Sub-committees and select committees are excluded. A committee named in two decisions of one sitting counts twice."
      >
        <div className="bg-white rounded-2xl border border-outline-variant/30 p-4">
          {committeeReferrals.slice(0, 12).map((c) => (
            <Bar key={c.committeeId} to={`/committees/${c.committeeId}`} label={c.name} value={c.count} max={committeeReferrals[0]?.count ?? 1} />
          ))}
        </div>
      </Section>

      <Section
        id="chair"
        title="Who presides"
        lede="Sittings chaired by the Speaker versus a Deputy Speaker, from the chair named in each minutes digest."
        caveat="A sitting where the Deputy Speaker took over after a recess counts under whoever the digest names first. Sittings whose digest names no chair are listed as unnamed."
      >
        <div className="grid grid-cols-3 gap-4 max-w-xl">
          <Tile label="Speaker" value={presiding.speaker} />
          <Tile label="Deputy Speaker" value={presiding.deputy} />
          <Tile label="Not named" value={presiding.unnamed} />
        </div>
      </Section>
    </Container>
  )
}
