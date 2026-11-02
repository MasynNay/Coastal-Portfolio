import { pond } from "./TownLayout";
import { axolotlRaceMarker } from "./AxolotlRace";
import { rideStops } from "./Riding";
import { createWorld } from "./engine";
import { gaitTimeForSheet } from "./Gait";
import sheets from "./SpriteSheets.json";
import { runSpeed } from "./Movement";
// The 2D game uses screen-aligned movement; no retired 3D projection is needed.
const screenToWorld = (x, z) => ({
    x,
    z,
  }),
  worldToScreen = (x, z) => ({
    x,
    z,
  });
jest.mock("./canvasScene", () => ({
  createCanvasScene: () => mockScene,
}));
jest.mock("./navigation", () => ({
  canStand: () => true,
  findPath: (_, target) => [target],
  move: (p, dx, dz) => ({
    x: p.x + dx,
    z: p.z + dz,
  }),
}));
let mockScene, clock, pending, sequence, draws;
beforeEach(() => {
  clock = 0;
  pending = new Map();
  sequence = 0;
  draws = [];
  jest.spyOn(performance, "now").mockImplementation(() => clock);
  global.requestAnimationFrame = (fn) => {
    pending.set(++sequence, fn);
    return sequence;
  };
  global.cancelAnimationFrame = (id) => pending.delete(id);
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  mockScene = {
    canvas: document.createElement("canvas"),
    draw: (s) =>
      draws.push({
        ...s,
        position: {
          ...s.position,
        },
      }),
    resize: () => {},
    labels: () => [],
    loadTown: async () => {},
    loadRoom: async () => {},
    snapCamera: () => {},
    animating: () => false,
    dispose: () => {},
    movement: (h, v) => {
      const p = screenToWorld(h, v);
      return {
        dx: p.x,
        dz: p.z,
      };
    },
    facing: (x, z) => worldToScreen(x, z),
    speedScale: (x, z) => {
      const p = worldToScreen(x, z);
      return Math.hypot(p.x, p.z);
    },
    hit: () => {
      const p = screenToWorld(100, 0);
      return {
        x: p.x,
        z: 9 + p.z,
      };
    },
  };
});
afterEach(() => jest.restoreAllMocks());
function frame(dt) {
  clock += dt;
  const tasks = [...pending.values()];
  pending.clear();
  tasks.forEach((fn) => fn(clock));
}
// Keep the test's explicit frame driver while Jest advances fishing timeouts.
function fishingClock() {
  jest.useFakeTimers();
  global.requestAnimationFrame = (fn) => {
    pending.set(++sequence, fn);
    return sequence;
  };
  global.cancelAnimationFrame = (id) => pending.delete(id);
  jest.spyOn(performance, "now").mockImplementation(() => clock);
}
test("the jet-ski minimap shortcut walks to its reachable pier boarding point", async () => {
  const game = createWorld(document.createElement("div"), {});
  try {
    await Promise.resolve();
    frame(16);
    expect(game.walkToRide("jetski")).toBe(true);
    for (let i = 0; i < 65; i++) frame(50);
    const stop = rideStops.find((s) => s.id === "jetski");
    expect(draws[draws.length - 1].position.x).toBeCloseTo(stop.x, 0);
    expect(draws[draws.length - 1].position.z).toBeCloseTo(stop.z, 0);
    game.interact();
    frame(16);
    expect(draws[draws.length - 1].waterRide.id).toBe("jetski");
  } finally {
    game.dispose();
  }
});
test("the outdoor shell fountain opens Axolotl Drift directly without a wish menu", async () => {
  const onEvent = jest.fn();
  const game = createWorld(document.createElement("div"), { onEvent });
  try {
    await Promise.resolve();
    frame(16);
    // Approach from the promenade instead of walking through a house doorway.
    for (const target of [
      { x: 0, z: 20 },
      { x: -25.5, z: 15.3 },
    ]) {
      mockScene.hit = () => target;
      mockScene.canvas.dispatchEvent(
        new MouseEvent("pointerdown", { button: 0 }),
      );
      frame(0);
      for (let i = 0; i < 80; i++) frame(50);
    }
    game.interact();
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "axolotl-game",
        id: "shell-fountain",
        label: "Play Axolotl Drift",
      }),
    );
  } finally {
    game.dispose();
  }
});
test("the aquarium room has no indoor arcade interaction", async () => {
  const onEvent = jest.fn();
  const game = createWorld(document.createElement("div"), { onEvent });
  try {
    await Promise.resolve();
    frame(16);
    await game.enter("contact");
    onEvent.mockClear();
    mockScene.hit = () => ({ x: 8, z: -1.5 });
    mockScene.canvas.dispatchEvent(
      new MouseEvent("pointerdown", { button: 0 }),
    );
    frame(0);
    for (let i = 0; i < 70; i++) frame(50);
    game.interact();
    expect(onEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "axolotl-game" }),
    );
  } finally {
    game.dispose();
  }
});
test("the pier race uses five default riders, then restores the player's costume and location", async () => {
  const onEvent = jest.fn();
  const game = createWorld(document.createElement("div"), { onEvent });
  try {
    await Promise.resolve();
    frame(16);
    game.setCharacter("outfit:resume");
    mockScene.hit = () => ({ x: axolotlRaceMarker.x, z: axolotlRaceMarker.z });
    mockScene.canvas.dispatchEvent(
      new MouseEvent("pointerdown", { button: 0 }),
    );
    frame(0);
    for (let i = 0; i < 70; i++) frame(50);
    const before = draws[draws.length - 1];
    expect(before.position.z).toBeCloseTo(axolotlRaceMarker.z, 0);
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "e", code: "KeyE" }),
    );
    window.dispatchEvent(
      new KeyboardEvent("keyup", { key: "e", code: "KeyE" }),
    );
    frame(16);
    const racing = draws[draws.length - 1];
    expect(racing.axolotlRace.phase).toBe("countdown");
    expect(racing.outfit).toBe(null);
    expect(racing.surfing).toBe(true);
    expect(racing.residents).toHaveLength(5);
    expect(racing.residents.every((r) => r.outfit === null && r.surfing)).toBe(
      true,
    );
    for (let i = 0; i < 280; i++) frame(100);
    const result = onEvent.mock.calls
      .map(([e]) => e)
      .find((e) => e.type === "race-result");
    expect(result.order).toHaveLength(5);
    expect(result.winner).toEqual(result.order[0]);
    const after = draws[draws.length - 1];
    expect(after.axolotlRace).toBe(null);
    expect(after.outfit).toBe("resume");
    expect(after.surfing).toBe(false);
    expect(after.position).toEqual(before.position);
  } finally {
    game.dispose();
  }
});
async function travel(kind, { run = false, dt = 100, frames = 10 } = {}) {
  const game = createWorld(document.createElement("div"), {});
  await Promise.resolve();
  frame(16);
  if (run)
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Shift",
      }),
    );
  if (kind === "keys")
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "d",
      }),
    );
  else
    mockScene.canvas.dispatchEvent(
      new MouseEvent("pointerdown", {
        button: 0,
      }),
    );
  // Click-to-move has one initial scheduling frame; both comparisons then cover one second.
  if (kind === "click") frame(0);
  for (let i = 0; i < frames; i++) frame(dt);
  const final = draws[draws.length - 1],
    last = final.position,
    p = worldToScreen(last.x, last.z - 9);
  game.dispose();
  return { ...p, gaitTime: final.gaitTime };
}
test.each(["keys", "click"])(
  "%s running keeps real-time leg playback while still travelling at full speed",
  async (kind) => {
    const run = await travel(kind, { run: true });
    expect(run.x).toBeCloseTo(14, 0);
    // A physical press can take the existing immediate 1/120-second step.
    // Measure elapsed animation against the actual travelled distance.
    const playback = gaitTimeForSheet(sheets["masyn-run"], run.gaitTime);
    expect(playback).toBeCloseTo((run.x / runSpeed) * 1000, 4);
    expect(playback).toBeLessThan(1020);
  },
);
test("a zero-time redraw while moving preserves stride phase when Shift is pressed", async () => {
  const game = createWorld(document.createElement("div"), {});
  try {
    await Promise.resolve();
    frame(16);
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "d", code: "KeyD" }),
    );
    frame(0);
    frame(200);
    const before = draws.at(-1);
    expect(before.gaitTime).toBeGreaterThan(0);
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Shift", code: "ShiftLeft" }),
    );
    frame(0);
    expect(draws.at(-1).moving).toBe(true);
    expect(draws.at(-1).gaitTime).toBe(before.gaitTime);
  } finally {
    game.dispose();
  }
});
test("WASD and click-to-move run at the same speed on late frames", async () => {
  const keyboard = await travel("keys", {
      run: true,
    }),
    click = await travel("click", {
      run: true,
    });
  expect(keyboard.x).toBeCloseTo(14, 0);
  expect(Math.abs(keyboard.x - click.x)).toBeLessThan(0.15);
  expect(Math.abs(keyboard.z)).toBeLessThan(0.01);
});
test("normal keyboard movement covers one second at the intended speed", async () => {
  const keyboard = await travel("keys", {
    dt: 1000 / 60,
    frames: 60,
  });
  expect(keyboard.x).toBeCloseTo(8.5, 0);
});
test("the pier interaction boards a jet ski, accepts touch steering and Q, and returns without losing the rider", async () => {
  let status;
  const game = createWorld(document.createElement("div"), {
    onStatus: (s) => {
      status = s;
    },
  });
  await Promise.resolve();
  frame(16);
  mockScene.hit = () => ({ x: 2.25, z: 27 });
  mockScene.canvas.dispatchEvent(new MouseEvent("pointerdown", { button: 0 }));
  frame(0);
  for (let i = 0; i < 30; i++) frame(100);
  const origin = { ...draws.at(-1).position };
  expect(status.prompt).toBe("Ride the jet ski");
  game.interact();
  frame(16);
  expect(status.watercraft).toBe("jetski");
  game.control("d", true);
  for (let i = 0; i < 5; i++) frame(100);
  game.control("d", false);
  const x = draws.at(-1).position.x;
  expect(x).toBeGreaterThan(8);
  frame(100);
  expect(draws.at(-1).position.x).toBeCloseTo(x);
  game.ability();
  frame(450);
  expect(draws.at(-1).waterRide.lift).toBeGreaterThan(1);
  game.stop();
  frame(16);
  expect(status.watercraft).toBe("jetski");
  game.endRide();
  for (let i = 0; i < 150 && status.watercraft; i++) frame(100);
  expect(status.watercraft).toBe(null);
  expect(draws.at(-1).position.x).toBeCloseTo(origin.x);
  expect(draws.at(-1).position.z).toBeCloseTo(origin.z);
  game.dispose();
});
test("held WASD continues when keydown arrives before a queued zero-delta frame", async () => {
  const game = createWorld(document.createElement("div"), {});
  await Promise.resolve();
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "d",
      code: "KeyD",
    }),
  );
  frame(16);
  for (let i = 0; i < 60; i++) frame(1000 / 60);
  const p = draws[draws.length - 1].position,
    screen = worldToScreen(p.x, p.z - 9);
  expect(screen.x).toBeGreaterThan(8);
  game.dispose();
});
test("a delayed visible frame preserves movement time through simulation substeps", async () => {
  const keyboard = await travel("keys", {
    dt: 500,
    frames: 2,
  });
  expect(keyboard.x).toBeCloseTo(8.5, 0);
});
test("Masyn keeps a room's costume outside, can choose any outfit, and family members stay themselves", async () => {
  let status;
  const game = createWorld(document.createElement("div"), {
    onStatus: (s) => {
      status = s;
    },
  });
  await Promise.resolve();
  await game.enter("resume");
  expect(status.outfit).toBe("resume");
  await game.enter(null);
  expect(status.outfit).toBe("resume");
  await game.setCharacter("outfit:lodge");
  expect(status.character).toBe("masyn");
  expect(status.outfit).toBe("lodge");
  await game.enter("portfolio");
  await game.enter(null);
  expect(status.outfit).toBe("portfolio");
  await game.setCharacter("fallyn");
  await game.enter("skills");
  expect(status.character).toBe("fallyn");
  expect(status.outfit).toBe(null);
  game.dispose();
});
test("casting locks movement and disposal cancels pending fishing results", async () => {
  fishingClock();
  let status;
  const onEvent = jest.fn();
  const game = createWorld(document.createElement("div"), {
    onStatus: (s) => {
      status = s;
    },
    onEvent,
  });
  await Promise.resolve();
  mockScene.hit = () => ({
    x: pond.x,
    z: pond.z + pond.rz + 0.6,
  });
  mockScene.canvas.dispatchEvent(
    new MouseEvent("pointerdown", {
      button: 0,
    }),
  );
  frame(16);
  frame(600);
  expect(draws.at(-1).position.z).toBeLessThan(6);
  game.fish();
  expect(status.fishingPhase).toBe("casting");
  const origin = draws.at(-1).position;
  game.control("d", true);
  frame(200);
  expect(draws.at(-1).position).toEqual(origin);
  game.dispose();
  jest.advanceTimersByTime(5000);
  expect(onEvent).not.toHaveBeenCalled();
  jest.useRealTimers();
});
test.each([
  ["pond", "freshwater"],
  ["pier", "saltwater"],
])(
  "a complete catch at the %s awards only its actual water habitat",
  async (place, habitat) => {
    fishingClock();
    jest.spyOn(Math, "random").mockReturnValue(0.2);
    const onEvent = jest.fn();
    const game = createWorld(document.createElement("div"), { onEvent });
    try {
      await Promise.resolve();
      frame(16);
      mockScene.hit = () =>
        place === "pond"
          ? { x: pond.x, z: pond.z + pond.rz + 0.6 }
          : { x: 0, z: 29 };
      mockScene.canvas.dispatchEvent(
        new MouseEvent("pointerdown", { button: 0 }),
      );
      frame(0);
      for (let i = 0; i < 50; i++) frame(100);
      game.fish();
      jest.advanceTimersByTime(4000);
      const result = onEvent.mock.calls
        .map(([event]) => event)
        .find((event) => event.type === "fishing-result");
      expect(result?.caught).toBe(true);
      const { fishSpecies } = require("./Fish");
      expect(
        fishSpecies.find((fish) => fish.id === result.fishId).habitat,
      ).toBe(habitat);
    } finally {
      game.dispose();
      jest.useRealTimers();
    }
  },
);
test("each entry opens its matching room information exactly once; leaving doesn't reopen it", async () => {
  const onEvent = jest.fn();
  const game = createWorld(document.createElement("div"), {
    onEvent,
  });
  await Promise.resolve();
  await game.enter("skills");
  expect(onEvent).toHaveBeenLastCalledWith({
    type: "content",
    id: "skills",
  });
  await game.enter(null);
  expect(onEvent).toHaveBeenCalledTimes(1);
  await game.enter("contact");
  expect(onEvent).toHaveBeenLastCalledWith({
    type: "content",
    id: "contact",
  });
  game.dispose();
});
test("direct diagonal walking releases one axis immediately and stops on final key-up", async () => {
  const game = createWorld(document.createElement("div"), {});
  await Promise.resolve();
  frame(16);
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "KeyW",
      key: "w",
    }),
  );
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "KeyD",
      key: "d",
    }),
  );
  frame(300);
  const diagonal = draws.at(-1).position;
  const projected = worldToScreen(diagonal.x, diagonal.z - 9);
  expect(projected.x).toBeGreaterThan(1);
  expect(projected.z).toBeLessThan(-1);
  window.dispatchEvent(
    new KeyboardEvent("keyup", {
      code: "KeyW",
      key: "w",
    }),
  );
  frame(300);
  const oneAxis = draws.at(-1).position;
  const next = worldToScreen(oneAxis.x, oneAxis.z - 9);
  expect(next.z).toBeCloseTo(projected.z, 5);
  expect(next.x).toBeGreaterThan(projected.x + 2);
  window.dispatchEvent(
    new KeyboardEvent("keyup", {
      code: "KeyD",
      key: "d",
    }),
  );
  frame(1000);
  expect(draws.at(-1).position).toEqual(oneAxis);
  game.dispose();
});
test("costume Q completes while idle, ignores retriggering, and resumes only still-held movement", async () => {
  const game = createWorld(document.createElement("div"), {});
  await Promise.resolve();
  await game.setCharacter("outfit:contact");
  frame(16);
  game.ability();
  frame(16);
  const effect = draws.at(-1).abilityEffect;
  expect(effect.kind).toBe("trident");
  const origin = draws.at(-1).position;
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "d", code: "KeyD" }),
  );
  frame(500);
  game.ability();
  expect(draws.at(-1).abilityEffect.started).toBe(effect.started);
  expect(draws.at(-1).position).toEqual(origin);
  for (let i = 0; i < 6; i++) frame(200);
  expect(draws.at(-1).abilityEffect).toBe(null);
  expect(draws.at(-1).position.x).toBeGreaterThan(origin.x);
  window.dispatchEvent(new KeyboardEvent("keyup", { key: "d", code: "KeyD" }));
  const stopped = draws.at(-1).position;
  frame(300);
  expect(draws.at(-1).position).toEqual(stopped);
  game.ability();
  frame(300);
  await game.setCharacter("outfit:lodge");
  frame(16);
  expect(draws.at(-1).abilityEffect).toBe(null);
  game.ability();
  for (let i = 0; i < 14; i++) frame(200);
  expect(draws.at(-1).abilityEffect).toBe(null);
  game.dispose();
});
test("About gives Masyn his airbender outfit; gliding returns exactly and changing character cancels safely", async () => {
  const game = createWorld(document.createElement("div"), {});
  await Promise.resolve();
  await game.enter("home");
  frame(16);
  const origin = { ...draws.at(-1).position };
  expect(draws.at(-1).outfit).toBe("home");
  game.ability();
  frame(16);
  frame(1000);
  expect(draws.at(-1).abilityEffect.kind).toBe("glide");
  expect(draws.at(-1).position).not.toEqual(origin);
  for (let i = 0; i < 35; i++) frame(100);
  expect(draws.at(-1).abilityEffect).toBe(null);
  expect(draws.at(-1).position).toEqual(origin);
  game.ability();
  frame(16);
  frame(1200);
  expect(draws.at(-1).position).not.toEqual(origin);
  await game.setCharacter("fallyn");
  frame(16);
  expect(draws.at(-1).abilityEffect).toBe(null);
  expect(draws.at(-1).position).toEqual(origin);
  game.dispose();
});
test("Masyn's usual Mi Shell greeting shows affection, with an encounter only on the rare roll", async () => {
  jest.spyOn(require("./Roaming"), "roamingPeople").mockReturnValue([
    {
      id: "mi-shell",
      x: 1,
      z: 9,
      moving: false,
    },
  ]);
  const roll = jest.spyOn(Math, "random").mockReturnValue(0.5),
    onEvent = jest.fn();
  const game = createWorld(document.createElement("div"), {
    onEvent,
  });
  await Promise.resolve();
  game.interact();
  expect(onEvent).toHaveBeenLastCalledWith(
    expect.objectContaining({
      type: "affection",
      id: "mi-shell",
    }),
  );
  frame(16);
  expect(draws.at(-1).heart).not.toBe(null);
  roll.mockReturnValue(0.01);
  game.interact();
  expect(onEvent).toHaveBeenLastCalledWith(
    expect.objectContaining({
      type: "encounter",
      id: "mi-shell",
    }),
  );
  game.dispose();
});
test("short remote WASD and arrow packets are not lost between already-queued animation frames", async () => {
  mockScene.animating = () => true;
  const game = createWorld(document.createElement("div"), {});
  await Promise.resolve();
  frame(16);
  for (const [code, key] of [
    ["KeyD", "d"],
    ["ArrowRight", "ArrowRight"],
  ]) {
    const before = draws.at(-1).position;
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        code,
        key,
      }),
    );
    clock += 2;
    window.dispatchEvent(
      new KeyboardEvent("keyup", {
        code,
        key,
      }),
    );
    frame(16);
    frame(16);
    const next = draws.at(-1).position;
    expect(Math.hypot(next.x - before.x, next.z - before.z)).toBeGreaterThan(
      0.08,
    );
    game.control("stop", false);
  }
  game.dispose();
});
test("indoor flight arrives inside another room and then pond flight arrives mounted", async () => {
  jest.useFakeTimers();
  const events = [],
    statuses = [];
  const game = createWorld(document.createElement("div"), {
    onEvent: (e) => events.push(e),
    onStatus: (s) => statuses.push(s),
  });
  await Promise.resolve();
  await game.enter("home");
  events.length = 0;
  game.travel("skills");
  jest.advanceTimersByTime(1700);
  await Promise.resolve();
  jest.advanceTimersByTime(2100);
  expect(statuses.at(-1).room).toBe("skills");
  expect(events.at(-1)).toMatchObject({
    type: "content",
    id: "skills",
  });
  game.travel("pond");
  jest.advanceTimersByTime(1700);
  await Promise.resolve();
  jest.advanceTimersByTime(2100);
  expect(statuses.at(-1)).toMatchObject({
    room: null,
    surfing: true,
  });
  game.dispose();
  jest.useRealTimers();
});
test("changing character cancels a pending flight without reopening the old room", async () => {
  jest.useFakeTimers();
  const events = [];
  const game = createWorld(document.createElement("div"), {
    onEvent: (e) => events.push(e),
  });
  await Promise.resolve();
  await game.enter("home");
  events.length = 0;
  game.travel("resume");
  await game.setCharacter("ezra");
  jest.advanceTimersByTime(5000);
  await Promise.resolve();
  expect(events).toHaveLength(0);
  game.dispose();
  jest.useRealTimers();
});

test("double-click routes run without Shift, while a later single click walks", async () => {
  const game = createWorld(document.createElement("div"), {});
  await Promise.resolve();
  frame(16);
  const click = () =>
    mockScene.canvas.dispatchEvent(
      new MouseEvent("pointerdown", { button: 0, clientX: 20, clientY: 20 }),
    );
  click();
  frame(60);
  click();
  frame(16);
  expect(draws.at(-1).running).toBe(true);
  expect(draws.at(-1).destination).toBeDefined();
  frame(400);
  click();
  frame(16);
  expect(draws.at(-1).running).toBe(false);
  game.dispose();
});
test("touch directions support diagonal running, release stops and Stop cancels a route", async () => {
  const game = createWorld(document.createElement("div"), {});
  await Promise.resolve();
  frame(16);
  game.setRunning(true);
  game.control("w", true);
  game.control("d", true);
  frame(100);
  expect(draws.at(-1).running).toBe(true);
  expect(draws.at(-1).direction).toBe(3);
  game.control("w", false);
  game.control("d", false);
  frame(16);
  expect(draws.at(-1).moving).toBe(false);
  mockScene.canvas.dispatchEvent(new MouseEvent("pointerdown", { button: 0 }));
  frame(16);
  game.stop();
  frame(16);
  expect(draws.at(-1).moving).toBe(false);
  expect(draws.at(-1).destination).toBeUndefined();
  game.dispose();
});

test("skateboarding keeps touch steering and simultaneous tricks available, then returns to the exact start", async () => {
  let status;
  const game = createWorld(document.createElement("div"), {
    onStatus: (s) => {
      status = s;
    },
  });
  await Promise.resolve();
  frame(16);
  mockScene.hit = () => ({ x: 26.1, z: 4.3 });
  mockScene.canvas.dispatchEvent(new MouseEvent("pointerdown", { button: 0 }));
  frame(0);
  for (let i = 0; i < 45; i++) frame(100);
  const origin = { ...draws.at(-1).position };
  expect(status.prompt).toBe("Ride the skateboard");
  game.interact();
  frame(16);
  expect(status.skateboarding).toBe(true);
  game.control("a", true);
  game.ability();
  for (let i = 0; i < 4; i++) frame(100);
  game.control("a", false);
  expect(draws.at(-1).skateRide.lift).toBeGreaterThan(0);
  expect(draws.at(-1).position.x).toBeLessThan(23);
  game.endRide();
  for (let i = 0; i < 200 && status.skateboarding; i++) frame(100);
  expect(status.skateboarding).toBe(false);
  expect(draws.at(-1).position.x).toBeCloseTo(origin.x);
  expect(draws.at(-1).position.z).toBeCloseTo(origin.z);
  game.dispose();
});

test("the boat borrows an NPC driver while the player wakeboards, then resumes the driver routine", async () => {
  let status;
  const game = createWorld(document.createElement("div"), {
    onStatus: (s) => {
      status = s;
    },
  });
  await Promise.resolve();
  frame(16);
  mockScene.hit = () => ({ x: -2.25, z: 27 });
  mockScene.canvas.dispatchEvent(new MouseEvent("pointerdown", { button: 0 }));
  frame(0);
  for (let i = 0; i < 30; i++) frame(100);
  const before = draws.at(-1).residents;
  game.interact();
  frame(16);
  expect(status.watercraft).toBe("boat");
  for (let i = 0; i < 15; i++) frame(100);
  const guest = { id: draws.at(-1).waterRide.driver };
  expect(guest).toBeTruthy();
  expect(draws.at(-1).residents.find((r) => r.id === guest.id).hidden).toBe(
    true,
  );
  game.endRide();
  for (let i = 0; i < 200 && status.watercraft; i++) frame(100);
  const resident = draws.at(-1).residents.find((r) => r.id === guest.id),
    origin = before.find((r) => r.id === guest.id);
  expect(resident.hidden).not.toBe(true);
  expect(resident.x).toBeCloseTo(origin.x, 1);
  expect(resident.z).toBeCloseTo(origin.z, 1);
  game.dispose();
});
test("Ocean King Q at the end of the pier summons fish, pauses with menus and cancels with a character change", async () => {
  const game = createWorld(document.createElement("div"), {});
  await Promise.resolve();
  frame(16);
  game.setCharacter("outfit:contact");
  mockScene.hit = () => ({ x: 0, z: 31 });
  mockScene.canvas.dispatchEvent(new MouseEvent("pointerdown", { button: 0 }));
  frame(0);
  for (let i = 0; i < 35; i++) frame(100);
  game.ability();
  for (let i = 0; i < 12; i++) frame(100);
  const praise = draws.at(-1).oceanPraise;
  expect(praise).toMatchObject({ x: 0, z: 35, speaking: true });
  game.freeze(true);
  frame(2000);
  expect(draws.at(-1).oceanPraise.age).toBe(praise.age);
  game.freeze(false);
  game.setCharacter("masyn");
  frame(16);
  expect(draws.at(-1).oceanPraise).toBeNull();
  game.dispose();
});

test("the boat shortcut starts wakeboarding directly, with touch tricks and a child rider", async () => {
  let status;
  const game = createWorld(document.createElement("div"), {
    onStatus: (s) => {
      status = s;
    },
  });
  await Promise.resolve();
  frame(16);
  game.setCharacter("fitzgerald");
  expect(game.walkToRide("boat")).toBe(true);
  for (let i = 0; i < 35; i++) frame(100);
  const origin = { ...draws.at(-1).position };
  expect(status.prompt).toBe("Take a wakeboard ride");
  game.interact();
  frame(16);
  expect(status.watercraft).toBe("boat");
  const mounted = draws.at(-1).waterRide;
  expect(mounted.driver).not.toBe("fitzgerald");
  expect(mounted.wakeboarder.id).toBe("fitzgerald");
  expect(draws.at(-1).position.x).toBe(mounted.wakeboarder.x);
  game.ability();
  frame(450);
  expect(draws.at(-1).waterRide.wakeboarder.lift).toBeGreaterThan(1);
  game.endRide();
  for (let i = 0; i < 200 && status.watercraft; i++) frame(100);
  expect(status.watercraft).toBeNull();
  expect(draws.at(-1).position.x).toBeCloseTo(origin.x);
  expect(draws.at(-1).position.z).toBeCloseTo(origin.z);
  game.dispose();
});

test.each(["skateboard", "jetski"])(
  "physical held directions continue while Q starts a %s trick",
  async (id) => {
    const game = createWorld(document.createElement("div"), {});
    await Promise.resolve();
    frame(16);
    mockScene.hit = () =>
      id === "skateboard" ? { x: 26.1, z: 4.3 } : { x: 2.25, z: 27 };
    mockScene.canvas.dispatchEvent(
      new MouseEvent("pointerdown", { button: 0 }),
    );
    frame(0);
    for (let i = 0; i < 45; i++) frame(100);
    game.interact();
    frame(16);
    const code = id === "skateboard" ? "KeyA" : "KeyD",
      key = id === "skateboard" ? "a" : "d";
    window.dispatchEvent(new KeyboardEvent("keydown", { code, key }));
    frame(100);
    const start = draws.at(-1).position.x;
    window.dispatchEvent(
      new KeyboardEvent("keydown", { code: "KeyQ", key: "q", repeat: true }),
    );
    for (let i = 0; i < 4; i++) frame(100);
    const state = draws.at(-1),
      ride = id === "skateboard" ? state.skateRide : state.waterRide;
    expect(ride.lift).toBeGreaterThan(0.4);
    expect(Math.abs(state.position.x - start)).toBeGreaterThan(3);
    window.dispatchEvent(
      new KeyboardEvent("keyup", { code: "KeyQ", key: "q" }),
    );
    frame(100);
    expect(draws.at(-1).moving).toBe(true);
    window.dispatchEvent(new KeyboardEvent("keyup", { code, key }));
    frame(16);
    expect(draws.at(-1).moving).toBe(false);
    game.dispose();
  },
);

test("float collection and beach activities share the normal action path and preserve the current costume", async () => {
  localStorage.removeItem("world-glass-floats");
  const onEvent = jest.fn(),
    onStatus = jest.fn();
  const game = createWorld(document.createElement("div"), {
    onEvent,
    onStatus,
  });
  async function walk(target) {
    mockScene.hit = () => target;
    mockScene.canvas.dispatchEvent(
      new MouseEvent("pointerdown", { button: 0 }),
    );
    frame(0);
    for (let i = 0; i < 120; i++) frame(50);
  }
  try {
    await Promise.resolve();
    frame(16);
    game.setCharacter("outfit:resume");
    game.startHunt();
    // Reach the beach through the pier before walking toward its activities.
    await walk({ x: 0, z: 22 });
    const hidden = draws.at(-1).glassFloats.find((f) => f.z > 20);
    expect(hidden).toBeDefined();
    await walk(hidden);
    game.interact();
    frame(16);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "float", count: 1 }),
    );
    expect(onStatus.mock.calls.at(-1)[0].floatCount).toBe(1);
    await walk({ x: -12, z: 22 });
    game.interact();
    frame(16);
    expect(draws.at(-1).beach.building).not.toBeNull();
    expect(draws.at(-1).beach.castle).toBeLessThan(0.1);
    for (let i = 0; i < 70; i++) frame(50);
    expect(draws.at(-1).beach.castle).toBeGreaterThan(0.4);
    expect(draws.at(-1).beach.castle).toBeLessThan(0.6);
    for (let i = 0; i < 72; i++) frame(50);
    expect(draws.at(-1).beach.castle).toBe(1);
    expect(draws.at(-1).outfit).toBe("resume");
    await walk({ x: 12, z: 22 });
    game.interact();
    frame(16);
    expect(draws.at(-1).beach.kite).not.toBeNull();
    expect(draws.at(-1).outfit).toBe("resume");
  } finally {
    game.dispose();
    localStorage.removeItem("world-glass-floats");
  }
});

test("mockingjay salutes pause held-key movement for three seconds, then resume the same key", async () => {
  mockScene.animating = () => true;
  const game = createWorld(document.createElement("div"), {});
  try {
    await Promise.resolve();
    frame(16);
    // Advance ordinary outdoor play to just before the tenth flock reaches us.
    for (let i = 0; i < 139; i++) frame(2000);
    frame(400);
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "d", code: "KeyD", bubbles: true }),
    );
    frame(100);
    const paused = draws.at(-1);
    expect(paused.salute).not.toBeNull();
    for (let i = 0; i < 29; i++) frame(100);
    expect(draws.at(-1).position).toEqual(paused.position);
    frame(100);
    expect(draws.at(-1).salute).toBeNull();
    expect(draws.at(-1).position.x).toBeGreaterThan(paused.position.x);
    window.dispatchEvent(
      new KeyboardEvent("keyup", { key: "d", code: "KeyD", bubbles: true }),
    );
  } finally {
    game.dispose();
  }
});

test("Panem Q pauses a bicycle in place and resumes its route without skipping three seconds", async () => {
  mockScene.animating = () => true;
  const game = createWorld(document.createElement("div"), {});
  try {
    await Promise.resolve();
    frame(16);
    await game.setCharacter("outfit:panem");
    mockScene.hit = () => ({ x: 26.1, z: -5.3 });
    mockScene.canvas.dispatchEvent(
      new MouseEvent("pointerdown", { button: 0 }),
    );
    for (let i = 0; i < 45; i++) frame(100);
    game.interact();
    frame(500);
    expect(draws.at(-1).bikeRide.phase).toBe("riding");
    const origin = { ...draws.at(-1).position };
    game.ability();
    for (let i = 0; i < 5; i++) frame(500);
    expect(draws.at(-1).salute).not.toBeNull();
    expect(draws.at(-1).position).toEqual(origin);
    frame(500);
    expect(draws.at(-1).salute).toBeNull();
    expect(
      Math.hypot(
        draws.at(-1).position.x - origin.x,
        draws.at(-1).position.z - origin.z,
      ),
    ).toBeLessThan(5.3);
    expect(draws.at(-1).outfit).toBe("panem");
  } finally {
    game.dispose();
  }
});
