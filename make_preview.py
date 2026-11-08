#!/usr/bin/env python3
"""Create a self-contained, offline HTML preview. No embedded MP4s or fonts."""
from pathlib import Path
import base64, html, json, mimetypes, re
ROOT = Path(__file__).resolve().parent

def data_url(path):
    mime = mimetypes.guess_type(path)[0] or 'application/octet-stream'
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')

def make_preview():
    page=(ROOT/'index.html').read_text(encoding='utf-8')
    def stylesheet(m):
        name=m.group(1).split('?',1)[0]
        return '<style>\n'+(ROOT/name).read_text(encoding='utf-8')+'\n</style>'
    page=re.sub(r'<link rel="stylesheet" href="([^\"]+)"\s*/?>',stylesheet,page)
    def javascript(m):
        return '<script>\n'+(ROOT/m.group(1)).read_text(encoding='utf-8')+'\n</script>'
    page=re.sub(r'<script src="([^\"]+)"[^>]*>\s*</script>',javascript,page)
    data=json.loads((ROOT/'profile.json').read_text(encoding='utf-8'))
    ordered=[p for p in data['projects'] if p.get('category')=='publication']+[p for p in data['projects'] if p.get('category','project')=='project']
    n=[0]
    def video(m):
        p=ordered[n[0]];n[0]+=1
        name=html.escape(p['name'],quote=True);url=html.escape(p['video_url'],quote=True)
        poster=html.escape(p['poster'],quote=True)
        return f'<a class="preview-film" href="{url}" target="_blank" rel="noopener noreferrer" aria-label="Watch {name} demo"><img src="{poster}" alt="{name} demo poster" loading="lazy" width="640" height="360"><span aria-hidden="true">▶ Watch demo</span></a>'
    page=re.sub(r'<video\b[^>]*>.*?</video>',video,page,flags=re.S)
    page=re.sub(r'<p class="video-status"[^>]*>.*?</p>','',page,flags=re.S)
    page=page.replace('Project film · click to play','Project film · opens externally')
    page=page.replace('</head>','''<style>
.preview-film{display:block;position:relative;overflow:hidden;border-radius:5px;line-height:0}
.preview-film img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover}
.preview-film span{position:absolute;left:10px;bottom:10px;padding:6px 9px;background:#252526df;color:white;border-radius:18px;font:600 10px/1.4 Arial,sans-serif}
</style>\n</head>''')
    def asset(m):
        attribute,raw=m.group(1),html.unescape(m.group(2))
        path=ROOT/raw
        if path.is_file():return attribute+'="'+data_url(path)+'"'
        return m.group(0)
    page=re.sub(r'(src|href)="((?:assets/|favicon\.svg)[^\"]*)"',asset,page)
    # The old twilight banner is unused but its background CSS must not fetch a
    # missing relative asset in a standalone preview.
    page=re.sub(r'url\([\"\']?(assets/[^)\"\']+)[\"\']?\)',lambda m:'url("'+data_url(ROOT/m.group(1))+'")' if (ROOT/m.group(1)).is_file() else 'none',page)
    output=ROOT/'yuchen-homepage-preview.html';output.write_text(page,encoding='utf-8')
    print(f'Preview: {output.name} ({output.stat().st_size:,} bytes).')
    return output
if __name__=='__main__':make_preview()
