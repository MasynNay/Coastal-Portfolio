#!/usr/bin/env python3
"""Build opt-in, fully self-hosted scanned material tiles for Windfall.

Original 3D geometry and character assets remain untouched. Downloaded images
are CC0 textures from Poly Haven, recorded in materials/SOURCES.json.
Authoring only: the playable site never calls Poly Haven or another CDN.

Usage: python public/windfall-2026/tools/build_scanned_materials.py
Requires Pillow; standard-library urllib for downloads. Network is required
only when authoring or intentionally refreshing the material assets.
"""
from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "materials"
SIZE = 384
MAX_SOURCE_BYTES = 10 * 1024 * 1024
API_ROOT = "https://api.polyhaven.com"
ASSETS = [
    ("forest_ground_01", "forest-floor-rgba.png", "grass surface"),
    ("cobblestone_floor_04", "cobblestone-rgba.png", "village masonry"),
    ("bark_brown_02", "tree-bark-rgba.png", "weathered timber"),
]


def download(url: str, limit: int = MAX_SOURCE_BYTES) -> bytes:
    parsed = urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname not in {
        "api.polyhaven.com", "dl.polyhaven.org", "cdn.polyhaven.com"
    }:
        raise ValueError("Unexpected asset URL host: " + str(parsed.hostname))
    request = Request(url, headers={"User-Agent": "Windfall-Original-Portfolio-Asset-Builder/1.0"})
    with urlopen(request, timeout=45) as response:
        length = int(response.headers.get("Content-Length", "0"))
        if length > limit:
            raise ValueError("Asset exceeds input budget")
        data = response.read(limit + 1)
    if len(data) > limit:
        raise ValueError("Asset exceeds input budget")
    return data


def metadata(slug: str, suffix: str) -> dict:
    value = json.loads(download(f"{API_ROOT}/{suffix}/{slug}", 1024 * 1024))
    if not isinstance(value, dict):
        raise ValueError(f"Unexpected metadata for {slug}")
    return value


def named_key(mapping: dict, options: tuple[str, ...]) -> dict | None:
    for label in options:
        for key, value in mapping.items():
            if key.lower() == label.lower() and isinstance(value, dict):
                return value
    return None


def map_entry(files: dict, names: tuple[str, ...], required: bool = True) -> dict | None:
    map_type = named_key(files, names)
    if not map_type:
        if required:
            raise ValueError(f"Missing Poly Haven texture map: {names}")
        return None
    resolution = map_type.get("1k") or map_type.get("2k")
    if not isinstance(resolution, dict):
        if required:
            raise ValueError(f"No 1k/2k image for {names}")
        return None
    for fmt in ("jpg", "png"):
        item = resolution.get(fmt)
        if isinstance(item, dict) and item.get("url") and item.get("md5"):
            return item
    if required:
        raise ValueError(f"No supported image map for {names}")
    return None


def get_image(entry: dict) -> tuple[Image.Image, dict]:
    url = entry["url"]
    data = download(url)
    expected = entry["md5"].lower()
    actual = hashlib.md5(data).hexdigest()
    if actual != expected:
        raise ValueError("Downloaded texture MD5 mismatch; source may have changed")
    with Image.open(io.BytesIO(data)) as img:
        rgb = ImageOps.fit(img.convert("RGB"), (SIZE, SIZE), method=Image.Resampling.LANCZOS)
    return rgb, {
        "url": url,
        "source_md5": expected,
        "source_sha256": hashlib.sha256(data).hexdigest(),
        "bytes": len(data),
    }


def build(slug: str, output: str, purpose: str) -> dict:
    info = metadata(slug, "info")
    if info.get("type") != 1:
        raise ValueError(f"{slug} is not a Poly Haven texture")
    maps = metadata(slug, "files")
    diffuse = map_entry(maps, ("Diffuse", "BaseColor", "Albedo"))
    color, color_provenance = get_image(diffuse)
    height_source = map_entry(maps, ("Displacement", "Bump", "Height"), required=False)
    if height_source:
        height_color, height_provenance = get_image(height_source)
        height = ImageEnhance.Contrast(height_color.convert("L")).enhance(.55)
    else:
        # No invented third-party map; derive a quiet bump approximation from color.
        height = ImageEnhance.Contrast(color.convert("L")).enhance(.28)
        height_provenance = None
    # Prevent measured photographic colors from becoming overbright when mixed
    # into the existing triplanar authoring shader.
    color = ImageEnhance.Color(color).enhance(.90)
    rgba = color.convert("RGBA")
    rgba.putalpha(height)
    target = OUT / output
    rgba.save(target, optimize=True)
    return {
        "id": slug,
        "name": info.get("name", slug),
        "purpose": purpose,
        "local_file": output,
        "license": "CC0-1.0",
        "author": sorted((info.get("authors") or {}).keys()),
        "source": f"https://polyhaven.com/a/{slug}",
        "api": f"{API_ROOT}/files/{slug}",
        "diffuse": color_provenance,
        "height": height_provenance,
        "generated_sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
        "note": "Single color + derived height-alpha tile; not full normal/roughness/IBL PBR",
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "purpose": "Original Windfall fantasy world CC0 scanned surface layer",
        "runtime_network_requests": False,
        "resolution": SIZE,
        "license": "CC0-1.0",
        "credits": "Powered by Poly Haven (asset import tool only)",
        "assets": [],
    }
    for slug, output, purpose in ASSETS:
        asset = build(slug, output, purpose)
        print(f"Built {output}: {asset['generated_sha256'][:12]} from {slug}")
        manifest["assets"].append(asset)
    (OUT / "SOURCES.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print("Scanned atlas tiles and verifiable provenance are ready.")


if __name__ == "__main__":
    main()
