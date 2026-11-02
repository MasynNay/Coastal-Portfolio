import { createCanvasScene } from "./PixelScene";
import sheets from "./SpriteSheets.json";
import { drawSprite } from "./art";
import { personHeight, runSpeed } from "./Movement";
import { advanceGait } from "./Gait";
import { roamingAnimals } from "./Roaming";
let mockMissing = new Set();
const mockLoads = jest.fn();
jest.mock("./TownTerrain", () => ({
  createTownTerrain: () => ({ draw: jest.fn(), dispose: jest.fn() }),
}));
jest.mock("./art", () => {
  const sheets = require("./SpriteSheets.json");
  const places = require("./PlaceArt.json"),
    terrain = require("./TerrainArt.json");
  const artwork = Object.fromEntries(
    Object.entries({
      ...sheets,
      ...places,
      ...terrain.props,
      ...require("./BeachArt.json"),
      ...require("./CoastArt.json"),
    }).map(([id, sheet]) => [id, { ...sheet, id }]),
  );
  return {
    artwork,
    createArtCache: () => ({
      get: (id) =>
        mockMissing.has(id) ? undefined : { width: 1024, height: 1152 },
      load: async (id) => {
        mockLoads(id);
        mockMissing.delete(id);
      },
      clear: () => {},
    }),
    drawSprite: jest.fn(),
  };
});
let scene;
beforeEach(() => {
  mockMissing = new Set();
  mockLoads.mockClear();
  const ctx = new Proxy(
    { measureText: () => ({ width: 30 }) },
    { get: (o, k) => (k in o ? o[k] : (o[k] = jest.fn())) },
  );
  jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx);
  const host = document.createElement("div");
  scene = createCanvasScene(host);
  scene.resize();
  drawSprite.mockClear();
});
afterEach(() => {
  scene.dispose();
  jest.restoreAllMocks();
});
const state = {
  room: null,
  position: { x: 0, z: 9 },
  character: "masyn",
  outfit: null,
  residents: [],
  animals: [],
  worldTime: 1000,
  gaitTime: 0,
  moving: false,
  direction: 0,
};
const drawn = () => drawSprite.mock.calls.map((call) => call[2].id);
test("the goose couple keeps its artwork without announcing names above the pond", () => {
  scene.draw({ ...state, animals: roamingAnimals(1000) }, 1000);
  expect(drawn()).toEqual(
    expect.arrayContaining(["goose-white", "goose-canada"]),
  );
  const ctx = HTMLCanvasElement.prototype.getContext.mock.results[0].value;
  expect(
    ctx.fillText.mock.calls.some(([text]) => /Haymitch|Lenore Dove/.test(text)),
  ).toBe(false);
});
test("a child's name remains above their head on the full-size bicycle", () => {
  scene.draw(
    {
      ...state,
      character: "fitzgerald",
      bikeRide: { id: "acro", phase: "riding", time: 0 },
    },
    1000,
  );
  const rider = drawSprite.mock.calls.find(
    (call) => call[2].id === "fitzgerald-bike-acro",
  );
  const ctx = HTMLCanvasElement.prototype.getContext.mock.results[0].value;
  const name = ctx.fillText.mock.calls.find(([text]) => text === "Fitzgerald");
  const sheet = rider[2];
  const headY =
    rider[4] - (rider[5] * (sheet.footY - sheet.labelTop)) / sheet.ch;
  expect(name[2]).toBeLessThan(headY - 4);
});
test("the renderer respects native-image eviction and can reload a costume more than once", async () => {
  const running = { ...state, moving: true, running: true, gaitTime: 300 };
  scene.draw(running, 1000);
  for (let i = 0; i < 2; i++) {
    mockMissing.add("masyn-run");
    scene.draw(running, 1000);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  }
  expect(
    mockLoads.mock.calls.filter(([id]) => id === "masyn-run"),
  ).toHaveLength(2);
});
test("the renderer applies the real-time running cadence to the loaded character sheet", () => {
  scene.draw(
    {
      ...state,
      moving: true,
      running: true,
      gaitTime: advanceGait(runSpeed * 0.44, true),
    },
    440,
  );
  const runner = drawSprite.mock.calls.find(
    (call) => call[2].id === "masyn-run",
  );
  expect(runner[8]).toBeCloseTo(440, 5);
});

test.each([false, true])(
  "cycling preserves rider body height for player/NPC (player cycling: %s)",
  (playerCycling) => {
    scene.draw(
      {
        ...state,
        bikeRide: playerCycling
          ? { id: "acro", phase: "riding", time: 0 }
          : null,
        residents: [
          {
            id: "mi-shell",
            x: 3,
            z: 9,
            direction: 6,
            moving: true,
            time: 0,
            bike: playerCycling ? null : "acro",
          },
        ],
      },
      1000,
    );
    const player = drawSprite.mock.calls.find(
      (call) => call[2].id === (playerCycling ? "masyn-bike-acro" : "masyn"),
    );
    const npc = drawSprite.mock.calls.find(
      (call) =>
        call[2].id === (playerCycling ? "mi-shell" : "mi-shell-bike-acro"),
    );
    const bodyPixels = (call) => (call[5] * call[2].bodyHeight) / call[2].ch;
    expect(bodyPixels(player) / bodyPixels(npc)).toBeCloseTo(
      personHeight("masyn") / personHeight("mi-shell"),
      1,
    );
  },
);
test("the town keeps the skateboard but has no parked wakeboard or floating rental labels", () => {
  scene.draw(state, 1000);
  expect(drawn()).toContain("skateboard");
  expect(drawn()).not.toContain("wakeboard");
  expect(scene.labels().some((p) => p.id.startsWith("ride-"))).toBe(false);
});
test("wakeboard mode draws the NPC driving and the player on a separate board with the trick pose", () => {
  scene.draw(
    {
      ...state,
      waterRide: {
        id: "boat",
        wakeboarding: true,
        craftId: "boat",
        driver: "mi-shell",
        x: -12,
        z: 32,
        direction: 6,
        moving: true,
        wakeboarder: {
          id: "masyn",
          x: -8,
          z: 32,
          direction: 6,
          trickProgress: 0.5,
          lift: 2,
          spin: Math.PI,
        },
      },
    },
    1000,
  );
  expect(drawn()).toContain("harbor-boat");
  expect(drawn()).toContain("mi-shell-water-ride");
  expect(drawn()).toContain("wakeboard");
  expect(drawn()).toContain("masyn-board-trick");
  expect(drawn().filter((id) => id === "masyn")).toHaveLength(0);
  const call = drawSprite.mock.calls.find(
    (call) => call[2].id === "masyn-board-trick",
  );
  expect(call[8]).toBe(
    Math.floor(sheets["masyn-board-trick"].cycleFrames / 2) *
      sheets["masyn-board-trick"].frameMs,
  );
});

test("every boat driver stays behind the hull in all eight headings", () => {
  const ctx = HTMLCanvasElement.prototype.getContext.mock.results[0].value;
  for (const driver of ["masyn", "mi-shell", "ezra", "fallyn", "fitzgerald"]) {
    for (let direction = 0; direction < 8; direction++) {
      ctx.rect.mockClear();
      ctx.clip.mockClear();
      drawSprite.mockClear();
      scene.draw(
        {
          ...state,
          waterRide: {
            id: "boat",
            craftId: "boat",
            driver,
            direction,
            x: -12,
            z: 32,
            moving: true,
          },
        },
        1000,
      );
      const call = drawSprite.mock.calls.find(
        (c) => c[2].id === driver + "-water-ride",
      );
      expect(call).toBeDefined();
      expect(ctx.clip).toHaveBeenCalledTimes(1);
      expect(ctx.clip.mock.invocationCallOrder[0]).toBeLessThan(
        drawSprite.mock.invocationCallOrder[
          drawSprite.mock.calls.indexOf(call)
        ],
      );
      const [, top, , height] = ctx.rect.mock.calls[0];
      const feet = call[4],
        spriteHeight = call[5];
      expect(top).toBeLessThan(feet - spriteHeight);
      // The cockpit occludes legs, leaving the driver's head and torso visible.
      expect(top + height).toBeLessThan(feet - spriteHeight * 0.1);
      expect(top + height).toBeGreaterThan(feet - spriteHeight * 0.75);
    }
  }
});

test("every themed mailbox paints in front of its own house, including the inset Skills doorway", () => {
  const { mailboxes } = require("./TownLayout");
  for (const box of mailboxes) {
    drawSprite.mockClear();
    scene.snapCamera({ x: box.x, z: box.z });
    scene.draw({ ...state, position: { x: box.x, z: box.z } }, 1000);
    const ids = drawn();
    expect(ids.indexOf(box.art)).toBeGreaterThan(
      ids.indexOf("building-" + box.home),
    );
    expect(ids).toContain(box.art);
  }
});

test("activated glass floats and shells render as their actual artwork, while inactive hunts render none", () => {
  scene.draw(
    {
      ...state,
      glassFloats: [],
      shells: [],
      beach: { castle: 0, footprints: [] },
    },
    1000,
  );
  expect(drawn().some((id) => id.startsWith("glass-float-"))).toBe(false);
  drawSprite.mockClear();
  scene.draw(
    {
      ...state,
      glassFloats: [
        {
          id: "float-1",
          index: 0,
          art: "glass-float-1",
          x: 12,
          z: 22,
          h: 0.95,
        },
      ],
      floatHunt: { started: 0 },
      shells: [{ art: "shell-1", x: -12, z: 22, h: 0.7 }],
      beach: { castle: 1, footprints: [] },
    },
    1000,
  );
  expect(drawn()).toContain("glass-float-1");
  expect(drawn()).toContain("shell-1");
  expect(drawn()).toContain("castle-stage-7");
});
