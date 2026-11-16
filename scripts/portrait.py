"""Convert a supplied photo into text; the original photo is never published.
Usage: python3 scripts/portrait.py /path/to/photo.jpg
Requires Pillow only when regenerating the portrait.
"""
from pathlib import Path
import sys
from PIL import Image
from collections import deque
img=Image.open(sys.argv[1]).convert('RGB').resize((104,60),Image.Resampling.LANCZOS)
pixels=list(img.getdata()); w,h=img.size
# Remove only white background connected to the image boundary, retaining eyes.
background=set(); queue=deque(i for i in range(w*h) if i<w or i>=w*(h-1) or i%w in (0,w-1))
while queue:
 i=queue.popleft()
 if i in background or min(pixels[i])<232: continue
 background.add(i)
 x,y=i%w,i//w
 queue.extend((ny*w+nx) for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)) if 0<=nx<w and 0<=ny<h and ny*w+nx not in background)
luma=[.2126*r+.7152*g+.0722*b for r,g,b in pixels]
values=sorted(v for i,v in enumerate(luma) if i not in background)
low,high=values[int(len(values)*.025)],values[int(len(values)*.975)]
ramp=' .,:;irsXA253hMHGS#9B&@'
rows=[]
for y in range(h):
 row=''
 for x in range(w):
  i=y*w+x
  if i in background: row+=' '; continue
  value=max(0,min(1,(luma[i]-low)/(high-low)))**1.3
  row+=ramp[min(len(ramp)-1, max(1,round(value*(len(ramp)-1))))]
 rows.append(row)
(Path(__file__).resolve().parent.parent/'content/portrait.txt').write_text('\n'.join(rows)+'\n')
print(f'Generated {w} × {h} text portrait.')
