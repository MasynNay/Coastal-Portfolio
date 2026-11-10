"""Add motion-matched sprite frames without changing cycle length or scale.

The original pose is preserved at every even index. A midpoint warps a single
silhouette toward the next pose using the motion of its visible pixels, so
overlapping arms, legs, antennae and tails are never cross-faded.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WORLD = ROOT / "src/world"
VERSION = 1
cv2.setNumThreads(1)


def read(name):
    return json.loads((WORLD / f"{name}.json").read_text())


def feature(image):
    alpha = image[:, :, 3].astype(np.float32) / 255
    light = cv2.cvtColor(image[:, :, :3], cv2.COLOR_RGB2GRAY)
    return ((light * 0.65 + 86) * alpha).astype(np.uint8)


def remap(image, x, y):
    return cv2.remap(image, x.astype(np.float32), y.astype(np.float32), cv2.INTER_NEAREST)


def midpoint(first, second, x, y, grounded):
    a, b = feature(first), feature(second)
    flow = cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 3, 13, 4, 5, 1.2, 0)
    height, width = a.shape
    limit = np.maximum(
        1, np.linalg.norm(flow, axis=2) / max(3, min(width, height) * 0.18)
    )
    dx = flow[:, :, 0] / limit * 0.5
    dy = flow[:, :, 1] / limit * 0.5
    result = remap(first, x - dx, y - dy)

    # A pair can be identical or barely move at map resolution. In that case
    # articulate the free upper edge and keep the contact edge anchored.
    if np.array_equal(result, first) or np.array_equal(result, second):
        ys, xs = np.nonzero(first[:, :, 3])
        top, foot = ys.min(), ys.max()
        amount = max(1.1, (xs.max() - xs.min()) * 0.025)
        bend = np.clip((foot - y) / float(max(1, foot - top)), 0, 1) ** 2
        result = remap(first, x - dx + amount * bend, y - dy)

    new_alpha = result[:, :, 3]
    area = np.count_nonzero(new_alpha)
    original_area = np.count_nonzero(first[:, :, 3])
    if not 0.84 * original_area <= area <= 1.18 * original_area:
        # A large pose change can make the matching ambiguous. Keep a small,
        # one-body follow-through rather than drawing an extra or missing limb.
        ys, _ = np.nonzero(first[:, :, 3])
        bend = np.clip((ys.max() - y) / float(max(1, ys.max() - ys.min())), 0, 1) ** 2
        result = remap(first, x + 1.5 * bend, y)

    if grounded:
        ends = [np.nonzero(p[:, :, 3])[0].max() for p in (first, second, result)]
        offset = round((ends[0] + ends[1]) / 2) - ends[2]
        if offset:
            result = remap(result, x, y - offset)
    return result


def expand(sheet, *, detail=False, loop=True):
    if sheet.get("inbetweenVersion") == VERSION:
        return
    width = sheet.get("cw", sheet.get("width"))
    height = sheet.get("ch", sheet.get("height"))
    columns, rows = sheet.get("columns", 4), sheet.get("rows", 8)
    if detail:
        rows = 1
    cycle = sheet.get("cycleFrames", columns)
    is_person = sheet.get("rootAligned", False)
    added = cycle if loop else cycle - 1
    output_columns = columns + added
    path = ROOT / ("public" + sheet["src"])
    with Image.open(path) as source:
        art = np.asarray(source.convert("RGBA"))
    if art.shape[:2] != (height * rows, width * output_columns):
        assert art.shape[:2] == (height * rows, width * columns), (path, art.shape)
        output = np.zeros((height * rows, width * output_columns, 4), dtype=np.uint8)
        y, x = np.mgrid[:height, :width].astype(np.float32)
        for row in range(rows):
            strip = art[row * height : (row + 1) * height]
            target = output[row * height : (row + 1) * height]
            for column in range(cycle):
                first = strip[:, column * width : (column + 1) * width]
                target[:, 2 * column * width : (2 * column + 1) * width] = first
                if column >= added:
                    break
                following = (column + 1) % cycle
                second = strip[:, following * width : (following + 1) * width]
                middle = target[:, (2 * column + 1) * width : (2 * column + 2) * width]
                source_row = None
                if sheet.get("canonicalDirections") and row > 4:
                    source_row = 8 - row
                elif sheet.get("canonicalSides") and row == 3:
                    source_row = 2
                if source_row is not None:
                    middle[:] = output[
                        source_row * height : (source_row + 1) * height,
                        (2 * column + 1) * width : (2 * column + 2) * width,
                    ][:, ::-1]
                else:
                    middle[:] = midpoint(
                        first,
                        second,
                        x,
                        y,
                        grounded="footY" in sheet and not is_person,
                    )
                visible = Image.fromarray(middle[:, :, 3]).getbbox()
                assert visible is not None, (path, row, column, "empty tween")
                l, t, r, b = visible
                if not (0 < l < r < width and 0 < t < b < height):
                    # Keep image sampling clear of the neighboring atlas cells.
                    middle[[0, -1], :] = 0
                    middle[:, [0, -1]] = 0
            if columns > cycle:
                target[:, (cycle + added) * width :] = strip[:, cycle * width :]
        image = Image.fromarray(output)
        options = {"compress_level": 4}
        if path.suffix == ".webp":
            options = (
                {"quality": 95, "alpha_quality": 100, "method": 3}
                if detail
                else {"lossless": True, "method": 1}
            )
        temporary = path.with_name("." + path.name)
        image.save(temporary, **options)
        temporary.replace(path)
    sheet.update(
        columns=output_columns,
        frameMs=sheet.get("frameMs", 170 if detail else 90) / 2,
        inbetweenVersion=VERSION,
        revision=hashlib.sha256(path.read_bytes()).hexdigest()[:12],
    )
    if "cycleFrames" in sheet:
        sheet["cycleFrames"] = cycle + added
    if "idleFrame" in sheet:
        idle = sheet["idleFrame"]
        sheet["idleFrame"] = idle + min(idle, added)
    if "holdFrame" in sheet:
        sheet["holdFrame"] *= 2
    # Origins, head heights, and baselines follow the same pose as the body.
    for field in ("anchors", "headTops", "baselines"):
        if field not in sheet:
            continue
        source = sheet[field]
        frames = []
        for row in range(rows):
            group = source[row * columns : (row + 1) * columns]
            for i in range(cycle):
                frames.append(group[i])
                if i < added:
                    frames.append((group[i] + group[(i + 1) % cycle]) / 2)
            frames.extend(group[cycle:])
        sheet[field] = frames


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()
    books = {
        name: read(name)
        for name in ("SpriteSheets", "CollectionArt", "CoastArt", "spriteManifest")
    }
    looks = {entry["asset"] for entry in read("Appearances")}
    action_names = (
        "surf", "water-ride", "board-ride", "board-trick", "wake-ride",
        "bike-acro", "bike-mach", "fish", "fish-surf", "salute", "conduct",
    )
    activities = {
        f"{look}-{action}" for look in looks for action in action_names
    }
    abilities = {name for name in books["SpriteSheets"] if name.startswith("ability-")}
    one_shots = (
        (abilities - {"ability-glide"})
        | {
            f"{look}-{action}"
            for look in looks
            for action in ("conduct", "board-trick")
        }
        | {"fallyn-tumbling", "glide-launch", "glide-land"}
    )
    species = read("Collectibles")
    collectibles = {
        entry["art"] for group in ("fish", "spiders") for entry in species[group]
    }
    selected = {
        "SpriteSheets": (
            looks | {look + "-run" for look in looks} | activities
            | abilities | one_shots | collectibles | {"rosie", "millie"}
        ),
        "CollectionArt": collectibles,
        "CoastArt": {
            "mallard", "teal-duck", "gull-flight", "mallard-flight",
            "swallow-flight", "mockingjay-flight",
        },
        "spriteManifest": {"duck", "fish", "koi", "axolotl", "axolotl-blue"},
    }
    for book, names in selected.items():
        entries = [(name, books[book][name]) for name in sorted(names)]

        def export(entry):
            name, sheet = entry
            expand(
                sheet,
                detail=book == "CollectionArt",
                loop=name not in one_shots,
            )

        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            list(pool.map(export, entries))
        if book == "SpriteSheets":
            alias = books[book]["costume-home"]
            airbender = books[book]["costume-airbender"]
            books[book]["costume-home"] = {**airbender, "id": alias["id"]}
        (WORLD / f"{book}.json").write_text(json.dumps(books[book], indent=2) + "\n")
        print(f"{book}: {len(entries)} atlases", flush=True)


if __name__ == "__main__":
    main()
