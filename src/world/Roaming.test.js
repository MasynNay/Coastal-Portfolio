import { roamingPeople, roamingAnimals } from "./Roaming";
import { characters, animals, obstacles } from "./config";
import { canStand } from "./navigation";
import { isWater } from "./Surf";
import { pond } from "./TownLayout";
import { walkSpeed, npcWalkSpeed } from "./Movement";
// Replay the random house choices that exposed a clipped planter corner.
let homeRandom;
beforeAll(() => {
  let seed = 3;
  homeRandom = jest
    .spyOn(Math, "random")
    .mockImplementation(
      () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646,
    );
  roamingPeople(0);
  homeRandom.mockRestore();
});
test("each family member explores reachable routes, while pond animals stay in water", () => {
  const first = roamingPeople(0);
  for (const c of characters)
    expect(first.some((p) => p.id === c.id)).toBe(true);
  const positions = new Map(characters.map((c) => [c.id, new Set()]));
  for (let time = 0; time < 60000; time += 150) {
    for (const p of roamingPeople(time)) {
      expect(canStand(p.x, p.z, obstacles, false, p.surfing)).toBe(true);
      expect(isWater(p.x, p.z)).toBe(!!p.surfing);
      positions.get(p.id).add(p.x.toFixed(1) + ":" + p.z.toFixed(1));
    }
    for (const a of roamingAnimals(time).filter(
      (a) => a.kind !== "dog" && a.kind !== "land" && a.kind !== "duck",
    ))
      expect(
        ((a.x - pond.x) / pond.rx) ** 2 + ((a.z - pond.z) / pond.rz) ** 2,
      ).toBeLessThan(1);
  }
  positions.forEach((set) => expect(set.size).toBeGreaterThan(30));
  expect(animals.some((a) => a.id === "spider")).toBe(true);
});
test("walking NPCs stay slower than the player, and children spend most of their time in the playground", () => {
  const counts = {
    ezra: 0,
    fallyn: 0,
    fitzgerald: 0,
  };
  let walkingSamples = 0;
  const speeds = [];
  for (let time = 100; time < 60000; time += 100) {
    const first = roamingPeople(time),
      next = roamingPeople(time + 1);
    for (const [i, p] of first.entries()) {
      if (p.moving && next[i].moving) {
        const speed = Math.hypot(next[i].x - p.x, next[i].z - p.z) * 1000;
        speeds.push(speed);
        if (speed > npcWalkSpeed - 0.01) walkingSamples++;
      }
      if (p.id in counts && p.x > 11 && p.z < 5) counts[p.id]++;
    }
  }
  expect(Math.max(...speeds)).toBeLessThanOrEqual(npcWalkSpeed + 0.001);
  expect(walkingSamples).toBeGreaterThan(500);
  Object.values(counts).forEach((count) => expect(count).toBeGreaterThan(350));
});
test("NPCs no longer change facing at every grid step or jump between cruising and rest", () => {
  for (const id of characters.map((c) => c.id)) {
    let changes = 0,
      last;
    for (let time = 0; time < 10000; time += 40) {
      const p = roamingPeople(time).find((p) => p.id === id);
      if (last !== undefined && last !== p.direction) changes++;
      last = p.direction;
    }
    expect(changes).toBeLessThan(16);
  }
  for (let time = 100; time < 30000; time += 100) {
    const a = roamingPeople(time),
      b = roamingPeople(time + 10),
      c = roamingPeople(time + 20);
    a.forEach((p, i) => {
      const vx = (b[i].x - p.x) / 0.01,
        vz = (b[i].z - p.z) / 0.01;
      const nx = (c[i].x - b[i].x) / 0.01,
        nz = (c[i].z - b[i].z) / 0.01;
      expect(Math.hypot(nx - vx, nz - vz)).toBeLessThan(0.31);
    });
  }
});
test("every family routine visits the pond mounted, then returns to normal land walking without teleporting", () => {
  const states = new Map(
    characters.map((c) => [
      c.id,
      {
        water: false,
        returned: false,
      },
    ]),
  );
  let previous = roamingPeople(0);
  for (let time = 0; time < 360000; time += 50) {
    const people = roamingPeople(time);
    for (const [i, p] of people.entries()) {
      const record = states.get(p.id);
      if (p.surfing) record.water = true;
      else if (record.water && p.moving) record.returned = true;
      expect(canStand(p.x, p.z, obstacles, false, p.surfing)).toBe(true);
      expect(isWater(p.x, p.z)).toBe(!!p.surfing);
      expect(
        Math.hypot(p.x - previous[i].x, p.z - previous[i].z),
      ).toBeLessThanOrEqual(walkSpeed * 0.05 + 0.002);
    }
    previous = people;
  }
  for (const state of states.values())
    expect(state).toEqual({
      water: true,
      returned: true,
    });
});
test("NPCs enter two different homes for a short stay and return to visible walking", () => {
  const visits = new Map(characters.map((c) => [c.id, new Set()])),
    previous = new Map();
  let exits = 0;
  for (let time = 0; time < 600000; time += 100) {
    for (const p of roamingPeople(time)) {
      if (p.room) visits.get(p.id).add(p.room);
      if (previous.get(p.id) && !p.room) exits++;
      previous.set(p.id, p.room);
      expect(canStand(p.x, p.z, obstacles, false, p.surfing)).toBe(true);
    }
  }
  for (const set of visits.values()) expect(set.size).toBeGreaterThanOrEqual(2);
  expect(exits).toBeGreaterThan(5);
});

test("varied itineraries cover both waters, fishing, rentals and different parts of town", () => {
  const { createResidentRoute } = require("./ResidentRoutes");
  const { fenceBlocksTravel } = require("./Fence");
  for (const character of characters) {
    const destinations = new Set(),
      activities = new Set();
    for (let variant = 0; variant < 3; variant++) {
      const route = createResidentRoute(character.id, variant, 31);
      expect(route.duration).toBeGreaterThan(60);
      let previous = route.segments[0].from;
      for (const s of route.segments) {
        expect(
          Math.hypot(previous.x - s.from.x, previous.z - s.from.z),
        ).toBeLessThan(0.001);
        expect(fenceBlocksTravel(s.from, s.to)).toBe(false);
        const steps = Math.max(1, Math.ceil((s.length || 0) / 0.2));
        for (let i = 0; i <= steps; i++) {
          const x = s.from.x + ((s.to.x - s.from.x) * i) / steps,
            z = s.from.z + ((s.to.z - s.from.z) * i) / steps;
          if (!s.room && !canStand(x, z, obstacles, false, !!s.water))
            throw new Error(
              `${character.id} ${s.activity} clips scenery at ${x},${z}`,
            );
        }
        if (s.room) destinations.add(s.room);
        activities.add(s.activity);
        previous = s.to;
      }
      expect(
        Math.hypot(
          previous.x - route.segments[0].from.x,
          previous.z - route.segments[0].from.z,
        ),
      ).toBeLessThan(0.001);
      const playing = route.segments
        .filter((s) => s.activity === "playground")
        .reduce((sum, s) => sum + s.seconds, 0);
      const isChild = ["fallyn", "ezra", "fitzgerald"].includes(character.id);
      expect(!isChild || playing / route.duration > 0.5).toBe(true);
    }
    expect(destinations.size).toBeGreaterThanOrEqual(2);
    for (const activity of [
      "pond-surf",
      "ocean-surf",
      "fishing",
      "bikes",
      "visiting",
    ])
      expect(activities.has(activity)).toBe(true);
  }
});
