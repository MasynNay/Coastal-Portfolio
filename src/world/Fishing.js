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
