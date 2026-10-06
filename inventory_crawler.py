#!/usr/bin/env python3
"""
Crawl OTHER document-bearing sections of majlis.gov.mv for the 20th Parliament.
Sections: registry, point-of-order, calendar, speaker/deputy/leading-members,
secretariate downloads/regulations/resources, media/special_majlis,
speaker-speeches, news-events, parliamentary-education.
"""

import sys, re, json, os, urllib.request, urllib.error
sys.path.insert(0, 'scripts')
from majlis import fetch, strip_tags, UA

SECTIONS = [
    ("majlis-registry", "https://majlis.gov.mv/en/20-parliament/majlis-registry"),
    ("point-of-order", "https://majlis.gov.mv/en/20-parliament/point-of-order"),
    ("calendar", "https://majlis.gov.mv/en/20-parliament/calendar"),
    ("speaker", "https://majlis.gov.mv/en/20-parliament/speaker"),
    ("deputy-speaker", "https://majlis.gov.mv/en/20-parliament/deputy-speaker"),
    ("leading-members", "https://majlis.gov.mv/en/20-parliament/leading-members"),
    ("secretariate-downloads", "https://majlis.gov.mv/en/secretariate/downloads"),
    ("secretariate-regulations", "https://majlis.gov.mv/en/secretariate/regulations"),
    ("secretariat-resources", "https://majlis.gov.mv/en/secretariat/resources"),
    ("special-majlis", "https://majlis.gov.mv/en/media/special_majlis"),
    ("speaker-speeches", "https://majlis.gov.mv/en/speaker-speeches"),
    ("news-events", "https://majlis.gov.mv/en/news-events"),
    ("parliamentary-education", "https://majlis.gov.mv/en/parliamentary-education"),
]

def extract_heading(html):
    """Extract page heading (h1 or page title)."""
    m = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
    if m:
        return strip_tags(m.group(1))
    m = re.search(r'<title>([^<]+)</title>', html)
    if m:
        return strip_tags(m.group(1))
    return None

def extract_storage_links(html):
    """Extract all https://majlis.gov.mv/storage/... links with labels."""
    links = []
    for m in re.finditer(r'<a[^>]*href=["\']?(https://majlis\.gov\.mv/storage/[^"\'>\s]+)["\']?[^>]*>(.*?)</a>', html, re.DOTALL | re.I):
        url = m.group(1)
        label_html = m.group(2)
        label = strip_tags(label_html)
        links.append((label, url))
    return links

def get_content_length(url):
    """Get file size via HEAD request, return bytes or None."""
    try:
        req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=10) as r:
            cl = r.headers.get('Content-Length')
            return int(cl) if cl else None
    except Exception as e:
        return None

def crawl_section(name, url, max_pages=30):
    """
    Crawl a section and extract heading, documents, subpages.
    Follow sub-pages if they link to the same domain and appear to be part of the section.
    """
    result = {
        'url': url,
        'heading': None,
        'documents': [],
        'subpages': [],
        'notes': [],
    }

    visited = set()
    to_visit = [url]
    page_count = 0

    while to_visit and page_count < max_pages:
        current_url = to_visit.pop(0)
        if current_url in visited:
            continue
        visited.add(current_url)
        page_count += 1

        try:
            html = fetch(current_url, refresh=False)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                result['notes'].append(f"Page not found: {current_url}")
                return result
            else:
                result['notes'].append(f"HTTP error {e.code}: {current_url}")
                continue
        except Exception as e:
            result['notes'].append(f"Fetch error: {str(e)[:100]}")
            continue

        # Extract heading from first page only
        if page_count == 1:
            result['heading'] = extract_heading(html)

        # Extract storage links
        for label, link_url in extract_storage_links(html):
            # Get file size
            size = get_content_length(link_url)
            result['documents'].append({
                'label': label,
                'url': link_url,
                'bytes': size,
                'page': page_count,
            })

        # Look for pagination or sub-pages
        # Common patterns: next page link, "View More", year/term filters, etc.
        # Look for links that are clearly part of the same section
        for m in re.finditer(r'<a\s+[^>]*href=["\']?(/en/[^"\'>\s]+)["\']?[^>]*>([^<]+)</a>', html, re.I):
            link_path = m.group(1)
            link_text = strip_tags(m.group(2)).lower()

            # Only follow links that:
            # 1. Are in /en/ domain
            # 2. Contain keywords suggesting they're part of section (year, term, "next", "more", "view")
            # 3. Don't already have a page number > we can follow

            keywords = ['next', 'more', 'view', '202', '19', '20', '21', 'term', 'year']
            if any(kw in link_text for kw in keywords):
                full_url = 'https://majlis.gov.mv' + link_path if link_path.startswith('/') else link_path

                # Only follow if same domain and not yet visited
                if 'majlis.gov.mv' in full_url and full_url not in visited and full_url not in to_visit:
                    # Check if it looks like it's part of the same section
                    if name in full_url or name.replace('-', '/') in full_url or True:  # relaxed check
                        to_visit.append(full_url)
                        if full_url not in result['subpages']:
                            result['subpages'].append(full_url)

    result['documents'] = sorted(result['documents'], key=lambda x: (x['page'], x['label']))
    return result

def is_parliament_specific(section_name, doc_url):
    """Check if document is 20th parliament specific vs general secretariat."""
    if '20-parliament' in doc_url:
        return True
    if section_name.startswith('20-parliament'):
        return True
    # secretariate sections can be general or parliament-specific
    if 'parliament' in doc_url.lower():
        return True
    return False

# Main crawl
output = {}
for name, url in SECTIONS:
    print(f"Crawling {name}...", file=sys.stderr)
    result = crawl_section(name, url)
    output[name] = result

# Write results
out_dir = '/c/Users/AHMED~1.AFR/AppData/Local/Temp/claude/C--Users-ahmed-afrah-RTI/ab45b1e7-1510-48d2-984f-a111fa38d77a/scratchpad/inventory'
os.makedirs(out_dir, exist_ok=True)

# Save detailed inventory
with open(f'{out_dir}/other_sections.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

# Build summary
summary = {}
grand_total_docs = 0
grand_total_bytes = 0

for section_name, data in output.items():
    docs = data['documents']
    doc_count = len(docs)
    total_bytes = sum(d['bytes'] or 0 for d in docs)
    parliament_specific_count = sum(1 for d in docs if is_parliament_specific(section_name, d['url']))

    summary[section_name] = {
        'documents': doc_count,
        'bytes': total_bytes,
        'parliament_specific': parliament_specific_count,
        'heading': data['heading'],
        'has_subpages': len(data['subpages']) > 0,
        'notes': data['notes'],
    }

    grand_total_docs += doc_count
    grand_total_bytes += total_bytes

summary['_totals'] = {
    'total_documents': grand_total_docs,
    'total_bytes': grand_total_bytes,
}

with open(f'{out_dir}/other_summary.json', 'w', encoding='utf-8') as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(json.dumps(summary, indent=2), file=sys.stderr)
