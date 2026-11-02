import { createRestSpots, restSpots } from "./RestSpots";
import { canStand, findPath } from "./navigation";
import { obstacles } from "./config";
import { roamingAnimals } from "./Roaming";
import { playerPose } from "./PlayerPose";
import appearances from "./Appearances.json";
test("both rest spots are reachable, preserve the wearer's seated costume and restore the entry location", () => {
  for (const spot of restSpots) {
    const approach = { x: spot.x, z: spot.z + 0.9 };
    expect(canStand(approach.x, approach.z, obstacles)).toBe(true);
    expect(
      findPath({ x: 0, z: 9 }, approach, obstacles).length,
    ).toBeGreaterThan(0);
    const rest = createRestSpots();
    expect(rest.start(spot.id, approach, 0)).toBeTruthy();
    expect(rest.active()).toBe(true);
    expect(Math.abs(rest.snapshot(500).rock)).toBeLessThan(0.07);
    for (const look of appearances)
      expect(
        playerPose({
          character: look.character,
          outfit: look.id,
          rest: rest.snapshot(0),
        }),
      ).toBe(look.asset + "-water-ride");
    expect(rest.stop()).toEqual(approach);
    expect(rest.active()).toBe(false);
  }
});
test("the named goose pair stays together, on water and clear of family ducks", () => {
  for (let t = 0; t < 60000; t += 500) {
    const animals = roamingAnimals(t),
      geese = animals.filter((a) => a.kind === "goose"),
      ducks = animals.filter((a) => a.kind === "duck");
    expect(geese.map((g) => g.name).sort()).toEqual([
      "Haymitch",
      "Lenore Dove",
    ]);
    expect(geese[0].mate).toBe(geese[1].id);
    expect(
      Math.hypot(geese[0].x - geese[1].x, geese[0].z - geese[1].z),
    ).toBeCloseTo(2 * 3.2 * Math.sin(0.18));
    for (const goose of geese) {
      expect(goose.inWater).toBe(true);
      for (const duck of ducks)
        expect(Math.hypot(goose.x - duck.x, goose.z - duck.z)).toBeGreaterThan(
          0.6,
        );
    }
  }
});

test("both geese swim the full pond, face their travel and move continuously", () => {
  for (const id of ["white-goose", "canada-goose"]) {
    const points = [];
    for (let t = 0; t < 40000; t += 200) {
      const goose = roamingAnimals(t).find((a) => a.id === id),
        next = roamingAnimals(t + 20).find((a) => a.id === id);
      points.push(goose);
      expect(goose.moving).toBe(true);
      expect(Math.hypot(next.x - goose.x, next.z - goose.z) / 0.02).toBeCloseTo(
        3.2 / 6.2,
        2,
      );
      const dx = next.x - goose.x,
        dz = next.z - goose.z,
        angle = (goose.direction * Math.PI) / 4;
      expect(
        (Math.sin(angle) * dx + Math.cos(angle) * dz) / Math.hypot(dx, dz),
      ).toBeGreaterThan(0.92);
    }
    expect(
      Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x)),
    ).toBeGreaterThan(6);
    expect(
      Math.max(...points.map((p) => p.z)) - Math.min(...points.map((p) => p.z)),
    ).toBeGreaterThan(6);
  }
});
