# Island collections

The catalog contains 500 active bugs (100 each of spiders, mantises, butterflies, ladybugs and dragonflies) and 250 aquatic creatures. Each species has four animated poses; map sprites and detailed inspection sprites are separate exports of the same source artwork.

`prompts.json` records the built-in image-generation prompts and atlas row mappings. `Habitats.json` records the mantis, butterfly, ladybug and dragonfly enclosures; `HABITATS.md` records the spider enclosure and aquarium. The exact source PNGs stay here, outside the served website.

`ImportCollectibles.py` packs map art. `PrepareCollections.py` publishes inspection art and furnished backgrounds. The shared catalog is `src/world/Collectibles.json`. Each bug group has an exceptional 1/1000 within-group discovery; the aquarium’s Aurora dragonfish has the same exceptional rate. Ordinary species use weighted rarities. Bug categories are selected uniformly before the rarity roll, giving each group equal encounter chances. The earlier 70 spider varieties remain valid saved residents but no longer spawn.

Bugs appear in batches of three only after shaking a tree. Catches do not auto-respawn. At most nine are loose; tree cooldowns and expiry prevent crowding. Releasing a terrarium resident removes it from the saved collection, with future encounters rolled normally. Existing spider and aquarium saves remain valid.

Aquatic entries carry explicit freshwater or saltwater habitat fields in `Collectibles.json`. Pond catches cannot roll marine species, and ocean/coastal catches cannot roll freshwater creatures. There are 108 freshwater and 142 marine/coastal entries.
