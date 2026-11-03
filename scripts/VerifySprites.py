"""Audit published PNGs after an artwork import.

Checks real dimensions, nonempty frames, clean alpha, bounded palettes, clear
margins and genuinely different drawn poses. It cannot judge anatomy or artistic
quality; review the animation sheets in the workshop as well as running this.
"""

from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sheets = json.loads((ROOT / "src/world/SpriteSheets.json").read_text())
people = json.loads((ROOT / "docs/source-assets/People.json").read_text())
looks = [
    entry["asset"]
    for entry in json.loads((ROOT / "src/world/Appearances.json").read_text())
]
frames = 0
for name, sheet in sheets.items():
    cw, ch = sheet["cw"], sheet["ch"]
    columns, rows = sheet.get("columns", 4), sheet["rows"]
    image = Image.open(ROOT / ("public" + sheet["src"])).convert("RGBA")
    assert image.size == (cw * columns, ch * rows), (name, "incorrect atlas dimensions")
    assert set(image.getchannel("A").getdata()) <= {0, 255}, (name, "noisy alpha")
    colors = {pixel[:3] for pixel in image.getdata() if pixel[3]}
    assert len(colors) <= sheet.get("colors", 28), (
        name,
        "palette exceeds declared size",
        len(colors),
    )
    if rows == 4:
        assert sheet["layout"] == "four", (name, "four-direction art mapped as eight")
    if sheet.get("rootAligned"):
        assert columns == sheet["cycleFrames"] + 1, (
            name,
            "missing separate idle frame",
        )
        assert sheet["idleFrame"] == sheet["cycleFrames"], (
            name,
            "idle overlaps moving cycle",
        )
        assert len(sheet["anchors"]) == rows * columns, (
            name,
            "missing per-frame origins",
        )
    for row in range(rows):
        poses = set()
        for column in range(columns):
            cell = image.crop(
                (column * cw, row * ch, (column + 1) * cw, (row + 1) * ch)
            )
            box = cell.getbbox()
            assert box, (name, row, column, "empty frame")
            assert 0 < box[0] < box[2] < cw and 0 < box[1] < box[3] < ch, (
                name,
                row,
                column,
                "cropped figure",
                box,
            )
            if not sheet.get("rootAligned"):
                assert abs(box[3] - sheet["footY"]) <= 2, (
                    name,
                    row,
                    column,
                    "unaligned legacy baseline",
                )
            if column < sheet.get("cycleFrames", columns):
                poses.add(cell.crop(box).tobytes())
            frames += 1
        if (
            name in looks
            or name.removesuffix("-run") in looks
            and name.endswith("-run")
        ):
            assert len(poses) >= 10, (name, row, "too few distinct drawn stride poses")
    if sheet["action"] == "run":
        assert rows == 8, (name, "missing run directions")
        base = sheets[name.removesuffix("-run")]
        assert (ROOT / ("public" + base["src"])).read_bytes() != (
            ROOT / ("public" + sheet["src"])
        ).read_bytes(), (name, "run copied from walk")

for look in looks:
    for suffix in ["", "-run"]:
        sheet = sheets[look + suffix]
        assert (
            sheet.get("drawn") and sheet["cycleFrames"] == 16 and sheet["rows"] == 8
        ), (look + suffix, "incomplete complete-body redraw")
        assert (sheet["cw"], sheet["ch"], sheet["bodyHeight"], sheet["footY"]) == (
            128,
            144,
            96,
            128,
        ), (look, "inconsistent character origin/scale")
    for action in [
        "board-ride",
        "board-trick",
        "wake-ride",
        "water-ride",
        "bike-acro",
        "bike-mach",
        "surf",
        "fish",
        "fish-surf",
    ]:
        assert look + "-" + action in sheets, (
            look,
            "missing same-costume activity",
            action,
        )
        assert sheets[look + "-" + action].get("drawn"), (
            look,
            action,
            "old component animation remains",
        )

assert len(sheets["masyn-wave"]["sequence"]) == 12, "missing greeting frames"
pending = [name for name, source in people.items() if source.get("type") == "parts"]
assert not pending, ("retired component-source records remain", pending)
print("Verified", len(sheets), "atlases and", frames, "nonempty transparent frames.")
print(
    "All",
    len(looks),
    "appearances have complete 16-pose, eight-direction walk/run drawings.",
)
print("All family/costume activity atlases use complete-body drawings.")
