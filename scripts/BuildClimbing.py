"""Pack the illustrated playground poses without compositing detached limbs.

The three source sheets each contain five looks and six complete figures:
four rear-facing reach/pull poses followed by two front-facing cheers.
Run from the repository root with Python and Pillow installed.
"""

from pathlib import Path
from statistics import median
import hashlib
import json
from PIL import Image
from SpriteCutout import extract_figures

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/source-assets/people/climbing"
WORLD = ROOT / "src/world"
OUTPUT = ROOT / "public/world/sprites/emerald"
GROUPS = {
    "family": ("masyn", "mi-shell", "ezra", "fallyn", "fitzgerald"),
    "masyn-costumes": (
        "costume-airbender", "costume-skills", "costume-portfolio",
        "costume-resume", "costume-contact",
    ),
    "hero-costumes": (
        "link", "costume-ezra-spider", "costume-fallyn-ladybug",
        "costume-fitzgerald-spider", "costume-panem",
    ),
}
WIDTH, HEIGHT, BASELINE = 128, 144, 128


def torso_center(cell):
    """Anchor the torso, not the asymmetric raised hand or knee."""
    band = cell.getchannel("A").crop(
        (0, round(cell.height * 0.46), cell.width, round(cell.height * 0.68))
    )
    values = band.getbbox()
    return (values[0] + values[2]) / 2 if values else cell.width / 2


def pack(cells, target_height):
    # Summit drawings have both feet planted. Measure their median height once
    # and preserve that one scale for every bent knee and raised hand.
    scale = target_height / median(cell.height for cell in cells[4:])
    atlas = Image.new("RGBA", (WIDTH * len(cells), HEIGHT))
    for column, cell in enumerate(cells):
        center = torso_center(cell)
        prepared = cell.resize(
            (round(cell.width * scale), round(cell.height * scale)),
            Image.Resampling.LANCZOS,
        )
        frame = Image.new("RGBA", (WIDTH, HEIGHT))
        left = round(WIDTH / 2 - center * scale)
        top = BASELINE - prepared.height
        assert left >= 0 and left + prepared.width <= WIDTH and top >= 0, (
            "climbing pose would clip", column, prepared.size,
        )
        frame.alpha_composite(prepared, (left, top))
        frame.putalpha(frame.getchannel("A").point(lambda a: 255 if a >= 160 else 0))
        assert frame.getbbox(), ("empty climbing frame", column)
        atlas.alpha_composite(frame, (column * WIDTH, 0))
    return atlas


def main():
    looks = json.loads((WORLD / "Appearances.json").read_text())
    heights = {entry["asset"]: entry.get("artHeight", 96) for entry in looks}
    manifest = {}
    for group, names in GROUPS.items():
        image = Image.open(SOURCE / f"{group}.webp")
        cells, _ = extract_figures(image, len(names), 6)
        for row, name in enumerate(names):
            asset = name + "-climb"
            atlas = pack(cells[row * 6:row * 6 + 6], heights[name])
            path = OUTPUT / f"{asset}.png"
            atlas.save(path, optimize=True)
            revision = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
            manifest[asset] = {
                "id": asset,
                "src": f"/world/sprites/emerald/{asset}.png",
                "cw": WIDTH, "ch": HEIGHT, "rows": 1, "columns": 6,
                "cycleFrames": 4, "idleFrame": 0, "frameMs": 175,
                "bodyHeight": 96, "footY": BASELINE, "drawn": True,
                "action": "climb", "native": True, "pixelArt": True,
                "detailVersion": 1, "detailScale": 1,
                "celebrationFrames": [4, 5], "revision": revision,
            }
    assert set(manifest) == {name + "-climb" for name in heights}
    (WORLD / "ClimbArt.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Packed {len(manifest)} full-body climbing atlases.")


if __name__ == "__main__":
    main()
