"""Render sitting minutes PDFs for Hansard transcription: tmp/hansard/<sid>/pNN.png + pNN.layer.txt.

Run from repo root: python scripts/prepare_hansard.py <sittingId> [...]
"""
import json, os, sys
import pymupdf

sittings = {s["id"]: s for s in json.load(open("src/data/sittings.json", encoding="utf-8"))}
for sid in sys.argv[1:]:
    doc = pymupdf.open(sittings[sid]["minutesFile"])
    out = os.path.join("tmp", "hansard", sid)
    os.makedirs(out, exist_ok=True)
    for i, page in enumerate(doc, 1):
        png = os.path.join(out, f"p{i:02d}.png")
        if not os.path.exists(png):
            page.get_pixmap(dpi=150).save(png)
            open(png[:-4] + ".layer.txt", "w", encoding="utf-8", newline="\n").write(page.get_text())
    print(sid, doc.page_count)
