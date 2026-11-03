"""Import newly drawn game atlases. Align feet, preserve pose silhouettes and reduce the
actual new artwork to a deliberate GBA-sized palette. Original archive assets are untouched.
Run: python3 scripts/ImportSprites.py /tmp/pixel-art-jobs.json
"""

from pathlib import Path
from PIL import Image
import json, sys, statistics, shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/world/sprites/emerald"
OUT.mkdir(parents=True, exist_ok=True)
SOURCE = ROOT / "docs/source-assets/emerald"
SOURCE.mkdir(parents=True, exist_ok=True)
manifest_path = ROOT / "src/world/SpriteSheets.json"
manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}


def projection(mask, axis):
    return list(
        mask.resize(
            (mask.width, 1) if axis == "x" else (1, mask.height), Image.Resampling.BOX
        ).getdata()
    )


def cuts(weights, count):
    active = [i for i, v in enumerate(weights) if v > 1]
    if not active:
        raise ValueError("Empty sprite projection")
    lo, hi = active[0], active[-1] + 1
    centers = [lo + (i + 0.5) * (hi - lo) / count for i in range(count)]
    for _ in range(20):
        sums = [0.0] * count
        mass = [0.0] * count
        for x, w in enumerate(weights):
            if not w:
                continue
            i = min(range(count), key=lambda i: abs(x - centers[i]))
            sums[i] += x * w
            mass[i] += w
        centers = [sums[i] / mass[i] if mass[i] else centers[i] for i in range(count)]
    borders = [0]
    for a, b in zip(centers, centers[1:]):
        mid = (a + b) / 2
        radius = (b - a) * 0.36
        candidates = range(
            max(borders[-1] + 1, int(mid - radius)),
            min(len(weights) - 1, int(mid + radius) + 1),
        )
        borders.append(min(candidates, key=lambda x: (weights[x], abs(x - mid))))
    return borders + [len(weights)]


def extract(path, rows=8, columns=4):
    im = Image.open(path).convert("RGBA")
    # Alpha-only threshold avoids incorporating invisible key-color debris into bounding boxes.
    im.putalpha(im.getchannel("A").point(lambda a: 255 if a >= 160 else 0))
    ycuts = cuts(projection(im.getchannel("A"), "y"), rows)
    cells = []
    boxes = []
    for row in range(rows):
        strip = im.crop((0, ycuts[row], im.width, ycuts[row + 1]))
        xcuts = cuts(projection(strip.getchannel("A"), "x"), columns)
        for col in range(columns):
            cell = strip.crop((xcuts[col], 0, xcuts[col + 1], strip.height))
            bbox = cell.getbbox()
            if not bbox:
                raise ValueError(f"Empty pose {path} {row} {col}")
            cells.append(cell.crop(bbox))
            boxes.append(
                [
                    xcuts[col] + bbox[0],
                    ycuts[row] + bbox[1],
                    xcuts[col] + bbox[2],
                    ycuts[row] + bbox[3],
                ]
            )
    return cells, boxes


def publish(asset, cells, rows, pixel_height=36, action="walk", source_rows=None):
    selected = [
        cells[r * 4 + c] for r in (source_rows or list(range(rows))) for c in range(4)
    ]
    canvas_size = (32, 48) if action == "walk" else (64, 72)
    cw, ch = canvas_size
    foot_y = ch - 4
    # Run poses provide a common body scale; rods and mounts get more canvas, not smaller people.
    base = statistics.median(c.height for c in selected[: min(16, len(selected))])
    ratio = pixel_height / base
    max_width = max(c.width for c in selected) * ratio
    if max_width > cw - 4:
        ratio *= (cw - 4) / max_width
    actual_body = max(20, round(base * ratio))
    atlas = Image.new("RGBA", (cw * 4, ch * rows))
    report = []
    for i, cell in enumerate(selected):
        size = (max(1, round(cell.width * ratio)), max(1, round(cell.height * ratio)))
        if size[1] > ch - 6:
            # Long props remain in frame; preserve the body's scale where possible.
            size = (max(1, round(size[0] * (ch - 6) / size[1])), ch - 6)
        small = cell.resize(size, Image.Resampling.LANCZOS)
        alpha = small.getchannel("A").point(lambda a: 255 if a >= 150 else 0)
        small.putalpha(alpha)
        x = (cw - size[0]) // 2
        y = foot_y - size[1]
        atlas.alpha_composite(small, ((i % 4) * cw + x, (i // 4) * ch + y))
        report.append(dict(frame=i, width=size[0], height=size[1], footY=foot_y))
    alpha = atlas.getchannel("A")
    atlas = (
        atlas.convert("RGB")
        .quantize(colors=28, dither=Image.Dither.NONE)
        .convert("RGBA")
    )
    atlas.putalpha(alpha)
    filename = asset + ".png"
    atlas.save(OUT / filename, optimize=True)
    manifest[asset] = dict(
        id=asset,
        src="/world/sprites/emerald/" + filename,
        cw=cw,
        ch=ch,
        rows=rows,
        columns=4,
        bodyHeight=actual_body,
        footY=foot_y,
        pixelArt=True,
        layout="eight" if rows == 8 else "four",
        action=action,
        frameMs=(
            95
            if action == "walk"
            else (
                75
                if action == "run"
                else 100 if action in {"call", "ride", "land"} else 160
            )
        ),
    )
    if action == "fish":
        # Rods extend to one side of the cell; feet, not the whole silhouette,
        # anchor a fishing body to the same map position as the walking body.
        anchors = []
        for i in range(rows * 4):
            frame = atlas.crop(
                ((i % 4) * cw, (i // 4) * ch, (i % 4 + 1) * cw, (i // 4 + 1) * ch)
            )
            feet = [
                x
                for y in range(foot_y - 4, foot_y)
                for x in range(cw)
                if frame.getpixel((x, y))[3]
            ]
            anchors.append((min(feet) + max(feet)) / 2 if feet else cw / 2)
        manifest[asset]["anchors"] = anchors
    return report


def main(config):
    jobs = json.loads(Path(config).read_text())
    reports = {}
    for key, path in jobs.items():
        kind, asset = key.split(":", 1)
        if kind not in {"walk", "actions", "travel", "costume"}:
            continue
        source_name = kind + "-" + asset + ".png"
        shutil.copyfile(path, SOURCE / source_name)
        cells, boxes = extract(path)
        if kind in {"walk", "costume"}:
            reports[key] = publish(asset, cells, 8)
        elif kind == "actions":
            reports[key] = {
                "run": publish(
                    asset + "-run", cells, 4, action="run", source_rows=list(range(4))
                ),
                "fish": publish(
                    asset + "-fish",
                    cells,
                    4,
                    action="fish",
                    source_rows=list(range(4, 8)),
                ),
            }
        else:
            reports[key] = {
                "surf": publish(
                    asset + "-surf", cells, 4, action="surf", source_rows=list(range(4))
                ),
                "call": publish(
                    asset + "-call", cells, 1, action="call", source_rows=[4]
                ),
                "ride": publish(
                    asset + "-ride", cells, 1, action="ride", source_rows=[5]
                ),
                "land": publish(
                    asset + "-land", cells, 1, action="land", source_rows=[6]
                ),
                "emote": publish(
                    asset + "-emote", cells, 1, action="emote", source_rows=[7]
                ),
            }
        reports[key + "_sourceBoxes"] = boxes
        print("Imported", key, flush=True)
    manifest["costume-home"] = {
        **manifest.get("costume-airbender", manifest["masyn"]),
        "id": "costume-home",
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    print("Published", len(manifest), "sprite atlases")


if __name__ == "__main__":
    main(sys.argv[1])
