import { createPlayground } from "./Playground";
import { townProps } from "./TownLayout";

// Give a toy one owner for each visit. A resident who arrives at an occupied
// toy waits out that visit instead of popping into another person's animation.
// The player always has priority when they choose the same attraction.
export function createNpcPlaygrounds() {
  const visits = new Map();
  return (people, player, character) => {
    const taken = new Set(player ? [player.id] : []);
    const poses = [];
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
        const allowed =
          !!prop && !taken.has(person.toy) && person.activityElapsed < 1000;
        if (allowed) session.start(prop, person, null, 0);
        visit = { activityId: person.activityId, allowed, session };
        visits.set(person.id, visit);
      }
      if (taken.has(person.toy)) visit.allowed = false;
      if (!visit.allowed) continue;
      const pose = visit.session.snapshot(person.activityElapsed);
      if (!pose || pose.done) {
        visit.allowed = false;
        continue;
      }
      taken.add(person.toy);
      poses.push({ ...pose, resident: person });
    }
    return poses;
  };
}
