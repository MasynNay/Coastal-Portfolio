import { bikes, createBikeRide } from "./Bikes";
import { residentOutingStops } from "./ResidentRoutes";
import { outingActivities, startResidentOuting } from "./ResidentOutings";

// Each physical rental has one reservation, shared with the player. The two
// bicycles can run together; an NPC's ordinary itinerary pauses for their trip.
export function createNpcRides() {
  const rentals = new Map(),
    delays = new Map(),
    attempted = new Map();
  let now = 0;
  const uses = (ride, id) => ride.rider === id || ride.driver === id;
  const current = (id) => [...rentals.values()].find((ride) => uses(ride, id));
  function finish(id, time) {
    const ride = rentals.get(id);
    if (!ride) return;
    for (const person of [ride.rider, ride.driver].filter(Boolean))
      delays.set(
        person,
        (delays.get(person) || 0) + Math.max(0, time - ride.started),
      );
    rentals.delete(id);
  }
  return {
    update(time, people, controlled, playerRide = null, reserved = []) {
      const dt = Math.max(0, time - now) / 1000;
      now = time;
      for (const [id, ride] of rentals) {
        if (uses(ride, controlled) || reserved.includes(id)) {
          ride.tour.cancel?.();
          finish(id, time);
          continue;
        }
        ride.pose = ride.tour.update(time, dt);
        if (!ride.pose || ride.pose.done) finish(id, time);
      }
      const available = (person) =>
        person.id !== controlled &&
        !person.hidden &&
        !person.frog &&
        !person.trick &&
        !person.room &&
        !person.surfing &&
        !current(person.id);
      // A legacy true reservation means both bikes; the engine supplies the
      // actual player bike so the other rental remains available to residents.
      for (const bike of bikes) {
        if (
          rentals.has(bike.id) ||
          playerRide === true ||
          playerRide?.id === bike.id
        )
          continue;
        const candidate = people.find(
          (person) =>
            available(person) &&
            person.wantsBike === bike.id &&
            attempted.get(person.id) !== person.activityId &&
            Math.hypot(person.x - bike.x, person.z - bike.z) < 2.3,
        );
        if (!candidate) continue;
        const tour = createBikeRide();
        if (!tour.start(bike.id, candidate, time)) continue;
        attempted.set(candidate.id, candidate.activityId);
        rentals.set(bike.id, {
          tour,
          rider: candidate.id,
          started: time,
          pose: tour.snapshot(),
        });
      }
      for (const [id, stop] of Object.entries(residentOutingStops)) {
        if (rentals.has(id) || reserved.includes(id)) continue;
        const actor = people.find(
          (person) =>
            available(person) &&
            person.wantsOuting === id &&
            attempted.get(person.id) !== person.activityId &&
            Math.hypot(person.x - stop.x, person.z - stop.z) < 0.4,
        );
        if (!actor) continue;
        const driver =
          id === "boat" &&
          people.find((person) => person.id !== actor.id && available(person));
        const tour = startResidentOuting(id, actor, time, driver);
        if (!tour) continue;
        attempted.set(actor.id, actor.activityId);
        rentals.set(id, {
          tour,
          rider: actor.id,
          driver: tour.driver,
          outing: id,
          started: time,
          pose: tour.update(time, 0),
        });
      }
    },
    actorTime(id, time) {
      const ride = current(id);
      return (
        time -
        (delays.get(id) || 0) -
        (ride ? Math.max(0, now - ride.started) : 0)
      );
    },
    decorate(actor) {
      const ride = current(actor.id),
        pose = ride?.pose;
      if (!pose) return actor;
      if (ride.outing) {
        const grove = ride.outing === "grove";
        return {
          ...actor,
          ...(grove ? { ...pose, time: pose.elapsed } : { hidden: true }),
          activity:
            ride.driver === actor.id
              ? "driving the boat"
              : outingActivities[ride.outing],
          outing: ride.outing,
          action: null,
          fishingTarget: null,
        };
      }
      return {
        ...actor,
        x: pose.x,
        z: pose.z,
        direction: pose.direction,
        moving: pose.moving,
        time: pose.time,
        bike: pose.phase === "riding" ? pose.id : null,
        activity: "cycling",
        surfing: false,
        action: null,
        fishingTarget: null,
        wantsBike: null,
      };
    },
    active: (id) => (id ? rentals.has(id) : rentals.size > 0),
    pose: (id) => rentals.get(id)?.pose || null,
    claim(id, time) {
      rentals.get(id)?.tour.cancel?.();
      finish(id, time);
    },
    riders: () => [...rentals.values()].map((r) => r.rider),
    rider: () => rentals.values().next().value?.rider || null,
    cancel(time, character) {
      for (const [id, ride] of rentals) {
        if (character && !uses(ride, character)) continue;
        ride.tour.cancel?.();
        finish(id, time);
      }
    },
  };
}
