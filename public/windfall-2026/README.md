# Windfall — The Island Reimagined (unreleased graphics development)

Windfall is a **playable original third-person 3D island experiment** for the Coastal Portfolio. It is **not** a remake of a Nintendo game and does not use Nintendo meshes, art, sound, music, maps, or game content. Its eventual target is the visual craft, environmental depth, character quality, and fantasy atmosphere of a modern high-end adventure-game remake.

**Do not publish this stage as finished.** The current visible world remains far below the requested 2026 remake-quality art benchmark. The existing public `/world` portfolio experience must remain untouched until independent visual, technical, and licensing review.

## Local development

Run a static server within `public/windfall-2026/`:

```sh
python3 -m http.server 3001
```

Open `http://127.0.0.1:3001/`. WASD / arrow keys move, Shift runs, dragging orbits the camera, and scrolling zooms. Touchscreens have a joystick and Run. The procedural scene can work directly from `index.html`, but the new self-hosted GLB art models require HTTP(S) because browsers restrict local-file fetches.

This preview has **no hosted server processing**, runtime asset CDN, user account, subscription, or paid graphics provider. The fourteen self-hosted GLB families combine thirteen original Windfall model families with one separately credited CC0 photogrammetric mossy-rock set by Kless Gyzen (Poly Haven); the broadleaf's CC0 scanned bark is also attributed. Five original fictional adventurers remain central. Three separate **CC0 scanned ground and bark textures** are now used for additional local surface detail; they were sourced from Poly Haven and their authors, original URLs, and SHA hashes are preserved in `materials/SOURCES.json`. No network calls to Poly Haven are made while playing.

## Graphics work staged so far

- Walkable coastal fantasy island with paths, foliage, cliffs, harbor, village, workshop, fountain, and mountains
- Triplanar procedural surface materials, a terrain-aware water shader, and a directional sunlight shadow map
- A **stabilized higher-resolution near-field shadow cascade** for the player's surroundings, retaining a broader island-wide shadow map
- Animated hero casts a dynamic silhouette shadow; low-cost fallback for software WebGL
- **New WebGL2 glTF/GLB asset pipeline** supporting embedded PBR color, normal, and metallic/roughness textures, alpha-masked leaves, shared model instances, sunlight shadows, and model collision boundaries
- Thirteen original authored GLB families, plus one attributed CC0 mossy-rock model family: five individual fantasy adventurers (one playable wayfarer and four animated village companions), standing stone, broadleaf tree, mountain conifer, timber cottage and harbor workshop. The cast has independently authored size, clothing palettes, hair silhouettes and facial elements from a reproducible generator. The companions have idle head, arms and cape motion. Five cottages, two workshops and sixteen authored conifers remain in the world. These are **original fictional characters**, not digital portraits or claimed likenesses of actual people, and still **not** skin-weighted or high-resolution hero sculpts.
- GitHub Actions checks all fourteen staged GLB model families, their provenance, the missing-player fallback, movement, four companion statuses, WebGL2 and JavaScript errors. A full-detail SwiftShader pass separately checks that the bundled model families and all three local CC0 ground/bark textures are loaded with no WebGL errors. Model construction is exercised by the isolated five-variant authoring job. This is **not** a real GPU FPS or cinematic art acceptance.

## Three new authored understory families and scanned-bark broadleaf

Forty additional plant clusters now fill selected village and forest-floor locations: twelve leafy hazel shrubs, fourteen arching fern clusters, and fourteen pastel wildflower patches. Each family is original multi-branch modeled geometry with embedded PBR color/normal/roughness maps and cutout foliage, not billboard photographs. Their geometry is regenerated with `python tools/build_understory.py all`; [understory CI](../../.github/workflows/windfall-understory-assets.yml) checks the output and commits it only to the unreleased branch. Placement, scale, orientation, terrain anchoring, and sparse solid-shrub collision proxies are defined in `asset-manifest.json`.

The WebGL2 vertex and shadow programs now normalize wind bending by **each mesh's actual height**, so low ferns and flowers sway without suffering the large displacement appropriate only to full-sized trees. Distant small vegetation is conservatively omitted using a per-family camera-distance cutoff (49 units for hazel, 37 for ferns, 34 for flowers), with the same bounds in color and sunlight shadow passes. This is distance visibility culling, not simplified LOD meshes, and is not a substitute for real hardware profiling. The broadleaf tree generator no longer contains an absolute, machine-specific build path and can embed the locally verified CC0 Bark Brown 02 texture from Rob Tuytel, Poly Haven, with a matching derived height-normal. The bark is clearly attributed in the asset manifest and source scan ledger, while the branch geometry and leaf imagery remain original. The original procedural bark remains a fallback when no scan is bundled.

These improvements add botanical variety but do not constitute realistic high-density forestry, scanned vegetation cards, wind simulation, skinning, or an AAA art-quality acceptance.

## Verified CC0 photogrammetry: real mossy forest stones (staged)

A separate authored-model import now uses Poly Haven's **Rock Moss Set 01**, a six-stone photogrammetry asset by **Kless Gyzen**, released under **CC0-1.0**. The imported file is a 2.25 MB offline GLB with approximately 63,000 actual sculpted triangles, locally bundled color/normal/roughness textures, and three selectively placed terrain-grounded instances in woodland and away from main navigation paths.

The reproducible `tools/import_cc0_rocks.py` import verifies all source files against Poly Haven's listed MD5 hashes, records their SHA256 hashes, validates the final GLB and saves an exact provenance ledger at `models/windfall-cc0-mossy-rock-set.SOURCES.json`. The [staged scan workflow](../../.github/workflows/windfall-cc0-rock-scan.yml) passed independently. The site **never downloads this model at runtime**. The imported scan is not original Windfall sculpting; its creator is explicitly credited.

High-quality natural details in a few locations do not make the surrounding procedural terrain and characters photorealistic. This preview still requires substantial environment and character artwork before public release.

## Sculpted buildings and mountain geology (staged)

The original timber cottage and harbor workshop model builder now emits correct triangular gables, staggered foundation masonry, less repetitive roof/wall UV sampling, roof verge boards, cap flashing, window drip ledges, weathered plaster and sparse ivy. `python tools/build_architecture.py` rebuilds both locally; the [unreleased architecture workflow](../../.github/workflows/windfall-architecture-detail.yml) validates triangle and texture budgets and commits the two original GLBs only on the isolated branch.

The terrain height function adds erosion-cut spurs and drainage to the northern mountains, with clustered talus and restrained alpine frost. Harbor and village terrain samples are regression-tested so the playable routes do not shift unexpectedly.

The glTF material shader now uses a lightweight analytical sky-ground reflection approximation and differentiated skin, hair and glass responses. It is still **not** a true ray-traced global illumination, subsurface-scattering skin or realistic scanned-face material system; the five fictional character models need a substantial artist-led quality jump.

## Five-character original fantasy ensemble (staged)

The playable wayfarer now has a continuous fitted head-and-jaw shell, thinner eye contours, separate fingers and swept hair-lock geometry. The five generated meshes have also been rebuilt with **material-specific original PBR textures**: finer skin pores and pigmentation, woven fabric normal detail, long hair strands, leathery creases, subtle iris fibers and brushed metallic relief. These are procedural authoring maps, not scanned or captured human skin. Four further GLBs introduce different body scale, head-to-body ratio, beard choices, textured clothing and hairstyle profiles. They stand at intentionally separate village locations and use the runtime's original named-pivot idle animation rather than being immobile statues.

Run `WINDFALL_CHARACTER=windfall-companion-b python tools/build_wayfarer.py` to regenerate one model; run all five `WINDFALL_CHARACTER` values in the dedicated [character asset GitHub workflow](../../.github/workflows/windfall-character-assets.yml) to rebuild the cast. All assets are generated with NumPy, Pillow and trimesh; runtime uses WebGL2 without a subscription.

**Limits:** no artist-approved human likenesses, skin-weighted skeletal animation, face capture, motion capture, proper cloth simulation, subsurface skin scattering or high-resolution scanned character textures. These are currently hand-generated fantasy companions, not realistic replicas of the user's family.

## Rebuilt village and local photographic materials

The latest unreleased village art pass includes larger irregular flagstones over continuous dirt paths, a timber-framed Glassmaker's Walk with smaller enclosed lamps, hand-built market displays, a darker fountain basin and less aggressive color/vignette treatment.

For actual photographed surface color and displacement, `materials/forest-floor-rgba.png`, `materials/cobblestone-rgba.png` and `materials/tree-bark-rgba.png` are generated locally from independently verified Poly Haven **CC0** sources. Rob Tuytel authored the three photographed texture assets; see [materials/SOURCES.json](materials/SOURCES.json). All images ship as local files. Rebuild intentionally with `python tools/build_scanned_materials.py` and Pillow; the default site does not fetch or invoke the public Poly Haven API.

These scanned tiles are **color + height-alpha inputs**, not a complete high-end physically based material stack. Accurate normal maps, roughness, indirect environmental illumination, character sculpts and professional terrain art remain release blockers. If a scan is absent, the deterministic procedural atlas continues rendering.

Use `npm run verify:windfall-graphics` at repository root for scene source contracts, six GLB integrity checks and scanned-PNG SHA/provenance checks. GitHub Actions also runs Chromium software-mode movement/fallback tests and a separate full shader-path material test. The full path can be exercised locally with `?quality=full` for diagnostics; forcing SwiftShader into this path does not measure hardware performance.

See [ASSET_PIPELINE.md](ASSET_PIPELINE.md) for the details, limits, license policy, and **unmet release gates**, and [GRAPHICS_ROADMAP.md](GRAPHICS_ROADMAP.md) for the broader high-fidelity art plan. The hero, tower, many terrain meshes, and other scene elements remain procedural placeholders rather than production art. The cottage and workshop models are now textured authored geometry, but they are still prototype-grade relative to the requested modern remake fidelity.

Run `node verify-graphics.cjs` for JavaScript shader-source, lighting/wind/camera regression contracts, followed by `node verify-assets.cjs` for the bundled GLB structure and rights metadata.

**Current graphics development:** authored-model sunlight now shares atmospheric cloud drift and terrain-height fog with the procedural landscape; alpha-cutout foliage sways and casts matching wind-displaced shadows. The wayfarer has idle breathing, banking, more natural stride and cape motion. The follow camera samples terrain/building obstructions and eases its movement. Sky clouds, sea reflections, near-field ripples, northern ridge erosion, and sculpted faceted boulders have received additional original work. None of this is an accepted photoreal 2026 game remake; no live GPU measurements or latest-shader screenshots have yet been approved.

Rebuild original GLBs with the scripts under `tools/` using Python, NumPy, Pillow, and trimesh. These dependencies are for **asset authoring only**, not playing the game.

No original files from the previous unreleased local session were recovered. This is a clean, separately versioned replacement.


**Forest checkpoint:** added a reusable original PBR mountain conifer with cutout foliage, branch modeling and sixteen grounded forest placements. The procedural landscape remains the fallback and is not yet remake-level realism.
