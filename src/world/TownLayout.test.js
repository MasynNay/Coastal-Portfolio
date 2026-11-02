import { townDecor, isOcean, streets, townPlots } from "./TownLayout";
test("whole land props stay on land, boats stay offshore, and the lighthouse is gone", () => {
  expect(townDecor.some((p) => p[0].includes("lighthouse"))).toBe(false);
  for (const [art, x, z] of townDecor) {
    expect(isOcean(x, z)).toBe(art.includes("boat"));
  }
  for (const [, x, z] of townDecor.filter(
    ([art, , z]) => /tree|pine|palm/.test(art) && z < 19.1,
  )) {
    expect(
      streets.some(
        (r) => x >= r.x && x <= r.x + r.w && z >= r.z && z <= r.z + r.d,
      ),
    ).toBe(false);
  }
});
test("the open grass lawn above the pier has no trees or blocking props", () => {
  const p = townPlots.meadow;
  expect(
    townDecor.filter(
      ([id, x, z]) =>
        /tree|pine|palm/.test(id) &&
        x >= p.left &&
        x <= p.right &&
        z >= p.top &&
        z <= p.bottom,
    ),
  ).toHaveLength(0);
  const { obstacles } = require("./config");
  const { canStand } = require("./navigation");
  for (let z = p.top + 0.5; z < p.bottom; z += 0.5)
    for (let x = p.left + 0.5; x < p.right; x += 0.5)
      expect(canStand(x, z, obstacles)).toBe(true);
});
test("the pond is centered in its grass plot and lower homes share their plot centers", () => {
  const { pond, townPlots, plotCenter } = require("./TownLayout");
  const { buildings } = require("./config");
  expect(pond.x - townPlots.center.left).toBeCloseTo(
    townPlots.center.right - pond.x,
  );
  expect(pond.z - townPlots.center.top).toBeCloseTo(
    townPlots.center.bottom - pond.z,
  );
  expect(buildings.find((b) => b.id === "contact").x).toBe(
    plotCenter("southwest").x,
  );
  expect(buildings.find((b) => b.id === "lodge").x).toBe(
    plotCenter("southeast").x,
  );
  expect(
    buildings
      .filter((b) => ["home", "skills", "portfolio"].includes(b.id))
      .map((b) => [b.x, b.z]),
  ).toEqual([
    [-17, -18],
    [0, -22],
    [17, -18],
  ]);
});
test("waterfront furniture has space in front of the raised white railing", () => {
  for (const [, , z] of townDecor.filter(
    ([id, , z]) => /bench|lamp/.test(id) && z > 17,
  ))
    expect(z).toBeLessThan(19.6 - 1.08 - 0.25);
});
test("themed mailboxes stand clear of the facade with a reachable reading point", () => {
  const { mailboxes } = require("./TownLayout");
  const { buildings } = require("./config");
  const { doorPosition } = require("./WorldLayout");
  const { canStand } = require("./navigation");
  const { obstacles } = require("./config");
  for (const box of mailboxes) {
    const b = buildings.find((b) => b.id === box.home),
      door = doorPosition(b);
    expect(box.x - door.x).toBeGreaterThanOrEqual(2.5);
    expect(box.x - door.x).toBeLessThanOrEqual(4);
    expect(box.z - door.z).toBeGreaterThan(1);
    expect(canStand(box.x, box.z + 0.8, obstacles)).toBe(true);
    expect(box.art).toBe("mailbox-" + b.id);
  }
});

test("mailboxes leave visual breathing room around nearby garden objects", () => {
  const { artwork } = require("./art");
  const { mailboxes, townProps, townDecor } = require("./TownLayout");
  const { restSpots } = require("./RestSpots");
  function bounds(p, id) {
    const sheet = artwork[id],
      height =
        p.h * (sheet.ch && sheet.bodyHeight ? sheet.ch / sheet.bodyHeight : 1),
      width = (height * (sheet.cw || sheet.width)) / (sheet.ch || sheet.height),
      bottom = p.z + height * (sheet.footY ? 1 - sheet.footY / sheet.ch : 0);
    return {
      left: p.x - width / 2,
      right: p.x + width / 2,
      top: bottom - height,
      bottom,
    };
  }
  for (const box of mailboxes) {
    const a = bounds(box, box.art);
    for (const p of [
      ...townProps.map((p) => ({ ...p, art: "town-" + p.id })),
      ...restSpots,
      ...townDecor.map(([art, x, z, h]) => ({ id: art, art, x, z, h })),
    ]) {
      const b = bounds(p, p.art),
        overlap =
          a.left < b.right + 0.35 &&
          a.right > b.left - 0.35 &&
          a.top < b.bottom + 0.35 &&
          a.bottom > b.top - 0.35;
      expect({ box: box.id, prop: p.id, overlap }).toEqual({
        box: box.id,
        prop: p.id,
        overlap: false,
      });
    }
  }
});
