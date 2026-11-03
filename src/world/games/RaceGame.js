import { useEffect, useRef, useState } from "react";
import { createAxolotlRace, raceCourse } from "../AxolotlRace";
import { characters } from "../config";
import { artwork } from "../art";
import SpritePose from "../SpritePose";
import "./RaceGame.css";

// The cartridge borrows the pier race's timing, random finishing order and
// rider artwork. Only its compact lane presentation differs from the world.
export default function RaceGame() {
  const race = useRef(createAxolotlRace());
  const [state, setState] = useState(null);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    let frame, last = 0, elapsed = 0, published = 0;
    function tick(now) {
      if (last && !document.hidden) elapsed += Math.min(100, now - last);
      last = now;
      if (now - published > 45) {
        const next = race.current.update(elapsed);
        setState(next);
        published = now;
        if (next?.done) { setRunning(false); return; }
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);
  function start() {
    race.current.cancel();
    race.current.start({}, 0);
    setState(race.current.snapshot());
    setRunning(true);
  }
  return (
    <div className="island-mini-game arcade-race">
      <p>Five family members, five axolotls, one finish line. Everyone has an equal chance to win.</p>
      <div className="mini-score">
        <strong role="status" aria-live="polite">
          {!state ? "Ready at the starting line" : state.phase === "countdown" ? `Starting in ${state.countdown}` : state.phase === "finished" ? `${state.winner.name} wins!` : "Go, go, go!"}
        </strong>
        <button disabled={running} onClick={start}>{state ? "Race again" : "Start race"}</button>
      </div>
      <div className="arcade-race-course" aria-label="Five separate racing lanes">
        {characters.map((person, index) => {
          const rider = state?.racers.find((entry) => entry.id === person.id);
          const progress = rider ? (rider.x - raceCourse.startX) / (raceCourse.finishX - raceCourse.startX) : 0;
          const asset = `${person.id}-surf`, sheet = artwork[asset];
          // Surf sheets include transparent space around the mount. Normalize
          // the visible rider, then crop only that empty margin in the lane.
          const scale = 48 * (sheet.detailVersion ? sheet.detailScale || 2 : 1) / (sheet.bodyHeight || sheet.ch);
          return (
            <div className="arcade-race-lane" key={person.id}>
              <span className="race-lane-number" aria-hidden="true">{index + 1}</span>
              <span className="race-start-line" aria-hidden="true" />
              <span className="race-finish-line" aria-hidden="true" />
              <div className="arcade-racer" style={{ left: `${10 + progress * 80}%` }}>
                {state?.phase === "finished" && state.winner.id === person.id && <span className="race-crown" role="img" aria-label="Winner’s crown">♛</span>}
                <span className="race-rider-art">
                  <SpritePose asset={asset} direction={2} scale={scale} playing={!!rider?.moving} label={`${person.name} riding their axolotl`} />
                </span>
                <small>{person.name}</small>
              </div>
            </div>
          );
        })}
      </div>
      {state?.phase === "finished" && <p className="arcade-race-result">The winner of this race is <strong>{state.winner.name}!</strong></p>}
    </div>
  );
}
