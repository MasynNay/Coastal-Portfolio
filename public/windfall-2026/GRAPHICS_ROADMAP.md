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