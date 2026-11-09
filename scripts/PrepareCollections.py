"""Publish detailed collection previews from original art, separately from tiny map sprites.
The game never preloads these larger sheets; collection views request only their residents.
"""

from PIL import Image
import json
import sys
import ImportSprites as sprites

root = sprites.ROOT
source = root / "docs/source-assets/collections"
out = root / "public/world/collections"
out.mkdir(parents=True, exist_ok=True)
catalog = json.loads((root / "src/world/Collectibles.json").read_text())
only = next(
    (
        set(arg.split("=", 1)[1].split(","))
        for arg in sys.argv[1:]
        if arg.startswith("--only=")
    ),
    None,
)
manifest_path = root / "src/world/CollectionArt.json"
manifest = (
    json.loads(manifest_path.read_text()) if only and manifest_path.exists() else {}
)
for job in json.loads((source / "prompts.json").read_text()):
    if only and job["key"] not in only:
        continue
    cells, _ = sprites.extract(
        source / (job["key"] + ".png"), 10, row_cuts=job.get("rowCuts")
    )
    for row, species in enumerate(job["rows"]):
        item = next(s for s in catalog[job["kind"]] if s["id"] == species)
        poses = cells[row * 4 : row * 4 + 4]
        ratio = min(
            190 / max(c.width for c in poses), 165 / max(c.height for c in poses)
        )
        cw, ch = 224, 192
        atlas = Image.new("RGBA", (cw * 4, ch))
        for col, cell in enumerate(poses):
            small = cell.resize(
                (round(cell.width * ratio), round(cell.height * ratio)),
                Image.Resampling.LANCZOS,
            )
            atlas.alpha_composite(
                small, (col * cw + (cw - small.width) // 2, 184 - small.height)
            )
        filename = item["art"] + ".webp"
        atlas.save(out / filename, lossless=True, method=6)
        manifest[item["art"]] = dict(
            src="/world/collections/" + filename,
            width=cw,
            height=ch,
            frameMs=170 if job["kind"] == "spiders" else 220,
        )
habitats = (
    []
    if only
    else ["terrarium", "aquarium"] + [p.stem for p in source.glob("habitat-*.png")]
)
for name in habitats:
    Image.open(source / (name + ".png")).convert("RGB").resize(
        (1200, 800), Image.Resampling.LANCZOS
    ).save(out / (name + ".webp"), quality=90, method=6)
(root / "src/world/CollectionArt.json").write_text(
    json.dumps(manifest, indent=2) + "\n"
)
print(
    "Published",
    len(manifest),
    "detailed collection animations and",
    len(habitats),
    "furnished habitats.",
)
