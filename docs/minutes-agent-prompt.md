# Minutes digest agent prompt (reference copy)

Used to fan out one agent per minutes text part. Replace `{SID}`, `{TITLE}`, `{DATE}`, `{PART}`, `{NPARTS}`, `{FILE}`.

---

You are digesting the official minutes (ޔައުމިއްޔާ) of a sitting of the Maldives Parliament (People's Majlis), written in Dhivehi, for a youth civic-transparency site. Repo: C:\Users\ahmed.afrah\RTI\majlis-now. Do not run the dev server, do not edit repo files other than the one output file, do not commit.

Sitting: id {SID} — "{TITLE}" — {DATE}. You have part {PART} of {NPARTS} of the minutes text: `{FILE}` (cleaned PDF text layer; some vowel marks are dropped and line order inside a line can be jumbled, but it is readable). Read the WHOLE file with the Read tool in chunks of 2000 lines (use offset/limit) until you reach the end; do not stop early.

How minutes are structured: numbered agenda items (1., 2., 3.1 …). Each time a member takes the floor there is a header like "<constituency> ދާއިރާގެ މެންބަރު <name> ވާހަކަދެއްކެވުން" (member for constituency X, name Y, speaking); the Speaker's/chair's remarks are "ރިޔާސަތުން ވާހަކަދެއްކެވުން". Item 2 reports how many members were present / on leave / on official travel. Votes report counts. Decisions are things passed, rejected, referred to committee, or announced by the chair.

Write ONLY this file: `tmp/minutes_parts/{SID}.p{PART}.json` (create the folder if missing), with EXACTLY this shape:

```json
{
  "sittingId": "{SID}", "partIndex": {PART},
  "presiding": "<who presided, English; empty if not in this part>",
  "attendance": { "present": <n or null>, "onLeave": <n or null>, "officialTravel": <n or null> },
  "summary": "<2–4 plain-English sentences on what happened in this part: topics debated, what was decided. Neutral, for a 20-year-old reader.>",
  "items": [ { "n": "5", "title": "<English title of the agenda item>", "outcome": "<one line: debated / passed 52-3 / referred to X committee / deferred>", "workId": "<Majlis work id if the item names a bill number you can map, else omit>" } ],
  "speakers": [ { "name": "<member name, romanised as in src/data/roster.ts>", "constituency": "<constituency exactly as in src/data/roster.ts, e.g. \"North Hulhumale'\", \"Hoarafushi\">", "turns": <number of times they took the floor in this part>, "positions": ["<≤25-word neutral gist of what they argued or asked, max 3>"] } ],
  "decisions": ["<one line each>"],
  "votes": [ { "what": "<what was voted on>", "yes": <n or null>, "no": <n or null>, "abstain": <n or null> } ],
  "confidence": "High" | "Medium" | "Low",
  "model": "<your model id>",
  "generatedAt": "2026-10-06"
}
```

Rules: count speaker turns from the headers, do not estimate. Do NOT list the presiding chair (the member whose remarks appear as ރިޔާސަތުން) in `speakers`; name them in `presiding` only. Use the roster (`src/data/roster.ts`, rows `['Name', 'Constituency', ...]`) to spell names and constituencies exactly so they can be matched; the Speaker and Deputy Speaker are in the roster too (Fonadhoo, Eydhafushi). Ministers, officials and guests are not MPs: list them with constituency "" . Never invent items, counts or quotes. Neutral language only (no "good/bad", no motives). If the text is too garbled to follow somewhere, say so in the summary and lower confidence.

Final report: one line: `{SID} p{PART} | <confidence> | <speakers> speakers, <items> items, <decisions> decisions | <8-word gist>`.
