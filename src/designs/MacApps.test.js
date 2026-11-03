import { act } from "react";
import { createRoot } from "react-dom/client";
import { GamesApp, GamePlayer, PhotosApp } from "./MacApps";
import { games } from "../data/games";

let host, root, originalFetch;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  originalFetch = global.fetch;
  global.fetch = jest.fn(async () => ({
    json: async () => ["/slideshow/one.jpg", "/slideshow/two.jpg"],
  }));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  global.fetch = originalFetch;
  jest.useRealTimers();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
test("the cartridge shelf opens a game window without embedding a player in the library", () => {
  const open = jest.fn();
  act(() => root.render(<GamesApp onOpen={open} />));
  const picks = host.querySelectorAll(".mac-game-picker .game-cartridge");
  expect(picks).toHaveLength(games.length);
  for (const [index, game] of games.entries()) {
    act(() => picks[index].click());
    expect(open).toHaveBeenLastCalledWith(game);
    expect(picks[index].getAttribute("aria-pressed")).toBe("true");
    expect(host.querySelector("iframe")).toBeNull();
  }
});

test("a game window includes its player, external link and dismissible keyboard/touch controls", () => {
  act(() => root.render(<GamePlayer game={games[3]} />));
  expect(host.querySelectorAll("iframe")).toHaveLength(1);
  expect(host.querySelector("iframe").src).toBe(games[3].url);
  expect(host.querySelector("iframe").title).toBe(games[3].name);
  const toggle = host.querySelector("[aria-controls]");
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(
    document.getElementById(toggle.getAttribute("aria-controls")),
  ).not.toBeNull();
  const gotIt = host.querySelector(".mac-controls button");
  act(() => {
    gotIt.focus();
    gotIt.click();
  });
  expect(document.activeElement).toBe(toggle);
  expect(host.querySelector(".mac-controls").hidden).toBe(true);
  act(() => toggle.click());
  expect(host.querySelector(".mac-controls").hidden).toBe(false);
  const external = host.querySelector('a[target="_blank"]');
  expect(external.href).toBe(games[3].url);
  expect(external.rel).toContain("noreferrer");
});
test("a slideshow preserves its position while inactive and resumes when reactivated", async () => {
  jest.useFakeTimers();
  await act(async () => root.render(<PhotosApp album={null} />));
  act(() => host.querySelectorAll("button")[1].click());
  act(() => jest.advanceTimersByTime(4000));
  expect(host.querySelector("img").getAttribute("src")).toBe(
    "/slideshow/two.jpg",
  );
  act(() => root.render(<PhotosApp album={null} active={false} />));
  act(() => jest.advanceTimersByTime(12000));
  expect(host.querySelector("img").getAttribute("src")).toBe(
    "/slideshow/two.jpg",
  );
  act(() => root.render(<PhotosApp album={null} active />));
  act(() => jest.advanceTimersByTime(4000));
  expect(host.querySelector("img").getAttribute("src")).toBe(
    "/slideshow/one.jpg",
  );
});

test("Photos opens the shared album and refreshes it without fetching a local photo list", () => {
  act(() => root.render(<PhotosApp />));
  const frame = host.querySelector("iframe");
  expect(frame.title).toBe("Frames shared photo album");
  expect(frame.src).toBe(host.querySelector('a[target="_blank"]').href);
  expect(frame.src).toMatch(/^https:\/\/photos\.trgcloud\.org\/share\//);
  expect(frame.getAttribute("referrerpolicy")).toBe("no-referrer");
  expect(global.fetch).not.toHaveBeenCalled();
  act(() => host.querySelector("button").click());
  expect(host.querySelector("iframe")).not.toBe(frame);
  expect(host.querySelector("iframe").src).toBe(frame.src);
});
