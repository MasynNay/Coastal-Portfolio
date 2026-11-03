"""Check opposite-facing pixels for every canonical directional animation.

The left/front/back source views are visually reviewed during import. Right
views must be exact reflections of the matching left pose, not another frame
or an accidentally repeated right-facing drawing. Includes every cycle phase.
"""

from pathlib import Path
from PIL import Image, ImageOps, ImageChops
import json

ROOT = Path(__file__).resolve().parents[1]
sheets = json.loads((ROOT / "src/world/SpriteSheets.json").read_text())
frames, atlases = 0, 0
for name, sheet in sheets.items():
    if not (sheet.get("canonicalDirections") or sheet.get("canonicalSides")):
        continue
    cw, ch = sheet["cw"], sheet["ch"]
    image = Image.open(ROOT / ("public" + sheet["src"])).convert("RGBA")
    pairs = [(1, 7), (2, 6), (3, 5)] if sheet.get("canonicalDirections") else [(2, 3)]
    for left, right in pairs:
        assert right < sheet["rows"], (name, "missing opposing direction")
        for column in range(sheet.get("columns", 4)):
            a = image.crop((column * cw, left * ch, (column + 1) * cw, (left + 1) * ch))
            b = image.crop(
                (column * cw, right * ch, (column + 1) * cw, (right + 1) * ch)
            )
            a, b = a.crop(a.getbbox()), b.crop(b.getbbox())
            assert a.size == b.size, (name, column, left, right, "different pose sizes")
            difference = ImageChops.difference(a, ImageOps.mirror(b))
            assert all(high == 0 for low, high in difference.getextrema()), (
                name,
                column,
                left,
                right,
                "opposite-facing pixels disagree",
            )
            frames += 2
    atlases += 1
print("Verified", atlases, "directional atlases and", frames, "opposite-facing frames.")
