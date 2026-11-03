"""Pack native coast drawings into consistent, bounded game atlases.

Sources/prompts are retained in docs/source-assets/coast. This importer keeps
whole artwork intact, aligns flight bodies and shares one scale per animation.
Run python3 scripts/ImportCoast.py [/path/to/new-jobs.json].
"""

from pathlib import Path
from PIL import Image, ImageOps
import json, hashlib, shutil, statistics, sys
from ImportSprites import extract
from SpriteCutout import clean_cutout, extract_figures

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/source-assets/coast"
OUT = ROOT / "public/world/coast"
SOURCE.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
JOBS = {
    "Birds": (2, 8),
    "Mockingjays": (2, 4),
    "Mallards": (4, 4),
    "TealDucks": (4, 4),
    "Surfboard": (4, 4),
    "Sandcastle": (2, 4),
    "DuckFlight": (1, 8),
    "SurfWake": (1, 8),
    "DragonKite": (4, 8),
    "Geese": (8, 4),
    "TrainerStool": (1, 1),
    "WindStatue": (1, 1),
    "SeahorseRide": (1, 1),
}
manifest = {}


def save(asset, canvas, **metadata):
    path = OUT / (asset + ".png")
    canvas.save(path, optimize=True)
    manifest[asset] = dict(
        src="/world/coast/" + path.name,
        revision=hashlib.sha256(path.read_bytes()).hexdigest()[:12],
        detailVersion=1,
        detailScale=1,
        native=True,
        smooth=True,
        **({"pixelArt": True} | metadata)
    )


def flight(asset, cells):
    # Allocate headroom from the most extended wing pose. A fixed head origin
    # in the old 192px cell could crop a gull's wing above the top edge.
    anchors = []
    for cell in cells:
        alpha = cell.getchannel("A")
        ys = [
            y
            for y in range(cell.height)
            for x in range(round(cell.width * 0.87), cell.width)
            if alpha.getpixel((x, y)) > 160
        ]
        anchors.append(statistics.median(ys) if ys else cell.height / 2)
    ratio = min(
        224 / max(c.width for c in cells),
        116 / max(anchors),
        116 / max(c.height - a for c, a in zip(cells, anchors)),
    )
    cw = ch = 256
    canvas = Image.new("RGBA", (cw * 8, ch))
    for col, (cell, anchor) in enumerate(zip(cells, anchors)):
        small = cell.resize(
            (round(cell.width * ratio), round(cell.height * ratio)),
            Image.Resampling.LANCZOS,
        )
        canvas.alpha_composite(
            small,
            (col * cw + round((cw - small.width) / 2), round(128 - anchor * ratio)),
        )
    save(
        asset,
        canvas,
        cw=cw,
        ch=ch,
        columns=8,
        rows=1,
        cycleFrames=8,
        idleFrame=0,
        bodyHeight=128,
        footY=176,
        frameMs=100,
        mirrorWest=True,
    )


jobs = (
    json.loads(Path(sys.argv[1]).read_text())
    if len(sys.argv) > 1
    else json.loads((SOURCE / "Artwork.json").read_text())
)
for job in jobs:
    source = SOURCE / (job["name"] + ".png")
    incoming = Path(job["path"])
    if not incoming.is_absolute():
        incoming = ROOT / incoming
    if incoming.resolve() != source.resolve():
        shutil.copy2(incoming, source)
    rows, cols = JOBS[job["name"]]
    # Kite tails cross the inferred grid. Extract complete silhouettes before
    # ordering the animation, so no neighboring head/tail enters a frame.
    cells, boxes = (
        extract_figures(Image.open(source), rows, cols)
        if job["name"] in ["DragonKite", "Mockingjays"]
        else extract(source, rows, cols)
    )
    job["path"] = str(source.relative_to(ROOT))
    job["sourceBoxes"] = boxes
    if job["name"] in ["TrainerStool", "WindStatue", "SeahorseRide"]:
        cell = cells[0]
        cell.thumbnail((480, 480), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (512, 512))
        canvas.alpha_composite(cell, ((512 - cell.width) // 2, 496 - cell.height))
        save(
            {
                "TrainerStool": "trainer-stool",
                "WindStatue": "town-wind-statue",
                "SeahorseRide": "seahorse-rocker",
            }[job["name"]],
            canvas,
            cw=512,
            ch=512,
            rows=1,
            columns=1,
            idleFrame=0,
            bodyHeight=480,
            footY=496,
        )
        continue
    if job["name"] == "Geese":
        cells = [clean_cutout(c) for c in cells]
        ratio = 116 / max(max(c.width, c.height) for c in cells)
        for family, asset in enumerate(["goose-white", "goose-canada"]):
            canvas = Image.new("RGBA", (128 * 4, 128 * 4))
            for index, cell in enumerate(cells[family * 16 : family * 16 + 16]):
                small = cell.resize(
                    (round(cell.width * ratio), round(cell.height * ratio)),
                    Image.Resampling.LANCZOS,
                )
                canvas.alpha_composite(
                    small,
                    (
                        (index % 4) * 128 + (128 - small.width) // 2,
                        (index // 4) * 128 + 123 - small.height,
                    ),
                )
            save(
                asset,
                canvas,
                cw=128,
                ch=128,
                rows=4,
                columns=4,
                cycleFrames=4,
                idleFrame=0,
                bodyHeight=108,
                footY=123,
                layout="four",
                frameMs=180,
            )
        continue
    if job["name"] == "DragonKite":
        # The illustrator reversed the last two left-facing drawings. Correct
        # those complete frames, then mirror the entire left cycle for right.
        # This guarantees all eight poses face the same way without redrawing.
        for col in [6, 7]:
            cells[16 + col] = ImageOps.mirror(cells[16 + col])
        cells[24:32] = [ImageOps.mirror(cell) for cell in cells[16:24]]
        cw = ch = 256
        ratio = 238 / max(max(c.width, c.height) for c in cells)
        canvas = Image.new("RGBA", (cw * 8, ch * 4))
        for index, cell in enumerate(cells):
            small = cell.resize(
                (round(cell.width * ratio), round(cell.height * ratio)),
                Image.Resampling.LANCZOS,
            )
            canvas.alpha_composite(
                small,
                (
                    (index % 8) * cw + (cw - small.width) // 2,
                    (index // 8) * ch + 248 - small.height,
                ),
            )
        save(
            "beach-kite",
            canvas,
            cw=cw,
            ch=ch,
            columns=8,
            rows=4,
            cycleFrames=8,
            idleFrame=0,
            bodyHeight=238,
            footY=248,
            frameMs=105,
            layout="four",
        )
        continue
    if job["name"] == "SurfWake":
        cw, ch = 192, 384
        ratio = min(
            180 / max(c.width for c in cells), 360 / max(c.height for c in cells)
        )
        canvas = Image.new("RGBA", (cw * 8, ch))
        for col, cell in enumerate(cells):
            small = cell.resize(
                (round(cell.width * ratio), round(cell.height * ratio)),
                Image.Resampling.LANCZOS,
            )
            canvas.alpha_composite(
                small, (col * cw + (cw - small.width) // 2, 376 - small.height)
            )
        save(
            "surf-wake",
            canvas,
            cw=cw,
            ch=ch,
            columns=8,
            rows=1,
            cycleFrames=8,
            idleFrame=0,
            bodyHeight=360,
            footY=376,
            frameMs=120,
            pixelArt=False,
        )
        continue
    if job["name"] == "Birds":
        flight("gull-flight", cells[:8])
        flight("swallow-flight", cells[8:])
        continue
    if job["name"] == "Mockingjays":
        flight("mockingjay-flight", cells)
        continue
    if job["name"] == "DuckFlight":
        flight("mallard-flight", cells)
        continue
    if job["name"] == "Sandcastle":
        ratio = 232 / max(c.width for c in cells)
        for index, cell in enumerate(cells):
            small = cell.resize(
                (round(cell.width * ratio), round(cell.height * ratio)),
                Image.Resampling.LANCZOS,
            )
            canvas = Image.new("RGBA", (256, 320))
            canvas.alpha_composite(
                small, ((256 - small.width) // 2, 312 - small.height)
            )
            save(
                "castle-stage-" + str(index),
                canvas,
                cw=256,
                ch=320,
                rows=1,
                columns=1,
                idleFrame=0,
                bodyHeight=260,
                footY=312,
            )
        continue
    cw = ch = 192 if job["name"] == "Surfboard" else 128
    target = 164 if job["name"] == "Surfboard" else 116
    ratio = target / max(max(c.width, c.height) for c in cells)
    canvas = Image.new("RGBA", (cw * cols, ch * rows))
    baselines = []
    for index, cell in enumerate(cells):
        small = cell.resize(
            (round(cell.width * ratio), round(cell.height * ratio)),
            Image.Resampling.LANCZOS,
        )
        canvas.alpha_composite(
            small,
            (
                (index % cols) * cw + (cw - small.width) // 2,
                (index // cols) * ch + ch - 5 - small.height,
            ),
        )
        baselines.append(ch - 5 - small.height / 2)
    asset = {"Surfboard": "surfboard", "Mallards": "mallard", "TealDucks": "teal-duck"}[
        job["name"]
    ]
    save(
        asset,
        canvas,
        cw=cw,
        ch=ch,
        rows=rows,
        columns=cols,
        idleFrame=0,
        bodyHeight=164 if asset == "surfboard" else 100,
        footY=ch - 5,
        layout="four",
        frameMs=150,
        **({"baselines": baselines} if asset == "surfboard" else {})
    )
(SOURCE / "Artwork.json").write_text(json.dumps(jobs, indent=2) + "\n")
(ROOT / "src/world/CoastArt.json").write_text(json.dumps(manifest, indent=2) + "\n")
# The minimap uses the actual deck artwork, with the same small rental hit area.
board = Image.open(OUT / "surfboard.png").crop((0, 0, 192, 192))
board.save(ROOT / "public/world/sprites/surfboard-icon.png")
print("Published", len(manifest), "coast atlases/stages")
