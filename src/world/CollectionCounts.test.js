import { cleanCounts, changeCount, residentLayout } from "./CollectionCounts";
import { addBug, removeBug, readTerrariums, saveTerrariums } from "./Bugs";
test("old bug discoveries migrate without losing IDs; duplicates accumulate and release one at a time", () => {
  localStorage.setItem(
    "world-spiders",
    JSON.stringify(["spider", "spider-gold", "spider"]),
  );
  let c = readTerrariums();
  expect(c).toEqual({ spider: 1, "spider-gold": 1 });
  c = addBug(c, "spider");
  c = addBug(c, "spider");
  saveTerrariums(c);
  expect(readTerrariums().spider).toBe(3);
  c = removeBug(c, "spider");
  expect(c.spider).toBe(2);
  c = removeBug(removeBug(c, "spider"), "spider");
  expect(c.spider).toBeUndefined();
  expect(c["spider-gold"]).toBe(1);
});
test("invalid counts are discarded, valid totals are bounded, unknown catches do not alter a collection", () => {
  const ids = new Set(["a", "b"]);
  expect(cleanCounts({ a: NaN, b: 10000000, fake: 1 }, ids)).toEqual({
    b: 999999,
  });
  expect(changeCount({ a: 2 }, "fake", 1, ids)).toEqual({ a: 2 });
  expect(changeCount({ a: 1 }, "a", -1, ids)).toEqual({});
});
test("growing groups shrink, stay inside separated lanes and never render unbounded populations", () => {
  for (const n of [1, 2, 3, 4, 6, 8, 100000]) {
    const layout = residentLayout(n);
    expect(layout).toHaveLength(Math.min(8, n));
    expect(new Set(layout.map((p) => p.left + ":" + p.top)).size).toBe(
      layout.length,
    );
    expect(
      layout.every(
        (p) => p.left >= 15 && p.left <= 85 && p.top >= 20 && p.top <= 80,
      ),
    ).toBe(true);
  }
  expect(residentLayout(8)[0].scale).toBeLessThan(residentLayout(2)[0].scale);
});

test("discovery totals count each species once while keeping duplicate resident totals", () => {
  const { collectionProgress } = require("./CollectionCounts");
  const species = [
    { id: "a", category: "Spiders" },
    { id: "b", category: "Spiders" },
    { id: "c", category: "Mantises" },
  ];
  const p = collectionProgress(species, (id) => ({ a: 5, c: 2 })[id] || 0);
  expect(p).toMatchObject({
    found: 2,
    possible: 3,
    remaining: 1,
    residents: 7,
  });
  expect(p.groups).toEqual([
    { name: "Spiders", found: 1, possible: 2 },
    { name: "Mantises", found: 1, possible: 1 },
  ]);
});
