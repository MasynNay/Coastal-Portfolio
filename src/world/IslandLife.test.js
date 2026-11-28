import { act } from "react";
import { createRoot } from "react-dom/client";
import { Inventory, Terrariums } from "./Activities";
import DisplayRoom from "./DisplayRoom";
import Passport, { passportMilestones } from "./Passport";
import { cleanPreferences, preferenceKey } from "./CollectionPreferences";
import { readDisplayRoom } from "./DisplayRoomData";
import { bugSpecies } from "./Bugs";
import { fishSpecies } from "./Fish";
import { buildings } from "./config";
let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
const click = (name) =>
  act(() =>
    [...host.querySelectorAll("button")]
      .find((b) => b.textContent === name)
      .click(),
  );
test("passport stamps and room themes reflect real visits and lifetime discoveries", () => {
  localStorage.setItem(
    "world-bug-discoveries",
    JSON.stringify(
      Object.fromEntries(bugSpecies.slice(0, 10).map((s) => [s.id, 1])),
    ),
  );
  const progress = { visited: buildings.map((b) => b.id), secrets: [] };
  const milestones = passportMilestones({
    progress,
    bugs: {},
    fish: {},
    shells: {},
    cards: {},
    floats: [],
  });
  expect(milestones.find((m) => m.id === "visitor").complete).toBe(true);
  expect(milestones.find((m) => m.id === "naturalist").complete).toBe(true);
  act(() =>
    root.render(
      <Passport progress={progress} bugs={{}} fish={{}} shells={{}} />,
    ),
  );
  expect(
    host.querySelectorAll('.passport-stamps [data-earned="true"]'),
  ).toHaveLength(6);
  expect(host.textContent).toContain("Unlocked: Fern display room");
});
test("favorite toggles persist and favorites-only does not duplicate or award residents", () => {
  act(() => root.render(<Terrariums caught={{ [bugSpecies[0].id]: 2 }} />));
  click("☆ Add Favorite");
  click("Favorites Only");
  expect(JSON.parse(localStorage.getItem(preferenceKey)).bugs).toEqual([
    bugSpecies[0].id,
  ]);
  expect(host.querySelectorAll(".collection-picker>button")).toHaveLength(1);
  click("★ Favorite");
  expect(host.querySelectorAll(".collection-picker>button")).toHaveLength(0);
  expect(
    cleanPreferences({ bugs: ["bad", bugSpecies[0].id, bugSpecies[0].id] })
      .bugs,
  ).toEqual([bugSpecies[0].id]);
});
test("display shelves save owned items, reorder them and hide a released last resident", () => {
  const fish = fishSpecies[0],
    props = {
      bugs: {},
      fish: { [fish.id]: 1 },
      shells: {},
      progress: { visited: [], secrets: [] },
      onBack: () => {},
    };
  act(() => root.render(<DisplayRoom {...props} />));
  act(() =>
    host.querySelector('[aria-label="Choose display 1 · empty"]').click(),
  );
  click("Aquatic Life");
  act(() => host.querySelector(".display-options button").click());
  expect(readDisplayRoom().slots[0]).toEqual({ kind: "fish", id: fish.id });
  act(() => host.querySelector('[aria-label="Move display 1 right"]').click());
  expect(readDisplayRoom().slots[1]).toEqual({ kind: "fish", id: fish.id });
  act(() => root.render(<DisplayRoom {...props} fish={{}} />));
  expect(host.querySelectorAll(".display-habitat")).toHaveLength(0);
});
test("inventory exposes passport, display room and backup alongside the existing collections", () => {
  const open = jest.fn();
  act(() => root.render(<Inventory caught={{}} onPassport={open} />));
  click("Island Passport");
  expect(open).toHaveBeenCalledTimes(1);
  expect(host.textContent).toContain("Save Backup");
  expect(host.textContent).toContain("My Display Room");
});
