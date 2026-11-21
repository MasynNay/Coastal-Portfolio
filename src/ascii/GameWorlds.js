// Six scenes per series. Each scene has a setting, cast and interaction rather
// than using a renamed aquarium. All artwork is rendered as colored text.
const palettes = {
  pokemon: {
    water: [12, 27, 39],
    plant: [98, 173, 125],
    accent: [245, 211, 139],
    bed: [101, 137, 111],
  },
  kingdom: {
    water: [16, 19, 39],
    plant: [136, 145, 185],
    accent: [237, 198, 143],
    bed: [93, 105, 144],
  },
  zelda: {
    water: [10, 29, 34],
    plant: [100, 173, 125],
    accent: [214, 218, 149],
    bed: [108, 141, 118],
  },
};
const scenes = [
  [
    "pokemon-cove",
    "Pokémon Cove",
    "Pokémon",
    "pokemon",
    "cove",
    ["magikarp", "horsea", "lapras"],
    "Magikarp, Horsea, and Lapras explore a sheltered reef.",
    "feed",
  ],
  [
    "squirtle-springs",
    "Squirtle Springs",
    "Pokémon",
    "pokemon",
    "springs",
    ["squirtle", "poliwag", "psyduck"],
    "Squirtle paddles past lily pads while Poliwag and Psyduck enjoy the springs.",
    "feed",
  ],
  [
    "pikachu-grove",
    "Pikachu Grove",
    "Pokémon",
    "pokemon",
    "grove",
    ["pikachu", "pikachu"],
    "Long black-tipped ears, red cheeks, and little sparks in a leafy grove.",
    "thunder",
  ],
  [
    "eevee-glade",
    "Eevee Glade",
    "Pokémon",
    "pokemon",
    "glade",
    ["eevee", "eevee"],
    "Fluffy cream collars and bushy tails among woodland flowers.",
    "hearts",
  ],
  [
    "gengar-tower",
    "Gengar’s Moonlit Tower",
    "Pokémon",
    "pokemon",
    "haunted",
    ["gengar", "gengar"],
    "Gengar’s red eyes and broad grin catch the moonlight beside a crooked tower.",
    "magic",
  ],
  [
    "dragonite-clouds",
    "Dragonite Above the Clouds",
    "Pokémon",
    "pokemon",
    "clouds",
    ["dragonite", "dragonite"],
    "Dragonite flaps its small green wings over a soft sea of clouds.",
    "wind",
  ],
  [
    "destiny-islands",
    "Destiny Islands",
    "Kingdom Hearts",
    "kingdom",
    "islands",
    ["sora", "kairi"],
    "Sora and Kairi meet under the palms beside a small wooden pier.",
    "hearts",
  ],
  [
    "traverse-town",
    "Traverse Town",
    "Kingdom Hearts",
    "kingdom",
    "town",
    ["sora", "donald", "goofy"],
    "Warm lamps, crooked rooftops, and Sora’s familiar traveling companions.",
    "magic",
  ],
  [
    "twilight-town",
    "Twilight Town",
    "Kingdom Hearts",
    "kingdom",
    "clocktower",
    ["roxas", "sora"],
    "Roxas and Sora share a sunset beneath the clock tower.",
    "hearts",
  ],
  [
    "hollow-bastion",
    "Hollow Bastion",
    "Kingdom Hearts",
    "kingdom",
    "bastion",
    ["sora", "shadow"],
    "A Keyblade shines below floating castle spires as a Heartless peeks nearby.",
    "keyblade",
  ],
  [
    "halloween-town",
    "Halloween Town",
    "Kingdom Hearts",
    "kingdom",
    "pumpkins",
    ["sora", "jack"],
    "Sora and Jack stand among carved pumpkins beneath a curled hill.",
    "magic",
  ],
  [
    "keyblade-graveyard",
    "Keyblade Graveyard",
    "Kingdom Hearts",
    "kingdom",
    "keys",
    ["sora", "roxas"],
    "Rows of weathered keys rise from a quiet, wind-swept landscape.",
    "keyblade",
  ],
  [
    "hyrule-field",
    "Hyrule Field",
    "Zelda",
    "zelda",
    "field",
    ["link", "fairy"],
    "Link wears his long green cap and carries the Hylian shield and a silver sword, with Navi nearby.",
    "fairies",
  ],
  [
    "kokiri-forest",
    "Kokiri Forest",
    "Zelda",
    "zelda",
    "forest",
    ["link", "fairy"],
    "Tree houses, thick roots, and a small fairy glowing between the leaves.",
    "fairies",
  ],
  [
    "windfall-harbor",
    "Windfall Harbor",
    "Zelda",
    "zelda",
    "harbor",
    ["toon-link"],
    "Toon Link conducts the harbor breeze with the Wind Waker, beside the King of Red Lions.",
    "wind",
  ],
  [
    "temple-time",
    "Temple of Time",
    "Zelda",
    "zelda",
    "temple",
    ["link", "fairy"],
    "Sunlight falls through tall arches onto a sword resting in its pedestal.",
    "magic",
  ],
  [
    "zora-domain",
    "Zora’s Domain",
    "Zelda",
    "zelda",
    "waterfalls",
    ["link", "zora"],
    "Blue waterfalls frame a silver-finned Zora and a visiting adventurer.",
    "wind",
  ],
  [
    "lost-woods",
    "Lost Woods",
    "Zelda",
    "zelda",
    "woods",
    ["link", "skull-kid"],
    "Deep trees, a mischievous little musician, and drifting forest lights.",
    "fairies",
  ],
];
export const gameStyles = scenes.map(
  ([id, name, series, palette, setting, originalCast, description, action]) => {
    // A single large Pokémon portrait reads clearly; companions have deliberate
    // secondary positions instead of two identical, cramped figure copies.
    const animals =
      series === "Pokémon" && !["cove", "springs"].includes(setting)
        ? [originalCast[0]]
        : originalCast;
    const positions = ["cove", "springs"].includes(setting)
      ? undefined
      : setting === "harbor"
        ? [[0.3, 0.56]]
        : animals[1] === "fairy"
          ? [
              [0.4, 0.56],
              [0.81, 0.3],
            ]
          : animals.length === 3
            ? [
                [0.5, 0.56],
                [0.16, 0.69],
                [0.84, 0.66],
              ]
            : animals.length === 2
              ? [
                  [0.32, 0.56],
                  [0.78, 0.62],
                ]
              : [[0.5, 0.56]];
    return {
      id,
      name,
      series,
      setting,
      animals,
      description,
      action,
      positions,
      category: "games",
      landscape:
        setting === "cove" ? "coral" : setting === "springs" ? "pond" : "game",
      ...palettes[palette],
    };
  },
);
