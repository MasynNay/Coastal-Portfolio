import { chooseFish } from "./Fish";
// Fishing plays on the map: cast once, hold the last rod pose while waiting,
// then fade to a small result panel. A single cancellable timer owns each phase.
export const fishingStages = [
  {
    phase: "casting",
    delay: 750,
  },
  {
    phase: "waiting",
    delay: 2100,
  },
  {
    phase: "bite",
    delay: 450,
  },
  {
    phase: "fade",
    delay: 350,
  },
];

const biteStart = fishingStages[0].delay + fishingStages[1].delay;
const biteDuration = fishingStages[2].delay;

export function fishingPull(elapsed, phase) {
  if (phase === "fade") return 1;
  if (phase !== "bite") return 0;
  const t = Math.min(1, Math.max(0, (elapsed - biteStart) / biteDuration));
  return 1 - (1 - t) ** 3;
}

export function fishingPoseTime(sheet, elapsed, phase) {
  if (!sheet?.frameMs) return 0;
  const hold = sheet.holdFrame ?? 3;
  if (phase === "bite" || phase === "fade") {
    // Reverse toward the drawn lift pose when reeling. It works for the same
    // eight directional frames while standing and on the axolotl.
    const lift = Math.max(0, hold - 4);
    return (
      (hold - Math.floor(fishingPull(elapsed, phase) * (hold - lift))) *
      sheet.frameMs
    );
  }
  return Math.min(elapsed || 0, hold * sheet.frameMs + 1);
}
export function createFishingSequence({
  onPhase,
  onFinish,
  random = Math.random,
}) {
  let timer = null;
  function cancel() {
    clearTimeout(timer);
    timer = null;
  }
  function start(habitat = null) {
    cancel();
    function stage(index) {
      if (index === fishingStages.length) {
        timer = null;
        const caught = random() < 0.72;
        const fish = caught ? chooseFish(random, habitat) : null;
        onFinish({
          caught: caught && !!fish,
          fish: fish?.name || null,
          ...(fish
            ? {
                fishId: fish.id,
                rarity: fish.rarity,
              }
            : {}),
        });
        return;
      }
      const { phase, delay } = fishingStages[index];
      onPhase(phase);
      timer = setTimeout(() => stage(index + 1), delay);
    }
    stage(0);
  }
  return {
    start,
    cancel,
  };
}
