"""Record illustrated rod endpoints so the game draws only the line and bobber.
This inspects alpha/color geometry; it never paints or erases character art.
"""

import json, math
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "src/world/SpriteSheets.json"
sheets = json.loads(path.read_text())
reviews = []
for name, s in sheets.items():
    if s.get("action") != "fish" or s.get("rootAligned"):
        continue
    im = Image.open(ROOT / ("public" + s["src"])).convert("RGBA")
    tips = []
    cw, ch = s["cw"], s["ch"]
    cols = s.get("columns", 4)
    for row in range(s["rows"]):
        for col in range(cols):
            frame = im.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
            px = frame.load()
            anchor = s.get("anchors", [cw / 2] * (cols * s["rows"]))[row * cols + col]
            hand = (anchor, s["footY"] - s["bodyHeight"] * 0.52)
            candidates = []
            for y in range(max(1, int(hand[1] + 10))):
                for x in range(1, cw - 1):
                    r, g, b, a = px[x, y]
                    if not a or r < 45 or r < g * 1.2 or g < b * 1.15:
                        continue
                    nearby = sum(
                        bool(px[xx, yy][3])
                        for xx in range(max(0, x - 2), min(cw, x + 3))
                        for yy in range(max(0, y - 2), min(ch, y + 3))
                    )
                    if nearby <= 14:
                        candidates.append((math.hypot(x - hand[0], y - hand[1]), x, y))
            _, x, y = max(candidates) if candidates else (0, *hand)
            tips.append([x, y])
            if col == 6:
                d = ImageDraw.Draw(frame)
                d.ellipse((x - 3, y - 3, x + 3, y + 3), outline="cyan", width=2)
                reviews.append((name + ":" + str(row), frame))
    s["rodTips"] = tips
    s["illustratedRod"] = True
    s.pop("proceduralRod", None)
path.write_text(json.dumps(sheets, indent=2) + "\n")
out = Image.new("RGB", (800, ((len(reviews) + 3) // 4) * 220), "#365353")
d = ImageDraw.Draw(out)
for i, (name, im) in enumerate(reviews):
    x = i % 4 * 200
    y = i // 4 * 220
    out.paste(im, (x, y), im)
    d.text((x, y + 195), name, fill="white")
if reviews:
    out.save("/tmp/fishing-tip-review.jpg")
print("Recorded illustrated rod endpoints for", len(reviews), "direction rows.")
