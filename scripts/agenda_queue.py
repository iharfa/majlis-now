"""Split tmp/text/agenda_manifest.json (sittings without an agenda digest) into
batch files tmp/agenda_batches/batch-<k>.json of N sittings each, newest first,
and print the ones not yet handed to an agent.

Usage: python scripts/agenda_queue.py [N=10] [--take K] [--mark]
  --take K   print only the next K unlaunched batches
  --mark     record the printed batches in tmp/agenda_batches/_launched.txt
"""
import json, os, sys

args = [a for a in sys.argv[1:] if not a.startswith("--")]
n = int(args[0]) if args else 10
take = int(sys.argv[sys.argv.index("--take") + 1]) if "--take" in sys.argv else 999
mark = "--mark" in sys.argv
OUT = os.path.join("tmp", "agenda_batches")
LEDGER = os.path.join(OUT, "_launched.txt")
os.makedirs(OUT, exist_ok=True)
man = json.load(open(os.path.join("tmp", "text", "agenda_manifest.json"), encoding="utf-8"))
man.sort(key=lambda m: -int(m["id"]))
launched = set(open(LEDGER, encoding="utf-8").read().split()) if os.path.exists(LEDGER) else set()
batches = [man[i : i + n] for i in range(0, len(man), n)]
pending = []
for b in batches:
    path = os.path.join(OUT, f"batch-{b[0]['id']}.json")
    json.dump(b, open(path, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=0)
    done = all(os.path.exists(os.path.join("src", "data", "agendas", m["id"] + ".json")) for m in b)
    if path not in launched and not done:
        pending.append(path)
left = sum(not os.path.exists(os.path.join("src", "data", "agendas", m["id"] + ".json")) for m in man)
print(f"remaining sittings {left}, batches {len(batches)}, unlaunched {len(pending)}")
for p in pending[:take]:
    print(p)
if mark:
    open(LEDGER, "a", encoding="utf-8").write("".join(p + "\n" for p in pending[:take]))
