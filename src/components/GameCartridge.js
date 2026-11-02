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
  ruby: Gem,
  "kingdom-hearts": Key,
  "mystery-dungeon": Compass,
  "red-rescue": Compass,
  "sonic-advance-3": Lightning,
  "liquid-crystal": Gem,
  "return-of-the-king": Shield,
  "shark-shrek": Stars,
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
  return (
    <button
      className="game-cartridge"
      data-game={game.id}
      aria-label={`${action} ${game.name}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="cartridge-top" aria-hidden="true">
        GAME BOY
      </span>
      <span className="cartridge-label">
        <span className="cartridge-art" aria-hidden="true">
          <Icon />
        </span>
        <span className="cartridge-title">{game.title}</span>
        <span className="cartridge-edition">{game.edition}</span>
      </span>
      <span className="cartridge-bottom" aria-hidden="true">
        <i />▼<i />
      </span>
      <span className="cartridge-selection" aria-hidden="true">
        {selected ? "Selected" : "Pocket Arcade"}
      </span>
    </button>
  );
}
