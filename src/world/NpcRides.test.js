import { createNpcRides } from "./NpcRides";
import { canStand } from "./navigation";
import { obstacles } from "./config";
import { playerPose } from "./PlayerPose";
const visitor = {
  id: "fallyn",
  x: 25,
  z: -5,
  wantsBike: "acro",
  activityId: "first-visit",
  moving: false,
};
test("a resident rides one shared rental, returns to their origin and resumes the paused itinerary", () => {
  const rides = createNpcRides();
  rides.update(0, [visitor], "masyn");
  expect(rides.rider()).toBe("fallyn");
  const mounted = [];
  let finishedAt = null,
    previous = rides.decorate(visitor);
  for (let time = 20; time < 30000; time += 20) {
    rides.update(time, [visitor], "masyn");
    const actor = rides.decorate(visitor);
    expect(canStand(actor.x, actor.z, obstacles)).toBe(true);
    if (actor.bike) mounted.push(actor);
    expect(Math.hypot(actor.x - previous.x, actor.z - previous.z)).toBeLessThan(
      0.23,
    );
    previous = actor;
    if (!rides.active()) {
      finishedAt = time;
      break;
    }
  }
  expect(mounted.length).toBeGreaterThan(0);
  for (const actor of mounted) {
    expect(
      playerPose({
        character: actor.id,
        bikeRide: { id: actor.bike, phase: "riding" },
      }),
    ).toBe("fallyn-bike-acro");
    expect(Math.hypot(actor.x - 26.1, actor.z + 0.3)).toBeGreaterThan(2.7);
  }
  expect(finishedAt).not.toBeNull();
  expect(previous.x).toBe(visitor.x);
  expect(previous.z).toBe(visitor.z);
  expect(rides.actorTime(visitor.id, finishedAt)).toBe(0);
  rides.update(finishedAt + 50, [visitor], "masyn");
  expect(rides.active()).toBe(false);
});
test("player reservations and controlled characters cannot be borrowed; cancellation preserves the clock", () => {
  const rides = createNpcRides();
  rides.update(0, [visitor], "masyn", true);
  expect(rides.active()).toBe(false);
  rides.update(1000, [visitor], "fallyn");
  expect(rides.active()).toBe(false);
  rides.update(1000, [visitor], "masyn");
  expect(rides.active()).toBe(true);
  rides.update(2000, [visitor], "masyn");
  expect(rides.actorTime("fallyn", 2000)).toBe(1000);
  rides.cancel(2000);
  expect(rides.actorTime("fallyn", 2500)).toBe(1500);
  expect(rides.active()).toBe(false);
});

test.each([0, 1000, 3000, 6000])(
  "both rentals can run together with separated riders (second starts at %d ms)",
  (delay) => {
    const rides = createNpcRides();
    const acro = { ...visitor, activityId: "acro-visit" };
    const mach = {
      ...visitor,
      id: "ezra",
      z: 0,
      wantsBike: "mach",
      activityId: "mach-visit",
    };
    let sawBoth = false,
      closest = Infinity;
    for (let time = 0; time < 50000; time += 20) {
      rides.update(time, time >= delay ? [acro, mach] : [acro], "masyn");
      const a = rides.decorate(acro),
        b = rides.decorate(mach);
      if (a.bike && b.bike) {
        sawBoth = true;
        closest = Math.min(closest, Math.hypot(a.x - b.x, a.z - b.z));
      }
    }
    expect(sawBoth).toBe(true);
    expect(closest).toBeGreaterThan(1);
    expect(rides.active()).toBe(false);
  },
);

test("the player reserves only their own bicycle and the other remains available", () => {
  const rides = createNpcRides();
  const other = {
    ...visitor,
    id: "ezra",
    z: 0,
    wantsBike: "mach",
    activityId: "mach-visit",
  };
  rides.update(0, [visitor, other], "masyn", { id: "acro", phase: "riding" });
  expect(rides.active("acro")).toBe(false);
  expect(rides.active("mach")).toBe(true);
  expect(rides.riders()).toEqual(["ezra"]);
  rides.cancel(1000, "fallyn");
  expect(rides.active("mach")).toBe(true);
  rides.cancel(1500, "ezra");
  expect(rides.active()).toBe(false);
});

test.each([
  ["skateboard", "mi-shell"],
  ["surfboard", "ezra"],
  ["boat", "fallyn"],
  ["grove", "masyn"],
])(
  "a real itinerary can take a turn at %s and give it back to the player",
  (id, character) => {
    const {
      residentOutingStops,
      createResidentRoute,
    } = require("./ResidentRoutes");
    const route = createResidentRoute(character, 0, 31);
    expect(route.segments.some((segment) => segment.outing === id)).toBe(true);
    const stop = residentOutingStops[id];
    const resident = {
      ...stop,
      id: "ezra",
      outfit: "spider-ezra",
      wantsOuting: id,
      activityId: id,
    };
    const driver = { id: "fallyn", x: 0, z: 27 };
    const rides = createNpcRides();
    const people = [resident, driver];
    rides.update(0, people, "masyn", null, [id]);
    expect(rides.active(id)).toBe(false);
    rides.update(20, people, "masyn");
    expect(rides.active(id)).toBe(true);
    const initial = rides.pose(id);
    for (let time = 40; time < 2800; time += 20)
      rides.update(time, people, "masyn");
    const pose = rides.pose(id);
    expect(Math.hypot(pose.x - initial.x, pose.z - initial.z)).toBeGreaterThan(
      0.2,
    );
    expect(rides.decorate(resident).outing).toBe(id);
    expect(pose.wakeboarder?.id).toBe(id === "boat" ? "ezra" : undefined);
    expect(pose.driver).toBe(id === "boat" ? "fallyn" : undefined);
    expect(rides.decorate(driver).hidden).toBe(
      id === "boat" ? true : undefined,
    );
    rides.claim(id, 2800);
    expect(rides.pose(id)).toBeNull();
    expect(rides.actorTime(resident.id, 2800)).toBe(20);
    rides.update(2820, people, "masyn");
    expect(rides.active(id)).toBe(false);
  },
);
