// Gallery descriptions, colors, residents, and interaction labels.
// Both the terminal menu and scene selector read this single collection.
export const aquariumStyles = [
  {
    id: "river",
    name: "River Garden",
    description:
      "A sunlit freshwater garden. Tetras school through ribbon plants and a little turtle takes the scenic route.",
    water: [9, 29, 38],
    plant: [83, 161, 120],
    accent: [150, 211, 167],
    bed: [101, 130, 109],
    animals: [
      "tetra",
      "tetra",
      "tetra",
      "tetra",
      "goldfish",
      "goldfish",
      "turtle",
    ],
    landscape: "plants",
  },
  {
    id: "reef",
    name: "Coral Cathedral",
    description:
      "Clownfish, striped reef fish, and a sea turtle weave through a garden of branching coral.",
    water: [8, 28, 52],
    plant: [219, 113, 160],
    accent: [128, 220, 216],
    bed: [159, 151, 132],
    animals: [
      "clownfish",
      "clownfish",
      "angelfish",
      "angelfish",
      "tang",
      "turtle",
      "tetra",
    ],
    landscape: "coral",
  },
  {
    id: "moon",
    name: "Moonlit Lagoon",
    description:
      "Lavender jellyfish pulse under moonlight. Silver fish drift past soft, swaying seagrass.",
    water: [12, 17, 42],
    plant: [104, 120, 176],
    accent: [191, 176, 238],
    bed: [92, 104, 139],
    animals: [
      "jelly",
      "jelly",
      "jelly",
      "silver",
      "silver",
      "silver",
      "turtle",
    ],
    landscape: "plants",
  },
  {
    id: "kelp",
    name: "Amber Kelp Forest",
    description:
      "Golden ribbons of kelp, curious seahorses, and warm shoals in the late afternoon light.",
    water: [10, 31, 35],
    plant: [148, 161, 83],
    accent: [230, 190, 112],
    bed: [112, 128, 100],
    animals: [
      "seahorse",
      "seahorse",
      "goldfish",
      "silver",
      "silver",
      "turtle",
      "goldfish",
    ],
    landscape: "kelp",
  },
  {
    id: "deep",
    name: "Midnight Glow",
    description:
      "A deep-sea dream: luminous jellyfish, tiny lantern fish, and bioluminescent coral.",
    water: [5, 12, 29],
    plant: [76, 124, 170],
    accent: [124, 230, 230],
    bed: [66, 80, 115],
    animals: [
      "jelly",
      "jelly",
      "jelly",
      "lantern",
      "lantern",
      "lantern",
      "lantern",
    ],
    landscape: "coral",
  },
  {
    id: "pokemon",
    name: "Pokémon Cove",
    description:
      "Magikarp, Horsea, and Lapras swim through a reef, with their distinctive fins, curled tails, and shells.",
    water: [9, 26, 49],
    plant: [93, 158, 164],
    accent: [153, 213, 246],
    bed: [132, 151, 157],
    animals: ["magikarp", "horsea", "lapras"],
    landscape: "coral",
  },

  {
    id: "koi",
    name: "Koi Courtyard",
    description:
      "White, orange, and gold koi glide under lily pads in a quiet garden pond.",
    water: [12, 31, 35],
    plant: [90, 157, 115],
    accent: [226, 207, 159],
    bed: [106, 129, 116],
    animals: ["koi", "koi", "koi", "turtle"],
    landscape: "pond",
  },
  {
    id: "axolotls",
    name: "Axolotl Hideaway",
    description:
      "Pink, ivory, and golden axolotls paddle past fern-covered stones with their feathery gills on show.",
    water: [13, 27, 43],
    plant: [100, 170, 145],
    accent: [242, 170, 199],
    bed: [116, 133, 151],
    animals: ["axolotl", "axolotl", "axolotl", "tetra", "tetra"],
    landscape: "rocks",
  },
  {
    id: "seahorses",
    name: "Seahorse Meadow",
    description:
      "Golden and coral seahorses curl their tails among tall ribbons of seagrass.",
    water: [10, 36, 42],
    plant: [88, 181, 145],
    accent: [241, 201, 142],
    bed: [133, 152, 127],
    animals: ["seahorse", "seahorse", "seahorse", "seahorse", "silver"],
    landscape: "kelp",
  },
  {
    id: "octopus",
    name: "Octopus Grotto",
    description:
      "Little octopuses wave their arms around a rocky grotto while crabs shuffle below.",
    water: [19, 21, 44],
    plant: [159, 120, 177],
    accent: [244, 164, 155],
    bed: [121, 117, 150],
    animals: ["octopus", "octopus", "crab", "crab", "silver"],
    landscape: "rocks",
  },
  {
    id: "arctic",
    name: "Arctic Blue",
    description:
      "Penguins and a curious seal swim below the ice, alongside a shoal of silver fish.",
    water: [11, 29, 47],
    plant: [119, 170, 197],
    accent: [207, 239, 250],
    bed: [145, 183, 202],
    animals: ["penguin", "penguin", "seal", "silver", "silver"],
    landscape: "ice",
  },
  {
    id: "rays",
    name: "Ray Bay",
    description:
      "Spotted rays flap broad wings over the sand. A small reef shark circles at a distance.",
    water: [10, 32, 49],
    plant: [94, 151, 156],
    accent: [178, 215, 227],
    bed: [170, 161, 132],
    animals: ["ray", "ray", "shark", "tang", "turtle"],
    landscape: "sand",
  },
  {
    id: "mangroves",
    name: "Mangrove Nursery",
    description:
      "Young sharks and striped fish weave between the sheltering roots of a mangrove forest.",
    water: [13, 34, 31],
    plant: [126, 162, 112],
    accent: [191, 204, 153],
    bed: [119, 133, 91],
    animals: ["shark", "shark", "angelfish", "tetra", "tetra"],
    landscape: "mangrove",
  },
  {
    id: "squirtle",
    name: "Squirtle Springs",
    description:
      "Squirtle paddles with its curled tail, Poliwag shows its spiral belly, and Psyduck looks pleasantly puzzled.",
    water: [12, 31, 48],
    plant: [86, 174, 148],
    accent: [185, 224, 240],
    bed: [145, 165, 158],
    animals: ["squirtle", "poliwag", "psyduck"],
    landscape: "pond",
  },
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
    id: "orbit",
    name: "Little Solar System",
    description:
      "A rocket and a curious flying saucer pass colorful planets. Tap to send a meteor shower across the stars.",
    water: [9, 12, 29],
    plant: [115, 137, 204],
    accent: [210, 204, 248],
    bed: [92, 100, 148],
    animals: ["rocket", "ufo", "satellite"],
    landscape: "space",
    action: "meteors",
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

// Shared action wording keeps the canvas instructions, button, and feedback
// accurate when the gallery moves from water to gardens or the night sky.
export function getSceneAction(style) {
  if (style.action === "meteors")
    return {
      label: "Meteor Shower",
      instruction: "Tap the stars or choose Meteor Shower.",
      success: "A little meteor shower is crossing the sky.",
    };
  if (style.action === "lanterns")
    return {
      label: "Release Lanterns",
      instruction: "Tap the sky or choose Release Lanterns.",
      success: "Your lanterns are drifting into the night.",
    };
  if (style.action === "nectar")
    return {
      label: "Scatter Nectar",
      instruction: "Tap the garden or choose Scatter Nectar.",
      success: "A little nectar for the garden visitors. Watch them gather.",
    };
  return {
    label: "Feed Fish",
    instruction: "Tap the water to feed, or use Feed Fish.",
    success: "Dinner is served. Watch the swimmers gather!",
  };
}
