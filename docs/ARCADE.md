# Pocket Arcade

Mac Mode, the hidden `/game` arcade and the five room secrets use one cartridge catalog in `src/data/games.js`. The seven original island games continue to use the shared React game components. The seven supplied GBA games run in `/emulator/player.html?game=<id>`, a separate document that contains the emulator's globals, input listeners and WebAssembly memory. Closing a Mac game window unloads that player.

## Cartridges and hosting

The supplied cartridges are Heart & Soul, Hoenn’s Last Wish, Emerald Rogue, Amethyst, Sword and Shield Ultimate Plus, Unbound, and Mystery Dungeon Red Rescue Team Shiny Patch+. The room secrets choose Heart & Soul (About), Hoenn’s Last Wish (Skills), Emerald Rogue (Portfolio), Amethyst (Resume) and Unbound (Contact). The original discovery IDs remain unchanged.

The ROM archives are **public downloads**, as requested by Masyn. They are stored as binary assets on the repository’s [`arcade-roms-v1` release](https://github.com/MasynNay/Coastal-Portfolio/releases/tag/arcade-roms-v1), outside Git source history. `scripts/PrepareRoms.cjs` runs before start/build, downloads missing archives and checks their exact size and SHA-256 hash against `src/data/roms.json`. A failed verification stops the build. Downloads run two at a time.

Verified archives go in ignored `public/roms/`, then into Cloudflare Pages’ build output. Visitors download them from **masynnay.com/roms/**, on the same origin as the player. The archive filenames include a content hash. Each compressed archive is below Cloudflare Pages’ 25 MiB asset limit; original 32 MiB `.gba` files are not published uncompressed. The player decompresses ZIPs locally. Never commit ROM files into source history.

To add a cartridge, compress one supplied `.gba` into a ZIP, publish that archive as a release asset, and add its approved metadata to `src/data/roms.json`. Keep the original archive filename, byte count, hashes and stable save ID. Update `PrepareRoms.cjs` if using another asset release. Run it to create the public catalog, then test the actual cartridge in a browser before publishing. All pickers use the generated/shared IDs; no arbitrary ROM URL can be supplied through the player query.

## Controls and saves

| Action | Keyboard | Phone/tablet |
| --- | --- | --- |
| Move | Arrow keys | On-screen D-pad |
| A / B | Z / X | A / B buttons |
| Start / Select | Enter / Shift | Start / Select buttons |
| L / R | Q / E | L / R buttons |
| Mapping, save files, fullscreen | Player menu | Player menu |

Click or tap Play first to start audio and the game. The original emulator control has added button semantics and Enter/Space activation. Touch-capable devices get the virtual gamepad, including iPads using desktop-style browser identification. Compatible gamepads are also supported.

Emulator save files/states are browser-local. They are not synced to GitHub, the portfolio server or another device. Each cartridge has a separate stable numeric game ID and descriptive game name, even when ROM headers are identical. Use **Export Save File** or the state export controls before clearing browser storage or moving devices. Imports must match the same game/version. EmulatorJS controls save compatibility; a version change can affect existing saves.

## Runtime and compatibility

The portfolio vendors the unmodified EmulatorJS **4.2.3** loader, UI, ZIP/7z workers and mGBA normal/legacy cores under `public/emulator/4.2.3/`. No BIOS, unrelated console cores, advertisements or third-party player pages are included. Normal play requests only same-origin player/runtime/cartridge files. Threads are disabled, so cross-origin isolation headers are unnecessary.

WebAssembly and WebGL graphics are required. Some embedded app browsers provide no WebGL context; the player reports this and directs visitors to a regular browser. Heart & Soul was confirmed to start by Masyn in a separate browser. The development app’s browser panel could verify the library, room links and unsupported-graphics message, but could not run the WebGL core. Other supplied ROMs have archive integrity checks; full playthrough compatibility is not established by those checks.

The integration is `public/emulator/player.js`, `player.html` and `player.css`. Do not edit the minified vendor runtime to make site-specific changes. Runtime sources and licenses are linked in the bundled [runtime README](../public/emulator/4.2.3/README.md); copies of the licenses also live in `docs/licenses/`. EmulatorJS is GPL-3.0 and mGBA retains its own MPL-2.0 license. The cartridge binaries are separate from those emulator licenses.
