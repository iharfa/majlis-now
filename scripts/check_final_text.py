"""Flag transcribed final-bill pages whose words drift from the PDF text layer.

For each tmp/finaltext/<id>/pNN.txt, strip fili (vowel marks) from every Thaana word and check
whether that consonant skeleton occurs in the page's text layer (also fili-stripped, spaces
removed, since the layer splits words). Pages below THRESHOLD are listed for a second look.

Run from repo root: python scripts/check_final_text.py
"""
import glob, os, re

THRESHOLD = 0.9
FILI = re.compile(r"[ަ-ް]")
WORD = re.compile(r"[ހ-ޥަ-ޱ]+")
rows = []
for out in sorted(glob.glob("tmp/finaltext/*/p*.txt")):
    if out.endswith(".layer.txt"):
        continue
    layer = open(out[:-4] + ".layer.txt", encoding="utf-8").read()
    skel = FILI.sub("", re.sub(r"\s+", "", layer))
    words = [FILI.sub("", w) for w in WORD.findall(open(out, encoding="utf-8").read())]
    words = [w for w in words if len(w) >= 3]
    if len(words) < 10:
        continue
    hit = sum(w in skel for w in words) / len(words)
    rows.append((hit, out, len(words)))
low = [r for r in rows if r[0] < THRESHOLD]
print(f"{len(rows)} pages checked, median match {sorted(r[0] for r in rows)[len(rows)//2]:.3f}, {len(low)} below {THRESHOLD}")
for hit, out, n in sorted(low):
    print(f"  {hit:.3f}  {out}  ({n} words)")
