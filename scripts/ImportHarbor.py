"""Pack the empty boat and jet-ski in all eight headings.

Input: the built-in image tool result records (key, path, prompt) as JSON.
Riders are separate complete drawings published by BuildActivities.py.
"""

import hashlib
import json
from pathlib import Path
import shutil
import sys
from PIL import Image, ImageOps
import ImportSprites as sprites

ROOT = sprites.ROOT
SOURCE = ROOT / "docs/source-assets/harbor"


# Five drawn views plus exact reflections. Source cells are S, SE, E, NE, N.
RED_LION_ROWS = [
    [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [3, 1], [2, 1], [1, 1],
]


def pack_red_lion():
    sheet = Image.open(SOURCE / "RedLion.png").convert("RGBA")
    w, h = sheet.width // 3, sheet.height // 2
    views = []
    for row, flip in RED_LION_ROWS:
        x, y = row % 3 * w, row // 3 * h
        cell = sheet.crop((x, y, x + w, y + h))
        cell.putalpha(cell.getchannel("A").point(lambda a: 255 if a >= 160 else 0))
        box = cell.getbbox()
        if not box or box[0] == 0 or box[1] == 0 or box[2] == w or box[3] == h:
            raise ValueError(f"Missing or clipped sailboat view in cell {row + 1}")
        pose = cell.crop(box)
        views.append(ImageOps.mirror(pose) if flip else pose)

    size, foot, body = 224, 216, 192
    scale = body / max(max(pose.size) for pose in views)
    atlas = Image.new("RGBA", (size, size * len(views)))
    for row, pose in enumerate(views):
        fit = pose.resize(
            (round(pose.width * scale), round(pose.height * scale)),
            Image.Resampling.LANCZOS,
        )
        fit.putalpha(fit.getchannel("A").point(lambda a: 255 if a >= 160 else 0))
        fit = fit.crop(fit.getbbox())
        atlas.alpha_composite(
            fit, ((size - fit.width) // 2, row * size + foot - fit.height)
        )
    alpha = atlas.getchannel("A")
    atlas = atlas.convert("RGB").quantize(colors=128, dither=Image.Dither.NONE).convert("RGBA")
    atlas.putalpha(alpha)

    path = "/world/sprites/emerald/harbor-boat.png"
    target = ROOT / ("public" + path)
    atlas.save(target, optimize=True)
    sprites.manifest["harbor-boat"] = dict(
        id="harbor-boat",
        src=path,
        cw=size,
        ch=size,
        rows=8,
        columns=1,
        footY=foot,
        bodyHeight=body,
        action="vehicle",
        frameMs=140,
        pixelArt=True,
        smooth=True,
        colors=128,
        layout="eight",
        canonicalDirections=True,
        # The packed rows already follow world headings clockwise from south.
        directions=[[row, 0] for row in range(len(views))],
        revision=hashlib.sha256(target.read_bytes()).hexdigest()[:12],
    )

    side = views[2].copy()
    side.thumbnail((92, 92), Image.Resampling.LANCZOS)
    icon = Image.new("RGBA", (100, 100))
    icon.alpha_composite(side, ((100 - side.width) // 2, (100 - side.height) // 2))
    icon.save(ROOT / "public/world/sprites/wakeboard-icon.png", optimize=True)


def publish_red_lion():
    pack_red_lion()
    directions_file = ROOT / "docs/source-assets/DirectionRows.json"
    directions = json.loads(directions_file.read_text())
    directions["harbor-boat"] = RED_LION_ROWS
    directions_file.write_text(json.dumps(directions, indent=2) + "\n")
    sprites.manifest_path.write_text(json.dumps(sprites.manifest, indent=2) + "\n")


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
        if key == "Boat" and (SOURCE / "RedLion.png").exists():
            pack_red_lion()
            directions[name] = RED_LION_ROWS
            continue
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
    if sys.argv[1] == "--red-lion":
        publish_red_lion()
    else:
        main(sys.argv[1])
