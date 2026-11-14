"""Import one CC0 photogrammetry rock-set model for Windfall, for OFFLINE play.

Poly Haven asset: rock_moss_set_01, Kless Gyzen, CC0.
Source images/models are fetched at authoring time only. The main game never
makes a request to Poly Haven. This script performs strict URL/size/hash checks
before packaging a locally embedded glTF 2.0 GLB.

Usage: python tools/import_cc0_rocks.py
Dependencies: numpy, Pillow, trimesh.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path, PurePosixPath
import tempfile
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
import numpy as np
import trimesh

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"models"
SOURCE_ID="rock_moss_set_01"
USER_AGENT="Windfall-Offline-CC0-Authoring/1.0"
ALLOWED={"api.polyhaven.com","dl.polyhaven.org","cdn.polyhaven.com"}
MAX_FILE=40*1024*1024
MAX_TOTAL=95*1024*1024


def get(url:str, limit:int, expected_md5:str|None=None) -> bytes:
    parsed=urlsplit(url)
    if parsed.scheme!="https" or parsed.hostname not in ALLOWED:
        raise ValueError("Unapproved model source host: "+str(parsed.hostname))
    req=Request(url,headers={"User-Agent":USER_AGENT})
    with urlopen(req,timeout=70) as response:
        actual=urlsplit(response.url)
        if actual.scheme!="https" or actual.hostname not in ALLOWED:
            raise ValueError("Redirect to unapproved source")
        declared=int(response.headers.get("Content-Length","0"))
        if declared>limit:raise ValueError("Model file over size budget")
        data=response.read(limit+1)
    if len(data)>limit:raise ValueError("Source exceeds download budget")
    if expected_md5 and hashlib.md5(data).hexdigest()!=expected_md5.lower():
        raise ValueError("Poly Haven model file hash mismatch")
    return data


def valid_relative(value:str)->Path:
    name=PurePosixPath(value)
    if name.is_absolute() or not name.parts or ".." in name.parts:
        raise ValueError("Unsafe glTF dependency path")
    if any(part in ("",".") for part in name.parts):
        raise ValueError("Unsafe empty glTF dependency path")
    if name.suffix.lower() not in (".gltf",".bin",".png",".jpg",".jpeg",".webp"):
        raise ValueError("Unexpected binary asset dependency extension")
    return Path(*name.parts)


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    info=json.loads(get(f"https://api.polyhaven.com/info/{SOURCE_ID}",1024*1024))
    assert info["type"]==2 and info["authors"] and "Kless Gyzen" in info["authors"],info
    tree=json.loads(get(f"https://api.polyhaven.com/files/{SOURCE_ID}",2*1024*1024))
    gltf=tree.get("gltf",{})
    choice=gltf.get("1k") or gltf.get("2k")
    if not isinstance(choice,dict) or not isinstance(choice.get("gltf"),dict):
        raise ValueError(f"No downloadable direct glTF for {SOURCE_ID}: {list(gltf)}")
    meta=choice["gltf"]
    if not isinstance(meta.get("include"),dict) or not meta.get("include"):
        raise ValueError("Source glTF has no declared texture or buffer dependencies")
    manifest={"id":SOURCE_ID,"name":info["name"],
      "source_url":f"https://polyhaven.com/a/{SOURCE_ID}","author":"Kless Gyzen",
      "license":"CC0-1.0","gltf_resolution":"1k" if "1k" in gltf else "2k",
      "runtime_network":False,"files":[]}
    bytes_total=0
    with tempfile.TemporaryDirectory(prefix="windfall-cc0-rocks-") as work:
        root=Path(work)
        name=valid_relative(urlsplit(meta["url"]).path.split("/")[-1])
        downloaded=[(name,meta)]
        downloaded.extend((valid_relative(k),v) for k,v in meta["include"].items())
        for relative,record in downloaded:
            if not isinstance(record,dict) or not record.get("url") or not record.get("md5"):
                raise ValueError("Unverified source record")
            budget=min(MAX_FILE,MAX_TOTAL-bytes_total)
            raw=get(record["url"],budget,record["md5"])
            bytes_total+=len(raw)
            dest=root/relative
            dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_bytes(raw)
            manifest["files"].append({
                "relative":relative.as_posix(),
                "source_url":record["url"],
                "md5":record["md5"],
                "sha256":hashlib.sha256(raw).hexdigest(),
                "bytes":len(raw)})
        # The Poly Haven metadata describes physical, Y-up glTF units. Apply
        # a uniform scale for a small self-contained stone cluster in-game.
        scene=trimesh.load(root/name,file_type="gltf",force="scene")
        assert len(scene.geometry)>=1
        bounds=np.asarray(scene.bounds,float)
        extents=bounds[1]-bounds[0]
        if not np.isfinite(bounds).all() or max(extents)<.01:
            raise ValueError("Invalid photogrammetry mesh bounds")
        scale=min(1.0,5.2/max(extents))
        # Center at X,Z origin and put the lowest stone on y=0.
        center=(bounds[0]+bounds[1])*.5
        matrix=np.eye(4)
        matrix[:3,:3]*=scale
        matrix[:3,3]=np.array([-center[0],-bounds[0,1],-center[2]])*scale
        scene.apply_transform(matrix)
        faces=sum(len(mesh.faces) for mesh in scene.geometry.values())
        if not 1500<faces<250000:raise ValueError(f"Unexpected source triangle count: {faces}")
        blob=scene.export(file_type="glb")
        if len(blob)>24*1024*1024:raise ValueError("Runtime GLB exceeds 24 MiB budget")
        target=OUT/"windfall-cc0-mossy-rock-set.glb"
        target.write_bytes(blob)
        manifest["runtime_glb"]=target.name
        manifest["runtime_sha256"]=hashlib.sha256(blob).hexdigest()
        manifest["runtime_size"]=len(blob)
        manifest["triangles"]=faces
        manifest["bounds_m"]=scene.bounds.tolist()
        (OUT/"windfall-cc0-mossy-rock-set.SOURCES.json").write_text(
            json.dumps(manifest,indent=2)+"\n")
        print("Imported scan",SOURCE_ID,"triangles",faces,"meshes",len(scene.geometry),
              "runtime bytes",len(blob),"source bytes",bytes_total,flush=True)


if __name__=="__main__":
    main()
