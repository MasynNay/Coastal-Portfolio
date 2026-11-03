"""Publish the two parked bicycle designs; rider poses use PreparePeople.py."""

import json
import statistics
from PIL import Image, ImageOps
import ImportSprites as sprites

poses, _ = sprites.extract(sprites.SOURCE / "Bikes.png", 8)
for offset, kind in [(0, "acro"), (16, "mach")]:
    cells = poses[offset : offset + 16]
    cells = cells[:12] + [ImageOps.mirror(cell) for cell in cells[8:12]]
    width, height, foot = 192, 160, 152
    ratio = min(
        96 / statistics.median(cell.height for cell in cells),
        (width - 12) / max(cell.width for cell in cells),
        (height - 12) / max(cell.height for cell in cells),
    )
    body = round(statistics.median(cell.height for cell in cells) * ratio)
    atlas = Image.new("RGBA", (width * 4, height * 4))
    for index, cell in enumerate(cells):
        small = cell.resize(
            (round(cell.width * ratio), round(cell.height * ratio)),
            Image.Resampling.LANCZOS,
        )
        small.putalpha(small.getchannel("A").point(lambda a: 255 if a >= 160 else 0))
        small = small.crop(small.getbbox())
        atlas.alpha_composite(
            small,
            (
                index % 4 * width + (width - small.width) // 2,
                index // 4 * height + foot - small.height,
            ),
        )
    alpha = atlas.getchannel("A")
    atlas = (
        atlas.convert("RGB")
        .quantize(colors=128, dither=Image.Dither.NONE)
        .convert("RGBA")
    )
    atlas.putalpha(alpha)
    name = "bike-" + kind
    atlas.save(sprites.OUT / (name + ".png"), optimize=True)
    sprites.manifest[name] = dict(
        id=name,
        src="/world/sprites/emerald/" + name + ".png",
        cw=width,
        ch=height,
        rows=4,
        columns=4,
        bodyHeight=body,
        footY=foot,
        pixelArt=True,
        smooth=True,
        colors=128,
        layout="four",
        action="bike",
        frameMs=100,
        canonicalSides=True,
    )
sprites.manifest_path.write_text(json.dumps(sprites.manifest, indent=2) + "\n")
print("Published two detailed parked bicycles.")
