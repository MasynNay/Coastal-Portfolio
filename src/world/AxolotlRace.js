import { characters } from "./config";
import { movementDirection } from "./animation";

// The pier marker, interaction point and artwork share one world position.
export const axolotlRaceMarker = {
  id: "axolotl-race",
  art: "harbor-race-start",
  x: 0,
  z: 30.8,
  h: 2.8,
  type: "race",
  label: "Start an axolotl race",
};
export const raceCourse = {
  startX: -13,
  finishX: 13,
  firstLaneZ: 34.5,
  laneSpacing: 3.3,
};
// These exact boundaries are also used to paint each floating lane and gate.
const laneColors = ["#64bed6", "#efadb8", "#bca6e3", "#a7dbc1", "#eed589"];
export const raceLanes = characters.map((person, lane) => ({
  ...person,
  number: lane + 1,
  color: laneColors[lane],
  // The art is anchored at the mount's feet. Center the whole seated figure
  // inside its lane, rather than putting its head in the adjacent lane.
  swimmerZ: raceCourse.firstLaneZ + lane * raceCourse.laneSpacing,
  z: raceCourse.firstLaneZ + lane * raceCourse.laneSpacing - 0.8,
  near: raceCourse.firstLaneZ + (lane - 0.5) * raceCourse.laneSpacing - 0.8,
  far: raceCourse.firstLaneZ + (lane + 0.5) * raceCourse.laneSpacing - 0.8,
}));
export const raceView = {
  x: 0,
  z: (raceLanes[0].near + raceLanes[raceLanes.length - 1].far) / 2,
  width: 32,
  height: raceLanes.length * raceCourse.laneSpacing + 2,
};
const countdownMs = 3000;
const clamp = (n) => Math.max(0, Math.min(1, n));

// This is an automatic family race, not another movement controller. A fair
// shuffle chooses finishing order once; the actual swimmers cross in that order.
// World time pauses with menus/backgrounding, so no wall-clock timers leak out.
export function createAxolotlRace(random = Math.random) {
  let race = null;
  let snapshot = null;
  function sample(time) {
    const age = Math.max(0, time - race.started);
    const elapsed = Math.max(0, age - countdownMs);
    const phase =
      age < countdownMs
        ? "countdown"
        : elapsed < race.lastFinish
          ? "racing"
          : "finished";
    const racers = characters.map((person, lane) => {
      const rank = race.order.indexOf(person.id);
      const duration = 18000 + rank * 700;
      const t = clamp(elapsed / duration);
      // Small surges change the lead early on without teleporting, reversing,
      // leaving a lane, or allowing a different swimmer to win at the finish.
      const surge =
        Math.sin(elapsed / 1300 + lane) * 0.018 * Math.sin(t * Math.PI);
      const progress = clamp(t + surge);
      return {
        id: person.id,
        name: person.name,
        outfit: null,
        x:
          raceCourse.startX +
          progress * (raceCourse.finishX - raceCourse.startX),
        z: raceLanes[lane].swimmerZ,
        direction: movementDirection(1, 0),
        surfing: true,
        moving: phase === "racing" && t < 1,
        time: elapsed,
        finished: t === 1,
      };
    });
    return {
      phase,
      countdown:
        phase === "countdown" ? Math.ceil((countdownMs - age) / 1000) : null,
      racers,
      winner: characters.find((p) => p.id === race.order[0]),
      order: race.order.map((id) => characters.find((p) => p.id === id)),
    };
  }
  return {
    start(origin, time) {
      if (race) return false;
      const order = characters.map((p) => p.id);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.min(i, Math.floor(clamp(random()) * (i + 1)));
        [order[i], order[j]] = [order[j], order[i]];
      }
      race = {
        origin: { ...origin },
        started: time,
        order,
        lastFinish: 18000 + (order.length - 1) * 700,
      };
      snapshot = sample(time);
      return true;
    },
    active: () => race !== null,
    snapshot: () => snapshot,
    update(time) {
      if (!race) return null;
      snapshot = sample(time);
      if (time - race.started < countdownMs + race.lastFinish + 1200)
        return { ...snapshot, done: false };
      const result = { ...snapshot, origin: race.origin, done: true };
      race = null;
      snapshot = null;
      return result;
    },
    cancel() {
      const origin = race?.origin;
      race = null;
      snapshot = null;
      return origin;
    },
  };
}
