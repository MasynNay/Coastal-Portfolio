import { createSkateRide, skateboard } from "./SkateRide";
import { canStand } from "./navigation";
import { obstacles } from "./config";
test("the board steers, jumps while moving, stops on release, and returns to the rack", () => {
  const ride = createSkateRide(),
    origin = { x: skateboard.x - 1, z: skateboard.z };
  expect(ride.start(origin, 0)).toBe(true);
  let t = 0;
  expect(ride.trick(0)).toBe(true);
  for (let i = 0; i < 40; i++) {
    t += 16;
    const p = ride.update(0.016, t, { x: -1, z: 0 });
    expect(canStand(p.x, p.z, obstacles)).toBe(true);
  }
  const p = ride.snapshot();
  expect(p.x).toBeLessThan(skateboard.x - 3);
  expect(p.trick).toBe("Ollie!");
  expect(ride.update(0.016, t + 16)).toMatchObject({
    x: p.x,
    z: p.z,
    moving: false,
  });
  expect(ride.return()).toBe(true);
  const returning = [];
  for (let i = 0; i < 2000 && ride.active(); i++) {
    t += 16;
    const p = ride.update(0.016, t);
    if (!p.done) returning.push(p);
  }
  expect(returning.length).toBeGreaterThan(0);
  for (const p of returning) expect(canStand(p.x, p.z, obstacles)).toBe(true);
  expect(ride.snapshot()).toMatchObject({ ...origin, done: true });
});
test("touch paths stay on land and cancelling restores the exact starting spot", () => {
  const ride = createSkateRide(),
    origin = { x: 25, z: 4 };
  ride.start(origin, 0);
  expect(ride.steer({ x: 40, z: 35 })).toBe(false);
  expect(ride.steer({ x: 8.75, z: 7 })).toBe(true);
  for (let i = 1; i < 500; i++) {
    const p = ride.update(0.016, i * 16);
    expect(canStand(p.x, p.z, obstacles)).toBe(true);
  }
  expect(ride.cancel()).toEqual(origin);
  expect(ride.active()).toBe(false);
});

test("a kickflip turns the deck while the body stays upright, and crouching happens before takeoff", () => {
  const ride = createSkateRide();
  ride.start({ x: 25, z: 4 }, 0);
  ride.trick(0);
  expect(ride.update(0, 100)).toMatchObject({ lift: 0, spin: 0 });
  ride.update(0, 1800);
  expect(ride.trick(1900)).toBe(true);
  const jump = ride.update(0.1, 1900 + 850 * 0.47, { x: -1, z: 0 });
  expect(jump.deckFlip).toBeCloseTo(Math.PI);
  expect(jump.spin).toBe(0);
  expect(jump.moving).toBe(true);
  expect(jump.lift).toBeGreaterThan(0.7);
  expect(jump.trick).toBe("Kickflip!");
});
