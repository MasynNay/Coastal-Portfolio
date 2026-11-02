import { createFishingSequence } from "./Fishing";
import { chooseFish } from "./Fish";
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
test("casting happens in-world, waits before fading, and only then opens a catch result", () => {
  const phases = [],
    results = [];
  const fishing = createFishingSequence({
    onPhase: (p) => phases.push(p),
    onFinish: (r) => results.push(r),
    random: () => 0.2,
  });
  fishing.start();
  expect(phases).toEqual(["casting"]);
  jest.advanceTimersByTime(749);
  expect(results).toEqual([]);
  jest.advanceTimersByTime(1);
  expect(phases.at(-1)).toBe("waiting");
  jest.advanceTimersByTime(2100);
  expect(phases.at(-1)).toBe("bite");
  jest.advanceTimersByTime(450);
  expect(phases.at(-1)).toBe("fade");
  expect(results).toEqual([]);
  jest.advanceTimersByTime(350);
  // Timing should remain stable when species are added to the catalog.
  const fish = chooseFish(() => 0.2);
  expect(results).toEqual([
    { caught: true, fish: fish.name, fishId: fish.id, rarity: fish.rarity },
  ]);
});
test("a fish can escape and cancelled casts cannot open a stray result panel", () => {
  const finish = jest.fn();
  const fishing = createFishingSequence({
    onPhase: () => {},
    onFinish: finish,
    random: () => 0.99,
  });
  fishing.start();
  jest.advanceTimersByTime(4000);
  expect(finish).toHaveBeenCalledWith({
    caught: false,
    fish: null,
  });
  finish.mockClear();
  fishing.start();
  jest.advanceTimersByTime(800);
  fishing.cancel();
  jest.advanceTimersByTime(10000);
  expect(finish).not.toHaveBeenCalled();
});

test.each(["freshwater", "saltwater"])(
  "the full cast sequence preserves its %s catch pool",
  (habitat) => {
    const finish = jest.fn();
    const fishing = createFishingSequence({
      onPhase: () => {},
      onFinish: finish,
      random: () => 0.2,
    });
    fishing.start(habitat);
    jest.advanceTimersByTime(4000);
    const fish = chooseFish(() => 0.2, habitat);
    expect(finish).toHaveBeenCalledWith({
      caught: true,
      fish: fish.name,
      fishId: fish.id,
      rarity: fish.rarity,
    });
  },
);
