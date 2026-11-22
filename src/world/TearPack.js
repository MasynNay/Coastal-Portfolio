import { useEffect, useRef, useState } from "react";

// A partial drag only opens a partial seam. No tap-to-rip shortcut bypasses it.
// The same progress has keyboard control so a mouse/touch gesture is optional.
export function tearDistance(start, x, width, previous = 0) {
  return Math.min(
    1,
    previous + Math.abs(x - start) / Math.max(1, width * 0.78),
  );
}
export function PackArtwork({ pack }) {
  return (
    <div
      className="booster-art"
      style={{ "--pack-color": pack.color }}
      aria-hidden="true"
    >
      <span className="booster-crimp top" />
      <div className="booster-burst" />
      <img
        className="booster-set-logo"
        src={pack.logo}
        alt=""
        onError={(e) => {
          e.currentTarget.hidden = true;
        }}
      />
      <img
        className="pack-mascot"
        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pack.mascot}.png`}
        alt=""
      />
      <strong className="booster-set-name">Trading Card Game</strong>
      <small>5 POKÉMON CARDS</small>
      <span className="booster-crimp bottom" />
    </div>
  );
}
export default function TearPack({ pack, onRip }) {
  const [progress, setProgress] = useState(0),
    start = useRef(null),
    done = useRef(false),
    seam = useRef(null),
    furthest = useRef(0);
  useEffect(() => {
    seam.current?.focus();
  }, []);
  function advance(value) {
    value = Math.max(furthest.current, value);
    furthest.current = value;
    setProgress(value);
    if (value >= 1 && !done.current) {
      done.current = true;
      onRip();
    }
  }
  return (
    <div className="tear-stage">
      <p className="tear-instruction">
        Drag across the gold seal to tear open your pack.
      </p>
      <div
        className="sealed-booster"
        style={{ "--tear": `${progress * 100}%`, "--pack-color": pack.color }}
      >
        <PackArtwork pack={pack} />
        <div
          className="tear-flap"
          style={{
            transform: `translate(${progress * 45}px,${-progress * 20}px) rotate(${progress * 14}deg)`,
          }}
        />
        <div
          ref={seam}
          role="slider"
          tabIndex={0}
          aria-label={`Tear ${pack.name} pack seal`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-valuetext={`${Math.round(progress * 100)} percent open`}
          className="pack-tear-seam"
          onKeyDown={(e) => {
            if (["ArrowRight", "ArrowLeft", "End", "Home"].includes(e.key)) {
              e.preventDefault();
              advance(
                e.key === "End"
                  ? 1
                  : e.key === "Home"
                    ? progress
                    : Math.min(1, progress + 0.1),
              );
            }
          }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            start.current = { x: e.clientX, width: rect.width, progress };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (start.current)
              advance(
                tearDistance(
                  start.current.x,
                  e.clientX,
                  start.current.width,
                  start.current.progress,
                ),
              );
          }}
          onPointerUp={() => {
            start.current = null;
          }}
          onPointerCancel={() => {
            start.current = null;
          }}
        >
          <span>TEAR HERE</span>
          <i />
          <span className="tear-grip">⋮⋮</span>
        </div>
      </div>
      <p className="tear-keyboard-help">
        Touch or mouse: drag across the seal. Keyboard: focus the seal and use
        the arrow keys.
      </p>
    </div>
  );
}
