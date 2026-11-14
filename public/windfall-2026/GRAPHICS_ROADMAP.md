# Windfall: 2026 Remake Visual Quality Gate

**Status: R&D only, not approved to ship.** The current procedural WebGL scene is a compatibility prototype, not equivalent to a modern high-fidelity third-person adventure remake.

## Target visual production pipeline

1. Replace procedural hero with an original, high-quality anatomically proportionate sculpt, retopology, PBR skin/hair/garment maps, and optimized skeleton/animations. The full five-person family should have distinct rigs, proportions and clothing. Preview faces close up and at walking distance.
2. Replace primitive houses, pavement, cliffs, rocks, trees, and shoreline with authored meshes plus licensed, locally hosted scanned PBR materials (base color/normal/ORM), decals, trim sheets and geometry LODs. Do not copy Zelda meshes, maps, textures or characters.
3. Move shading to an actual physically based pipeline with material roughness/normal/metallic and filmic exposure, soft cascaded shadows, sky-based lighting, atmospheric perspective, contact shadows, and stable reflection/refraction for water.
4. Build an authored village, mountain pass, forest and harbor where camera-level composition reads well in all directions. Add dense foliage with wind effects, unique silhouettes, varied vegetation and careful collision/navigation.
5. Add animation blending (idle, start, stop, walk, run, turn), foot placement/IK, clothing secondary motion, water interaction, and camera collision.
6. Establish measured browser budgets on desktop/mobile; implement geometry and texture LOD, frustum culling and compression. Use photo references and screenshot regression with the exact same camera paths.
7. Replace old portfolio `/world` **only after** side-by-side visual approval. Keep `/world` intact during development.

## November 13–14, 2026 — Grounded shading and software movement QA

- **Terrain:** replaced tile-level material assignments with interpolated per-vertex sand, grass, and mountain-rock biome colors. Increased terrain tessellation for the hardware path.
- **Walkways:** replaced perfectly rectangular paving faces with irregular eight-corner stones, raised edges, stone relief and reduced the chalk-white appearance.
- **Materials:** fixed a material atlas that had been generated but never sampled. The hardware shader now uses world-space triplanar tile sampling and a separate atlas height field for micro-surface normal relief. Corrected overexposure after observing a washed-out hardware-quality simulation.
- **Sky and sea:** rebuilt the sky shader so sunlight follows a world-space sun vector rather than remaining fixed to screen coordinates. Shoreline color, foam and transparency now depend on a locally generated seabed heightmap instead of an arbitrary straight ocean band.
- **Software fallback:** introduced lower scene tessellation, reduced detail/foliage budgets, lower framebuffer resolution, and more efficient paving rendering while preserving the full hardware-detail route.
- **Movement:** removed a 45 ms frame-time cap that effectively froze travel when software rasterization was slow. Movement now consumes elapsed time with a bounded long-frame cap and substeps for collision against the sea.
- **Browser checks:** in Chromium's SwiftShader/WebGL2 renderer, all eight GLSL shaders compiled successfully; the village initialized without JavaScript or shader errors; desktop travel reached the harbor; the mobile-quality layout initialized with joystick and run controls visible. No real-GPU FPS claim is made.
- **Release gate remains CLOSED.** Although the surfacing and gameplay pipeline has improved, the houses, hero, foliage, cliffs and architectural meshes still use original procedural primitives. Cinematic graphics require original sculpted/retopologized/rigged hero and family models, authored high-detail environment meshes, genuinely sourced PBR base-color/normal/ORM maps, lighting upgrades and GPU performance measurements. No third-party production models have been imported during this pass.

## November 2026 procedural foundation hardening

- Changed repetitive paving-strip mesh into discrete offset stone courses with gaps.
- Replaced major balloon canopies with branching trees/leaf geometry, plus distant spruce silhouettes and human-scale undergrowth.
- Rebuilt sky, materials and water shaders with procedural surface detail and softened shadow sampling.
- Reworked the playable character's hoodie and head, moving limb proportions, and deterministic hair meshes.
- Added a soft contact shadow for the character and a walkable pier surface; fixed GPU dynamic buffer sizing and first-frame negative delta-time.
- Reduced static geometry from roughly 346k to 155k triangles for testing/performance. This is a prototype optimization and is **not** evidence that the realism target is met.
- Browser QA: tested the village and harbor in Chromium/WebGL2 software renderer with no shader or JS errors at tested size. High-fidelity art and physically based assets remain outstanding.

## Asset research

Potential license-compatible sources, subject to each asset's provenance and export validation: Poly Haven's CC0 scanned models/PBR materials (https://polyhaven.com/), Quaternius CC0 fantasy environments (https://quaternius.com/). Preserve license attribution/provenance in the repository even when optional under CC0. Avoid hotlinking external model CDN assets for production.

## Material/shader pipeline checkpoint

- Created an 8-material, self-contained deterministic texture atlas used by the WebGL2 shader (grass, stone, wood, foliage, plaster, roof, metal, sand).
- Added adaptive shadow map resolution (desktop/touch) and SwiftShader/software fallback to keep non-GPU browser rendering functional. Hardware WebGL2 retains the higher-detail material shader and PCF shadowing.
- Verified material shader compilation and startup for village and harbor in headed Chromium; mobile emulation exposed visible joystick and run controls and no JS/WebGL console errors.
- Known blocker: the renderer still uses procedurally constructed materials and character geometry. It **does not** meet the cinematic/remake fidelity gate. Replace these with genuinely authored PBR glTF models and source-license documentation; do not quietly swap in unlicensed or brand-owned meshes.
- Performance note: browser tests used SwiftShader software rendering. Real hardware FPS, animation smoothness, input latency and long-session stability need separate verification before any release.