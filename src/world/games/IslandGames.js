import TileGame from "./TileGame";
import GemGame from "./GemGame";
import OrcGame from "./OrcGame";
import RunnerGame from "./RunnerGame";
import MemoryGame from "./MemoryGame";
import "./games.css";
// Prop IDs stay shared with the placed town artwork and engine interactions.
const components = {
  windmill: TileGame,
  workstation: GemGame,
  workbench: OrcGame,
  orrery: MemoryGame,
  chimes: RunnerGame,
};
export default function IslandGames({ id, character, outfit }) {
  const Game = components[id];
  return Game ? <Game character={character} outfit={outfit} /> : null;
}
