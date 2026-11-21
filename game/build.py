#!/usr/bin/env python3
"""Inline js/*.js into one page: index.html -> ../half-volley.html"""
import re, pathlib
root = pathlib.Path(__file__).parent
html = (root / 'index.html').read_text(encoding='utf-8')
def inline(m):
    js = (root / m.group(1)).read_text(encoding='utf-8')
    assert '</script' not in js, m.group(1)
    return '<script>\n' + js + '</script>'
out = re.sub(r'<script src="(js/[^"]+)"></script>', inline, html)
(root.parent / 'half-volley.html').write_text(out, encoding='utf-8')
print('wrote half-volley.html', len(out), 'bytes')
