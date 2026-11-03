"""Pack complete orc running and defeat drawings with a shared body scale.

Read each column separately so a falling figure never clips its neighbor's
helmet. The game overlays one flying arrow; no duplicate arrows are painted
into these non-graphic defeat poses. Other arcade art stays in ImportArcade.
"""

from pathlib import Path
from PIL import Image
import json, hashlib

ROOT = Path(__file__).resolve().parents[1]


def whole_figures(path):
    # Rows overlap vertically in the drawing, but each orc is a separate
    # connected silhouette. Cutting a fixed grid would steal another orc's
    # feet/helmet. Isolate connected alpha first, then order the 32 drawings.
    image = Image.open(path).convert("RGBA")
    w, h = image.size
    mask = bytearray(
        image.getchannel("A").point(lambda a: 255 if a >= 160 else 0).tobytes()
    )
    found = []
    for start, value in enumerate(mask):
        if not value:
            continue
        mask[start] = 0
        todo = [start]
        pixels = []
        left = right = start % w
        top = bottom = start // w
        while todo:
            p = todo.pop()
            x = p % w
            y = p // w
            pixels.append(p)
            left = min(left, x)
            right = max(right, x)
            top = min(top, y)
            bottom = max(bottom, y)
            for q in [p - w, p + w, p - 1 if x else -1, p + 1 if x < w - 1 else -1]:
                if 0 <= q < w * h and mask[q]:
                    mask[q] = 0
                    todo.append(q)
        if len(pixels) <= 300:
            continue
        figure = image.crop((left, top, right + 1, bottom + 1))
        alpha = bytearray(figure.width * figure.height)
        for p in pixels:
            alpha[(p // w - top) * figure.width + p % w - left] = 255
        figure.putalpha(Image.frombytes("L", figure.size, bytes(alpha)))
        found.append((left, top, figure))
    assert len(found) == 32, ("Expected 32 complete orcs", len(found))
    ordered = sorted(found, key=lambda item: item[1])
    cells = []
    for row in range(4):
        cells.extend(
            item[2]
            for item in sorted(ordered[row * 8 : row * 8 + 8], key=lambda item: item[0])
        )
    return cells


cells = whole_figures(ROOT / "docs/source-assets/games/Orcs.png")
output = ROOT / "public/world/games"
output.mkdir(exist_ok=True)
published = ROOT / "src/world/GameArt.json"
manifest = json.loads(published.read_text()) if published.exists() else {}
for row, name in enumerate(
    ["orc-scout", "orc-guard", "orc-scout-hit", "orc-guard-hit"]
):
    owner = row % 2
    standing = cells[owner * 8 : owner * 8 + 8]
    poses = cells[row * 8 : row * 8 + 8]
    ratio = min(
        180 / max(p.height for p in standing), 300 / max(p.width for p in poses)
    )
    canvas = Image.new("RGBA", (320 * 8, 224))
    for col, pose in enumerate(poses):
        p = pose.resize(
            (round(pose.width * ratio), round(pose.height * ratio)),
            Image.Resampling.LANCZOS,
        )
        # Suppress isolated transparent-edge noise after downsampling. The
        # actual costume colors and complete illustrated limbs stay intact.
        alpha = p.getchannel("A").point(lambda a: 255 if a >= 140 else 0)
        p = (
            p.convert("RGB")
            .quantize(colors=256, dither=Image.Dither.NONE)
            .convert("RGBA")
        )
        p.putalpha(alpha)
        canvas.alpha_composite(p, (col * 320 + (320 - p.width) // 2, 216 - p.height))
    path = output / (name + ".png")
    canvas.save(path, optimize=True)
    manifest[name] = dict(
        src="/world/games/" + path.name,
        cw=320,
        ch=224,
        rows=1,
        columns=8,
        cycleFrames=8,
        idleFrame=0,
        bodyHeight=180,
        footY=216,
        frameMs=90 if row >= 2 else 110,
        smooth=True,
        revision=hashlib.sha256(path.read_bytes()).hexdigest()[:12],
    )
published.write_text(json.dumps(manifest, indent=2) + "\n")
print("Published clean running and defeat drawings for both orcs")
