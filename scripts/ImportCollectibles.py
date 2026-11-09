"""Pack original collection atlases (10 species x 4 frames) into game-size sprites.
Usage: python3 scripts/ImportCollectibles.py /tmp/collection-art.json
Generated sources and prompts stay under docs/source-assets/collections.
"""

from pathlib import Path
import hashlib
from PIL import Image
import json, sys, shutil, statistics
import ImportSprites as sprites

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/source-assets/collections"
SOURCE.mkdir(parents=True, exist_ok=True)


FINE_SPRITES = set(json.loads((SOURCE / "FineSprites.json").read_text()))


def pack(spec, cells, kind):
    cw, ch = (64, 64) if kind == "spiders" else (64, 48)
    foot = ch - 4
    body = 32 if kind == "spiders" else 25
    asset = spec["art"]
    detail = 2 if asset in FINE_SPRITES else 1
    threshold = 96 if detail == 2 else 180
    cw, ch, foot, body = (value * detail for value in (cw, ch, foot, body))
    ratio = min(
        body / statistics.median(c.height for c in cells),
        (cw - 6 * detail) / max(c.width for c in cells),
        (ch - 6 * detail) / max(c.height for c in cells),
    )
    atlas = Image.new("RGBA", (cw * 4, ch))
    for column, cell in enumerate(cells):
        size = (max(1, round(cell.width * ratio)), max(1, round(cell.height * ratio)))
        small = cell.resize(size, Image.Resampling.LANCZOS)
        # Thin antennae and whiskers break into floating tips at map resolution.
        # Retain their coverage at twice the source resolution for those species.
        small.putalpha(
            small.getchannel("A").point(lambda a: 255 if a >= threshold else 0)
        )
        small = small.crop(small.getbbox())
        atlas.alpha_composite(
            small, (column * cw + (cw - small.width) // 2, foot - small.height)
        )
    alpha = atlas.getchannel("A")
    colors = 64 if detail == 2 else 28
    atlas = (
        atlas.convert("RGB")
        .quantize(colors=colors, dither=Image.Dither.NONE)
        .convert("RGBA")
    )
    atlas.putalpha(alpha)
    target = sprites.OUT / (asset + ".png")
    atlas.save(target, optimize=True)
    sprites.manifest[asset] = dict(
        id=asset,
        src="/world/sprites/emerald/" + asset + ".png",
        cw=cw,
        ch=ch,
        columns=4,
        rows=1,
        bodyHeight=round(statistics.median(c.height for c in cells) * ratio),
        footY=foot,
        pixelArt=True,
        layout="eight",
        action="walk",
        frameMs=170 if kind == "spiders" else 220,
        revision=hashlib.sha256(target.read_bytes()).hexdigest()[:12],
    )
    if detail == 2:
        sprites.manifest[asset].update(native=True, smooth=True, colors=colors)


if __name__ == "__main__":
    jobs = json.loads(Path(sys.argv[1]).read_text())
    catalog_path = Path(jobs.get("catalog", ROOT / "src/world/Collectibles.json"))
    catalog = json.loads(catalog_path.read_text())
    for job in jobs["jobs"]:
        path = Path(jobs["paths"][job["key"]])
        source = SOURCE / (job["key"] + ".png")
        if path.resolve() != source.resolve():
            shutil.copyfile(path, source)
        cells, boxes = sprites.extract(source, 10, row_cuts=job.get("rowCuts"))
        for row, id in enumerate(job["rows"]):
            spec = next(s for s in catalog[job["kind"]] if s["id"] == id)
            pack(spec, cells[row * 4 : row * 4 + 4], job["kind"])
        print("Packed", job["key"], "with", len(cells), "frames")
    sprites.manifest_path.write_text(json.dumps(sprites.manifest, indent=2) + "\n")
    prompt_path = SOURCE / "prompts.json"
    existing = json.loads(prompt_path.read_text()) if prompt_path.exists() else []
    combined = {job["key"]: job for job in existing}
    combined.update({job["key"]: job for job in jobs["jobs"]})
    prompt_path.write_text(json.dumps(list(combined.values()), indent=2) + "\n")
    if "catalog" in jobs:
        (ROOT / "src/world/Collectibles.json").write_text(
            json.dumps(catalog, indent=2) + "\n"
        )
