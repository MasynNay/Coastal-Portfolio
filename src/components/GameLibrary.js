import { useState } from "react";
import { games } from "../data/games";
import GameCartridge from "./GameCartridge";
import "./GameLibrary.css";
// One cartridge shelf serves Mac Mode and the Lodge. The parent chooses where
// a selected game opens; game data, selection and cartridge artwork stay shared.
export default function GameLibrary({
  onOpen,
  title = "Pocket Arcade",
  description = "Choose a cartridge to open its game and controls in a new Mac window.",
}) {
  const [selected, setSelected] = useState(null);
  return (
    <div className="game-library">
      {title && <h2>{title}</h2>}
      <p>{description}</p>
      <div
        className="mac-game-picker game-cartridge-grid"
        role="group"
        aria-label="Choose a game"
      >
        {games.map((game) => (
          <GameCartridge
            key={game.id}
            game={game}
            selected={selected === game.id}
            onSelect={() => {
              setSelected(game.id);
              onOpen?.(game);
            }}
          />
        ))}
      </div>
    </div>
  );
}
