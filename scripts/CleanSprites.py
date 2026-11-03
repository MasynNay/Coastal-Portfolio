"""Normalize imported sprite alpha and walking anchors; do not redraw or blur art.

python3 scripts/CleanSprites.py --write   # after an art import
python3 scripts/CleanSprites.py          # read-only audit of every shipped frame
python3 scripts/CleanSprites.py --write --people  # after only human art changes

Only isolated alpha islands of 1-3 pixels are discarded. Connected hair, fur,
whiskers, outlines and antialiasing remain intact. Original sources are retained.
"""

from pathlib import Path
from PIL import Image
import json, statistics, sys, hashlib

ROOT = Path(__file__).resolve().parents[1]


def islands(cell):
    pixels = cell.load()
    remaining = {
        (x, y)
        for y in range(cell.height)
        for x in range(cell.width)
        if pixels[x, y][3] >= 16
    }
    parts = []
    while remaining:
        point = remaining.pop()
        part, todo = [point], [point]
        while todo:
            x, y = todo.pop()
            for xx in range(x - 1, x + 2):
                for yy in range(y - 1, y + 2):
                    if (xx, yy) in remaining:
                        remaining.remove((xx, yy))
                        todo.append((xx, yy))
                        part.append((xx, yy))
        parts.append(part)
    return sorted(parts, key=len, reverse=True)


def head_center(cell, scale=1):
    b = cell.getbbox()
    # The central head band avoids hands, a swinging hem, hats and long props.
    xs = [
        x
        for y in range(b[1] + 3 * scale, min(b[1] + 13 * scale, b[3]))
        for x in range(cell.width // 4, 3 * cell.width // 4)
        if cell.getpixel((x, y))[3] >= 128
    ]
    return (min(xs) + max(xs)) / 2 if xs else cell.width / 2


def walk_anchors(im, sheet):
    cw, ch = sheet["cw"], sheet["ch"]
    anchors = []
    for row in range(sheet["rows"]):
        centers = [
            head_center(
                im.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch)),
                round(sheet.get("detailScale", 2 if sheet.get("detailVersion") else 1)),
            )
            for col in range(sheet.get("columns", 4))
        ]
        center = statistics.median(centers)
        # Keep the artist's directional lean; remove only in-cycle sideways drift.
        anchors.extend(cw / 2 + round((x - center) * 2) / 2 for x in centers)
    return anchors


def main(write=False, people_only=False):
    sheets_path = ROOT / "src/world/SpriteSheets.json"
    sheets = json.loads(sheets_path.read_text())
    people = set(json.loads((ROOT / "docs/source-assets/People.json").read_text()))
    groups = [
        sheets,
        json.loads((ROOT / "src/world/spriteManifest.json").read_text()),
        json.loads((ROOT / "src/world/CollectionArt.json").read_text()),
    ]
    report = dict(
        filesScanned=0,
        framesScanned=0,
        noisePixels=0,
        files=[],
        aligned=[],
        realignedFrames=[],
    )
    seen = set()
    for group in groups:
        for name, s in group.items():
            if people_only and name not in people:
                continue
            path = ROOT / ("public" + s["src"])
            if path in seen:
                continue
            seen.add(path)
            im = Image.open(path).convert("RGBA")
            cw, ch = s.get("cw", s.get("width")), s.get("ch", s.get("height"))
            columns = s.get("columns", 4)
            assert im.width == cw * columns and im.height % ch == 0, name
            changes = 0
            for row in range(im.height // ch):
                for col in range(columns):
                    box = (col * cw, row * ch, (col + 1) * cw, (row + 1) * ch)
                    cell = im.crop(box)
                    assert cell.getbbox(), (name, row, col, "empty frame")
                    noise = [
                        point
                        for part in islands(cell)[1:]
                        if len(part) <= 3
                        for point in part
                    ]
                    changes += len(noise)
                    if write and noise:
                        for x, y in noise:
                            cell.putpixel((x, y), (0, 0, 0, 0))
                    # Removing a stray pixel below the feet reveals the true
                    # baseline. Repack that pose instead of leaving a tiny hop.
                    foot = s.get("footY")
                    shift = (
                        foot - cell.getbbox()[3]
                        if foot and not s.get("rootAligned")
                        else 0
                    )
                    if shift:
                        report["realignedFrames"].append(
                            dict(asset=name, row=row, column=col, shift=shift)
                        )
                        if write:
                            aligned = Image.new("RGBA", cell.size)
                            aligned.alpha_composite(cell, (0, shift))
                            cell = aligned
                    if write and (noise or shift):
                        im.paste(cell, box)
                    report["framesScanned"] += 1
            report["filesScanned"] += 1
            report["noisePixels"] += changes
            if changes:
                report["files"].append(dict(asset=name, src=s["src"], pixels=changes))
            if write and (
                changes or any(r["asset"] == name for r in report["realignedFrames"])
            ):
                if path.suffix == ".webp":
                    im.save(path, lossless=True, method=6)
                else:
                    im.save(path, optimize=True)
    for name, s in sheets.items():
        human = (
            name in ["masyn", "mi-shell", "ezra", "fallyn", "fitzgerald", "link"]
            or name.startswith("costume-")
            or name.endswith("-run")
        )
        if human and s["action"] in ["walk", "run"] and not s.get("rootAligned"):
            im = Image.open(ROOT / ("public" + s["src"])).convert("RGBA")
            anchors = walk_anchors(im, s)
            if s.get("anchors") != anchors:
                report["aligned"].append(name)
            if write:
                s["anchors"] = anchors
    if write:
        # Content versions reach both the canvas and CSS sprite previews. An art
        # update must never keep displaying an older bitmap from browser cache.
        revisions = {}
        for group, filename in zip(
            groups, ["SpriteSheets.json", "spriteManifest.json", "CollectionArt.json"]
        ):
            for item in group.values():
                path = ROOT / ("public" + item["src"])
                if path not in revisions:
                    revisions[path] = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
                item["revision"] = revisions[path]
            (ROOT / "src/world" / filename).write_text(
                json.dumps(group, indent=2) + "\n"
            )
        sheets_path.write_text(json.dumps(sheets, indent=2) + "\n")
        destination = ROOT / "docs/SpriteAudit.json"
        saved = dict(report)
        if destination.exists():
            previous = json.loads(destination.read_text())
            saved["noisePixels"] += previous["noisePixels"]
            saved["files"] = previous["files"] + report["files"]
            saved["aligned"] = sorted(set(previous["aligned"] + report["aligned"]))
            saved["realignedFrames"] = (
                previous.get("realignedFrames", []) + report["realignedFrames"]
            )
        destination.write_text(json.dumps(saved, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    if not write:
        assert not report[
            "noisePixels"
        ], "Run --write to normalize detached import noise."
        assert not report["aligned"], "Walking anchors need normalization."
        assert not report["realignedFrames"], "Sprite feet need baseline normalization."


if __name__ == "__main__":
    main("--write" in sys.argv, "--people" in sys.argv)
