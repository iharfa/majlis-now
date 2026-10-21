"""Scrape a committee's meetings (number, date, English summary, attendance, agenda/minutes PDFs)
and its committee reports into src/data/committeeMeetings.json, keyed by committee id, and
download the PDFs to tmp/cmt<id>/.

Run from repo root: python scripts/scrape_committee_meetings.py 129 [more ids]
"""
import html, json, os, re, sys
sys.path.insert(0, "scripts")
from majlis import BASE, fetch, iso_date, roster_constituencies, slug

OUT = os.path.join("src", "data", "committeeMeetings.json")
data = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}
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


for cid in sys.argv[1:]:
    os.makedirs(os.path.join("tmp", f"cmt{cid}"), exist_ok=True)
    h = fetch(f"{BASE}/committee-meetings/{cid}", refresh=True)
    mids = list(dict.fromkeys(re.findall(r"committee-meeting/(\d+)", h)))
    meetings = []
    for mid in mids:
        b = fetch(f"{BASE}/committee-meeting/{mid}", refresh=True)
        b = b[b.find("<body"):]
        t = text(b)
        title = re.search(r"(\d+(?:st|nd|rd|th) Meeting \d{4})", t)
        num = re.search(r"Number (\S+)", t)
        summ = re.search(r"Summary (.*?) Attendance", t)
        att = []
        seg = t[t.find(" Attendance ") + 12:] if " Attendance " in t else ""
        for name, con, st in re.findall(r"([A-Z][A-Za-z.' -]+?) ((?:North |South |Central |West )?[A-Z][A-Za-z']+(?: [A-Z][A-Za-z']+)?) (Present|Absent|Sick Leave|Leave|Official Travel)", seg):
            att.append({"name": name.strip(), "constituency": con.strip(), "status": st})
        date = re.search(r"Meeting \d{4} (\d{1,2} \w{3} \d{4})", t)
        meetings.append({"id": mid, "title": title.group(1) if title else "", "number": num.group(1) if num else "",
                         "date": iso_date(date.group(1)) if date else None, "summary": summ.group(1).strip() if summ else "",
                         "attendance": att, "documents": pdfs(b, cid, mid), "url": f"{BASE}/committee-meeting/{mid}"})
    h = fetch(f"{BASE}/committee-works/{cid}", refresh=True)
    reports = []
    for wid in dict.fromkeys(re.findall(r"committee-work/(\d+)", h)):
        b = fetch(f"{BASE}/committee-work/{wid}", refresh=True)
        b = b[b.find("<body"):]
        docs = pdfs(b, cid, f"cw{wid}")
        if docs:
            t = text(b)
            m = re.search(r"(Committee report no: \S+)", t)
            reports.append({"id": wid, "title": m.group(1) if m else docs[0]["label"], "documents": docs, "url": f"{BASE}/committee-work/{wid}"})
    data[cid] = {"meetings": meetings, "reports": reports}
    print(cid, len(meetings), "meetings", sum(len(m["documents"]) for m in meetings), "meeting docs", len(reports), "reports")
json.dump(data, open(OUT, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
