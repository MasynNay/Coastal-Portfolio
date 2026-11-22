import { act } from "react";
import { createRoot } from "react-dom/client";
import HabitatView from "./HabitatView";
import HabitatCare from "./HabitatCare";
import { Terrariums } from "./Activities";
import Aquariums from "./Aquariums";
import { bugSpecies } from "./Bugs";
import { fishSpecies } from "./Fish";
let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  jest.useFakeTimers();
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  jest.useRealTimers();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
test("feeding and misting animate every resident without opening inspection or release", () => {
  const inspect = jest.fn(),
    release = jest.fn();
  act(() =>
    root.render(
      <HabitatView
        name="Pebble"
        onInspect={inspect}
        onRelease={release}
        care={
          <HabitatCare
            species={{ name: "Pebble", category: "Spiders" }}
            quantity={3}
          />
        }
      />,
    ),
  );
  expect(host.querySelector("button button")).toBeNull();
  const feed = [...host.querySelectorAll("button")].find((b) =>
    b.textContent.startsWith("Feed All"),
  );
  act(() => feed.click());
  expect(host.querySelector(".is-flies").children).toHaveLength(16);
  expect(host.textContent).toContain("all 3 Pebble");
  expect(inspect).not.toHaveBeenCalled();
  expect(release).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(3300));
  const mist = [...host.querySelectorAll("button")].find((b) =>
    b.textContent.startsWith("Mist Habitat"),
  );
  act(() => mist.click());
  expect(host.querySelector(".is-water")).not.toBeNull();
});
test("every collected species uses the same contained icon component", () => {
  const bugs = Object.fromEntries(
    bugSpecies.filter((_, i) => i % 100 === 0).map((b) => [b.id, 1]),
  );
  act(() => root.render(<Terrariums caught={bugs} />));
  expect(
    host.querySelectorAll(".collection-picker .collection-icon"),
  ).toHaveLength(Object.keys(bugs).length);
  expect(host.querySelectorAll(".collection-picker .sprite-pose")).toHaveLength(
    0,
  );
  const fish = Object.fromEntries(
    fishSpecies.slice(0, 4).map((f) => [f.id, 1]),
  );
  act(() => root.render(<Aquariums caught={fish} />));
  expect(
    host.querySelectorAll(".collection-picker .collection-icon"),
  ).toHaveLength(4);
  expect(host.querySelector(".habitat-care-buttons").textContent).toContain(
    "Refresh Water",
  );
});
