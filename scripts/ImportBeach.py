"""Pack beach artwork shared by the world, journal and Field Guide.

Approved sources and prompts stay in docs/source-assets/beach; the served images
are small 128px cells. Rebuild with `python3 scripts/ImportBeach.py`, or pass a
JSON list of new source jobs (name, path, rows, columns and prompt).
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib
import json
import shutil
import sys
from ImportSprites import extract

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/source-assets/beach"
OUT = ROOT / "public/world/beach"
PROP_IDS = [
    "beach-sand-mound", "beach-sand-half", "beach-sandcastle",
    "beach-kite", "beach-spool", "beach-bucket",
]


def clean_shell(cell):
    """Keep the main shell, removing tiny isolated tips from adjacent grid cells."""
    alpha = cell.getchannel("A")
    remaining = {
        (x, y) for y in range(cell.height) for x in range(cell.width)
        if alpha.getpixel((x, y)) >= 160
    }
    components = []
    while remaining:
        point = remaining.pop()
        pending, component = [point], [point]
        while pending:
            x, y = pending.pop()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1),
                           (1, 1), (-1, 1), (1, -1), (-1, -1)):
                neighbor = (x + dx, y + dy)
                if neighbor in remaining:
                    remaining.remove(neighbor)
                    pending.append(neighbor)
                    component.append(neighbor)
        components.append(component)
    mask = Image.new("L", cell.size)
    for point in max(components, key=len):
        mask.putpixel(point, 255)
    cell.putalpha(mask)
    return cell.crop(cell.getbbox())


def publish(asset, cell):
    if asset in {"beach-kite","beach-spool","beach-sand-mound","beach-sand-half","beach-sandcastle"}: return None # Replaced by the animated coast artwork.
    if asset.startswith("shell-"):
        cell = clean_shell(cell)
    cell.thumbnail((120, 120), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (128, 128))
    canvas.alpha_composite(cell, ((128 - cell.width) // 2, 124 - cell.height))
    target = OUT / (asset + ".png")
    canvas.save(target, optimize=True)
    return {
        "src": "/world/beach/" + target.name,
        "cw": 128, "ch": 128, "columns": 1, "rows": 1, "idleFrame": 0,
        "bodyHeight": 120, "footY": 124, "detailVersion": 1, "detailScale": 1,
        "pixelArt": True, "smooth": True,
        "revision": hashlib.sha256(target.read_bytes()).hexdigest()[:12],
    }


def preview(manifest):
    image = Image.new("RGB", (1400, 1280), "#173d3b")
    labels = ImageDraw.Draw(image)
    for index, (asset, entry) in enumerate(manifest.items()):
        tile = Image.open(ROOT / "public" / entry["src"].lstrip("/"))
        x, y = (index % 10) * 140, (index // 10) * 160
        image.paste(tile, (x + 6, y), tile)
        labels.text((x + 4, y + 130), asset, fill="#edf2d0")
    image.save(ROOT / "docs/BeachArtwork.png")


def main(jobs_path):
    SOURCE.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = json.loads(jobs_path.read_text())
    manifest = {}
    for job in jobs:
        source = SOURCE / (job["name"] + ".png")
        incoming = Path(job["path"])
        if not incoming.is_absolute():
            incoming = ROOT / incoming
        if incoming.resolve() != source.resolve():
            shutil.copy2(incoming, source)
        cells, boxes = extract(source, rows=job["rows"], columns=job["columns"])
        expected = job["rows"] * job["columns"]
        assert len(cells) == expected
        if job["name"] == "Floats":
            ids = [f"glass-float-{i + 1}" for i in range(expected)]
        elif job["name"] == "Shells":
            ids = [f"shell-{i + 1}" for i in range(expected)]
        else:
            ids = PROP_IDS
        assert len(ids) == expected
        for asset, cell in zip(ids, cells):
            entry = publish(asset, cell)
            if entry: manifest[asset] = entry
        job["path"] = str(source.relative_to(ROOT))
        job["sourceBoxes"] = boxes
    (SOURCE / "Artwork.json").write_text(json.dumps(jobs, indent=2) + "\n")
    (ROOT / "src/world/BeachArt.json").write_text(json.dumps(manifest, indent=2) + "\n")
    preview(manifest)
    print("Published", len(manifest), "beach sprites")


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else SOURCE / "Artwork.json")
