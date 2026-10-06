"""OCR every roll-call vote PDF referenced in src/data/works.json, map rows to
the roster by constituency, validate the tally against the PDF's printed
summary, and emit src/data/realRollcalls.ts.

Vote PDFs are labelled on each work page, which tells us what the vote was:
  "Bill accepted by vote"      -> voteType "acceptance" (first reading: take the bill up)
  "Bill passed at parliament"  -> voteType "passage"
  "Bill rejected by vote"      -> voteType "passage"
The result is derived from the counted rows (yes > no), never from page text.

Run from repo root (after fetch_works.py): python scripts/build_real_votes.py
"""
import json, os, re, sys
from majlis import ROOT, TMP, iso_date, roster_constituencies, slug, speaker_constituency
from extract_vote import parse_rollcall

WORKS = os.path.join("src", "data", "works.json")
OUT = os.path.join("src", "data", "realRollcalls.ts")
CACHE = os.path.join(TMP, "rollcalls")  # OCR results per PDF (OCR is slow)

VOTE_LABELS = {
    "bill accepted by vote": "acceptance",
    "bill passed at parliament": "passage",
    "bill rejected by vote": "passage",
}

MYSLUGS = {slug(c) for c in roster_constituencies()}
SPEAKER_SLUG = slug(speaker_constituency() or "")
ALIAS = {"vilufushi": "vilifushi", "gamu": "gan", "addumeedhoo": "addu-meedhoo",
         "fares-maathoda": "faresmaathodaa", "faresmaathoda": "faresmaathodaa",
         "villimale": "vilimale", "lhavandhoo": "ihavandhoo"}
DIRS = {"uthuru": "North", "dhekunu": "South", "medhu": "Central", "hulhangu": "West"}
CHOICE = {"Yes": "Yes", "No": "No", "Abstain": "Abstain",
          "Not Present": "Absent", "Not Voted": "Absent", "No voting right": "Absent"}

# Theme from the bill title. Checked in order, whole words only ("land" must not
# match "Islands"). Falls back to governance.
THEME_RULES = [
    (r"\btransport\b", "economy"), (r"\bland\b|\bhousing\b|\bresidency\b|\bislands and lagoons\b", "housing"),
    (r"\bconstitution\b|\basset recovery\b", "governance"), (r"\bdecentraliz", "councils"),
    (r"\bpension\b|\bhealth\b|\beducation\b", "welfare"),
    (r"\bemployment\b|\bexport\b|\bimport\b|\btourism\b|\btax\b|\bcurrency\b|\bpayment\b|\butility\b|\bdigital transformation\b", "economy"),
    (r"\bfisheries\b|\bwaste\b|\benvironment\b|\bclimate\b", "environment"),
    (r"\bpenal\b|\bcriminal\b|\bsexual\b|\bpolice\b|\bcourt", "justice"),
    (r"\bnational service\b|\bimmigration\b|\bsecurity\b(?! bill)", "security"),
    (r"\bdata protection\b|\bdigital identity\b|\bcyber\b|\bmedia\b|\bspeech\b", "media"),
]


def theme_of(title):
    t = title.lower()
    return next((th for rx, th in THEME_RULES if re.search(rx, t)), "governance")


def norm_con(con):
    con = re.sub(r"(Uthuru|Dhekunu|Medhu|Hulhangu)", r" \1 ", con)
    con = re.sub(r"^l(havandhoo|sdhoo|nguraidhoo)", r"I\1", con, flags=re.I)
    toks = con.replace("'", "").split()
    d = next((DIRS[t.lower()] for t in toks if t.lower() in DIRS), None)
    base = " ".join(t for t in toks if t.lower() not in DIRS)
    s = slug(f"{d} {base}" if d else base)
    return ALIAS.get(s, s)


def ocr(pdf_path, dpi=300):
    os.makedirs(CACHE, exist_ok=True)
    key = os.path.join(CACHE, os.path.basename(pdf_path) + (".json" if dpi == 300 else f".{dpi}.json"))
    if os.path.exists(key):
        return json.load(open(key, encoding="utf-8"))
    data = parse_rollcall(pdf_path, dpi=dpi)
    json.dump(data, open(key, "w", encoding="utf-8", newline="\n"), ensure_ascii=False)
    return data


def build(work, doc, vote_type, dpi=300):
    data = ocr(doc["file"], dpi)
    mapped, unmapped, seen = [], [], set()
    for r in data["rows"]:
        res, con = r["result"], r["constituency"]
        if res == "No voting right":
            continue  # the presiding Speaker's line on an ordinary vote
        if not con.strip():
            # The Speaker's line has no constituency cell. On votes where the Speaker
            # is eligible (e.g. constitutional amendments) it carries a real result,
            # which belongs to the Speaker's own seat.
            if res in CHOICE and SPEAKER_SLUG:
                con = SPEAKER_SLUG
            else:
                continue
        cslug = norm_con(con)
        if cslug not in MYSLUGS:
            unmapped.append((con, cslug, res)); continue
        if cslug in seen:
            continue
        seen.add(cslug)
        mapped.append({"constituencyId": cslug, "choice": CHOICE[res], "detail": res})
    tally = {k: sum(1 for m in mapped if m["choice"] == k) for k in ("Yes", "No", "Abstain", "Absent")}
    # The PDF's printed summary box gives "Yes" and "Voted" (= yes + no + abstain);
    # the "No" line is not reliably OCR'd. Validate against what is there.
    summary = data["summary"]
    voted = tally["Yes"] + tally["No"] + tally["Abstain"]
    ok = (
        not unmapped
        and summary.get("Yes", tally["Yes"]) == tally["Yes"]
        and summary.get("Voted", voted) == voted
        and ("Yes" in summary or "Voted" in summary)
    )
    date = iso_date(data.get("date"))
    if not date:
        # fall back to the latest related sitting; never a silent made-up date
        dates = [s["date"] for s in work["sittings"] if s["date"]]
        date = max(dates) if dates else None
    result = "Passed" if tally["Yes"] > tally["No"] else "Rejected"
    print(f"{work['id']} {vote_type:10} {'OK' if ok else '*** MISMATCH ***'} {result:8} yes={tally['Yes']}({summary.get('Yes')}) "
          f"no={tally['No']} abstain={tally['Abstain']} voted={voted}({summary.get('Voted')}) absent={tally['Absent']} "
          f"rows={len(mapped)} date={date} unmapped={unmapped}")
    if not ok and dpi == 300 and not data.get("legacy"):
        return build(work, doc, vote_type, dpi=450)  # one retry: a sharper render often fixes a dropped row
    if not ok or not date:
        return None
    return {
        "id": f"{work['id']}-{vote_type}", "workId": work["id"], "voteType": vote_type,
        "title": work["title"], "theme": theme_of(work["title"]), "result": result, "date": date,
        "yes": tally["Yes"], "no": tally["No"], "abstain": tally["Abstain"], "absent": tally["Absent"],
        "votePdf": doc["url"], "workUrl": work["url"], "rows": mapped,
    }


def emit(records):
    def rows(rs):
        return "".join(f"\n      {{ constituencyId: {json.dumps(r['constituencyId'])}, choice: {json.dumps(r['choice'])}, detail: {json.dumps(r['detail'])} }}," for r in rs)
    blocks = []
    for r in records:
        head = "".join(f"    {k}: {json.dumps(r[k])},\n" for k in ("id", "workId", "voteType", "title", "theme", "result", "date"))
        blocks.append(f"  {{\n{head}    yes: {r['yes']}, no: {r['no']}, abstain: {r['abstain']}, absent: {r['absent']},\n"
                      f"    votePdf: {json.dumps(r['votePdf'])},\n    workUrl: {json.dumps(r['workUrl'])},\n    rows: [{rows(r['rows'])}\n    ],\n  }},")
    ts = ("// AUTO-GENERATED by scripts/build_real_votes.py from official Majlis vote PDFs.\n"
          "// Each entry is a real, sourced roll-call vote (OCR'd, mapped by constituency,\n"
          "// and validated so row tallies match the printed summary on the PDF).\n"
          "import type { VoteChoice } from '@/types'\n\n"
          "export type VoteType = 'acceptance' | 'passage'\n"
          "export interface RealRollcallRow { constituencyId: string; choice: VoteChoice; detail: string }\n"
          "export interface RealRollcall {\n"
          "  id: string; workId: string; voteType: VoteType; title: string; theme: string\n"
          "  result: 'Passed' | 'Rejected'; date: string\n"
          "  yes: number; no: number; abstain: number; absent: number\n"
          "  votePdf: string; workUrl: string; rows: RealRollcallRow[]\n}\n\n"
          "export const REAL_ROLLCALLS: RealRollcall[] = [\n" + "\n".join(blocks) + "\n]\n")
    open(OUT, "w", encoding="utf-8", newline="\n").write(ts)


if __name__ == "__main__":
    works = json.load(open(WORKS, encoding="utf-8"))
    only = set(sys.argv[1:])  # optional work ids to (re)process
    records, failed = [], []
    for w in works:
        if only and w["id"] not in only:
            continue
        for d in w["documents"]:
            vt = VOTE_LABELS.get(d["label"].strip().lower())
            if not vt:
                continue
            rec = build(w, d, vt)
            (records if rec else failed).append(rec or (w["id"], vt))
    records.sort(key=lambda r: (r["date"], r["workId"]), reverse=True)
    emit(records)
    print(f"\nwrote {OUT}: {len(records)} roll calls; failed validation: {failed}")
    sys.exit(1 if failed else 0)
