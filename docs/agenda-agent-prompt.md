# Agenda translation agent prompt (reference copy)

Used to fan out one agent per batch of sitting agendas. Replace `{BATCH}` with the batch file path.

---

You are translating official sitting agendas (އެޖެންޑާ) of the Maldives Parliament (People's Majlis), written in Dhivehi, into structured English for a youth civic-transparency site. Repo: C:\Users\ahmed.afrah\RTI\majlis-now. Do not run the dev server, do not commit, do not edit any repo file except the output files named below.

Batch file: `{BATCH}` (JSON list). Each entry has `id`, `title`, `date`, `agendaNo`, `workIds` (Majlis work ids this sitting is linked to, may be empty) and `file` (cleaned PDF text layer of the agenda, 2–4 pages, Dhivehi; vowel marks may be dropped and line order can be jumbled, but it is readable). Read `src/data/works.json` once (only `id` and `title` matter) so you can map an item to a work id when the item clearly names that bill and the id is in the sitting's `workIds`. If no clear match, omit `workId`.

For EACH entry in the batch, read its text file in full with the Read tool, then write ONLY `src/data/agendas/{id}.json` with EXACTLY this shape:

```json
{
  "sittingId": "{id}", "date": "{date}", "title": "{title}", "agendaNo": "{agendaNo}",
  "items": [ { "n": 1, "text": "<plain-English rendering of the agenda item, one or two sentences; keep bill names, law numbers, sponsor name and constituency>", "workId": "<only if mapped>", "kind": "procedural" | "bill" | "resolution" | "report" | "vote" | "question" | "other" } ],
  "summary": "<one neutral sentence on what the sitting was scheduled to do, for a 20-year-old reader>",
  "pagesRead": <n>, "pagesTotal": <n>,
  "confidence": "High" | "Medium" | "Low",
  "model": "claude-fable-5-1",
  "generatedAt": "2026-10-07"
}
```

Conventions (match the existing files in `src/data/agendas/`, e.g. 1068.json): items 1–5 are usually the fixed opening (recitation, roll call, agenda announcement, minutes approval, chair announcements) → `kind: "procedural"`. Items that are a bill debate, first reading or committee-stage bill → `bill`. Resolutions → `resolution`. Committee reports / nominee reports → `report`. Ministers' question time → `question`. The voting item → `vote`. Everything else → `other`. Sub-items (6.1, 6.2) become separate entries with the parent integer `n` repeated. `n` is an integer. Never invent items; if the text is too garbled to follow an item, say so in its `text` and lower confidence.

Do not stop early: write every file in the batch. Final report: one line per sitting, `{id} | <confidence> | <items> items | <8-word gist>`, then a final line `batch done: <k> files written`.
