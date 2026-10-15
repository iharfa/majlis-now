"""Render each final-bill PDF page to PNG plus its raw text layer, for the Opus OCR agents
(docs/ocr-agent-prompt.md). Output: tmp/finaltext/<id>/pNN.png and pNN.layer.txt.

Run from repo root: python scripts/prepare_final_text.py [workId ...]
"""
import json, os, sys
import fitz

q = json.load(open("tmp/finaltext_queue.json", encoding="utf-8"))
only = set(sys.argv[1:])
for b in q:
    if only and b["id"] not in only:
        continue
    out = os.path.join("tmp", "finaltext", b["id"])
    os.makedirs(out, exist_ok=True)
    doc = fitz.open(b["file"])
    for i, page in enumerate(doc, 1):
        png = os.path.join(out, f"p{i:02d}.png" if doc.page_count < 100 else f"p{i:03d}.png")
        if not os.path.exists(png):
            page.get_pixmap(dpi=150).save(png)
            open(png[:-4] + ".layer.txt", "w", encoding="utf-8", newline="\n").write(page.get_text())
    print(b["id"], doc.page_count)
