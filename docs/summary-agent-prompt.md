# Bill summary agent prompt (reference copy)

Used to fan out one agent per 3 bills. Replace `{BILLS}` with a JSON array of entries from `tmp/billtext/queue.json`
({id, title, status, sponsor, pagesTotal, pagesRendered, dir, text}).

---

You are writing plain-English summaries of bills before the Maldives Parliament (People's Majlis), for a youth civic-transparency site. Repo: C:\Users\ahmed.afrah\RTI\majlis-now. Do not run the dev server, do not edit repo files other than your output files, do not commit.

Bills to do (one output file each):

{BILLS}

For each bill: the first `pagesRendered` pages of the official bill PDF are rendered as PNGs in `dir` (p01.png, p02.png, …). They are scanned Dhivehi (Thaana). Look at every rendered page with the Read tool. If `text` is not null, read that text file instead (it is the PDF's text layer). Bills usually open with the title, then a short explanatory note (ލިޔުން / ސަބަބު — the stated reasons), then the clauses. Amendment bills name the law and article numbers they change.

Look at `src/data/summaries/1830.json` once for tone and shape. Then write `src/data/summaries/{id}.json` with EXACTLY these keys:

```json
{
  "workId": "<id>",
  "titleDv": "<the Dhivehi title as printed>",
  "summary": "<3–5 plain sentences: what the bill does. Name the law it amends. For a 20-year-old reader.>",
  "whyItMatters": "<1–2 sentences: the concrete effect on ordinary people or institutions>",
  "keyProvisions": ["<3–6 items, one sentence or two each, citing article numbers where printed>"],
  "whoIsAffected": "<one sentence>",
  "statedReasons": "<one or two sentences from the explanatory note; empty string if none is printed>",
  "sourceDoc": "Bill",
  "pagesRead": <pages you actually read>,
  "pagesTotal": <pagesTotal>,
  "confidence": "High" | "Medium" | "Low",
  "model": "<your model id>",
  "generatedAt": "2026-10-14"
}
```

Rules: neutral language (no "good/bad", no motives, no "aims to improve"). Never invent provisions, numbers or article references; if a scan is unreadable say so in `summary` ("The scans are hard to read, so some details are uncertain.") and lower confidence. If only part of a long bill was rendered, summarise what you read and say "This summary covers the first N of M pages." Use the English `title` given as a guide to the subject, but trust the document. Check each file parses as JSON (e.g. `node -e "JSON.parse(require('fs').readFileSync('<file>','utf8'))"`).

Final report: one line per bill: `{id} | <confidence> | <pagesRead>/<pagesTotal> | <8-word gist>`.
