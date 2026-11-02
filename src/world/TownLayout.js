import { isBeachLand } from "./Coast";
// Original coastal town plan inspired by a compact harbor city. Rendering and water
// collision share this geometry; no painted shoreline can silently disagree with movement.
// Plot centers are shared by artwork, water collision and the homes placed here.
export const townPlots = {
  center: {
    left: -6.5,
    right: 7,
    top: -9,
    bottom: 5,
  },
  west: {
    left: -28,
    right: -10,
    top: -9,
    bottom: 5,
  },
  southwest: {
    left: -28,
    right: -10,
    top: 9,
    bottom: 17,
  },
  southeast: {
    left: 10.5,
    right: 28,
    top: 9,
    bottom: 17,
  },
  meadow: { left: -6.5, right: 7, top: 9, bottom: 17 },
};
export function plotCenter(id) {
  const p = townPlots[id];
  return {
    x: (p.left + p.right) / 2,
    z: (p.top + p.bottom) / 2,
  };
}
export const pond = {
  ...plotCenter("center"),
  rx: 4.8,
  rz: 3.8,
  bank: 0.5,
};
export const buildings = [
  {
    id: "home",
    title: "About",
    subtitle: "The beginning",
    x: -17,
    z: -18,
  },
  {
    id: "skills",
    title: "Skills",
    subtitle: "The workshop",
    x: 0,
    z: -22,
  },
  {
    id: "portfolio",
    title: "Portfolio",
    subtitle: "The studio",
    x: 17,
    z: -18,
  },
  {
    id: "resume",
    title: "Resume",
    subtitle: "The observatory",
    x: plotCenter("west").x,
    z: -0.8,
  },
  {
    id: "contact",
    title: "Contact",
    subtitle: "The boathouse",
    x: plotCenter("southwest").x,
    z: 12,
  },
  {
    id: "lodge",
    title: "Windfall lodge",
    subtitle: "A little detour",
    x: plotCenter("southeast").x,
    z: 12,
  },
];

export const streets = [
  {
    x: -28,
    z: -13,
    w: 56,
    d: 4,
  },
  {
    x: -10,
    z: -13,
    w: 3.5,
    d: 33,
  },
  {
    x: 7,
    z: -13,
    w: 3.5,
    d: 33,
  },
  {
    x: -28,
    z: 5,
    w: 56,
    d: 4,
  },
  {
    x: -28,
    z: 17,
    w: 56,
    d: 3,
  },
];
// Prop roots sit in garden beds or along the quay. Boat roots are the only
// decorations in water; the central streets and every front door remain clear.
export const townDecor = [
  ["harbor-bench", -12, 18.1, 1.05],
  ["harbor-bench", 12, 18.1, 1.05],
  ["harbor-umbrella", -24, 16.5, 2.2],
  ["harbor-umbrella", 24, 16.5, 2.2],
  ...[-11.6, 11.6].flatMap((x) =>
    [-10, 5.8].map((z) => ["harbor-lamp", x, z, 2.5]),
  ),
  ["harbor-lamp", -5.3, 17.8, 2.5],
  ["harbor-lamp", 5.3, 17.8, 2.5],
  ...[-2.5, 2.5].flatMap((x) =>
    [22, 26, 30].map((z) => ["harbor-bollard", x, z, 0.6]),
  ),
  ["harbor-crates", -1.7, 29, 0.9],
  ["harbor-ring", -2, 24, 0.8],
  ...[-22, -13, 13, 22].map((x) => ["harbor-planter", x, 9.8, 0.85]),
  // Curated irregular clusters create gardens, not a perimeter wall of trees.
  ...[
    [-24, -23],
    [-22, -25.5],
    [-10.8, -25],
    [-7.2, -26.8],
    [7, -27],
    [11.5, -25.8],
    [23, -24.8],
    [25, -22],
    [-25, -5],
    [-25, 1.5],
    [-23, 10],
    [24, 10.5],
  ].map(([x, z], i) => [
    i % 3 === 0 ? "harbor-pine" : "harbor-tree",
    x,
    z,
    3.2 + (i % 4) * 0.18,
  ]),
  ["harbor-palm", -25, 14, 3.5],
  ["harbor-palm", 25, 14, 3.5],
  ["harbor-tree", pond.x - 5.8, pond.z + 3, 2.5],
  ["harbor-tree", pond.x + 5.8, pond.z + 3, 2.5],
  ["harbor-planter", pond.x - 5.8, pond.z - 4.8, 0.85],
  ["harbor-planter", pond.x + 5.8, pond.z - 4.8, 0.85],
];
// Themed objects sit beside each home. These coordinates also provide E prompts
// and small collision footprints, so the artwork cannot drift away from its use.
export const townProps = [
  {
    id: "bonsai",
    x: -23,
    z: -14.8,
    h: 2.2,
  },
  {
    id: "chimes",
    x: -11.7,
    z: -14.9,
    h: 3,
  },
  {
    id: "mushroom",
    x: -5.5,
    z: -17,
    h: 2.2,
  },
  {
    id: "workbench",
    x: 5.3,
    z: -17,
    h: 1.9,
  },
  {
    id: "workstation",
    x: 23,
    z: -14.9,
    h: 2.5,
  },
  {
    id: "telescope",
    x: -25,
    z: 2,
    h: 2.6,
  },
  {
    id: "orrery",
    x: -13,
    z: 2,
    h: 2.2,
  },
  {
    id: "shell-fountain",
    x: -25.5,
    z: 15.3,
    h: 2.5,
  },
  {
    id: "wind-statue",
    x: 11.8,
    z: 15.2,
    h: 2.1,
  },
  {
    id: "windmill",
    x: 26.1,
    z: 15.2,
    h: 2.6,
  },
  {
    id: "playhouse",
    x: 18,
    z: -3.8,
    h: 4.2,
  },
  {
    id: "swings",
    x: 13.2,
    z: 0.3,
    h: 3.1,
  },
  {
    id: "seesaw",
    x: 18.4,
    z: 3.1,
    h: 1.6,
  },
  {
    id: "sandbox",
    x: 23.1,
    z: 1.7,
    h: 1.4,
  },
  { id: "tunnel", x: 13.8, z: -4.7, h: 1.7, w: 2.2, d: 0.8 },
  { id: "climbing-dome", x: 22.7, z: -4.8, h: 2.4, w: 2.6, d: 0.85 },
  { id: "spring-rider", x: 16, z: 1, h: 1.6, w: 0.8, d: 0.65 },
  { id: "picnic-table", x: 21, z: -0.3, h: 2.2, w: 2.2, d: 1 },
];
export const privateStreet = (b) =>
  b.z < -10 ? -11 : b.id === "resume" ? 7 : 18.5;
// Mailboxes stay near the door, but each garden has different furniture.
// Explicit placements leave visible breathing room beside the chimes, terminal,
// star model and rocker rather than repeating one collision-prone offset.
const mailboxOffsets = {
  home: { x: 3.1, z: 4.3 },
  skills: { x: 3.5, z: 7.4 },
  portfolio: { x: 3.3, z: 4.3 },
  resume: { x: 2.8, z: 4.9 },
  contact: { x: 3.3, z: 4.1 },
  lodge: { x: 2.6, z: 4.1 },
};
export const mailboxes = buildings.map((b) => ({
  id: "mail-" + b.id,
  home: b.id,
  x: b.x + mailboxOffsets[b.id].x,
  z: b.z + mailboxOffsets[b.id].z,
  h: 1.65,
  art: "mailbox-" + b.id,
}));

export function isOcean(x, z) {
  const island = x >= -28.5 && x <= 28.5 && z >= -29.5 && z <= 20;
  const pier = Math.abs(x) < 2.7 && z >= 19.7 && z < 32;
  return !(island || pier || isBeachLand(x, z));
}

// Low trunk/seat footprints stop walking through solid scenery without using
// the whole canopy as a wall. Navigation reads these same placed prop roots.
export const townObstacles = [
  ...mailboxes.map((p) => ({
    x: p.x,
    z: p.z - 0.1,
    w: 0.7,
    d: 0.5,
  })),
  ...townProps.map((p) => ({
    x: p.x,
    z: p.z - 0.2,
    w: p.w ?? (p.id === "playhouse" ? 2.5 : p.id === "swings" ? 2.2 : 1.1),
    d: p.d ?? 0.65,
  })),
  ...townDecor
    .filter(([id]) => /tree|pine|palm|bench|planter|crates/.test(id))
    .map(([id, x, z]) => ({
      x,
      z: z - 0.15,
      w: id.includes("bench") ? 2 : 0.65,
      d: 0.45,
    })),
];
