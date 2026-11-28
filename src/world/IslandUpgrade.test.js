import { createPlayground, playgroundActivities } from "./Playground";
import { createGroveReveal, groveTree } from "./ForestGrove";
import { packs, openPack } from "./CardPacks";
import { habitatFood } from "./HabitatCare";
import { ropeGrip } from "./RopeAnchors";
import { artwork } from "./art";
import { personHeight } from "./Movement";
import { activityAsset } from "./Wardrobe";
import appearances from "./Appearances.json";
import { buildings } from "./config";
import { canStand } from "./navigation";
import { townProps } from "./TownLayout";

test("every playground activity returns the player, keeps their outfit and can be interrupted", () => {
  for (const id of Object.keys(playgroundActivities)) {
    const prop = townProps.find((p) => p.id === id);
    expect(prop).toBeDefined();
    const origin = { x: prop.x, z: prop.z + 2 };
    const play = createPlayground();
    expect(play.start(prop, origin, { id: "ezra", x: 16, z: 2 }, 100)).toBe(
      true,
    );
    for (const time of [100, 500, 1500, 3500, 6500]) {
      const pose = play.snapshot(time);
      expect(Number.isFinite(pose.player.lift)).toBe(true);
      for (const look of appearances) {
        expect(
          artwork[
            activityAsset(
              look.character,
              look.id,
              pose.player.seated ? "water-ride" : "walk",
              artwork,
            )
          ],
        ).toBeDefined();
      }
    }
    const final = play.snapshot(13000);
    expect(final.done).toBe(true);
    expect(final.player.x).toBeCloseTo(origin.x);
    expect(final.player.z).toBeCloseTo(origin.z);
    expect(play.stop()).toEqual(origin);
    expect(play.active()).toBe(false);
  }
});
test("Totoro requires three distinct shakes and resets after the dance", () => {
  const grove = createGroveReveal();
  expect(grove.visible()).toBe(false);
  expect(grove.shake({ x: 0, z: 0 }, 0)).toBeNull();
  expect(grove.shake(groveTree, 0).count).toBe(1);
  expect(grove.shake(groveTree, 20).count).toBe(1);
  expect(grove.shake(groveTree, 700).visible).toBe(false);
  expect(grove.shake(groveTree, 1400).visible).toBe(true);
  grove.hide();
  expect(grove.visible()).toBe(false);
  expect(grove.shake(groveTree, 2000).count).toBe(1);
});
test("each of six packs has five cards, a guaranteed rare slot, and real names", () => {
  expect(packs).toHaveLength(6);
  for (const pack of packs) {
    const cards = openPack(pack, () => 0.5);
    expect(cards).toHaveLength(5);
    expect(["Common", "Uncommon"]).not.toContain(cards[4].tier);
    cards.forEach((c) => {
      expect(pack.ids).toContain(c.id);
      expect(c.name).toBeTruthy();
    });
    expect(["Common", "Uncommon"]).not.toContain(
      openPack(pack, () => 0)[4].tier,
    );
  }
});
test("hand sockets scale with each actor and rotate with wakeboard tricks", () => {
  const at = (x, z) => ({ x, y: z });
  for (const look of appearances) {
    const asset = activityAsset(
      look.character,
      look.id,
      "board-trick",
      artwork,
    );
    for (let direction = 0; direction < 8; direction++) {
      const actor = {
        x: 4,
        z: 5,
        height: personHeight(look.character),
        asset,
        direction,
        moving: true,
        time: 100,
        lift: 1,
        bodyLift: 0.16,
      };
      const a = ropeGrip(at, 1, actor, artwork),
        b = ropeGrip(at, 1, { ...actor, spin: Math.PI }, artwork);
      expect(a.x + b.x).toBeCloseTo(8);
      expect(a.y + b.y).toBeCloseTo(8);
      expect(Math.hypot(a.x - 4, a.y - 4)).toBeLessThan(actor.height * 1.5);
    }
  }
});
test("house facades block walking while the rear roof overhang leaves room to pass", () => {
  for (const b of buildings) {
    const { buildingObstacle } = require("./WorldLayout"),
      wall = buildingObstacle(b);
    expect(canStand(b.x, wall.z - wall.d / 2 - 0.6, [wall])).toBe(true);
    expect(canStand(b.x + 2, wall.z, [wall])).toBe(false);
  }
});
test("habitat care uses appropriate food for all five bug groups", () => {
  expect(habitatFood({ category: "Spiders" }).label).toContain("flies");
  expect(habitatFood({ category: "Mantises" }).kind).toBe("flies");
  expect(habitatFood({ category: "Butterflies" }).kind).toBe("nectar");
  expect(habitatFood({ category: "Ladybugs" }).kind).toBe("aphids");
  expect(habitatFood({ category: "Dragonflies" }).kind).toBe("flies");
  expect(habitatFood({ name: "Baby shark" }, true).kind).toBe("bites");
});
