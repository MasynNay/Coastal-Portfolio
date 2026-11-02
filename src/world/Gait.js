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
