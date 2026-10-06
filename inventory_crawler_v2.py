#!/usr/bin/env python3
"""
Crawl OTHER document-bearing sections of majlis.gov.mv for the 20th Parliament.
Improved version with better handling of pagination, subpages, and parliament-specific detection.
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

def count_articles(html):
    """Count article/item divs on news-like pages."""
    # Look for article containers or news item patterns
    articles = re.findall(r'<div\s+class=["\']([^"\']*article[^"\']*)["\']', html, re.I)
    return len(articles)

def has_pagination(html, url):
    """Check if page has pagination or 'view more' links."""
    # Look for pagination nav, next buttons, view more links, page parameters
    patterns = [
        r'<nav[^>]*aria-label=["\']Pagination',
        r'<a[^>]*href=["\']([^"\']*page=\d+)',
        r'<a[^>]*href=["\']([^"\']*\/\d+\/)["\']',
        r'view\s+more',
        r'load\s+more',
        r'<li[^>]*class=["\'][^"\']*next[^"\']*["\']',
    ]
    for pattern in patterns:
        if re.search(pattern, html, re.I):
            return True
    return False

def get_content_length(url):
    """Get file size via HEAD request, return bytes or None."""
    try:
        req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=10) as r:
            cl = r.headers.get('Content-Length')
            return int(cl) if cl else None
    except Exception as e:
        return None

def is_parliament_specific(section_name, doc_url):
    """Check if document is 20th parliament specific vs general secretariat."""
    if '20-parliament' in doc_url:
        return True
    if 'point_of_order' in doc_url:  # Point of order is parliament-specific
        return True
    if 'majlis' in doc_url.lower() and section_name.startswith('20-parliament'):
        return True
    return False

def crawl_section(name, url, max_pages=30):
    """
    Crawl a section and extract heading, documents, subpages, pagination info.
    """
    result = {
        'url': url,
        'heading': None,
        'documents': [],
        'subpages': [],
        'has_pagination': False,
        'article_count': 0,
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

            # Check for pagination on first page
            if has_pagination(html, url):
                result['has_pagination'] = True

            # Count articles for news-like pages
            if 'news' in name or 'education' in name:
                result['article_count'] = count_articles(html)

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

        # Look for pagination or sub-pages to follow
        # Only follow links that are part of the same section
        for m in re.finditer(r'href=["\']?(/en/[^"\'>\s]+)["\']?', html, re.I):
            link_path = m.group(1)
            full_url = 'https://majlis.gov.mv' + link_path

            # Check if it looks like pagination for the same section
            # Should contain section keywords or be a numbered page
            if full_url not in visited and full_url not in to_visit:
                # Only follow if it's clearly part of the section
                if name.replace('-', '/') in full_url or \
                   (name in full_url) or \
                   re.search(r'/\d+/?$', link_path):  # Numbered pages
                    to_visit.append(full_url)
                    if full_url not in result['subpages']:
                        result['subpages'].append(full_url)

    result['documents'] = sorted(result['documents'], key=lambda x: (x['page'], x['label']))
    return result

# Main crawl
output = {}
for name, url in SECTIONS:
    print(f"Crawling {name}...", file=sys.stderr)
    result = crawl_section(name, url)
    output[name] = result

# Write results - fix the output directory path
out_dir = os.path.join(os.getcwd(), 'tmp', 'inventory')
os.makedirs(out_dir, exist_ok=True)

# Save detailed inventory
with open(os.path.join(out_dir, 'other_sections.json'), 'w', encoding='utf-8') as f:
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
        'has_pagination': data['has_pagination'],
        'subpages_count': len(data['subpages']),
        'article_count': data['article_count'],
        'notes': data['notes'],
    }

    grand_total_docs += doc_count
    grand_total_bytes += total_bytes

summary['_totals'] = {
    'total_documents': grand_total_docs,
    'total_bytes': grand_total_bytes,
}

with open(os.path.join(out_dir, 'other_summary.json'), 'w', encoding='utf-8') as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(json.dumps(summary, indent=2), file=sys.stderr)
print(f"\nOutput files written to: {out_dir}", file=sys.stderr)
