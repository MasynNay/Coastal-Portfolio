import { restObstacles } from "./RestSpots";
import { bugSpecies } from "./Bugs";
import { fenceObstacles } from "./Fence";
import { pond, townObstacles, buildings } from "./TownLayout";
import { doorOffset } from "./WorldLayout";
import appearances from "./Appearances.json";
// World coordinates are independent of screen size. Each building maps to shared site content.
export { buildings } from "./TownLayout";
export const characters = appearances
  .filter((o) => o.default)
  .map((o) => ({ id: o.character, name: o.name }));
export const residents = [
  {
    id: "masyn",
    x: 0,
    z: 9,
  },
  {
    id: "mi-shell",
    x: -4,
    z: 10.5,
  },
  {
    id: "ezra",
    x: 6,
    z: -8,
  },
  {
    id: "fallyn",
    x: -8,
    z: 8,
  },
  {
    id: "fitzgerald",
    x: 4,
    z: 10,
  },
];
export const animals = [
  {
    id: "white-goose",
    name: "Lenore Dove",
    mate: "canada-goose",
    art: "goose-white",
    kind: "goose",
    ambient: true,
    x: pond.x - 1.8,
    z: pond.z - 2.9,
  },
  {
    id: "canada-goose",
    name: "Haymitch",
    mate: "white-goose",
    art: "goose-canada",
    kind: "goose",
    ambient: true,
    x: pond.x + 1.8,
    z: pond.z - 2.9,
  },
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `wild-duck-${i}`,
    name: i < 3 ? "Wild mallard" : "Cinnamon teal",
    art: i < 3 ? "mallard" : "teal-duck",
    kind: "duck",
    ambient: true,
    x: 0,
    z: 0,
  })),
  ...bugSpecies
    .filter((s) => s.chance)
    .map((s) => ({
      ...s,
      kind: "land",
    })),
  {
    id: "spider",
    name: "Jumping spider",
    art: "spider",
    x: 9,
    z: 8,
    kind: "land",
  },
  {
    id: "spider-fern",
    name: "Garden jumping spider",
    art: "spider-fern",
    x: -12,
    z: -8,
    kind: "land",
  },
  {
    id: "spider-coast",
    name: "Seaside jumping spider",
    art: "spider-coast",
    x: 1,
    z: 13,
    kind: "land",
  },
  {
    id: "axolotl",
    name: "Axolotl",
    art: "axolotl",
    x: -3,
    z: 0,
    kind: "pond",
  },
  {
    id: "axolotl-blue",
    name: "Blue axolotl",
    art: "axolotl-blue",
    x: 1,
    z: 2,
    kind: "pond",
  },
  {
    id: "fish",
    name: "Fish",
    art: "fish",
    x: 0,
    z: 3,
    kind: "pond",
  },
  {
    id: "koi",
    name: "Koi",
    art: "koi",
    x: 2,
    z: -2,
    kind: "pond",
  },
  {
    id: "rosie",
    name: "Rosie",
    x: 6,
    z: 6,
    kind: "dog",
  },
  {
    id: "millie",
    name: "Millie",
    x: -8,
    z: 6,
    kind: "dog",
  },
  {
    id: "abby",
    name: "Abby",
    x: -20,
    z: -10,
    kind: "duck",
  },
  {
    id: "hulk",
    name: "Hulk",
    x: -23,
    z: -8,
    kind: "duck",
  },
  {
    id: "bolt",
    name: "Bolt",
    x: -25,
    z: -10,
    kind: "duck",
  },
];
export const obstacles = [
  ...restObstacles,
  ...fenceObstacles,
  ...townObstacles,
  ...buildings.map((b) => ({
    x: b.x,
    z: b.z,
    w: 8,
    d: 6.2,
    door: {
      back: doorOffset(b) - 1,
      width: 1.7,
    },
  })),
  {
    x: pond.x,
    z: pond.z,
    rx: pond.rx + pond.bank,
    rz: pond.rz + pond.bank,
    water: true,
  },
];

// Interior furniture has its own collision set; informational desks remain approachable from the front.
export const roomObstacles = [
  {
    x: 0,
    z: -5.2,
    w: 4.8,
    d: 1.5,
  },
];
