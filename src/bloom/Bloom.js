import { useEffect, useRef, useState } from "react";
import { createBouquet, createFrame, renderBouquet } from "./Bouquet";
import "./Bloom.css";

export default function Bloom({ active }) {
  const canvasRef = useRef(null);
  const elapsed = useRef(0);
  const [paused, setPaused] = useState(false);
  const [restart, setRestart] = useState(0);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      setAvailable(false);
      return;
    }
    const scene = createBouquet();
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
  }, [active, paused, restart]);

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
      <div className="bloom-stage">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="A rotating 3D bouquet drawn entirely with colored text characters. Daisies and tulips sit in a paper wrap with a pink ribbon, surrounded by floating hearts."
        >
          A colorful ASCII bouquet of daisies and tulips, wrapped in paper and
          tied with a pink ribbon.
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
        <a
          href="https://github.com/alishsharma17/Ascii-Flower-Bouquet-"
          target="_blank"
          rel="noreferrer"
        >
          Original bouquet by Alish Sharma ↗
        </a>
      </div>
    </div>
  );
}
