import {
  createBugSpawns,
  bugSpecies,
  terrariumSpecies,
  bugCategories,
  chooseBug,
  readTerrariums,
  saveTerrariums,
  bugTrees,
} from "./Bugs";
import { canStand } from "./navigation";
import { obstacles } from "./config";
import sheets from "./SpriteSheets.json";
const clear = (p) => canStand(p.x, p.z, obstacles);
test("bugs appear only after a shake, three per encounter, on clear ground", () => {
  const spawns = createBugSpawns(781);
  expect(spawns.active(0).size).toBe(0);
  for (let i = 0; i < bugTrees.length; i++) {
    const result = spawns.shake(bugTrees[i], i * 13000, clear);
    if (result.count === 0) continue;
    expect(result.count).toBe(3);
    expect(spawns.active(i * 13000).size).toBeLessThanOrEqual(9);
    for (const id of spawns.active(i * 13000)) {
      const p = spawns.position(id, i * 13000);
      expect(clear(p)).toBe(true);
    }
  }
});
test("catching removes a bug without auto-respawn; release is not a free reroll", () => {
  const s = createBugSpawns(22),
    tree = bugTrees.find((t) => s.shake(t, 0, clear).count === 3);
  expect(tree).toBeDefined();
  const ids = [...s.active(0)];
  expect(ids).toHaveLength(3);
  expect(s.position(ids[0], 0).lift).toBeGreaterThan(0);
  expect(s.catch(ids[0], 200)).toBe(false);
  expect(s.catch(ids[0], 700)).toBe(true);
  expect(s.active(700).size).toBe(2);
  expect(s.active(800).size).toBe(2);
  expect(s.shake(tree, 800, clear).count).toBe(0);
  expect(s.active(121000).size).toBe(0);
});
test("species, rarity rolls and old saved collections remain valid", () => {
  for (const category of bugCategories)
    expect(bugSpecies.filter((s) => s.category === category)).toHaveLength(100);
  expect(bugSpecies).toHaveLength(500);
  expect(terrariumSpecies.filter((s) => s.legacy)).toHaveLength(0);
  expect(new Set(bugSpecies.map((s) => s.art)).size).toBe(bugSpecies.length);
  for (const s of bugSpecies) expect(sheets[s.art]?.columns).toBe(4);
  expect(chooseBug(() => 0).rarity).toBe("Super rare");
  // Independent category/rarity rolls: the same within-group roll must yield
  // the same rarity, and each fifth of the category roll selects a different group.
  for (const rarityRoll of [0, 0.1, 0.5, 0.95, 0.999]) {
    const choices = bugCategories.map((category, index) => {
      const values = [(index + 0.5) / 5, rarityRoll];
      const chosen = chooseBug(() => values.shift());
      expect(chosen.category).toBe(category);
      return chosen.rarity;
    });
    expect(new Set(choices).size).toBe(1);
  }
  saveTerrariums(["spider", "spider-gold", "spider-blue", "fake", "spider"]);
  expect(readTerrariums()).toEqual({
    spider: 1,
    "spider-gold": 1,
    "spider-blue": 1,
  });
});
test("complete collections can still discover bugs without losing saved residents", () => {
  const s = createBugSpawns(
    5,
    bugSpecies.map((b) => b.id),
  );
  const tree = bugTrees.find((t) => s.shake(t, 0, clear).count === 3);
  expect(tree).toBeDefined();
  expect(s.active(0).size).toBe(3);
  const id = [...s.active(0)][0];
  expect(s.catch(id, 700)).toBe(true);
});

test("older spider discoveries keep quantities and rejoin the balanced hundred-species roster", () => {
  const old = terrariumSpecies.find((s) => s.id === "spider-maple");
  saveTerrariums({ [old.id]: 4, spider: 2 });
  expect(readTerrariums()).toEqual({ [old.id]: 4, spider: 2 });
  expect(bugSpecies.some((s) => s.id === old.id)).toBe(true);
  expect(
    chooseBug(Math.random, new Set(bugSpecies.map((s) => s.id))),
  ).toBeNull();
});
