"""Rebuild the original portfolio without sharing any redesigned assets.

The fixed original commit supplies its own images, logo, components and styles.
Only the GitHub Pages base path changes. Build in /tmp using the installed
frontend dependencies, then place a standalone local demo in public/React-Portfolio.
"""

from pathlib import Path
import argparse, json, os, shutil, subprocess

ROOT = Path(__file__).resolve().parents[1]
REVISION = "78f927db488071bb42ab2b05ff914381387e59a3"
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument(
    "--original-repo",
    type=Path,
    default=ROOT,
    help="Checkout of MasynNay/React-Portfolio containing the original commit",
)
original = parser.parse_args().original_repo.resolve()
if subprocess.run(
    ["git", "cat-file", "-e", REVISION],
    cwd=original,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
).returncode:
    raise SystemExit(
        "The original commit is not in this checkout. Clone MasynNay/React-Portfolio and pass --original-repo /path/to/React-Portfolio."
    )
STAGE = Path("/tmp/masyn-original-portfolio")
STAGE.mkdir(parents=True, exist_ok=True)
files = subprocess.check_output(
    ["git", "ls-tree", "-r", "--name-only", REVISION], cwd=original, text=True
).splitlines()
for name in files:
    if not (
        name.startswith(("src/", "public/"))
        or name in ["package.json", "package-lock.json"]
    ):
        continue
    target = STAGE / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(
        subprocess.check_output(["git", "show", f"{REVISION}:{name}"], cwd=original)
    )
app = STAGE / "src/App.js"
app.write_text(
    app.read_text().replace("<Router>", "<Router basename={process.env.PUBLIC_URL}>")
)
footer = STAGE / "src/components/Footer.js"
footer.write_text(
    footer.read_text().replace('href="/"', 'href={process.env.PUBLIC_URL + "/"}')
)
(STAGE / "public/CNAME").unlink(missing_ok=True)
modules = STAGE / "node_modules"
if not modules.exists():
    modules.symlink_to(ROOT / "node_modules", target_is_directory=True)
env = {
    **os.environ,
    "PUBLIC_URL": "/React-Portfolio",
    "GENERATE_SOURCEMAP": "false",
    "CI": "false",
}
subprocess.run(["npm", "run", "build"], cwd=STAGE, env=env, check=True)
out = ROOT / "public/React-Portfolio"
# The dedicated generated directory belongs only to this script; unrelated
# project images and the editable original Git history are never modified.
if out.exists():
    shutil.rmtree(out)
shutil.copytree(STAGE / "build", out)
(out / ".nojekyll").touch()
# GitHub Pages can reopen an old SPA route without redirecting to the live domain.
shutil.copyfile(out / "index.html", out / "404.html")
(out / "archive.json").write_text(
    json.dumps(
        {
            "sourceCommit": REVISION,
            "basePath": "/React-Portfolio",
            "note": "Original artwork and project screenshots retained; hosting paths only.",
        },
        indent=2,
    )
    + "\n"
)
print("Original portfolio ready at /React-Portfolio/ from", REVISION)
