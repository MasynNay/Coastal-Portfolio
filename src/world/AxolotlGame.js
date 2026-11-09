import { useEffect, useRef, useState } from "react";
import { createAxolotlFlight, flightSize } from "./AxolotlFlight";
import { createArtCache, artwork } from "./art";
import { activityAsset } from "./Wardrobe";
import { imageSource } from "./ImageSource";
import { createAxolotlScene } from "./AxolotlScene";
import terrainArt from "./TerrainArt.json";
import "./AxolotlGame.css";

function readBest() {
  try {
    return Math.max(
      0,
      Number(localStorage.getItem("masyn-axolotl-drift-best")) || 0,
    );
  } catch {
    return 0;
  }
}
// A small self-contained arcade canvas. Opening the normal world dialog pauses
// the town; closing this component releases its RAF, listeners and decoded art.
export default function AxolotlGame({ character = "masyn", outfit = null }) {
  const canvas = useRef(null),
    controls = useRef({});
  const [status, setStatus] = useState({
    phase: "ready",
    score: 0,
    paused: false,
  });
  const [best, setBest] = useState(readBest);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(null);
  const asset = activityAsset(character, outfit, "surf", artwork);
  useEffect(() => {
    const node = canvas.current,
      ctx = node.getContext("2d");
    const game = createAxolotlFlight(),
      cache = createArtCache({ maxBytes: 16 * 1024 * 1024 });
    let disposed = false,
      frame = 0,
      last = null,
      paused = false;
    let loaded = false;
    setReady(false);
    setError(null);
    let previousStatus = "",
      bestScore = readBest();
    const images = {};
    // Load the rider and two scenery textures. The eel gates are drawn directly.
    const load = (key, src) => {
      return new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => {
          if (!disposed) images[key] = im;
          resolve();
        };
        im.onerror = () => reject(new Error("Arcade artwork did not load."));
        im.src = src;
      });
    };
    cache
      .load(asset)
      .then(() => {
        if (!disposed) {
          loaded = true;
          setReady(true);
        }
      })
      .catch(() => {
        if (!disposed)
          setError(
            "The sea gates could not open. Close the game and try again.",
          );
      });
    load("background", "/world/collections/aquarium.webp").catch(() => {});
    load("sand", imageSource(terrainArt.tiles)).catch(() => {});
    function publish(state) {
      const signature = `${state.phase}:${state.score}:${paused}`;
      if (signature !== previousStatus) {
        previousStatus = signature;
        setStatus({ phase: state.phase, score: state.score, paused });
      }
      if (state.score > bestScore) {
        bestScore = state.score;
        setBest(bestScore);
        try {
          localStorage.setItem("masyn-axolotl-drift-best", String(bestScore));
        } catch {
          /* Private browsing can still play without saving a best score. */
        }
      }
    }
    function flap() {
      if (!loaded) return;
      if (paused) paused = false;
      else game.flap();
      last = null;
      publish(game.snapshot());
    }
    controls.current = {
      flap,
      pause() {
        paused = !paused;
        last = null;
        publish(game.snapshot());
      },
    };
    function key(event) {
      if (
        !["Space", "ArrowUp"].includes(event.code) &&
        ![" ", "ArrowUp"].includes(event.key)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey)
        flap();
    }
    function visibility() {
      if (document.hidden && game.snapshot().phase === "playing") {
        paused = true;
        publish(game.snapshot());
      }
      last = null;
    }
    const { width: w, height: h } = flightSize;
    const ratio = Math.min(
      2,
      Math.max(1, (node.clientWidth / w) * (window.devicePixelRatio || 1)),
    );
    node.width = Math.round(w * ratio);
    node.height = Math.round(h * ratio);
    const paint = createAxolotlScene(ctx, {
      images,
      getRider: () => cache.get(asset),
      sheet: artwork[asset],
      ratio,
    });
    function tick(time) {
      if (disposed) return;
      const dt = last === null ? 0 : Math.max(0, (time - last) / 1000);
      last = time;
      const state = paused ? game.snapshot() : game.update(dt);
      publish(state);
      paint(state, time);
      frame = requestAnimationFrame(tick);
    }
    window.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", visibility);
    frame = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", visibility);
      controls.current = {};
      cache.clear();
    };
  }, [asset]);
  return (
    <div
      className="axolotl-game"
      style={{ "--flight-aspect": flightSize.width / flightSize.height }}
    >
      <div className="axolotl-game-score" aria-live="polite">
        <span>
          Score <strong>{status.score}</strong>
        </span>
        <span>
          Personal best <strong>{best}</strong>
        </span>
        <button
          disabled={status.phase !== "playing"}
          onClick={() => controls.current.pause?.()}
        >
          {status.paused ? "Resume" : "Pause"}
        </button>
      </div>
      <div className="axolotl-game-stage">
        <canvas
          ref={canvas}
          tabIndex={0}
          aria-label="Axolotl Drift. Press Space or tap to rise between the open-mouthed eels."
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.focus();
            controls.current.flap?.();
          }}
        />
        {(status.phase !== "playing" || status.paused) && (
          <div className="axolotl-game-message" aria-live="polite">
            <strong>
              {!ready
                ? "Opening the sea gates…"
                : status.paused
                  ? "A little breather"
                  : status.phase === "over"
                    ? "One more drift?"
                    : "A little courage. A little lift."}
            </strong>
            <span>
              {error ||
                (status.phase === "over"
                  ? `${status.score} eel pairs cleared · press Space or tap to try again.`
                  : "Press Space, ↑ or tap to rise. Slip through the openings.")}
            </span>
          </div>
        )}
      </div>
      <button
        className="world-primary"
        disabled={!ready}
        onClick={() => controls.current.flap?.()}
      >
        {status.paused
          ? "Resume"
          : status.phase === "ready"
            ? "Let’s drift"
            : status.phase === "over"
              ? "Try again"
              : "↑ Rise"}
      </button>
      <p className="activity-note">
        Space / ↑ / tap to rise · Escape closes the game · your best stays on
        this device.
      </p>
    </div>
  );
}
