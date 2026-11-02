import { useEffect, useRef, useState } from "react";
import SpritePose from "../SpritePose";
// A shot freezes its target, flies from the archer to the measured hit point,
// then plays the complete non-graphic defeat drawing. Targets remain mounted
// until their wave ends so tapping cannot fall through onto the modal backdrop.
export default function OrcGame() {
  const [playing, setPlaying] = useState(false),
    [remaining, setRemaining] = useState(30),
    [score, setScore] = useState(0),
    [wave, setWave] = useState(0),
    [count, setCount] = useState(3),
    [shots, setShots] = useState({}),
    [clock, setClock] = useState(0);
  const field = useRef(null),
    shotIds = useRef(new Set()),
    began = useRef(0);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setClock(performance.now());
      setRemaining(
        Math.max(
          0,
          30 - Math.floor((performance.now() - began.current) / 1000),
        ),
      );
    }, 32);
    return () => clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    if (remaining === 0) setPlaying(false);
  }, [remaining]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setWave((n) => n + 1);
      setCount(3 + Math.floor(Math.random() * 3));
      setShots({});
      shotIds.current.clear();
    }, 5000);
    return () => clearInterval(timer);
  }, [playing]);
  function start() {
    setScore(0);
    setRemaining(30);
    setWave((n) => n + 1);
    setCount(3 + Math.floor(Math.random() * 3));
    setShots({});
    shotIds.current.clear();
    began.current = performance.now();
    setClock(performance.now());
    setPlaying(true);
  }
  function shoot(index, node) {
    if (!playing || shotIds.current.has(index)) return;
    shotIds.current.add(index);
    const rect = node.getBoundingClientRect(),
      stage = field.current.getBoundingClientRect();
    const shot = {
      angle:
        (Math.atan2(
          rect.top - stage.top + rect.height * 0.52 - stage.height * 0.94,
          rect.left - stage.left + rect.width * 0.5 - stage.width * 0.09,
        ) *
          180) /
        Math.PI,
      started: performance.now(),
      x:
        ((rect.left - stage.left + rect.width * 0.5) / (stage.width || 1)) *
        100,
      y:
        ((rect.top - stage.top + rect.height * 0.52) / (stage.height || 1)) *
        100,
    };
    setShots((old) => ({ ...old, [index]: shot }));
    setScore((n) => n + 100);
  }
  const recent = Object.values(shots).some((s) => clock - s.started < 1100);
  return (
    <div className="island-mini-game orc-archery">
      <p>
        Defend the dwarven hall. Tap or click a running orc to loose an arrow.
        Each hit earns 100 points. Waves bring three to five orcs at a time.
        Clear them before the next wave arrives.
      </p>
      <div className="mini-score">
        <strong>{score} points</strong>
        <span>{remaining}s</span>
        <button onClick={start}>{playing ? "Restart" : "Start round"}</button>
      </div>
      <div
        ref={field}
        className="orc-hunt-field"
        style={{
          backgroundImage: "url('/world/games/orc-moria.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-label="Orc Hunt clearing"
      >
        {playing ? (
          Array.from({ length: count }, (_, i) => {
            const shot = shots[i],
              age = shot ? Math.max(0, clock - shot.started) : 0,
              defeated = !!shot && age >= 320;
            return (
              <button
                key={`${wave}-${i}`}
                className="orc-hunt-target"
                aria-label={
                  shot ? "Defeated orc " + (i + 1) : "Shoot orc " + (i + 1)
                }
                aria-disabled={!!shot}
                data-shot={!!shot}
                data-defeated={defeated}
                style={{
                  "--lane": i,
                  "--target-top": `${3 + i * (67 / Math.max(1, count - 1))}%`,
                  "--delay": `${i * 0.45}s`,
                  animationPlayState: shot ? "paused" : "running",
                  opacity: age > 900 ? Math.max(0, 1 - (age - 900) / 350) : 1,
                }}
                onClick={(e) => shoot(i, e.currentTarget)}
              >
                <SpritePose
                  asset={
                    (i % 2 ? "orc-guard" : "orc-scout") +
                    (defeated ? "-hit" : "")
                  }
                  scale={0.42}
                  direction={2}
                  playing={!shot}
                  frame={
                    defeated
                      ? Math.min(7, Math.floor((age - 320) / 80))
                      : shot
                        ? 2
                        : null
                  }
                  label={defeated ? "Defeated orc" : "Running orc"}
                />
              </button>
            );
          })
        ) : (
          <div className="orc-hunt-ready">
            <button
              className="orc-hunt-start-card"
              onClick={start}
              aria-label={
                remaining === 0 ? "Play Orc Hunt again" : "Start Orc Hunt"
              }
            >
              <strong>
                {remaining === 0 ? "The hall is safe." : "Orc Hunt"}
              </strong>
              <span>
                {remaining === 0
                  ? `${score} points. Ready for another round?`
                  : "Tap a target. Watch your arrow fly."}
              </span>
            </button>
          </div>
        )}
        {playing && (
          <div className="orc-hunt-archer" aria-hidden="true">
            <SpritePose
              asset={recent ? "ability-arrow" : "costume-skills"}
              scale={2.25}
              direction={3}
              playing={recent}
              label="Woodland archer"
            />
          </div>
        )}
        <div className="orc-hunt-arrows" aria-hidden="true">
          {Object.entries(shots).map(([id, shot]) => {
            const age = Math.max(0, clock - shot.started);
            if (age > 650) return null;
            const t = Math.min(1, age / 320),
              x = 9 + (shot.x - 9) * t,
              y = 94 + (shot.y - 94) * t;
            return (
              <img
                key={id}
                className="orc-arrow"
                src="/world/games/arrow.png"
                alt=""
                style={{
                  left: x + "%",
                  top: y + "%",
                  transform: `translate(-100%,-50%) rotate(${shot.angle}deg)`,
                  opacity: age > 400 ? (650 - age) / 250 : 1,
                }}
              />
            );
          })}
        </div>
      </div>
      <p role="status">
        {Object.keys(shots).length === count
          ? "Perfect aim! The next wave is coming."
          : playing
            ? "An arrow for every target. Keep your aim steady."
            : "Thirty seconds. Three to five targets per wave."}
      </p>
    </div>
  );
}
