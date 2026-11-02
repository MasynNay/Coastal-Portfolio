import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { DesktopPortfolio } from "./DesktopPortfolio";
import { games } from "../data/games";
jest.mock("../pages/ResumePage", () => () => null);
jest.mock("../components/Projects", () => ({ Projects: () => null }));
jest.mock("../components/Contact", () => ({ Contact: () => null }));
jest.mock("../typing/TypingTest", () => () => null);
let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root.render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DesktopPortfolio />
      </MemoryRouter>,
    ),
  );
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
test("cartridges open separate game windows; reopening restores one window and closing unloads the player", () => {
  const dock = host.querySelector('[aria-label="Open Games"]');
  act(() => dock.click());
  const library = host.querySelector('[role="dialog"][aria-label="Games"]');
  expect(library.querySelector("iframe")).toBeNull();
  const cartridges = library.querySelectorAll(".game-cartridge");
  act(() => cartridges[0].click());
  const player = host.querySelector(
    '[role="dialog"][aria-label="Pokémon Ruby"]',
  );
  expect(player.querySelector("iframe").src).toBe(games[0].url);
  expect(player.textContent).toContain("Take the controls");
  act(() => cartridges[0].click());
  expect(
    host.querySelectorAll('[role="dialog"][aria-label="Pokémon Ruby"]'),
  ).toHaveLength(1);
  act(() => cartridges[1].click());
  expect(host.querySelectorAll("iframe")).toHaveLength(2);
  act(() => player.querySelector('[aria-label="Close Pokémon Ruby"]').click());
  expect(host.querySelectorAll("iframe")).toHaveLength(1);
  expect(document.activeElement).toBe(dock);
});
