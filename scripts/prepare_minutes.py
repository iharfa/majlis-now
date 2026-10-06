"""Turn each sitting's Meeting Minutes PDF into cleaned Dhivehi text parts that an
agent can read, and write a manifest.

- tmp/text/sitting-<id>-minutes.p<k>.txt : cleaned text, split at page boundaries
  into parts of at most MAX_CHARS characters (so one part fits one agent's context)
- tmp/text/minutes_manifest.json : [{id, title, date, pages, chars, parts:[paths], done}]

Cleaning: drop blank/whitespace-only lines, collapse runs of spaces. The PDF text
layer loses some vowel marks and splits lines oddly, but stays readable.

Run from repo root: python scripts/prepare_minutes.py [sittingId ...]
"""
import json, os, re, sys
import fitz

MAX_CHARS = 110_000
TEXT = os.path.join("tmp", "text")
sittings = json.load(open(os.path.join("src", "data", "sittings.json"), encoding="utf-8"))
only = set(sys.argv[1:])
os.makedirs(TEXT, exist_ok=True)
have = {os.path.basename(f)[:-5] for f in __import__("glob").glob(os.path.join("src", "data", "minutes", "*.json"))}

manifest = []
for s in sittings:
    if only and s["id"] not in only:
        continue
    f = s.get("minutesFile")
    if not f or not os.path.exists(f):
        continue
    doc = fitz.open(f)
    pages = []
    for i, page in enumerate(doc):
        t = page.get_text("text")
        lines = [re.sub(r"[ \t]+", " ", l).strip() for l in t.splitlines()]
        lines = [l for l in lines if l]
        pages.append(f"--- page {i + 1} ---\n" + "\n".join(lines))
    parts, cur = [], ""
    for p in pages:
        if cur and len(cur) + len(p) > MAX_CHARS:
            parts.append(cur); cur = ""
        cur += p + "\n"
    if cur:
        parts.append(cur)
    paths = []
    for k, part in enumerate(parts, 1):
        path = os.path.join(TEXT, f"sitting-{s['id']}-minutes.p{k}.txt").replace("\\", "/")
        open(path, "w", encoding="utf-8", newline="\n").write(part)
        paths.append(path)
    manifest.append({"id": s["id"], "title": s["title"], "date": s["date"], "pages": len(doc),
                     "chars": sum(len(p) for p in parts), "parts": paths, "done": s["id"] in have})
json.dump(manifest, open(os.path.join(TEXT, "minutes_manifest.json"), "w", encoding="utf-8", newline="\n"), indent=1, ensure_ascii=False)
tot = sum(m["chars"] for m in manifest)
print(f"{len(manifest)} sittings, {sum(m['pages'] for m in manifest)} pages, {tot/1e6:.1f}M chars, {sum(len(m['parts']) for m in manifest)} parts, {sum(1 for m in manifest if not m['done'])} not yet digested")
