import { retroGames } from "../data/games";

// Retain the original secret IDs and discovery progress, while choosing games
// from the same ad-free ROM library used by Mac Mode and Pocket Arcade.
const roomCartridges = {
  "game-home": "heart-and-soul",
  "game-skills": "hoenns-last-wish",
  "game-portfolio": "emerald-rogue",
  "game-resume": "amethyst",
  "game-contact": "unbound",
};
export const GAME_PORTALS = Object.fromEntries(
  Object.entries(roomCartridges).map(([room, id]) => {
    const game = retroGames.find((entry) => entry.id === id);
    return [room, { title: game.name, src: game.url, controls: game.controls }];
  }),
);
