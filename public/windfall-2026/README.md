# Windfall — The Island Reimagined (unreleased graphics development)

Windfall is a **playable original third-person 3D island experiment** for the Coastal Portfolio. It is **not** a remake of a Nintendo game and does not use Nintendo meshes, art, sound, music, maps, or game content. Its eventual target is the visual craft, environmental depth, character quality, and fantasy atmosphere of a modern high-end adventure-game remake.

**Do not publish this stage as finished.** The current visible world remains far below the requested 2026 remake-quality art benchmark. The existing public `/world` portfolio experience must remain untouched until independent visual, technical, and licensing review.

## Local development

Run a static server within `public/windfall-2026/`:

```sh
python3 -m http.server 3001
```

Open `http://127.0.0.1:3001/`. WASD / arrow keys move, Shift runs, dragging orbits the camera, and scrolling zooms. Touchscreens have a joystick and Run. The procedural scene can work directly from `index.html`, but the new self-hosted GLB art models require HTTP(S) because browsers restrict local-file fetches.

This preview has **no hosted server processing**, runtime asset CDN, user account, subscription, or paid graphics provider. The six self-hosted GLB models remain original Windfall assets. Three separate **CC0 scanned ground and bark textures** are now used for additional local surface detail; they were sourced from Poly Haven and their authors, original URLs, and SHA hashes are preserved in `materials/SOURCES.json`. No network calls to Poly Haven are made while playing.

## Graphics work staged so far

- Walkable coastal fantasy island with paths, foliage, cliffs, harbor, village, workshop, fountain, and mountains
- Triplanar procedural surface materials, a terrain-aware water shader, and a directional sunlight shadow map
- A **stabilized higher-resolution near-field shadow cascade** for the player's surroundings, retaining a broader island-wide shadow map
- Animated hero casts a dynamic silhouette shadow; low-cost fallback for software WebGL
- **New WebGL2 glTF/GLB asset pipeline** supporting embedded PBR color, normal, and metallic/roughness textures, alpha-masked leaves, shared model instances, sunlight shadows, and model collision boundaries
- Six original authored GLB asset families: standing stone, broadleaf tree, mountain conifer, textured articulated wayfarer, timber cottage and harbor workshop. Five cottages, two workshops, and sixteen authored conifers enrich the prototype while remaining fully original and self-hosted. Each family has reproducible local generation scripts; the authored character remains an unskinned, mid-poly proof of concept.
- GitHub Actions verifies all six authored GLB model families, their provenance, missing-character fallback, character movement, WebGL2 and JavaScript errors. A separate full-detail SwiftShader test also confirmed all three local CC0 textures loaded with no reported GL errors. This is **not** a real GPU FPS or cinematic art acceptance.

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
