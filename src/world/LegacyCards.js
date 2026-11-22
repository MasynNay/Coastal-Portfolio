// Original island keepsakes remain readable in existing saved albums.
// New packs use the complete trading-card prints in CardCatalog instead.
const rosters = [
  "1:Bulbasaur 2:Ivysaur 3:Venusaur 4:Charmander 5:Charmeleon 6:Charizard 7:Squirtle 8:Wartortle 9:Blastoise 25:Pikachu 26:Raichu 39:Jigglypuff 52:Meowth 54:Psyduck 58:Growlithe 63:Abra 94:Gengar 129:Magikarp 131:Lapras 133:Eevee 143:Snorlax 149:Dragonite 150:Mewtwo 151:Mew",
  "152:Chikorita 153:Bayleef 154:Meganium 155:Cyndaquil 156:Quilava 157:Typhlosion 158:Totodile 159:Croconaw 160:Feraligatr 161:Sentret 163:Hoothoot 172:Pichu 175:Togepi 179:Mareep 181:Ampharos 183:Marill 185:Sudowoodo 196:Espeon 197:Umbreon 200:Misdreavus 212:Scizor 245:Suicune 249:Lugia 250:Ho-Oh",
  "252:Treecko 253:Grovyle 254:Sceptile 255:Torchic 256:Combusken 257:Blaziken 258:Mudkip 259:Marshtomp 260:Swampert 263:Zigzagoon 270:Lotad 280:Ralts 282:Gardevoir 302:Sableye 304:Aron 311:Plusle 312:Minun 330:Flygon 333:Swablu 350:Milotic 359:Absol 373:Salamence 382:Kyogre 384:Rayquaza",
  "387:Turtwig 388:Grotle 389:Torterra 390:Chimchar 391:Monferno 392:Infernape 393:Piplup 394:Prinplup 395:Empoleon 396:Starly 399:Bidoof 403:Shinx 405:Luxray 417:Pachirisu 418:Buizel 425:Drifloon 427:Buneary 443:Gible 445:Garchomp 447:Riolu 448:Lucario 468:Togekiss 483:Dialga 484:Palkia",
  "495:Snivy 496:Servine 497:Serperior 498:Tepig 499:Pignite 500:Emboar 501:Oshawott 502:Dewott 503:Samurott 506:Lillipup 509:Purrloin 519:Pidove 522:Blitzle 527:Woobat 546:Cottonee 548:Petilil 570:Zorua 572:Minccino 607:Litwick 610:Axew 635:Hydreigon 637:Volcarona 643:Reshiram 644:Zekrom",
  "650:Chespin 651:Quilladin 652:Chesnaught 653:Fennekin 654:Braixen 655:Delphox 656:Froakie 657:Frogadier 658:Greninja 659:Bunnelby 661:Fletchling 664:Scatterbug 667:Litleo 669:Flabébé 672:Skiddo 674:Pancham 677:Espurr 679:Honedge 700:Sylveon 704:Goomy 706:Goodra 715:Noivern 716:Xerneas 717:Yveltal",
];
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
