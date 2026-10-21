"""Scrape a committee's meetings (number, date, English summary, attendance, agenda/minutes PDFs)
and its committee reports into public/cmtmeetings/<id>.json (fetched on demand by the site), and
download the PDFs to tmp/cmt<id>/.

Run from repo root: python scripts/scrape_committee_meetings.py 129 [more ids]
"""
import html, json, os, re, sys
sys.path.insert(0, "scripts")
from majlis import BASE, fetch, iso_date, roster_constituencies, slug

OUT = os.path.join("public", "cmtmeetings")  # one <cid>.json per committee, fetched when its page opens
os.makedirs(OUT, exist_ok=True)
CON = {slug(c): c for c in roster_constituencies()}


def text(h):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", h))).strip()


def pdfs(body, cid, prefix):
    out = []
    for url, lab in re.findall(r'href="(https://majlis\.gov\.mv/storage/[^"]+\.pdf)"[^>]*>(.*?)</a>', body, re.S):
        lab = text(lab)
        f = os.path.join("tmp", f"cmt{cid}", f"{prefix}-{slug(lab)[:40]}.pdf")
        if not os.path.exists(f):
            open(f, "wb").write(fetch(url, binary=True))
        out.append({"label": lab, "url": url, "file": f.replace("\\", "/"), "key": f"cmt{cid}-{prefix}-{slug(lab)[:40]}"})
    return out


def ordinal(n):
    n = int(n)
    return "th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")


def listing(url, pat):
    """Ids from a committee listing page; it shows the current year only, other years sit behind ?year=."""
    h = fetch(url, refresh=True)
    ids = re.findall(pat, h)
    for y in sorted(set(re.findall(r'name="year"[^>]*value="(\d{4})"', h)), reverse=True):
        ids += re.findall(pat, fetch(f"{url}?year={y}", refresh=True))
    return list(dict.fromkeys(ids))


for cid in sys.argv[1:]:
    os.makedirs(os.path.join("tmp", f"cmt{cid}"), exist_ok=True)
    mids = listing(f"{BASE}/committee-meetings/{cid}", r"committee-meeting/(\d+)")
    meetings = []
    for mid in mids:
        b = fetch(f"{BASE}/committee-meeting/{mid}", refresh=True)
        b = b[b.find("<body"):]
        t = text(b)
        num = re.search(r"Number (\S+)", t)
        summ = re.search(r"Summary (.*?) Attendance", t)
        att = []
        seg = t[t.find(" Attendance ") + 12:] if " Attendance " in t else ""
        for name, con, st in re.findall(r"([A-Z][A-Za-z.' -]+?) ((?:North |South |Central |West )?[A-Z][A-Za-z']+(?: [A-Z][A-Za-z']+)?) (Present|Absent|Sick Leave|Leave|Official Travel)", seg):
            att.append({"name": name.strip(), "constituency": con.strip(), "status": st})
        date = re.search(r"(\d{1,2} \w{3} \d{4}) Number", t)
        # Title wording varies by committee and year ("19th meeting for the year 2026", "4th Meeting of 2026",
        # "3rd sitting of 2026"): take the last ordinal before the date, and the year from the date
        ords = re.findall(r"(\d+)(?:st|nd|rd|th)\s*([Mm]eeting|sitting)", t[:date.start()] if date else t)
        title = f"{int(ords[-1][0])}{ordinal(ords[-1][0])} {ords[-1][1].capitalize()} {date.group(1)[-4:]}" if ords and date else ""
        meetings.append({"id": mid, "title": title, "number": num.group(1) if num else "",
                         "date": iso_date(date.group(1)) if date else None, "summary": summ.group(1).strip() if summ else "",
                         "attendance": att, "documents": pdfs(b, cid, mid), "url": f"{BASE}/committee-meeting/{mid}"})
    meetings.sort(key=lambda m: m["date"] or "", reverse=True)
    reports = []
    for wid in listing(f"{BASE}/committee-works/{cid}", r"committee-work/(\d+)"):
        b = fetch(f"{BASE}/committee-work/{wid}", refresh=True)
        b = b[b.find("<body"):]
        docs = pdfs(b, cid, f"cw{wid}")
        if docs:
            t = text(b)
            m = re.search(r"(Committee report no: \S+)", t)
            reports.append({"id": wid, "title": m.group(1) if m else docs[0]["label"], "documents": docs, "url": f"{BASE}/committee-work/{wid}"})
    json.dump({"meetings": meetings, "reports": reports}, open(os.path.join(OUT, f"{cid}.json"), "w", encoding="utf-8", newline="\n"), ensure_ascii=False)
    print(cid, len(meetings), "meetings", sum(len(m["documents"]) for m in meetings), "meeting docs", len(reports), "reports")
