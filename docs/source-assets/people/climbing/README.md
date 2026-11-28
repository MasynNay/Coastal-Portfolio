# Playground climbing artwork

These three lossless source sheets contain the same five-by-six layout. Each
row is a character or outfit, with four rear-facing hand-and-knee climbing
poses followed by two front-facing summit cheers. The approved figures map
directly to `Appearances.json`; their world heights and costume identities are
unchanged.

| Source | Looks, top to bottom |
| --- | --- |
| `family.webp` | Masyn, Mi Shell, Ezra, Fallyn, Fitzgerald |
| `masyn-costumes.webp` | Airbender, woodland archer, trainer, wizard, ocean king |
| `hero-costumes.webp` | Hyrulian adventurer, Shadow Spider, Ladybug, Blue Spider, Panem Tribute |

Run `python3 scripts/BuildClimbing.py` to isolate the complete silhouettes,
remove detached alpha specks, apply one consistent scale per look, and export
the six grounded cells and revisioned manifest. No detached limbs or
overlapping characters are drawn at runtime. The same artwork is selectable
in the Sprite Workshop.

## Artwork reference and prompts

Source images were generated using the built-in image generation tool with
front-and-back contact sheets from the existing approved character atlases.
The shared brief requested a strictly spaced five-row, six-column transparent
atlas; four rear-facing reach/grip steps with alternating bent knees, then
one- and two-arm summit cheers facing forward. Every pose had to preserve
the original hair, face, clothing, palette, accessories and body proportions,
with clean separated silhouettes, no rope, no background and no labels.
The two costume sheets additionally referenced the finished family sheet to
keep grip positions and proportions consistent. Props are stowed for climbing.
