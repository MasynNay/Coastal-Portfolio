"""Rebuild the six retained animal sheets from the migrated original artwork.
Family reference sheets are kept beside these sources but are not republished.
Run from the repository root: python3 scripts/PrepareLegacyAnimals.py
"""

from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "docs/source-assets/legacy"
target = ROOT / "public/world/sprites"
path = ROOT / "src/world/spriteManifest.json"
data = json.loads(path.read_text())
files = {
    "duck": "animal-duck-walk-clean.png",
    "goose": "animal-goose-walk.png",
    "axolotl": "animal-axolotl-walk.png",
    "axolotl-blue": "animal-axolotl-blue-walk.png",
    "fish": "animal-fish-blue-walk.png",
    "koi": "animal-koi-red-white-walk.png",
}
for name, filename in files.items():
    image = Image.open(source / filename).convert("RGBA")
    if name == "duck":
        w, h = image.width // 4, image.height // 8
        cells = [
            image.crop((x * w, y * h, (x + 1) * w, (y + 1) * h))
            for y in range(8)
            for x in range(4)
        ]
        bounds = [c.getbbox() for c in cells if c.getbbox()]
        crop = (
            min(b[0] for b in bounds),
            min(b[1] for b in bounds),
            max(b[2] for b in bounds),
            max(b[3] for b in bounds),
        )
        cw, ch = 96, 80
        ratio = min((cw - 4) / (crop[2] - crop[0]), (ch - 4) / (crop[3] - crop[1]))
        size = (round((crop[2] - crop[0]) * ratio), round((crop[3] - crop[1]) * ratio))
        output = Image.new("RGBA", (cw * 4, ch * 8))
        for i, c in enumerate(cells):
            output.alpha_composite(
                c.crop(crop).resize(size, Image.Resampling.LANCZOS),
                ((i % 4) * cw + (cw - size[0]) // 2, (i // 4) * ch + ch - size[1] - 2),
            )
        image = output
    image.save(target / (name + ".webp"), quality=90, method=6)
    print("Prepared", name)
