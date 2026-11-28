import { habitatPlacement } from "./HabitatPlacement";

test("terrestrial residents attach to surfaces of the selected enclosure", () => {
  const spider = { name: "Velvet", category: "Spiders" };
  const a = habitatPlacement(spider, 1, "terrarium")[0];
  const b = habitatPlacement(spider, 1, "habitat-ladybugs")[0];
  expect(a.placement).toBe("surface");
  expect(a.top).toBe(38);
  expect(b.top).toBe(66);
  expect(habitatPlacement(spider, 100)).toHaveLength(8);
  expect(
    new Set(habitatPlacement(spider, 8).map((p) => `${p.left}:${p.top}`)).size,
  ).toBe(8);
});
test("bottom dwellers rest on the floor while fish swim in open water", () => {
  const crab = habitatPlacement(
    { name: "Blue crab", category: "Shellfish" },
    1,
    "",
    true,
  )[0];
  const fish = habitatPlacement(
    { name: "Clownfish", category: "Fish" },
    1,
    "",
    true,
  )[0];
  expect(crab).toMatchObject({
    placement: "surface",
    motion: "bottom",
    top: 86,
  });
  expect(fish).toMatchObject({ placement: "water", motion: "swim", top: 43 });
});
