// A small, separate collection of animated storybook tributes. These are text
// illustrations, not games or aquarium residents; each has its own scenery.
const worlds = [
  [
    "forest-spirits",
    "Forest Spirits",
    "totoro-garden",
    ["totoro"],
    "A friendly forest spirit waits under an umbrella of leaves. Call a little rain and watch the fireflies glow.",
    "rain",
    [12, 30, 29],
    [118, 185, 131],
  ],
  [
    "lantern-bridge",
    "The Lantern Bridge",
    "bathhouse",
    ["no-face"],
    "No-Face drifts beside a lantern-lit bathhouse. Send warm lanterns up through the evening mist.",
    "lanterns",
    [24, 20, 39],
    [239, 166, 119],
  ],
  [
    "air-temple",
    "Above the Air Temple",
    "air-temple",
    ["airbender"],
    "An arrow-marked airbender rests beside his staff above the clouds. Call the wind to trace a little air spiral.",
    "wind",
    [16, 32, 46],
    [174, 220, 229],
  ],
  [
    "shire-hill",
    "A Hill in the Shire",
    "shire",
    ["hobbit"],
    "A round green door, a garden path, and an unhurried hobbit. Let a few butterflies visit the garden.",
    "butterflies",
    [17, 34, 27],
    [237, 209, 134],
  ],
];
export const storyStyles = worlds.map(
  ([id, name, setting, animals, description, action, water, accent]) => ({
    id,
    name,
    setting,
    animals,
    description,
    action,
    water,
    accent,
    category: "games",
    landscape: "game",
    plant: [110, 178, 128],
    bed: [99, 130, 113],
    positions: [[0.5, 0.56]],
  }),
);

// Fourteen additional landmark/creature vignettes complete this collection.
const landmarks = [
  [
    "moving-castle",
    "The Moving Castle",
    "A many-towered castle walks on its mechanical legs while steam curls from the chimney.",
    "magic",
  ],
  [
    "delivery-cat",
    "The Delivery Cat",
    "A watchful black cat follows a passing broom through the evening sky.",
    "wind",
  ],
  [
    "ponyo-shore",
    "Ponyo’s Shore",
    "A red-haired fish friend bobs through a shallow, rippling sea.",
    "hearts",
  ],
  [
    "catbus",
    "The Night Bus",
    "Bright windows, a smiling cat face, and a row of little running feet.",
    "wind",
  ],
  [
    "spirit-train",
    "The Water Train",
    "A lantern-lit train glides over the quiet water at dusk.",
    "lanterns",
  ],
  [
    "soot-workshop",
    "The Soot Workshop",
    "Small starry-eyed soot visitors hop among colorful sugar stars.",
    "magic",
  ],
  [
    "earth-garden",
    "Earth Kingdom Garden",
    "Five stones rise in a patient circle above a garden terrace.",
    "magic",
  ],
  [
    "water-tribe",
    "Water Tribe Moon",
    "Ice domes and moonlit water shimmer in a polar village.",
    "wind",
  ],
  [
    "fire-lanterns",
    "Fire Nation Lanterns",
    "Warm lanterns sway above tiered rooftops in a red evening sky.",
    "lanterns",
  ],
  [
    "sky-bison",
    "The Sky Bison",
    "A gentle six-legged bison drifts past ribbons of cloud.",
    "wind",
  ],
  [
    "rivendell",
    "Rivendell Falls",
    "Slender towers and an arched bridge frame a silver waterfall.",
    "butterflies",
  ],
  [
    "moria",
    "The Moonlit Gate",
    "A pale tree and starry arch glow on the quiet doors beneath the mountain.",
    "starlight",
  ],
  [
    "ent-garden",
    "The Ent Garden",
    "An old, bright-eyed tree stretches its branch arms and slow roots.",
    "rain",
  ],
  [
    "lonely-mountain",
    "The Lonely Mountain",
    "A small dragon circles a snow-tipped mountain and its dark treasure cave.",
    "magic",
  ],
];
storyStyles.push(
  ...landmarks.map(([form, name, description, action], i) => ({
    id: form,
    name,
    description,
    action,
    form,
    category: "games",
    landscape: "game",
    animals: [],
    water:
      i % 3 === 0 ? [20, 27, 40] : i % 3 === 1 ? [15, 30, 33] : [29, 24, 39],
    plant:
      i % 3 === 0
        ? [120, 160, 149]
        : i % 3 === 1
          ? [115, 176, 158]
          : [164, 137, 166],
    accent:
      i % 3 === 0
        ? [239, 209, 151]
        : i % 3 === 1
          ? [188, 227, 213]
          : [246, 185, 145],
    bed: [105, 120, 136],
  })),
);
