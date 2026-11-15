"""Assemble Opus page transcriptions (tmp/finaltext/<id>/pNN.txt) into public/billtexts/<id>.json
for every final bill whose pages are all done. Served statically and fetched on demand by the
bill page, so the text never enters the JS bundle.

Run from repo root: python scripts/build_final_texts.py
"""
import glob, json, os

q = json.load(open("tmp/finaltext_queue.json", encoding="utf-8"))
os.makedirs(os.path.join("public", "billtexts"), exist_ok=True)
done = 0
for b in q:
    d = os.path.join("tmp", "finaltext", b["id"])
    w = 3 if b["pages"] >= 100 else 2
    paths = [os.path.join(d, f"p{i:0{w}d}.txt") for i in range(1, b["pages"] + 1)]
    if not all(os.path.exists(p) for p in paths):
        continue
    pages = [open(p, encoding="utf-8").read().strip() for p in paths]
    json.dump({"workId": b["id"], "sourceUrl": b["url"], "pages": pages, "unreadable": sum(p.count("[?]") for p in pages),
               "model": "claude-opus-5-5", "method": "Page images transcribed by Claude, checked against the PDF text layer",
               "generatedAt": "2026-10-15"},
              open(os.path.join("public", "billtexts", f"{b['id']}.json"), "w", encoding="utf-8", newline="\n"), ensure_ascii=False)
    done += 1
ids = sorted(f[:-5] for f in os.listdir(os.path.join("public", "billtexts")) if f.endswith(".json"))
json.dump(ids, open(os.path.join("src", "data", "billtexts.json"), "w", encoding="utf-8", newline="\n"))  # tiny index the UI imports
print(f"{done} of {len(q)} final bills assembled")
