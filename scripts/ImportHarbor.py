"""Pack the empty boat and jet-ski in all eight headings.

Input: the built-in image tool result records (key, path, prompt) as JSON.
Riders are separate complete drawings published by BuildActivities.py.
"""

import json
from pathlib import Path
import shutil
import sys
from PIL import Image, ImageOps
import ImportSprites as sprites

ROOT = sprites.ROOT
SOURCE = ROOT / "docs/source-assets/harbor"


def main(results):
    SOURCE.mkdir(parents=True, exist_ok=True)
    jobs = json.loads(Path(results).read_text())
    for job in jobs:
        shutil.copyfile(job["path"], SOURCE / (job["key"] + ".png"))
        job.pop("path")
    (SOURCE / "Prompts.json").write_text(json.dumps(jobs, indent=2) + "\n")
    directions_file = ROOT / "docs/source-assets/DirectionRows.json"
    directions = json.loads(directions_file.read_text())
    for key, name in [("Boat", "harbor-boat"), ("JetSki", "harbor-jetski")]:
        # Visually checked: the jet-ski source starts at its stern (north),
        # so its written source labels must not be used as the game headings.
        rows = (
            [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [3, 1], [2, 1], [1, 1]]
            if key == "Boat"
            else [[4, 0], [5, 0], [6, 0], [7, 0], [0, 0], [7, 1], [6, 1], [5, 1]]
        )
        poses, _ = sprites.extract(SOURCE / (key + ".png"), 8, 4)
        selected = [
            ImageOps.mirror(poses[r * 4 + c]) if flip else poses[r * 4 + c]
            for r, flip in rows
            for c in range(4)
        ]
        cw, ch, foot = 224, 224, 216
        scale = min(
            192 / max(p.width for p in selected), 192 / max(p.height for p in selected)
        )
        out = Image.new("RGBA", (cw * 4, ch * 8))
        for i, p in enumerate(selected):
            p = p.resize(
                (max(1, round(p.width * scale)), max(1, round(p.height * scale))),
                Image.Resampling.LANCZOS,
            )
            p.putalpha(p.getchannel("A").point(lambda a: 255 if a >= 160 else 0))
            p = p.crop(p.getbbox())
            out.alpha_composite(
                p, (i % 4 * cw + (cw - p.width) // 2, i // 4 * ch + foot - p.height)
            )
        alpha = out.getchannel("A")
        out = (
            out.convert("RGB")
            .quantize(colors=128, dither=Image.Dither.NONE)
            .convert("RGBA")
        )
        out.putalpha(alpha)
        path = "/world/sprites/emerald/" + name + ".png"
        out.save(ROOT / ("public" + path), optimize=True)
        sprites.manifest[name] = dict(
            id=name,
            src=path,
            cw=cw,
            ch=ch,
            rows=8,
            columns=4,
            footY=foot,
            bodyHeight=160,
            action="vehicle",
            frameMs=140,
            pixelArt=True,
            smooth=True,
            colors=128,
            layout="eight",
            canonicalDirections=True,
        )
        directions[name] = rows
    directions_file.write_text(json.dumps(directions, indent=2) + "\n")
    sprites.manifest_path.write_text(json.dumps(sprites.manifest, indent=2) + "\n")
    print("Packed two eight-direction watercraft.")


if __name__ == "__main__":
    main(sys.argv[1])
