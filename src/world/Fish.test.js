import {
  fishSpecies,
  chooseFish,
  addFish,
  readAquariums,
  saveAquariums,
} from "./Fish";
import sheets from "./SpriteSheets.json";
test("251 distinct aquatic sprites include two saltwater super-rare catches", () => {
  expect(fishSpecies).toHaveLength(251);
  expect(new Set(fishSpecies.map((f) => f.art)).size).toBe(251);
  expect(fishSpecies.filter((f) => f.rarity === "Super rare")).toHaveLength(2);
  for (const f of fishSpecies) expect(sheets[f.art].columns).toBe(4);
  expect(chooseFish(() => 0.0005).rarity).toBe("Super rare");
  expect(chooseFish(() => 0.001).rarity).not.toBe("Super rare");
  const seen = new Set();
  for (let i = 0; i < 10000; i++) seen.add(chooseFish(() => i / 10000).id);
  expect(seen.size).toBe(251);
});

test("freshwater creatures are pond-only and cannot leak into ocean rarity rolls", () => {
  for (const habitat of ["freshwater", "saltwater"]) {
    const eligible = fishSpecies.filter((f) => f.habitat === habitat);
    expect(eligible.length).toBeGreaterThan(0);
    const seen = new Set();
    for (let i = 0; i < 10000; i++) {
      const caught = chooseFish(() => i / 10000, habitat);
      expect(caught.habitat).toBe(habitat);
      seen.add(caught.id);
    }
    expect(seen.size).toBe(eligible.length);
  }
  expect(
    fishSpecies
      .filter((f) => f.category === "Amphibians")
      .every((f) => f.habitat === "freshwater"),
  ).toBe(true);
  expect(
    fishSpecies
      .filter((f) => f.category === "Sharks")
      .every((f) => f.habitat === "saltwater"),
  ).toBe(true);
  expect(chooseFish(() => 0.00025, "saltwater").id).toBe("aurora");
  expect(chooseFish(() => 0.00075, "saltwater").id).toBe("ponyo");
  expect(chooseFish(() => 0.0005, "freshwater").id).not.toBe("aurora");
  expect(chooseFish(() => 0.5, "unknown")).toBeNull();
});
test("catches accumulate, survive reload, and invalid saved values cannot create fake species", () => {
  localStorage.removeItem("world-aquariums");
  let caught = addFish({}, "harbor");
  caught = addFish(caught, "harbor");
  caught = addFish(caught, "aurora");
  saveAquariums(caught);
  expect(readAquariums()).toEqual({
    harbor: 2,
    aurora: 1,
  });
  expect(addFish(caught, "fake")).toEqual(caught);
  localStorage.setItem(
    "world-aquariums",
    JSON.stringify({
      harbor: -1,
      aurora: 1.2,
      fake: 200,
      bluegill: 3,
    }),
  );
  expect(readAquariums()).toEqual({
    bluegill: 3,
  });
});

test("releasing removes one fish, preserves other residents and persists through reload", () => {
  const { removeFish } = require("./Fish");
  let caught = { harbor: 2, aurora: 1 };
  caught = removeFish(caught, "harbor");
  expect(caught).toEqual({ harbor: 1, aurora: 1 });
  caught = removeFish(caught, "harbor");
  saveAquariums(caught);
  expect(readAquariums()).toEqual({ aurora: 1 });
  expect(removeFish(caught, "harbor")).toEqual(caught);
  expect(removeFish(caught, "fake")).toEqual(caught);
});
