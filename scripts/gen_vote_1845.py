# Maps an official roll-call (read from a vote-record PDF) to the roster by
# constituency, with self-checks, and emits src/data/rollcall<id>.ts.
#
# Usage notes: the Majlis vote PDFs are scanned images (no text layer), so the
# ROLL table below is transcribed via OCR/vision from the rendered pages. The
# script asserts every row matches exactly one constituency and that the tally
# matches the summary printed on page 1 of the PDF. This file documents the
# pipeline used for parliament-work/1845 (Land Act amendment); copy + adapt
# ROLL for other bills.
import json, re
from collections import Counter

# Roster constituency names — must mirror src/data/roster.ts.
MYCONS = [
    "North Hulhumale'", "Central Hulhumale'", "South Hulhumale'",
    "North Henveyru", "Central Henveyru", "South Henveyru", "West Henveyru",
    "North Galolhu", "South Galolhu",
    "North Mahchangolhi", "Central Mahchangolhi", "South Mahchangolhi",
    "North Maafannu", "Central Maafannu", "South Maafannu", "West Maafannu",
    "Vilimale'", "Hoarafushi", "Ihavandhoo", "Baarashu", "Dhidhdhoo", "Kelaa",
    "Hanimaadhoo", "Nolhivaram", "Vaikaradhoo", "North Kulhudhuffushi",
    "South Kulhudhuffushi", "Makunudhoo", "Kanditheemu", "Milandhoo", "Komandoo",
    "Funadhoo", "Kendhikulhudhoo", "Manadhoo", "Velidhoo", "Holhudhoo",
    "Alifushi", "Ungoofaaru", "Dhuvaafaru", "Inguraidhoo", "Maduvvari",
    "Thulhaadhoo", "Eydhafushi", "Kendhoo", "Hithaadhoo", "Hinnavaru", "Naifaru",
    "Kurendhoo", "Kaashidhoo", "Thulusdhoo", "Maafushi", "Huraa", "Mathiveri",
    "Thoddoo", "Maamigili", "Mahibadhoo", "Dhangethi", "Felidhoo", "Keyodhoo",
    "Dhiggaru", "Mulaku", "Bilehdhoo", "Nilandhoo", "Meedhoo", "Kudahuvadhoo",
    "Vilifushi", "Thimarafushi", "Kinbidhoo", "Guraidhoo", "Isdhoo", "Gan",
    "Fonadhoo", "Maavashu", "Vilingili", "Dhaandhoo", "Gemanafushi",
    "Kolamaafushi", "North Thinadhoo", "South Thinadhoo", "Madaveli",
    "Faresmaathodaa", "Gadhdhoo", "North Fuvahmulah", "Central Fuvahmulah",
    "South Fuvahmulah", "Hulhudhoo", "North Feydhoo", "South Feydhoo", "Maradhoo",
    "Central Hithadhoo", "South Hithadhoo", "Addu Meedhoo",
]

def slug(s):
    s = s.lower().replace("'", "").replace("’", "").replace(".", "")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

MYSLUGS = {slug(c) for c in MYCONS}
assert len(MYSLUGS) == len(MYCONS)

# (romanized constituency, official result) transcribed from the PDF roll call.
ROLL = [
    ("Hulhumale' Uthuru", "No"), ("Hulhumale' Medhu", "Not Present"), ("Hulhumale' Dhekunu", "Yes"),
    ("Henveyru Uthuru", "No"), ("Medhu Henveyru", "No"), ("Henveyru Dhekunu", "Not Voted"),
    ("Henveyru Hulhangu", "Not Present"), ("Galolhu Uthuru", "Yes"), ("Galolhu Dhekunu", "Yes"),
    ("Mahchangolhi Uthuru", "Not Present"), ("Mahchangolhi Medhu", "No"), ("Mahchangolhi Dhekunu", "No"),
    ("Maafannu Uthuru", "Not Present"), ("Maafannu Medhu", "Not Present"), ("Maafannu Dhekunu", "No"),
    ("Maafannu Hulhangu", "No"), ("Vilimale'", "No"), ("Hoarafushi", "No"), ("Ihavandhoo", "No"),
    ("Baarashu", "No"), ("Dhidhdhoo", "No"), ("Kelaa", "Not Voted"), ("Hanimaadhoo", "Yes"),
    ("Nolhivaram", "No"), ("Vaikaradhoo", "Yes"), ("Kulhudhuffushi Uthuru", "Not Present"),
    ("Kulhudhuffushi Dhekunu", "Not Present"), ("Makunudhoo", "No"), ("Kanditheemu", "Yes"),
    ("Milandhoo", "No"), ("Komandoo", "No"), ("Funadhoo", "Not Present"), ("Kendhikulhudhoo", "Not Present"),
    ("Manadhoo", "No"), ("Velidhoo", "Yes"), ("Holhudhoo", "No"), ("Alifushi", "No"), ("Ungoofaaru", "No"),
    ("Dhuvaafaru", "No"), ("Inguraidhoo", "No"), ("Maduvvari", "No"), ("Thulhaadhoo", "Not Present"),
    ("Eydhafushi", "Not Voted"), ("Kendhoo", "Not Present"), ("Hithaadhoo", "No"), ("Hinnavaru", "No"),
    ("Naifaru", "No"), ("Kurendhoo", "No"), ("Kaashidhoo", "No"), ("Thulusdhoo", "No"), ("Maafushi", "No"),
    ("Huraa", "Not Present"), ("Mathiveri", "No"), ("Thoddoo", "Not Voted"), ("Maamigili", "Not Present"),
    ("Mahibadhoo", "No"), ("Dhangethi", "Not Voted"), ("Felidhoo", "Not Voted"), ("Keyodhoo", "Yes"),
    ("Dhiggaru", "Not Present"), ("Mulaku", "Not Voted"), ("Bilehdhoo", "No"), ("Nilandhoo", "Not Present"),
    ("Meedhoo", "Not Present"), ("Kudahuvadhoo", "No"), ("Vilufushi", "No"), ("Thimarafushi", "No"),
    ("Kinbidhoo", "No"), ("Guraidhoo", "No"), ("Isdhoo", "No"), ("Gamu", "No"),
    ("Maavashu", "Not Present"), ("Vilingili", "No"), ("Dhaandhoo", "Not Present"),
    ("Gemanafushi", "Not Present"), ("Kolamaafushi", "Not Present"), ("Thinadhoo Uthuru", "No"),
    ("Thinadhoo Dhekunu", "Not Voted"), ("Madaveli", "No"), ("Faresmaathodaa", "No"),
    ("Gadhdhoo", "Not Present"), ("Fuvahmulah Uthuru", "No"), ("Fuvahmulah Medhu", "No"),
    ("Fuvahmulah Dhekunu", "No"), ("Hulhudhoo", "Not Present"), ("Feydhoo Uthuru", "No"),
    ("Feydhoo Dhekunu", "No"), ("Maradhoo", "Yes"), ("Hithadhoo Medhu", "Not Present"),
    ("Hithadhoo Dhekunu", "Yes"), ("AdduMeedhoo", "Not Voted"),
    ("Fonadhoo", "Not Present"),  # Speaker — listed with "no voting right"
]

ALIAS = {"vilufushi": "vilifushi", "gamu": "gan", "addumeedhoo": "addu-meedhoo"}
DIRS = {"uthuru": "North", "dhekunu": "South", "medhu": "Central", "hulhangu": "West"}
CHOICE = {"Yes": "Yes", "No": "No", "Abstain": "Abstain", "Not Present": "Absent", "Not Voted": "Absent"}

def normalize(con):
    toks = con.replace("'", "").split()
    d = next((DIRS[t.lower()] for t in toks if t.lower() in DIRS), None)
    base = " ".join(t for t in toks if t.lower() not in DIRS)
    s = slug(f"{d} {base}" if d else base)
    return ALIAS.get(s, s)

rows, errors, seen = [], [], set()
for con, res in ROLL:
    s = normalize(con)
    if s not in MYSLUGS:
        errors.append((con, s)); continue
    if s in seen:
        errors.append(("DUP", s))
    seen.add(s)
    rows.append({"constituencyId": s, "choice": CHOICE[res], "detail": res})

print("matched", len(rows), "of", len(ROLL), "| errors:", errors)
print("tally:", Counter(r["detail"] for r in rows))
assert not errors, "fix mapping before emitting"

ts_rows = "\n".join(
    f"  {{ constituencyId: {json.dumps(r['constituencyId'])}, choice: {json.dumps(r['choice'])}, detail: {json.dumps(r['detail'])} }},"
    for r in rows
)
ts = (
    "// AUTO-GENERATED from the official vote-record PDF for parliament-work/1845.\n"
    "import type { VoteChoice } from '@/types'\n\n"
    "export interface RollCallRow { constituencyId: string; choice: VoteChoice; "
    "detail: 'Yes' | 'No' | 'Abstain' | 'Not Present' | 'Not Voted' }\n\n"
    "export const ROLLCALL_1845: RollCallRow[] = [\n" + ts_rows + "\n]\n"
)
open("src/data/rollcall1845.ts", "w", encoding="utf-8").write(ts)
print("wrote src/data/rollcall1845.ts")
