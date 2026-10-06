# Majlis Now

A youth-focused civic transparency site for the Maldives Parliament (People's Majlis). It answers, in under a minute:

> **What is Parliament doing now, why does it matter, and how did my MP act?**

Live: https://majlis-now.vercel.app

## What's in it

Everything on the site is built from official majlis.gov.mv records. Nothing is illustrative.

| Data | Source | How it gets here |
| --- | --- | --- |
| MP roster (93 seats, photos, parties, roles) | `/20-parliament/members` | hand-verified table in `src/data/roster.ts`; photos mirrored by `scripts/fetch_photos.py` |
| Bills: title, number, sponsor, status, stage, documents, sittings | each `/parliament-work/<id>` page | `scripts/fetch_works.py` → `src/data/works.json` |
| Roll-call votes (member by member) | the labelled vote PDFs on each work page (scanned images) | `scripts/build_real_votes.py` OCRs them (RapidOCR), maps rows to the roster by constituency, and **asserts the tally matches the PDF's printed summary** → `src/data/realRollcalls.ts` |
| Committees: members, chairs, meetings | `/committee/<id>` pages | `scripts/scrape_committees.py` → `src/data/realCommittees.ts` |
| Sittings + agenda PDFs | `/sittings`, `/sitting/session/<id>` | `scripts/fetch_sittings.py` → `src/data/sittings.json` |
| **Plain-English bill summaries** and **agenda translations** | the Dhivehi bill / agenda PDFs | Claude (Opus) reads the rendered pages and writes `src/data/summaries/<workId>.json`, `src/data/agendas/<sittingId>.json`; each carries confidence, model and date, and the UI labels it "AI translation" |

Two kinds of floor vote are distinguished: **acceptance** (vote to take the bill up — it then goes to committee) and **passage** (the final vote). The result is always derived from the counted rows, never from page text.

## Refreshing the data

```bash
pip install -r scripts/requirements.txt
npm run data:refresh          # fetch_works → fetch_sittings → scrape_committees → build_real_votes
python scripts/build_static.py  # sitemap.xml + og.png
npm run check                   # data integrity checks (also run in CI)
```

`build_real_votes.py` prints one line per vote PDF; `*** MISMATCH ***` means the OCR tally did not match the printed summary and that vote is **not** emitted. Pass work ids to re-run a subset: `python scripts/build_real_votes.py 1944`.

Downloads are cached under `tmp/` (git-ignored). majlis.gov.mv returns 403 to default HTTP clients; `scripts/majlis.py` sends a browser User-Agent.

A GitHub Action (`refresh-data.yml`) runs the scrape weekly and opens a PR for review.

### Translating new documents

`npm run check -- --list-missing` lists bills and sittings with no AI summary yet. For each one, render pages with `python scripts/render_pages.py <pdf> tmp/pages/<pdf-basename> 110 12` (the output folder is keyed by PDF, since a bill can have several), have Claude read them, and write the JSON in the shape of an existing file in `src/data/summaries/` or `src/data/agendas/`. Keep the confidence honest; the UI shows it.

## Stack

React 18 + TypeScript, Vite (route-level code splitting), React Router, Tailwind. Deployed on Vercel from `main`; `vercel.json` sets immutable caching for hashed assets and a CSP.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

## Editorial principles

- **Evidence-first, non-partisan.** Records, not rankings. Neutral process language.
- **Honest provenance.** Every card shows Source · Updated · Confidence · Report issue (a pre-filled GitHub issue). AI-translated text is labelled as such with its confidence.
- **No fabricated likenesses or numbers.** Attendance is derived only from the roll calls we have; the Speaker presides and does not vote.

## Project structure

```
scripts/      # ingestion: majlis.py (fetch helper), fetch_works, fetch_sittings, scrape_committees,
              #   extract_vote + build_real_votes (OCR), render_pages, fetch_photos, build_static, check_data.mjs
src/
  data/       # works.json, sittings.json, realRollcalls.ts, realCommittees.ts, roster.ts,
              #   summaries/*.json, agendas/*.json, realData.ts (builds Bill/Vote/Sitting), index.ts (access layer)
  types/      # entity models
  pages/      # one file per route
  components/ # layout/ ui/ cards/ bills/ votes/ mps/
```
