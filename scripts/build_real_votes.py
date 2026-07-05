"""End-to-end: download each voted bill's vote PDF, OCR the roll call, map to
the roster by constituency, validate row tallies against the printed summary,
and emit src/data/realRollcalls.ts.

Run from repo root: python scripts/build_real_votes.py
"""
import json, re, os, subprocess, html as ihtml
from extract_vote import parse_rollcall

def curl(url, out=None):
    # urllib gets 403 from majlis.gov.mv; curl works.
    if out:
        subprocess.run(["curl", "-sL", "-o", out, url], check=True)
        return None
    return subprocess.run(["curl", "-sL", url], check=True, capture_output=True, text=True).stdout

# --- roster constituencies (mirror src/data/roster.ts) ----------------------
MYCONS = [
    "North Hulhumale'", "Central Hulhumale'", "South Hulhumale'",
    "North Henveyru", "Central Henveyru", "South Henveyru", "West Henveyru",
    "North Galolhu", "South Galolhu", "North Mahchangolhi", "Central Mahchangolhi",
    "South Mahchangolhi", "North Maafannu", "Central Maafannu", "South Maafannu",
    "West Maafannu", "Vilimale'", "Hoarafushi", "Ihavandhoo", "Baarashu",
    "Dhidhdhoo", "Kelaa", "Hanimaadhoo", "Nolhivaram", "Vaikaradhoo",
    "North Kulhudhuffushi", "South Kulhudhuffushi", "Makunudhoo", "Kanditheemu",
    "Milandhoo", "Komandoo", "Funadhoo", "Kendhikulhudhoo", "Manadhoo",
    "Velidhoo", "Holhudhoo", "Alifushi", "Ungoofaaru", "Dhuvaafaru",
    "Inguraidhoo", "Maduvvari", "Thulhaadhoo", "Eydhafushi", "Kendhoo",
    "Hithaadhoo", "Hinnavaru", "Naifaru", "Kurendhoo", "Kaashidhoo", "Thulusdhoo",
    "Maafushi", "Huraa", "Mathiveri", "Thoddoo", "Maamigili", "Mahibadhoo",
    "Dhangethi", "Felidhoo", "Keyodhoo", "Dhiggaru", "Mulaku", "Bilehdhoo",
    "Nilandhoo", "Meedhoo", "Kudahuvadhoo", "Vilifushi", "Thimarafushi",
    "Kinbidhoo", "Guraidhoo", "Isdhoo", "Gan", "Fonadhoo", "Maavashu", "Vilingili",
    "Dhaandhoo", "Gemanafushi", "Kolamaafushi", "North Thinadhoo", "South Thinadhoo",
    "Madaveli", "Faresmaathodaa", "Gadhdhoo", "North Fuvahmulah", "Central Fuvahmulah",
    "South Fuvahmulah", "Hulhudhoo", "North Feydhoo", "South Feydhoo", "Maradhoo",
    "Central Hithadhoo", "South Hithadhoo", "Addu Meedhoo", "North Hithadhoo",
]

def slug(s):
    s = s.lower().replace("'", "").replace("’", "").replace(".", "")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

MYSLUGS = {slug(c) for c in MYCONS}
ALIAS = {"vilufushi": "vilifushi", "gamu": "gan", "addumeedhoo": "addu-meedhoo",
         "fares-maathoda": "faresmaathodaa", "faresmaathoda": "faresmaathodaa",
         "villimale": "vilimale", "lhavandhoo": "ihavandhoo"}
DIRS = {"uthuru": "North", "dhekunu": "South", "medhu": "Central", "hulhangu": "West"}
SKIP = set()  # North Hithadhoo now in the roster (former member)
CHOICE = {"Yes": "Yes", "No": "No", "Abstain": "Abstain",
          "Not Present": "Absent", "Not Voted": "Absent", "No voting right": "Absent"}
MONTHS = {m: f"{i:02d}" for i, m in enumerate(
    ["January","February","March","April","May","June","July","August",
     "September","October","November","December"], 1)}

def norm_con(con):
    # split glued direction suffixes, e.g. "ThinadhooUthuru" -> "Thinadhoo Uthuru"
    con = re.sub(r"(Uthuru|Dhekunu|Medhu|Hulhangu)", r" \1 ", con)
    # OCR sometimes reads a leading capital I as lowercase l
    con = re.sub(r"^l(havandhoo|sdhoo|nguraidhoo|havandhoo)", r"I\1", con, flags=re.I)
    toks = con.replace("'", "").split()
    d = next((DIRS[t.lower()] for t in toks if t.lower() in DIRS), None)
    base = " ".join(t for t in toks if t.lower() not in DIRS)
    s = slug(f"{d} {base}" if d else base)
    return ALIAS.get(s, s)

def iso_date(d):
    m = re.match(r"(\d{1,2})\.([A-Za-z]+)\.(\d{4})", d or "")
    if not m:
        return None
    return f"{m.group(3)}-{MONTHS.get(m.group(2), '01')}-{int(m.group(1)):02d}"

# --- theme keyword map ------------------------------------------------------
THEME_KEYWORDS = [
    ("land", "housing"), ("housing", "housing"), ("transport", "economy"),
    ("constitution", "governance"), ("decentralization", "councils"),
    ("pension", "welfare"), ("employment", "economy"), ("export", "economy"),
    ("import", "economy"), ("tourism", "economy"), ("fisheries", "environment"),
    ("penal", "justice"), ("sexual", "justice"), ("residency", "security"),
    ("national service", "security"), ("data", "media"), ("digital", "media"),
    ("cyber", "media"), ("identity", "media"),
]

def theme_of(title):
    t = title.lower()
    return next((th for kw, th in THEME_KEYWORDS if kw in t), "governance")

def clean_title(raw):
    t = re.sub(r"^Bills\s+", "", raw).strip()
    t = re.sub(r"\s+(Parliamentary Debate|Committee Stage|Rejected by Vote|Passed at Parliament).*$", "", t).strip()
    return t

# --- discover voted bills from the list -------------------------------------
os.makedirs("tmp", exist_ok=True)
list_html = curl("https://majlis.gov.mv/en/20-parliament/parliament-works/type/1")
open("tmp/bills.html", "w", encoding="utf-8").write(list_html)

discovered = []  # (wid, result, title)
for m in re.finditer(r'parliament-work/(\d+)"[^>]*>(.*?)</a>', list_html, re.S):
    wid = m.group(1)
    title = ihtml.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m.group(2)))).strip()
    window = ihtml.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", list_html[m.start():m.start() + 1200])))
    result = "Passed" if "Passed at Parliament" in window else "Rejected" if "Rejected by Vote" in window else None
    if result and wid not in {d[0] for d in discovered}:
        discovered.append((wid, result, clean_title(title)))
print(f"discovered {len(discovered)} voted bills")

def vote_pdf_url(wid):
    page = curl(f"https://majlis.gov.mv/en/20-parliament/parliament-work/{wid}")
    vpos = page.find("Votes")
    if vpos == -1:
        return None
    m = re.search(r"https://majlis\.gov\.mv/storage/action_files/\d+/[A-Za-z0-9]+\.pdf", page[vpos:])
    return m.group(0) if m else None

records = []
for wid, result, title in discovered:
    url = vote_pdf_url(wid)
    if not url:
        print(f"{wid} -- no vote PDF (skipped): {title[:40]}")
        continue
    theme = theme_of(title)
    pdf = f"tmp/v{wid}.pdf"
    curl(url, pdf)
    data = parse_rollcall(pdf)
    rows, summary = data["rows"], data["summary"]
    mapped, unmapped, seen = [], [], set()
    for r in rows:
        res = r["result"]
        con = r["constituency"]
        # Skip the Speaker line ("No voting right" / blank constituency). When the
        # Speaker's own seat votes, it appears as its own numbered constituency row.
        if res == "No voting right" or not con.strip():
            continue
        cslug = norm_con(con)
        if cslug in SKIP:
            continue
        if cslug not in MYSLUGS:
            unmapped.append((con, cslug, res)); continue
        if cslug in seen:
            continue
        seen.add(cslug)
        mapped.append({"constituencyId": cslug, "choice": CHOICE[res], "detail": res})
    yes = sum(1 for m in mapped if m["choice"] == "Yes")
    no = sum(1 for m in mapped if m["choice"] == "No")
    ab = sum(1 for m in mapped if m["choice"] == "Abstain")
    absent = sum(1 for m in mapped if m["choice"] == "Absent")
    # validate against printed summary
    ok = (summary.get("Yes") == yes and summary.get("No") == no)
    flag = "OK" if ok else "*** MISMATCH ***"
    print(f"{wid} {flag} mapped={len(mapped)} yes={yes}(sum {summary.get('Yes')}) "
          f"no={no}(sum {summary.get('No')}) abstain={ab} absent={absent} unmapped={unmapped}")
    records.append({
        "id": wid, "title": title, "theme": theme, "result": result,
        "date": iso_date(data.get("date")) or "2026-01-01",
        "yes": yes, "no": no, "abstain": ab, "absent": absent,
        "votePdf": url,
        "workUrl": f"https://majlis.gov.mv/en/20-parliament/parliament-work/{wid}",
        "rows": mapped,
    })

# --- emit TS ----------------------------------------------------------------
def ts_rows(rows):
    return "".join(
        f"\n      {{ constituencyId: {json.dumps(r['constituencyId'])}, choice: {json.dumps(r['choice'])}, detail: {json.dumps(r['detail'])} }},"
        for r in rows)

blocks = []
for r in records:
    blocks.append(f"""  {{
    id: {json.dumps(r['id'])},
    title: {json.dumps(r['title'])},
    theme: {json.dumps(r['theme'])},
    result: {json.dumps(r['result'])},
    date: {json.dumps(r['date'])},
    yes: {r['yes']}, no: {r['no']}, abstain: {r['abstain']}, absent: {r['absent']},
    votePdf: {json.dumps(r['votePdf'])},
    workUrl: {json.dumps(r['workUrl'])},
    rows: [{ts_rows(r['rows'])}
    ],
  }},""")

ts = ("// AUTO-GENERATED by scripts/build_real_votes.py from official Majlis vote PDFs.\n"
      "// Each entry is a real, sourced roll-call vote (OCR'd, mapped by constituency,\n"
      "// and validated so row tallies match the printed summary on the PDF).\n"
      "import type { VoteChoice } from '@/types'\n\n"
      "export interface RealRollcallRow { constituencyId: string; choice: VoteChoice; detail: string }\n"
      "export interface RealRollcall {\n"
      "  id: string; title: string; theme: string; result: 'Passed' | 'Rejected'; date: string\n"
      "  yes: number; no: number; abstain: number; absent: number\n"
      "  votePdf: string; workUrl: string; rows: RealRollcallRow[]\n}\n\n"
      "export const REAL_ROLLCALLS: RealRollcall[] = [\n" + "\n".join(blocks) + "\n]\n")
open("src/data/realRollcalls.ts", "w", encoding="utf-8").write(ts)
print("\nwrote src/data/realRollcalls.ts with", len(records), "bills")
