"""Shared helpers for the majlis.gov.mv ingestion scripts.

- fetch(): HTTP GET with a browser User-Agent (the site 403s default clients),
  cached on disk under tmp/cache so re-runs are cheap and offline-friendly.
- roster_constituencies(): the constituency names from src/data/roster.ts, so
  the vote mapper can never drift from the roster.
"""
import hashlib, html as ihtml, os, re, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(ROOT, "tmp")
CACHE = os.path.join(TMP, "cache")
BASE = "https://majlis.gov.mv/en/20-parliament"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36 majlis-now/1.0"
RUN_DATE = time.strftime("%Y-%m-%d")


def fetch(url, binary=False, refresh=False):
    os.makedirs(CACHE, exist_ok=True)
    key = os.path.join(CACHE, hashlib.sha1(url.encode()).hexdigest() + (".bin" if binary else ".html"))
    if not refresh and os.path.exists(key):
        return open(key, "rb").read() if binary else open(key, encoding="utf-8").read()
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            break
        except Exception as e:  # transient 5xx / resets
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))
    if binary:
        open(key, "wb").write(data)
        return data
    text = data.decode("utf-8", errors="ignore")
    open(key, "w", encoding="utf-8").write(text)
    return text


def strip_tags(s):
    s = re.sub(r"<(style|script)[^>]*>.*?</\1>", "", s, flags=re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", ihtml.unescape(s)).replace("\xa0", " ").strip()


def slug(s):
    s = s.lower().replace("'", "").replace("’", "").replace(".", "")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def roster_constituencies():
    src = open(os.path.join(ROOT, "src", "data", "roster.ts"), encoding="utf-8").read()
    # rows look like: ['Name', "North Hulhumale'", 'Atoll', 'party', 'hash', 'id'],
    # (the constituency may be double-quoted because it contains an apostrophe)
    rows = re.findall(r"""^\s*\[\s*(['"])(?:(?!\1).)*\1\s*,\s*(['"])((?:(?!\2).)*)\2""", src, flags=re.M)
    out = [r[2] for r in rows]
    assert len(out) >= 90, f"roster parse found only {len(out)} rows"
    return out


MONTHS = {m: f"{i:02d}" for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}


def iso_date(text):
    """'17 Aug 2026', '17.August.2026', 'Tuesday 6 October 2026' -> '2026-08-17' (or None)."""
    m = re.search(r"(\d{1,2})[\s.]+([A-Za-z]{3})[A-Za-z]*[\s.]+(\d{4})", text or "")
    if not m:
        return None
    mon = MONTHS.get(m.group(2).lower())
    return f"{m.group(3)}-{mon}-{int(m.group(1)):02d}" if mon else None


def speaker_constituency():
    """Constituency of the row flagged 'Speaker' in roster.ts (the presiding Speaker's own seat)."""
    src = open(os.path.join(ROOT, "src", "data", "roster.ts"), encoding="utf-8").read()
    m = re.search(r"""^\s*\[\s*(['"])(?:(?!\1).)*\1\s*,\s*(['"])((?:(?!\2).)*)\2.*'Speaker'\]""", src, flags=re.M)
    return m.group(3) if m else None
