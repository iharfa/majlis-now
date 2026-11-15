"""Print the next N minutes parts that have no digest yet and have not been handed
to an agent, newest sitting first, as ready-to-use agent values
(see docs/minutes-agent-prompt.md).

Usage: python scripts/minutes_queue.py [N=12] [--mark]
  --mark   record the printed parts in tmp/minutes_parts/_launched.txt so the
           next call skips them (delete a line there to re-queue a failed part)
"""
import json, os, sys

args = [a for a in sys.argv[1:] if not a.startswith("--")]
n = int(args[0]) if args else 12
mark = "--mark" in sys.argv
PARTS = os.path.join("tmp", "minutes_parts")
LEDGER = os.path.join(PARTS, "_launched.txt")
os.makedirs(PARTS, exist_ok=True)
launched = set(open(LEDGER, encoding="utf-8").read().split()) if os.path.exists(LEDGER) else set()
man = json.load(open(os.path.join("tmp", "text", "minutes_manifest.json"), encoding="utf-8"))
todo, inflight, done = [], 0, 0
for m in man:
    for k, path in enumerate(m["parts"], 1):
        key = f"{m['id']}.p{k}"
        if os.path.exists(os.path.join(PARTS, key + ".json")):
            done += 1
        elif os.path.getsize(path) < 3000:
            # a trailing sliver (footer + blank pages): stub it, no agent needed
            json.dump({"sittingId": m["id"], "partIndex": k, "stub": True, "presiding": "", "attendance": {"present": None, "onLeave": None, "officialTravel": None},
                       "summary": "", "items": [], "speakers": [], "decisions": [], "votes": [], "confidence": "High", "model": "none", "generatedAt": ""},
                      open(os.path.join(PARTS, key + ".json"), "w", encoding="utf-8"))
            done += 1
        elif key in launched:
            inflight += 1
        else:
            todo.append((m, k, path, key))
print(f"done {done}, in flight {inflight}, remaining {len(todo)}")
for m, k, path, key in todo[:n]:
    print(f'SID={m["id"]} TITLE="{m["title"]}" DATE={m["date"]} PART={k} NPARTS={len(m["parts"])} FILE={path}')
if mark:
    with open(LEDGER, "a", encoding="utf-8") as f:
        f.write("".join(key + "\n" for *_, key in todo[:n]))
