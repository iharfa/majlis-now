"""Scrape every 20th-Majlis sitting into src/data/sittings.json and download each
sitting's documents (Agenda, Meeting Minutes, Point of Order) into tmp/docs/.

The sittings index only shows the latest few per term; the full list is at
/sittings/term/<id>?page=N. The script probes term ids 40..70 and keeps any
whose heading says "20th Parliament".

Each record: id, title, date, term, agendaNo, agendaPdf/agendaFile,
minutesPdf/minutesFile, pointOfOrderPdf/pointOfOrderFile, workIds, url, fetchedAt.

Run from repo root: python scripts/fetch_sittings.py
"""
import json, os, re, urllib.error
from majlis import BASE, TMP, RUN_DATE, fetch, iso_date, strip_tags

OUT = os.path.join("src", "data", "sittings.json")
DOCS = os.path.join(TMP, "docs")
DOC_KEYS = {"agenda": "agendaPdf", "meeting minutes": "minutesPdf", "point of order": "pointOfOrderPdf"}
FILE_NAMES = {"agendaPdf": "agenda", "minutesPdf": "minutes", "pointOfOrderPdf": "point-of-order"}


def term_cards(term_id):
    """Yield (sittingId, title, date, termTitle) for every sitting in a term, all pages."""
    try:
        h = fetch(f"{BASE}/sittings/term/{term_id}", refresh=True)
    except urllib.error.HTTPError:
        return
    m = re.search(r"page-title[^>]*>(.*?)</h5>", h, re.S)
    term_title = strip_tags(m.group(1)) if m else ""
    if "20th" not in term_title:
        return
    pages = sorted({int(p) for p in re.findall(r"[?&]page=(\d+)", h)}) or [1]
    htmls = [h] + [fetch(f"{BASE}/sittings/term/{term_id}?page={p}", refresh=True) for p in range(2, pages[-1] + 1)]
    seen = set()
    for page in htmls:
        for m in re.finditer(r'href="[^"]*/sitting/session/(\d+)"[^>]*>(.*?)</a>', page, re.S):
            sid = m.group(1)
            if sid in seen:
                continue
            seen.add(sid)
            txt = strip_tags(m.group(2))
            title = re.sub(r"\s+\d{1,2} \w{3} \d{4}.*$", "", re.sub(r"^\w{3}\s+\d{1,2}\s+", "", txt))
            yield sid, title, iso_date(txt), term_title.replace("20th Parliament Sittings", "").strip()


def parse_sitting(sid, title, date, term):
    h = fetch(f"{BASE}/sitting/session/{sid}")
    body = h[h.find("<body"):]
    t = strip_tags(body)
    ag = re.search(r"Agenda No\.\s*(\S+(?:\s*/\s*\S+)*?)\s+Summary", t)
    rec = {"id": sid, "title": title, "date": date, "term": term,
           "agendaNo": re.sub(r"\s+", "", ag.group(1)) if ag else "",
           "agendaPdf": None, "minutesPdf": None, "pointOfOrderPdf": None}
    for m in re.finditer(r'<a[^>]+href="(https://majlis\.gov\.mv/storage/[^"]+)"[^>]*>(.*?)</a>', body, re.S):
        key = DOC_KEYS.get(strip_tags(m.group(2)).lower())
        if key and not rec[key]:
            rec[key] = m.group(1)
    works = []
    for w in re.findall(r'parliament-work/(\d+)"', body):
        if w not in works:
            works.append(w)
    rec["workIds"] = works
    rec["url"] = f"{BASE}/sitting/session/{sid}"
    rec["fetchedAt"] = RUN_DATE
    return rec


def download(rec):
    for key, name in FILE_NAMES.items():
        if rec.get(key):
            path = os.path.join(DOCS, f"sitting-{rec['id']}-{name}.pdf")
            rec[key.replace("Pdf", "File")] = os.path.relpath(path).replace("\\", "/")
            if not os.path.exists(path):
                open(path, "wb").write(fetch(rec[key], binary=True))


if __name__ == "__main__":
    os.makedirs(DOCS, exist_ok=True)
    out = []
    for term_id in range(40, 71):
        for sid, title, date, term in term_cards(term_id):
            rec = parse_sitting(sid, title, date, term)
            download(rec)
            out.append(rec)
            print(f"{sid} {rec['date']} {term[:22]:22} a={'y' if rec['agendaPdf'] else '-'} m={'y' if rec['minutesPdf'] else '-'} p={'y' if rec['pointOfOrderPdf'] else '-'} works={len(rec['workIds'])} {title}", flush=True)
    out.sort(key=lambda s: (s["date"] or "", int(s["id"])), reverse=True)
    json.dump(out, open(OUT, "w", encoding="utf-8", newline="\n"), indent=2, ensure_ascii=False)
    print("wrote", OUT, len(out))
