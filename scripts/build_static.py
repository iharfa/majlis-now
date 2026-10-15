"""Generate public/sitemap.xml and public/og.png from the committed data.

Run from repo root (after the data scripts): python scripts/build_static.py
"""
import json, os, re

SITE = "https://majlis-now.vercel.app"
works = json.load(open("src/data/works.json", encoding="utf-8"))
sittings = json.load(open("src/data/sittings.json", encoding="utf-8"))
mp_ids = re.findall(r"'(\d{3})'(?:, '[^']*')?\],", open("src/data/roster.ts", encoding="utf-8").read())
cmt_ids = re.findall(r'"id": "(\d+)"', open("src/data/realCommittees.ts", encoding="utf-8").read())

urls = ["/", "/bills", "/votes", "/mps", "/compare", "/issues", "/committees", "/sittings", "/search", "/insights"]
urls += [f"/bills/bill-{w['id']}" for w in works]
urls += [f"/sittings/sitting-{s['id']}" for s in sittings]
urls += [f"/mps/mp-{i}" for i in mp_ids]
urls += [f"/committees/cmt-{i}" for i in cmt_ids]
rc = open("src/data/realRollcalls.ts", encoding="utf-8").read() if os.path.exists("src/data/realRollcalls.ts") else ""
urls += [f"/votes/vote-{i}" for i in re.findall(r'^\s+id: "([^"]+)",', rc, flags=re.M)]

os.makedirs("public", exist_ok=True)
xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
xml += "".join(f"  <url><loc>{SITE}{u}</loc></url>\n" for u in dict.fromkeys(urls))
xml += "</urlset>\n"
open("public/sitemap.xml", "w", encoding="utf-8", newline="\n").write(xml)
print("sitemap:", len(set(urls)), "urls")

# OG image: plain 1200x630 card rendered with PyMuPDF (no extra deps).
import fitz
n_votes = len(re.findall(r'^\s+id: "([^"]+)",', rc, flags=re.M))
doc = fitz.open()
page = doc.new_page(width=1200, height=630)
page.draw_rect(fitz.Rect(0, 0, 1200, 630), color=None, fill=(0.275, 0.282, 0.831))
page.draw_rect(fitz.Rect(0, 0, 18, 630), color=None, fill=(1, 0.78, 0.25))
white, soft, faint = (1, 1, 1), (0.88, 0.88, 1), (0.75, 0.76, 1)
page.insert_text((80, 130), "CSO-LED PARLIAMENTARY OVERSIGHT  ·  BUILT FOR YOUTH", fontsize=24, fontname="hebo", color=(1, 0.78, 0.25))
page.insert_text((80, 245), "Majlis Now", fontsize=104, fontname="hebo", color=white)
page.insert_text((80, 320), "What happens in Parliament, demystified.", fontsize=40, fontname="helv", color=soft)
page.insert_text((80, 372), "So we can engage with what matters most to us.", fontsize=40, fontname="helv", color=soft)
stats = [(len(works), "bills tracked"), (n_votes, "roll-call votes"), (len(sittings), "sittings")]
for k, (n, label) in enumerate(stats):
    x = 80 + k * 300
    page.insert_text((x, 480), str(n), fontsize=56, fontname="hebo", color=white)
    page.insert_text((x, 515), label, fontsize=24, fontname="helv", color=faint)
page.insert_text((80, 585), "majlis-now.vercel.app  ·  from official People's Majlis records", fontsize=24, fontname="helv", color=faint)
page.get_pixmap(dpi=72).save("public/og.png")
print("og.png written")
