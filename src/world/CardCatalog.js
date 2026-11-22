// Curated, named pools keep packs distinct. Sampling is without replacement:
// five different Pokémon per pack, including one guaranteed rare-or-better.
const rosters = [
  "1:Bulbasaur 2:Ivysaur 3:Venusaur 4:Charmander 5:Charmeleon 6:Charizard 7:Squirtle 8:Wartortle 9:Blastoise 25:Pikachu 26:Raichu 39:Jigglypuff 52:Meowth 54:Psyduck 58:Growlithe 63:Abra 94:Gengar 129:Magikarp 131:Lapras 133:Eevee 143:Snorlax 149:Dragonite 150:Mewtwo 151:Mew",
  "152:Chikorita 153:Bayleef 154:Meganium 155:Cyndaquil 156:Quilava 157:Typhlosion 158:Totodile 159:Croconaw 160:Feraligatr 161:Sentret 163:Hoothoot 172:Pichu 175:Togepi 179:Mareep 181:Ampharos 183:Marill 185:Sudowoodo 196:Espeon 197:Umbreon 200:Misdreavus 212:Scizor 245:Suicune 249:Lugia 250:Ho-Oh",
  "252:Treecko 253:Grovyle 254:Sceptile 255:Torchic 256:Combusken 257:Blaziken 258:Mudkip 259:Marshtomp 260:Swampert 263:Zigzagoon 270:Lotad 280:Ralts 282:Gardevoir 302:Sableye 304:Aron 311:Plusle 312:Minun 330:Flygon 333:Swablu 350:Milotic 359:Absol 373:Salamence 382:Kyogre 384:Rayquaza",
  "387:Turtwig 388:Grotle 389:Torterra 390:Chimchar 391:Monferno 392:Infernape 393:Piplup 394:Prinplup 395:Empoleon 396:Starly 399:Bidoof 403:Shinx 405:Luxray 417:Pachirisu 418:Buizel 425:Drifloon 427:Buneary 443:Gible 445:Garchomp 447:Riolu 448:Lucario 468:Togekiss 483:Dialga 484:Palkia",
  "495:Snivy 496:Servine 497:Serperior 498:Tepig 499:Pignite 500:Emboar 501:Oshawott 502:Dewott 503:Samurott 506:Lillipup 509:Purrloin 519:Pidove 522:Blitzle 527:Woobat 546:Cottonee 548:Petilil 570:Zorua 572:Minccino 607:Litwick 610:Axew 635:Hydreigon 637:Volcarona 643:Reshiram 644:Zekrom",
  "650:Chespin 651:Quilladin 652:Chesnaught 653:Fennekin 654:Braixen 655:Delphox 656:Froakie 657:Frogadier 658:Greninja 659:Bunnelby 661:Fletchling 664:Scatterbug 667:Litleo 669:Flabébé 672:Skiddo 674:Pancham 677:Espurr 679:Honedge 700:Sylveon 704:Goomy 706:Goodra 715:Noivern 716:Xerneas 717:Yveltal",
];
const themes = [
  ["kanto", "Kanto Origins", "#c46342", "Original partners", 25],
  ["johto", "Johto Trails", "#b19140", "Forest & moonlight", 197],
  ["hoenn", "Hoenn Tides", "#398eaa", "Sea & sky", 384],
  ["sinnoh", "Sinnoh Summit", "#6c84b9", "Mountain explorers", 448],
  ["unova", "Unova City", "#9869ab", "City adventures", 570],
  ["kalos", "Kalos Glow", "#538f74", "A little fairy magic", 700],
];
export const packs = themes.map(([id, name, color, type, mascot], i) => ({
  id,
  name,
  color,
  type,
  mascot,
  ids: rosters[i].split(" ").map((s) => Number(s.split(":")[0])),
}));
export const pokemonNames = Object.fromEntries(
  rosters
    .flatMap((s) => s.split(" "))
    .map((s) => {
      const [id, name] = s.split(":");
      return [id, name];
    }),
);
export const cardArt = (card, detail = false) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${detail ? "other/official-artwork/" : ""}${card.variant === "Shiny" ? "shiny/" : ""}${card.id}.png`;
const index = (length, random) =>
  Math.min(length - 1, Math.max(0, Math.floor(random() * length)));
export function openPack(pack, random = Math.random) {
  const roll = random(),
    rarity = roll < 0.05 ? "Legendary" : roll < 0.3 ? "Holo Rare" : "Rare";
  const rarePool =
    rarity === "Legendary"
      ? pack.ids.slice(-2)
      : rarity === "Holo Rare"
        ? pack.ids.slice(-7)
        : pack.ids.slice(12, -2);
  const rareId = rarePool[index(rarePool.length, random)],
    used = new Set([rareId]);
  const cards = Array.from({ length: 4 }, () => {
    const pool = pack.ids.slice(0, -2).filter((id) => !used.has(id));
    const id = pool[index(pool.length, random)];
    used.add(id);
    return {
      id,
      name: pokemonNames[id],
      rarity: random() < 0.22 ? "Uncommon" : "Common",
    };
  });
  cards.push({ id: rareId, name: pokemonNames[rareId], rarity });
  return cards.map((c) => ({
    ...c,
    pack: pack.name,
    setId: pack.id,
    variant: random() < 0.06 ? "Shiny" : "Regular",
  }));
}
