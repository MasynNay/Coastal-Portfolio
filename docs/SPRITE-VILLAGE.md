# The coastal sprite village

Game Mode is a 2D Canvas town at `/world`; `/world/sprites` opens the sprite workshop. The old world folder and unused 3D experiments have been removed. Their remaining source artwork was migrated before deletion; see `CLEANUP.md`.

## Movement, menus and rooms

`engine.js` owns input and simulation; `WorldMode.js` owns the visible React menus. The game uses the same biography, skills, projects and resume information as the main website. WASD/arrows walk, Shift runs, Space stops, E interacts, and Escape closes a panel. Help contains the movement instructions. The rectangular minimap sits at the bottom left and projects terrain, homes, pond, pier and player through the same actual world coordinates; its illustrated center pond shortcut arrives already surfing on an axolotl. Indoor fast travel arrives inside another home and opens its portfolio information. Doors enter automatically when approached.

The outdoor camera begins at 0.68 zoom. Room zoom is remembered separately. The short welcome animation appears once per browser tab and can be replayed from Help. All room artwork is clipped to its bounds, including floor seams above the zero row.

## Family routines and abilities

`ResidentRoutes.js` builds collision-aware itineraries sampled by `Roaming.js`: town walks, pond/ocean axolotl excursions, mounted fishing, bike rentals and visits to different homes. Kids spend most of their itinerary playing near the playground. Ocean routes use the pier opening and return to land through it. `NpcRides.js` reserves one rental at a time; player and NPC rides cannot overlap. NPCs stroll at 5.2 world units per second; the player walks at 8.5 and can run at 14. The controlled character never follows an NPC routine.

Masyn has seven selectable outfits, including his everyday hoodie and an airbender costume for the About room. Ezra's Shadow Spider, Fallyn's Ladybug and Fitzgerald's Blue Spider outfits are available manually and appear periodically on their NPCs. Fitzgerald's blue-and-black atlas uses only his own original sprite as reference.

Press Q, or the ability button, as Ezra/Fitzgerald to shoot a web. Their costumed NPCs also shoot approximately every 15 seconds while on foot. As Fallyn, Q throws a red-and-black yo-yo that returns along its string. Manual effects have short cooldowns and pause with menus. Masyn’s themed outfits have four-direction Q action sheets: a glider circle, ocarina with notes, returning trident, wand spell, Poké Ball throw and bow shot. These briefly plant his feet without clearing held-key state; movement resumes only if a direction is still held. `Abilities.js` shares timing and labels with the engine, action poses and UI. `AbilityEffects.js` draws their particles and projectiles. `Heroes.js` owns webs; `ActivityEffects.js` draws webs, yo-yo, hearts, tennis balls, leashes and peas.

## Animal play

`Ducks.js` moves Abby, Hulk and Bolt continuously between the pond and the southern bank. Duck menus offer peas, pets, a five-second chase and Exit. Feeding and pets reopen the menu. Chasing ends with normal control and a gentle return to wandering. Foot chases stay on land; mounted characters keep their axolotl pose in water. A wake appears only while a duck is swimming.

Dog menus offer fetch, pets and a five-second leashed walk. Fetch returns the ball; walks return to their starting point; their menu reopens afterward. `DogPlay.js` and `DuckPlay.js` share `AnimalPaths.js`. Travel, changing room/character, and disposal cancel activity without stale callbacks.

## Collections and fishing

Inventory contains **Terrariums** and **Aquariums**. The catalog has 500 active bugs (100 each of spiders, mantises, butterflies, ladybugs and dragonflies) and 250 aquatic creatures, including baby sharks, axolotls, turtles, shrimp and other aquatic life. Existing saved IDs remain valid.

Press E beside a tree to shake it. Three bugs fall onto collision-checked clear ground, with no ambient spawns or catch replacements. A tree rests for twelve seconds; no more than nine bugs remain loose, and undisturbed visitors leave after two minutes. Ordinary rarity rolls are weighted; Stardust has its own 1/1000 roll. Collected species can reappear, so the final few discoveries are still a challenge. Terrariums use separate backgrounds for spiders, mantises, butterflies, ladybugs and dragonflies. Release removes a saved resident without creating a free catch beside the player.

Fishing casts on the map, waits with dialogue dots, signals a bite, fades, and opens the result. Successful catches add species counts to Aquariums on this device. The catch table has 250 aquatic types and an independent 1/1000 Aurora dragonfish roll. Mounted fishing retains the axolotl; standing fishing has genuine left/right poses. The field guide supports search, rarity and category filtering, plus freshwater/saltwater filtering for aquatic finds. The bobber location chooses the pond or ocean/coastal catch pool before rarity is rolled.

## Town secrets and Mac Mode

Six mailbox props contain jokes and the original hidden arcade portals. Opening a letter deliberately reveals its contents; videos do not load before opening. About-room Friends trivia remains. The lodge now starts a persistent hunt for 20 visible, colored glass floats; the HUD badge opens the journal with named visits, secrets and float progress. The lodge includes the family’s Oregon coast story and links to the official Finders Keepers and Lincoln City Glass Center pages. Masyn's interaction with Mi Shell normally shows hearts, with a 1/20 chance of the playful arguing encounter.

Mac Mode's Games app and the arcade page share the game list, including Red Rescue Team EX, Sonic Advance 3, Liquid Crystal, Return of the King and the Shark Tale/Shrek 2 compilation. Only the selected iframe mounts. Games and Photos remain at the end of the dock.

## Artwork and maintenance

Published artwork is in `public/world/`; canonical art and full generation prompts are in `docs/source-assets/`. New collection art was generated with the built-in image tool as six ten-species atlases, then packed into individual transparent, palette-bounded files. `ImportCollectibles.py` preserves the sources and row mapping. The six retained legacy animals can be rebuilt from `docs/source-assets/legacy/` with `PrepareLegacyAnimals.py`.

Run `npm test -- --watch=false --runInBand`, `python3 scripts/VerifySprites.py`, `python3 scripts/VerifyWorldAssets.py`, and `npm run build` for validation. `src/world/README.md` maps the source modules to their UI behavior. The project contains no Three.js dependency or 3D model pipeline. All changes remain local until Masyn requests a push.

## Detailed collection views

`CollectionSprite.js` uses `CollectionArt.json`, separate from the small map sprites. `PrepareCollections.py` packs all current and retained species at inspection resolution, with four animated frames each; these larger images are only requested by collection views. A selector switches the active home/tank rather than mounting every enclosure. Furnished terrarium and planted aquarium backgrounds live in `public/world/collections/`, with source art and full prompts in `docs/source-assets/collections/HABITATS.md`. Both views support closer inspection, pausing and reduced motion.

The lodge’s “An adventurer’s essential item” letter reveals a reward hyperlink after opening; it leads to the requested video in a separate tab.

## Perimeter, lawn and playground

`Fence.js` supplies the rail artwork, solid collision rectangles and segment intersection for surf mounting. An axolotl can enter the ocean from the open pier; E cannot jump across the railing. The southern middle lawn uses the same grass as the other plots and has no tree/prop collisions. The playground has a matching wood-and-teal tunnel, climbing dome, seahorse spring rider and picnic table. The lower central grass plot stays clear. Acro and Mach bikes wait beside the playground for guided, collision-safe pond laps.

`Glide.js` plans a short complete circle before takeoff, using the walking collision predicate. Q in the airbender outfit animates takeoff, eight-direction flight and landing, restoring the exact origin when it ends or is cancelled. The camera stays centered on that origin during the circle. Entering About equips this outfit; the character picker also makes it available manually. See `source-assets/emerald/AIRBENDER.md` for sources and prompts.

## Mac system menu

`designs/MacMenu.js` adds the Apple menu with About this Mac, Back to Main Site and Game Mode. The separate About panel has playful Masyn-themed specifications; Escape, outside click and the close control dismiss it with focus returned to the Apple button. Arrow keys navigate the menu. The main website places Mac Mode before Game Mode.


## Character detail and activities

`PreparePeople.py` rebuilds the family, costume and action atlases from the original character designs. The current exports retain 96-pixel body detail and up to 128 colors, preserving world scale and directional fixes. The later chibi walking redesign was removed at Masyn’s request. The active source catalog is `source-assets/People.json`; exact action and costume prompts live beside those sources. Dedicated eight-direction running sources retain the original family identities and outfits; their wider strides, bent elbows and airborne phases are separate from walking. Nameplates use the family identity, independent of costumes.

Mailbox roots are generated from each building's real doorway, with the same right-hand offset and individual themed artwork. The pond's outer ring is shared by artwork and walking collision. The two bike rentals use one guided rider at a time, rounded collision-safe routes and exact return positions. Character changes, travel and cancellation restore the ride origin.


## Duplicate catches and narrow screens

Terrariums now save quantities by species, as Aquariums already did. Legacy bug ID arrays migrate to one resident per known ID; new catches increment the count and releases remove one resident at a time. `CollectionCounts.js` shares sanitization and quantity changes between both stores. `HabitatResidents.js` renders at most eight residents in separated lanes, shrinking groups progressively and adding subtle color variation. The full total is always saved and displayed, including quantities above the visual limit.

Phones and tablets have eight-way direction controls, a Run toggle and Stop button. A single tap walks to a location, a nearby double tap runs, and a two-finger pinch zooms without starting a walk. Fly destinations, fishing, surfing, outfit abilities, inventory and interactions all have visible touch controls. Mac windows fit smaller screens, its dock scrolls, and Photos supports swipes. Embedded arcade games supply their own emulator controls. Responsive previews are viewport checks, not a substitute for testing on physical iOS/Android hardware.

The welcome plays on every visit and remains until “Let’s explore” is selected. Its wave uses twelve authored poses. Inventory opens one Island Field Guide with separate Bugs & spiders and Aquatic life sections, each showing unique-species completion. Aquariums can release one caught resident to the sea; duplicate catches decrement by one and are saved immediately.


## Outfit tricks, directions and travel

The wand briefly turns a nearby NPC into a frog. A Poké Ball temporarily catches them before they escape. The woodland archer knocks an apple from their head. The ocarina outside passes through a short night and returns to daylight. `NpcTricks.js` pauses each affected NPC’s route clock and resumes it at the same point; `TrickEffects.js` renders harmless props, bursts and the night overlay. No collection or character identity is changed.

Original walking rows were visually audited. Mi Shell, Fallyn and Ladybug Fallyn have mirrored back-left rows where the source was facing right. Running has its own eight-direction cycle for all five people and all nine additional costumes. Both walking and running use sixteen-frame complete-body directional cycles published by `BuildPeople.py`; sources, prompts and remaining activity work are documented in `source-assets/people/README.md`. Selected costumes are layered onto the duck during flight and stay visible during pickup and landing. World heights are shared across skins and roles: Masyn 2.25, Mi Shell 2.15, Fallyn 1.85, Ezra 1.70, Fitzgerald 1.50.


The publisher now constructs canonical direction rows in the actual PNG files. Opposite walking views and four-direction actions use verified poses and deliberate mirroring. Per-frame profile choices repair mixed-facing casts and ensure mounted riders face the same way as their axolotls. `VerifyDirections.py` compares actual opposite-facing frame pixels. Image content versions force updated artwork to reload in canvas and CSS previews.

Each field guide includes a Collection progress menu: distinct species, total residents, remaining discoveries and per-category totals. Duplicate catches increase residents without inflating species discovery counts.

## South beach

The sandy shore sits south of the white fence, reached through the pier opening. Terrain, surf entry, collision and the minimap share `Coast.js` geometry. Animated foam washes onto the sand without moving the physical shore every frame. Footprints fade after 14 seconds and are capped at 96.

Use E or the touch action button near the sand bucket to build a castle, or near the spool to fly a kite. Kites follow the current person for 16 seconds; costumes stay unchanged. Fifty shell varieties appear in the Field Guide's Seashells section, with quantities, locked unknown portraits and weighted rarities including one super-rare variety. At most six shell pickups populate the beach, with delayed replacements away from the player.
