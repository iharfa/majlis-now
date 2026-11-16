"""Hansard pipeline (sitting minutes -> speeches linked to MPs).

  python scripts/build_hansard.py number <sid> [...]   # tmp/hansard/<sid>/numbered.txt + chunks.json for the speech agents
  python scripts/build_hansard.py build                # public/hansard/<sid>.json + src/data/hansard.json (index + coverage)

Steps: scripts/prepare_hansard.py renders pages; OCR agents (docs/hansard-ocr-agent-prompt.md) write pNN.txt;
`number`; speech agents (docs/hansard-speech-agent-prompt.md) write speeches.<k>.json; `build`.
"""
import glob, json, os, re, sys
import pymupdf

ROOT = "tmp/hansard"
CHUNK_CHARS = 28000  # ~10-12 pages of dense Dhivehi per speech agent


def lines_of(sid):
    out = []
    pages = [f for f in glob.glob(f"{ROOT}/{sid}/p*.txt") if re.fullmatch(r"p\d+\.txt", os.path.basename(f))]
    for f in sorted(pages, key=lambda f: int(re.search(r"p(\d+)\.txt$", f).group(1))):  # p01..p99, then p100+
        page = int(re.search(r"p(\d+)\.txt$", f).group(1))
        for ln in open(f, encoding="utf-8").read().splitlines():
            if ln.strip():
                out.append((page, ln.strip()))
    return out


def number(sid):
    ls = lines_of(sid)
    with open(f"{ROOT}/{sid}/numbered.txt", "w", encoding="utf-8", newline="\n") as f:
        for i, (p, t) in enumerate(ls, 1):
            f.write(f"{i:04d}|p{p:02d}| {t}\n")
    # chunks of ~CHUNK_CHARS of text, cut only just before a speaker heading
    chunks, start, item, cur_item = [], 1, "(start of sitting)", "(start of sitting)"
    size = 0
    for i, (p, t) in enumerate(ls, 1):
        if t.startswith("## ") and i > start and size >= CHUNK_CHARS:
            size = 0
            chunks.append({"k": len(chunks) + 1, "from": start, "to": i - 1, "item": item})
            start, item = i, cur_item
        if t.startswith("# "):
            cur_item = t[2:]
        size += len(t)
    chunks.append({"k": len(chunks) + 1, "from": start, "to": len(ls), "item": item})
    json.dump(chunks, open(f"{ROOT}/{sid}/chunks.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(sid, len(ls), "lines", [(c["from"], c["to"]) for c in chunks])


def roster():
    src = open("src/data/roster.ts", encoding="utf-8").read()
    out = []
    for line in src.splitlines():
        m = re.match(r"""\s*\[\s*(['"])(.*?)\1\s*,\s*(['"])(.*?)\3\s*,.*?'(\d+)'\s*(?:,\s*'([^']*)'\s*)?\],""", line)
        if m:
            out.append({"name": m.group(2), "constituency": m.group(4), "id": f"mp-{m.group(5)}", "role": m.group(6)})
    return out


def norm(s):
    return re.sub(r"[^a-z]", "", (s or "").lower())


def build():
    mps = roster()
    by_con = {norm(m["constituency"]): m for m in mps}
    by_name = {norm(m["name"]): m for m in mps}
    dup = {k for k in by_name if sum(norm(m["name"]) == k for m in mps) > 1}  # shared names (two Ibrahim Didis, two Mohamed Ibrahims)
    sittings = {s["id"]: s for s in json.load(open("src/data/sittings.json", encoding="utf-8"))}
    os.makedirs("public/hansard", exist_ok=True)
    index, problems = [], []
    for d in sorted(glob.glob(f"{ROOT}/*/")):
        sid = os.path.basename(d.rstrip("/\\"))
        cpath = os.path.join(d, "chunks.json")
        chunks = json.load(open(cpath, encoding="utf-8")) if os.path.exists(cpath) else []
        parts = [os.path.join(d, f"speeches.{c['k']}.json") for c in chunks]
        if not chunks or not all(os.path.exists(p) for p in parts):
            continue
        ls = lines_of(sid)
        items, speeches = [], []
        for f in parts:
            j = json.load(open(f, encoding="utf-8"))
            items += j.get("items", [])
            speeches += j["speeches"]
        speeches.sort(key=lambda s: s["start"])
        exp = 1  # coverage check: speeches tile the whole document
        for s in speeches:
            if s["start"] != exp:
                problems.append(f"{sid}: gap/overlap at line {exp} (next speech starts {s['start']})")
            exp = s["end"] + 1
        if exp != len(ls) + 1:
            problems.append(f"{sid}: speeches end at {exp - 1}, document has {len(ls)} lines")
        item_by_line = {i["line"]: i for i in items}
        cur, out = None, []
        for n, s in enumerate(speeches, 1):
            seg = ls[s["start"] - 1:s["end"]]
            heading = seg[0][1][3:] if seg and seg[0][1].startswith("## ") else None
            body = [t for _, t in (seg[1:] if heading else seg)]
            m = by_con.get(norm(s.get("constituency"))) if s.get("constituency") else None
            if not m and s["role"] in ("member", "chair"):
                m = by_name.get(norm(s.get("name")))  # never for ministers: MPs can't be ministers, a shared name is a different person
            alt = by_name.get(norm(s.get("name"))) if s["role"] in ("member", "chair") else None
            if m and alt and alt["id"] != m["id"] and norm(s.get("name")) not in dup:  # e.g. Funadhoo vs Fonadhoo misread: name says one MP, seat says another
                problems.append(f"{sid} speech {n}: name {s.get('name')} is {alt['constituency']} but seat given as {s.get('constituency')}")
            if s["role"] in ("member", "chair") and not m:
                problems.append(f"{sid} speech {n}: unmatched {s.get('name')} / {s.get('constituency')}")
            # item: the one in progress when this speech starts, or one announced inside it
            here = [item_by_line[k] for k in range(s["start"], s["end"] + 1) if k in item_by_line]
            item = cur or (here[0] if here else None)
            out.append({
                "n": n, "page": seg[0][0] if seg else None, "pageEnd": seg[-1][0] if seg else None,
                "item": item["n"] if item else None,
                "role": s["role"], "mpId": m["id"] if m else None,
                "name": m["name"] if m else s.get("name"), "constituency": m["constituency"] if m else s.get("constituency", ""),
                "heading": heading, "dv": "\n".join(body), "en": s["en"].strip(),
                "words": len(s["en"].split()),
            })
            if here:
                cur = here[-1]
        st = sittings.get(sid, {})
        pages = len(glob.glob(os.path.join(d, "p[0-9]*.png")))
        rec = {"id": sid, "date": st.get("date"), "title": st.get("title"), "pages": pages, "sourceUrl": st.get("minutesPdf"),
               "items": [{"n": i["n"], "title": i["title"]} for i in sorted(items, key=lambda i: i["line"])], "speeches": out}
        json.dump(rec, open(f"public/hansard/{sid}.json", "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
        spk = {}
        for s in out:
            if s["mpId"] and s["role"] == "member":
                v = spk.setdefault(s["mpId"], [0, 0])
                v[0] += 1
                v[1] += s["words"]
        index.append({"id": sid, "date": rec["date"], "title": rec["title"], "pages": pages, "speeches": len(out),
                      "words": sum(s["words"] for s in out),
                      "voices": len({(s["name"], s["role"] == "chair") for s in out if s["role"] != "other" and s["role"] != "chair"}),
                      "speakers": [{"mpId": k, "speeches": v[0], "words": v[1]} for k, v in sorted(spk.items(), key=lambda x: -x[1][1])]})
    # coverage of the full dataset = every sitting's minutes PDF we hold
    tot_s = tot_p = 0
    for s in sittings.values():
        f = s.get("minutesFile")
        if f and os.path.exists(f):
            tot_s += 1
            tot_p += pymupdf.open(f).page_count
    index.sort(key=lambda x: x["date"] or "", reverse=True)
    data = {"coverage": {"sittingsDone": len(index), "sittingsTotal": tot_s, "pagesDone": sum(x["pages"] for x in index),
                         "pagesTotal": tot_p, "speeches": sum(x["speeches"] for x in index)},
            "sittings": index}
    json.dump(data, open("src/data/hansard.json", "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
    print(json.dumps(data["coverage"]))
    for p in problems:
        print("PROBLEM", p)
    return problems


if __name__ == "__main__":
    if sys.argv[1] == "number":
        for sid in sys.argv[2:]:
            number(sid)
    else:
        build()
