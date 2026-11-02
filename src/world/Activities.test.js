import { createDogPlay } from "./DogPlay";
import { canStand } from "./navigation";
import { obstacles } from "./config";
import { npcCostume, createWebs, shootsWebs, heroOutfits } from "./Heroes";
import { readTerrariums, saveTerrariums } from "./Bugs";
import { travelTarget } from "./Travel";
import { pond } from "./TownLayout";
import { roomEntrance } from "./WorldLayout";
const origin = {
    x: 0,
    z: 9,
  },
  dog = {
    x: 1,
    z: 9,
  };
test("fetch throws, retrieves and returns the dog and ball to the player", () => {
  const play = createDogPlay(() => 0.4);
  expect(play.start("rosie", "fetch", origin, dog)).toBe(true);
  let r = play.update(0.3, 300);
  expect(r.ball.lift).toBeGreaterThan(0);
  expect(r.player).toEqual(origin);
  let carried = false;
  for (let t = 400; t < 30000 && play.active(); t += 100) {
    r = play.update(0.1, t);
    if (r.ball && r.dog.moving && r.ball.lift === 0.32) carried = true;
    expect(canStand(r.dog.x, r.dog.z, obstacles)).toBe(true);
  }
  expect(carried).toBe(true);
  expect(r.done).toBe(true);
  expect(r.ball).toBe(null);
  expect(r.dog.x).toBeCloseTo(origin.x);
  expect(r.dog.z).toBeCloseTo(origin.z);
  expect(play.update(0.1)).toBe(null);
});
test("a leashed walk takes five seconds and returns exactly to its start", () => {
  const play = createDogPlay(() => 0.6);
  expect(play.start("millie", "walk", origin, dog)).toBe(true);
  let moved = false,
    r;
  for (let i = 1; i <= 49; i++) {
    r = play.update(0.1, i * 100);
    moved ||= Math.hypot(r.player.x, r.player.z - 9) > 0.1;
    expect(r.leash).toBe(true);
    expect(canStand(r.player.x, r.player.z, obstacles)).toBe(true);
    expect(canStand(r.dog.x, r.dog.z, obstacles)).toBe(true);
  }
  expect(moved).toBe(true);
  r = play.update(0.1, 5000);
  expect(r.done).toBe(true);
  expect(r.player).toEqual(origin);
  expect(r.leash).toBe(false);
});
test("pets have hearts and cancellation cannot complete an old activity", () => {
  const play = createDogPlay();
  play.start("rosie", "pet", origin, dog);
  expect(play.update(0.2).hearts).toBe(true);
  play.cancel();
  expect(play.active()).toBe(false);
  expect(play.update(10)).toBe(null);
  expect(play.snapshot()).toBe(null);
});
test("only real bugs can be saved; legacy arrays migrate into quantities", () => {
  localStorage.clear();
  expect(saveTerrariums(["spider", "duck", "spider", "spider-coast"])).toEqual({
    spider: 1,
    "spider-coast": 1,
  });
  expect(readTerrariums()).toEqual({ spider: 1, "spider-coast": 1 });
  saveTerrariums({ "spider-coast": 2 });
  expect(readTerrariums()).toEqual({ "spider-coast": 2 });
  localStorage.setItem("world-spiders", "{}");
  expect(readTerrariums()).toEqual({});
});
test("each child switches between normal and hero outfits; Ladybug never shoots webs", () => {
  for (const id of ["ezra", "fallyn", "fitzgerald"]) {
    const seen = new Set(
      Array.from(
        {
          length: 600,
        },
        (_, i) => npcCostume(id, i * 1000),
      ),
    );
    expect(seen.has(null)).toBe(true);
    expect(seen.size).toBe(
      heroOutfits.find((o) => o.character === id).available ? 2 : 1,
    );
  }
  expect(npcCostume("masyn", 20000)).toBe(null);
  expect(shootsWebs("fallyn", "ladybug-fallyn")).toBe(false);
  const webs = createWebs(),
    actor = {
      id: "ezra",
      outfit: "spider-ezra",
      x: 0,
      z: 0,
      direction: 2,
    };
  expect(webs.update([actor], 0)).toHaveLength(0);
  expect(webs.update([actor], 14999)).toHaveLength(0);
  expect(webs.update([actor], 15000)).toHaveLength(1);
  expect(webs.update([actor], 16001)).toHaveLength(0);
  expect(webs.update([actor], 30000)).toHaveLength(1);
  webs.clear();
  expect(webs.update([], 30001)).toHaveLength(0);
});
test("home travel stays inside from a room; the pond always arrives outside already surfing", () => {
  expect(travelTarget("skills", "home")).toMatchObject({
    room: "skills",
    position: roomEntrance,
    surfing: false,
  });
  expect(travelTarget("home", null).room).toBe(null);
  expect(travelTarget("pond", "skills")).toEqual({
    id: "pond",
    room: null,
    position: {
      x: pond.x,
      z: pond.z,
    },
    surfing: true,
  });
  expect(travelTarget("missing", "home")).toBe(null);
});
test("manual webs work for regular Ezra/Fitzgerald and are rate limited independently of automatic effects", () => {
  const webs = createWebs(),
    actor = {
      id: "fitzgerald",
      x: 1,
      z: 2,
      direction: 2,
    };
  expect(webs.shoot(actor, 0)).toBe(true);
  expect(webs.shoot(actor, 100)).toBe(false);
  expect(webs.update([actor], 100)).toHaveLength(1);
  expect(webs.shoot(actor, 500)).toBe(true);
  expect(
    webs.shoot(
      {
        ...actor,
        id: "fallyn",
      },
      500,
    ),
  ).toBe(false);
});
