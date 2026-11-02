"""Pack cleaned animal atlases and map art into transparent game-sized assets.
Run with a generated-job manifest: python3 scripts/ImportTownSprites.py /tmp/town-art.json
Canonical source images are preserved in docs/source-assets/town.
"""
from pathlib import Path
from PIL import Image
import json,sys,shutil,statistics
import ImportSprites as sprites
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/source-assets/town';SOURCE.mkdir(parents=True,exist_ok=True)
OUT=ROOT/'public/world/sprites/emerald'

def pack(asset,path):
    dog=asset in {'rosie','millie'};rows=8 if dog else 4
    cells,_=sprites.extract(path,rows)
    # Four-direction art arrives S,W,E,N. The game's four-row lookup is S,N,W,E.
    if not dog:cells=[cells[r*4+c] for r in [0,3,1,2] for c in range(4)]
    cw,ch=(80,64) if dog else (64,64);body=28 if dog else 32;foot=ch-4
    ratio=min(body/statistics.median(c.height for c in cells),(cw-8)/max(c.width for c in cells),(ch-8)/max(c.height for c in cells))
    actual=round(statistics.median(c.height for c in cells)*ratio)
    atlas=Image.new('RGBA',(cw*4,ch*rows))
    for i,cell in enumerate(cells):
        size=(max(1,round(cell.width*ratio)),max(1,round(cell.height*ratio)))
        small=cell.resize(size,Image.Resampling.LANCZOS)
        small.putalpha(small.getchannel('A').point(lambda a:255 if a>=180 else 0))
        atlas.alpha_composite(small,((i%4)*cw+(cw-size[0])//2,(i//4)*ch+foot-size[1]))
    alpha=atlas.getchannel('A');atlas=atlas.convert('RGB').quantize(colors=28,dither=Image.Dither.NONE).convert('RGBA');atlas.putalpha(alpha)
    atlas.save(OUT/(asset+'.png'),optimize=True)
    sprites.manifest[asset]=dict(id=asset,src='/world/sprites/emerald/'+asset+'.png',cw=cw,ch=ch,rows=rows,columns=4,bodyHeight=actual,footY=foot,pixelArt=True,layout='eight' if dog else 'four',action='walk',frameMs=110 if dog else 150)

if __name__=='__main__':
    jobs=json.loads(Path(sys.argv[1]).read_text())
    for asset,path in jobs['paths'].items():
        source=SOURCE/(asset+'.png');shutil.copyfile(path,source)
        if asset=='pond-icon':
            image=Image.open(source).convert('RGBA');image.putalpha(image.getchannel('A').point(lambda a:255 if a>=180 else 0));image=image.crop(image.getbbox());image.thumbnail((112,80),Image.Resampling.LANCZOS);image.putalpha(image.getchannel('A').point(lambda a:255 if a>=160 else 0));image.save(ROOT/'public/world/sprites/pond-icon.png',optimize=True)
        else:pack(asset,source)
        print('Packed',asset)
    sprites.manifest_path.write_text(json.dumps(sprites.manifest,indent=2)+'\n')
    (SOURCE/'prompts.json').write_text(json.dumps(jobs['prompts'],indent=2)+'\n')
