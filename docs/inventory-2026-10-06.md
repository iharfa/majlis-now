# majlis.gov.mv document inventory — 20th People's Majlis

Research snapshot, 6 Oct 2026. Nothing here has been ingested. Raw crawl output (JSON per section) is in the session scratchpad `inventory/` folder.

Method: 4 haiku crawl agents (works by id, sittings by term, committee pages, other sections) plus my own corrections where the agents missed pagination. Page counts come from the 129 PDFs already downloaded plus 3 random samples per document kind, so they are estimates (±20%).

## 1. What exists vs what we have

| Collection | On site | In Majlis Now | Coverage |
| --- | --- | --- | --- |
| Parliament works (all types) | 478 | 28 | 6% |
| of which Bills | 115 | 28 | 24% |
| Bill roll-call vote PDFs (acceptance + final) | 179 | 39 | 22% |
| Other roll-call vote PDFs (motions, resolutions, other) | 71 | 0 | 0% |
| Bill summaries (AI) | 115 bills | 28 | 24% |
| Committee reports on bills | 84 | 0 | 0% |
| Sittings | 212 | 14 | 7% |
| Sitting agendas (translated) | 212 | 14 | 7% |
| Sitting minutes | ~210 | 0 | 0% |
| Point-of-order documents | 110 | 0 | 0% |
| Committees (membership, meetings) | 39 | 39 | 100% |
| Committee attendance reports | 74 | 0 | 0% |
| MP roster + photos | 93 | 93 | 100% |

### Works by type (478, ids 1462–1956)

| Type | Works | Documents | Size | Est. pages |
| --- | --- | --- | --- | --- |
| Bills | 115 | 539 | 1,320 MB | 7,400 |
| Parliamentary Questions | 117 | 201 | 64 MB | 470 |
| Parliamentary Approvals (nominations) | 105 | 385 | 544 MB | 3,350 |
| Other (budgets, impeachments, committee items) | 91 | 198 | 212 MB | 2,800 |
| Emergency Motions | 29 | 62 | 30 MB | 180 |
| Resolutions | 21 | 45 | 33 MB | 185 |
| **Total** | **478** | **1,430** | **2.2 GB** | **~14,300** |

Bills by status: 77 passed, 21 in committee, 9 withdrawn, 6 rejected, 2 at first reading.

### Documents attached to bills (539)

| Kind | Count | Est. pages | Text layer? |
| --- | --- | --- | --- |
| Bill text (as submitted) | 115 | 3,700 | No, scanned |
| Final bill (as passed) | 80 | 1,030 | Yes |
| Committee report | 84 | 1,920 | Mostly (9 of 15 sampled) |
| Roll-call vote record | 179 | 540 | No, scanned |
| Amendment text | 28 | 35 | Yes |
| Amendment vote result | 29 | 90 | No, scanned |
| Notices, proposals, other | 24 | 60 | Mixed |

### Sittings (212)

| Year | Terms | Sittings |
| --- | --- | --- |
| 2024 (from May) | 2nd term, special, 3rd term | 65 |
| 2025 | special, 1st, 2nd, 3rd | 94 |
| 2026 | special, 1st, 2nd, 3rd (ongoing) | 53 |

Every sitting has an Agenda (2–4 pages, text layer) and a Meeting Minutes PDF (mean 44 pages, text layer, Dhivehi). About a quarter also carry a Point of Order PDF (2 pages). Totals: ~570 agenda pages, ~9,300 minutes pages, ~110 point-of-order pages, ~260 MB.

### Other sections

| Section | PDFs | Relevant to 20th Parliament? |
| --- | --- | --- |
| Majlis registry | 203 | Partly (registry notices, undated mix) |
| Point of order | 110 | Yes (same files as on sitting pages) |
| Secretariat regulations | 44 | No (standing rules, general) |
| Secretariat downloads | 16 | No |
| Secretariat resources | 12 | No |
| Special Majlis archive | 272 | No (historical) |
| Committee attendance reports | 74 | Yes |

## 2. What "full ingestion" would take

Measured in this session:

| Step | Measured rate |
| --- | --- |
| Crawl a work or sitting page | ~1 s (cached after first fetch) |
| OCR a scanned vote-record page (RapidOCR, 300 dpi, this laptop) | 26 s per page single process, 17 s per page with two processes |
| Opus agent reading scanned Dhivehi pages and writing a summary | ~14 s and ~6,500 tokens per page; about 2x for "high confidence" (higher-res crops, cross-checking) |
| Opus agent reading text-layer Dhivehi | ~8 s and ~3,000 tokens per page (text can be extracted, no images needed) |

Important limit: RapidOCR cannot read Thaana. It only works for the Latin-script vote records. "Full OCR" of scanned Dhivehi bill texts means a vision model reading page images, which is the expensive path below. 80 of the 115 bills have a text-layer Final Bill, so only 35 bills need their scanned text read.

### By tier

| Tier | Scope | Pages | Agent tokens | Compute wall time (8 parallel agents) | Calendar estimate incl. review |
| --- | --- | --- | --- | --- | --- |
| 0. Scrape + download everything | 478 works, 212 sittings, 2.5 GB | – | – | 1–2 h | half a day |
| 1. Core civic record: all 115 bills (summaries), all 179 bill vote records (OCR), all 212 agendas, 84 bill committee reports | 1,030 text + 1,100 scan (bills), 570 text (agendas), 1,920 text (reports); 540 pages OCR | ~6,600 read + 540 OCR | ~18M (high confidence ~30M) | ~5 h agents + ~4 h OCR | 2–3 days |
| 2. Everything else that is a parliament work: questions & answers, nominations and their reports, resolutions, emergency motions, other motions, remaining 71 vote records | ~3,800 read, 210 OCR | ~15M (high ~25M) | ~4 h + 1.5 h OCR | 2 days |
| 3. Sitting minutes (Hansard-style, who said what) | ~9,300 text | ~30M (high ~45M) | ~6 h | 3–4 days, plus UI work to show speech records per MP |
| 4. Registry, attendance reports, point-of-order | ~1,000 | ~3M | ~1 h | 1 day |
| **All tiers** | | **~21,000 read + 750 OCR** | **~65M tokens (high confidence ~100M)** | **~16 h agents + ~6 h OCR** | **~2 weeks of orchestration + review** |

Notes on the estimate:

- Token figures are Opus input + output as measured today (per-page averages); multiply by the current Opus rate card for cost. Haiku or Sonnet could do the text-layer documents (tiers 3–4) at a fraction of the token cost; scanned Dhivehi needs the strongest vision model to stay high confidence.
- "High confidence" today meant: every page read, higher-resolution crops where the scan is poor, cross-checked against any text layer. 12 of 28 bills reached High; the Low ones were long bills capped at 12 pages. Reading long bills fully (136, 123, 111, 72, 71 pages) is what doubles the cost.
- Calendar time is dominated by batching (agents cap out around 300k tokens each), spot-checking outputs, and fixing OCR validation failures (3 of 39 today needed manual handling).
- Everything scales linearly, so a subset is cheap: e.g. the 2026 session alone (53 sittings, ~45 works) is about one day for tiers 1–2.

## 3. Pipeline changes needed before any of this

- `fetch_works.py` currently reads the listing page (28 bills). It must probe ids (1462 upward) and record all six work types, not just Bills.
- `fetch_sittings.py` must walk `/sittings/term/<id>?page=N` (terms 40–50, up to 4 pages each), and capture Minutes and Point of Order files.
- Vote OCR already generalises: the same PDF layout is used for motion and resolution votes.
- Data model needs new entity types (question, approval/nomination, resolution, motion, sitting minutes) and a "speech" record if minutes are ingested.
- Crawl anomalies to handle: 12 works after id 1462 reference 19th-Parliament sittings (re-submitted bills), and the committee pages publish only attendance reports, nothing else.
