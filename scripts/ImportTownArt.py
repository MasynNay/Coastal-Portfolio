"""Import the original harbor tile and prop atlases; coordinates stay in TownLayout.js."""
from pathlib import Path
from PIL import Image
import json,shutil,sys
from ImportSprites import extract,publish,manifest,manifest_path
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'public/world/town-art';out.mkdir(parents=True,exist_ok=True)
source=ROOT/'docs/source-assets/town-art';source.mkdir(parents=True,exist_ok=True)
jobs=json.loads(Path(sys.argv[1]).read_text())
metadata=ROOT/'src/world/TerrainArt.json'
data=json.loads(metadata.read_text()) if metadata.exists() else {'tiles':None,'props':{}}
if 'terrain:tiles' in jobs:
    path=jobs['terrain:tiles'];shutil.copyfile(path,source/'Tiles.png')
    im=Image.open(path).convert('RGB').resize((512,512),Image.Resampling.LANCZOS)
    im.save(out/'Tiles.png');data['tiles']={'src':'/world/town-art/Tiles.png','width':512,'height':512}
if 'terrain:props' in jobs:
    path=jobs['terrain:props'];shutil.copyfile(path,source/'HarborProps.png')
    # Prop rows deliberately have different heights (the lighthouse is tall).
    # Segment isolated alpha silhouettes, then group by their shared ground baselines.
    im=Image.open(path).convert('RGBA');im.putalpha(im.getchannel('A').point(lambda a:255 if a>=160 else 0))
    w,h=im.size;mask=bytearray(im.getchannel('A').tobytes());components=[]
    for index in range(w*h):
        if not mask[index]:continue
        mask[index]=0;stack=[index];area=0;left=w;top=h;right=bottom=0
        while stack:
            i=stack.pop();x=i%w;y=i//w;area+=1
            left=min(left,x);right=max(right,x);top=min(top,y);bottom=max(bottom,y)
            for dx,dy in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(1,-1),(-1,1),(1,1)]:
                nx=x+dx;ny=y+dy
                if 0<=nx<w and 0<=ny<h:
                    j=ny*w+nx
                    if mask[j]:mask[j]=0;stack.append(j)
        if area>300:components.append((area,(left,top,right+1,bottom+1)))
    largest=sorted(components,reverse=True)[:16]
    if len(largest)!=16:raise ValueError('Expected sixteen complete harbor props')
    by_baseline=sorted((box for area,box in largest),key=lambda b:b[3])
    boxes=[]
    for row in range(4):boxes.extend(sorted(by_baseline[row*4:row*4+4],key=lambda b:b[0]))
    cells=[im.crop(box) for box in boxes]
    ids=['lighthouse','tree','pine','palm','bench','umbrella','lamp','sign','sailboat','rowboat','bollard','crates','planter','hedge','railing','ring']
    for name,cell in zip(ids,cells):
        cell.thumbnail((320,420),Image.Resampling.LANCZOS);filename=name+'.png';cell.save(out/filename)
        data['props']['harbor-'+name]={'src':'/world/town-art/'+filename,'width':cell.width,'height':cell.height}
    (source/'props-crops.json').write_text(json.dumps(boxes,indent=2)+'\n')
if 'terrain:duck' in jobs:
    path=jobs['terrain:duck'];shutil.copyfile(path,source/'DuckFlight.png')
    im=Image.open(path).convert('RGBA')
    if im.getpixel((0,0))[3]>64:raise ValueError('Duck sheet must have alpha transparency')
    cells,boxes=extract(path,4);publish('duck-flight',cells,4,pixel_height=28,action='ride')
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
(ROOT/'src/world/TerrainArt.json').write_text(json.dumps(data,indent=2)+'\n')
print('Imported terrain atlas and',len(data['props']),'harbor props')
