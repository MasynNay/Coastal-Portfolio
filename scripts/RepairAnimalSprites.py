"""Repair audited animal frames without changing their animation or source art.

Run from the repository root with python3 scripts/RepairAnimalSprites.py.
FineSprites.json lists map sprites whose thin features need extra resolution.
"""

import hashlib
import json
from PIL import Image
import ImportSprites as sprites
from ImportCollectibles import FINE_SPRITES, pack
from SpriteCutout import components

ROOT = sprites.ROOT
WORLD = ROOT / "src/world"
COLLECTION = ROOT / "docs/source-assets/collections"


def read_manifest(name):
    return json.loads((WORLD / f"{name}.json").read_text())


def save_manifest(name, data):
    (WORLD / f"{name}.json").write_text(json.dumps(data, indent=2) + "\n")


def repair_frames(sheet, edits, baseline=None):
    """Clear only inspected debris regions in specified atlas cells."""
    path = ROOT / ("public" + sheet["src"])
    image = Image.open(path).convert("RGBA")
    width = sheet.get("cw", sheet.get("width"))
    height = sheet.get("ch", sheet.get("height"))
    changed = False
    for column, row, region in edits:
        x, y = column * width, row * height
        bounds = (x, y, x + width, y + height)
        cell = image.crop(bounds)
        if cell.crop(region).getbbox() is None:
            continue
        if baseline:
            _, body = max(components(cell), key=lambda part: len(part[0]))
            # A repaired pose already reaches the debris region with its feet.
            if body[3] >= region[1]:
                continue
        cell.paste((0, 0, 0, 0), region)
        if baseline:
            cutout = cell.crop(cell.getbbox())
            aligned = Image.new("RGBA", cell.size)
            aligned.alpha_composite(
                cutout, ((width - cutout.width) // 2, baseline - cutout.height)
            )
            cell = aligned
        image.paste(cell, bounds)
        changed = True
    if changed:
        options = (
            {"lossless": True, "method": 6}
            if path.suffix == ".webp"
            else {"optimize": True}
        )
        image.save(path, **options)
    sheet["revision"] = hashlib.sha256(path.read_bytes()).hexdigest()[:12]


def main():
    legacy = read_manifest("spriteManifest")
    coast = read_manifest("CoastArt")
    detail = read_manifest("CollectionArt")

    # These three duck rows picked up the next pose's head under their feet.
    repair_frames(
        legacy["duck"],
        [(c, r, (0, 68, 96, 80)) for r in (3, 4, 5) for c in range(4)],
        baseline=78,
    )
    for name in ("duck", "goose", "fish", "koi"):
        # The right-facing art is in rows 1–3 in the migrated source sheets.
        legacy[name]["directions"] = [[row, 0] for row in range(8)]
    for sheet in legacy.values():
        # Draw directly from the authored image instead of downsampling twice.
        sheet.update(native=True, smooth=True)

    repair_frames(
        coast["mallard-flight"], [(6, 0, (43, 124, 53, 134)), (7, 0, (41, 125, 51, 134))]
    )
    repair_frames(coast["goose-canada"], [(3, 2, (37, 24, 59, 32))])
    repair_frames(
        detail["dragonfly-golden-island"],
        [(2, 0, (85, 17, 95, 25)), (3, 0, (86, 17, 97, 27))],
    )
    repair_frames(detail["fish-fire-shrimp"], [(0, 0, (161, 177, 178, 186))])

    catalog = read_manifest("Collectibles")
    indexed = {kind: {s["id"]: s for s in catalog[kind]} for kind in ("fish", "spiders")}
    updated = set()
    for job in json.loads((COLLECTION / "prompts.json").read_text()):
        kind = job["kind"]
        selected = []
        for row, species_id in enumerate(job["rows"]):
            species = indexed[kind][species_id]
            if species["art"] in FINE_SPRITES:
                selected.append((row, species))
        if not selected:
            continue
        cells, _ = sprites.extract(
            COLLECTION / (job["key"] + ".png"), 10, row_cuts=job.get("rowCuts")
        )
        for row, species in selected:
            pack(species, cells[row * 4 : row * 4 + 4], kind)
            updated.add(species["art"])
    assert updated == FINE_SPRITES, "Some reviewed map sprites have no source"
    save_manifest("spriteManifest", legacy)
    save_manifest("CoastArt", coast)
    save_manifest("CollectionArt", detail)
    # Ponyo's SVG-derived map art intentionally has soft edge coverage.
    sprites.manifest["fish-ponyo"]["softAlpha"] = True
    save_manifest("SpriteSheets", sprites.manifest)
    print("Repacked", len(updated), "fine-feature map sprites and checked the targeted repairs.")


if __name__ == "__main__":
    main()
