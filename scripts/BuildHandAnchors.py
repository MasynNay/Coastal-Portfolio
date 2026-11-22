"""Read the shipped pose cells and record rope sockets on exposed hands.

This does not alter artwork. The renderer reads the same row/column and root
anchor as drawSprite, then applies rider lift/rotation to the socket too.
"""
import json
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
sheets = json.loads((ROOT / 'src/world/SpriteSheets.json').read_text())
people = {look['asset'] for look in json.loads((ROOT / 'src/world/Appearances.json').read_text())}
allowed = {base + suffix for base in people for suffix in ('', '-wake-ride', '-board-trick')}
result = {}
for key, sheet in sheets.items():
    if key not in allowed:
        continue
    path = ROOT / 'public' / sheet['src'].lstrip('/')
    if not path.exists():
        continue
    image = Image.open(path).convert('RGBA')
    cw,ch = sheet['cw'],sheet['ch']
    points = []
    for row in range(sheet['rows']):
        for col in range(sheet['columns']):
            cell = image.crop((col*cw,row*ch,(col+1)*cw,(row+1)*ch))
            anchor = sheet.get('anchors', [cw/2] * (sheet['rows']*sheet['columns']))[row*sheet['columns']+col]
            body = sheet.get('bodyHeight',ch)
            foot = sheet.get('footY',ch)
            candidates=[]
            for yy in range(max(0,int(foot-body*.64)),min(ch,int(foot-body*.23))):
                for xx in range(max(0,int(anchor-body*.43)),min(cw,int(anchor+body*.43))):
                    red,green,blue,alpha=cell.getpixel((xx,yy))
                    if alpha>210 and red>105 and green>65 and red>green*1.04 and green>blue*1.05 and red-blue>22 and abs(xx-anchor)>body*.12:
                        candidates.append((xx,yy))
            if candidates:
                side = -1 if row in (5,6,7) else 1
                candidates = [(x,y) for x,y in candidates if (x-anchor)*side>0] or candidates
                lower = sorted(y for x,y in candidates)[int((len(candidates)-1)*.55)]
                candidates = [(x,y) for x,y in candidates if y>=lower]
                x=sum(p[0] for p in candidates)/len(candidates)
                y=sum(p[1] for p in candidates)/len(candidates)
            else: x,y=anchor+body*.2,foot-body*.43
            points.append([round(x,1),round(y,1)])
    result[key]=points
(ROOT/'src/world/HandAnchors.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
print(f'Recorded hand sockets for {len(result)} action sheets.')
