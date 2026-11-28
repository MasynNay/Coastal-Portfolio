"""Measure existing run poses against Everyday Masyn, without repainting art.

Align the cycling phase by lower-body silhouette. A circular offset preserves
every authored drawing and stride duration. Low-confidence matches are left as
drawn: capes and equipment can otherwise be mistaken for a leading foot.
"""

import json
from pathlib import Path
from PIL import Image
import math

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/world"
sheets = json.loads((SOURCE / "SpriteSheets.json").read_text())
looks = json.loads((SOURCE / "Appearances.json").read_text())


def signatures(sheet, image, row):
    cw, ch = sheet["cw"], sheet["ch"]
    stride = sheet["cycleFrames"]
    values = []
    for column in range(stride):
        alpha = image.crop((column*cw, row*ch, (column+1)*cw, (row+1)*ch)).getchannel("A")
        anchor = round(sheet["anchors"][row * sheet["columns"] + column])
        # Four bands of the trousers and boots, measured about the same head
        # axis as the renderer. Their changing profiles describe the stride.
        profile = []
        for y in range(sheet["footY"]-34, sheet["footY"]+6, 8):
            for x in range(anchor-32, anchor+32, 8):
                profile.append(sum(alpha.crop((x,y,x+8,y+8)).getdata())/255)
        values.append(profile)
    # Remove the static outline of each outfit; compare changes across time.
    averages = [sum(col)/stride for col in zip(*values)]
    changes = [[v-m for v,m in zip(frame, averages)] for frame in values]
    norm = math.sqrt(sum(v*v for frame in changes for v in frame)) or 1
    return [[v/norm for v in frame] for frame in changes]


reference = sheets["masyn-run"]
base_image = Image.open(ROOT / ("public" + reference["src"])).convert("RGBA")
base = [signatures(reference, base_image, row) for row in range(8)]
offsets = {}
for look in looks:
    if look["character"] != "masyn" or look["asset"] == "masyn":
        continue
    key = look["asset"] + "-run"
    sheet = sheets[key]
    image = Image.open(ROOT / ("public" + sheet["src"])).convert("RGBA")
    stride = sheet["cycleFrames"]
    offsets[key] = []
    for row in range(8):
        candidate = signatures(sheet, image, row)
        scores = [sum(a*b for i, frame in enumerate(base[row]) for a,b in zip(frame,candidate[(i+shift)%stride])) for shift in range(stride)]
        best = max(range(stride), key=scores.__getitem__)
        offsets[key].append(best if scores[best] > 0.18 and scores[best]-scores[0] > 0.10 else 0)
    print(key, offsets[key])
(SOURCE / "RunPhases.json").write_text(json.dumps(offsets, indent=2)+"\n")
