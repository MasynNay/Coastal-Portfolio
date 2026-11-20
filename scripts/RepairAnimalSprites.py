"""Repair audited animal frames without changing their animation or source art.

Run from the repository root with python3 scripts/RepairAnimalSprites.py.
FineSprites.json lists map sprites whose thin features need extra resolution.
"""

import hashlib
import json
import sys
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


def clean_detached_fragments():
    """Remove visually reviewed neighboring-frame scraps in map and tank art.

    Each rule describes where an unwanted fragment sits relative to the intact
    creature. This keeps real antennae, separated legs, and Ponyo's bubbles.
    No body pixels, frame dimensions, or animation origins are changed.
    """
    from CleanSprites import islands

    subjects = {
        "fish-aurora",
        "fish-pipefish",
        "fish-spiny-lobster",
        "dragonfly-emerald",
        "dragonfly-sunset",
        "dragonfly-velvetwing",
        "fish-harlequin-shrimp",
        "fish-squat-lobster",
        "fish-red-reef-prawn",
    }
    repairs = []
    for book_name in ["SpriteSheets", "CollectionArt"]:
        book = read_manifest(book_name)
        book_changed = False
        for name in sorted(subjects):
            sheet = book[name]
            path = ROOT / ("public" + sheet["src"])
            image = Image.open(path).convert("RGBA")
            width = sheet.get("cw", sheet.get("width"))
            height = sheet.get("ch", sheet.get("height"))
            removed = 0
            for row in range(image.height // height):
                for column in range(sheet.get("columns", 4)):
                    bounds = (
                        column * width,
                        row * height,
                        (column + 1) * width,
                        (row + 1) * height,
                    )
                    cell = image.crop(bounds)
                    parts = islands(cell)
                    body = set(parts[0])
                    left = min(x for x, y in body)
                    right = max(x for x, y in body) + 1
                    top = min(y for x, y in body)
                    bottom = max(y for x, y in body) + 1
                    center_x = (left + right) / 2
                    center_y = (top + bottom) / 2
                    cell_changed = False
                    for part in parts[1:]:
                        if len(part) > 300:
                            continue
                        part_left = min(x for x, y in part)
                        part_top = min(y for x, y in part)
                        part_bottom = max(y for x, y in part) + 1
                        if name in {
                            "fish-aurora", "fish-pipefish", "dragonfly-emerald"
                        }:
                            unwanted = (
                                part_left > center_x + (right - left) * 0.25
                                and part_bottom < bottom - (bottom - top) * 0.25
                            )
                        elif name == "fish-spiny-lobster":
                            unwanted = part_left > center_x + (right - left) * 0.25
                        elif name in {"dragonfly-sunset", "fish-harlequin-shrimp"}:
                            unwanted = part_top > bottom + 2
                        elif name == "dragonfly-velvetwing":
                            unwanted = part_bottom < top - 2
                        elif name == "fish-squat-lobster":
                            unwanted = part_left > right + 2
                        else:
                            unwanted = (
                                part_left > center_x + (right - left) * 0.3
                                and part_bottom < center_y
                            )
                        if not unwanted:
                            continue
                        nearby = any(
                            (x + dx, y + dy) in body
                            for x, y in part
                            for dx in range(-2, 3)
                            for dy in range(-2, 3)
                        )
                        if nearby:
                            continue
                        for point in part:
                            cell.putpixel(point, (0, 0, 0, 0))
                        removed += len(part)
                        cell_changed = True
                    if cell_changed:
                        image.paste(cell, bounds)
            if removed:
                options = (
                    {"lossless": True, "method": 6}
                    if path.suffix == ".webp"
                    else {"optimize": True}
                )
                image.save(path, **options)
                sheet["revision"] = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
                repairs.append({"asset": name, "src": sheet["src"], "pixels": removed})
                book_changed = True
        if book_changed:
            save_manifest(book_name, book)
    report_path = ROOT / "docs/SpriteAudit.json"
    report = json.loads(report_path.read_text())
    report.setdefault("fragmentRepairs", []).extend(repairs)
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print(
        "Removed",
        sum(item["pixels"] for item in repairs),
        "reviewed fragment pixels from",
        len(repairs),
        "map/inspection atlases.",
    )


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
    if "--fragments" not in sys.argv:
        main()
    clean_detached_fragments()
