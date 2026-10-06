#!/usr/bin/env python3
import sys, re, json, urllib.request, urllib.parse, os
from datetime import datetime

sys.path.insert(0, 'scripts')
os.environ['PYTHONIOENCODING'] = 'utf-8'

from majlis import fetch, strip_tags, UA

# Read committees from ts file
with open('src/data/realCommittees.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

# Extract committee data
committees_data = []

# Look for committee objects in the array
blocks = re.findall(r'\{[^{}]*?"id":\s*"(\d+)"[^{}]*?"name":\s*"([^"]+)"[^{}]*?"url":\s*"([^"]+)"[^{}]*?\}', ts_content, re.DOTALL)
for id_val, name_val, url_val in blocks:
    committees_data.append({
        'id': id_val,
        'name': name_val,
        'url': url_val,
        'works': 0
    })

print(f"Found {len(committees_data)} committees")

def extract_documents(html, url_base):
    """Extract document links from committee page HTML"""
    docs = []
    
    # Split by section headers
    sections = re.split(r'<h[2-4][^>]*>([^<]*?(?:Committee|committee)[^<]*?)</h[2-4]>', html)
    
    for i in range(1, len(sections), 2):
        if i+1 >= len(sections):
            break
            
        section_title = sections[i].lower()
        section_content = sections[i+1]
        
        # Determine which section this is
        if 'documents' in section_title:
            current_section = 'documents'
        elif 'meetings' in section_title:
            current_section = 'meetings'
        else:
            continue
        
        # Extract links from this section
        links = re.findall(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>([^<]+)</a>', section_content)
        for href, label in links:
            if href.startswith('http'):
                url = href
            elif href.startswith('/'):
                url = 'https://majlis.gov.mv' + href
            else:
                url = urllib.parse.urljoin(url_base, href)
            
            clean_label = strip_tags(label).strip()
            # Filter for actual files
            if clean_label and ('storage' in url or '.pdf' in url.lower() or '.doc' in url.lower() or '.docx' in url.lower()):
                if not any(d['url'] == url for d in docs):
                    docs.append({
                        'label': clean_label,
                        'url': url,
                        'section': current_section,
                        'bytes': None
                    })
    
    return docs

def get_file_size(url):
    """Get file size using HEAD request"""
    try:
        req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=5) as response:
            content_length = response.headers.get('Content-Length')
            if content_length:
                return int(content_length)
    except:
        pass
    return None

# Scrape each committee
all_docs = []
summary = {
    'committees': len(committees_data),
    'documents': 0,
    'bytes': 0,
    'documents_by_label': {},
    'meetings_total': 0,
    'works_total': 0,
    'committees_with_zero_docs': []
}

for idx, committee in enumerate(committees_data, 1):
    committee_id = committee['id']
    committee_name = committee['name']
    url = committee['url']
    
    print(f"[{idx}/{len(committees_data)}] {committee_id}: {committee_name[:50]}")
    
    try:
        html = fetch(url, refresh=True)
        docs = extract_documents(html, url)
        
        for doc in docs:
            size = get_file_size(doc['url'])
            doc['bytes'] = size
            
            all_docs.append({
                'committee_id': committee_id,
                'committee_name': committee_name,
                'label': doc['label'],
                'url': doc['url'],
                'bytes': size,
                'section': doc['section']
            })
            
            summary['documents'] += 1
            if size:
                summary['bytes'] += size
            
            label_norm = doc['label'].lower().strip()
            if label_norm not in summary['documents_by_label']:
                summary['documents_by_label'][label_norm] = 0
            summary['documents_by_label'][label_norm] += 1
        
        summary['works_total'] += committee.get('works', 0)
        
        if len(docs) == 0:
            summary['committees_with_zero_docs'].append({
                'id': committee_id,
                'name': committee_name
            })
    
    except Exception as e:
        print(f"  Error: {e}")

summary['documents_by_label'] = dict(sorted(summary['documents_by_label'].items(), key=lambda x: x[1], reverse=True))

out_dir = 'inventory'
os.makedirs(out_dir, exist_ok=True)

with open(os.path.join(out_dir, 'committees_docs.json'), 'w', encoding='utf-8') as f:
    json.dump(all_docs, f, indent=2, ensure_ascii=False)

with open(os.path.join(out_dir, 'committees_summary.json'), 'w', encoding='utf-8') as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(f"Done! Wrote {len(all_docs)} documents to {out_dir}/committees_docs.json")
