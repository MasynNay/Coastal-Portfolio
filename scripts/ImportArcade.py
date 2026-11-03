"""Publish the arcade backgrounds, power icons and obstacle illustrations.

Full-size artwork/prompt records remain in docs; the served game uses small
WebP backgrounds and transparent sprites. Run after updating those sources.
"""

from pathlib import Path
from PIL import Image
import json, hashlib
from ImportSprites import extract

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/source-assets/games"
OUT = ROOT / "public/world/games"
manifest_path = ROOT / "src/world/GameArt.json"
manifest = json.loads(manifest_path.read_text())


def save(name, image):
    path = OUT / (name + ".png")
    image.save(path, optimize=True)
    manifest[name] = dict(
        src="/world/games/" + path.name,
        width=image.width,
        height=image.height,
        smooth=True,
        revision=hashlib.sha256(path.read_bytes()).hexdigest()[:12],
    )


for name, file in [
    ("runner-temple", "RunnerSky.png"),
    ("windfall-chart", "WindWakerBoard.png"),
    ("runner-floor", "RunnerFloor.png"),
    ("orc-moria", "OrcMoria.png"),
]:
    image = Image.open(SOURCE / file).convert("RGB")
    image.thumbnail((960, 1280), Image.Resampling.LANCZOS)
    path = OUT / (name + ".webp")
    image.save(path, quality=88)
    manifest[name] = dict(
        src="/world/games/" + path.name,
        width=image.width,
        height=image.height,
        smooth=True,
        revision=hashlib.sha256(path.read_bytes()).hexdigest()[:12],
    )
cells, _ = extract(SOURCE / "RunnerItems.png", 2, 4)
for name, image in zip(
    ["air", "water", "fire", "earth", "crate", "rail", "arch", "spark"], cells
):
    image.thumbnail((240, 240), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (256, 256))
    canvas.alpha_composite(image, ((256 - image.width) // 2, 248 - image.height))
    save("runner-" + name, canvas)
cells, _ = extract(SOURCE / "MatchPowers.png", 1, 4)
for name, image in zip(["rocket-bomb", "rainbow-ball"], cells[:2]):
    image.thumbnail((140, 140), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (144, 144))
    canvas.alpha_composite(image, ((144 - image.width) // 2, (144 - image.height) // 2))
    save(name, canvas)
if (SOURCE / "WaterBending.png").exists():
    cells, _ = extract(SOURCE / "WaterBending.png", 1, 8)
    ratio = min(176 / max(c.width for c in cells), 240 / max(c.height for c in cells))
    canvas = Image.new("RGBA", (192 * 8, 256))
    for col, cell in enumerate(cells):
        small = cell.resize(
            (round(cell.width * ratio), round(cell.height * ratio)),
            Image.Resampling.LANCZOS,
        )
        canvas.alpha_composite(
            small, (col * 192 + (192 - small.width) // 2, 248 - small.height)
        )
    save("runner-water-aura", canvas)
    manifest["runner-water-aura"].update(
        cw=192,
        ch=256,
        columns=8,
        rows=1,
        cycleFrames=8,
        idleFrame=0,
        footY=248,
        bodyHeight=240,
        frameMs=105,
    )
if (SOURCE / "RocketBlast.png").exists():
    # This drawing has unevenly spaced puffs. Use reviewed gutter coordinates;
    # equal-width cuts would split the largest blast and merge the two small ones.
    records = json.loads((SOURCE / "ArcadeArtwork.json").read_text())
    columns = next(j["sourceColumns"] for j in records if j["name"] == "RocketBlast")
    image = Image.open(SOURCE / "RocketBlast.png").convert("RGBA")
    image.putalpha(image.getchannel("A").point(lambda a: 255 if a >= 160 else 0))
    cells = []
    for left, right in zip(columns, columns[1:]):
        cell = image.crop((left, 0, right, image.height))
        cells.append(cell.crop(cell.getbbox()))
    ratio = min(244 / max(c.width for c in cells), 244 / max(c.height for c in cells))
    canvas = Image.new("RGBA", (256 * 8, 256))
    for col, cell in enumerate(cells):
        small = cell.resize(
            (round(cell.width * ratio), round(cell.height * ratio)),
            Image.Resampling.LANCZOS,
        )
        canvas.alpha_composite(
            small, (col * 256 + (256 - small.width) // 2, (256 - small.height) // 2)
        )
    save("rocket-explosion", canvas)
    manifest["rocket-explosion"].update(
        cw=256,
        ch=256,
        columns=8,
        rows=1,
        cycleFrames=8,
        idleFrame=0,
        footY=250,
        bodyHeight=244,
        frameMs=110,
    )
if (SOURCE / "Arrow.png").exists():
    image = Image.open(SOURCE / "Arrow.png").convert("RGBA")
    image = image.crop(image.getbbox())
    image.thumbnail((512, 100), Image.Resampling.LANCZOS)
    save("arrow", image)
for old in [
    "runner-stone",
    "runner-spark",
    "lightning-badge",
    "ball-burst",
    "orc-woodland",
]:
    manifest.pop(old, None)
    (OUT / (old + ".png")).unlink(missing_ok=True)
    (OUT / (old + ".webp")).unlink(missing_ok=True)
manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
print("Published temple runner and matching-game artwork")
