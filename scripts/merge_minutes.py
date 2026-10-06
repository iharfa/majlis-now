"""Merge per-part minutes digests (tmp/minutes_parts/<id>.p<k>.json, written by
Claude agents) into one src/data/minutes/<id>.json per sitting.

A sitting is merged only when every part listed in tmp/text/minutes_manifest.json
exists. Speakers are merged by constituency (turns summed, positions concatenated,
max 4). Confidence is the lowest of the parts.

Run from repo root: python scripts/merge_minutes.py
"""
import json, os

MAN = os.path.join("tmp", "text", "minutes_manifest.json")
PARTS = os.path.join("tmp", "minutes_parts")
OUT = os.path.join("src", "data", "minutes")
ORDER = {"High": 0, "Medium": 1, "Low": 2}
os.makedirs(OUT, exist_ok=True)

merged = skipped = 0
for m in json.load(open(MAN, encoding="utf-8")):
    files = [os.path.join(PARTS, f"{m['id']}.p{k}.json") for k in range(1, len(m["parts"]) + 1)]
    if not all(os.path.exists(f) for f in files):
        skipped += 1
        continue
    parts = [json.load(open(f, encoding="utf-8")) for f in files]
    first = parts[0]
    # The presiding chair is not a speaker; some agents listed them anyway.
    presiding = " ".join(p.get("presiding", "") for p in parts).lower()
    chair_seats = {seat for name, seat in (("abdul raheem", "fonadhoo"), ("ahmed saleem", "eydhafushi"), ("ahmed nazim", "dhiggaru")) if name in presiding or seat in presiding}
    speakers = {}
    for p in parts:
        for sp in p.get("speakers", []):
            if (sp.get("constituency") or "").strip().lower() in chair_seats:
                continue
            key = (sp.get("constituency") or sp.get("name") or "").strip().lower()
            cur = speakers.setdefault(key, {"name": sp.get("name", ""), "constituency": sp.get("constituency", ""), "turns": 0, "positions": []})
            cur["turns"] += int(sp.get("turns") or 0)
            for pos in sp.get("positions", []):
                if pos and pos not in cur["positions"] and len(cur["positions"]) < 4:
                    cur["positions"].append(pos)
    summary = " ".join(p.get("summary", "").strip() for p in parts if p.get("summary"))
    digest = {
        "sittingId": m["id"], "date": m["date"], "title": m["title"],
        "presiding": first.get("presiding", ""),
        "attendance": first.get("attendance", {"present": None, "onLeave": None, "officialTravel": None}),
        "summary": summary,
        "items": [i for p in parts for i in p.get("items", [])],
        "speakers": sorted(speakers.values(), key=lambda s: -s["turns"]),
        "decisions": [d for p in parts for d in p.get("decisions", [])],
        "votes": [v for p in parts for v in p.get("votes", [])],
        "pagesTotal": m["pages"], "parts": len(parts),
        "confidence": max((p.get("confidence", "Low") for p in parts if not p.get("stub") and (p.get("speakers") or p.get("items"))) or ["Low"], key=lambda c: ORDER.get(c, 2)),
        "model": next((p.get("model", "") for p in parts if not p.get("stub")), ""),
        "generatedAt": next((p.get("generatedAt", "") for p in parts if not p.get("stub")), ""),
    }
    json.dump(digest, open(os.path.join(OUT, f"{m['id']}.json"), "w", encoding="utf-8", newline="\n"), indent=1, ensure_ascii=False)
    merged += 1
print(f"merged {merged}, waiting on parts for {skipped}")
