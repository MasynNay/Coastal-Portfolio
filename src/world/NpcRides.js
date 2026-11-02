import { bikes, createBikeRide } from "./Bikes";

// Each physical rental has one reservation, shared with the player. The two
// bicycles can run together; an NPC's ordinary itinerary pauses for their trip.
export function createNpcRides() {
  const rentals = new Map(),
    delays = new Map(),
    attempted = new Map();
  let now = 0;
  function finish(id, time) {
    const ride = rentals.get(id);
    if (!ride) return;
    delays.set(
      ride.rider,
      (delays.get(ride.rider) || 0) + Math.max(0, time - ride.started),
    );
    rentals.delete(id);
  }
  return {
    update(time, people, controlled, playerRide = null) {
      now = time;
      for (const [id, ride] of rentals) {
        if (ride.rider === controlled) {
          ride.tour.cancel();
          finish(id, time);
          continue;
        }
        ride.pose = ride.tour.update(time);
        if (ride.pose?.done) finish(id, time);
      }
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
            person.id !== controlled &&
            person.wantsBike === bike.id &&
            !person.hidden &&
            !person.frog &&
            ![...rentals.values()].some((ride) => ride.rider === person.id) &&
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
    },
    actorTime(id, time) {
      const ride = [...rentals.values()].find((r) => r.rider === id);
      return (
        time -
        (delays.get(id) || 0) -
        (ride ? Math.max(0, now - ride.started) : 0)
      );
    },
    decorate(actor) {
      const ride = [...rentals.values()].find((r) => r.rider === actor.id),
        pose = ride?.pose;
      if (!pose) return actor;
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
    riders: () => [...rentals.values()].map((r) => r.rider),
    rider: () => rentals.values().next().value?.rider || null,
    cancel(time, character) {
      for (const [id, ride] of rentals) {
        if (character && ride.rider !== character) continue;
        ride.tour.cancel();
        finish(id, time);
      }
    },
  };
}
