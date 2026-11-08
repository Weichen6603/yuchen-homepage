#!/usr/bin/env python3
"""Static academic homepage builder; standard library, no dependencies."""
import argparse,base64,html,json,mimetypes,re,shutil
from pathlib import Path
from urllib.parse import urlparse,quote
ROOT=Path(__file__).resolve().parent

def esc(value):return html.escape(str(value),quote=True)
def safe_url(value):
    if not value:return ''
    p=urlparse(value)
    if p.scheme=='https' and p.netloc and not p.username:return esc(value)
    if value.startswith('assets/') and '..' not in Path(value).parts and not p.scheme and not p.netloc:
        if not (ROOT/value).is_file():raise ValueError('Missing local asset: '+value)
        return esc(value)
    raise ValueError('Use an HTTPS URL or existing assets/ file: '+value)
def authors(value):return esc(value).replace('Yuchen Yan','<strong>Yuchen Yan</strong>')
def links(values):
    return ''.join(f'<a href="{safe_url(url)}" target="_blank" rel="noopener noreferrer">{esc(label)}</a>' for label,url in values.items() if url)
def build(production=False):
    d=json.loads((ROOT/'profile.json').read_text(encoding='utf-8'))
    if production and not d.get('content_confirmed'):raise ValueError('Confirm biography and all profile entries, then set content_confirmed to true.')
    if production and not d.get('email'):raise ValueError('A verified public contact email is required for production.')
    social=''.join(f'<a href="{safe_url(url)}" target="_blank" rel="noopener noreferrer"><span class="profile-link-icon profile-detail-icon" aria-hidden="true">{('<svg viewBox="0 0 24 24" aria-hidden="true" fill="none"><path d="M2 9.2 12 3l10 6.2L12 15.5 2 9.2Z" fill="currentColor"/><path d="M6.2 13v3.4c0 2.1 2.7 3.6 5.8 3.6s5.8-1.5 5.8-3.6V13L12 16.6 6.2 13Z" fill="currentColor" opacity=".65"/><path d="M21 9.8v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' if 'scholar' in label.lower() else '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M20 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1ZM8.35 18H5.8V9.6h2.55V18ZM7.08 8.5a1.48 1.48 0 1 1 0-2.96 1.48 1.48 0 0 1 0 2.96ZM18.2 18h-2.55v-4.1c0-1-.02-2.28-1.4-2.28-1.39 0-1.6 1.08-1.6 2.2V18H10.1V9.6h2.45v1.15h.04c.34-.64 1.18-1.33 2.42-1.33 2.59 0 3.19 1.7 3.19 3.91V18Z"/></svg>' if 'linkedin' in label.lower() else '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18 18 6M9 6h9v9"/></svg>')}</span><span>{esc(label)}</span></a>' for label,url in d['links'].items() if url)
    cv=f'<a href="{safe_url(d["cv_url"])}">Curriculum vitae</a>' if d['cv_url'] else ''
    projects=[]
    featured=[]
    project_items=[p for p in d['projects'] if p.get('category','project')=='project']
    featured_items=[p for p in d['projects'] if p.get('category')=='publication']
    for i,p in enumerate(featured_items + project_items):
        project_url=safe_url(p['links'].get('Project') or p['links'].get('Blog') or next(iter(p['links'].values()))); video=safe_url(p['local_video'] if p.get('local_video') and (ROOT/p['local_video']).is_file() else p['video_url']);poster=safe_url(p['poster'])
        target=featured if p.get('category')=='publication' else projects
        item_num=(len(featured)+1) if p.get('category')=='publication' else (len(projects)+1)
        item_label='PAPER' if p.get('category')=='publication' else 'PROJECT'
        target.append(f'''<article class="project { "featured-paper" if p.get("category")=="publication" else "compact-project" }" id="project-{i+1}"><div class="project-layout"><div class="project-copy"><div class="project-topline"><span class="project-index">{item_label} {item_num:02d}</span><span>{esc(p['year'])}</span><span class="tag">{esc(p['venue'])}</span></div><h3><a href="{project_url}" target="_blank" rel="noopener noreferrer">{esc(p['name'])}</a></h3><p class="project-description">{esc(p['subtitle'])}</p><p class="project-description">{esc(p['description'])}</p><div class="project-links">{links(p['links'])}</div><p class="verification-note">{esc(p.get('link_note',''))}</p><p class="authors" aria-label="Project authors">{authors(p['authors'])}</p></div><figure class="project-media"><video id="video-{i+1}" controls playsinline preload="none" poster="{poster}" aria-label="{esc(p['name'])} promotional video"><source src="{video}" type="video/mp4">Your browser cannot play this video. <a href="{video}">Open the video</a>.</video><figcaption><span>Project film · play here</span><a href="{video}" target="_blank" rel="noopener noreferrer">Open video</a></figcaption><p class="video-status" hidden>Video unavailable here. Use “Open video” or visit the project page.</p></figure></div></article>''')
    pubs=[]
    for p in d['publications']:
        for key in ('title','authors','venue','year'):
            if not p.get(key):raise ValueError('Publication missing '+key)
        first=safe_url(next(iter(p['links'].values())))
        pubs.append(f'''<article class="publication"><span class="publication-year">{esc(p['year'])}</span><div><h3><a href="{first}" target="_blank" rel="noopener noreferrer">{esc(p['title'])}</a></h3><p>{authors(p['authors'])}</p><p class="venue">{esc(p['venue'])}</p><div class="publication-links">{links(p['links'])}</div></div></article>''')
    email=d['email']
    if email and not re.fullmatch(r'[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',email):raise ValueError('Invalid email address')
    contact=f'<a href="mailto:{esc(email)}">{esc(email)}</a>' if email else '<span class="contact-pending">Public contact details will be added shortly.</span>'
    tokens={'ROBOTS':'' if production else '<meta name="robots" content="noindex, nofollow" />','DRAFT_NOTICE':'','DESKTOP_PET':(ROOT/'templates/little-pet.html').read_text(encoding='utf-8'),'ROLE':esc(d.get('role','AI Research')).replace('Aether AI','<a class="profile-affiliation" href="https://aetherlabs.ai/" target="_blank" rel="noopener noreferrer">Aether AI</a>'),'LOCATION':esc(d.get('location','')),'SOCIALS':social,'CV':cv,'PROJECTS':''.join(projects),'FEATURED_PUBLICATIONS':''.join(featured),'PUBLICATIONS':''.join(pubs),'CONTACT':contact,'EMAIL':esc(email)}
    page=(ROOT/'templates/index.html').read_text(encoding='utf-8')
    for k,v in tokens.items():page=page.replace('{{'+k+'}}',v)
    if re.search(r'\{\{[A-Z_]+\}\}',page):raise ValueError('Unresolved template token')
    (ROOT/'index.html').write_text(page,encoding='utf-8')
    dist=ROOT/'dist';dist.mkdir(exist_ok=True)
    for f in ('index.html','styles.css','script.js','desktop-pet.css','desktop-pet.js','sidebar.css','favicon.svg'):shutil.copyfile(ROOT/f,dist/f)
    if (ROOT/'assets').exists():shutil.copytree(ROOT/'assets',dist/'assets',dirs_exist_ok=True,ignore=shutil.ignore_patterns('originals','*original*'))
    print('Built dist/. Missing optional local videos fall back to project-hosted URLs.')
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--production',action='store_true');build(parser.parse_args().production)
