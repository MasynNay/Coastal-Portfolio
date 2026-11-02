import { fenceRuns, fenceBlocksTravel } from "./Fence";
import { obstacles } from "./config";
import { canStand, move } from "./navigation";
import { surfEntry } from "./Surf";
test("the island perimeter is fenced while the entire wooden pier entrance stays open", () => {
  expect(
    fenceRuns.some(
      ([x1, z1, x2, z2]) => z1 === -29 && z2 === -29 && x1 < 0 && x2 > 0,
    ),
  ).toBe(true);
  const south = fenceRuns.filter(([, z1, , z2]) => z1 === 19.6 && z2 === 19.6);
  expect(south).toHaveLength(2);
  for (const [x1, , x2] of south) expect(x1 >= 3.5 || x2 <= -3.5).toBe(true);
});
test("every perimeter rail stops walking and mounted movement, including long diagonal steps", () => {
  const approaches = [
    [{ x: 26, z: 0 }, 4, 0],
    [{ x: -26, z: 5 }, -4, 0],
    [{ x: 0, z: -27 }, 0, -4],
    [{ x: -18, z: 17.5 }, 0, 5],
    [{ x: 18, z: 17.5 }, 0, 5],
  ];
  for (const [from, dx, dz] of approaches) {
    const next = move(from, dx, dz, obstacles, false, true);
    expect(fenceBlocksTravel(from, next)).toBe(false);
    expect(Math.hypot(next.x - from.x, next.z - from.z)).toBeLessThan(
      Math.hypot(dx, dz),
    );
    expect(canStand(next.x, next.z, obstacles, false, true)).toBe(true);
  }
  const diagonal = move({ x: 26, z: 17 }, 5, 6, obstacles, false, true);
  expect(diagonal.x).toBeLessThan(28 - 0.55);
  expect(diagonal.z).toBeLessThan(19.6 - 0.55);
});
test("mounting cannot hop over a railing; the pier sides and pond still offer surf entry", () => {
  const canEnter = (p) => canStand(p.x, p.z, obstacles, false, true);
  for (const [from, dir] of [
    [{ x: 27.36, z: 0 }, 2],
    [{ x: -27.36, z: 5 }, 6],
    [{ x: 0, z: -28.36 }, 4],
    [{ x: 18, z: 18.95 }, 0],
  ]) {
    expect(surfEntry(from, dir, canEnter)).toBe(null);
  }
  expect(surfEntry({ x: 2, z: 29 }, 2, canEnter)).not.toBe(null);
  expect(fenceBlocksTravel({ x: 0, z: 18 }, { x: 0, z: 25 })).toBe(false);
  expect(move({ x: 0, z: 18 }, 0, 7, obstacles, false).z).toBeCloseTo(25);
});
