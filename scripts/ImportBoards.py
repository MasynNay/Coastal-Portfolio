"""Pack the board and balancing family poses; metadata drives Game Mode.
Sources are preserved in docs/source-assets/boards. Opposite sides are mirrored.
"""
import json,hashlib
from PIL import Image,ImageOps
import ImportSprites as sprites
ROOT=sprites.ROOT;SOURCE=ROOT/'docs/source-assets/boards'
for key,name in [('Skateboard','skateboard'),('Wakeboard','wakeboard')]:
 path=SOURCE/(key+'.png')
 poses,_=sprites.extract(path,8,4)
 # Front/nose points south in row0; west is row2. The opposite views share art.
 rows=[[0,0],[1,0],[2,0],[3,0],[4,0],[3,1],[2,1],[1,1]]
 selected=[ImageOps.mirror(poses[r*4+c]) if flip else poses[r*4+c] for r,flip in rows for c in range(4)]
 size=192;foot=184;scale=min(168/max(p.width for p in selected),168/max(p.height for p in selected));out=Image.new('RGBA',(size*4,size*8))
 for i,p in enumerate(selected):
  p=p.resize((max(1,round(p.width*scale)),max(1,round(p.height*scale))),Image.Resampling.LANCZOS);p.putalpha(p.getchannel('A').point(lambda a:255 if a>=160 else 0));p=p.crop(p.getbbox());out.alpha_composite(p,(i%4*size+(size-p.width)//2,i//4*size+foot-p.height))
 alpha=out.getchannel('A');out=out.convert('RGB').quantize(colors=128,dither=Image.Dither.NONE).convert('RGBA');out.putalpha(alpha)
 path='/world/sprites/emerald/'+name+'.png';out.save(ROOT/('public'+path),optimize=True)
 sprites.manifest[name]=dict(id=name,src=path,cw=size,ch=size,rows=8,columns=4,footY=foot,bodyHeight=85,action='vehicle',frameMs=140,pixelArt=True,smooth=True,colors=128,layout='eight',canonicalDirections=True,revision=hashlib.sha256((ROOT/('public'+path)).read_bytes()).hexdigest()[:12])
 direction_file=ROOT/'docs/source-assets/DirectionRows.json';directions=json.loads(direction_file.read_text());directions[name]=rows;direction_file.write_text(json.dumps(directions,indent=2)+'\n')
sprites.manifest_path.write_text(json.dumps(sprites.manifest,indent=2)+'\n')
print('Packed the skateboard and wakeboard in eight headings.')
