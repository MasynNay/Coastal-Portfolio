# Windfall — 2026 authored-model pipeline (private staging)

This branch is **not approved for release**. The earlier procedural island still has obvious low-fidelity characters and buildings; the goal is an original high-quality fantasy-adventure island, not Nintendo assets or a claim of AAA equivalence.

## What this checkpoint changes

- Introduces a separate WebGL 2 glTF 2.0 **GLB** mesh renderer with embedded PBR base-color, tangent-space normal, metallic/roughness and emissive maps.
- Supports mesh indices, multiple triangle primitives/materials, node hierarchies and TRS transforms, material alpha masking, two-sided leaves and alpha-aware shadow casting.
- Provides a low-contrast metallic-roughness/physically-inspired lighting path, atmospheric distance blending, and shared sunlight shadow cascades.
- Replaces abstract placeholder-only asset plumbing with **two original test models**: a weathered standing stone (5,120 triangles) and a branching broadleaf tree with alpha-cutout leaves. These are *pipeline validation assets*, not production-quality scans.
- Adds manifest-driven instancing, ground-height alignment and collision proxies; rejects external model URLs and records creator, license and provenance for every asset.
- Keeps the existing offline/no-CDN procedural world as a fallback if an asset fails to import; loading a GLB requires serving the page over HTTP(S), because browsers block local `file:` fetches.

## Runtime and file layout

The site loads `asset-pipeline.js` before `main.js`. At startup the authored-model renderer attempts to load `asset-manifest.json`, then pulls local `models/*.glb`. The entire optional stage can fail without stopping the procedural preview. Browser tests can inspect `document.documentElement.dataset.windfallAssets`, the number of successfully loaded model families.

Each entry in the manifest requires `id`, local `src` under `models/`, `creator`, `license` (`CC0-1.0`, `CC-BY-4.0`, or `OWNED-ORIGINAL`), `provenance`, and `instances` with finite positions. An optional `collisionRadius` gives cylinder collision against the moving character, and `grounded` positions are sampled from the shared island height field. Third-party model licenses must be reviewed individually; no offsite asset is fetched by the client.

### Supported model format

- glTF 2.0 binary `.glb`, one embedded binary buffer, PNG/JPEG/WebP embedded textures.
- Triangles only; PBR metallic/roughness workflow and alpha modes `OPAQUE`, `MASK`, `BLEND`; no skinning or animations yet.
- Not yet supported: Draco/meshopt texture compression, sparse accessors, external `.bin`/textures, morph targets, skeletal animation, HDR image-based lighting, KHR materials extensions.
- 32 MiB per GLB and 64 model families max. For production models: add LOD/instancing, KTX2/meshopt, and GPU-driven culling, then expand budgets based on measured devices.

### Source of included art

All four GLBs are **original assets generated for this project** from the included Python authoring scripts `tools/build_stone_asset.py`, `tools/build_tree_asset.py`, and `tools/build_architecture.py` using `numpy`, `Pillow`, and `trimesh`. Source geometry, leaf textures and PBR maps were procedurally authored; there are no Nintendo or third-party model or texture files in these GLBs. License metadata appears in the manifest as `OWNED-ORIGINAL`. This does not imply the art is sufficiently detailed for public release.

## Acceptance checks already exercised

- Chromium WebGL2 software path initialized with **both** model families and returned the `windfallAssets=2` readiness marker, without JS errors.
- A standalone framebuffer test rendered the tree model using **depth-only shadow pass** and PBR color pass; WebGL `gl.getError()` was `NO_ERROR` after both.
- Shader compilation succeeded for the eight existing environment shaders, including new near and far cascaded shadow sampling.
- Corrupted GLB header and a remote model manifest URL were both rejected as intended.

Software WebGL is a validation fallback, **not** a reliable performance benchmark for a modern discrete GPU. No real-GPU FPS numbers or 2026 graphical-quality acceptance claim is being made. Continue collecting consistent camera screenshots, motion checks and GPU timing on the target platform.

## Non-negotiable release gates

- Replace primitive hero and family meshes with original sculpted/retopologized characters, actual skeletal animation, facial and clothing material detail.
- Replace repeated primitive buildings, major trees and rock cliffs with high-fidelity authored assets and LODs. Test quality at walking distance, not only from aerial views.
- Upgrade to high-resolution fully PBR textures and believable global illumination/indirect light, high-quality foliage shadows and reflections. Validate under day/night lighting.
- Complete camera/building collision, portfolio room integration, accessibility, mobile controls, self-hosted distribution and clear attribution/asset rights records.
- Compare side-by-side against the requested **2026 remake-style** art target; no publish until the user explicitly approves the visual fidelity.

## November 13 architecture integration checkpoint

- New original source-authored PBR cottage and harbor-workshop GLBs, each with eight independent material groups and embedded base-color/normal/metallic-roughness textures. Original source and geometry-generation procedure are in `tools/build_architecture.py`.
- Five cottage and two workshop placements replace the corresponding house placeholders; the procedural fallback geometry is split into **two independent groups** so a partial model download failure does not render overlapping buildings.
- Architecture uses oriented rectangular collision proxies (rotation applied), in addition to the existing cylindrical collision radius for stones and trees.
- `tools/qa_architecture_integration.py` runs three browser smoke tests: all four assets present, only the cottage model unavailable, and only the workshop model unavailable. All cases must reach the first render with 0 JS errors and the expected status count.
- **Not release-ready:** production-quality interiors/entrances, accurate masonry/roof/wood materials, close-range silhouettes, original rigged family, environmental lighting, world composition, and real desktop-GPU profiling all remain outstanding.


## Original animated wayfarer (November 2026)

The optional `windfall-wayfarer.glb` is authored from scratch by `tools/build_wayfarer.py` (NumPy, Pillow, trimesh). It contains named pivots for torso, head, cape, arm, elbow, thigh, knee and boot articulation. The world computes a frame-driven walk/run pose by updating GLB node matrices, not rebuilding the character triangles every frame. This is hierarchical articulation, **not** full skeletal skinning or a photorealistic human. An older procedural character remains the fallback if the GLB fails to load.

Render checks: Xvfb/Chromium WebGL2 with SwiftShader. All five assets imported, `gl.getError()==0`, no page errors, and a visible movement change after W input. With the hero GLB intentionally unavailable, four assets imported, the fallback rendered and moved with no page/WebGL errors. `tools/qa_wayfarer.py` reproduces both checks. These QA results establish runtime stability, not hardware FPS or cinematic art quality.
