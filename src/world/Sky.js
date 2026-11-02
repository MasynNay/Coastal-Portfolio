export const flyoverPeriod = 30000;
export const mockingjayCycle = (time) =>
  (Math.floor(time / flyoverPeriod) + 1) % 10 === 0;

// One small flock crosses the current view roughly every 30 seconds. No timers,
// accumulated entities or collision bodies: the pauseable world clock owns it.
export function skyBirds(time, center) {
  const cycle = Math.floor(time / flyoverPeriod),
    age = (time % flyoverPeriod) - 4000,
    mockingjays = mockingjayCycle(time);
  if (age < 0 || age > 10000) return [];
  const direction = cycle % 2 ? 6 : 2,
    sign = direction === 2 ? 1 : -1;
  return Array.from({ length: mockingjays ? 3 : 3 + (cycle % 2) }, (_, i) => ({
    art: mockingjays
      ? "mockingjay-flight"
      : cycle % 5 === 4
        ? "mallard-flight"
        : cycle % 3 === 2
          ? "swallow-flight"
          : "gull-flight",
    x: center.x + sign * (-27 + (age / 10000) * 54 - Math.abs(i - 1.5) * 1.3),
    z: center.z - 2 + (i - 1.5) * 1.1 + Math.sin(age / 1500 + i) * 0.12,
    h: 1.35,
    direction,
    time: time + i * 90,
    lift: 5.5,
  }));
}

// The sky's pauseable clock counts actual outdoor flyovers. Trigger once as
// the special flock reaches the visitor; render time alone cannot retrigger it.
export function createSkySalute() {
  let active = null,
    seen = -1;
  return {
    update(time, eligible = true, clock = time) {
      if (active && clock >= active.started + 3000) active = null;
      const cycle = Math.floor(time / flyoverPeriod),
        phase = time % flyoverPeriod;
      if (
        !active &&
        eligible &&
        mockingjayCycle(time) &&
        cycle !== seen &&
        phase >= 8500 &&
        phase < 11000
      ) {
        seen = cycle;
        active = { started: clock };
      }
      return active
        ? {
            elapsed: clock - active.started,
            frame: Math.min(7, Math.floor((clock - active.started) / 375)),
          }
        : null;
    },
    active: () => !!active,
    start(clock) {
      if (active) return false;
      active = { started: clock };
      return true;
    },
    cancel() {
      active = null;
    },
  };
}
