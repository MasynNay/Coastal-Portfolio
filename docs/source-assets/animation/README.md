# Character animation sources

The built-in image generation tool produced the new artwork. `Jobs.json` records
the exact prompts and row assignments; `Minish.json` records the costume redraws.
`references/` and `keys/` retain the corrected original poses used as references.
`SideRuns.json` records the complete replacement side-running cycles: distinct
foot contact, tucked knee, passing leg and airborne poses, rather than repeating
the old extended-leg silhouette. Each left cycle supplies its mirrored right cycle.

The general expansion keeps four existing key poses and adds four authored
in-between poses. Opposite directions are constructed from the same audited
side, so a character cannot reverse facing halfway through a sequence. Minish
Masyn has complete new eight-pose walking, running and ocarina sheets. The
welcome wave has twelve poses, recorded separately under `actions/`.

`People.json` identifies the selected sources and any direction corrections.
The publisher keeps foot anchors, family proportions and the original total
cycle duration. `animation.js` and the action renderers use each atlas’s column
count instead of assuming four poses. Artwork is loaded on demand so longer
sheets do not all have to be decoded before the island opens.

To register replacement batch results, provide a JSON object mapping the job
names to local PNG files:

```sh
python3 scripts/ImportAnimation.py /tmp/animation-results.json
python3 scripts/PreparePeople.py
python3 scripts/CleanSprites.py --write
python3 scripts/VerifySprites.py
python3 scripts/VerifyDirections.py
```

The source images stay outside `public/`; only packed, palette-limited game
atlases are served to visitors. Keep source files when rebuilding artwork.
