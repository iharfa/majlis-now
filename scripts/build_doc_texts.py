"""Assemble Opus page transcriptions of work documents (tmp/fulltext/<key>/pNN.txt, see
prepare_doc_text.py) into public/doctexts/<key>.json, fetched on demand by the site, plus a
small index src/data/doctexts.json: [{key, workId, label, pages}].

Run from repo root: python scripts/build_doc_texts.py
"""
import json, os, re

TREATY = re.compile(r"States Parties|Contracting (?:State|Part)|High Contracting|Optional Protocol|Vienna Convention|Convention on the", re.I)


def is_treaty_page(text):
    """English treaty text attached to a document: no Thaana, and treaty wording. Published elsewhere,
    so it is replaced by a pointer rather than reproduced."""
    return not re.search(r"[ހ-޿]", text) and len(text) > 300 and TREATY.search(text)


q = json.load(open(os.path.join("tmp", "fulltext_queue.json"), encoding="utf-8"))
os.makedirs(os.path.join("public", "doctexts"), exist_ok=True)
index = []
for d in q:
    paths = [os.path.join(d["dir"], f"p{i:0{d['fileDigits']}d}.txt") for i in range(1, d["pages"] + 1)]
    if not all(os.path.exists(p) for p in paths):
        continue
    pages = [open(p, encoding="utf-8").read().strip() for p in paths]
    # National ID card numbers (A + 6 digits) of staff listed in budget annexes: not republished
    pages = [re.sub(r"(?<![A-Za-z0-9])A[0-9]{6}(?![0-9])", "[ID redacted]", t) for t in pages]
    pages = ["[English text of an international convention attached to this document: not transcribed here; see the official PDF]"
             if is_treaty_page(t) else t for t in pages]
    json.dump({"workId": d["workId"], "label": d["label"], "sourceUrl": d["url"], "pages": pages,
               "unreadable": sum(p.count("[?]") for p in pages), "model": "claude-opus-5-5",
               "method": "Page images transcribed by Claude, checked against the PDF text layer", "generatedAt": "2026-10-20"},
              open(os.path.join("public", "doctexts", f"{d['key']}.json"), "w", encoding="utf-8", newline="\n"), ensure_ascii=False)
    # English translation (pNN.en.txt), when every page has one
    en = [p[:-4] + ".en.txt" for p in paths]
    has_en = all(os.path.exists(p) for p in en)
    if has_en:
        pages_en = [re.sub(r"(?<![A-Za-z0-9])A[0-9]{6}(?![0-9])", "[ID redacted]", open(p, encoding="utf-8").read().strip()) for p in en]
        json.dump({"workId": d["workId"], "label": d["label"] + " (English translation)", "sourceUrl": d["url"], "pages": pages_en,
                   "unreadable": sum(p.count("[unclear]") for p in pages_en), "model": "claude-opus-5-5",
                   "method": "Translated by Claude from the Dhivehi transcription", "generatedAt": "2026-10-21"},
                  open(os.path.join("public", "doctexts", f"{d['key']}.en.json"), "w", encoding="utf-8", newline="\n"), ensure_ascii=False)
    index.append({"key": d["key"], "workId": d["workId"], "label": d["label"], "pages": d["pages"], "en": has_en})
json.dump(index, open(os.path.join("src", "data", "doctexts.json"), "w", encoding="utf-8", newline="\n"), ensure_ascii=False)
print(f"{len(index)} of {len(q)} documents assembled")
