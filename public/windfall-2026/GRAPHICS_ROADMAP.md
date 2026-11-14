## November 14 — verified photogrammetric mossy rocks, staged

- Imported a physically measured, photogrammetric six-stone set `rock_moss_set_01` by Kless Gyzen (Poly Haven, **CC0-1.0**), converted offline from source glTF and four dependencies into a **2.25 MB, approximately 63K-triangle self-contained GLB**. Verified source MD5 hashes and final SHA256 are saved at `models/windfall-cc0-mossy-rock-set.SOURCES.json`.
- The independent source-model import and geometry budget check passed. Added three discrete instances to woodland and village-edge routes at terrain height; the render and shadow pipelines share the same authored PBR material and self-contained local model.
- Extended asset integrity and browser tests from thirteen to fourteen model families, checking the imported rock-set author/license, original source URLs, hashes, and actual WebGL model-loading status. Full browser QA and screenshot review still required for this latest milestone.
- This is **genuine CC0 captured natural detail** rather than invented procedural triangles, but it is a localized improvement. The majority of the world (including the lead character) is still visibly stylized. Do not publish, merge, or claim a 2026 remake-quality release.

## November 14 — architecture sculpting, material response and alpine geology (unreleased)

- **Fixed a real detailed-rendering crash:** both far and near shadow functions previously accessed a `const eye` defined only inside the animation frame. Chromium SwiftShader's full-quality view timed out before its ready marker. Both routines now receive the current camera explicitly, and source regressions cover calls and signatures; final in-browser validation is still required.
- **Original architecture GLBs rebuilt:** the cottage and workshop now use non-degenerate triangular gables and position-offset repeating UVs so roof and facade images do not all restart at the identical origin. Added original high and low stone corner quoins, damp limewash/mortar detail, carved roof verges and ridge cap flashing, small ivy and window lintels. Independent Python/trimesh building asset QA passed; binary models were committed to the isolated preview branch.
- **PBR authored-model material shader:** introduced subtle Fresnel-weighted sky/earth environment response, with material-aware skin wrap, hair-surface sheen and glazed window reflections. Cutout flower backlighting now preserves petal colors instead of applying a blanket green tint. Approximate analytic environment lighting, **not** true HDR image-based illumination, subsurface skin transport or physically captured material data.
- **Northern alpine relief:** added mountain-limited erosion spurs, drainage channels, clustered talus fans and elevation/slope-dependent stony frost. Compared actual terrain function evaluations against the previous build at five harbor/village/approach coordinates: heights remained unchanged there; high north peaks changed 0.5–1.2 world units as intended.
- **Testing:** new source-level contracts protect lowland terrain height, finite mountain samples, authored building gable geometry and PBR material response. Staged graphics CI runs Chromium software gameplay and a separate full-detail shader/material smoke test. A test passing does not mean visual equivalence to a 2026 AAA remake or physical hardware performance approval.
- **Next blockers:** professionally sculpted unique character faces/bodies and proper skinning/IK, production foliage canopy and cliff textures, higher-frequency terrain geometry with distance LOD, actual HDR reflection probes, GPU timings and hardware/motion art review. **Public release and merging remain blocked**.

## November 14 — material-specific character PBR and distant foliage draw budgets

- Regenerated all five original fictional characters with material-specific PBR normal maps and roughness: low-amplitude procedural skin pores, woven fabric threads, strand-direction hair grain, wrinkled leather, subtle iris fibers and brushed metallic highlights. These are self-authored procedural textures, **not photoreal reference skins or captured fabric scans**.
- Added conservative camera-distance visibility ceilings for tiny forest-floor clusters (hazel 49, fern 37, wildflower 34 world units, extended by each mesh's bounding radius). The authored renderer filters these in camera and sunlight-depth passes, without changing buildings, trees or characters. This reduces submissions of distant low-value detail; it is not geometric mesh LOD or an approved GPU optimization budget.
- Added regression contracts for the new texture authoring channels, per-height wind, and the exact mathematical visibility boundary. Existing ten-model-fallback gameplay and newer thirteen-model loading tests still apply.
- The new character rebuild and original broadleaf/undergrowth asset builds passed independently. A fresh Chromium software and full-detail smoke test for the combined draw-distance changes has been started. **Full acceptance is not implied; release HOLD remains.**

## November 14 — coastal understory and scanned-bark forest checkpoint

**Development branch only. Keep the public site and release gate unchanged.**

- Created reproducible, original `tools/build_understory.py` with three **real textured GLB mesh families**: hazel shrubs (3,600 triangles each), arching fern clusters (1,368 triangles each), and wildflower patches (616 triangles each). All original textures are embedded, with PBR normal/roughness and alpha silhouettes; no downloaded vegetation models or runtime external services.
- A new automated asset-authoring workflow generated and validated all three GLBs with NumPy/Pillow/trimesh, then committed them to the isolated graphics branch. Its mesh-count, bounding, triangle, attribution and binary-size checks passed.
- Grounded and varied 40 new instances in the existing island, with 12 hazel, 14 fern and 14 wildflower clusters; the shrubs have small grounded collision proxies while soft foliage remains walk-through. Color and sunlight shadow passes consume the same new GLBs.
- Changed the original WebGL2 color and depth vertex shaders to bend alpha-masked plants **relative to each mesh's actual height**. Motion scales down on small plants and is preserved in depth shadows; additional regression contracts verify height-aware wind and all three model families.
- Made `tools/build_tree_asset.py` reproducible outside the old developer machine and upgraded the original broadleaf's bark PBR color/normal relief using the **locally stored and verified CC0 Bark Brown 02 photograph by Rob Tuytel (Poly Haven)**. The independent GitHub Actions build of that GLB passed and commits only to the preview branch. Mixed-component attribution is recorded in `asset-manifest.json`.
- The initial thirteen-model Chromium software-mode scene QA passed, including fallback player, movement and WebGL checks. Re-run the full-detail browser test against the final broadleaf scan and inspect both the wide and close-up screenshots. **Do not claim real GPU performance, painterly botanical polish or remake fidelity** from those automated tests.
- **Future asset priorities:** detailed canopy silhouette and leaf texture variants, mesh LOD and batching, physics-driven ground cover, photographic rock displacement, accurate tree roots, high-end houses, truly modeled human facial/skin material and skeletal animation. The screen remains visibly stylized and below 2026 cinematic-art expectations.

## November 14 — five-character original cast and articulated village inhabitants

**Status: original model source, exported GLBs and live browser integration staged on preview branch; not approved for release.**

- Extended the existing original textured wayfarer generator into five reproducible mesh variants: `windfall-wayfarer`, `windfall-companion-a`, `-b`, `-c` and `-d`. A dedicated GitHub Actions job regenerates all five in Python (NumPy/Pillow/trimesh), checks glTF node pivots, distinct height order, triangle counts and binary budgets, and commits GLBs only to the isolated unreleased branch. The latest regeneration completed successfully.
- Introduced varied height, shoulder width, head proportions, cloth color, skin/hair values, beard choices and short/long/braided/tousled hair. The hair now uses fitted tapered lock lofts rather than a ring of spheres.
- Upgraded the facial silhouette with a single continuous cheek/brow/jaw mesh, refined upper eyelids, less intrusive facial forms, and separate finger/thumb meshes on both hands. All five variants share reusable pivot hierarchy, but are distinct generated geometry, **not real-world likenesses**.
- Placed four original companions around the market, fountain and village routes. They have their own static collision boundaries, continuously updated conservative frustum bounds, animated idle arms, head turns, breathing and cape reactions, and participate in near/far sunlight shadows.
- Expanded graphics QA from six to ten model families, including loading and fallback checks for all five character variants. On the preceding character checkpoint the Chromium SwiftShader software and full shader/material jobs both passed with ten GLBs loaded and no reported JS or WebGL errors. A second mesh pass has since been built; its revised close-view snapshot and final verification remain necessary before accepting this checkpoint.
- Increased rendered model count substantially; **real hardware FPS, memory and mobile thermal budgets are not yet measured.** Prioritize LOD/mesh batching and true per-character artistry rather than interpreting passing SwiftShader checks as performance approval.
- **Next heavy art work:** unique artist-sculpted heads/faces and wardrobe per character with actual reference approval, skinning/IK, gait transition blending, higher-fidelity tree canopy and shrub models, true photographed rock/earth displacement, global illumination and environment reflection. Do not publish or merge the prototype.

## November 14 — photographed local surface scans and full-detail browser QA

- Integrated three **verified CC0 scanned material sources**, all by Rob Tuytel at Poly Haven: Forest Ground 01, Cobblestone Floor 04 and Bark Brown 02. Generated 384×384 RGBA color + subdued displacement tiles using verified MD5 downloads, with exact SHA256 of resulting files and source URLs recorded in `materials/SOURCES.json`. The files are self-hosted; the browser never calls Poly Haven.
- A small asynchronous atlas-upgrade layer replaces only material slots 0, 1 and 2 when local tiles are available. The previous deterministic procedural atlas remains the fallback for offline, missing files and software-quality rendering. This is **not yet** a complete metallic-roughness/normal/IBL scanned material workflow; those are still outstanding.
- Added a source-and-provenance verifier that checks all three committed PNGs' dimensions, encoding and SHA256.
- A separate Chromium SwiftShader test exercised the **full-detail** shader path (without the normal software-quality downgrade). It loaded all six original GLB model families and all three local scanned textures, issued 103 authored color draws with 41 culled model sections, 220 shadow submissions with 32 culled, and reported zero WebGL and JavaScript errors. This is a software-rendered compatibility test, not a hardware FPS claim.
- The new QA captures both the in-game layout and a HUD-free desktop-aspect frame for independent visual review; screenshots and diagnostic JSON are retained as GitHub Actions artifacts, not used as release approval.
- **RELEASE STILL BLOCKED.** The actual photographed textures improve material variety, but do not change the underlying need for authored hero/family character sculpts and rigs, professional foliage/cottages/cliffs, better ground topology, indirect illumination, measured hardware budgets and final art direction.

## November 14 — Village art direction rebuild (unreleased)

This iteration responds to the actual Chromium QA screenshots, where repetitive white paving, bright floating lamps, and stone-white pergola beams overwhelmed the scene. All work is confined to `feature/windfall-2026-graphics-preview`.

- **Roads:** replaced identical tiny white tile courses with wider, irregular polygonal stone footprints, subdued earth-toned stone colors, shallow edge geometry on the detailed renderer, and continuous terrain-following earth roadbeds. The software renderer now fills each complete eight-sided polygon instead of using a four-wedge diamond shortcut. Human-scale paving is still procedural and needs production surface scans.
- **Walkway:** re-authored the Glassmaker's Walk as a dark timber trellis with stone footings, diagonal knee braces, sparse hanging foliage, weathered crossbeams and considerably smaller enclosed amber lamps. This replaces the highly repetitive white colonnade that dominated the earlier preview.
- **Light sources:** reduced glowing streetlight geometry and overbright emissive terms in software/hardware shaders; removed the incorrect emissive treatment from the fountain's water surface.
- **Market:** replaced the bare flat-market canopy with original pitched fabric panels, seams, timber supports, plank counter, woven basket bands, subdued produce and crates.
- **Landscape visibility:** added low-cost software-renderer ground color variation and reduced the overly dark full-screen vignette. These remain stylized color treatments, not a photogrammetry-grade environmental material pipeline.
- **Verification:** the first village pass and the roadbed pass both passed the GitHub Actions Windfall source/GLB and Chromium SwiftShader movement/fallback tests; six original GLB families loaded successfully, with no browser JavaScript errors. The final market/vignette version requires a fresh successful run and screenshot inspection before acceptance.
- **Release HOLD:** although legibility and scene composition are improved, this still falls substantially short of cinematic 2026 adventure-game realism. Missing: production-quality character sculpts (including full family), skinning and captured/retargeted animation, high-density authored geology/vegetation, photographic PBR surfaces, global illumination, GPU and mobile validation. No merge, production deployment or claim of visual approval.

## November 14 — coherent authored-model atmosphere, camera, character, coast and geology

This is an **unreleased engineering checkpoint**, not a 2026-remake-quality acceptance.

- **Coherent lighting:** the authored glTF PBR fragment shader now shares the procedural terrain's moving, world-space cloud-occlusion field and the same height-sensitive atmospheric fog. Cloud drift was increased from nearly imperceptible offsets to slow visible motion; low-quality/software mode omits the extra cloud field.
- **Foliage and shadows:** alpha-masked authored foliage uses the same deterministic, modest world-position sway in both the color and depth passes, with elapsed time wired through each pass. PBR ORM red-channel ambient occlusion and a restrained backlit leaf-transmission term enrich existing original plant assets without downloading external textures.
- **Third-person camera:** exponential frame-independent following, look-target smoothing, and a multi-sample eye-line sweep against terrain and coarse authored model colliders reduce cliff/structure clipping. It is not yet a full camera physics, navigation or occlusion system and must be visually assessed around narrow alleys.
- **Wayfarer movement:** idle breathing, stride timing adjustments, arm counter-swing, turning lean, head counter-turn, and cape follow-through are driven through the original named glTF hierarchy. This remains articulated procedural motion, **not skin-weighted skeletal animation**.
- **Atmosphere and shore:** continuous directional sky-cloud coordinates (avoiding the azimuth seam), sunlit haze, brighter cloud rims, Fresnel-dependent sampled-sky sea reflection, near-camera capillary ripples, shallow-water scatter and softer horizon blending.
- **Terrain:** longer-wave erosion changes to the northern mountain ridgelines; 155 placeholder ellipsoid boulders were changed to uneven layered mesh rings with corrected outward-facing triangle normals. Terrain and collision queries still share the same height function.
- **Verification so far:** both modified JavaScript files parse; seven selected shaders were manually checked for balanced GLSL source delimiters, and the repo now includes a 12-shader source-contract suite, cloud/wind/shadow plumbing assertions, camera terrain/building test cases, and license-provenance checks for six GLB families. The suite passed in an isolated in-memory execution against the current branch sources; a hosted/browser execution of the committed test file is still pending.
- **Still unverified:** actual WebGL2 shader compilation and screenshots for these latest changes, hardware FPS and frame-time distributions, cliff obstruction QA, character/terrain proportions, mobile runtime, memory, and long sessions.
- **Release gate: CLOSED.** Five distinctive professionally modeled family members, actual skinning and animation blending, authored biome/terrain art, filmic lighting/HDR environment reflection, visual composition and performance approvals are missing. Keep `/world` untouched and do not merge into main.

## November 14 — drifting world-space cloud shadows (unreleased)

- Added animated, world-space cloud occlusion to the high-quality terrain/prop sunlight shader: three broad low-frequency layers produce soft moving patches without screen-space sliding.
- Coupled diffuse and specular direct sunlight so cloud shade dims both consistently; indirect sky fill remains present beneath passing clouds.
- The software WebGL quality path skips the cloud calculations. This is a shader-level visual step, **not** volumetric clouds, a physically based sky, cinematic-quality lighting, or evidence of real-GPU performance.
- **Verification pending:** shader compilation and visual inspection on a real GPU, close-up character art, cloud consistency with authored GLB materials, and long-session performance. **Do not publish or merge.**

## November 14 — authored forest density and visible-only model rendering

- Kept the original, self-hosted PBR cottage and harbor workshop models, with per-family fallback geometry and rotated building collision volumes.
- Added conservative six-plane frustum culling to both imported-model color and shadow passes. Off-screen instances no longer submit their model meshes; model draw statistics are available for QA. An isolated WebGL2 test showed eight visible building sections when in view and zero visible/eight culled once moved outside the camera, with no GL error.
- Expanded authored broadleaf-tree placements from 7 to 27 and standing-stone placements from 6 to 18, biased toward the outer forest and away from village paths; placements use varied size and rotation without duplicating model downloads.
- Full-island Chromium SwiftShader check reached the ready state with all four model families loaded, and no reported JavaScript exceptions. A real graphics-card benchmark and high-resolution cinematic visual approval are still outstanding.
- **Release gate remains CLOSED:** authored assets, facial likeness/animation, environmental detail, physically based sky and water, volumetrics and cinematic polish are not yet comparable to a polished 2026 fantasy remake.

## Current checkpoint — original village architecture replacement

- Two new original PBR GLB building families: timber cottage (~6,934 triangles) and harbor workshop (~6,978 triangles), seven placed instances. These replace the old primitive houses when both assets load successfully. The previous house geometry remains available as a runtime fallback.
- Original architecture generator checked in at `tools/build_architecture.js`, with no external dependencies. No Nintendo or other franchise-specific meshes or textures are included.
- Modeled overlapping roof tiles, stone foundations, structural beams and braces, gable details, doors and hardware, window depth, shutters, steps, roof gutters and chimney courses; baked texture, normal and ORM maps included.
- Added optional rotated building collision boxes and model-loader success checks. Isolated and complete-scene software-WebGL2 smoke checks confirmed the model families load, but this does **not** demonstrate AAA visual quality or target GPU performance.
- **RELEASE REMAINS BLOCKED**: hero and family need professional sculpting, rigging and animations; environment requires considerably better authored materials, trees, cliffs and photoreal lighting. Do not merge or publish as the requested 2026 Ocarina of Time remake experience.

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

## Current checkpoint — authored models and local high-resolution shadows

- Added a stabilized near-field sunlight shadow map around the player, combined with the existing island-wide map. The walking character now casts an actual moving mesh shadow in the close cascade. Hardware-quality startup compiled and initialized in software-WebGL simulation, but GPU-specific frame rates are unmeasured.
- Added a self-hosted glTF 2.0 binary model renderer with support for embedded base-color, tangent-space normal, and metallic-roughness texture maps, alpha-cutout foliage, node hierarchies, model instancing, ground-height placement and model collision proxies.
- Added two fully original 3D **pipeline test assets**: a 5,120-triangle weathered standing stone and a detailed branched broadleaf tree with independent bark and leaf materials. All generated geometry and maps have reproducible Python source scripts; no third-party game assets were incorporated.
- Verified both model families load in WebGL2 without JavaScript errors, plus a depth-only shadow framebuffer and PBR model-draw smoke test. The manifest enforces explicit licensing/provenance and local model paths.
- **Do not release.** These remain authored procedural prototypes, not high-fidelity scans or AAA character and environment art. The release blockers are especially the rigged family, buildings, forest canopy/rocks at hero distance, lighting/indirect illumination, camera navigation and real-GPU performance. See `ASSET_PIPELINE.md` for format and rights details.

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