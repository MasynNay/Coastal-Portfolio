"""Pack a regular transparent prop atlas described by a small import manifest.
Usage: python3 scripts/ImportProps.py /tmp/props.json
"""

from pathlib import Path
from PIL import Image
import json, sys, shutil
from ImportSprites import projection, cuts, ROOT

metadata = ROOT / "src/world/TerrainArt.json"
art = json.loads(metadata.read_text())
for job in json.loads(Path(sys.argv[1]).read_text()):
    source = ROOT / "docs/source-assets/town" / (job["name"] + ".png")
    source.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(job["source"], source)
    im = Image.open(source).convert("RGBA")
    im.putalpha(im.getchannel("A").point(lambda a: 255 if a >= 170 else 0))
    rows, cols = job["rows"], job["columns"]
    ycuts = cuts(projection(im.getchannel("A"), "y"), rows)
    for row in range(rows):
        strip = im.crop((0, ycuts[row], im.width, ycuts[row + 1]))
        xcuts = cuts(projection(strip.getchannel("A"), "x"), cols)
        for col in range(cols):
            cell = strip.crop((xcuts[col], 0, xcuts[col + 1], strip.height))
            cell = cell.crop(cell.getbbox())
            cell.thumbnail((256, 256), Image.Resampling.LANCZOS)
            cell.putalpha(cell.getchannel("A").point(lambda a: 255 if a >= 160 else 0))
            cell = cell.crop(cell.getbbox())
            name = job["ids"][row * cols + col]
            filename = name + ".png"
            cell.save(ROOT / "public/world/town-art" / filename, optimize=True)
            art["props"][name] = dict(
                src="/world/town-art/" + filename, width=cell.width, height=cell.height
            )
    print("Packed", job["name"])
# Retired loose toys are replaced by full equipment in the same town-art system.
art["props"] = {
    key: value for key, value in art["props"].items() if not key.startswith("town-toy-")
}
metadata.write_text(json.dumps(art, indent=2) + "\n")
