import {
  Compass,
  Gem,
  Key,
  Lightning,
  Shield,
  Stars,
} from "react-bootstrap-icons";
import "./GameCartridge.css";

const symbols = {
  "heart-and-soul": Key,
  "hoenns-last-wish": Stars,
  "emerald-rogue": Gem,
  amethyst: Gem,
  "sword-and-shield": Shield,
  unbound: Lightning,
  "red-rescue-shiny": Compass,
  "element-runner": Lightning,
  "poke-ball-match": Gem,
  "windfall-2048": Compass,
  "orc-hunt": Shield,
  "wizard-memory": Stars,
  "axolotl-drift": Compass,
  "axolotl-race": Lightning,
};

// Both arcade pickers use the same shell and label layout. Title length never
// changes the cartridge size; the full accessible name identifies each game.
export default function GameCartridge({
  game,
  selected,
  onSelect,
  action = "Play",
}) {
  const Icon = symbols[game.id] || Stars;
  const custom = game.kind === "island";
  return (
    <button
      className={`game-cartridge${custom ? " custom-cartridge" : ""}`}
      data-game={game.id}
      data-platform={game.platform}
      aria-label={`${action} ${game.name}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="cartridge-top" aria-hidden="true">
        {custom ? "ISLAND ARCADE" : "GAME BOY ADVANCE"}
      </span>
      <span className="cartridge-label">
        <span className="cartridge-art" aria-hidden="true">
          <Icon />
        </span>
        <span className="cartridge-title">{game.title}</span>
        <span className="cartridge-edition">{game.edition}</span>
      </span>
      <span className="cartridge-bottom" aria-hidden="true">
        {custom ? <><i /><i /><i /><i /><i /><i /></> : <><i />▼<i /></>}
      </span>
      <span className="cartridge-selection" aria-hidden="true">
        {selected ? "Selected" : custom ? "Island original" : "Pocket Arcade"}
      </span>
    </button>
  );
}
