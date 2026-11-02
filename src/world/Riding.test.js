import { rideStops, boardPose, riderPosition } from "./Riding";
import { createWaterRide } from "./WaterRides";
import { craftWater } from "./Harbor";
import { canStand } from "./navigation";
import { obstacles } from "./config";
import sheets from "./SpriteSheets.json";
import { spriteFrame } from "./animation";
import { miniPoint } from "./MiniMap";
test("boat and jet-ski markers stay separate on the smallest landscape minimap", () => {
  const boat = rideStops.find((s) => s.id === "boat");
  const jetski = rideStops.find((s) => s.id === "jetski");
  const a = miniPoint(boat.mapPosition),
    b = miniPoint(jetski.mapPosition);
  // 128px map minus its borders; compact markers are 12px wide.
  expect(((b.left - a.left) / 100) * 122).toBeGreaterThan(14);
  expect(canStand(boat.x, boat.z, obstacles)).toBe(true);
  expect(canStand(jetski.x, jetski.z, obstacles)).toBe(true);
  expect(boat.mapPosition.x).toBeLessThan(boat.x);
  expect(jetski.mapPosition.x).toBeGreaterThan(jetski.x);
});
test("the two board rental markers point at reachable land and complete distinct body animations", () => {
  for (const id of ["skateboard", "boat", "jetski"]) {
    const stop = rideStops.find((s) => s.id === id);
    expect(stop.icon).toBe(id === "boat" ? "wakeboard" : id);
    expect(canStand(stop.x, stop.z, obstacles)).toBe(true);
  }
  for (const person of ["masyn", "mi-shell", "ezra", "fallyn", "fitzgerald"]) {
    for (const action of ["board-trick", "wake-ride"]) {
      const sheet = sheets[person + "-" + action];
      expect(sheet).toMatchObject({
        rows: 8,
        drawn: true,
        columns: 9,
        canonicalDirections: true,
        layout: "eight",
      });
      for (let d = 0; d < 8; d++)
        expect(spriteFrame(sheet, d, true, 350).row).toBeLessThan(8);
    }
    const a = boardPose(
        person,
        { trickProgress: 0, moving: true },
        false,
        5000,
        sheets,
      ),
      b = boardPose(
        person,
        { trickProgress: 0.99, moving: true },
        false,
        5000,
        sheets,
      );
    expect(a.asset).toBe(person + "-board-trick");
    expect(a.time).toBe(0);
    expect(b.time).toBe(
      (sheets[a.asset].cycleFrames - 1) * sheets[a.asset].frameMs,
    );
    expect(boardPose(person, { moving: true }, true, 3000, sheets).asset).toBe(
      person + "-wake-ride",
    );
  }
});
test("a visitor can wakeboard behind an NPC driver, flip while riding, and return exactly to the pier", () => {
  for (const controlled of [
    "masyn",
    "mi-shell",
    "ezra",
    "fallyn",
    "fitzgerald",
  ]) {
    const ride = createWaterRide(),
      origin = { x: -2.25, z: 27 },
      driver = controlled === "masyn" ? "mi-shell" : "masyn";
    expect(ride.start("boat", origin, false, 0, driver, controlled)).toBe(true);
    expect(riderPosition(ride.snapshot())).toMatchObject({
      id: controlled,
      x: -8,
      z: 27,
    });
    const tricks = [],
      returnPositions = [];
    let previous = riderPosition(ride.snapshot()),
      flipped = false;
    for (let t = 16; t < 2600; t += 16) {
      if (t === 800) tricks.push(ride.trick(t));
      const p = ride.update(0.016, t);
      expect(p.driver).toBe(driver);
      expect(p.craftId).toBe("boat");
      const rider = riderPosition(p);
      expect(rider.id).toBe(controlled);
      expect(craftWater(rider.x, rider.z, "boat")).toBe(true);
      expect(
        Math.hypot(rider.x - previous.x, rider.z - previous.z),
      ).toBeLessThan(0.3);
      if (rider.lift > 1) flipped = true;
      previous = rider;
    }
    expect(flipped).toBe(true);
    expect(tricks).toEqual([true]);
    expect(ride.return(2600)).toBe(true);
    for (let t = 2616; t < 30000 && ride.active(); t += 16) {
      const p = ride.update(0.016, t);
      if (!p.done) returnPositions.push({...riderPosition(p),at:t,boatX:p.x,boatZ:p.z});
    }
    expect(returnPositions.length).toBeGreaterThan(0);
    for (const p of returnPositions)
      if (!craftWater(p.x, p.z, "boat"))
        throw new Error(`Wakeboard return clips coast at ${JSON.stringify(p)}`);
    expect(ride.snapshot()).toMatchObject({
      ...origin,
      id: "boat",
      done: true,
    });
  }
});

test("the separate wakeboard stop is gone; the boat is the only wakeboarding entry", () => {
  expect(rideStops.some((stop) => stop.id === "wakeboard")).toBe(false);
  expect(rideStops.find((stop) => stop.id === "boat").title).toBe(
    "Wakeboard ride",
  );
  const ride = createWaterRide();
  expect(ride.start("wakeboard", { x: 0, z: 24 }, false, 0, "mi-shell")).toBe(
    false,
  );
});
