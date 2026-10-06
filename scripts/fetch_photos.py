"""Download every MP's official photo from majlis.gov.mv into public/photos/<id>.jpg
so the site never hotlinks (or depends on) the source server at runtime.

Run from repo root: python scripts/fetch_photos.py
"""
import os, re
import fitz
from majlis import fetch

WIDTH = 360  # px; the largest the UI renders is the 4:5 hero on the MP page

ROSTER = open("src/data/roster.ts", encoding="utf-8").read()
rows = re.findall(r"'([A-Za-z0-9]{40})', '(\d+)'", ROSTER)
os.makedirs("public/photos", exist_ok=True)
for h, pid in rows:
    path = f"public/photos/{pid}.jpg"
    if os.path.exists(path):
        continue
    raw = fetch(f"https://majlis.gov.mv/storage/members/{h}.jpg", binary=True)
    img = fitz.open(stream=raw, filetype="jpg")
    scale = min(1, WIDTH / img[0].rect.width)
    img[0].get_pixmap(matrix=fitz.Matrix(scale, scale)).save(path, jpg_quality=82)
    print("fetched", pid)
print(len(rows), "photos present")
