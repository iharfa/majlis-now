"""Render a PDF's pages to PNG so a vision model can read scanned Dhivehi documents.

Usage: python scripts/render_pages.py <pdf> <out_dir> [dpi=150] [max_pages=40]
Prints one output path per line.
"""
import os, sys
import fitz

pdf, out = sys.argv[1], sys.argv[2]
dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 150
max_pages = int(sys.argv[4]) if len(sys.argv) > 4 else 40
os.makedirs(out, exist_ok=True)
doc = fitz.open(pdf)
for i in range(min(len(doc), max_pages)):
    path = os.path.join(out, f"p{i + 1:02d}.png")
    if not os.path.exists(path):
        doc[i].get_pixmap(dpi=dpi).save(path)
    print(path)
print(f"# {len(doc)} pages total", file=sys.stderr)
