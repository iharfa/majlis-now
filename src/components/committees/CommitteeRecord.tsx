import { DocText } from '@/components/ui/DocText'
import { Icon } from '@/components/ui/Icon'
import { formatDate } from '@/utils/format'
import meetingsJson from '@/data/committeeMeetings.json'
import docTextsJson from '@/data/doctexts.json'

interface Doc { label: string; url: string; key: string }
interface Meeting { id: string; title: string; number: string; date: string | null; summary: string; attendance: Array<{ name: string; constituency: string; status: string }>; documents: Doc[]; url: string }
interface Report { id: string; title: string; documents: Doc[]; url: string }

const record = meetingsJson as Record<string, { meetings: Meeting[]; reports: Report[] }>
const docTexts = docTextsJson as Array<{ key: string; label: string; pages: number; en?: boolean }>

/** Dhivehi transcription and English translation of one committee document, when we have them. */
function DocPair({ doc }: { doc: Doc }) {
  const t = docTexts.find((d) => d.key === doc.key)
  if (!t) {
    return (
      <a href={doc.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-label-sm font-label-bold text-primary hover:underline">
        <Icon name="picture_as_pdf" className="text-[16px]" /> {doc.label} (PDF)
      </a>
    )
  }
  return (
    <div className="space-y-2">
      {t.en && <DocText url={`/doctexts/${doc.key}.en.json`} title={`${doc.label}: English translation`} source={doc.label.toLowerCase()} className="!p-4" />}
      <DocText url={`/doctexts/${doc.key}.json`} title={`${doc.label}: Dhivehi original`} source={doc.label.toLowerCase()} className="!p-4" />
    </div>
  )
}

/** Meetings (with the Majlis's own English summary and attendance) and committee reports, with full texts. */
export function CommitteeRecord({ committeeId }: { committeeId: string }) {
  const r = record[committeeId.replace(/^cmt-/, '')]
  if (!r) return null
  return (
    <>
      {r.reports.length > 0 && (
        <section className="bg-white rounded-2xl border border-outline-variant/30 p-6">
          <h2 className="font-headline-md text-headline-md mb-4">Committee reports</h2>
          <ul className="space-y-4">
            {r.reports.map((rep) => (
              <li key={rep.id} className="space-y-2">
                <a href={rep.url} target="_blank" rel="noreferrer noopener" className="font-label-bold text-on-surface hover:text-primary">{rep.title}</a>
                {rep.documents.map((d) => <DocPair key={d.key} doc={d} />)}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="bg-white rounded-2xl border border-outline-variant/30 p-6">
        <h2 className="font-headline-md text-headline-md mb-1">Meetings</h2>
        <p className="text-label-sm text-on-surface-variant mb-4">Newest first. Summaries are the Majlis's own; agendas and minutes are transcribed and translated by AI. The official PDFs are the authority.</p>
        <ol className="divide-y divide-outline-variant/40">
          {r.meetings.map((m) => {
            const present = m.attendance.filter((a) => a.status === 'Present').length
            return (
              <li key={m.id} className="py-4">
                <details className="group">
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="font-label-bold text-on-surface">{m.title}</span>
                      <span className="text-label-sm text-outline"> · {m.date ? formatDate(m.date) : ''}{m.attendance.length ? ` · ${present} of ${m.attendance.length} present` : ''}</span>
                      {m.summary && <span className="block text-sm text-on-surface-variant mt-1 line-clamp-2 group-open:line-clamp-none">{m.summary}</span>}
                    </span>
                    <Icon name="expand_more" className="text-on-surface-variant transition-transform group-open:rotate-180 shrink-0" />
                  </summary>
                  <div className="mt-3 space-y-3">
                    {m.attendance.length > 0 && (
                      <p className="text-label-sm text-on-surface-variant">
                        <span className="font-label-bold">Attendance:</span>{' '}
                        {m.attendance.map((a) => `${a.name} (${a.status.toLowerCase()})`).join(', ')}
                      </p>
                    )}
                    {m.documents.map((d) => <DocPair key={d.key} doc={d} />)}
                    <a href={m.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-label-sm font-label-bold text-primary hover:underline">
                      <Icon name="open_in_new" className="text-[16px]" /> Meeting page on People’s Majlis
                    </a>
                  </div>
                </details>
              </li>
            )
          })}
        </ol>
      </section>
    </>
  )
}
