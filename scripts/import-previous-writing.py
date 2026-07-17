"""One-time import: Squarespace WXR export -> src/content/previous/posts.json"""
import xml.etree.ElementTree as ET
import json, re, sys
from collections import Counter
from datetime import datetime
from email.utils import parsedate_to_datetime

SRC = '/Users/stephen_openclaw/Downloads/Squarespace-Wordpress-Export-07-17-2026.xml'
OUT = '/Users/stephen_openclaw/Documents/Code/stephenmcanearney-site/src/content/previous/posts.json'

NS = {
    'wp': 'http://wordpress.org/export/1.2/',
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
    'dc': 'http://purl.org/dc/elements/1.1/',
}

def g(item, path):
    e = item.find(path, NS)
    return e.text if e is not None and e.text else None

ATTR = r'''\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)'''

def clean(html):
    # Word paste leaves conditional comments wrapping VML fallbacks. Drop whole.
    html = re.sub(r'<!--\[if[^>]*>.*?<!\[endif\]-->', '', html, flags=re.S)
    html = re.sub(r'<!--(?!\[if).*?-->', '', html, flags=re.S)
    # ...and Office namespaced tags (<o:p>, <v:shape>, <m:oMath>). Unwrap rather
    # than delete: for the two posts with pasted equations, the inner characters
    # are the equation and are worth keeping even without the math layout.
    html = re.sub(r'</?[a-z]+:[^>]*>', '', html, flags=re.I)
    # Squarespace wraps everything in layout divs that carry no meaning once the
    # post is out of its grid; the structure lives in the h*/p/img tags inside.
    html = re.sub(r'</?div\b[^>]*>', '', html)
    html = re.sub(r'</?(?:section|main|article|font)\b[^>]*>', '', html)
    # Presentational leftovers pinned to Squarespace's grid and Word's metrics.
    # Both quote styles: Word emits style='...', Squarespace style="...".
    for a in ('style', 'class', 'lang', 'align', 'width', 'height', 'border', 'valign'):
        html = re.sub(r'\s+' + a + ATTR, '', html, flags=re.I)
    html = re.sub(r'\s+data-[\w-]+(?:' + ATTR + r')?', '', html)
    # Spans carry nothing once their styling is gone.
    html = re.sub(r'</?span\b[^>]*>', '', html)
    # Word's downlevel list markers (<!--[if !supportLists]-->) survive the pass
    # above; nothing in this content wants a real HTML comment.
    html = re.sub(r'<!--.*?-->', '', html, flags=re.S)
    html = re.sub(r'<img\b', '<img loading="lazy"', html)
    # Squarespace pads blocks with long runs of empty lines and stray <p></p>.
    for _ in range(3):
        html = re.sub(r'<(p|li|h[1-6]|em|strong)>\s*(?:&nbsp;|\s)*</\1>', '', html)
    html = re.sub(r'[ \t]+', ' ', html)
    html = re.sub(r'\n{3,}', '\n\n', html)
    return html.strip()

items = ET.parse(SRC).getroot().find('channel').findall('item')

stats = Counter()
tags = Counter()
posts, skipped = [], []
seen = {}

for it in items:
    title = (g(it, 'title') or '').strip()
    status = g(it, 'wp:status')
    ptype = g(it, 'wp:post_type')
    body = g(it, 'content:encoded') or ''
    stats[f'type={ptype}'] += 1
    stats[f'status={status}'] += 1

    if ptype != 'post' or status != 'publish':
        skipped.append((title, f'type={ptype} status={status}'))
        continue
    if not title:
        skipped.append(('(untitled)', 'no title'))
        continue

    html = clean(body)
    if not re.sub(r'<[^>]+>', '', html).strip():
        skipped.append((title, 'empty body'))
        continue

    for t in re.findall(r'<(\w+)', html):
        tags[t.lower()] += 1

    # post_name is a dated path (2017/1/19/the-slug); keep only the readable tail.
    name = g(it, 'wp:post_name') or ''
    slug = name.rstrip('/').split('/')[-1]
    if not slug:
        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

    raw = g(it, 'wp:post_date') or g(it, 'pubDate')
    try:
        dt = datetime.strptime(raw, '%Y-%m-%d %H:%M:%S')
    except (ValueError, TypeError):
        dt = parsedate_to_datetime(raw)
    if not g(it, 'wp:post_date'):
        stats['date fell back to pubDate'] += 1

    if slug in seen:
        stats['slug collision'] += 1
        slug = f"{slug}-{dt.strftime('%Y%m%d')}"
    seen[slug] = True

    posts.append({
        'id': slug,
        'title': title,
        'pubDate': dt.strftime('%Y-%m-%d'),
        'sourceUrl': (g(it, 'link') or '').strip(),
        'html': html,
    })

posts.sort(key=lambda p: p['pubDate'], reverse=True)
with open(OUT, 'w') as f:
    json.dump(posts, f, indent=2, ensure_ascii=False)

print(f"imported {len(posts)} posts -> {OUT}")
print(f"date range: {posts[-1]['pubDate']} .. {posts[0]['pubDate']}")
print("\nitem breakdown:", dict(stats))
print("\ntags kept:", dict(tags.most_common()))
print(f"\nskipped ({len(skipped)}):")
for t, why in skipped:
    print(f"  - {why:32} {t[:60]!r}")
imgs = sum(len(re.findall(r'<img', p['html'])) for p in posts)
ext = len(set(re.findall(r'<img[^>]+src="(https?://[^"]+)"', json.dumps(posts))))
print(f"\nimages: {imgs} tags, {ext} unique remote URLs (still pointing at Squarespace CDN)")
