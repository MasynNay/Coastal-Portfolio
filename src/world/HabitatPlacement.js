import { residentLayout } from "./CollectionCounts";

// Coordinates are measured against the actual 3:2 habitat paintings.
// Each terrestrial point is the contact surface, not the creature's center.
// The same coordinates work at phone size and in the display room.
const surfaces = {
  terrarium: [
    [50, 38],
    [31, 38],
    [72, 40],
    [80, 76],
    [34, 86],
    [55, 88],
    [18, 29],
    [82, 19],
  ],
  "habitat-mantises": [
    [43, 32],
    [25, 27],
    [59, 41],
    [80, 36],
    [33, 83],
    [55, 86],
    [19, 70],
    [77, 85],
  ],
  "habitat-butterflies": [
    [32, 18],
    [47, 22],
    [23, 48],
    [72, 43],
    [33, 68],
    [55, 87],
    [80, 59],
    [17, 81],
  ],
  "habitat-dragonflies": [
    [26, 42],
    [78, 27],
    [60, 49],
    [88, 46],
    [37, 86],
    [66, 86],
    [18, 60],
    [79, 68],
  ],
  "habitat-ladybugs": [
    [43, 66],
    [61, 68],
    [25, 34],
    [80, 39],
    [32, 80],
    [55, 84],
    [18, 60],
    [77, 75],
  ],
};
const floorResidents =
  /crab|lobster|shrimp|crayfish|snail|seastar|starfish|urchin|clam|scallop|oyster|sea cucumber|corydoras|loach|frog|lizard|salamander|axolotl|newt|pleco|flounder|goby/i;
const floor = [
  [50, 86],
  [30, 82],
  [72, 85],
  [19, 91],
  [41, 94],
  [63, 94],
  [84, 91],
  [54, 77],
];

export function habitatPlacement(
  species,
  quantity,
  home = "terrarium",
  aquatic = false,
) {
  return residentLayout(quantity).map((resident, index) => {
    if (
      aquatic &&
      !floorResidents.test(species.name) &&
      !["Shellfish", "Amphibians"].includes(species.category)
    ) {
      return {
        ...resident,
        placement: "water",
        motion: "swim",
        top: quantity === 1 ? 43 : resident.top + 8,
      };
    }
    const [left, top] = (
      aquatic ? floor : surfaces[home] || surfaces.terrarium
    )[index];
    const category = species.category?.toLowerCase() || "";
    const motion = aquatic
      ? "bottom"
      : category.includes("butterfl") || category.includes("dragonfl")
        ? "perch-flight"
        : category.includes("mantis")
          ? "perch"
          : category.includes("ladybug")
            ? "crawl"
            : "hop";
    return { ...resident, left, top, placement: "surface", motion };
  });
}
