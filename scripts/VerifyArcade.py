"""Check every shipped coastal/arcade frame against its runtime dimensions.

This catches empty/wrongly packed frames, including VFX that intentionally use
soft transparency. Visual review is still needed for direction and anatomy.
"""

from pathlib import Path
from PIL import Image, ImageFilter
from SpriteCutout import components
import json

ROOT = Path(__file__).resolve().parents[1]
frames = 0
for filename in ["GameArt.json", "CoastArt.json"]:
    for name, sheet in json.loads((ROOT / "src/world" / filename).read_text()).items():
        path = ROOT / ("public" + sheet["src"])
        image = Image.open(path).convert("RGBA")
        if not sheet.get("cw"):
            continue
        cw, ch, columns, rows = (
            sheet["cw"],
            sheet["ch"],
            sheet["columns"],
            sheet["rows"],
        )
        assert image.size == (cw * columns, ch * rows), (name, "dimensions", image.size)
        for row in range(rows):
            for col in range(columns):
                frame = image.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
                box = frame.getbbox()
                assert box, (name, row, col, "empty frame")
                assert box[0] > 0 and box[1] > 0 and box[2] < cw and box[3] < ch, (
                    name,
                    row,
                    col,
                    "clipped edge",
                    box,
                )
                if name == "beach-kite":
                    # Detached pieces of the next dragon used to pass the edge/nonempty
                    # checks. A real separated toe stays close to this frame's main body.
                    islands = components(frame)
                    body = max(islands, key=lambda c: len(c[0]))
                    mask = bytearray(cw * ch)
                    for p in body[0]:
                        mask[p] = 255
                    nearby = (
                        Image.frombytes("L", (cw, ch), bytes(mask))
                        .filter(ImageFilter.MaxFilter(9))
                        .tobytes()
                    )
                    for pixels, bounds in islands:
                        assert len(pixels) <= 3 or any(nearby[p] for p in pixels), (
                            name,
                            row,
                            col,
                            "detached frame debris",
                            bounds,
                        )
                frames += 1
print("Verified", frames, "coast and arcade frames")
