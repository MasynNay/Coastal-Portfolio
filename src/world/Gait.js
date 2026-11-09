import timing from "./Gait.json";
import { walkSpeed, runSpeed } from "./Movement";

// The engine stores stride phase in walking-clock milliseconds. A faster
// movement speed gives a longer running stride instead of multiplying an
// already separate running animation's playback speed a second time.
export const { walkCycleMs, runCycleMs } = timing;

export function advanceGait(distance, running = false) {
  const speed = running ? runSpeed : walkSpeed;
  const cycle = running ? runCycleMs : walkCycleMs;
  return (Math.max(0, distance) / speed) * 1000 * (walkCycleMs / cycle);
}

// Convert the shared phase only after the renderer resolves the actual sheet,
// including its same-costume loading fallback. Switching walk/run keeps the
// same leading foot. Fishing, surfing, abilities and vehicle clocks stay intact.
export function gaitTimeForSheet(sheet, time) {
  if (!sheet || !["walk", "run"].includes(sheet.action)) return time;
  const duration = (sheet.cycleFrames || sheet.columns || 4) * sheet.frameMs;
  return (time / walkCycleMs) * duration;
}

// Land the last step before switching to the drawn standing pose. This keeps
// one actor's stride independent of the other's and never blends two bodies.
export function createFootfalls() {
  const actors = new Map();
  return (actor, sheet, now) => {
    const previous = actors.get(actor.id);
    if (!sheet?.rootAligned || !["walk", "run"].includes(sheet.action)) {
      actors.delete(actor.id);
      return actor;
    }
    if (actor.moving) {
      actors.set(actor.id, { stride: actor, stopped: null });
      return actor;
    }
    if (!previous) return actor;
    const stride = previous.stride;
    previous.stopped ??= now;
    const age = now - previous.stopped;
    if (
      age >= 115 ||
      Math.hypot(stride.x - actor.x, stride.z - actor.z) > 0.8 ||
      stride.art.replace(/-run$/, "") !== actor.art
    ) {
      actors.delete(actor.id);
      return actor;
    }
    // Let the pose advance by one or two authored frames, while the actual
    // collision position remains planted and ready for the next input.
    const t = age / 115;
    return {
      ...actor,
      art: stride.art,
      direction: stride.direction,
      moving: true,
      time: stride.time + (walkCycleMs / 10) * (1 - (1 - t) ** 2),
    };
  };
}
