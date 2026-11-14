# Windfall — The Island Reimagined

A playable, original third-person 3D environment intended as a **new graphics-preview foundation** for the Coastal Portfolio. Its art direction is inspired by the warm, adventurous feeling of modern fantasy adventure remakes. No Nintendo models, textures, music, maps, or game files are used.

## Run it

Open `index.html` in a modern browser, or use a local static server:

```bash
python3 -m http.server 3001
```

Then visit http://127.0.0.1:3001. (Run the command inside this folder.)

**Controls:** WASD or arrow keys to walk; Shift to run; click and drag to orbit the camera; scroll to zoom. On touchscreens, use the left joystick and Run button. The scene renders with WebGL 2. No dependencies, accounts, installers, image hosts, CDNs, or subscriptions.

## Included in this rebuild

- Walkable third-person character with heading changes and animated limbs
- Fully procedural coastal terrain, cliffs, mountain peaks, forests, grass, flowers, and rocks
- Original village, castle tower, arched gateway, fountain, glassmaker's walk, market, workshop, harbor, wooden pier, and sea arch
- Directional shadow map, color grading, atmospheric distance fog, individual roof shingles, procedural surface details, and golden-hour sky
- Animated water with overlapping wave frequencies, specular highlights, shoreline foam, and moving lantern light
- Responsive presentation and touch controls
- Seeded procedural placement so the visual layout is stable between runs

## Status

**Unreleased experimental branch. Do not deploy this in place of `/world`.** The player, terrain and props are generated from procedural mesh construction. The graphics still lack the high-quality authored/photogrammetry PBR models required for modern 2026 remake fidelity. See [`GRAPHICS_ROADMAP.md`](GRAPHICS_ROADMAP.md) for the production art pipeline and acceptance criteria. A self-contained procedural material atlas is present, but it is **not** a substitute for scanned textures.

## Scope and limits

This is a complete *interactive visual prototype*, not the lost local copy from another ChatGPT session. It is not equivalent to an Unreal Engine 5 AAA game: meshes are hand-authored/procedural rather than film-grade scanned assets, and there is no Lumen, ray tracing, advanced skeletal rig, or gameplay/portfolio-room integration yet. Keep the existing portfolio `/world` untouched until the new experience is visually approved.

No generated files or source assets from the previous unreleased session could be recovered. This project is a clean new implementation.