import { shoreRuns, shoreReach, shorePoint } from "./Shore";
import { drawShore } from "./BeachScene";
import { pierDeck } from "./Coast";

test("the animated wash remains connected to the sea, including beside the pier", () => {
  expect(shoreRuns).toHaveLength(1);
  expect(shoreRuns[0].length).toBeGreaterThan(380);
  expect(shoreRuns[0][0]).toEqual(shoreRuns[0].at(-1));
  expect(shoreRuns[0].some((p) => Math.abs(p.x) < 3 && p.z > 23)).toBe(true);
  for (const p of shoreRuns[0]) {
    expect(Math.hypot(p.nx, p.nz)).toBeCloseTo(1);
    const ocean = shorePoint(p, -0.25);
    for (let t = 0; t < 16000; t += 600) {
      const reach = shoreReach(p, t),
        front = shorePoint(p, reach);
      expect(reach).toBeGreaterThan(0.1);
      expect(reach).toBeLessThan(0.57);
      // Opposite sides of the fixed coast: no dry interval between sea/wash.
      expect((ocean.x - p.x) * p.nx + (ocean.z - p.z) * p.nz).toBeLessThan(0);
      expect((front.x - p.x) * p.nx + (front.z - p.z) * p.nz).toBeGreaterThan(
        0,
      );
    }
  }
});

test("shore corners have no doubled-back segments or flipped water normals", () => {
  for (const coast of shoreRuns)
    for (let i = 1; i < coast.length; i++) {
      const p = coast[i],
        previous = coast[i - 1];
      expect(Math.hypot(p.x - previous.x, p.z - previous.z)).toBeGreaterThan(
        0.5,
      );
      expect(p.nx * previous.nx + p.nz * previous.nz).toBeGreaterThan(0.4);
    }
});

test("the real shore renderer produces finite paths through an entire tide cycle", () => {
  const points = [];
  const ctx = new Proxy(
    {
      rect: jest.fn(),
      clip: jest.fn(),
      moveTo: (x, z) => points.push([x, z]),
      lineTo: (x, z) => points.push([x, z]),
    },
    { get: (object, key) => (key in object ? object[key] : jest.fn()) },
  );
  for (const time of [0, 4000, 8000, 12000, 16000])
    drawShore(ctx, (x, z) => ({ x: 640 + x * 28, y: 400 + z * 28 }), 28, time);
  expect(points.length).toBeGreaterThan(1000);
  expect(points.every((point) => point.every(Number.isFinite))).toBe(true);
  expect(ctx.rect).toHaveBeenCalledWith(
    pierDeck.x,
    pierDeck.z,
    pierDeck.w,
    pierDeck.d,
  );
  expect(ctx.clip).toHaveBeenCalledWith("evenodd");
});
