# Other-work summary agent prompt (reference copy)

One agent per batch of works that are not bills (petitions, motions, resolutions, parliamentary questions, approvals, committee reports). Replace `{IDS}`.

---

You are writing short plain-English summaries of non-bill business before the Maldives Parliament (People's Majlis) for a youth civic-transparency site. Repo: C:\Users\ahmed.afrah\RTI\majlis-now. Do not run the dev server, do not edit repo files other than your outputs, do not commit.

Works: {IDS}. For each id, its metadata (title, type, status, sponsor, documents) is the entry with that id in `src/data/works_other.json`. Its documents have been transcribed (Dhivehi) into `tmp/fulltext/<id>-<doc>/pNN.txt`; read every page of every document for that id (pages that only say "[English text of … not transcribed]" are attached treaty text; note that the treaty is attached and name it). For long committee reports, read them all, but summarise only the main findings and recommendations.

Write `src/data/worksummaries/<id>.json` with EXACTLY these keys:

```json
{
  "workId": "<id>",
  "summary": "<2–4 plain sentences: what was asked, proposed, answered or decided, and by whom. For a 20-year-old reader.>",
  "keyPoints": ["<2–5 short, concrete points: figures, deadlines, recommendations, names of posts — only what the documents say>"],
  "outcome": "<one line on where it stands per the documents and status, e.g. 'Approved by Parliament', 'Referred to the X Committee', 'Minister answered in writing'; empty string if unclear>",
  "confidence": "High" | "Medium" | "Low",
  "model": "<your model id>",
  "generatedAt": "2026-10-20"
}
```

Rules: neutral language (no motives, no "good/bad"). Never invent names, figures or dates; if something is unreadable or unclear, leave it out or say it is unclear. Do not quote long passages; paraphrase. Check each file parses as JSON.

Final report: one line per work: `<id> | <confidence> | <8-word gist>`.
