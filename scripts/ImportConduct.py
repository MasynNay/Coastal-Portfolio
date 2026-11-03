"""Pack complete conducting drawings with an attached, illustrated baton.

One common body scale per appearance, aligned feet and generous arm/baton
headroom. This action does not reuse a skating pose or a separate wand layer.
"""

from pathlib import Path
from PIL import Image
import json, hashlib, statistics
from ImportSprites import extract

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "docs/source-assets/people"
CW, CH, FOOT = 192, 160, 144


def body_top(figure):
    alpha = figure.getchannel("A")
    mass = [
        sum(alpha.crop((0, y, figure.width, y + 1)).getdata()) / 255
        for y in range(figure.height)
    ]
    threshold = max(mass) * 0.3
    return next(
        (y for y in range(len(mass) - 2) if min(mass[y : y + 3]) > threshold), 0
    )


def publish():
    metadata = ROOT / "src/world/SpriteSheets.json"
    sheets = json.loads(metadata.read_text())
    catalog_path = ROOT / "docs/source-assets/People.json"
    catalog = json.loads(catalog_path.read_text())
    for look in json.loads((ROOT / "src/world/Appearances.json").read_text()):
        name = look["asset"]
        source = SOURCES / name / "conduct.png"
        cells, boxes = extract(source, 3, 4)
        assert len(cells) == 12, (name, "missing conducting drawings")
        bodies = [c.height - body_top(c) for c in cells]
        scale = (
            look.get("artHeight", 96) + (5 if name == "costume-contact" else 0)
        ) / statistics.median(bodies)
        scale = min(
            scale,
            (CW - 12) / max(c.width for c in cells),
            (FOOT - 5) / max(c.height for c in cells),
        )
        atlas = Image.new("RGBA", (CW * 12, CH))
        for index, cell in enumerate(cells):
            small = cell.resize(
                (round(cell.width * scale), round(cell.height * scale)),
                Image.Resampling.LANCZOS,
            )
            bounds = small.getbbox()
            feet = small.crop(
                (0, max(0, bounds[3] - 8), small.width, bounds[3])
            ).getbbox()
            anchor = (feet[0] + feet[2]) / 2
            x = round(CW / 2 - anchor)
            y = FOOT - small.height
            assert 0 < x and x + small.width < CW and y > 0, (
                name,
                index,
                "incomplete figure",
            )
            atlas.alpha_composite(small, (index * CW + x, y))
        alpha = atlas.getchannel("A").point(lambda a: 255 if a >= 150 else 0)
        atlas = (
            atlas.convert("RGB")
            .quantize(colors=256, dither=Image.Dither.NONE)
            .convert("RGBA")
        )
        atlas.putalpha(alpha)
        output = ROOT / "public/world/sprites/emerald" / (name + "-conduct.png")
        atlas.save(output, optimize=True)
        sheets[name + "-conduct"] = dict(
            id=name + "-conduct",
            src="/world/sprites/emerald/" + output.name,
            cw=CW,
            ch=CH,
            rows=1,
            columns=12,
            cycleFrames=12,
            idleFrame=11,
            bodyHeight=96,
            footY=FOOT,
            drawn=True,
            action="conduct",
            pixelArt=True,
            smooth=True,
            colors=256,
            detailVersion=4,
            detailScale=96 / 36,
            frameMs=350,
            opaqueBody=True,
            revision=hashlib.sha256(output.read_bytes()).hexdigest()[:12],
        )
        catalog[name + "-conduct"] = dict(
            type="drawn", file="people/" + name + "/conduct.png", action="conduct"
        )
        print("Packed twelve conducting poses:", name, flush=True)
    for sheet in sheets.values():
        sheet.pop("rightHands", None)
    metadata.write_text(json.dumps(sheets, indent=2) + "\n")
    catalog_path.write_text(json.dumps(catalog, indent=2) + "\n")


if __name__ == "__main__":
    publish()
