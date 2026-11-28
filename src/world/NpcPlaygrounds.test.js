import { createNpcPlaygrounds } from "./NpcPlaygrounds";
import { createResidentRoute } from "./ResidentRoutes";
import { separateResidents } from "./Roaming";

const actor = (id, toy, activityId = "first") => ({
  id,
  toy,
  activityId,
  activityElapsed: 0,
  x: 13.8,
  z: -3.2,
});

test("different actors can use independent equipment; a new visitor cannot steal a toy", () => {
  const update = createNpcPlaygrounds();
  const ezra = actor("ezra", "trampoline"),
    fallyn = actor("fallyn", "swings");
  expect(
    update([ezra, fallyn], null, "masyn").map((p) => p.resident.id),
  ).toEqual(["ezra", "fallyn"]);
  const fitz = actor("fitzgerald", "trampoline");
  const poses = update(
    [fitz, { ...ezra, activityElapsed: 1500 }, fallyn],
    null,
    "masyn",
  );
  expect(poses.map((p) => p.resident.id)).toEqual(["ezra", "fallyn"]);
  expect(poses[0].player.stage).toBe("bouncing");
  expect(
    update([ezra, fallyn], { id: "trampoline" }, "masyn").map(
      (p) => p.resident.id,
    ),
  ).toEqual(["fallyn"]);
  expect(
    update([ezra, fallyn], null, "masyn").map((p) => p.resident.id),
  ).toEqual(["fallyn"]);
});

test("children have distinct starts and toy orders, not a shared loop", () => {
  const routes = ["ezra", "fallyn", "fitzgerald"].map((id) =>
    createResidentRoute(id, 0, 31),
  );
  expect(
    new Set(routes.map((r) => JSON.stringify(r.segments[0].from))).size,
  ).toBe(3);
  expect(
    new Set(
      routes.map((r) =>
        r.segments
          .filter((s) => s.toy)
          .map((s) => s.toy)
          .join(","),
      ),
    ).size,
  ).toBe(3);
  for (const route of routes)
    expect(
      new Set(route.segments.map((s) => s.toy).filter(Boolean)).size,
    ).toBeGreaterThan(3);
});

test("land residents have breathing room even if two route stops coincide", () => {
  const people = [
    { id: "ezra", x: 0, z: 9 },
    { id: "fallyn", x: 0, z: 9 },
  ];
  const [a, b] = separateResidents(people, "masyn");
  expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(0.8);
});
