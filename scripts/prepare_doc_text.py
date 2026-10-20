"""Queue + render any work document for Opus transcription (same agent prompt as final bills,
docs/ocr-agent-prompt.md). Writes tmp/fulltext_queue.json and tmp/fulltext/<key>/pNN.png +
pNN.layer.txt, where key = <workId>-<doc slug>.

Run from repo root: python scripts/prepare_doc_text.py <workId> [workId ...]
  Bills use their "Bill" document; other works use every document they have.
"""
import json, os, sys
import fitz
sys.path.insert(0, "scripts")
from majlis import slug

ids = set(sys.argv[1:])
works = json.load(open("src/data/works.json", encoding="utf-8")) + json.load(open("src/data/works_other.json", encoding="utf-8"))
qpath = os.path.join("tmp", "fulltext_queue.json")
queue = {q["key"]: q for q in (json.load(open(qpath, encoding="utf-8")) if os.path.exists(qpath) else [])}
for w in works:
    if w["id"] not in ids:
        continue
    docs = [d for d in w.get("documents", []) if d.get("file") and (w.get("type") != "Bills" or d["label"].strip().lower() == "bill")]
    for d in docs:
        key = f"{w['id']}-{slug(d['label'])[:40]}"
        doc = fitz.open(d["file"])
        out = os.path.join("tmp", "fulltext", key)
        os.makedirs(out, exist_ok=True)
        wd = 3 if doc.page_count >= 100 else 2
        for i, page in enumerate(doc, 1):
            png = os.path.join(out, f"p{i:0{wd}d}.png")
            if not os.path.exists(png):
                page.get_pixmap(dpi=150).save(png)
                open(png[:-4] + ".layer.txt", "w", encoding="utf-8", newline="\n").write(page.get_text())
        queue[key] = {"key": key, "workId": w["id"], "type": w.get("type"), "label": d["label"], "title": w["title"],
                      "url": d["url"], "pages": doc.page_count, "dir": out.replace("\\", "/"), "fileDigits": wd}
        print(key, doc.page_count)
json.dump(list(queue.values()), open(qpath, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
