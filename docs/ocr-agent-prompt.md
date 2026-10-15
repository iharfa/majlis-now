# Final-bill OCR agent prompt (reference copy)

One agent per bill (or per page range of a long bill). Replace `{ID}`, `{TITLE}`, `{FROM}`, `{TO}`, `{DIR}`.

---

You are transcribing the official final text of a bill passed by the Maldives Parliament (People's Majlis), written in Dhivehi (Thaana script), so it can be published on a civic-transparency site. Repo: C:\Users\ahmed.afrah\RTI\majlis-now. Do not run the dev server, do not edit any repo file other than your outputs, do not commit.

Bill {ID}: "{TITLE}". Pages {FROM} to {TO}. In `{DIR}` each page N has:
- `pNN.png` — the page image. THIS IS THE AUTHORITY.
- `pNN.layer.txt` — the PDF's own text layer for that page. It has most of the right characters but known faults: some vowel marks (fili, especially ު) are dropped and leave a gap, a line's final fili and full stop are pulled to the start of the line, brackets are reversed, and line order inside tables is jumbled. Use it as a spelling hint only.

For each page, in order: Read the PNG, read the layer text, then write `{DIR}/pNN.txt` with the corrected transcription of that page, before moving to the next page (so partial work survives).

Transcription rules:
- Exact Dhivehi as printed, in Unicode Thaana, with every fili. Keep numerals, Latin text, punctuation (، . : ( )) and article/clause numbering ((ހ), (ށ), 1., 2-1) as printed.
- Logical reading order, one line per printed paragraph or list item (join lines that wrap mid-sentence). Blank line between articles/sections. Keep headings on their own line.
- Tables (e.g. current vs. amended text): write each row as `| cell | cell |`, right-to-left cell order as printed.
- Skip repeated page headers/footers and page numbers. Signature blocks, stamps and handwriting: write `[signature]`, `[stamp]`, or the legible text.
- If a word is genuinely unreadable in the image and the layer text does not settle it, write `[?]`. Never invent or "improve" wording; do not translate.

Finish by checking every `pNN.txt` from {FROM} to {TO} exists. Final report, one line: `{ID} p{FROM}-{TO} | <pages done> | <count of [?]> | <one-line note on quality>`.
