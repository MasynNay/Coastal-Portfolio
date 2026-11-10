# Build and artwork tools

These files support the site; they are not browser code. JavaScript build helpers use the Node version in `.node-version`. Python artwork tools use Pillow. Install the optional development tools with `python3 -m pip install -r scripts/requirements.txt` in your virtual environment.

| Task | Tools |
| --- | --- |
| Prepare normal builds | `IndexPhotos.cjs`, `PrepareRoms.cjs` run through npm's prestart/prebuild hooks |
| Check imports, local URLs and documentation | `npm run check:project` uses `CheckProject.cjs`; it makes no network requests or changes |
| Format authored JavaScript/CSS | `npm run format`; `npm run format:check` checks without writing |
| Format Python | `python3 -m black scripts`; `python3 -m black --check scripts` checks without writing |
| Verify published assets | `VerifyWorldAssets.py`, `VerifySprites.py`, `VerifyDirections.py`, `VerifyCollections.py`, `VerifyArcade.py` |
| Publish character sheets | `BuildPeople.py`, `BuildActivities.py`, `PreparePeople.py`; see source catalogs and the sprite maintenance guide |
| Reapply character details | `MatchMasyn.py` matches the costume faces to Everyday Hoodie after packing. `BuildTumbling.py` packs Fallyn's tumbling drawings. |
| Pack swimming geese | `BuildGooseSwims.py` packs drawn water poses and their in-betweens for eight directions. |
| Add in-between sprite poses | `BuildInbetweens.py` rebuilds walk/run, wildlife, and collection cycles from the existing key poses at the same playback speed. |
| Import supplied/generated artwork | `Import*.py`, grouped by asset subject; each module describes its input manifest and output |
| Clean sprite exports | `CleanSprites.py` checks by default; `--write` repairs exports |
| Repair audited animal art | `RepairAnimalSprites.py` reapplies atlas corrections and rebuilds the map sprites listed in `FineSprites.json` |
| Produce reference previews | `PoseGuide.py`, `ActivityGuide.py`, `PreviewPeople.py`, `FishingTips.py` |
| Rebuild brand/project previews | `BrandAssets.py`, `ProjectPreviews.cjs` |
| Rebuild the archived original site | `ArchivePortfolio.py`, using a separate original repository checkout |

Importers intentionally write artwork/manifests; validators are read-only. Keep editable sources in `docs/source-assets/` and published exports in `public/world/`. The archived original portfolio and vendored emulator retain their own filenames, formatting and licenses. They are not copies to merge into the current site's styles.
