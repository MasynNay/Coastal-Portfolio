"""Pack native salute drawings, preserving hands and a common foot/body scale."""

from pathlib import Path
from PIL import Image, ImageOps
import json, hashlib
from SpriteCutout import extract_figures

ROOT = Path(__file__).resolve().parents[1]
CW, CH, FOOT = 192, 160, 144
sheets_path = ROOT / "src/world/SpriteSheets.json"
sheets = json.loads(sheets_path.read_text())
catalog_path = ROOT / "docs/source-assets/People.json"
catalog = json.loads(catalog_path.read_text())
report = []
for job in json.loads((ROOT / "docs/source-assets/people/Salutes.json").read_text()):
    asset = job["asset"]
    cells, boxes = extract_figures(Image.open(ROOT / job["source"]), 2, 4)
    # Source sheets occasionally switch arms between lifting and holding. The
    # visually audited frame list keeps the LEFT hand (viewer right) throughout.
    # Feet are not a reliable handedness detector: the previous heuristic missed
    # centered stances and even reversed a correctly drawn held pose. Mirror the
    # complete figure during packing, never layer a second hand over its body.
    flipped = job["mirrorFrames"]
    for index in flipped:
        cells[index] = ImageOps.mirror(cells[index])
    ratio = min(
        96 / cells[7].height,
        (FOOT - 5) / max(c.height for c in cells),
        (CW - 12) / max(c.width for c in cells),
    )
    atlas = Image.new("RGBA", (CW * 8, CH))
    for index, cell in enumerate(cells):
        small = cell.resize(
            (round(cell.width * ratio), round(cell.height * ratio)),
            Image.Resampling.LANCZOS,
        )
        feet = (
            small.getchannel("A")
            .crop((0, small.height - 4, small.width, small.height))
            .getbbox()
        )
        anchor = (feet[0] + feet[2]) / 2
        x = round((index * CW) + CW / 2 - anchor)
        y = FOOT - small.height
        assert y > 0 and x > index * CW and x + small.width < (index + 1) * CW, (
            asset,
            index,
            "clipped salute",
        )
        atlas.alpha_composite(small, (x, y))
    alpha = atlas.getchannel("A").point(lambda a: 255 if a >= 150 else 0)
    atlas = (
        atlas.convert("RGB")
        .quantize(colors=256, dither=Image.Dither.NONE)
        .convert("RGBA")
    )
    atlas.putalpha(alpha)
    # Where the held hand clears the hair, its top silhouette must be on the
    # viewer's right in BOTH holds. Fitzgerald's spikes and Ezra's spider hair
    # reach the glove height, so those two are checked in the full-frame audit.
    for index in [] if asset in ["fitzgerald", "costume-ezra-spider"] else [4, 5]:
        pose = atlas.crop((index * CW, 0, (index + 1) * CW, CH)).getchannel("A")
        top = pose.getbbox()[1]
        hand = pose.crop((0, top, CW, top + 4)).getbbox()
        assert hand[0] > CW / 2, (asset, index, "salute switches hands")
    path = ROOT / "public/world/sprites/emerald" / (asset + "-salute.png")
    atlas.save(path, optimize=True)
    sheets[asset + "-salute"] = dict(
        id=asset + "-salute",
        src="/world/sprites/emerald/" + path.name,
        cw=CW,
        ch=CH,
        rows=1,
        columns=8,
        cycleFrames=8,
        idleFrame=7,
        bodyHeight=96,
        footY=FOOT,
        drawn=True,
        action="salute",
        pixelArt=True,
        smooth=True,
        colors=256,
        detailVersion=4,
        detailScale=96 / 36,
        frameMs=375,
        opaqueBody=True,
        saluteHand="left",
        revision=hashlib.sha256(path.read_bytes()).hexdigest()[:12],
    )
    sheets[asset + "-salute"]["labelTop"] = min(
        atlas.crop((i * CW, 0, (i + 1) * CW, CH)).getbbox()[1] for i in range(8)
    )
    catalog[asset + "-salute"] = dict(
        type="drawn", file="people/" + asset + "/salute.png", action="salute"
    )
    # Mounted salutes keep the original legs/vehicle. These frame bounds let the
    # renderer align a native raised-arm torso to the existing rider's head.
    for action in [
        "surf",
        "water-ride",
        "board-ride",
        "board-trick",
        "wake-ride",
        "bike-acro",
        "bike-mach",
    ]:
        sheet = sheets[asset + "-" + action]
        image = Image.open(ROOT / ("public" + sheet["src"])).convert("RGBA")
        cw, ch = sheet["cw"], sheet["ch"]
        sheet["headTops"] = [
            image.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
            .getchannel("A")
            .getbbox()[1]
            for row in range(sheet["rows"])
            for col in range(sheet["columns"])
        ]
    report.append(dict(asset=asset, sourceBoxes=boxes, mirroredFrames=flipped))
    print("Packed salute:", asset, flush=True)
sheets_path.write_text(json.dumps(sheets, indent=2) + "\n")
catalog_path.write_text(json.dumps(catalog, indent=2) + "\n")
(ROOT / "docs/source-assets/people/SaluteFrames.json").write_text(
    json.dumps(report, indent=2) + "\n"
)
