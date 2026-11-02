"""Publish the original family designs and matching action art.

People.json identifies each source; DirectionRows/DirectionProfiles record the
visually audited poses. The resulting PNGs and metadata drive both Game Mode and
the sprite workshop. New movement/activity drawings use BuildPeople.py and
BuildActivities.py instead. Optional: --only=ability-arrow,masyn-wave.
"""
import json
import copy
import statistics
import hashlib
import sys
from PIL import Image, ImageOps
import ImportSprites as sprites
from BuildPeople import ART_HEIGHTS, OPAQUE_LOOKS

SOURCE = sprites.ROOT / "docs/source-assets"
CATALOG = json.loads((SOURCE / "People.json").read_text())
WALK_ROWS = json.loads((SOURCE / "DirectionRows.json").read_text())
SIDE_POSES = json.loads((SOURCE / "DirectionProfiles.json").read_text())
BODY_HEIGHT = 96
source_cache = {}


def read_poses(spec):
    """Decode a source once; column counts belong to its art, not its output."""
    columns = spec.get("columns", 4)
    key = (spec["file"], spec["rows"], columns)
    if key not in source_cache:
        path = SOURCE / spec["file"]
        source_cache[key] = sprites.extract(path, spec["rows"], columns)[0]
    if "poses" in spec:
        return [ImageOps.mirror(source_cache[key][r*columns+c]) if flip else source_cache[key][r*columns+c].copy()
                for r,c,flip in spec["poses"]]
    rows = spec.get("select", range(spec["rows"]))
    result = [source_cache[key][row * columns + spec.get("poseColumns", {}).get(str(row), list(range(columns)))[col]].copy() for row in rows for col in range(columns)]
    return result


def orient_poses(name, poses, sheet):
    """Construct actual opposite views, including mixed-facing cast frames."""
    columns = sheet.get("columns", 4)
    if name in WALK_ROWS:
        poses = [
            ImageOps.mirror(poses[row * columns + col]) if flip else poses[row * columns + col].copy()
            for row, flip in WALK_ROWS[name] for col in range(columns)
        ]
        sheet.pop("directions", None)
        sheet.pop("mirrorRows", None)
        sheet.update(layout="eight", canonicalDirections=True)
    elif sheet["rows"] == 4:
        profiles = SIDE_POSES.get(name, [[2, 0]] * columns)
        if len(profiles) != columns:
            profiles = [profiles[min(len(profiles)-1, col * len(profiles) // columns)] for col in range(columns)]
        west = [ImageOps.mirror(poses[row * columns + col]) if flip else poses[row * columns + col].copy()
                for col, (row, flip) in enumerate(profiles)]
        poses = poses[:columns * 2] + west + [ImageOps.mirror(pose) for pose in west]
        sheet.update(layout="four", mirrorWest=False, canonicalSides=True)
        sheet.pop("canonicalDirections", None)
    elif sheet["action"] == "ride":
        sheet["mirrorWest"] = True
    return poses


def add_inbetweens(poses, spec, sheet):
    """Interleave authored mid-poses; supports four-to-eight and eight-to-sixteen.

    Opposite profiles use the same sequence, so adding poses cannot reverse a
    character mid-stride. No opacity blending or duplicated body layers.
    """
    if not spec.get("inbetweens"):
        return poses
    columns = sheet["columns"]
    assert columns in [4, 8]
    extra = {}
    for key, record in spec["inbetweens"].items():
        source = read_poses({"file": record["file"], "rows": record["rows"],
                             "columns": columns, "select": [record["row"]]})
        extra[int(key)] = [ImageOps.mirror(p) if record.get("flip") else p for p in source]
    for row in range(sheet["rows"]):
        if row in extra:
            continue
        partner = {5: 3, 6: 2, 7: 1}[row] if sheet["rows"] == 8 else 2
        extra[row] = [ImageOps.mirror(p) for p in extra[partner]]
    result = []
    for row in range(sheet["rows"]):
        keys = poses[row * columns:row * columns + columns]
        for col, key in enumerate(keys):
            tween = extra[row][col]
            ratio = ((key.height + keys[(col + 1) % columns].height) / 2) / tween.height
            # The sixteen-frame skating art is one coherent source; its natural
            # crouch must remain smaller rather than being stretched to match.
            if not spec.get("preserveTweenScale"):
                tween = tween.resize((max(1, round(tween.width * ratio)), max(1, round(tween.height * ratio))), Image.Resampling.LANCZOS)
            result.extend([key, tween])
    sheet["columns"] = columns * 2
    if sheet["action"] == "fish":
        sheet["holdFrame"] = (spec.get("holdFrame", 3)) * 2
    return result


def replace_rows(poses, spec, sheet):
    """Use a complete new cycle where the old key poses lacked leg movement."""
    columns = sheet["columns"]
    replacements = {}
    for key, record in spec.get("replacements", {}).items():
        assert record["columns"] == columns
        row = int(key)
        group = read_poses({
            "file": record["file"], "rows": record["rows"],
            "columns": columns, "select": [record["row"]],
        })
        # Replacement artwork may be authored at a different resolution.
        # Match the existing row's body scale before the common atlas packing.
        original = poses[row * columns:(row + 1) * columns]
        ratio = statistics.median(p.height for p in original) / statistics.median(p.height for p in group)
        replacements[row] = [p.resize((max(1, round(p.width * ratio)), max(1, round(p.height * ratio))), Image.Resampling.LANCZOS) for p in group]
    if sheet["rows"] == 8:
        for opposite, original in [(5, 3), (6, 2), (7, 1)]:
            if original in replacements:
                replacements[opposite] = [ImageOps.mirror(p) for p in replacements[original]]
    for row, group in replacements.items():
        poses[row * columns:(row + 1) * columns] = group
    return poses


def publish(name, poses, sheet, target_src=None, body_scale_pose=None, fit_scale=1):
    """Keep world/UI sizes stable while preserving fine source-art detail."""
    previous = Image.open(sprites.ROOT / ("public" + sheet["src"])).convert("RGBA")
    target = sprites.ROOT / ("public" + (target_src or sheet["src"]))
    columns = sheet.get("columns", 4)
    old_width, old_height = sheet["cw"], sheet["ch"]
    bounds = [
        previous.crop((col * old_width, row * old_height,
                       (col + 1) * old_width, (row + 1) * old_height)).getbbox()
        for row in range(previous.height // old_height) for col in range(previous.width // old_width)
    ]
    factor = BODY_HEIGHT / sheet["bodyHeight"]
    target_height = statistics.median(box[3] - box[1] for box in bounds) * factor
    if fit_scale != 1:
        # Fitted costumes use an explicit source metric, not last export's
        # smaller bounds; repeated exports must never keep shrinking the art.
        target_height = BODY_HEIGHT
    width, height = round(old_width * factor), round(old_height * factor)
    foot = height - 8
    ratio = min(
        target_height / (poses[body_scale_pose].height if body_scale_pose is not None else statistics.median(pose.height for pose in poses)),
        (width - 12) / max(pose.width for pose in poses),
        (height - 12) / max(pose.height for pose in poses),
    )
    # Action art belonging to a fitted appearance keeps that appearance's
    # smaller whole-body scale, rather than growing back during a Q gesture.
    ratio *= fit_scale
    # Walking, running and welcome previews share an actual body scale and frame,
    # rather than inheriting old canvas padding. A central band excludes tall
    # side props (notably the ocean king's trident) from the body-height measure.
    canonical_body = sheet["action"] in ["walk", "run", "wave"]
    row_ratios = []
    if canonical_body:
        width, height, foot = 128, 144, 136
        for row in range(sheet["rows"]):
            group = poses[row * columns:row * columns + columns]
            body_heights = []
            for pose in group:
                band = pose.crop((round(pose.width * .35), 0, round(pose.width * .65), pose.height)).getbbox()
                body_heights.append(pose.height - (band[1] if band else 0))
            row_ratios.append(min(BODY_HEIGHT / statistics.median(body_heights),
                                  (width - 12) / max(p.width for p in group),
                                  (height - 12) / max(p.height for p in group)))
    atlas = Image.new("RGBA", (width * columns, height * sheet["rows"]))
    anchors = []
    for index, pose in enumerate(poses):
        active_ratio = row_ratios[index // columns] if canonical_body else ratio
        size = (max(1, round(pose.width * active_ratio)), max(1, round(pose.height * active_ratio)))
        small = pose.resize(size, Image.Resampling.LANCZOS)
        small.putalpha(small.getchannel("A").point(lambda value: 255 if value >= 160 else 0))
        small = small.crop(small.getbbox())
        feet = [
            x for y in range(max(0, small.height - 6), small.height)
            for x in range(small.width) if small.getpixel((x, y))[3]
        ]
        anchored = sheet.get("anchors") and sheet["action"] not in ["walk", "run"]
        if sheet["action"] == "board-ride":
            # A pushing foot is deliberately moving. Anchor the head instead
            # of recentering the rider over whichever foot is lowest that frame.
            head = [x for y in range(3, min(24, small.height))
                    for x in range(small.width) if small.getpixel((x,y))[3]]
            anchor = (min(head)+max(head))/2 if head else small.width/2
        else:
            anchor = (min(feet) + max(feet)) / 2 if anchored else small.width / 2
        left = max(2, min(width - small.width - 2, round(width / 2 - anchor)))
        atlas.alpha_composite(small, (index % columns * width + left,
                                     index // columns * height + foot - small.height))
        anchors.append(left + anchor)
    alpha = atlas.getchannel("A")
    atlas = atlas.convert("RGB").quantize(colors=128, dither=Image.Dither.NONE).convert("RGBA")
    atlas.putalpha(alpha)
    target.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(target, optimize=True)
    sheet["revision"] = hashlib.sha256(target.read_bytes()).hexdigest()[:12]
    if target_src:
        sheet["src"] = target_src
    detail_scale = BODY_HEIGHT / 36 if canonical_body else sheet.get("detailScale", 2 if sheet.get("detailVersion") else 1) * factor
    sheet.update(cw=width, ch=height, footY=foot, bodyHeight=BODY_HEIGHT,
                 anchors=anchors, smooth=True, colors=128, detailVersion=2,
                 detailScale=detail_scale)


def main(names=None):
    count = 0
    for name, spec in CATALOG.items():
        if spec.get('type') == 'drawn':
            # Dedicated complete-body exporters own movement/activity atlases.
            continue
        if names and name not in names:
            continue
        # Runs inherit the walking sheet's body scale, never its walking poses.
        # Clone the base metadata to support new costume runs without drift on re-export.
        template = spec.get("base") or spec.get("template")
        sheet = copy.deepcopy(sprites.manifest[template]) if template else sprites.manifest[name]
        # Legacy complete-pose exports do not inherit a newer atlas's idle cell
        # or loop length. Those fields could otherwise address nonexistent PNG cells.
        for field in ['cycleFrames', 'idleFrame', 'rootAligned', 'drawn']:
            sheet.pop(field, None)
        target_src = None
        if template:
            sheet.update(id=name, action=spec.get("action", "run"), rows=spec.get("outputRows", spec["rows"]), frameMs=spec.get("frameMs", 120))
            target_src = "/world/sprites/emerald/" + name + ".png"
        if "sequence" in spec:
            sheet["sequence"] = spec["sequence"]
            sheet.pop('canonicalDirections', None)
            sheet.pop('canonicalSides', None)
        sheet["columns"] = spec.get("columns", 4)
        if "frameMs" in spec:
            sheet["frameMs"] = spec["frameMs"]
        poses = read_poses(spec)
        assert len(poses) == sheet["rows"] * sheet["columns"], (name, len(poses), sheet["rows"])
        poses = add_inbetweens(orient_poses(name, poses, sheet), spec, sheet)
        poses = replace_rows(poses, spec, sheet)
        fit_scale = ART_HEIGHTS.get(spec.get("appearance"), BODY_HEIGHT) / BODY_HEIGHT
        publish(name, poses, sheet, target_src, spec.get("bodyScalePose"), fit_scale)
        if spec.get('appearance') in OPAQUE_LOOKS:
            sheet['opaqueBody'] = True
        sprites.manifest[name] = sheet
        count += 1
    sprites.manifest["costume-home"] = {**sprites.manifest["costume-airbender"], "id": "costume-home"}
    sprites.manifest_path.write_text(json.dumps(sprites.manifest, indent=2) + "\n")
    print("Repacked", count, "family/costume/action atlases from original artwork.")


if __name__ == "__main__":
    only = next((arg.split("=", 1)[1].split(",") for arg in sys.argv[1:]
                 if arg.startswith("--only=")), None)
    main(only)
