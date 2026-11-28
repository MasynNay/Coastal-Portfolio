import {
  createIslandBackup,
  parseIslandBackup,
  restoreIslandBackup,
} from "./IslandSave";
import {
  collectPack,
  ripOwnedPack,
  revealCard,
  readCardCollection,
  normalizeCardCollection,
} from "./CardCollection";
import { bugSpecies } from "./Bugs";
import { fishSpecies } from "./Fish";
import { preferenceKey } from "./CollectionPreferences";
beforeEach(() => localStorage.clear());
test("backup restores collections, favorites and the exact pending reveal without duplicate awards", () => {
  localStorage.setItem(
    "masyn-world-v1",
    JSON.stringify({ visited: ["skills"], secrets: [] }),
  );
  localStorage.setItem(
    "world-spiders",
    JSON.stringify({ [bugSpecies[0].id]: 3 }),
  );
  localStorage.setItem(
    "world-aquariums",
    JSON.stringify({ [fishSpecies[0].id]: 2 }),
  );
  localStorage.setItem(
    preferenceKey,
    JSON.stringify({ bugs: [bugSpecies[0].id] }),
  );
  localStorage.setItem("unrelated-secret", "keep-me-out");
  collectPack("kanto");
  ripOwnedPack("kanto", () => 0.3);
  revealCard();
  const expected = readCardCollection(),
    backup = createIslandBackup();
  expect(JSON.stringify(backup)).not.toContain("keep-me-out");
  localStorage.clear();
  restoreIslandBackup(parseIslandBackup(JSON.stringify(backup)));
  expect(readCardCollection()).toEqual(expected);
  expect(readCardCollection().pending.flipped).toBe(true);
  expect(
    Object.values(readCardCollection().cards).reduce(
      (sum, c) => sum + c.quantity,
      0,
    ),
  ).toBe(5);
  expect(
    JSON.parse(localStorage.getItem("world-spiders"))[bugSpecies[0].id],
  ).toBe(3);
  expect(JSON.parse(localStorage.getItem(preferenceKey)).bugs).toContain(
    bugSpecies[0].id,
  );
});
test("import rejects unknown keys, oversized files and invalid formats before writing", () => {
  const backup = createIslandBackup();
  backup.entries.access_token = "bad";
  expect(() => parseIslandBackup(JSON.stringify(backup))).toThrow(
    "unrecognized",
  );
  expect(() => parseIslandBackup("x".repeat(2 * 1024 * 1024 + 1))).toThrow(
    "2 MB",
  );
  expect(() => parseIslandBackup('{"version":1}')).toThrow("not a supported");
  expect(localStorage.length).toBe(0);
});
test("failed import rolls all touched keys back to their previous values", () => {
  localStorage.setItem(
    "masyn-world-v1",
    JSON.stringify({ visited: ["home"], secrets: [] }),
  );
  const snapshot = createIslandBackup();
  snapshot.entries["masyn-world-v1"] = { visited: ["skills"], secrets: [] };
  snapshot.entries["world-spiders"] = { [bugSpecies[0].id]: 2 };
  const map = new Map(
    Object.entries({
      "masyn-world-v1": localStorage.getItem("masyn-world-v1"),
      "world-spiders": "{}",
    }),
  );
  const initial = [...map];
  let fail = true;
  const storage = {
    getItem: (k) => map.get(k) ?? null,
    removeItem: (k) => map.delete(k),
    setItem: (k, v) => {
      if (k === "world-spiders" && fail) {
        fail = false;
        throw Error("quota");
      }
      map.set(k, v);
    },
  };
  expect(() => restoreIslandBackup(snapshot, storage)).toThrow(
    "could not be restored",
  );
  expect([...map]).toEqual(initial);
});
test("card normalization drops malformed old reveals and trusts catalog metadata", () => {
  expect(
    normalizeCardCollection({
      version: 2,
      cards: {},
      pending: { setId: "kanto", index: 0, cards: Array(5).fill({ id: 1 }) },
    }).pending,
  ).toBeNull();
});
