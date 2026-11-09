"""Use the Everyday Hoodie face for the three costume families that drifted.

The outfit silhouettes, hat brims, tattoo, pose origins and gear stay in the
authored atlases. This build step stamps the matching directional face inside
the original face area, once per exported atlas.
"""

import hashlib
import json
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps
from BuildPeople import ROOT
from SpriteCutout import components

manifest_path = ROOT / "src/world/SpriteSheets.json"
sheets = json.loads(manifest_path.read_text())
outfits = ("costume-airbender", "costume-portfolio", "link")
abilities = (
    "glide-launch",
    "ability-glide",
    "glide-land",
    "ability-pokeball",
    "ability-ocarina",
)
version = 1


def atlas(sheet):
    return Image.open(ROOT / ("public" + sheet["src"])).convert("RGBA")


def cell_box(sheet, row, column):
    w, h = sheet["cw"], sheet["ch"]
    return column * w, row * h, (column + 1) * w, (row + 1) * h


def face_bounds(frame, anchor, narrow=False):
    """Find the uppermost substantial warm skin region near the head axis."""
    left, top, right, bottom = frame.getbbox()
    search = (
        max(left, round(anchor) - 28),
        top,
        min(right, round(anchor) + 29),
        min(bottom, top + 86),
    )
    area = frame.crop(search)
    mask = Image.new("L", area.size)
    mask.putdata(
        [
            255
            if (
                a and r >= 150 and 0.58 * r <= g <= 0.9 * r
                and 0.29 * r <= b <= min(158, 0.7 * r) and g > b + 12
            )
            else 0
            for r, g, b, a in area.getdata()
        ]
    )
    # Warm one-pixel reflections along the cap are not skin. A forehead has
    # several neighboring lit pixels before the eye and beard lines begin.
    minimum = 5 if narrow else 8
    warm_run = bytes([255]) * minimum
    first = next(
        (
            y
            for y in range(mask.height)
            if warm_run in mask.crop((0, y, mask.width, y + 1)).tobytes()
        ),
        None,
    )
    if first is not None:
        mask.paste(0, (0, 0, mask.width, first))
        bottom = min(mask.height, first + 23)
        mask.paste(0, (0, bottom, mask.width, mask.height))
    # Connect the bright nose, cheek and forehead across thin eye/brow lines.
    area.putalpha(mask.filter(ImageFilter.MaxFilter(5)))
    matches = [
        (len(points), box)
        for points, box in components(area)
        if len(points) >= (32 if narrow else 70) and box[3] - box[1] >= 8
    ]
    if not matches:
        return None
    mass, box = max(matches, key=lambda p: p[0] / (1 + p[1][1] / 19))
    if not narrow and mass < 130:
        return None
    x1, y1, x2, y2 = box
    return (
        search[0] + x1 + 2,
        search[1] + y1 + 2,
        search[0] + x2 - 2,
        search[1] + y2 - 2,
    )


def face_patch(frame, bounds):
    """Include the eyes, brows, nose and beard shading while feathering edges."""
    x1, y1, x2, y2 = bounds
    box = (x1 - 2, y1, x2 + 2, y2 + 4)
    cutout = frame.crop(box)
    w, h = cutout.size
    mask = Image.new("L", (w, h))
    ImageDraw.Draw(mask).rounded_rectangle((2, 2, w - 3, h - 4), radius=6, fill=255)
    cutout.putalpha(mask.filter(ImageFilter.GaussianBlur(1.5)))
    return cutout


hoodie = sheets["masyn"]
reference = atlas(hoodie)
patches = {}
for row in (0, 1, 2):
    frame = reference.crop(cell_box(hoodie, row, hoodie["idleFrame"]))
    # The profile cut ends before the ear, which is set into the outfit hair.
    bounds = [(50, 48, 78, 70), (51, 47, 76, 69), (48, 45, 62, 66)][row]
    patches[row] = face_patch(frame, bounds)


def match(frame, row, anchor, airbender):
    bounds = face_bounds(frame, anchor, narrow=row == 2)
    if bounds is None:
        return frame
    left, top, right, bottom = bounds
    # Keep the forehead arrow and don't pull the eyebrows up into the cap.
    patch = patches[row]
    w = min(right - left, (34, 29, 17)[row]) + 4
    h = min(bottom - top, 25 if row == 2 else 28) + 4
    if not (11 <= w <= 48 and 13 <= h <= 56):
        return frame
    patch = patch.resize((w, h), Image.Resampling.LANCZOS)
    x, y = left - 2, top
    # Fine-align painted brows to the frame's actual eye line before blending.
    # A color match alone would let a bright brim drag the face upward.
    donor = patch.convert("L")
    samples = [(u, v) for v in range(4, h - 3, 2) for u in range(3, w - 3, 2)]
    gray = frame.convert("L")

    def mismatch(offset):
        dx, dy = offset
        return sum(
            abs(donor.getpixel((u, v)) - gray.getpixel((x + dx + u, y + dy + v)))
            for u, v in samples
        ) + (abs(dx) + abs(dy)) * len(samples) * 3

    if x > 3 and y > 3 and x + w + 3 < frame.width and y + h + 3 < frame.height:
        dx, dy = min(
            ((dx, dy) for dx in range(-3, 4) for dy in range(-3, 4)),
            key=mismatch,
        )
        x, y = x + dx, y + dy
    local = frame.crop((x, y, x + w, y + h))
    protected = Image.new("L", (w, h))
    protected.putdata(
        [
            255
            if a and r > g * 0.96 and b < 166 and not (r > 130 and g < r * 0.41)
            else 0
            for r, g, b, a in local.getdata()
        ]
    )
    alpha = ImageChops.multiply(patch.getchannel("A"), protected)
    if airbender:
        # Neutral blue arrow ink is already excluded by the color mask.
        alpha.paste(0, (0, 0, w, max(3, round(h * 0.24))))
    patch.putalpha(alpha)
    # Paint only existing body pixels. Transparent margins and hat silhouettes
    # never expand, and any action's anchor remains valid.
    out = frame.copy()
    out.alpha_composite(patch, (x, y))
    out.putalpha(frame.getchannel("A"))
    return out


def apply(name, sheet):
    image = atlas(sheet)
    count = sheet.get("columns", 4)
    anchors = sheet.get("anchors", [sheet["cw"] / 2] * (sheet["rows"] * count))
    airbender = "glide" in name or "airbender" in name
    if sheet["rows"] == 8:
        rows = [(0, 0), (1, 1), (2, 2)]
        mirror = {1: 7, 2: 6}
    elif sheet["rows"] == 4:
        rows = [(0, 0), (2, 2)]
        mirror = {2: 3}
    else:
        rows = [(0, 0)]
        mirror = {}
    for row, view in rows:
        for column in range(count):
            box = cell_box(sheet, row, column)
            cell = match(
                image.crop(box), view, anchors[row * count + column], airbender
            )
            image.paste(cell, box)
            if row in mirror:
                opposite = cell_box(sheet, mirror[row], column)
                # Canonical opposing rows use the same shape mirrored within
                # their own bounds, which can be offset by one source pixel.
                other = image.crop(opposite).getbbox()
                image.paste(
                    ImageOps.mirror(cell.crop(cell.getbbox())),
                    (opposite[0] + other[0], opposite[1] + other[1]),
                )
    alpha = image.getchannel("A")
    image = (
        image.convert("RGB").quantize(colors=256, dither=Image.Dither.NONE).convert("RGBA")
    )
    image.putalpha(alpha)
    path = ROOT / ("public" + sheet["src"])
    image.save(path, optimize=True)
    sheet.update(
        identityVersion=version,
        colors=256,
        revision=hashlib.sha256(path.read_bytes()).hexdigest()[:12],
    )


if __name__ == "__main__":
    edited = {}
    for name, sheet in sheets.items():
        if name in abilities or any(
            name == look or name.startswith(look + "-") for look in outfits
        ):
            if sheet.get("identityVersion") != version:
                apply(name, sheet)
            edited[sheet["src"]] = sheet
    # Older names can still point at the same PNG. Keep their cache and
    # validation metadata in sync without processing the pixels twice.
    for sheet in sheets.values():
        source = edited.get(sheet["src"])
        if source:
            sheet.update(colors=source["colors"], revision=source["revision"])
    manifest_path.write_text(json.dumps(sheets, indent=2) + "\n")
