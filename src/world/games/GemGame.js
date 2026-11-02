import MatchEffects from "./MatchEffects";
import { useEffect, useRef, useState } from "react";
import {
  newGems,
  swapGems,
  adjacent,
  isBomb,
  RAINBOW,
  ballColor,
  activateGem,
} from "./Gems";
const names = [
  "Poké Ball",
  "Great Ball",
  "Ultra Ball",
  "Master Ball",
  "Premier Ball",
  "Luxury Ball",
];
export default function GemGame() {
  const [board, setBoard] = useState(newGems),
    [selected, setSelected] = useState(null),
    [score, setScore] = useState(0),
    [moves, setMoves] = useState(30),
    [message, setMessage] = useState(
      "Match three. Build a bigger combo to earn a special ball!",
    ),
    [flash, setFlash] = useState([]),
    [effects, setEffects] = useState([]),
    [busy, setBusy] = useState(false),
    [turn, setTurn] = useState(0),
    [phase, setPhase] = useState("idle"),
    [falls, setFalls] = useState([]),
    [swapping, setSwapping] = useState(null),
    [combo, setCombo] = useState(null);
  const gesture = useRef(null),
    handledUntil = useRef(-Infinity),
    timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function apply(result) {
    setSelected(null);
    if (!result) {
      setMessage("That swap needs a match of three. No move used.");
      return;
    }
    setScore((n) => n + result.score);
    setMoves((n) => n - 1);
    clearTimeout(timer.current);
    setBusy(true);
    // Play the simulation's actual cascade snapshots. The old implementation
    // immediately replaced the matched balls, so only the NEW ones flashed.
    function playStep(index) {
      const step = result.steps[index];
      setSwapping(null);
      if (!step) {
        setBoard(result.board);
        setPhase("idle");
        setBusy(false);
        setCombo(null);
        return;
      }
      const powers = step.effects.filter((e) => e.kind !== "match");
      setBoard(step.before);
      setFlash(step.cleared);
      setEffects(powers);
      setFalls([]);
      setPhase("clearing");
      setTurn((n) => n + 1);
      setCombo(
        step.created.length
          ? "Special ball!"
          : step.combo > 1
            ? `Cascade ×${step.combo}`
            : `${step.cleared.length} matched!`,
      );
      timer.current = setTimeout(
        () => {
          setFlash([]);
          setEffects([]);
          setCombo(null);
          setBoard(step.board);
          setFalls(step.falls);
          setPhase("falling");
          timer.current = setTimeout(() => playStep(index + 1), 340);
        },
        powers.length ? 1050 : 420,
      );
    }
    if (result.swap) {
      setBoard(result.swap.before);
      setSwapping(result.swap);
      setPhase("swapping");
      timer.current = setTimeout(() => playStep(0), 190);
    } else playStep(0);
    setMessage(
      `${result.cleared} balls collected${result.cascades > 1 ? " · cascade bonus" : ""}!${result.created.includes("rainbow") ? " Rainbow ball earned: select it, then choose any color." : result.created.includes("bomb") ? " Rocket bomb earned: tap it for a blast!" : ""}${result.shuffled ? " Fresh board shuffled in." : ""}`,
    );
  }
  function choose(index) {
    if (!moves || busy) return;
    if (selected !== null && board[selected] === RAINBOW) {
      if (index === selected) setSelected(null);
      else apply(activateGem(board, selected, index));
      return;
    }
    if (isBomb(board[index])) {
      apply(activateGem(board, index));
      return;
    }
    if (board[index] === RAINBOW) {
      setSelected(index);
      setMessage("Choose any ball on the board to clear that entire color.");
      return;
    }
    if (selected == null) {
      setSelected(index);
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    if (!adjacent(selected, index)) {
      setSelected(index);
      return;
    }
    apply(swapGems(board, selected, index));
  }
  function finishGesture(e) {
    if (busy) return;
    const start = gesture.current;
    gesture.current = null;
    if (!start) return;
    handledUntil.current = performance.now() + 400;
    const dx = e.clientX - start.x,
      dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) < 18) {
      choose(start.index);
      return;
    }
    const next =
      start.index +
      (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : dy > 0 ? 8 : -8);
    if (next >= 0 && next < 64 && adjacent(start.index, next) && moves)
      apply(swapGems(board, start.index, next));
  }
  return (
    <div className="island-mini-game ball-match-game">
      <p>
        Swipe a ball toward its neighbor, or tap two to swap. Match 4 for a{" "}
        <strong>Rocket bomb</strong> that blasts a 3×3 area. Match 5 for a{" "}
        <strong>Rainbow Ball</strong>: select it, then choose any color to clear
        every ball of that kind. Cascades multiply your points.
      </p>
      <div className="mini-score">
        <strong>Score {score}</strong>
        <span>{moves} moves left</span>
        <button
          onClick={() => {
            setBoard(newGems());
            setScore(0);
            setMoves(30);
            setSelected(null);
            setFlash([]);
            setEffects([]);
            setBusy(false);
            setPhase("idle");
            setSwapping(null);
            setFalls([]);
            setCombo(null);
            clearTimeout(timer.current);
            setMessage("A fresh adventure. Make those combos!");
          }}
        >
          New game
        </button>
      </div>
      <div
        className="gem-board"
        aria-label="Poké Ball matching board"
        data-phase={phase}
        aria-busy={busy}
        data-rainbow={selected !== null && board[selected] === RAINBOW}
      >
        {board.map((gem, i) => (
          <button
            key={i}
            className="gem-cell"
            data-gem={gem}
            data-power={gem === RAINBOW ? "rainbow" : isBomb(gem) ? "bomb" : ""}
            data-flash={flash.includes(i)}
            style={{
              "--fall": falls[i] || 0,
              "--swap-x":
                swapping && (i === swapping.a || i === swapping.b)
                  ? ((i === swapping.a ? swapping.b : swapping.a) % 8) - (i % 8)
                  : 0,
              "--swap-y":
                swapping && (i === swapping.a || i === swapping.b)
                  ? Math.floor(
                      (i === swapping.a ? swapping.b : swapping.a) / 8,
                    ) - Math.floor(i / 8)
                  : 0,
            }}
            aria-pressed={selected === i}
            aria-label={`${gem === RAINBOW ? "Rainbow Ball" : isBomb(gem) ? "Rocket bomb" : names[gem]}, row ${Math.floor(i / 8) + 1}, column ${(i % 8) + 1}`}
            disabled={!moves || busy}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.currentTarget.setPointerCapture?.(e.pointerId);
              gesture.current = { index: i, x: e.clientX, y: e.clientY };
            }}
            onPointerUp={finishGesture}
            onPointerCancel={() => {
              gesture.current = null;
            }}
            onClick={(e) => {
              if (e.detail === 0 && performance.now() > handledUntil.current)
                choose(i);
            }}
          >
            <img
              key={`${phase === "falling" ? turn : "rest"}-${i}`}
              src={
                gem === RAINBOW
                  ? "/world/games/rainbow-ball.png"
                  : isBomb(gem)
                    ? "/world/games/rocket-bomb.png"
                    : `/world/games/ball-${ballColor(gem)}.png`
              }
              alt=""
              draggable="false"
            />
            {isBomb(gem) && (
              <span
                className="bomb-color"
                style={{
                  "--ball-color": [
                    "#eb7777",
                    "#6da8e0",
                    "#dbc677",
                    "#ad7ad3",
                    "#f0e7d5",
                    "#a7b5a7",
                  ][ballColor(gem)],
                }}
              />
            )}
          </button>
        ))}
        <MatchEffects effects={effects} turn={turn} />
        {combo && (
          <div key={turn} className="match-combo" aria-hidden="true">
            {combo}
          </div>
        )}
      </div>
      <p role="status">
        {moves
          ? message
          : `Round complete! ${score} points. Ready for another adventure?`}
      </p>
    </div>
  );
}
