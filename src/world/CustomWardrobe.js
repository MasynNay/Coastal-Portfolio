import appearances from "./Appearances.json";
import { outfits } from "./Wardrobe";

export const wardrobeKey = "world-custom-wardrobe";
export const familyIds = appearances
  .filter((look) => look.default)
  .map((look) => look.character);
const item = (name, color, detail = "plain") => ({ name, color, detail });

// These are garment finishes for the illustrated base silhouettes. A single
// palette/scarf/hat choice is applied to every action, not a separate outfit
// PNG for each combination.
export const tops = {
  original: item("Original", null),
  air: item("Air Nomad · saffron", "#e69032", "trim"),
  martial: item("Martial Arts · orange", "#ef7029", "belt"),
  detective: item("Detective · ivory", "#eee9db"),
  hunter: item("Hunter · forest", "#4c9460", "trim"),
  trainer: item("Trainer · cobalt", "#3986b8", "panel"),
  tribute: item("Tribute · charcoal", "#505960"),
  fire: item("Fire Nation · scarlet", "#a53f35", "trim"),
  water: item("Water Tribe · indigo", "#395f9a", "trim"),
  wizard: item("Wizard · ink", "#4e477d", "trim"),
  coast: item("Coastal · teal", "#388f90", "stripe"),
  rose: item("Rose Petal", "#ab657d"),
  gold: item("Sunstone", "#c7a14f"),
  night: item("Night Watch", "#303a50"),
};
export const bottoms = {
  original: item("Original", null),
  denim: item("Blue Denim", "#45658b"),
  charcoal: item("Charcoal", "#42464d"),
  sand: item("Sand Chinos", "#b79a70"),
  olive: item("Olive Utility", "#68724b"),
  orange: item("Martial Arts · orange", "#e8762c", "trim"),
  ruby: item("Crimson", "#a84949"),
  indigo: item("Indigo", "#4a527c"),
  cream: item("Cream", "#dbcfb6"),
  teal: item("Sea Glass", "#438a85"),
  violet: item("Evening Violet", "#80608c"),
};
export const hats = {
  original: "Original / no extra hat",
  trainer: "Trainer Cap",
  beanie: "Knit Beanie",
  band: "Martial Headband",
  scout: "Adventure Cap",
  crown: "Little Gold Crown",
  wizard: "Wizard Hat",
  bucket: "Bucket Hat",
};
export const accessories = {
  none: "None",
  scarf: "Scout Scarf",
  sash: "Martial Arts Sash",
  glasses: "Round Glasses",
  pin: "Golden Mockingjay Pin",
  satchel: "Travel Satchel",
  pendant: "Blue Crystal Pendant",
  ribbon: "Silk Ribbon",
  badge: "Trainer Badge",
};
export const hairColors = {
  original: item("Natural Color", null),
  midnight: item("Midnight", "#313039"),
  chestnut: item("Chestnut", "#7b4a2d"),
  golden: item("Golden", "#c6a15d"),
  auburn: item("Auburn", "#934b36"),
  silver: item("Silver", "#a8aeb8"),
};
export const hairstyles = {
  original: "Original Style",
  swept: "Side-Swept",
  spiky: "Tousled Spikes",
  halfUp: "Half-Up Bun",
  twinBuns: "Double Buns",
  clip: "Side Clip",
  ribbon: "Ribbon Tie",
};
export const stylesFor = (character) =>
  ["mi-shell", "ezra", "fallyn"].includes(character)
    ? ["original", "swept", "halfUp", "twinBuns", "clip", "ribbon"]
    : ["original", "swept", "spiky", "clip"];
export const defaultLook = {
  base: null,
  top: "original",
  bottom: "original",
  hat: "original",
  accessory: "none",
  hair: "original",
  hairColor: "original",
  enabled: true,
};
export const themes = [
  {
    name: "Orange Martial Artist",
    inspiration: "Dragon Ball Z",
    top: "martial",
    bottom: "orange",
    accessory: "sash",
    hair: "spiky",
  },
  {
    name: "Midnight Detective",
    inspiration: "Death Note",
    top: "detective",
    bottom: "denim",
    hairColor: "midnight",
  },
  {
    name: "Green Hunter",
    inspiration: "Hunter × Hunter",
    top: "hunter",
    bottom: "sand",
    accessory: "badge",
  },
  {
    name: "Air Nomad",
    inspiration: "Avatar",
    top: "air",
    bottom: "orange",
    accessory: "sash",
  },
  {
    name: "Fire Nation",
    inspiration: "Avatar",
    top: "fire",
    bottom: "charcoal",
    accessory: "pin",
  },
  {
    name: "Water Tribe",
    inspiration: "Avatar",
    top: "water",
    bottom: "cream",
    accessory: "pendant",
  },
  {
    name: "League Trainer",
    inspiration: "Pokémon",
    top: "trainer",
    bottom: "denim",
    hat: "trainer",
    accessory: "badge",
  },
  {
    name: "Panem Scout",
    inspiration: "Dystopian",
    top: "tribute",
    bottom: "olive",
    accessory: "pin",
  },
  {
    name: "Moonlight Wizard",
    inspiration: "Wizarding world",
    top: "wizard",
    bottom: "charcoal",
    hat: "wizard",
    accessory: "pendant",
  },
  {
    name: "Coastal Adventurer",
    inspiration: "Windfall",
    top: "coast",
    bottom: "sand",
    hat: "scout",
    accessory: "satchel",
  },
  {
    name: "Royal Tide",
    inspiration: "Ocean mythology",
    top: "water",
    bottom: "teal",
    hat: "crown",
    accessory: "pendant",
  },
  {
    name: "Garden Explorer",
    inspiration: "Everyday",
    top: "rose",
    bottom: "cream",
    hat: "bucket",
    accessory: "scarf",
  },
  {
    name: "Earth Kingdom",
    inspiration: "Avatar",
    top: "hunter",
    bottom: "olive",
    hat: "band",
    accessory: "sash",
  },
  {
    name: "Electric Trainer",
    inspiration: "Pokémon",
    top: "gold",
    bottom: "charcoal",
    hat: "beanie",
    accessory: "badge",
  },
  {
    name: "Shadow Student",
    inspiration: "Death Note",
    top: "night",
    bottom: "charcoal",
    hairColor: "midnight",
    accessory: "glasses",
  },
  {
    name: "District Twelve",
    inspiration: "Dystopian",
    top: "tribute",
    bottom: "sand",
    accessory: "satchel",
  },
  {
    name: "Star Voyager",
    inspiration: "Science fiction",
    top: "night",
    bottom: "indigo",
    accessory: "pendant",
  },
  {
    name: "Silver Hunter",
    inspiration: "Hunter × Hunter",
    top: "detective",
    bottom: "violet",
    hairColor: "silver",
  },
];
export function baseOptions(character) {
  return [
    { id: null, name: "Everyday" },
    ...outfits.filter(
      (look) =>
        look.character === character &&
        !["everyday"].includes(look.id) &&
        look.available !== false,
    ),
  ];
}
const valid = (options, value, fallback) =>
  Object.hasOwn(options, value) ? value : fallback;
export function cleanLook(character, value = {}) {
  const look = value && typeof value === "object" ? value : {};
  return {
    base: baseOptions(character).some((entry) => entry.id === look.base)
      ? look.base
      : null,
    top: valid(tops, look.top, "original"),
    bottom: valid(bottoms, look.bottom, "original"),
    hat: valid(hats, look.hat, "original"),
    accessory: valid(accessories, look.accessory, "none"),
    hair: stylesFor(character).includes(look.hair) ? look.hair : "original",
    hairColor: valid(hairColors, look.hairColor, "original"),
    enabled: look.enabled !== false,
  };
}
export function cleanWardrobes(value) {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    familyIds
      .filter((id) => value[id] && typeof value[id] === "object")
      .map((id) => [id, cleanLook(id, value[id])]),
  );
}
export function readWardrobes() {
  try {
    return cleanWardrobes(JSON.parse(localStorage.getItem(wardrobeKey)));
  } catch {
    return {};
  }
}
export function saveWardrobes(value) {
  const cleaned = cleanWardrobes(value);
  try {
    localStorage.setItem(wardrobeKey, JSON.stringify(cleaned));
  } catch {}
  return cleaned;
}
export function presetLook(character, theme) {
  const { name, inspiration, ...choices } = theme;
  const signatureBase = {
    "Air Nomad": "home",
    "League Trainer": "portfolio",
    "Panem Scout": "panem",
    "Moonlight Wizard": "resume",
    "Coastal Adventurer": "lodge",
    "Royal Tide": "contact",
  }[name];
  // Where Masyn already owns a complete illustrated themed costume, start
  // with that drawing instead of recoloring a hoodie to approximate it.
  if (character === "masyn" && signatureBase)
    return cleanLook(character, { ...defaultLook, base: signatureBase });
  return cleanLook(character, { ...defaultLook, ...choices });
}
const sortedLooks = [...appearances].sort(
  (a, b) => b.asset.length - a.asset.length,
);
export function wardrobeOwner(asset) {
  return sortedLooks.find(
    (look) => asset === look.asset || asset?.startsWith(look.asset + "-"),
  )?.character;
}
export function customLookForAsset(asset, looks) {
  const owner = wardrobeOwner(asset);
  const look = looks?.[owner];
  return look?.enabled ? look : null;
}
