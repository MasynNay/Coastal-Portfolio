import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import Game from "./Game";
import { games } from "../data/games";
let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.spyOn(window, "scrollTo").mockImplementation(() => {});
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root.render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Game />
      </MemoryRouter>,
    ),
  );
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  jest.restoreAllMocks();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
test("all cartridges select the intended game and changing cartridges replaces the only player", () => {
  const cartridges = host.querySelectorAll(".game-cartridge");
  expect(cartridges).toHaveLength(games.length);
  expect(host.querySelector("iframe")).toBeNull();
  act(() => host.querySelector(".secret-start-screen button").click());
  for (const [index, game] of games.entries()) {
    act(() => cartridges[index].click());
    expect(cartridges[index].getAttribute("aria-pressed")).toBe("true");
    expect(host.querySelectorAll("iframe")).toHaveLength(1);
    expect(host.querySelector("iframe").src).toBe(
      new URL(game.url, window.location.href).href,
    );
    expect(cartridges[index].classList.contains("custom-cartridge")).toBe(
      game.kind === "island",
    );
    expect(cartridges[index].querySelector(".cartridge-top").textContent).toBe(
      game.kind === "island" ? "ISLAND ARCADE" : "GAME BOY ADVANCE",
    );
    expect(host.querySelector(".secret-control-card").textContent).toContain(
      game.controls,
    );
  }
});
