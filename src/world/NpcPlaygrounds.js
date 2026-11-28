import { createPlayground } from "./Playground";
import { townProps } from "./TownLayout";

// Reserve real seats instead of preempting an existing ride. One swing and
// carousel seat remain free for the player; other visitors can share the ride.
export function createNpcPlaygrounds() {
  const visits = new Map();
  return (people, player, character, time = 0) => {
    const taken = new Set(player ? [player.id] : []);
    const poses = [];
    const guests = new Set();
    const slots = new Set(player?.id === "roundabout" ? [0] : []);
    const swingSlots = new Set();
    // Keep existing owners ahead of new arrivals so array order cannot steal
    // an occupied toy at the next frame.
    const ordered = [...people].sort(
      (a, b) =>
        Number(visits.get(b.id)?.allowed === true) -
        Number(visits.get(a.id)?.allowed === true),
    );
    for (const person of ordered) {
      if (
        !person.toy ||
        person.id === character ||
        person.id === player?.partner?.id ||
        guests.has(person.id) ||
        person.hidden ||
        person.room ||
        person.outing ||
        person.bike ||
        person.surfing ||
        person.action
      ) {
        visits.delete(person.id);
        continue;
      }
      let visit = visits.get(person.id);
      if (visit?.activityId !== person.activityId) {
        const prop = townProps.find((p) => p.id === person.toy);
        const session = createPlayground();
        const slot =
          person.toy === "roundabout"
            ? [1, 2, 3].find((n) => !slots.has(n))
            : person.toy === "swings"
              ? swingSlots.has(1)
                ? undefined
                : 1
              : 0;
        const partner =
          person.toy === "seesaw"
            ? people.find(
                (p) =>
                  p.id !== person.id &&
                  p.id !== character &&
                  p.id !== player?.partner?.id &&
                  !guests.has(p.id) &&
                  !p.hidden &&
                  !p.room &&
                  !p.toy &&
                  !p.outing &&
                  !p.bike &&
                  !p.surfing &&
                  !p.action,
              )
            : null;
        const allowed =
          !!prop &&
          (["roundabout", "swings"].includes(person.toy)
            ? slot !== undefined
            : !taken.has(person.toy)) &&
          (person.toy !== "seesaw" || !!partner) &&
          person.activityElapsed < 1000;
        if (allowed)
          session.start(prop, person, partner, 0, { npc: true, slot });
        visit = { activityId: person.activityId, allowed, session };
        visits.set(person.id, visit);
      }
      if (
        !["roundabout", "swings"].includes(person.toy) &&
        taken.has(person.toy)
      )
        visit.allowed = false;
      if (!visit.allowed) continue;
      const pose = visit.session.snapshot(person.activityElapsed, time);
      if (!pose || pose.done) {
        visit.allowed = false;
        continue;
      }
      taken.add(person.toy);
      if (pose.id === "roundabout") slots.add(pose.slot);
      if (pose.id === "swings") swingSlots.add(pose.slot);
      if (pose.partner) guests.add(pose.partner.id);
      poses.push({ ...pose, resident: person });
    }
    return poses;
  };
}
