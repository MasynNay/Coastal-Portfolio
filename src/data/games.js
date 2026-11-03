import { gameTitles } from "../world/games/GameLocations";
import roms from "./roms.json";

// Every presentation uses this one catalog. ROMs run in our own isolated
// emulator document; original island games keep their standalone routes.
export const retroGames = roms.map((rom) => ({
  id: rom.id,
  name: rom.name,
  title:
    rom.id === "red-rescue-shiny"
      ? "Mystery Dungeon"
      : rom.name.replace(/^Pokémon /, ""),
  edition:
    rom.id === "red-rescue-shiny"
      ? "Red Rescue Team · Shiny Patch+"
      : rom.version || "Game Boy Advance",
  kind: "emulator",
  platform: "gba",
  largePlayer: true,
  url: `/emulator/player.html?game=${rom.id}`,
  controls:
    "Arrows: move · Z: A · X: B · Enter: Start · Shift: Select · Q / E: L / R. On phones, use the player's on-screen buttons. Save/export progress from the emulator menu; saves stay on this device.",
}));

export const islandGames = [
  {
    id: "element-runner",
    location: "chimes",
    name: gameTitles.chimes,
    largePlayer: true,
    edition: "Endless runner",
    controls:
      "A / D or Left / Right to change lanes. W / Up jumps; S / Down slides. Swipe or use the on-screen buttons on touch screens.",
  },
  {
    id: "poke-ball-match",
    location: "workstation",
    name: gameTitles.workstation,
    edition: "Match-three puzzles",
    controls:
      "Swipe a ball toward a neighbor, or select two adjacent balls to swap. Match four or five to make special balls.",
  },
  {
    id: "windfall-2048",
    location: "windmill",
    name: gameTitles.windmill,
    edition: "A sea of numbers",
    controls:
      "Use arrow keys, drag or swipe the board, or tap the direction buttons to combine matching tiles.",
  },
  {
    id: "orc-hunt",
    location: "workbench",
    name: gameTitles.workbench,
    edition: "Moria archery",
    controls:
      "Click or tap the orcs before the next wave. Each successful shot sends an arrow from the archer.",
  },
  {
    id: "wizard-memory",
    location: "orrery",
    name: gameTitles.orrery,
    edition: "Find the magical pairs",
    controls:
      "Click or tap two cards to find matching pairs. Keyboard users can use Tab and Enter.",
  },
  {
    id: "axolotl-drift",
    name: "Axolotl Drift",
    largePlayer: true,
    edition: "Ride between the eels",
    controls:
      "Press Space or Up, or tap the game, to rise. Avoid the eels and the sea floor.",
  },
  {
    id: "axolotl-race",
    name: "Axolotl Race",
    edition: "The family regatta",
    controls:
      "Select Start race and cheer on the family. Everyone has their own lane and the winner is chosen randomly.",
  },
].map((game) => ({
  ...game,
  kind: "island",
  title: game.name,
  url: `/arcade/${game.id}`,
}));

export const games = [...retroGames, ...islandGames];
