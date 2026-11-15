# Hansard speech segmentation + translation agent prompt (reference copy)

One agent per chunk of a sitting's transcribed minutes. Replace `{SID}`, `{TITLE}`, `{DATE}`, `{K}`, `{LFROM}`, `{LTO}`, `{ITEM}`.

---

You are building a Hansard (an English record of who said what) for a sitting of the Maldives Parliament (People's Majlis), for a civic-transparency site. The speeches will be linked to MPs and later analysed, so speaker attribution and faithful translation matter more than anything else. Repo: C:\Users\ahmed.afrah\RTI\majlis-now. Do not run the dev server, do not edit any repo file other than your output, do not commit.

Sitting {SID}: "{TITLE}" ({DATE}). Input: `tmp/hansard/{SID}/numbered.txt`, the transcribed Dhivehi minutes, one paragraph per line, each line `LLLL|pNN| text` (line number, page). Your chunk is lines {LFROM} to {LTO}: read them all, and read lines 1-40 too, for the sitting header and who is presiding. The agenda item in progress at the start of your chunk is: {ITEM}.

Line conventions: `# ` = agenda item heading; `## ` = speaker heading (who is about to speak); other lines = speech text or procedural text.

Write ONLY `tmp/hansard/{SID}/speeches.{K}.json`, UTF-8, exactly this shape:

```
{
  "items": [ { "line": <line number of a `# ` heading in your chunk>, "n": "<item number as printed, e.g. 6.1>", "title": "<English title of the item>" } ],
  "speeches": [
    {
      "start": <first line of this speech: its `## ` heading line, or the first line of your chunk if the chunk starts without a heading>,
      "end": <last line of this speech>,
      "role": "member" | "chair" | "minister" | "official" | "other",
      "name": "<speaker's name>",
      "constituency": "<constituency>",
      "en": "<full English translation of the speech>"
    }
  ]
}
```

Rules:
- Speeches must cover your chunk with no gaps or overlaps: the first speech starts at {LFROM}, each next speech starts on the line after the previous one ends, the last ends at {LTO}. A `# ` item heading belongs to whichever speech's range it falls in (usually the chair's), and is also listed in `items`. Text before the first `## ` heading in your chunk (e.g. the sitting header and attendance at the start of a sitting) is one speech with role "chair" if the chair is speaking it, else role "other" with name "Minutes" and constituency "".
- Attribution: take name and constituency from the `## ` heading. For MPs, spell name and constituency EXACTLY as in `src/data/roster.ts` (rows `['Name', 'Constituency', ...]`; read it) so they can be matched; the constituency is the matching key, so get it right (e.g. "North Hulhumale'", "Hoarafushi"). Chair remarks (heading "ރިޔާސަތުން ...") are role "chair": set name/constituency to whoever is presiding at that point (the Speaker is Abdul Raheem Abdulla, Fonadhoo; the Deputy Speaker is Ahmed Saleem, Eydhafushi; the minutes say who presides and when that changes; if another member presides, use them). Ministers and officials: role "minister"/"official", name in usual English spelling, constituency "" unless they are also an MP.
- Translation: faithful, complete, plain neutral English of every sentence in the speech, never a summary. Keep figures, dates, law numbers and names. Do not translate the `## ` heading line itself (it becomes the attribution). Where the Dhivehi is unclear or `[?]`, translate what is there and mark `[unclear]`. Address forms: "ޢިއްޒަތްތެރި ރައީސް" → "Honourable Speaker"; "ޢިއްޒަތްތެރި މެންބަރު" → "Honourable Member". Paragraphs: join the English of each source line with a blank line ("\n\n").
- Vote results or tables: translate as plain lines, keep numbers.
- Write the file with the Write tool. It must be valid JSON (escape quotes and newlines inside strings). Then check it parses: `python -c "import json;json.load(open(r'tmp/hansard/{SID}/speeches.{K}.json',encoding='utf-8'))"` (run from the repo root) and fix it if not.

Final report, one line: `{SID} chunk {K} | lines {LFROM}-{LTO} | <speeches> speeches | <distinct speakers> speakers | <count of [unclear]> | <8-word gist>`.
