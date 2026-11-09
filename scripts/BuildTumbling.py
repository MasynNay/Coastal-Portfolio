"""Pack Fallyn's 24 full-body tumbling drawings in performance order."""

import hashlib
import json
from math import cos, radians, sin
from PIL import Image
from BuildPeople import ROOT, SOURCE
from SpriteCutout import components

KEYS = SOURCE / "fallyn/tumbling.png"
INBETWEENS = SOURCE / "fallyn/tumbling-inbetweens.png"
# Key poses and the corresponding in-between drawings interleave on one atlas.
ORDER = [
    0, 12, 1, 13, 14, 2, 15, 3, 16, 4, 17, 5,
    18, 6, 19, 20, 21, 8, 7, 9, 22, 10, 23, 11,
]
# Tilt of each drawing's body axis, in performance order. A layout needs the
# same width through the shoulders as a standing pose, even while horizontal.
BODY_TILT = (
    0, 0, 10, 10, -24, -25, 24, 0, -38, 30, 23, 10,
    -12, -12, -78, 0, -47, 88, 58, 0, 18, 10, 0, 0,
)
CELL = 160
FOOT = 144
# Match equivalent shadows, midtones and highlights in the tumbling and idle
# drawings. The warm ramp covers auburn hair and skin, while the neutral ramp
# keeps the dress and sandals as dark as the everyday outfit.
COLOR_MATCHES = (
    ((45, 26, 14), (46, 24, 12)),
    ((101, 55, 24), (110, 51, 14)),
    ((154, 83, 37), (166, 87, 32)),
    ((173, 103, 52), (176, 90, 31)),
    ((212, 143, 82), (192, 104, 40)),
    ((224, 147, 81), (209, 120, 51)),
    ((130, 81, 45), (139, 89, 45)),
    ((238, 153, 85), (221, 129, 56)),
    ((249, 191, 128), (250, 180, 107)),
    ((246, 197, 137), (253, 199, 133)),
    ((252, 211, 151), (252, 203, 142)),
    ((255, 225, 179), (255, 218, 167)),
    ((24, 22, 20), (24, 25, 23)),
    ((45, 40, 34), (33, 32, 29)),
    ((63, 55, 49), (39, 39, 36)),
    ((76, 69, 61), (51, 47, 43)),
)


def cut_poses(path):
    image = Image.open(path).convert("RGBA")
    w, h = image.size
    for index in range(12):
        row, column = divmod(index, 4)
        frame = image.crop(
            (column * w // 4, row * h // 3, (column + 1) * w // 4, (row + 1) * h // 3)
        )
        # Keep the large connected silhouette, removing isolated source flecks.
        pixels, box = max(components(frame), key=lambda part: len(part[0]))
        mask = bytearray(frame.width * frame.height)
        for point in pixels:
            mask[point] = 255
        frame.putalpha(Image.frombytes("L", frame.size, bytes(mask)))
        yield frame.crop(box)


def idle_profile(standing):
    w, h = standing["cw"], standing["ch"]
    left = standing["idleFrame"] * w
    with Image.open(ROOT / ("public" + standing["src"])) as image:
        idle = image.convert("RGBA").crop((left, 2 * h, left + w, 3 * h))
    return idle.crop(idle.getbbox())


def profile_scale(idle, upright):
    """Match the arms-down pose to the game's side-facing idle drawing."""
    def head_width(frame):
        # The upper quarter has hair and face, clear of the arms and dress.
        head = frame.crop((0, 0, frame.width, round(frame.height / 4)))
        x0, _, x1, _ = head.getbbox()
        return x1 - x0

    return head_width(idle) / head_width(upright), idle.height / upright.height


def match_palette(atlas, idle):
    """Grade the drawn shades and snap them to Fallyn's actual idle colors."""
    palette = {pixel[:3] for pixel in idle.getdata() if pixel[3]}

    def distance(a, b):
        return sum((x - y) ** 2 for x, y in zip(a, b))

    indexed = atlas.convert("RGB").quantize(colors=128, dither=Image.Dither.NONE)
    colors = indexed.getpalette()
    result = []
    for i in range(0, len(colors), 3):
        color = colors[i : i + 3]
        closest = sorted(COLOR_MATCHES, key=lambda match: distance(color, match[0]))[:3]
        weights = [1 / (distance(color, source) + 36) for source, _ in closest]
        graded = tuple(
            value
            + sum(
                weight * (target[channel] - source[channel])
                for weight, (source, target) in zip(weights, closest)
            )
            / sum(weights)
            for channel, value in enumerate(color)
        )
        result.extend(min(palette, key=lambda swatch: (distance(graded, swatch), swatch)))
    indexed.putpalette(result)
    image = indexed.convert("RGBA")
    image.putalpha(atlas.getchannel("A"))
    return image


def fit_pose(frame, scale, tilt):
    """Apply one body scale in the drawing's own axes, then ground the pose."""
    across, along = scale
    c, s = cos(radians(tilt)), sin(radians(tilt))
    a = c * c / across + s * s / along
    b = c * s * (1 / across - 1 / along)
    d = s * s / across + c * c / along
    center = CELL / 2
    fitted = frame.transform(
        (CELL, CELL),
        Image.Transform.AFFINE,
        (
            a, b, frame.width / 2 - center * (a + b),
            b, d, frame.height / 2 - center * (b + d),
        ),
        Image.Resampling.BICUBIC,
    )
    fitted.putalpha(fitted.getchannel("A").point(lambda a: 255 if a >= 160 else 0))
    box = fitted.getbbox()
    assert box and 0 < box[0] and 0 < box[1] and box[2] < CELL and box[3] < CELL
    return fitted.crop(box)


def build():
    name = "fallyn-tumbling"
    path = ROOT / "src/world/SpriteSheets.json"
    manifest = json.loads(path.read_text())
    idle = idle_profile(manifest["fallyn"])
    frames = [*cut_poses(KEYS), *cut_poses(INBETWEENS)]
    # The arms-down drawing starts the first handspring. Use it as the scale
    # reference for the whole pass so tucked and extended poses never resize.
    scale = profile_scale(idle, frames[ORDER[1]])
    sheet = Image.new("RGBA", (CELL * len(ORDER), CELL))
    for column, (index, tilt) in enumerate(zip(ORDER, BODY_TILT, strict=True)):
        frame = frames[index]
        if index == 8:
            # Rotate the back-facing draw into the layout's exit angle.
            frame = frame.rotate(-34, resample=Image.Resampling.BICUBIC, expand=True)
            frame = frame.crop(frame.getbbox())
        frame = fit_pose(frame, scale, tilt)
        sheet.alpha_composite(
            frame, (column * CELL + (CELL - frame.width) // 2, FOOT - frame.height)
        )
    sheet = match_palette(sheet, idle)
    src = f"/world/sprites/emerald/{name}.png"
    target = ROOT / ("public" + src)
    target.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(target, optimize=True)
    manifest[name] = dict(
        id=name,
        src=src,
        cw=CELL,
        ch=CELL,
        rows=1,
        columns=len(ORDER),
        frameMs=95,
        bodyHeight=manifest["fallyn"]["bodyHeight"],
        footY=FOOT,
        mirrorWest=True,
        pixelArt=True,
        smooth=True,
        native=True,
        colors=128,
        drawn=True,
        action="tumbling",
        revision=hashlib.sha256(target.read_bytes()).hexdigest()[:12],
    )
    path.write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    build()
