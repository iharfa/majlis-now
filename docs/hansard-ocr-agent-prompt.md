# Hansard (sitting minutes) OCR agent prompt (reference copy)

One agent per page range of a sitting's minutes. Replace `{SID}`, `{TITLE}`, `{DATE}`, `{FROM}`, `{TO}`.

---

You are transcribing the official verbatim minutes (ޔައުމިއްޔާ) of a sitting of the Maldives Parliament (People's Majlis), written in Dhivehi (Thaana script), to build a Hansard (who said what) for a civic-transparency site. Repo: C:\Users\ahmed.afrah\RTI\majlis-now. Do not run the dev server, do not edit any repo file other than your outputs, do not commit.

Sitting {SID}: "{TITLE}" ({DATE}). Pages {FROM} to {TO}. In `tmp/hansard/{SID}/` each page N has:
- `pNN.png` — the page image. THIS IS THE AUTHORITY.
- `pNN.layer.txt` — the PDF's own text layer. It has most of the right characters but known faults: some vowel marks (fili, especially ު) are dropped, a line's final fili and full stop are pulled to the start of the line, brackets are reversed, digits and Latin text are displaced, and line order can be jumbled. Its consonant letters are the PDF's real characters: if your reading of a word's letters (not its fili) disagrees with a complete word in the layer, use the layer's letters. Use the image for fili, order and layout.

For each page, in order: Read the PNG, read the layer text, then write `tmp/hansard/{SID}/pNN.txt` with the corrected transcription of that page, before moving to the next page (so partial work survives).

Transcription rules:
- Exact Dhivehi as printed, in Unicode Thaana, with every fili. Keep numerals, Latin text and punctuation as printed. Never summarise, never skip speech text.
- One line per printed paragraph (join lines that wrap mid-sentence).
- SPEAKER HEADINGS are critical. Every heading that introduces who is speaking (e.g. "<constituency> ދާއިރާގެ ޢިއްޒަތްތެރި މެންބަރު <name> ވާހަކަދެއްކެވުން", "ރިޔާސަތުން ވާހަކަދެއްކެވުން", a minister or official speaking) goes on its own line starting with `## `, exactly as printed. Agenda item headings (e.g. "6. ..." , "6.1 ...") go on their own line starting with `# `. Other headings (sitting title on page 1, time stamps such as "[09:00]") on their own line as printed.
- A paragraph that continues from the previous page simply starts the file; do not add a heading for it.
- Tables (e.g. vote results, attendance): write each row as `| cell | cell |`, right-to-left cell order as printed.
- Skip the repeated running header (sitting/date line at the top), page numbers and the seal/stamp. Signatures: `[signature]`.
- If a word is genuinely unreadable in the image and the layer text does not settle it, write `[?]`. Never invent or "improve" wording; do not translate.

If you crop or zoom images, keep every scratch file in a subfolder of your scratchpad named `hansard_{SID}_{FROM}/`; other agents share the scratchpad.

Finish by checking every `pNN.txt` from {FROM} to {TO} exists. Final report, one line: `{SID} p{FROM}-{TO} | <pages done> | <count of [?]> | <speaker headings found> | <one-line note on quality>`.
