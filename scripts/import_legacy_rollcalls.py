"""Seed the OCR cache (tmp/rollcalls/) from a previously validated realRollcalls.ts.

Useful when a re-run of the OCR fails validation for a PDF that an earlier run
had already matched against its printed summary: the earlier rows are reused
instead of being re-OCR'd. Only PDFs whose URL still appears in works.json are
imported, and only when no cache entry exists yet (pass --force to overwrite).

Usage: python scripts/import_legacy_rollcalls.py <path-or-git-ref-to-old-realRollcalls.ts> [--force]
   e.g. python scripts/import_legacy_rollcalls.py HEAD:src/data/realRollcalls.ts
"""
import json, os, re, subprocess, sys
from majlis import TMP, slug

src_ref = sys.argv[1]
force = "--force" in sys.argv
if ":" in src_ref and not os.path.exists(src_ref):
    text = subprocess.run(["git", "show", src_ref], check=True, capture_output=True, text=True, encoding="utf-8").stdout
else:
    text = open(src_ref, encoding="utf-8").read()

works = json.load(open(os.path.join("src", "data", "works.json"), encoding="utf-8"))
file_by_url = {d["url"]: d["file"] for w in works for d in w["documents"]}
cache = os.path.join(TMP, "rollcalls")
os.makedirs(cache, exist_ok=True)

n = 0
for block in text.split("\n  {\n")[1:]:
    pdf = re.search(r'votePdf: "([^"]+)"', block).group(1)
    date = re.search(r'date: "([^"]+)"', block).group(1)
    rows = [{"constituency": c, "result": d} for c, d in re.findall(r'constituencyId: "([^"]+)", choice: "\w+", detail: "([^"]+)"', block)]
    yes = sum(1 for r in rows if r["result"] == "Yes")
    voted = sum(1 for r in rows if r["result"] in ("Yes", "No", "Abstain"))
    f = file_by_url.get(pdf)
    if not f:
        print("skip (pdf not in works.json):", pdf[-30:]); continue
    key = os.path.join(cache, os.path.basename(f) + ".json")
    if os.path.exists(key) and not force:
        print("exists:", os.path.basename(key)); continue
    y, m, d = date.split("-")
    json.dump({"rows": rows, "summary": {"Yes": yes, "Voted": voted}, "date": f"{int(d)}.{['','January','February','March','April','May','June','July','August','September','October','November','December'][int(m)]}.{y}", "legacy": True},
              open(key, "w", encoding="utf-8", newline="\n"), ensure_ascii=False)
    print("imported:", os.path.basename(key), f"yes={yes} voted={voted}")
    n += 1
print(n, "imported")
