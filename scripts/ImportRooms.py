"""Publish new facade/room art without shrinking it to a tiny intermediate texture.
Door metadata aligns the painted threshold, collision corridor, path and entry trigger.
"""

from pathlib import Path
from PIL import Image
import json, sys, shutil

ROOT = Path(__file__).resolve().parents[1]
out = ROOT / "public/world/places"
out.mkdir(parents=True, exist_ok=True)
source = ROOT / "docs/source-assets/places"
source.mkdir(parents=True, exist_ok=True)
path = ROOT / "src/world/PlaceArt.json"
entries = json.loads(path.read_text()) if path.exists() else {}
# Threshold fractions are measured against the visible facade, including its short steps.
profiles = {
    "home": (10, 0.92),
    "skills": (8.5, 0.72),
    "portfolio": (8.5, 0.93),
    "resume": (11, 0.94),
    "contact": (10, 0.84),
    "lodge": (8, 0.91),
}
for key, file in json.loads(Path(sys.argv[1]).read_text()).items():
    kind, asset = key.split(":", 1)
    if kind not in {"door", "room"}:
        continue
    im = Image.open(file).convert("RGBA" if kind == "door" else "RGB")
    if kind == "door":
        im.putalpha(im.getchannel("A").point(lambda v: 0 if v < 64 else v))
        im = im.crop(im.getbbox())
    im.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
    filename = ("building-" if kind == "door" else "interior-") + asset + ".png"
    shutil.copyfile(file, source / filename)
    im.save(out / filename, optimize=True)
    entry = dict(src="/world/places/" + filename, width=im.width, height=im.height)
    if kind == "door":
        height, bottom = profiles[asset]
        entry.update(worldHeight=height, openingBottom=bottom)
    entries[("building-" if kind == "door" else "interior-") + asset] = entry
    print("Imported place", asset, kind, flush=True)
path.write_text(json.dumps(entries, indent=2) + "\n")
