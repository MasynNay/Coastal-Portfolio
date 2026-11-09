import { createSkateRide } from "./SkateRide";
import { createSurfRide, surfboard } from "./SurfRide";
import { createWaterRide } from "./WaterRides";
import { groveDance, grovePlayer, groveStart } from "./ForestGrove";
import { shoreline } from "./Coast";
import { obstacles } from "./config";
import { canStand } from "./navigation";

function boardOuting(tour, actor, start, destination, turnAt, trickAt, goBack) {
  if (!tour.start(actor, start)) return null;
  let outbound = false,
    tricked = false,
    returning = false;
  return {
    update(time, dt) {
      const age = time - start;
      if (!outbound && tour.manual()) outbound = tour.steer(destination);
      if (!tricked && age >= trickAt) tricked = tour.trick(time);
      if (!returning && age >= turnAt) returning = goBack(tour);
      const pose = tour.update(dt, time);
      return pose?.done || age >= 21000
        ? null
        : { ...pose, rider: actor.id, outfit: actor.outfit };
    },
  };
}

export function startResidentOuting(id, actor, time, driver) {
  if (id === "skateboard")
    return boardOuting(
      createSkateRide(),
      actor,
      time,
      { x: 17.5, z: 7 },
      4600,
      2100,
      (tour) => tour.return(),
    );
  if (id === "surfboard")
    return boardOuting(
      createSurfRide((p) => canStand(p.x, p.z, obstacles)),
      actor,
      time,
      { x: 24, z: shoreline(24) + 4 },
      5200,
      2500,
      (tour) => tour.steer(surfboard),
    );
  if (id === "boat") {
    if (!driver) return null;
    const tour = createWaterRide();
    tour.start(id, actor, false, time, driver.id, actor.id);
    return {
      driver: driver.id,
      update(now, dt) {
        const pose = tour.update(dt, now);
        return pose?.done ? null : pose;
      },
    };
  }
  const session = groveStart(actor, actor.direction, time);
  return {
    update(now) {
      const dance = groveDance(time, now);
      if (!dance) return null;
      return {
        ...dance,
        ...grovePlayer(session, dance),
        playerAngle: session.angle,
        moving: dance.walking || dance.returning || dance.elapsed < 650,
        rider: actor.id,
      };
    },
  };
}

export const outingActivities = {
  skateboard: "skateboarding",
  surfboard: "board-surfing",
  boat: "wakeboarding",
  grove: "dancing",
};
