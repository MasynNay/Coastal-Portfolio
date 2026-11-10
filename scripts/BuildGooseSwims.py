"""Export the geese's water poses and contour in-betweens from source art."""

import hashlib
import json
from pathlib import Path
from statistics import median

from PIL import Image, ImageOps

from SpriteCutout import components

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/source-assets/coast"
SHEETS = ROOT / "src/world/CoastArt.json"
CELL = 128
WATERLINE = 114
KEYS = 4
SUBDIVISIONS = 3


def source_rows(name, rows):
    image = Image.open(SOURCE / name).convert("RGBA")
    w, h = image.size
    for row in range(rows):
        frames = []
        for col in range(KEYS):
            cell = image.crop(
                (
                    col * w // KEYS,
                    row * h // rows,
                    (col + 1) * w // KEYS,
                    (row + 1) * h // rows,
                )
            )
            # The generated source may retain a faint matte. Keep only the
            # connected bird silhouette, including its original feather colors.
            pixels, box = max(components(cell), key=lambda part: len(part[0]))
            assert (
                len(pixels) > 1000
                and 0 < box[0] < box[2] < cell.width
                and 0 < box[1] < box[3] < cell.height
            ), (name, row, col, box)
            mask = bytearray(cell.width * cell.height)
            for p in pixels:
                mask[p] = 255
            cell.putalpha(Image.frombytes("L", cell.size, bytes(mask)))
            frames.append(cell.crop(box))
        yield frames


def cycle(keys, width):
    scale = width / median(frame.width for frame in keys)
    for i, first in enumerate(keys):
        second = keys[(i + 1) % KEYS]
        for step in range(SUBDIVISIONS):
            t = step / SUBDIVISIONS
            w = round((first.width + (second.width - first.width) * t) * scale)
            h = round((first.height + (second.height - first.height) * t) * scale)
            # Match the contours during the transition with one visible body.
            # Blending two alpha silhouettes doubles necks and wing outlines.
            frame = first if t <= 0.5 else second
            yield frame.resize((w, h), Image.Resampling.LANCZOS)


def build():
    manifest = json.loads(SHEETS.read_text())
    diagonals = list(source_rows("GooseSwimDiagonals.png", 4))
    sources = (
        ("goose-canada", "CanadaGooseSwim.png"),
        ("goose-white", "WhiteGooseSwim.png"),
    )
    for index, (base, source) in enumerate(sources):
        front, back, side = source_rows(source, 3)
        front_diagonal, back_diagonal = diagonals[index * 2 : index * 2 + 2]
        directions = [
            (front, 70, False),
            (front_diagonal, 87, False),
            (side, 108, False),
            (back_diagonal, 87, False),
            (back, 67, False),
            (back_diagonal, 87, True),
            (side, 108, True),
            (front_diagonal, 87, True),
        ]
        count = KEYS * SUBDIVISIONS
        atlas = Image.new("RGBA", (CELL * count, CELL * len(directions)))
        for row, (keys, width, mirror) in enumerate(directions):
            for column, frame in enumerate(cycle(keys, width)):
                if mirror:
                    frame = ImageOps.mirror(frame)
                assert frame.width < CELL and frame.height < WATERLINE
                atlas.alpha_composite(
                    frame,
                    (
                        column * CELL + (CELL - frame.width) // 2,
                        row * CELL + WATERLINE - frame.height,
                    ),
                )
        name = base + "-swim"
        src = f"/world/coast/{name}.webp"
        target = ROOT / ("public" + src)
        # Feather tones tolerate light compression. Keep full alpha precision
        # so the waterline stays crisp even while zoomed in.
        atlas.save(target, quality=94, alpha_quality=100, method=6)
        manifest[name] = {
            **manifest[base],
            "src": src,
            "revision": hashlib.sha256(target.read_bytes()).hexdigest()[:12],
            "rows": len(directions),
            "columns": count,
            "cycleFrames": count,
            "footY": WATERLINE,
            "layout": "eight",
            "frameMs": manifest[base]["frameMs"] / SUBDIVISIONS,
        }
    SHEETS.write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    build()
