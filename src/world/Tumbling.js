// Two back handsprings feed into a backward layout with a full twist.
// Each authored key has a time, travel fraction, and height above the floor.
const firstHandspring = [
  [0, 1, 0, 0],
  [65, 2, 0.01, 0],
  [130, 3, 0.03, 0],
  [195, 4, 0.06, 0.15],
  [260, 5, 0.1, 0.35],
  [325, 6, 0.15, 0.16],
  [390, 7, 0.2, 0],
  [450, 8, 0.22, 0],
  [510, 9, 0.27, 0.27],
  [570, 10, 0.3, 0.1],
  [630, 11, 0.33, 0],
];
const routine = [
  [0, 0, 0, 0],
  ...firstHandspring.map(([t, frame, travel, lift]) => [
    t + 150,
    frame,
    travel,
    lift,
  ]),
  ...firstHandspring
    .slice(2)
    .map(([t, frame, travel, lift]) => [t + 700, frame, travel + 0.32, lift]),
  [1390, 12, 0.67, 0.16],
  [1455, 13, 0.69, 0.48],
  [1530, 14, 0.73, 1.22],
  [1615, 15, 0.78, 1.14],
  [1700, 16, 0.83, 1.22],
  [1785, 17, 0.88, 1.15],
  [1860, 18, 0.92, 0.9],
  [1930, 19, 0.96, 0.36],
  [2000, 20, 0.99, 0.06],
  [2060, 21, 1, 0],
  [2155, 22, 1, 0],
  [2260, 23, 1, 0],
];
export const tumblingDuration = 2650;

export function planTumbling(effect, canVisit) {
  const backward = effect.direction > 4 ? 1 : -1;
  for (const distance of [4.7, 3.6, 2.8]) {
    for (const side of [backward, -backward]) {
      const safe = Array.from({ length: 33 }, (_, i) =>
        canVisit({ x: effect.x + (side * distance * i) / 32, z: effect.z }),
      ).every(Boolean);
      if (safe)
        return {
          ...effect,
          direction: side < 0 ? 2 : 6,
          distance: side * distance,
        };
    }
  }
  return null;
}

export function tumblingPose(effect, time) {
  if (effect?.kind !== "tumbling" || !effect.distance) return null;
  const age = Math.max(0, time - effect.started);
  const next = routine.findIndex(([at]) => at > age);
  const [from, frame, travel, lift] =
    routine[next < 0 ? routine.length - 1 : next - 1];
  const [until, nextFrame, to, peak] =
    next < 0 ? [age + 1, frame, travel, lift] : routine[next];
  const t = (age - from) / (until - from);
  return {
    x: effect.x + (travel + (to - travel) * t) * effect.distance,
    z: effect.z,
    lift: lift + (peak - lift) * t,
    frame,
    between: nextFrame === frame + 1 && t >= 0.5,
  };
}
