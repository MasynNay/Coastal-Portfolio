import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { islandGames } from "../data/games";
import IslandGames from "../world/games/IslandGames";
import AxolotlGame from "../world/AxolotlGame";
import RaceGame from "../world/games/RaceGame";
import "./ArcadeGame.css";

// This lightweight route shares the island's real game components without
// booting the town. Its iframe contains keyboard listeners, timers and styles;
// closing a cartridge window releases the entire player document.
export default function ArcadeGame() {
  const { game: id } = useParams();
  const game = islandGames.find((entry) => entry.id === id);
  const [search] = useSearchParams();
  const expanded = game?.largePlayer && search.get("view") === "mac";
  useEffect(() => {
    document.title = game ? `${game.name} · Island Arcade` : "Game not found";
  }, [game]);
  if (!game)
    return (
      <main className="arcade-game-page">
        <h1>Game not found</h1>
        <a href="/game">Back to the arcade</a>
      </main>
    );
  return (
    <main
      className={`arcade-game-page${expanded ? " arcade-game-large" : ""}`}
      aria-label={game.name}
    >
      <h1>{game.name}</h1>
      {game.location ? (
        <IslandGames
          id={game.location}
          character="masyn"
          outfit={id === "element-runner" ? "home" : null}
        />
      ) : id === "axolotl-drift" ? (
        <AxolotlGame />
      ) : (
        <RaceGame />
      )}
    </main>
  );
}
