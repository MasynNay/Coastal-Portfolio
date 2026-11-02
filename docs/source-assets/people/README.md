# People artwork

Selected artwork was produced with the built-in image-generation tool using the preferred family designs and anatomical pose guides. Sources stay here; only packed, palette-limited PNGs under `public/world/sprites/emerald/` are served to visitors.

- Each appearance folder contains five facing sources: `south`, `southwest`, `west`, `northwest`, `north`. They contain standing, walking and running drawings. Where an original sheet supplied only twelve walking poses, `walk-{direction}.png` contains its complete sixteen-pose replacement.
- `Jobs.json` records the main movement prompt set. `Prompts.json` and `ArmCorrections.json` record the three selected pilot/correction jobs. `WalkPrompts.json` records the focused complete walking cycles. Paths are relative to `docs/source-assets/`.
- `ActivityPilots.json` and `ActivityPrompts.json` record paired skating, water-riding, exploring and fishing sheets. Each sheet has ten rows of eight poses: five directions for its first action, then five for its second. `BuildActivities.py` describes the exact action order.
- `references/` preserves the exact identity inputs. `turnarounds/` contains the movement-neutral references used for activity artwork. `guides/` contains pose diagrams, not game characters.
- `references/wardrobe/` preserves the earlier Masyn-identity inputs; use the current wizard/cap references described below for new edits. Updated `turnarounds/` are taken from the published idle poses. `WardrobeCorrections.json` records the selected directional repairs without replacing complete bodies with parts.
- The current movement references are `references/wizard/`: all poses come from the approved wizard's published walking/running cycles. `WizardPrompts.json` records the outfit edits. `HatPrompts.json` records the properly fitted green cap across every adventurer movement/activity/Q pose; `references/FittedCap.png` is the accepted front-cap reference. Every source frame is reviewed for a stable facing before packing.
- `Mounts.png` and `Mounts.md` preserve the standalone axolotls used under seated surfers/fishers. The retired component sources have been removed.
- All movement and activity appearances have complete-body sources. `WardrobePrompts.json` records the Masyn-identity edits for Hyrulian Adventurer and the trainer, plus Ezra’s north-running correction. The `link` asset and `lodge` outfit keys remain stable for saved selections; the visible name is Hyrulian Adventurer.


See `../../SPRITE-CLEANUP.md` for export commands, validation and cache behavior. `../../CharacterPreview.gif`, `../../Characters-walk.png` and `../../Characters-run.png` show published frames.

`Gait.json` controls the shared walking/running cadence. `BikeFit.json` and the default heights in `Appearances.json` keep the bike at its parked world size under every rider. `../../RunningPreview.gif` includes the woodland archer shown in the movement recording.

`../../CostumePreview.gif` compares both revised Masyn outfits and Ezra’s upward-running silhouette using the final shipped frames.

`../../CostumeFrames.png` exposes every south-facing walk/run frame beside the working wizard, making accidental turnarounds visible. `artHeight` in `Appearances.json` controls the fitted outfits' whole-figure size; it does not change collision or movement speed. The dedicated arcade eel sources and prompt are in `../harbor/Eels.png` and `../harbor/Eels.json`.
