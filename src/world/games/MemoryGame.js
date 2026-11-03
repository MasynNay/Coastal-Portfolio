// The wizard memory panel owns card selection and the short mismatch timer.
// It clears the timer on reset/unmount so a closed game cannot change later.
import { useEffect, useRef, useState } from "react";
import {
  Stars,
  LightningFill,
  Eyeglasses,
  KeyFill,
  BookFill,
  ShieldFill,
} from "react-bootstrap-icons";
const cards = [
  { name: "Wand sparks", Icon: Stars },
  { name: "Lightning scar", Icon: LightningFill },
  { name: "Round glasses", Icon: Eyeglasses },
  { name: "Flying key", Icon: KeyFill },
  { name: "Spell book", Icon: BookFill },
  { name: "House shield", Icon: ShieldFill },
];
export function memoryDeck(random = Math.random) {
  const deck = cards.flatMap((_, pair) => [
    { pair, id: pair * 2 },
    { pair, id: pair * 2 + 1 },
  ]);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
export default function MemoryGame() {
  const [deck, setDeck] = useState(memoryDeck),
    [open, setOpen] = useState([]),
    [matched, setMatched] = useState([]),
    [moves, setMoves] = useState(0),
    timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function flip(card) {
    if (
      open.length === 2 ||
      matched.includes(card.pair) ||
      open.includes(card.id)
    )
      return;
    const next = [...open, card.id];
    setOpen(next);
    if (next.length === 2) {
      setMoves((n) => n + 1);
      const first = deck.find((c) => c.id === next[0]);
      if (first.pair === card.pair) {
        setMatched((m) => [...m, card.pair]);
        setOpen([]);
      } else timer.current = setTimeout(() => setOpen([]), 900);
    }
  }
  return (
    <div className="island-mini-game">
      <p>
        A little wizarding memory practice: find the six matching pairs of spell
        books, flying keys, glasses and other familiar magical things.
      </p>
      <div className="mini-score">
        <strong>{matched.length} / 6 pairs</strong>
        <span>{moves} turns</span>
        <button
          onClick={() => {
            clearTimeout(timer.current);
            setDeck(memoryDeck());
            setOpen([]);
            setMatched([]);
            setMoves(0);
          }}
        >
          Shuffle cards
        </button>
      </div>
      <div className="memory-board" aria-label="Wizard memory cards">
        {deck.map((card) => {
          const seen = open.includes(card.id) || matched.includes(card.pair),
            { Icon, name } = cards[card.pair];
          return (
            <button
              key={card.id}
              className="memory-card"
              data-revealed={seen}
              disabled={matched.includes(card.pair)}
              aria-label={seen ? name : "Face-down wizard card"}
              onClick={() => flip(card)}
            >
              {seen ? (
                <>
                  <Icon size={38} />
                  <small>{name}</small>
                </>
              ) : (
                <>
                  <Stars size={26} />
                  <span>✧</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <p role="status">
        {matched.length === 6
          ? `Mischief managed! Six pairs found in ${moves} turns.`
          : "Turn over two cards. Matching pairs stay revealed."}
      </p>
    </div>
  );
}
