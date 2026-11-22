import { createPlayground, playgroundActivities } from "./Playground";
import { createGroveReveal, groveTree } from "./ForestGrove";
import { packs, openPack } from "./CardPacks";
import { habitatFood } from "./HabitatCare";
import { ropeGrip } from "./RopeAnchors";
import { artwork } from "./art";
import { personHeight } from "./Movement";
import { activityAsset } from "./Wardrobe";
import appearances from "./Appearances.json";
import { buildings, obstacles } from "./config";
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
    expect(cards[4].rarity).toBe("Rare");
    cards.forEach((c) => {
      expect(pack.ids).toContain(c.id);
      expect(c.name).toBeTruthy();
    });
    expect(openPack(pack, () => 0)[4].rarity).toBe("Legendary");
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
test("the back and side roofs of every house block walking", () => {
  for (const b of buildings) {
    expect(canStand(b.x, b.z - 3.5, obstacles)).toBe(false);
    expect(canStand(b.x + 2, b.z - 1.5, obstacles)).toBe(false);
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
