"""OCR a Majlis vote-record PDF into a roll-call list.

The PDFs are scanned images with a fixed 4-column layout
(ID | Name | Constituency | Result). We render each page, run RapidOCR, then
assign each text box to a column by its x-centre and group boxes into rows by
y-centre. Output: JSON { rows: [{constituency, result}], summary: {...} }.

Usage: python scripts/extract_vote.py <pdf_path> <out_json>
"""
import sys, json, re
import fitz
from rapidocr_onnxruntime import RapidOCR

RESULTS = {"Yes", "No", "Abstain", "Not Present", "Not Voted", "No voting right"}

def boxes_for_page(ocr, doc, i, dpi=300):
    pix = doc[i].get_pixmap(dpi=dpi)
    tmp = f"_ocr_p{i}.png"
    pix.save(tmp)
    res, _ = ocr(tmp)
    out = []
    for box, text, _conf in res or []:
        xc = sum(p[0] for p in box) / 4
        yc = sum(p[1] for p in box) / 4
        out.append((yc, xc, text.strip()))
    return out, pix.width

def group_rows(boxes, ytol=14):
    boxes = sorted(boxes, key=lambda b: b[0])
    rows, cur, cy = [], [], None
    for yc, xc, t in boxes:
        if cy is None or abs(yc - cy) <= ytol:
            cur.append((xc, t))
            cy = yc if cy is None else (cy + yc) / 2
        else:
            rows.append(cur)
            cur, cy = [(xc, t)], yc
    if cur:
        rows.append(cur)
    return rows

def parse_rollcall(pdf_path):
    ocr = RapidOCR()
    doc = fitz.open(pdf_path)
    rows_out = []
    summary = {}
    date = None
    for i in range(len(doc)):
        boxes, W = boxes_for_page(ocr, doc, i)
        # DPI-independent column boundaries (fractions of page width)
        id_max, con_lo, con_hi, res_lo = 0.16 * W, 0.45 * W, 0.70 * W, 0.70 * W
        if date is None:
            for (_yc, _xc, t) in boxes:
                m = re.search(r"(\d{1,2})\.([A-Za-z]+)\.(\d{4})", t)
                if m:
                    date = m.group(0)
                    break
        # page 1 carries the summary (Yes/No/Abstain/Present/...)
        for j, (yc, xc, t) in enumerate(boxes):
            key = t.rstrip(":").strip()
            if key in ("Yes", "No", "Abstain", "Present", "Eligible to vote", "Voted", "Not Voted"):
                # find the number box on the same row (similar y, larger x)
                for (yc2, xc2, t2) in boxes:
                    if abs(yc2 - yc) <= 14 and xc2 > xc and re.fullmatch(r"\d+", t2):
                        summary.setdefault(key, int(t2))
                        break
        # table rows
        for row in group_rows(boxes):
            row = sorted(row, key=lambda c: c[0])
            constituency = None
            result = None
            has_id = False
            for xc, t in row:
                if xc < id_max and re.fullmatch(r"\d+", t):
                    has_id = True
                elif con_lo <= xc < con_hi:
                    constituency = t
                elif xc >= res_lo:
                    result = t
            # accept rows that look like a member line with a known result
            if result in RESULTS and (constituency or has_id):
                rows_out.append({"constituency": constituency or "", "result": result})
    return {"rows": rows_out, "summary": summary, "date": date}

if __name__ == "__main__":
    pdf, out = sys.argv[1], sys.argv[2]
    data = parse_rollcall(pdf)
    json.dump(data, open(out, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    from collections import Counter
    print("rows:", len(data["rows"]))
    print("result tally:", dict(Counter(r["result"] for r in data["rows"])))
    print("summary:", data["summary"])
    print("wrote", out)
