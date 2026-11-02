"""Register authored in-between art, then publish it with PreparePeople.py.

Usage: python3 scripts/ImportAnimation.py /tmp/animation-results.json
The result file maps job names in animation/Jobs.json to generated PNG paths.
Source poses and exact prompt records remain outside the served website.
"""
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/source-assets"
ANIMATION = SOURCE / "animation"


def main(result_file):
    jobs = json.loads((ANIMATION / "Jobs.json").read_text())
    results = json.loads(Path(result_file).read_text())
    people = json.loads((SOURCE / "People.json").read_text())
    keys = json.loads((ANIMATION / "Keys.json").read_text())
    for job in jobs:
        if all(people[target['asset']].get('type') in ['drawn', 'parts'] for target in job['rows']):
            continue  # Dedicated character exporters own movement and riding.
        source = Path(results[job["key"]])
        assert source.is_file(), source
        destination = ANIMATION / (job["key"] + ".png")
        if source.resolve() != destination.resolve():
            shutil.copyfile(source, destination)
        for row, target in enumerate(job["rows"]):
            spec = people[target["asset"]]
            if spec.get('type') in ['drawn', 'parts']:
                continue
            spec.setdefault("inbetweens", {})[str(target["row"])] = {
                "file": "animation/" + destination.name,
                "rows": len(job["rows"]),
                "row": row,
            }
            # Twice as many poses occupy the same total cycle duration.
            spec["frameMs"] = keys[target["asset"]]["frameMs"] / 2
    (SOURCE / "People.json").write_text(json.dumps(people, indent=2) + "\n")
    print("Registered", len(jobs), "authored animation batches.")


if __name__ == "__main__":
    main(sys.argv[1])
