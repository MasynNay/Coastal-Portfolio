// Preserve the original gardens and lanterns as quiet nature scenes.
export const natureStyles = [
  {
    id: "fireflies",
    name: "Firefly Meadow",
    description:
      "Fireflies blink above wildflowers as butterflies drift through the evening air. Scatter nectar to bring them closer.",
    water: [17, 24, 36],
    plant: [107, 164, 115],
    accent: [232, 226, 150],
    bed: [85, 118, 92],
    animals: [
      "butterfly",
      "butterfly",
      "butterfly",
      "firefly",
      "firefly",
      "firefly",
      "firefly",
    ],
    landscape: "meadow",
    action: "nectar",
  },
  {
    id: "rainforest",
    name: "Rainforest Terrarium",
    description:
      "Bright frogs rest on mossy branches while butterflies flutter among the ferns.",
    water: [12, 28, 29],
    plant: [86, 172, 122],
    accent: [183, 225, 151],
    bed: [100, 126, 92],
    animals: ["frog", "frog", "butterfly", "butterfly", "firefly"],
    landscape: "terrarium",
    action: "nectar",
  },
  {
    id: "lanterns",
    name: "Lantern Festival",
    description:
      "Paper lanterns drift past the moon above layered mountain silhouettes. Tap to release more into the night.",
    water: [23, 17, 36],
    plant: [99, 104, 151],
    accent: [255, 200, 120],
    bed: [72, 77, 118],
    animals: [
      "sky-lantern",
      "sky-lantern",
      "sky-lantern",
      "sky-lantern",
      "sky-lantern",
    ],
    landscape: "sky",
    action: "lanterns",
  },
];
