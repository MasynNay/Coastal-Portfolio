# Original-style character actions

Generated with the built-in image tool using the original family/costume art as identity, body-proportion and texture references. `Prompts.json` records exact prompts and input references. The character designs remain those from `../legacy/`.

`Surf-*`, `Fishing-*`, `Riding-*` and `Details-*` cover mounts, rod casting, bicycles, duck travel and expressions. `Action-*` covers outfit abilities and Mi Shell’s dollar bills. `Gliding` and `GliderTransitions` cover the airbender staff.

`PreparePeople.py` packs these into published atlases. Direction profiles are inspected per frame, then opposite views are built from verified poses. This corrects mixed-facing generated frames, including mounted frames whose rider and mount originally disagreed. Canonical exports are checked by `VerifyDirections.py`, comparing actual mirrored frame pixels.
