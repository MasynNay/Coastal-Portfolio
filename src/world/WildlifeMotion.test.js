import { bugMotionStyle, wildlifePose } from "./WildlifeMotion";
import { roamingAnimals } from "./Roaming";
import coast from "./CoastArt.json";
import { spriteFrame } from "./animation";

test("all bug groups have distinct secondary motion and flying insects stay above the ground", () => {
  const groups = [
    "Spiders",
    "Mantises",
    "Butterflies",
    "Ladybugs",
    "Dragonflies",
  ];
  expect(new Set(groups.map(bugMotionStyle)).size).toBe(groups.length);
  const base = { id: "test-bug", kind: "land", x: 1, z: 2 };
  for (const category of ["Butterflies", "Dragonflies"]) {
    const motion = wildlifePose({ ...base, category }, 360);
    expect(motion.lift).toBeGreaterThan(0);
    expect(motion).not.toHaveProperty("x");
    expect(motion).not.toHaveProperty("z");
  }
});

test("pond swimmers leave a wake and can advance through twelve paddle poses", () => {
  for (const bird of roamingAnimals(900).filter(
    (animal) => animal.kind === "goose",
  )) {
    expect(wildlifePose(bird, 900).wake).toBeGreaterThanOrEqual(0);
    expect(wildlifePose({ ...bird, inWater: false }, 900).wake).toBeUndefined();
    const sheet = coast[bird.art + "-swim"];
    expect(sheet.columns).toBe(12);
    const poses = new Set(
      Array.from(
        { length: sheet.columns },
        (_, i) =>
          spriteFrame(sheet, bird.direction, true, sheet.frameMs * i).column,
      ),
    );
    expect(poses.size).toBe(12);
  }
});

test("dogs hold their position during a sniff break and resume their patrol", () => {
  const dogs = Array.from({ length: 132 }, (_, i) =>
    roamingAnimals(i * 100).find((animal) => animal.id === "rosie"),
  );
  expect(dogs.some((dog) => dog.moving)).toBe(true);
  const stop = dogs.findIndex(
    (dog, i) => dog.sniffing && dogs[i + 1]?.sniffing,
  );
  expect(stop).toBeGreaterThanOrEqual(0);
  expect(dogs[stop]).toMatchObject({
    moving: false,
    x: dogs[stop + 1].x,
    z: dogs[stop + 1].z,
  });
});
