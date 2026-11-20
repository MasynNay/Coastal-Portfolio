import { useEffect, useRef, useState } from "react";
import {
  bouquetStyles,
  createBouquet,
  createFrame,
  renderBouquet,
} from "./Bouquet";
import "./Bloom.css";

export default function Bloom({ active }) {
  const canvasRef = useRef(null);
  const elapsed = useRef(0);
  const swipe = useRef(null);
  const [bouquetIndex, setBouquetIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [restart, setRestart] = useState(0);
  const [available, setAvailable] = useState(true);
  const style = bouquetStyles[bouquetIndex];

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      setAvailable(false);
      return;
    }
    const scene = createBouquet(style);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame;
    let cellWidth;
    let cellHeight;
    let request;
    let previous;

    function draw() {
      renderBouquet(
        context,
        scene,
        frame,
        elapsed.current,
        cellWidth,
        cellHeight,
      );
    }

    function resize() {
      // Measure the available app area, including after dragging a resize grip.
      // DPR is capped to keep the character grid affordable on mobile devices.
      const { width, height } = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      // Match the reference's dense terminal rows even in a small Mac window.
      // Fitting by height preserves complete petals, wrap, and ribbon on phones.
      const fontSize = Math.max(5, Math.min(10, height / 64));
      context.font = `bold ${fontSize}px "Courier New", monospace`;
      context.textBaseline = "top";
      cellWidth = context.measureText("M").width;
      cellHeight = cellWidth * 2;
      frame = createFrame(
        Math.max(1, Math.floor(width / cellWidth)),
        Math.max(1, Math.floor(height / cellHeight)),
      );
      draw();
    }

    function tick(timestamp) {
      request = undefined;
      if (previous === undefined) previous = timestamp;
      const delta = timestamp - previous;
      if (delta >= 1000 / 24) {
        elapsed.current += Math.min(delta, 100) / 1000;
        previous = timestamp;
        draw();
      }
      request = requestAnimationFrame(tick);
    }

    function syncPlayback() {
      cancelAnimationFrame(request);
      request = undefined;
      previous = undefined;
      if (active && !paused && !document.hidden && !motion.matches) {
        request = requestAnimationFrame(tick);
      }
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    document.addEventListener("visibilitychange", syncPlayback);
    motion.addEventListener("change", syncPlayback);
    syncPlayback();
    return () => {
      cancelAnimationFrame(request);
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      motion.removeEventListener("change", syncPlayback);
    };
  }, [active, paused, restart, style]);

  function changeBouquet(direction) {
    elapsed.current = 0;
    setBouquetIndex(
      (index) =>
        (index + direction + bouquetStyles.length) % bouquetStyles.length,
    );
  }

  function startSwipe(event) {
    if (!event.isPrimary || event.button !== 0) return;
    swipe.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function finishSwipe(event) {
    const start = swipe.current;
    if (!start || start.id !== event.pointerId) return;
    swipe.current = null;
    const horizontal = event.clientX - start.x;
    const vertical = event.clientY - start.y;
    // Only deliberate horizontal swipes change flowers. Vertical scrolling
    // and pinching remain available inside small, touch-sized Mac windows.
    if (
      Math.abs(horizontal) >= 48 &&
      Math.abs(horizontal) > Math.abs(vertical) * 1.25
    ) {
      changeBouquet(horizontal < 0 ? 1 : -1);
    }
  }

  function replay() {
    elapsed.current = 0;
    setPaused(false);
    setRestart((value) => value + 1);
  }

  return (
    <div className="bloom-app">
      <p className="bloom-command">
        <span>masyn@mac</span> <span className="bloom-path">~ %</span> python3
        bouquet.py
      </p>
      <div className="bloom-picker" aria-label="Choose a bouquet">
        <button aria-label="Previous Bouquet" onClick={() => changeBouquet(-1)}>
          <span aria-hidden="true">‹</span>
        </button>
        <p aria-live="polite" aria-atomic="true">
          <strong>{style.name}</strong>
          <span>
            {bouquetIndex + 1} of {bouquetStyles.length} · Swipe to explore
          </span>
        </p>
        <button aria-label="Next Bouquet" onClick={() => changeBouquet(1)}>
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <div
        className="bloom-stage"
        onPointerDown={startSwipe}
        onPointerUp={finishSwipe}
        onPointerCancel={() => {
          swipe.current = null;
        }}
        onLostPointerCapture={() => {
          swipe.current = null;
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          tabIndex={0}
          aria-label={`${style.name}. ${style.description} A rotating 3D bouquet drawn with colored text, surrounded by floating hearts. Swipe or use the left and right arrow keys to change bouquets.`}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              event.stopPropagation();
              changeBouquet(event.key === "ArrowRight" ? 1 : -1);
            }
          }}
        >
          {style.description}
        </canvas>
        {!available && (
          <p>
            Your browser couldn’t draw the bouquet. Please try another browser.
          </p>
        )}
      </div>
      <div className="bloom-footer">
        <p className="bloom-message">
          For Mi Shell <span aria-hidden="true">♥</span>
        </p>
        <p className="bloom-dedication">
          Thank you for the family, the laughter, and the life we’re building
          together. I love you.
          <span>— Masyn</span>
        </p>
        <div className="bloom-actions">
          <button
            onClick={() => setPaused((value) => !value)}
            disabled={!available}
          >
            {paused ? "Resume Rotation" : "Pause Rotation"}
          </button>
          <button onClick={replay} disabled={!available}>
            Bloom Again
          </button>
        </div>
      </div>
    </div>
  );
}
