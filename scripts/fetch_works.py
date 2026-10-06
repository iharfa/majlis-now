"""Scrape every 20th-Majlis bill ("Parliament Works" type 1) into src/data/works.json
and download its labelled PDFs into tmp/docs/.

Each record: id, title, number, type, sponsor {constituency, name}, status,
summary (the site's own one-liner), stages [{name, done}], sittings
[{id, title, date}], documents [{label, url}], fetchedAt.

Run from repo root: python scripts/fetch_works.py
"""
import json, os, re, sys
from majlis import BASE, TMP, RUN_DATE, fetch, iso_date, slug, strip_tags

OUT = os.path.join("src", "data", "works.json")
DOCS = os.path.join(TMP, "docs")

FIELDS = ["Name", "Number", "Sitting", "Type", "Sponsor", "Status", "Summary"]


def field(text, name, stop):
    m = re.search(re.escape(name) + r"\s+(.*?)\s+" + re.escape(stop), text)
    return m.group(1).strip() if m else ""


def parse_work(wid):
    h = fetch(f"{BASE}/parliament-work/{wid}")
    body = h[h.find("Parliament Documents"):] if "Parliament Documents" in h else h
    t = strip_tags(body)
    rec = {"id": wid}
    for a, b in zip(FIELDS, FIELDS[1:] + ["Current Progress"]):
        rec[a.lower()] = field(t, a, b)
    rec["title"] = rec.pop("name")
    sp = rec.pop("sponsor")
    m = re.match(r"(.+?)\s+-\s+(.+)", sp)
    rec["sponsor"] = {"constituency": m.group(1), "name": m.group(2)} if m else {"constituency": "", "name": sp}
    # progress: <ul class="maj-progress"> <li class="active"><span>1</span>First Reading ...
    # The site marks only the CURRENT stage with class="active"; everything
    # before it is completed, anything after is upcoming.
    prog = re.search(r'<ul[^>]*maj-progress[^>]*>(.*?)</ul>', body, re.S)
    stages, committee = [], None
    if prog:
        for li in re.finditer(r"<li([^>]*)>(.*?)</li>", prog.group(1), re.S):
            name = re.sub(r"^\d+\s*", "", strip_tags(li.group(2)))
            if not name:
                continue
            cm = re.search(r"/committee/(\d+)", li.group(2))
            if cm:
                committee = cm.group(1)
            stages.append({"name": name, "state": "current" if "active" in li.group(1) else "upcoming"})
        cur = next((i for i, s in enumerate(stages) if s["state"] == "current"), len(stages) - 1)
        for i in range(cur):
            stages[i]["state"] = "completed"
    rec["stages"] = stages
    rec["committeeId"] = committee
    # related sittings (unique by id, keep order)
    sittings, seen = [], set()
    rs = body.find("Related Sittings")
    rd = body.find("Related Documents")
    for m in re.finditer(r'href="[^"]*/sitting/session/(\d+)"[^>]*>(.*?)</a>', body[rs:rd if rd > rs else None], re.S):
        sid = m.group(1)
        if sid in seen:
            continue
        seen.add(sid)
        txt = strip_tags(m.group(2))
        sittings.append({"id": sid, "title": re.sub(r"\s+\d{1,2} \w{3} \d{4}.*$", "", re.sub(r"^\w{3}\s+\d{1,2}\s+", "", txt)), "date": iso_date(txt)})
    rec["sittings"] = sittings
    docs = []
    for m in re.finditer(r'<a[^>]+href="(https://majlis\.gov\.mv/storage/[^"]+\.pdf)"[^>]*>(.*?)</a>', body, re.S):
        label = strip_tags(m.group(2))
        if label and not any(d["url"] == m.group(1) for d in docs):
            docs.append({"label": label, "url": m.group(1)})
    rec["documents"] = docs
    rec["url"] = f"{BASE}/parliament-work/{wid}"
    rec["fetchedAt"] = RUN_DATE
    return rec


def download_docs(rec):
    os.makedirs(DOCS, exist_ok=True)
    for d in rec["documents"]:
        path = os.path.join(DOCS, f"{rec['id']}-{slug(d['label'])}.pdf")
        d["file"] = os.path.relpath(path).replace("\\", "/")
        if not os.path.exists(path):
            open(path, "wb").write(fetch(d["url"], binary=True))


if __name__ == "__main__":
    listing = fetch(f"{BASE}/parliament-works/type/1", refresh=True)
    ids = []
    for wid in re.findall(r'parliament-work/(\d+)"', listing):
        if wid not in ids:
            ids.append(wid)
    print(f"{len(ids)} bills listed")
    works = []
    for wid in ids:
        rec = parse_work(wid)
        download_docs(rec)
        works.append(rec)
        print(f"{wid} {rec['status'][:24]:24} docs={len(rec['documents'])} stages={len(rec['stages'])} cmt={rec['committeeId']} {rec['title'][:50]}")
    works.sort(key=lambda w: int(w["id"]), reverse=True)
    json.dump(works, open(OUT, "w", encoding="utf-8", newline="\n"), indent=2, ensure_ascii=False)
    print("wrote", OUT, len(works))
