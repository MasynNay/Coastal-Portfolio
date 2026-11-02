import { bikes, bikeHeight, createBikeRide } from "./Bikes";
import { obstacles } from "./config";
import { canStand } from "./navigation";
import { playerPose } from "./PlayerPose";
import sheets from "./SpriteSheets.json";
import appearances from "./Appearances.json";
import { personHeight } from "./Movement";

test("the same rental keeps its parked size under every family member and costume", () => {
  for (const look of appearances)
    for (const bike of bikes) {
      const asset = playerPose({
        character: look.character,
        outfit: look.id,
        bikeRide: { id: bike.id, phase: "riding" },
      });
      expect(asset).toBe(look.asset + "-bike-" + bike.id);
      const sheet = sheets[asset];
      expect(sheet.drawn).toBe(true);
      expect(sheet.bikeWorldHeight).toBe(bikeHeight);
      // The child keeps their own body height while the bicycle stays full size.
      const displayedBikeHeight =
        (sheet.bikeHeight / sheet.bodyHeight) * personHeight(look.character);
      expect(displayedBikeHeight).toBeCloseTo(bikeHeight, 5);
      expect(sheet.cw).toBeGreaterThanOrEqual(192);
      expect(sheet.footY).toBeLessThan(sheet.ch);
    }
});

test.each(bikes)(
  "$name makes a smooth dry-land pond lap, avoids the other bicycle and returns",
  (bike) => {
    const tour = createBikeRide(),
      origin = { x: 25, z: bike.z },
      other = bikes.find((b) => b.id !== bike.id);
    expect(tour.start(bike.id, origin, 0)).toBe(true);
    expect(tour.start(other.id, origin, 0)).toBe(false);
    let previous = tour.update(0),
      finished = false,
      minX = Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    for (let time = 0; time < 30000; time += 20) {
      const p = tour.update(time);
      expect(canStand(p.x, p.z, obstacles)).toBe(true);
      expect(Math.hypot(p.x - other.x, p.z - other.z)).toBeGreaterThan(2.7);
      expect(
        Math.hypot(p.x - previous.x, p.z - previous.z),
      ).toBeLessThanOrEqual(bike.speed * 0.02 + 0.001);
      minX = Math.min(minX, p.x);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
      previous = p;
      if (p.done) {
        finished = true;
        break;
      }
    }
    expect(finished).toBe(true);
    expect(previous).toMatchObject(origin);
    expect(minX).toBeLessThan(-7.5);
    expect(minZ).toBeLessThan(-10);
    expect(maxZ).toBeGreaterThan(6);
    expect(tour.active()).toBe(false);
  },
);
test("cancelling a ride restores its origin; every family rider has both complete directional sheets", () => {
  const tour = createBikeRide(),
    origin = { x: 25, z: bikes[0].z };
  tour.start("acro", origin, 0);
  tour.update(2500);
  expect(tour.cancel()).toEqual(origin);
  expect(tour.snapshot()).toBe(null);
  for (const character of ["masyn", "mi-shell", "ezra", "fallyn", "fitzgerald"])
    for (const bike of bikes) {
      const pose = playerPose({
        character,
        bikeRide: { id: bike.id, phase: "riding" },
      });
      expect(pose).toBe(character + "-bike-" + bike.id);
      expect(sheets[pose].rows).toBe(8);
      expect(sheets[pose].drawn).toBe(true);
      expect(sheets[pose].cycleFrames).toBeGreaterThanOrEqual(8);
    }
});

test("duplicate route-leg endpoints cannot collapse a guided lap", () => {
  const { roundPath } = require("./Paths");
  const start = { x: 10, z: 10 },
    east = { x: 16, z: 10 },
    corner = { x: 16, z: 14 };
  const route = roundPath(
    [start, start, east, east, corner, corner, start, start],
    [],
  );
  expect(route[0]).toEqual(start);
  expect(route.at(-1)).toEqual(start);
  expect(route.length).toBeGreaterThan(4);
  expect(route.some((p) => p.x > 15)).toBe(true);
  expect(route.some((p) => p.z > 13)).toBe(true);
});
