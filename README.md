# Majlis Now

A youth-focused civic transparency platform for the Maldives Parliament. It answers, in under a minute:

> **What is Parliament doing now, why does it matter, and how did my MP act?**

## Data provenance

This prototype uses a **two-tier** dataset, clearly distinguished in the UI (a persistent banner) and in the data layer:

- **Real (from the official source):** the entire 20th Majlis **MP roster** — names, constituencies, parties, official **photos**, leadership roles, and profile links — taken from [majlis.gov.mv/en/20-parliament/members](https://majlis.gov.mv/en/20-parliament/members). Atoll groupings are derived (best-effort); the constituency name is authoritative.
- **Real votes (sourced from official PDFs):** each bill's page (e.g. `parliament-work/1845`) links a **vote-record PDF** giving the member-by-member roll call. **7 real roll-call votes** are integrated (Land Act, Land Transport, two Constitution amendments, Decentralization, Pension, Employment) — each with real counts, a searchable member table, party split, and per-member results that surface on each MP's profile. Votes carry `provenance: 'official-rollcall'`; the UI shows an **"Official record"** badge and a real table. Data lives in `src/data/realRollcalls.ts` (generated) → built into `Bill`/`Vote` objects in `src/data/realData.ts`.
- **Illustrative samples (clearly labelled):** the remaining bills, votes, Parliament Signals, and committee activity. Where a real source isn't wired yet, the app **never attributes a vote or attendance figure to a real, named MP** — it shows an honest "not yet open data" / "illustrative sample" notice instead.

### Adding more real votes (pipeline)

The vote PDFs are **scanned images** (no text layer), so the roll call is OCR'd ([RapidOCR](https://github.com/RapidAI/RapidOCR)), then mapped to the roster **by constituency** with a self-checking script. The whole batch is automated:

```bash
python scripts/build_real_votes.py   # downloads, OCRs, maps, validates, emits src/data/realRollcalls.ts
```

Per bill it: fetches the work page → gets the "Votes" PDF → renders pages at 300 dpi → OCRs the `ID · Name · Constituency · Result` table (`scripts/extract_vote.py`, column split by x-position) → normalises each romanized constituency to a roster slug → and **asserts the row tally matches the printed summary** on the PDF. Add more bills by appending to the `BILLS` list in the script.

All 7 bills processed: **every row maps, 0 unmapped**, and Yes/No counts match the official summaries exactly (e.g. Land Act 10/49, Decentralization 44/5, Pension 51/0).

## Stack

- **React 18 + TypeScript**
- **Vite** (SPA) + **React Router**
- **Tailwind CSS** — the design system (colours, fonts, spacing, radii) is ported verbatim from the Google Stitch export so the build matches the reference screens.
- **Montserrat** (headings) / **Inter** (body) / **Material Symbols** (icons)

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
npm run preview  # preview the production build
```

## What's built

| Area | Route | Notes |
| --- | --- | --- |
| Briefing Room (home) | `/` | Hero briefing, "Key things to know", Parliament Signals, Find-your-MP, activity feed, themes |
| Bill tracker | `/bills`, `/bills/:id` | Sticky legislative timeline, process-signal cards, documents, CSV export |
| Votes | `/votes`, `/votes/:id` | Result tiles, plain-language "what it decided", party alignment, searchable MP vote table |
| MPs | `/mps`, `/mps/:id` | Find-your-MP, attendance rings, **action-based** issue voting record, activity timeline |
| Compare MPs | `/compare` | Side-by-side records (records & patterns, never a "good/bad" rank) |
| Issues & themes | `/issues`, `/issues/theme/:id`, `/issues/:id` | 10 themes, decision points, related bills/votes |
| Committees | `/committees`, `/committees/:id` | Membership, meetings, stalled-item signals |
| Search | `/search` | Global search across bills, MPs, votes, committees, issues |

## Design & editorial principles

- **Evidence-first, non-partisan.** Signals use neutral process language ("unusually fast", "no visible movement") — never "corrupt"/"suspicious". MPs get records, not scores.
- **Honest about data.** A persistent banner marks the dataset as mock; every data card carries Source · Last updated · Confidence · Report issue.
- **No fabricated likenesses or sentiment.** MP avatars render initials (official photos slot in from majlis.gov.mv). The Stitch "sentiment/NLP" cards were replaced with evidence-based voting records, since no verified sentiment source exists.

## The Parliament Signals engine

`src/utils/signals.ts` implements the brief's fixed thresholds (fast / slow / stalled / committee-delay / high-absence) and neutral severity language (Watch / Concern / High concern). `computeBillSignals()` derives signals directly from raw timeline data; the mock dataset also carries authored signals with richer copy.

## Project structure

```
src/
  types/        # all entity models (MP, Bill, Vote, Committee, Issue, Signal, …)
  data/         # mock dataset + cross-entity selectors (index.ts is the access layer)
  utils/        # signal engine, date/format helpers, classnames, accent map
  components/   # layout/ ui/ cards/ signals/ bills/ votes/ mps/
  pages/        # one file per route
```

## Replacing mock data with real data

Swap the modules in `src/data/*` (or point `src/data/index.ts` at an API). All components read through that layer and the typed models in `src/types`, so the UI is decoupled from the data source. Source/confidence/last-updated fields already exist on every record.

> Reference design: Google Stitch project `17463183999104694968` (Home, Bill Tracker, Vote Detail, MP Profile).
