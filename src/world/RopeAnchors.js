import sockets from "./HandAnchors.json";
import { spriteFrame } from "./animation";

// Return a screen-space hand position using the SAME cell, body scale, root,
// lift and rotation as the visible rider. This works for children and costumes
// without a Masyn-sized fixed-height endpoint floating beside their face.
export function ropeGrip(at, unit, actor, sheets) {
  const sheet = sheets[actor.asset];
  const pose = spriteFrame(sheet, actor.direction, actor.moving, actor.time);
  const index = pose.row * sheet.columns + pose.column;
  const root = sheet.anchors?.[index] ?? sheet.cw / 2;
  const hand = sockets[actor.asset]?.[index] || [
    root + sheet.bodyHeight * 0.2,
    sheet.footY - sheet.bodyHeight * 0.43,
  ];
  const scale = (actor.height * unit) / sheet.bodyHeight;
  const dx = (hand[0] - root) * scale * (pose.flip ? -1 : 1);
  const dy = (hand[1] - sheet.footY) * scale - (actor.bodyLift || 0) * unit;
  const angle = actor.spin || 0;
  const point = at(actor.x, actor.z);
  return {
    x: point.x + dx * Math.cos(angle) - dy * Math.sin(angle),
    y:
      point.y -
      (actor.lift || 0) * unit +
      dx * Math.sin(angle) +
      dy * Math.cos(angle),
  };
}
