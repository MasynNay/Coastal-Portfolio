# Sprite maintenance

`src/world/Appearances.json` is the shared identity/costume list for the character picker, hero routines and artwork exporters. `People.json` records the selected sources. New source drawings and portable prompts live in `source-assets/people/`; complete drawings remain intact during export.

## Movement and activities

All fourteen appearances have separate sixteen-pose walking and running cycles in eight directions, plus a reserved idle frame. `BuildPeople.py` publishes a 128 × 144 canvas, 96-pixel body scale and a common origin. Five actual source views provide south, southwest, west, northwest and north; opposite views are reflected from the same poses. Incomplete twelve-pose walks have separate complete sixteen-pose sources. The importer rejects missing cells.

`BuildActivities.py` publishes complete-body skating, tricks, wakeboarding, seated vehicle driving, cycling, surfing and fishing. Each available source has eight poses per direction. Bicycles and the family's axolotls are separate props beneath the person. Fishing bodies contain no rod: the canvas draws one pole, line and bobber. Uniform row scaling preserves anatomy and fits every pose inside its canvas; a seated figure is not stretched to standing height.

All fourteen appearances now have complete drawings for all nine activity variants. No component-animation sources or outputs remain. `DirectionRows.json` preserves the visually checked Minish mounted-fishing rear-view correction. `ActivityPrompts.json` records the selected generation/edit inputs, including the completed missing north-facing fishing poses.

`Gait.json` owns nominal cycle timing: 1040 ms walking, 880 ms running. `Gait.js` accumulates phase from actual travel at the selected movement speed; Shift no longer accelerates an already separate run cycle again. Switching speed or loading the matching walking fallback preserves the same leading foot. Zero-time input redraws retain the moving stride. Animal, ability, fishing and vehicle clocks are separate.

`BikeFit.json` defines a single 1.3-unit rental size. Exported bicycles compensate for the owner's height, with roomier canvases and saddle-aligned bodies. `Appearances.json` shares those heights with `Movement.js`. The renderer uses each person's usual height for cycling, and nameplates follow the actual elevated head.

The greeting, flight transitions and Q actions retain their separate full-body sources in `actions/` and `animation/`, published by `PreparePeople.py`. It skips the newer movement/activity atlases.

## Rebuild and inspect

```sh
python3 scripts/BuildPeople.py --all
python3 scripts/BuildActivities.py --all
python3 scripts/CleanSprites.py --write --people
python3 scripts/VerifySprites.py
python3 scripts/VerifyDirections.py
python3 scripts/VerifyWorldAssets.py
python3 scripts/PreviewPeople.py
```

For bike fitting alone, use `BuildActivities.py --all --actions=bike`. `PoseGuide.py` and `ActivityGuide.py` draw anatomical reference diagrams for new artwork; those diagrams are not runtime sprites. Prompts record use of the built-in image tool. No image API key or production dependency is needed.

`CleanSprites.py` removes only detached 1–3-pixel islands. Fixed-origin drawings keep their authored raised feet and body motion; cleanup does not realign airborne poses. After changing creatures as well, run the cleanup without `--people`. `SpriteAudit.json` records the work. Content hashes refresh changed images in both the game and CSS previews.

`VerifySprites.py` checks actual PNG dimensions, usable frames, alpha, palettes, margins, origins and distinct movement poses. `VerifyDirections.py` checks every canonical left/right reflection, including activities. These checks cannot judge anatomy or artistic quality; inspect the published sheets and workshop too. `PreviewPeople.py` produces the review sheets and animated family preview in `docs/`.

Only small published atlases are served. Original working art stays outside `public/`. The scene image cache retains at most 192 MiB of recently used decoded images, apart from a single oversized requested image; it releases resolved loading promises as well. The renderer keeps no second permanent reference to native atlases and can reload evicted costumes. Only converted legacy previews have an additional cache, bounded to 24 entries. Costume changes share appearance lookups across walking, riding and fishing.
