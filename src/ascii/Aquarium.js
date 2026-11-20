import { useEffect, useRef, useState } from "react";
import {
  aquariumStyles,
  createAquarium,
  feedAquarium,
  renderAquarium,
  updateAquarium,
} from "./AquariumScene";
import { getSceneAction } from "./Worlds";

export default function Aquarium({ active = true }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const swipe = useRef(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState("");
  const [available, setAvailable] = useState(true);
  const style = aquariumStyles[index];
  const action = getSceneAction(style);
  const paint = useRef(() => {});

  // The scene survives pause and app focus changes. Only a habitat change
  // starts a new simulation; hidden windows use no animation-frame loop.
  useEffect(() => {
    sceneRef.current = createAquarium(style);
  }, [style]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      setAvailable(false);
      return;
    }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let request,
      previous,
      width = 1,
      height = 1;
    paint.current = () =>
      renderAquarium(context, sceneRef.current, width, height);
    function resize() {
      const size = canvas.getBoundingClientRect();
      width = Math.max(1, size.width);
      height = Math.max(1, size.height);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      paint.current();
    }
    function tick(now) {
      if (previous === undefined) previous = now;
      const delta = now - previous;
      if (delta >= 1000 / 30) {
        updateAquarium(sceneRef.current, delta / 1000);
        paint.current();
        previous = now;
      }
      request = requestAnimationFrame(tick);
    }
    function playback() {
      cancelAnimationFrame(request);
      previous = undefined;
      if (active && !paused && !motion.matches && !document.hidden)
        request = requestAnimationFrame(tick);
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    document.addEventListener("visibilitychange", playback);
    motion.addEventListener("change", playback);
    playback();
    return () => {
      cancelAnimationFrame(request);
      observer.disconnect();
      document.removeEventListener("visibilitychange", playback);
      motion.removeEventListener("change", playback);
      paint.current = () => {};
    };
  }, [active, paused, style]);

  function change(direction) {
    selectScene(
      (index + direction + aquariumStyles.length) % aquariumStyles.length,
    );
  }
  function selectScene(next) {
    setIndex(next);
    setStatus("");
  }
  function feed(x = 0.5) {
    const added = feedAquarium(sceneRef.current, x);
    paint.current();
    setStatus(
      added
        ? paused
          ? "Ready when you are. Resume the scene to watch it unfold."
          : action.success
        : "Give the scene a moment before adding more.",
    );
  }
  return (
    <section className="aquarium-app" aria-label="ASCII aquariums and worlds">
      <div className="aquarium-picker" aria-label="Browse scenes">
        <button aria-label="Previous Scene" onClick={() => change(-1)}>
          ‹
        </button>
        <div className="aquarium-caption">
          <select
            aria-label="Choose Scene"
            value={style.id}
            onChange={(event) =>
              selectScene(
                aquariumStyles.findIndex(
                  (item) => item.id === event.target.value,
                ),
              )
            }
          >
            {aquariumStyles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <span aria-live="polite">
            {index + 1} of {aquariumStyles.length} · Swipe to explore
          </span>
        </div>
        <button aria-label="Next Scene" onClick={() => change(1)}>
          ›
        </button>
      </div>
      <div className="aquarium-stage">
        <canvas
          ref={canvasRef}
          role="img"
          tabIndex={0}
          aria-label={`${style.name}. ${style.description} ${action.instruction} Left and right arrows change scenes. Enter activates ${action.label}.`}
          onKeyDown={(event) => {
            if (["ArrowLeft", "ArrowRight", "Enter", " "].includes(event.key)) {
              event.preventDefault();
              event.stopPropagation();
              if (event.key.startsWith("Arrow"))
                change(event.key === "ArrowLeft" ? -1 : 1);
              else feed();
            }
          }}
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0) return;
            swipe.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={(event) => {
            const start = swipe.current;
            swipe.current = null;
            if (!start || start.id !== event.pointerId) return;
            const dx = event.clientX - start.x,
              dy = event.clientY - start.y;
            if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.25)
              change(dx < 0 ? 1 : -1);
            else if (Math.hypot(dx, dy) < 14) {
              const box = event.currentTarget.getBoundingClientRect();
              feed((event.clientX - box.left) / box.width);
            }
          }}
          onPointerCancel={() => {
            swipe.current = null;
          }}
          onLostPointerCapture={() => {
            swipe.current = null;
          }}
        >
          {style.description}
        </canvas>
      </div>
      <p className="aquarium-description">{style.description}</p>
      <div className="aquarium-controls">
        <button onClick={() => feed()} disabled={!available}>
          {action.label}
        </button>
        <button
          onClick={() => {
            if (paused)
              setStatus(
                sceneRef.current.food.length
                  ? action.success
                  : action.instruction,
              );
            setPaused((value) => !value);
          }}
          disabled={!available}
        >
          {paused ? "Resume Scene" : "Pause Scene"}
        </button>
      </div>
      <p className="aquarium-status" role="status">
        {available
          ? status || action.instruction
          : "This browser couldn’t draw the aquarium. Please try another browser."}
      </p>
    </section>
  );
}
