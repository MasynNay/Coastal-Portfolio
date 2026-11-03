import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import WorldMode from "./WorldMode";
import { createWorld } from "./engine";
import { miniPoint } from "./MiniMap";
import { GAME_PORTALS } from "./RoomGames";

jest.mock("./engine", () => ({ createWorld: jest.fn() }));
jest.mock("./SpritePose", () => () => null);
jest.mock("./RoomContent", () => () => null);
let host, root, game, callbacks;
const status = {
  loading: false,
  character: "masyn",
  position: { x: 0, z: 9 },
  gems: 0,
};
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  game = {
    freeze: jest.fn(),
    travel: jest.fn(),
    walkToRide: jest.fn(() => true),
    dispose: jest.fn(),
  };
  createWorld.mockImplementation((_, events) => {
    callbacks = events;
    return game;
  });
  act(() =>
    root.render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <WorldMode />
      </MemoryRouter>,
    ),
  );
  act(() => callbacks.onStatus(status));
  act(() => host.querySelector(".world-welcome button").click());
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  jest.clearAllMocks();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
function openMap() {
  act(() => host.querySelector('[aria-label="Open island map"]').click());
  return host.querySelector(".world-map-panel");
}
test("Map opens the real island layout with the latest position, then closes when a home is selected", () => {
  expect(host.querySelector(".world-touch")).toBeNull();
  expect(host.querySelector('[aria-label="Move up"]')).toBeNull();
  act(() => callbacks.onMap({ x: 12, z: 10 }, true, null));
  const panel = openMap();
  expect(panel.getAttribute("role")).toBe("dialog");
  expect(panel.getAttribute("aria-label")).toBe("Island map");
  expect(panel.querySelector(".mini-terrain")).not.toBeNull();
  const player = panel.querySelector(".mini-player");
  expect(parseFloat(player.style.left)).toBeCloseTo(
    miniPoint({ x: 12, z: 10 }).left,
  );
  expect(parseFloat(player.style.top)).toBeCloseTo(
    miniPoint({ x: 12, z: 10 }).top,
  );
  expect(player.dataset.mode).toBe("surf");
  act(() => panel.querySelector('[aria-label="Fly to Skills"]').click());
  expect(game.travel).toHaveBeenLastCalledWith("skills");
  expect(host.querySelector(".world-map-panel")).toBeNull();
  expect(game.freeze).toHaveBeenLastCalledWith(false);
});
test("the map's pond shortcut starts surfing travel; indoor rentals stay disabled", () => {
  let panel = openMap();
  act(() => panel.querySelector('[aria-label="Fly to pond and surf"]').click());
  expect(game.travel).toHaveBeenLastCalledWith("pond");
  expect(host.querySelector(".world-map-panel")).toBeNull();
  act(() => callbacks.onStatus({ ...status, room: "skills" }));
  panel = openMap();
  expect(
    [...panel.querySelectorAll(".mini-ride")].every(
      (button) => button.disabled,
    ),
  ).toBe(true);
  act(() => panel.querySelector('[aria-label="Fly to Resume"]').click());
  expect(game.travel).toHaveBeenLastCalledWith("resume");
});
test("rental shortcuts start only after the popup has closed and the engine is unpaused", () => {
  const panel = openMap();
  expect(game.freeze).toHaveBeenLastCalledWith(true);
  act(() => panel.querySelector('[aria-label="Walk to Jet ski"]').click());
  expect(host.querySelector(".world-map-panel")).toBeNull();
  expect(game.walkToRide).toHaveBeenLastCalledWith("jetski");
  expect(game.freeze).toHaveBeenLastCalledWith(false);
  expect(game.freeze.mock.invocationCallOrder.at(-1)).toBeLessThan(
    game.walkToRide.mock.invocationCallOrder.at(-1),
  );
});
test("Help explains tap, double tap, pinch, map travel and touch actions without a direction pad", () => {
  act(() => host.querySelector('[aria-label="Open game controls"]').click());
  const panel = host.querySelector(".world-dialog");
  expect(panel.textContent).toContain("Mobile & tablet");
  expect(panel.textContent).toContain("Double-tap the same spot to run");
  expect(panel.textContent).toContain("Pinch with two fingers");
  expect(panel.textContent).toContain("Open Map");
  expect(panel.textContent).toContain("Shake tree · find bugs");
  expect(panel.textContent).toContain("Gently catch");
  expect(panel.textContent).toContain("Phone or tablet");
  expect(panel.textContent).toContain("How to catch aquatic life");
  expect(panel.textContent).not.toContain("direction pad");
  act(() => panel.querySelector('[aria-label="Close panel"]').click());
  expect(host.querySelector(".world-dialog")).toBeNull();
});

test("the progress badge opens a named journal with visited homes, discovered secrets and float progress", () => {
  act(() => callbacks.onVisit("skills"));
  act(() => callbacks.onEvent({ type: "secret", id: "game-home" }));
  act(() => host.querySelector('[aria-label="Close panel"]').click());
  act(() =>
    callbacks.onStatus({
      ...status,
      hunt: true,
      floatCount: 1,
      foundFloats: ["float-1"],
    }),
  );
  const badge = host.querySelector('[aria-label="Open island journal"]');
  expect(badge.textContent).toContain("1 / 6 places visited");
  expect(badge.textContent).toContain("1 secrets found");
  act(() => badge.click());
  const panel = host.querySelector('[aria-label="Island journal"]');
  expect(panel).not.toBeNull();
  expect(panel.textContent).toContain(GAME_PORTALS["game-home"].title);
  expect(panel.textContent).toContain("Glass floats · 1 / 20");
  expect(
    panel.querySelectorAll('.journal-places [data-found="true"]'),
  ).toHaveLength(1);
  expect(
    panel.querySelectorAll('.journal-floats [data-found="true"]'),
  ).toHaveLength(1);
  expect(game.freeze).toHaveBeenLastCalledWith(true);
  act(() => panel.querySelector('[aria-label="Close panel"]').click());
  expect(game.freeze).toHaveBeenLastCalledWith(false);
});

test("the goose couple has one menu and both partners remain selected after feeding", () => {
  game.playDuck = jest.fn(() => true);
  const pair = {
    type: "duck",
    id: "goose-pair",
    name: "Haymitch and Lenore Dove",
    members: [
      { id: "canada-goose", name: "Haymitch", art: "goose-canada" },
      { id: "white-goose", name: "Lenore Dove", art: "goose-white" },
    ],
  };
  act(() => callbacks.onEvent(pair));
  expect(host.textContent).toContain("Play with Haymitch and Lenore Dove");
  expect(host.textContent).toContain("Feed, pet or chase both geese together");
  const feed = [...host.querySelectorAll("button")].find(
    (b) => b.textContent === "Feed some peas",
  );
  act(() => feed.click());
  expect(game.playDuck).toHaveBeenCalledWith("goose-pair", "feed");
  act(() =>
    callbacks.onEvent({ ...pair, type: "duck-finished", kind: "feed" }),
  );
  expect(host.textContent).toContain("Play with Haymitch and Lenore Dove");
});

test("the Lodge library opens all cartridges and unloads a player when returning to the shelf", () => {
  act(() => callbacks.onEvent({ type: "room-arcade", id: "lodge-arcade" }));
  const panel = host.querySelector('[aria-label="Windfall Arcade"]');
  expect(panel.querySelectorAll(".game-cartridge")).toHaveLength(18);
  expect(game.freeze).toHaveBeenLastCalledWith(true);
  act(() => panel.querySelector(".game-cartridge").click());
  expect(panel.querySelector("iframe").getAttribute("src")).toContain(
    "/emulator/player.html?game=",
  );
  act(() => panel.querySelector(".room-arcade-return button").click());
  expect(panel.querySelector("iframe")).toBeNull();
  expect(panel.querySelectorAll(".game-cartridge")).toHaveLength(18);
  act(() => panel.querySelector('[aria-label="Close panel"]').click());
  expect(game.freeze).toHaveBeenLastCalledWith(false);
});

test("the offering announces the saved discovery, and the letter opens only on interaction", () => {
  act(() => callbacks.onEvent({ type: "room-unlocked", id: "love-letter" }));
  expect(host.querySelector(".world-dialog")).toBeNull();
  expect(JSON.parse(localStorage.getItem("masyn-world-v1")).secrets).toContain(
    "love-letter",
  );
  act(() => callbacks.onEvent({ type: "love-letter", id: "love-letter" }));
  const panel = host.querySelector('[aria-label="A Message For My Love"]');
  expect(panel.textContent).toContain(
    "You are everything to me. I love you, always.",
  );
  expect(panel.textContent).toContain("— Masyn ♥");
  act(() => panel.querySelector('[aria-label="Close panel"]').click());
  expect(game.freeze).toHaveBeenLastCalledWith(false);
});
