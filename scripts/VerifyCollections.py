"""Audit every collectible's real map/detail atlas, including all four frames."""

from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parents[1]
catalog = json.loads((ROOT / "src/world/Collectibles.json").read_text())
small = json.loads((ROOT / "src/world/SpriteSheets.json").read_text())
large = json.loads((ROOT / "src/world/CollectionArt.json").read_text())
frames = 0
for species in catalog["spiders"] + catalog["fish"]:
    for kind, book in [("map", small), ("inspection", large)]:
        sheet = book[species["art"]]
        image = Image.open(ROOT / ("public" + sheet["src"])).convert("RGBA")
        image.load()
        cw, ch = sheet.get("cw", sheet.get("width")), sheet.get(
            "ch", sheet.get("height")
        )
        rows, columns = sheet.get("rows", 1), sheet.get("columns", 4)
        assert image.size == (cw * columns, ch * rows), (
            species["id"],
            kind,
            "incorrect dimensions",
        )
        for row in range(rows):
            for col in range(columns):
                cell = image.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
                box = cell.getbbox()
                assert box, (species["id"], kind, "empty frame", row, col)
                assert box[2] - box[0] > cw * 0.12 and box[3] - box[1] > ch * 0.12, (
                    species["id"],
                    kind,
                    "fragment only",
                )
                frames += 1
print(
    "Verified",
    frames,
    f"complete map/inspection frames for {len(catalog['spiders'])} bugs and {len(catalog['fish'])} aquatic species.",
)
