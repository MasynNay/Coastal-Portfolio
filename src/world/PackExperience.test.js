import { packs, openPack, cardArt } from "./CardCatalog";
import {
  collectPack,
  readCardCollection,
  ripOwnedPack,
  revealCard,
  nextCard,
  finishPack,
} from "./CardCollection";
import { tearDistance } from "./TearPack";
import { createNoFace, readGold } from "./NoFace";
import { createPlayground, equipmentPoint, seesawSeat } from "./Playground";
import { townProps, townDecor, mailboxes, buildings } from "./TownLayout";

beforeEach(() => localStorage.clear());
test("every pack gives five distinct Pokémon across thousands of rolls, including shiny and rare variants", () => {
  let seed = 27;
  const random = () =>
    (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  let shiny = 0;
  const found = new Set();
  for (const pack of packs) {
    expect(pack.ids.length).toBeGreaterThan(20);
    for (let i = 0; i < 200; i++) {
      const cards = openPack(pack, random);
      expect(new Set(cards.map((c) => c.id)).size).toBe(5);
      expect(["Rare", "Holo Rare", "Legendary"]).toContain(cards[4].rarity);
      for (const c of cards) {
        expect(pack.ids).toContain(c.id);
        expect(c.name).toBeTruthy();
        found.add(c.id);
        if (c.variant === "Shiny") {
          shiny++;
        }
      }
    }
  }
  expect(cardArt({ id: 25, variant: "Shiny" }, true)).toContain(
    "official-artwork/shiny/",
  );
  expect(shiny).toBeGreaterThan(100);
  expect(found.size).toBe(144);
});
test("dispensed packs persist unopened; one tear consumes one pack and awards exactly five cards", () => {
  expect(ripOwnedPack("kanto")).toBeNull();
  expect(collectPack("kanto")).toBe(true);
  expect(collectPack("kanto")).toBe(true);
  expect(readCardCollection().packs.kanto).toBe(2);
  expect(Object.keys(readCardCollection().cards)).toHaveLength(0);
  const first = ripOwnedPack("kanto", () => 0.5);
  expect(first.cards).toHaveLength(5);
  expect(readCardCollection().packs.kanto).toBe(1);
  expect(ripOwnedPack("kanto")).toBeNull();
  expect(
    Object.values(readCardCollection().cards).reduce(
      (n, c) => n + c.quantity,
      0,
    ),
  ).toBe(5);
  revealCard();
  nextCard();
  expect(readCardCollection().pending.index).toBe(1);
  finishPack();
  expect(readCardCollection().pending).toBeNull();
  ripOwnedPack("kanto", () => 0.5);
  expect(
    Object.values(readCardCollection().cards).reduce(
      (n, c) => n + c.quantity,
      0,
    ),
  ).toBe(10);
  expect(Object.keys(readCardCollection().cards)).toHaveLength(5);
});
test("earlier cards migrate and invalid saved reveal indexes cannot break the album", () => {
  localStorage.setItem(
    "island-card-packs-v1",
    JSON.stringify({
      old: {
        id: 39,
        name: "Jigglypuff",
        rarity: "Common",
        pack: "Kanto Origins",
        quantity: 2,
      },
    }),
  );
  expect(Object.values(readCardCollection().cards)[0]).toMatchObject({
    id: 39,
    quantity: 2,
    variant: "Regular",
  });
  localStorage.setItem(
    "island-card-collection-v2",
    JSON.stringify({
      version: 2,
      cards: {},
      pending: { index: 77, cards: Array(5).fill({ id: 25 }) },
    }),
  );
  expect(readCardCollection().pending).toBeNull();
});
test("tearing needs a cross-seal drag and can continue after a partial tear", () => {
  expect(tearDistance(10, 10, 200)).toBe(0);
  expect(tearDistance(10, 60, 200)).toBeGreaterThan(0.3);
  expect(tearDistance(10, 60, 200, 0.7)).toBe(1);
  expect(tearDistance(180, 0, 200)).toBe(1);
});
test("No-Face's gold is awarded once per completed offering and never by a canceled greeting", () => {
  const gift = createNoFace(),
    origin = { x: 26, z: 12 };
  expect(gift.start(origin, 0)).toBe(true);
  expect(gift.update(2000).reward).toBe(0);
  expect(gift.snapshot(2000).x).toBeGreaterThan(27);
  expect(readGold()).toBe(0);
  expect(gift.update(3300).reward).toBe(5);
  expect(gift.update(3400).reward).toBe(0);
  expect(readGold()).toBe(5);
  expect(gift.update(5400).done).toBe(true);
  expect(gift.stop()).toEqual(origin);
  gift.start(origin, 6000);
  gift.stop();
  expect(readGold()).toBe(5);
});
test("the slide follows its ladder and chute without a second elevation, and seesaw riders face one another", () => {
  const slide = townProps.find((p) => p.id === "playhouse"),
    ride = createPlayground();
  ride.start(slide, { x: 18, z: 0 }, null, 0);
  for (let t = 800; t < 4900; t += 100) {
    const p = ride.snapshot(t).player;
    expect(p.lift).toBe(0);
    expect(p.z).toBeGreaterThanOrEqual(equipmentPoint(slide, 0, 0.5).z - 0.01);
  }
  expect(ride.snapshot(4000).player.stage).toBe("sliding");
  expect(ride.snapshot(4000).player.anchor).toBe("hips");
  const seesaw = townProps.find((p) => p.id === "seesaw"),
    play = createPlayground();
  play.start(seesaw, { x: 18, z: 5 }, { id: "ezra" }, 0);
  const s = play.snapshot(2500);
  expect(s.player.direction).toBe(2);
  expect(s.guest.direction).toBe(6);
  expect(s.player.x).toBeCloseTo(seesawSeat(seesaw, -1, s.tilt).x);
  expect(s.guest.z).toBeCloseTo(seesawSeat(seesaw, 1, s.tilt).z);
});
test("the requested garden placements stay distinct and the unused western bench is gone", () => {
  expect(townProps.some((p) => p.id === "balance-trail")).toBe(false);
  expect(townProps.some((p) => p.id === "roundabout")).toBe(true);
  expect(townDecor.some(([id, x]) => id === "harbor-bench" && x < 0)).toBe(
    false,
  );
  const home = buildings.find((b) => b.id === "skills"),
    box = mailboxes.find((b) => b.home === "skills");
  expect(box.z - home.z).toBeLessThan(4);
});
