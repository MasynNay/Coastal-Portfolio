import { pond } from "./TownLayout";
import { isWater } from "./Surf";
import { movementDirection } from "./animation";
// A bank-crossing oval spends part of each lap on grass and part in the pond.
// It stays clear of the trees beside the pond and is continuous at the waterline.
export function duckRoutine(time, index = 0, flockSize = 3) {
  const angle = time / 6200 + (index * Math.PI * 2) / flockSize;
  const x = pond.x + Math.sin(angle) * pond.rx * 0.65,
    z = pond.z + 1.3 + Math.cos(angle) * pond.rz * 0.85;
  return {
    x,
    z,
    moving: true,
    inWater: isWater(x, z),
    direction: movementDirection(
      Math.cos(angle) * pond.rx * 0.65,
      -Math.sin(angle) * pond.rz * 0.85,
    ),
    time: time * 0.7,
    routineIndex: index,
    flockSize,
  };
}

// The two partners share a lap and keep a body-length of following space.
// Activities use this same function to reconnect each goose without teleporting.
export function gooseRoutine(time, id) {
  const angle = time / 6200 + (id === "white-goose" ? -0.18 : 0.18);
  return {
    x: pond.x + Math.sin(angle) * 3.2,
    z: pond.z + Math.cos(angle) * 3.2,
    direction: movementDirection(Math.cos(angle), -Math.sin(angle)),
    moving: true,
    inWater: true,
    time: time * 0.65,
  };
}

export function waterfowlRoutine(time, member) {
  return member.kind === "goose"
    ? gooseRoutine(time, member.id)
    : duckRoutine(time, member.routineIndex || 0, member.flockSize || 3);
}

// The couple is one interaction target. Background ducks remain scenery;
// either partner leads to the same shared menu and activity identifier.
export function goosePair(flock) {
  const members = flock
    .filter((a) => a.kind === "goose")
    .sort((a, b) => a.name.localeCompare(b.name));
  if (members.length !== 2) return null;
  const name = members.map((a) => a.name).join(" and ");
  return {
    id: "goose-pair",
    type: "duck",
    name,
    members,
    label: `Play with ${name}`,
    x: (members[0].x + members[1].x) / 2,
    z: (members[0].z + members[1].z) / 2,
  };
}
