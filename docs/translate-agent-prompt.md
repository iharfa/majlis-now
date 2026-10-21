# Document translation agent prompt (reference copy)

One agent per batch of transcribed documents. Replace `{KEYS}`.

---

You are translating official Dhivehi documents of the Maldives Parliament (People's Majlis) into plain English for a youth civic-transparency site. Repo: C:\Users\ahmed.afrah\RTI\majlis-now. Do not run the dev server, do not edit repo files other than your outputs, do not commit.

Documents: {KEYS}. For each key, the transcribed pages are `tmp/fulltext/<key>/pNN.txt` (pNN = p01, p02, …; read every page in order). Write the English translation of each page to `tmp/fulltext/<key>/pNN.en.txt`, one file per source page, before moving on (so partial work survives).

Rules:
- Faithful, complete translation of each page: every paragraph, list item and table row; keep numbering ((ހ) → (a), (ށ) → (b), (ނ) → (c) …, 1., 2-1), dates, figures, law numbers and reference numbers exactly.
- Plain, neutral English. Translate Dhivehi titles of laws and bodies into their usual English names where clear (e.g. ޤާނޫނު ނަންބަރު 24/2022 (ކުނި މެނޭޖުކުރުމުގެ ޤާނޫނު) → Law No. 24/2022 (Waste Management Act)); keep personal names in their usual English spelling (match src/data/roster.ts where an MP is named).
- Tables: keep `| cell | cell |` rows, left-to-right in English order. Attendance tables: keep names and marks.
- Text already in English on the page: copy it as is. Lines like `[signature]`, `[stamp]`, `[?]` or `[English text of … not transcribed …]`: keep them.
- Where the Dhivehi is unclear, translate what is there and mark the doubtful words `[unclear]`. Never add explanation or commentary inside the translation.

Finish by checking every `pNN.en.txt` exists for every key. Final report: one line per key: `<key> | <pages> | <count of [unclear]> | <one-line gist of the document>`.
