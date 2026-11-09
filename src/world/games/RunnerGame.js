// Element Runner connects keyboard/touch actions to Runner.js and paints via
// RunnerScene.js. It owns loading, pause, animation-loop cleanup and local bests.
import { useCallback, useEffect, useRef, useState } from "react";
import { characterAsset } from "../Wardrobe";
import { createRunnerArt } from "./RunnerArt";
import { newRunner, runnerAction, runnerActions, stepRunner } from "./Runner";
import { drawRunner } from "./RunnerScene";
function readBest() {
  try {
    return Number(localStorage.getItem("element-runner-best")) || 0;
  } catch {
    return 0;
  }
}
export default function RunnerGame({ character = "masyn", outfit }) {
  const canvas = useRef(null),
    game = useRef(newRunner()),
    art = useRef(null),
    gesture = useRef(null);
  const [mode, setMode] = useState("ready"),
    [hud, setHud] = useState({
      distance: 0,
      coins: 0,
      hearts: 3,
      shield: 0,
      magnet: 0,
      multiplier: 0,
    }),
    [best, setBest] = useState(readBest),
    [loaded, setLoaded] = useState(false);
  const asset = characterAsset(character, outfit) + "-run";
  const action = useCallback(
    (name) => {
      if (mode === "playing") runnerAction(game.current, name);
    },
    [mode],
  );
  useEffect(() => {
    let alive = true;
    const cache = createRunnerArt(asset);
    art.current = cache;
    setLoaded(false);
    cache
      .load()
      .then(() => {
        if (alive) setLoaded(true);
      })
      .catch(() => {
        if (alive) setMode("error");
      });
    return () => {
      alive = false;
      cache.clear();
    };
  }, [asset]);
  useEffect(() => {
    let raf,
      last = 0,
      published = 0;
    const ctx = canvas.current.getContext("2d");
    function tick(now) {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      if (mode === "playing") stepRunner(game.current, dt);
      drawRunner(
        ctx,
        art.current,
        game.current,
        asset,
        mode === "playing" ? now : 0,
      );
      if (now - published > 100 || game.current.over) {
        setHud({
          distance: Math.floor(game.current.distance),
          coins: game.current.coins,
          hearts: game.current.hearts,
          shield: game.current.shield,
          magnet: game.current.magnet,
          multiplier: game.current.multiplier,
          message: game.current.message,
          score: Math.floor(game.current.distance) + game.current.coinScore,
        });
        published = now;
      }
      if (game.current.over && mode === "playing") {
        const score =
          Math.floor(game.current.distance) + game.current.coinScore;
        setBest((old) => {
          const next = Math.max(old, score);
          try {
            localStorage.setItem("element-runner-best", String(next));
          } catch {}
          return next;
        });
        setMode("over");
      }
      if (mode === "playing" && !game.current.over)
        raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [asset, mode, loaded]);
  useEffect(() => {
    function key(e) {
      const name = runnerActions[e.key] || runnerActions[e.key.toLowerCase()];
      if (!name || mode !== "playing") return;
      e.preventDefault();
      if (!e.repeat) action(name);
    }
    function hidden() {
      if (document.hidden)
        setMode((current) => (current === "playing" ? "paused" : current));
    }
    window.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [mode, action]);
  function start() {
    game.current = newRunner();
    setHud({
      distance: 0,
      coins: 0,
      hearts: 3,
      shield: 0,
      magnet: 0,
      multiplier: 0,
    });
    setMode("playing");
    canvas.current.focus({ preventScroll: true });
  }
  return (
    <div className="island-mini-game element-runner">
      <details className="runner-help">
        <summary>How to play · four elements, three lanes</summary>
        <p>
          Air Temple training: four elements, three lanes. A/D or ←/→ change
          lanes. W/↑ jumps over crates and low rails; S/↓ slides under arches.
          On touch screens, swipe in those directions or use the buttons below.
          Collect the bright gold air coins along the way. Air shields one hit,
          Water draws in coins, Fire clears the path, and Earth doubles coin
          points. You have three hearts.
        </p>
      </details>
      <div className="mini-score">
        <strong>
          {hud.distance} m · {hud.coins} coins
        </strong>
        <span>Best {best}</span>
        {mode === "playing" || mode === "paused" ? (
          <button
            onClick={() => setMode(mode === "playing" ? "paused" : "playing")}
          >
            {mode === "playing" ? "Pause" : "Resume"}
          </button>
        ) : null}
      </div>
      <div className="runner-power-bar" aria-label="Lives and active powers">
        <span aria-label={`${hud.hearts} hearts left`}>
          {"♥".repeat(hud.hearts)}
          {"♡".repeat(3 - hud.hearts)}
        </span>
        {[
          ["air", hud.shield],
          ["water", hud.magnet],
          ["earth", hud.multiplier],
        ].map(([id, active]) => (
          <span key={id} data-active={!!active}>
            <img src={`/world/games/runner-${id}.png`} alt={id + " power"} />
            {active ? (id === "air" ? "Ready" : Math.ceil(active) + "s") : "—"}
          </span>
        ))}
      </div>
      <div className="runner-stage">
        <canvas
          ref={canvas}
          width="600"
          height="700"
          tabIndex="0"
          aria-label="Element Runner: swipe left or right to change lanes, up to jump, down to slide"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            gesture.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          }}
          onPointerCancel={() => {
            gesture.current = null;
          }}
          onPointerMove={(e) => {
            const start = gesture.current;
            if (!start || start.id !== e.pointerId) return;
            const dx = e.clientX - start.x,
              dy = e.clientY - start.y;
            if (Math.hypot(dx, dy) < 18) return;
            gesture.current = null;
            action(
              Math.abs(dx) > Math.abs(dy)
                ? dx > 0
                  ? "right"
                  : "left"
                : dy > 0
                  ? "duck"
                  : "jump",
            );
          }}
          onPointerUp={() => {
            gesture.current = null;
          }}
        />
        {mode !== "playing" && (
          <div className="runner-overlay">
            <strong>
              {mode === "over"
                ? "A good run."
                : mode === "paused"
                  ? "Take a breath."
                  : "Element Runner"}
            </strong>
            <p>
              {mode === "over"
                ? `${hud.score || hud.distance} points. Ready to go farther?`
                : mode === "error"
                  ? "The artwork couldn't load. Close and reopen the game to retry."
                  : "Follow the gold coins. Find your rhythm."}
            </p>
            {mode !== "error" && (
              <button
                disabled={!loaded}
                onClick={mode === "paused" ? () => setMode("playing") : start}
              >
                {!loaded
                  ? "Loading artwork…"
                  : mode === "paused"
                    ? "Keep running"
                    : mode === "over"
                      ? "Run again"
                      : "Let's run"}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="runner-controls">
        {[
          ["left", "← Left"],
          ["jump", "↑ Jump"],
          ["duck", "↓ Slide"],
          ["right", "Right →"],
        ].map(([id, label]) => (
          <button
            key={id}
            disabled={mode !== "playing"}
            onClick={() => action(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <p role="status">
        {mode === "over"
          ? "Run complete. Try again whenever you're ready."
          : hud.message ||
            "Airbend over obstacles. Find elemental powers along the path."}
      </p>
    </div>
  );
}
