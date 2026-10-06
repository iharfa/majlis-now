"""Extract the text layer of a PDF (Dhivehi Unicode) to a .txt, one '--- page N ---' marker per page.

Usage: python scripts/extract_text.py <pdf> <out.txt>
Prints: pages, characters, and whether a usable text layer was found.
"""
import sys
import fitz

pdf, out = sys.argv[1], sys.argv[2]
doc = fitz.open(pdf)
parts, chars = [], 0
for i, page in enumerate(doc):
    t = page.get_text("text")
    chars += len(t.strip())
    parts.append(f"--- page {i + 1} ---\n{t}")
open(out, "w", encoding="utf-8", newline="\n").write("\n".join(parts))
print(f"pages={len(doc)} chars={chars} text_layer={'yes' if chars > 200 * max(1, len(doc)) // 4 else 'no'}")
