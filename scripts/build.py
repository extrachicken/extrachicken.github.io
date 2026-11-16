import json, hashlib, re
from pathlib import Path
from html import escape as esc
ROOT=Path(__file__).resolve().parent.parent
p=json.loads((ROOT/'content/profile.json').read_text())
p['portrait']=(ROOT/'content/portrait.txt').read_text()
(ROOT/'assets/profile.js').write_text('window.PROFILE = '+json.dumps(p,ensure_ascii=False).replace('<','\\u003c')+';\n')

def tags(items):return '<div class="tags">'+''.join('<span class="tag">'+esc(x)+'</span>' for x in items)+'</div>'
def bullets(items):return '<ul>'+''.join('<li>'+esc(x)+'</li>' for x in items)+'</ul>'
exp=''.join(f'<article class="entry"><div class="entry-meta"><h3>{esc(x["role"])} <span>— {esc(x["company"])}</span></h3><p>{esc(x["dates"])}</p><p>{esc(x["place"])}</p>{tags(x["tags"])}</div>{bullets(x["bullets"])}</article>' for x in p['experience'])
projects=''.join(f'<article class="project"><h3>{esc(x["name"])} <a href="{esc(x["url"])}" target="_blank" rel="noreferrer">{esc(x["linkLabel"])} ↗</a></h3><p>{esc(x["subtitle"])}</p>{tags(x["tags"])}{bullets(x["bullets"])}</article>' for x in p['projects'])
skills=''.join(f'<div><h3>{esc(g["title"])}</h3>{tags(g["items"])}</div>' for g in p['skills'])
html=(ROOT/'index.template.html').read_text()
for key,value in {'EXPERIENCE':exp,'PROJECTS':projects,'SKILLS':skills,'NAME':esc(p['name'])}.items():html=html.replace('{{'+key+'}}',value)
# Changed files get distinct URLs so browser caches cannot retain an older build.
def version_asset(match):
 path=match.group(2)
 version=hashlib.sha256((ROOT/path).read_bytes()).hexdigest()[:12]
 return f'{match.group(1)}="{path}?v={version}"'
html=re.sub(r'(src|href)="(assets/[^"?]+\.(?:js|css))"',version_asset,html)
(ROOT/'index.html').write_text(html)
# A compact public CV; the website contains the full project list.
cv_projects=''.join(f'<article><h3>{esc(x["name"])} <a href="{esc(x["url"])}">{esc(x["linkLabel"])}</a></h3><p>{esc(x["bullets"][0])}</p></article>' for x in p['projects'][:4])
cv_skills=''.join(f'<p><b>{esc(g["title"])}:</b> {esc(", ".join(g["items"]))}</p>' for g in p['skills'])
resume=f'''<!doctype html><html lang="ru"><meta charset="utf-8"><title>Андрей Соболев — резюме</title><style>
body{{font:12px/1.45 Arial,sans-serif;max-width:760px;margin:35px auto;color:#17232e}}h1{{font-size:26px;margin:0 0 3px}}h2{{font-size:15px;border-bottom:1px solid #ccd5db;margin:16px 0 7px;padding-bottom:3px}}h3{{font-size:12px;margin:8px 0 3px}}h3 span{{font-weight:400}}p{{margin:3px 0}}ul{{padding-left:17px;margin:5px 0}}li{{margin:3px 0}}a{{color:#245c7c;text-decoration:none}}.tags{{font-size:10px;color:#516270;margin:4px 0}}.tag{{margin-right:8px}}article{{break-inside:avoid}}.entry-meta p{{display:inline;margin-right:10px;color:#516270}}.role{{font-size:14px;margin-bottom:5px}}.about{{margin-top:10px}}.skills p{{margin:4px 0}}@page{{size:A4;margin:14mm 16mm}}@media print{{body{{margin:0}}}}
</style><body><h1>{esc(p['name'])}</h1><p class="role">{esc(p['role'])}</p><p>{esc(p['location'])} · {esc(p['status'])}</p><p><a href="mailto:{p['email']}">{p['email']}</a> · <a href="{p['telegram']}">Telegram</a> · <a href="{p['github']}">GitHub</a> · <a href="https://extrachicken.github.io/">Сайт-резюме</a></p><p class="about">{esc(p['about'])}</p><h2>Опыт</h2>{exp}<h2>Избранные проекты</h2>{cv_projects}<h2>Навыки</h2><div class="skills">{cv_skills}</div><h2>Образование и языки</h2><p>{esc(p['education'])}. {esc(p['educationDetail'])}</p><p>{esc(p['languages'])}</p></body></html>'''
(ROOT/'resume.html').write_text(resume)
(ROOT/'.nojekyll').touch()
print('Built index, profile data, and public resume HTML.')
