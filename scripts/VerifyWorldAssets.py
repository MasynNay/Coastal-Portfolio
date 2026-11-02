"""Verify every published world-art reference after imports or directory cleanup."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
def urls(value):
 if isinstance(value,dict):
  for key,v in value.items():
   if key=='src' and isinstance(v,str) and v.startswith('/world/'):yield v
   else:yield from urls(v)
 elif isinstance(value,list):
  for v in value:yield from urls(v)
references=set()
for filename in ['SpriteSheets.json','spriteManifest.json','PlaceArt.json','TerrainArt.json','CollectionArt.json','EelArt.json','BeachArt.json','CoastArt.json','GameArt.json']:
 references.update(urls(json.loads((ROOT/'src/world'/filename).read_text())))
references.update('/world/sprites/'+name+'-icon.png' for name in ['pond','skateboard','wakeboard','jetski','surfboard'])
references.update('/world/games/ball-'+str(index)+'.png' for index in range(6))
references.update('/world/collections/'+name+'.webp' for name in ['terrarium','aquarium','habitat-mantises','habitat-butterflies','habitat-ladybugs','habitat-dragonflies'])
for url in references:assert (ROOT/('public'+url)).is_file(),'Missing '+url
assert not (ROOT/'OLD OPEN WORLD').exists()
assert not (ROOT/'public/world/models').exists()
assert not (ROOT/'src/world/characters').exists()
assert 'three' not in json.loads((ROOT/'package.json').read_text()).get('dependencies',{})
print('Verified',len(references),'published artwork files; no retired 3D dependency or archive remains.')
