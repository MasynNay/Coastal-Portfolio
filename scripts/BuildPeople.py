"""Pack complete drawn poses for the island and sprite workshop.

Each facing source follows PoseGuide.py: four idle poses, sixteen walking
poses and sixteen running poses. Each action uses one common scale, retaining
the actual drawing's anatomy and airborne foot positions.
No limbs are separated, stretched, rotated or composited by this exporter.
"""

from pathlib import Path
import hashlib
import math
import json
import statistics
import sys
from PIL import Image, ImageOps
import ImportSprites as sprites

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/source-assets/people"
APPEARANCES = json.loads((ROOT / "src/world/Appearances.json").read_text())
LOOKS = [entry["asset"] for entry in APPEARANCES]
ART_HEIGHTS = {entry["asset"]: entry.get("artHeight", 96) for entry in APPEARANCES}
OPAQUE_LOOKS = {entry["asset"] for entry in APPEARANCES if entry.get("opaqueBody")}
GAIT = json.loads((ROOT / "src/world/Gait.json").read_text())
VIEWS = ["south", "southwest", "west", "northwest", "north"]
WIDTH, HEIGHT, FOOT = 128, 144, 128
FRAMES = 16


def view_source(look, view):
    return SOURCE / look / (VIEWS[view] + ".png")


def read_poses(path, expected_rows, count=4):
    """Read whole figures between clear gutters; reject missing/cropped cells.

    Exported art can have different margins from the pose guide. Detect those
    margins rather than slicing through someone's hair or feet at a fixed grid.
    """
    image = Image.open(path).convert("RGBA")
    image.putalpha(image.getchannel("A").point(lambda a: 255 if a >= 160 else 0))
    if count == 8:
        # A jumping figure can rise above the feet of the preceding row in a
        # different column. A global horizontal cut would remove its hair.
        # Isolate each column first, then locate its own complete figures.
        columns = sprites.cuts(sprites.projection(image.getchannel("A"), "x"), count)
        by_column = []
        for column in range(count):
            strip = image.crop((columns[column], 0, columns[column + 1], image.height))
            alpha = strip.getchannel("A")
            bands, start = [], None
            for y in range(strip.height + 1):
                mass = (
                    sum(alpha.crop((0, y, strip.width, y + 1)).getdata()) / 255
                    if y < strip.height
                    else 0
                )
                if mass > 2 and start is None:
                    start = y
                elif mass <= 2 and start is not None:
                    if y - start > 20:
                        bands.append((start, y))
                    start = None
            assert len(bands) in expected_rows, (
                path,
                column,
                "incomplete activity column",
                len(bands),
            )
            by_column.append(
                [
                    strip.crop(
                        (0, max(0, top - 2), strip.width, min(strip.height, bottom + 2))
                    )
                    for top, bottom in bands
                ]
            )
        return [
            by_column[column][row].crop(by_column[column][row].getbbox())
            for row in range(len(by_column[0]))
            for column in range(count)
        ]
    # Generators preserve the grid's order but sometimes change its spacing.
    # Find the actual clear gutters; never cut a figure using assumed cell sizes.
    alpha = image.getchannel("A")
    bands, start = [], None
    for y in range(image.height + 1):
        mass = (
            sum(alpha.crop((0, y, image.width, y + 1)).getdata()) / 255
            if y < image.height
            else 0
        )
        if mass > 5 and start is None:
            start = y
        elif mass <= 5 and start is not None:
            if y - start > 20:
                bands.append((start, y))
            start = None
    assert len(bands) in expected_rows, (path, "unexpected drawn rows", len(bands))
    cells = []
    for top, bottom in bands:
        strip = image.crop(
            (0, max(0, top - 2), image.width, min(image.height, bottom + 2))
        )
        columns = sprites.cuts(sprites.projection(strip.getchannel("A"), "x"), count)
        assert all(
            sum(strip.getchannel("A").crop((x, 0, x + 1, strip.height)).getdata()) / 255
            < 10
            for x in columns[1:-1]
        ), (path, "column gutter intersects a person")
        for column in range(count):
            cell = strip.crop((columns[column], 0, columns[column + 1], strip.height))
            assert cell.getbbox(), (path, "empty pose")
            cells.append(cell.crop(cell.getbbox()))
    return cells


def source_poses(path, action, look):
    """Pack authored poses; an incomplete walk requires a separate full cycle.

    Some original source sheets contain idle + twelve walk + sixteen run poses.
    Their runs are usable, but stretching twelve walking poses into sixteen is
    not. A focused walk-{direction}.png supplies the complete replacement.
    """
    cells = read_poses(path, [8, 9])
    replacement = path.with_name("walk-" + path.name)
    if action == "walk" and replacement.exists():
        selected = read_poses(replacement, [4])
    elif action == "walk":
        assert len(cells) == 36, (path, "needs a complete sixteen-pose walking source")
        selected = cells[4:20]
    else:
        selected = cells[-16:]
    # Uniform scale for the entire action corrects source group magnification
    # without stretching a single bent-leg drawing back to standing height.
    body = statistics.median(cell.height for cell in selected)
    # Hats/crowns extend above a body; they must not shrink the wearer.
    adornment = {"costume-contact": 5}.get(look, 0)
    # These two fitted outfits use the approved wizard's motion reference.
    # A common, smaller whole-figure fit removes the previous hat enlargement;
    # the shared 96-pixel world metric and physics height remain unchanged.
    body_height = ART_HEIGHTS.get(look, 96) + adornment
    scale = body_height / body
    selected = selected + [cells[0]]
    result, heads = [], []
    for index, cell in enumerate(selected):
        bbox = cell.getbbox()
        assert bbox, (path, "empty pose")
        band = cell.crop(
            (0, 0, cell.width, max(1, round(cell.height * 0.28)))
        ).getbbox()
        head = (band[0] + band[2]) / 2 if band else cell.width / 2
        active_scale = body_height / cell.height if index == FRAMES else scale
        prepared = cell.resize(
            (round(cell.width * active_scale), round(cell.height * active_scale)),
            Image.Resampling.LANCZOS,
        )
        frame = Image.new("RGBA", (WIDTH, HEIGHT))
        phase = index / FRAMES
        bob = (
            max(0, math.sin((phase - 0.31) * math.pi * 4)) * 2 if action == "run" else 0
        )
        if index == FRAMES:
            bob = 0
        frame.alpha_composite(
            prepared,
            (round(WIDTH / 2 - head * active_scale), round(FOOT - body_height - bob)),
        )
        frame.putalpha(frame.getchannel("A").point(lambda a: 255 if a >= 160 else 0))
        heads.append(WIDTH / 2)
        result.append(frame)
    return result, heads


def previous_poses(sheet, row):
    """Keep other views available only during an explicitly partial local test."""
    image = Image.open(ROOT / ("public" + sheet["src"])).convert("RGBA")
    columns = sheet.get("columns", 4)
    cycle = sheet.get("cycleFrames", columns)
    indices = [round(i * cycle / FRAMES) % cycle for i in range(FRAMES)] + [
        sheet.get("idleFrame", 0)
    ]
    frames, anchors = [], []
    for column in indices:
        frame = image.crop(
            (
                column * sheet["cw"],
                row * sheet["ch"],
                (column + 1) * sheet["cw"],
                (row + 1) * sheet["ch"],
            )
        )
        aligned = Image.new("RGBA", (WIDTH, HEIGHT))
        padding = (WIDTH - sheet["cw"]) / 2
        aligned.alpha_composite(frame, (round(padding), FOOT - sheet["footY"]))
        frames.append(aligned)
        anchors.append(
            sheet.get("anchors", [sheet["cw"] / 2] * (columns * 8))[
                row * columns + column
            ]
            + padding
        )
    return frames, anchors


def build(names, partial=False):
    manifest_path = ROOT / "src/world/SpriteSheets.json"
    manifest = json.loads(manifest_path.read_text())
    people_path = ROOT / "docs/source-assets/People.json"
    people = json.loads(people_path.read_text())
    staged = []
    for look in names:
        sources = {
            str(view): VIEWS[view]
            for view in range(5)
            if view_source(look, view).exists()
        }
        assert partial or len(sources) == 5, (
            look,
            "complete every facing before publishing",
        )
        prepared = {
            (action, view): source_poses(view_source(look, view), action, look)
            for action in ["walk", "run"]
            for view in range(5)
            if str(view) in sources
        }
        for action in ["walk", "run"]:
            asset = look if action == "walk" else look + "-run"
            old = manifest[asset]
            atlas = Image.new("RGBA", (WIDTH * (FRAMES + 1), HEIGHT * 8))
            anchors = []
            for row in range(8):
                view = row if row <= 4 else 8 - row
                if str(view) in sources:
                    frames, offsets = prepared[(action, view)]
                    if row > 4:
                        frames = [ImageOps.mirror(f) for f in frames]
                        offsets = [WIDTH - 1 - x for x in offsets]
                else:
                    frames, offsets = previous_poses(old, row)
                for column, frame in enumerate(frames):
                    atlas.alpha_composite(frame, (column * WIDTH, row * HEIGHT))
                anchors.extend(offsets)
            alpha = atlas.getchannel("A")
            atlas = (
                atlas.convert("RGB")
                .quantize(colors=128, dither=Image.Dither.NONE)
                .convert("RGBA")
            )
            atlas.putalpha(alpha)
            path = ROOT / "public/world/sprites/emerald" / (asset + ".png")
            temporary = path.with_suffix(".new.png")
            atlas.save(temporary, optimize=True)
            staged.append((temporary, path))
            manifest[asset] = dict(
                id=asset,
                src="/world/sprites/emerald/" + asset + ".png",
                cw=WIDTH,
                ch=HEIGHT,
                rows=8,
                columns=FRAMES + 1,
                cycleFrames=FRAMES,
                idleFrame=FRAMES,
                bodyHeight=96,
                footY=FOOT,
                rootAligned=True,
                drawn=True,
                pixelArt=True,
                smooth=True,
                colors=128,
                detailVersion=4,
                detailScale=96 / 36,
                layout="eight",
                canonicalDirections=True,
                previewWidth=128,
                action=action,
                frameMs=GAIT[action + "CycleMs"] / FRAMES,
                anchors=anchors,
                revision=hashlib.sha256(temporary.read_bytes()).hexdigest()[:12],
            )
            if look in OPAQUE_LOOKS:
                manifest[asset]["opaqueBody"] = True
            people[asset] = dict(type="drawn", action=action, views=sources)
        print(
            "Published complete drawn poses:", look, "views:", len(sources), flush=True
        )
    manifest["costume-home"] = {**manifest["costume-airbender"], "id": "costume-home"}
    for temporary, path in staged:
        temporary.replace(path)
    metadata = manifest_path.with_suffix(".json.new")
    metadata.write_text(json.dumps(manifest, indent=2) + "\n")
    metadata.replace(manifest_path)
    people_path.write_text(json.dumps(people, indent=2) + "\n")


if __name__ == "__main__":
    names = (
        LOOKS
        if "--all" in sys.argv
        else [arg for arg in sys.argv[1:] if not arg.startswith("--")]
    )
    assert names, "Pass the character/costume names to publish."
    build(names, "--partial" in sys.argv)
