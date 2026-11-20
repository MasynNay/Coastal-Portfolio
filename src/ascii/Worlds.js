import { aquariumStyles } from "./Aquariums";
import { gameStyles } from "./GameWorlds";
import { galaxyStyles } from "./Galaxies";
import { natureStyles } from "./Nature";
export { aquariumStyles, gameStyles, galaxyStyles, natureStyles };

// Every launch point uses this catalog. Categories own their scene arrays so a
// Pokémon scene cannot accidentally reappear in the aquarium selector.
export const sceneCategories = [
  {
    id: "aquarium",
    title: "Aquariums",
    scenes: aquariumStyles,
    description:
      "18 aquatic habitats. Feed the fish and watch the water come alive.",
    detail: "Freshwater, reefs & ocean life",
    icon: "  o     .\n ><(((o>\n /| /| /|",
  },
  {
    id: "games",
    title: "Game Worlds",
    scenes: gameStyles,
    description: "18 familiar worlds, drawn with colored text.",
    detail: "6 Pokémon · 6 Kingdom Hearts · 6 Zelda",
    icon: "  .--.\n / + o\\\n \\_.._/",
  },
  {
    id: "galaxies",
    title: "Galaxies",
    scenes: galaxyStyles,
    description:
      "18 galaxy studies. Spiral arms, glowing cores, and distant starlight.",
    detail: "Spirals, rings & deep fields",
    icon: " .  . *\n  ~(@)~\n * .  .",
  },
  {
    id: "nature",
    title: "Nature & Nights",
    scenes: natureStyles,
    description: "Quiet gardens and a lantern-lit sky.",
    detail: "Fireflies, a terrarium & lanterns",
    icon: "  * . *\n  /|\\\n _/ | \\_",
  },
];
const actions = {
  meteors: [
    "Meteor Shower",
    "Tap the stars or choose Meteor Shower.",
    "A little meteor shower is crossing the sky.",
  ],
  lanterns: [
    "Release Lanterns",
    "Tap the sky or choose Release Lanterns.",
    "Your lanterns are drifting into the night.",
  ],
  nectar: [
    "Scatter Nectar",
    "Tap the garden or choose Scatter Nectar.",
    "A little nectar for the garden visitors. Watch them gather.",
  ],
  starlight: [
    "Starlight Pulse",
    "Tap a galaxy or choose Starlight Pulse.",
    "A ripple of starlight travels across the galaxy.",
  ],
  thunder: [
    "Make Sparks",
    "Tap the scene or choose Make Sparks.",
    "A little burst of electric sparks!",
  ],
  hearts: [
    "Send Hearts",
    "Tap the scene or choose Send Hearts.",
    "A few hearts drift through the scene.",
  ],
  magic: [
    "Cast Magic",
    "Tap the scene or choose Cast Magic.",
    "A little magic lights up the world.",
  ],
  keyblade: [
    "Raise Keyblades",
    "Tap the scene or choose Raise Keyblades.",
    "The Keyblades catch the light.",
  ],
  fairies: [
    "Summon Fairies",
    "Tap the scene or choose Summon Fairies.",
    "Little forest lights gather nearby.",
  ],
  wind: [
    "Call the Wind",
    "Tap the scene or choose Call the Wind.",
    "A gentle wind sweeps through the scene.",
  ],
};
export function getSceneAction(style) {
  const [label, instruction, success] = actions[style.action] || [
    "Feed Fish",
    "Tap the water to feed, or use Feed Fish.",
    "Dinner is served. Watch the swimmers gather!",
  ];
  return { label, instruction, success };
}
