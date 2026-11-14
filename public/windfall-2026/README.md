# Windfall — The Island Reimagined (unreleased graphics development)

Windfall is a **playable original third-person 3D island experiment** for the Coastal Portfolio. It is **not** a remake of a Nintendo game and does not use Nintendo meshes, art, sound, music, maps, or game content. Its eventual target is the visual craft, environmental depth, character quality, and fantasy atmosphere of a modern high-end adventure-game remake.

**Do not publish this stage as finished.** The current visible world remains far below the requested 2026 remake-quality art benchmark. The existing public `/world` portfolio experience must remain untouched until independent visual, technical, and licensing review.

## Local development

Run a static server within `public/windfall-2026/`:

```sh
python3 -m http.server 3001
```

Open `http://127.0.0.1:3001/`. WASD / arrow keys move, Shift runs, dragging orbits the camera, and scrolling zooms. Touchscreens have a joystick and Run. The procedural scene can work directly from `index.html`, but the new self-hosted GLB art models require HTTP(S) because browsers restrict local-file fetches.

This preview has **no hosted server processing**, external asset CDN, user account, subscription, or paid graphics provider. All currently staged models are original and self-hosted.

## Graphics work staged so far

- Walkable coastal fantasy island with paths, foliage, cliffs, harbor, village, workshop, fountain, and mountains
- Triplanar procedural surface materials, a terrain-aware water shader, and a directional sunlight shadow map
- A **stabilized higher-resolution near-field shadow cascade** for the player's surroundings, retaining a broader island-wide shadow map
- Animated hero casts a dynamic silhouette shadow; low-cost fallback for software WebGL
- **New WebGL2 glTF/GLB asset pipeline** supporting embedded PBR color, normal, and metallic/roughness textures, alpha-masked leaves, shared model instances, sunlight shadows, and model collision boundaries
- Four original authored asset families: weathered standing stone, broadleaf tree, detailed timber cottage and harbor workshop, each with embedded PBR textures and reproducible generators. Five cottages and two workshops replace the previous procedural house geometry, with independent fallbacks on partial model failures.
- Chromium software WebGL integration verified with all four assets loaded, and again with each building model deliberately failing to load; original house geometry is used only for the failed family. GLB format/provenance and collision checks also pass.

See [ASSET_PIPELINE.md](ASSET_PIPELINE.md) for the details, limits, license policy, and **unmet release gates**, and [GRAPHICS_ROADMAP.md](GRAPHICS_ROADMAP.md) for the broader high-fidelity art plan. The hero, tower, many terrain meshes, and other scene elements remain procedural placeholders rather than production art. The cottage and workshop models are now textured authored geometry, but they are still prototype-grade relative to the requested modern remake fidelity.

Run `node verify-assets.cjs` to verify the bundled GLB structure and rights metadata. Rebuild original GLBs with the scripts under `tools/` using Python, NumPy, Pillow, and trimesh. These dependencies are for **asset authoring only**, not playing the game.

No original files from the previous unreleased local session were recovered. This is a clean, separately versioned replacement.


**Forest checkpoint:** added a reusable original PBR mountain conifer with cutout foliage, branch modeling and sixteen grounded forest placements. The procedural landscape remains the fallback and is not yet remake-level realism.
