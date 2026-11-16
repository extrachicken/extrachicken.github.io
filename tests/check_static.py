from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
root=Path(__file__).resolve().parent.parent
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.ids=set()
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if 'id' in attrs:self.ids.add(attrs['id'])
  for key in ['src','href']:
   if key in attrs:self.links.append(attrs[key])
count=0
for name in ['index.html','resume.html']:
 parser=Links();parser.feed((root/name).read_text())
 for link in parser.links:
  url=urlsplit(link)
  if url.scheme or url.netloc:continue
  if url.path:
   dest=root/unquote(url.path.lstrip('/'));assert dest.exists(),(name,link)
  elif url.fragment:assert url.fragment in parser.ids,(name,link)
  count+=1
assert 'id="blog"' not in (root/'index.html').read_text()
assert not (root/'blog').exists()
assert len((root/'content/portrait.txt').read_text().splitlines())==60
assert all(len(row)==104 for row in (root/'content/portrait.txt').read_text().splitlines())
assert json.loads((root/'content/profile.json').read_text())['name']=='Андрей Соболев'
assert (root/'resume.pdf').read_bytes().startswith(b'%PDF')
print(f'Checked {count} local references, portrait, content and PDF.')
