"""Pack native costume call, duck-flight, landing and expression drawings."""
from pathlib import Path
from PIL import Image
import hashlib,json,statistics,sys
from ImportSprites import extract
from BuildActivities import head_width
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'src/world/SpriteSheets.json';sheets=json.loads(p.read_text())
c=ROOT/'docs/source-assets/People.json';catalog=json.loads(c.read_text())
for asset in sys.argv[1:]:
 movement=sheets[asset];base=Image.open(ROOT/('public'+movement['src'])).convert('RGBA')
 idle=movement['idleFrame'];reference=base.crop((idle*movement['cw'],0,(idle+1)*movement['cw'],movement['ch']))
 head=head_width(reference)
 for action in ['call','ride','land','emote']:
  source=ROOT/'docs/source-assets/people'/asset/(action+'.png');cells,_=extract(source,2,4)
  ratio=min(head/statistics.median(head_width(cell) for cell in cells),176/max(cell.width for cell in cells),172/max(cell.height for cell in cells))
  atlas=Image.new('RGBA',(192*8,192))
  for i,cell in enumerate(cells):
   small=cell.resize((round(cell.width*ratio),round(cell.height*ratio)),Image.Resampling.LANCZOS)
   atlas.alpha_composite(small,(i*192+(192-small.width)//2,180-small.height))
  alpha=atlas.getchannel('A').point(lambda a:255 if a>=150 else 0)
  atlas=atlas.convert('RGB').quantize(colors=256,dither=Image.Dither.NONE).convert('RGBA');atlas.putalpha(alpha)
  path=ROOT/'public/world/sprites/emerald'/(asset+'-'+action+'.png');atlas.save(path,optimize=True)
  sheets[asset+'-'+action]=dict(id=asset+'-'+action,src='/world/sprites/emerald/'+path.name,
   cw=192,ch=192,rows=1,columns=8,cycleFrames=8,idleFrame=0,bodyHeight=96,footY=180,
   action=action,drawn=True,pixelArt=True,smooth=True,colors=256,detailVersion=4,detailScale=96/36,
   frameMs=sheets['masyn-'+action]['frameMs'],revision=hashlib.sha256(path.read_bytes()).hexdigest()[:12])
  catalog[asset+'-'+action]=dict(type='drawn',file='people/'+asset+'/'+action+'.png',action=action)
  print('Packed costume travel:',asset,action,flush=True)
p.write_text(json.dumps(sheets,indent=2)+'\n');c.write_text(json.dumps(catalog,indent=2)+'\n')
