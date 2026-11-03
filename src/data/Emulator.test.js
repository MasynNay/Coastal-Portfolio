import fs from "fs";
import path from "path";
import vm from "vm";
import roms from "./roms.json";
import { retroGames } from "./games";
import { GAME_PORTALS } from "../world/legacySecrets";

// Check our integration boundary without substituting a fake game for the real
// emulator. Vendor WebAssembly and actual ROM booting need browser playtests.
const source = fs.readFileSync(path.join(process.cwd(), "public/emulator/player.js"), "utf8");
const catalog = Object.fromEntries(roms.map((rom) => [rom.id, {
  name: rom.name, version: rom.version, saveId: rom.saveId,
  rom: `/roms/${rom.file}`,
}]));
async function openPlayer(id, touch = false) {
  document.body.innerHTML = '<div id="emulator-game"></div><p id="player-status">Opening…</p>';
  const playerWindow = {
    location: { search: `?game=${encodeURIComponent(id)}` },
    matchMedia: () => ({ matches: touch }),
  };
  await new vm.Script(source).runInNewContext({
    window: playerWindow, document, URLSearchParams,
    navigator: { maxTouchPoints: touch ? 5 : 0 },
    fetch: async () => ({ ok: true, json: async () => catalog }),
    setTimeout, clearTimeout,
  });
  return playerWindow;
}
beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({});
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  document.body.innerHTML = "";
});
test("every hidden room uses an approved cartridge and saves cannot collide", () => {
  expect(retroGames).toHaveLength(7);
  expect(new Set(roms.map((rom) => rom.saveId)).size).toBe(roms.length);
  expect(new Set(roms.map((rom) => rom.file)).size).toBe(roms.length);
  expect(Object.keys(GAME_PORTALS)).toHaveLength(5);
  for (const portal of Object.values(GAME_PORTALS)) {
    expect(retroGames.some((game) => game.url === portal.src)).toBe(true);
    expect(portal.controls).toContain("on-screen buttons");
    expect(portal.src).toMatch(/^\/emulator\/player.html\?game=/);
  }
});
test("a cartridge boots the local core with individual saves and touch controls", async () => {
  const config = await openPlayer("unbound", true);
  expect(config.EJS_gameUrl).toBe(catalog.unbound.rom);
  expect(config.EJS_gameID).toBe(catalog.unbound.saveId);
  expect(config.EJS_pathtodata).toBe("/emulator/4.2.3/");
  expect(config.EJS_AdUrl).toBe("");
  expect(config.EJS_threads).toBe(false);
  expect(config.EJS_defaultOptions["virtual-gamepad"]).toBe("enabled");
  expect(Object.keys(config.EJS_defaultControls)).toEqual(["0", "1", "2", "3"]);
  expect(document.querySelector("script").getAttribute("src")).toBe("/emulator/4.2.3/loader.js");
  const start = document.createElement("div");
  start.className = "ejs_start_button";
  const click = jest.fn();
  start.addEventListener("click", click);
  document.body.appendChild(start);
  config.EJS_ready();
  expect(document.getElementById("player-status").hidden).toBe(true);
  expect(start.getAttribute("role")).toBe("button");
  expect(start.tabIndex).toBe(0);
  start.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  expect(click).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(30000);
  expect(document.getElementById("player-status").hidden).toBe(true);
});
test.each(["https://example.com/another.gba", "__proto__", "missing"])("rejects an unlisted cartridge: %s", async (id) => {
  await openPlayer(id);
  expect(document.querySelector("script")).toBeNull();
  expect(document.getElementById("player-status").textContent).toContain("not available");
});
test("missing graphics support and loader failures show useful errors", async () => {
  HTMLCanvasElement.prototype.getContext.mockReturnValue(null);
  await openPlayer("unbound");
  expect(document.getElementById("player-status").textContent).toContain("no WebGL");
  HTMLCanvasElement.prototype.getContext.mockReturnValue({});
  await openPlayer("unbound");
  document.querySelector("script").dispatchEvent(new Event("error"));
  expect(document.getElementById("player-status").textContent).toContain("could not load");
  jest.advanceTimersByTime(30000);
  expect(document.getElementById("player-status").textContent).toContain("could not load");
});
