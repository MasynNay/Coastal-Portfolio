import { act } from "react";
import { createRoot } from "react-dom/client";
import AsciiApp from "./AsciiApp";
jest.mock("../bloom/Bloom", () => ({ active }) => (
  <div data-bouquet={String(active)}>Mi Shell’s bouquets</div>
));
jest.mock("./Aquarium", () => ({ active, scenes, title }) => (
  <div
    data-aquarium={String(active)}
    data-category={title}
    data-count={scenes.length}
  >
    {title}
  </div>
));

test("the terminal chooser preserves modes and only animates the foreground scene", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const button = (name) =>
    [...host.querySelectorAll("button")].find((node) =>
      node.textContent.includes(name),
    );
  try {
    act(() => root.render(<AsciiApp active />));
    expect(host.textContent).toContain("Small worlds.");
    act(() => button("Bouquets").click());
    const bouquet = host.querySelector("[data-bouquet]");
    expect(bouquet.dataset.bouquet).toBe("true");
    act(() => button("Modes").click());
    expect(bouquet.dataset.bouquet).toBe("false");
    act(() => button("Aquariums").click());
    expect(host.querySelector("[data-aquarium]").dataset.aquarium).toBe("true");
    expect(bouquet.dataset.bouquet).toBe("false");
    act(() => button("Modes").click());
    act(() => button("Game Worlds").click());
    expect(
      host.querySelector('[data-category="Game Worlds"]').dataset.aquarium,
    ).toBe("true");
    expect(
      host.querySelector('[data-category="Aquariums"]').dataset.aquarium,
    ).toBe("false");
    act(() => button("Modes").click());
    act(() => button("Galaxies").click());
    expect(host.querySelector('[data-category="Galaxies"]').dataset.count).toBe(
      "18",
    );
    expect(
      host.querySelector('[data-category="Game Worlds"]').dataset.aquarium,
    ).toBe("false");
    act(() => button("Modes").click());
    act(() => button("Storybook Worlds").click());
    expect(
      host.querySelector('[data-category="Storybook Worlds"]').dataset.count,
    ).toBe("18");
    act(() => root.render(<AsciiApp active={false} />));
    expect(host.querySelector("[data-aquarium]").dataset.aquarium).toBe(
      "false",
    );
    expect(host.querySelector("[data-bouquet]")).toBe(bouquet);
  } finally {
    act(() => root.unmount());
    host.remove();
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
