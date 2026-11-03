// Windfall 2048 translates keys, drags, swipes and buttons into the same move.
// Tiles.js owns merge rules; this panel owns score, feedback and game-over UI.
import { useEffect, useRef, useState } from "react";
import { newTiles, slideTiles, spawnTile, tilesEnded } from "./Tiles";
export default function TileGame() {
  const [board, setBoard] = useState(newTiles),
    [score, setScore] = useState(0),
    [drag, setDrag] = useState(null),
    [message, setMessage] = useState(
      "Slide matching numbers together. Reach 2048!",
    );
  const touch = useRef(null),
    moveRef = useRef(null);
  const ended = tilesEnded(board);
  function reset() {
    setBoard(newTiles());
    setScore(0);
    setDrag(null);
    setMessage("Catch the wind. Reach 2048!");
  }
  function move(direction) {
    if (ended) return;
    const result = slideTiles(board, direction);
    if (!result.changed) return;
    const next = spawnTile(result.board);
    setBoard(next);
    setScore((n) => n + result.score);
    setMessage(
      next.some((n) => n >= 2048)
        ? "2048! Keep going for a bigger tile."
        : tilesEnded(next)
          ? "No more moves. Ready for another round?"
          : "Combine matching tiles. Each tile merges once per move.",
    );
  }
  moveRef.current = move;
  useEffect(() => {
    const keys = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
    };
    function key(e) {
      if (keys[e.key]) {
        e.preventDefault();
        moveRef.current(keys[e.key]);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <div className="island-mini-game windfall-tiles">
      <p>
        Drag the tiles with a mouse or swipe with a finger. The whole board
        slides in that direction. Arrow keys and the direction buttons also
        work. Equal numbers combine as you chart a course across the Great Sea.
        Reach 2048 to find the treasure.
      </p>
      <div className="mini-score">
        <strong>Score {score}</strong>
        <button onClick={reset}>New game</button>
      </div>
      <div
        className="windfall-board-wrap"
        style={{ backgroundImage: "url('/world/games/windfall-chart.webp')" }}
      >
        <div
          className="number-board"
          aria-label="2048 board"
          data-dragging={!!drag}
          style={{
            "--drag-x": `${drag?.x || 0}px`,
            "--drag-y": `${drag?.y || 0}px`,
          }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.currentTarget.setPointerCapture?.(e.pointerId);
            touch.current = { x: e.clientX, y: e.clientY };
            setDrag({ x: 0, y: 0 });
          }}
          onPointerMove={(e) => {
            if (!touch.current) return;
            const dx = e.clientX - touch.current.x,
              dy = e.clientY - touch.current.y;
            setDrag(
              Math.abs(dx) > Math.abs(dy)
                ? { x: Math.max(-18, Math.min(18, dx * 0.18)), y: 0 }
                : { x: 0, y: Math.max(-18, Math.min(18, dy * 0.18)) },
            );
          }}
          onPointerCancel={() => {
            touch.current = null;
            setDrag(null);
          }}
          onPointerUp={(e) => {
            if (!touch.current) return;
            const dx = e.clientX - touch.current.x,
              dy = e.clientY - touch.current.y;
            touch.current = null;
            setDrag(null);
            if (Math.hypot(dx, dy) > 18)
              move(
                Math.abs(dx) > Math.abs(dy)
                  ? dx > 0
                    ? "right"
                    : "left"
                  : dy > 0
                    ? "down"
                    : "up",
              );
          }}
        >
          {board.map((n, i) => (
            <div className="number-tile" data-value={n} key={i}>
              {n || ""}
            </div>
          ))}
        </div>
        {ended && (
          <div className="tiles-game-over" role="status">
            <span className="nautical-compass" aria-hidden="true">
              ✥
            </span>
            <h3>Game over</h3>
            <p>
              The wind has settled. You scored <strong>{score}</strong> points.
            </p>
            <button onClick={reset}>Set sail again</button>
          </div>
        )}
      </div>
      <div className="mini-directions">
        {["left", "up", "down", "right"].map((d, i) => (
          <button
            key={d}
            disabled={ended}
            aria-label={"Slide " + d}
            onClick={() => move(d)}
          >
            {["←", "↑", "↓", "→"][i]}
          </button>
        ))}
      </div>
      <p role="status">{message}</p>
    </div>
  );
}
