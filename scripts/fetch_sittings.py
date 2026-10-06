"""Scrape 20th-Majlis sittings into src/data/sittings.json and download each
sitting's agenda PDF into tmp/docs/.

Each record: id, title, date, agendaNo, agendaPdf, workIds, url, fetchedAt.

Run from repo root: python scripts/fetch_sittings.py
"""
import json, os, re
from majlis import BASE, TMP, RUN_DATE, fetch, iso_date, strip_tags

OUT = os.path.join("src", "data", "sittings.json")
DOCS = os.path.join(TMP, "docs")


def parse_sitting(sid, title, date):
    h = fetch(f"{BASE}/sitting/session/{sid}")
    body = h[h.find("<body"):]
    t = strip_tags(body)
    ag = re.search(r"Agenda No\.\s*(\S+(?:\s*/\s*\S+)*?)\s+Summary", t)
    pdf = re.search(r'<a[^>]+href="(https://majlis\.gov\.mv/storage/[^"]+\.pdf)"[^>]*>\s*(?:<[^>]+>\s*)*Agenda', body, re.S)
    works = []
    for w in re.findall(r'parliament-work/(\d+)"', body):
        if w not in works:
            works.append(w)
    return {
        "id": sid, "title": title, "date": date,
        "agendaNo": re.sub(r"\s+", "", ag.group(1)) if ag else "",
        "agendaPdf": pdf.group(1) if pdf else None,
        "workIds": works,
        "url": f"{BASE}/sitting/session/{sid}",
        "fetchedAt": RUN_DATE,
    }


if __name__ == "__main__":
    listing = fetch(f"{BASE}/sittings", refresh=True)
    # Title + date come from the listing cards ("Oct 06 2nd Sitting of ... 06 Oct 2026 - 09:00");
    # the detail page splits them across markup that is awkward to parse.
    cards = {}
    for m in re.finditer(r'href="[^"]*/sitting/session/(\d+)"[^>]*>(.*?)</a>', listing, re.S):
        txt = strip_tags(m.group(2))
        title = re.sub(r"\s+\d{1,2} \w{3} \d{4}.*$", "", re.sub(r"^\w{3}\s+\d{1,2}\s+", "", txt))
        cards.setdefault(m.group(1), (title, iso_date(txt)))
    os.makedirs(DOCS, exist_ok=True)
    out = []
    for sid, (title, date) in cards.items():
        rec = parse_sitting(sid, title, date)
        if rec["agendaPdf"]:
            path = os.path.join(DOCS, f"sitting-{sid}-agenda.pdf")
            rec["agendaFile"] = os.path.relpath(path).replace("\\", "/")
            if not os.path.exists(path):
                open(path, "wb").write(fetch(rec["agendaPdf"], binary=True))
        out.append(rec)
        print(f"{sid} {rec['date']} agenda={'yes' if rec['agendaPdf'] else 'no'} works={len(rec['workIds'])} {rec['title']}")
    out.sort(key=lambda s: (s["date"] or "", int(s["id"])), reverse=True)
    json.dump(out, open(OUT, "w", encoding="utf-8", newline="\n"), indent=2, ensure_ascii=False)
    print("wrote", OUT, len(out))
