import { gameTitles } from "../world/games/GameLocations";

// Mac Mode and the secret arcade share one catalog. Each local game has an
// isolated player route, so keyboard controls never reach another open game.
export const retroGames = [
  {
    id: "ruby",
    title: "Pokémon",
    edition: "Ruby",
    name: "Pokémon Ruby",
    url: "https://www.retrogames.cc/embed/26523-pokemon-ruby-e-independent.html",
  },
  {
    id: "kingdom-hearts",
    title: "Kingdom Hearts",
    edition: "Chain of Memories",
    name: "Kingdom Hearts: Chain of Memories",
    url: "https://www.retrogames.cc/embed/29441-kingdom-hearts-chain-of-memories-u-venom.html",
  },
  {
    id: "mystery-dungeon",
    title: "Pokémon Mystery Dungeon",
    edition: "Explorers of the Spirit",
    name: "Pokémon Mystery Dungeon: Explorers of the Spirit",
    url: "https://www.retrogames.cc/embed/46666-pokemon-mystery-dungeon-explorers-of-the-spirit.html",
  },
  {
    id: "red-rescue",
    title: "Pokémon Mystery Dungeon",
    edition: "Red Rescue Team EX",
    name: "Pokémon Mystery Dungeon: Red Rescue Team EX",
    url: "https://www.retrogames.cc/embed/44495-pokemon-mystery-dungeon-red-rescue-team-ex.html",
  },
  {
    id: "sonic-advance-3",
    title: "Sonic",
    edition: "Advance 3",
    name: "Sonic Advance 3",
    url: "https://www.retrogames.cc/embed/19452-sonic-advance-3-e-trashman.html",
  },
  {
    id: "liquid-crystal",
    title: "Pokémon",
    edition: "Liquid Crystal",
    name: "Pokémon Liquid Crystal",
    url: "https://www.retrogames.cc/embed/42136-pokemon-liquid-grystal-version.html",
  },
  {
    id: "return-of-the-king",
    title: "The Lord of the Rings",
    edition: "The Return of the King",
    name: "The Lord of the Rings: The Return of the King",
    url: "https://www.retrogames.cc/embed/29171-lord-of-the-rings-the-return-of-the-king-u-venom.html",
  },
  {
    id: "shark-shrek",
    title: "Shark Tale / Shrek 2",
    edition: "2-in-1",
    name: "Shark Tale & Shrek 2",
    url: "https://www.retrogames.cc/embed/19418-2-in-1-shark-tale-shrek-2-u-sir-vg.html",
  },
];

export const islandGames = [
  { id: "element-runner", location: "chimes", name: gameTitles.chimes, largePlayer: true,
    edition: "Endless runner", controls: "A / D or Left / Right to change lanes. W / Up jumps; S / Down slides. Swipe or use the on-screen buttons on touch screens." },
  { id: "poke-ball-match", location: "workstation", name: gameTitles.workstation,
    edition: "Match-three puzzles", controls: "Swipe a ball toward a neighbor, or select two adjacent balls to swap. Match four or five to make special balls." },
  { id: "windfall-2048", location: "windmill", name: gameTitles.windmill,
    edition: "A sea of numbers", controls: "Use arrow keys, drag or swipe the board, or tap the direction buttons to combine matching tiles." },
  { id: "orc-hunt", location: "workbench", name: gameTitles.workbench,
    edition: "Moria archery", controls: "Click or tap the orcs before the next wave. Each successful shot sends an arrow from the archer." },
  { id: "wizard-memory", location: "orrery", name: gameTitles.orrery,
    edition: "Find the magical pairs", controls: "Click or tap two cards to find matching pairs. Keyboard users can use Tab and Enter." },
  { id: "axolotl-drift", name: "Axolotl Drift", largePlayer: true,
    edition: "Ride between the eels", controls: "Press Space or Up, or tap the game, to rise. Avoid the eels and the sea floor." },
  { id: "axolotl-race", name: "Axolotl Race",
    edition: "The family regatta", controls: "Select Start race and cheer on the family. Everyone has their own lane and the winner is chosen randomly." },
].map((game) => ({
  ...game,
  kind: "island",
  title: game.name,
  url: `/arcade/${game.id}`,
}));

export const games = [...retroGames, ...islandGames];
