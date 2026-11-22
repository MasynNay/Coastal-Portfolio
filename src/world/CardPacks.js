import { useEffect, useRef, useState } from "react";
import "./CardPacks.css";

// Six free, fan-made virtual packs. The collection lives on this device, not a
// paid service. Pack odds and artwork never imply official TCG card ownership.
export const packs = [
  {
    name: "Kanto Origins",
    color: "#cb663d",
    ids: [1, 4, 7, 25, 39, 52, 54, 94, 131, 149],
    type: "Original partners",
  },
  {
    name: "Johto Trails",
    color: "#b38e36",
    ids: [152, 155, 158, 161, 163, 179, 183, 196, 197, 249],
    type: "Forest & moonlight",
  },
  {
    name: "Hoenn Tides",
    color: "#398f9f",
    ids: [252, 255, 258, 270, 280, 302, 333, 350, 359, 384],
    type: "Sea & sky",
  },
  {
    name: "Sinnoh Summit",
    color: "#697eb6",
    ids: [387, 390, 393, 396, 403, 417, 425, 443, 448, 483],
    type: "Mountain explorers",
  },
  {
    name: "Unova City",
    color: "#8e639b",
    ids: [495, 498, 501, 506, 519, 570, 572, 607, 610, 643],
    type: "City adventures",
  },
  {
    name: "Kalos Glow",
    color: "#538e6c",
    ids: [650, 653, 656, 659, 661, 674, 677, 700, 704, 716],
    type: "A little fairy magic",
  },
];
const names = [
  "Bulbasaur",
  "Charmander",
  "Squirtle",
  "Pikachu",
  "Jigglypuff",
  "Meowth",
  "Psyduck",
  "Gengar",
  "Lapras",
  "Dragonite",
  "Chikorita",
  "Cyndaquil",
  "Totodile",
  "Sentret",
  "Hoothoot",
  "Mareep",
  "Marill",
  "Espeon",
  "Umbreon",
  "Lugia",
  "Treecko",
  "Torchic",
  "Mudkip",
  "Lotad",
  "Ralts",
  "Sableye",
  "Swablu",
  "Milotic",
  "Absol",
  "Rayquaza",
  "Turtwig",
  "Chimchar",
  "Piplup",
  "Starly",
  "Shinx",
  "Pachirisu",
  "Drifloon",
  "Gible",
  "Lucario",
  "Dialga",
  "Snivy",
  "Tepig",
  "Oshawott",
  "Lillipup",
  "Pidove",
  "Zorua",
  "Minccino",
  "Litwick",
  "Axew",
  "Reshiram",
  "Chespin",
  "Fennekin",
  "Froakie",
  "Bunnelby",
  "Fletchling",
  "Pancham",
  "Espurr",
  "Sylveon",
  "Goomy",
  "Xerneas",
];
const pokemonNames = Object.fromEntries(
  packs.flatMap((p) => p.ids).map((id, i) => [id, names[i]]),
);
const art = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
export function openPack(pack, random = Math.random) {
  return Array.from({ length: 5 }, (_, index) => {
    const roll = random();
    const rarity =
      index === 4
        ? roll < 0.06
          ? "Legendary"
          : roll < 0.3
            ? "Holo Rare"
            : "Rare"
        : roll < 0.12
          ? "Uncommon"
          : "Common";
    const pool =
      rarity === "Legendary"
        ? pack.ids.slice(-1)
        : rarity === "Holo Rare"
          ? pack.ids.slice(-3)
          : pack.ids.slice(0, 9);
    const id =
      pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
    return { id, name: pokemonNames[id], rarity, pack: pack.name };
  });
}
function readCards() {
  try {
    const data = JSON.parse(localStorage.getItem("island-card-packs-v1"));
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}
export default function CardPacks() {
  const [selected, setSelected] = useState(packs[0]),
    [cards, setCards] = useState([]),
    [index, setIndex] = useState(0),
    [stage, setStage] = useState("choose"),
    [collection, setCollection] = useState(readCards);
  const pointer = useRef(null),
    timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function rip() {
    if (stage !== "sealed") return;
    const next = openPack(selected);
    setCards(next);
    setIndex(0);
    setStage("ripping");
    const saved = { ...collection };
    next.forEach((card) => {
      const key = `${card.id}-${card.rarity}`;
      saved[key] = { ...card, quantity: (saved[key]?.quantity || 0) + 1 };
    });
    setCollection(saved);
    try {
      localStorage.setItem("island-card-packs-v1", JSON.stringify(saved));
    } catch {
      /* A private/full browser still lets the visitor open packs. */
    }
    timer.current = setTimeout(() => setStage("reveal"), 850);
  }
  const card = cards[index];
  return (
    <section className="card-packs" style={{ "--pack-color": selected.color }}>
      <p>
        Pick a pack, tear the seal, and reveal five cards. Free island
        keepsakes, saved on this device.
      </p>
      <div className="card-pack-tabs" aria-label="Choose a pack">
        {packs.map((p) => (
          <button
            key={p.name}
            aria-pressed={selected.name === p.name}
            onClick={() => {
              clearTimeout(timer.current);
              setSelected(p);
              setStage("sealed");
            }}
            style={{ "--pack-color": p.color }}
          >
            <span className="mini-pack">◉</span>
            {p.name}
            <small>{p.type}</small>
          </button>
        ))}
      </div>
      {stage === "choose" && (
        <button className="world-primary" onClick={() => setStage("sealed")}>
          Choose {selected.name}
        </button>
      )}
      {["sealed", "ripping"].includes(stage) && (
        <div
          className={`sealed-pack ${stage === "ripping" ? "is-ripping" : ""}`}
          onPointerDown={(e) => {
            if (e.target.closest("button")) return;
            pointer.current = e.clientX;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerCancel={() => {
            pointer.current = null;
          }}
          onPointerUp={(e) => {
            if (
              pointer.current != null &&
              Math.abs(e.clientX - pointer.current) > 35
            )
              rip();
            pointer.current = null;
          }}
        >
          <span className="pack-seal">TEAR HERE</span>
          <span className="pack-orbit">◉</span>
          <strong>{selected.name}</strong>
          <small>5 island cards</small>
          <button disabled={stage === "ripping"} onClick={rip}>
            Rip Open
          </button>
        </div>
      )}
      {stage === "reveal" && card && (
        <div className="card-reveal">
          <button
            className={`pokemon-island-card rarity-${card.rarity.replaceAll(" ", "-").toLowerCase()}`}
            onClick={() =>
              index < 4 ? setIndex(index + 1) : setStage("summary")
            }
            aria-label={`Reveal next card after ${card.name}`}
            key={index}
          >
            <small>{card.rarity}</small>
            <strong>{card.name}</strong>
            <img
              src={art(card.id)}
              alt={card.name}
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
            />
            <span>{selected.name}</span>
            <small>
              {index + 1} / 5 · Tap to reveal{" "}
              {index === 4 ? "your pack" : "the next card"}
            </small>
          </button>
        </div>
      )}
      {stage === "summary" && (
        <>
          <div className="opened-pack">
            {cards.map((c, i) => (
              <div key={i}>
                <img src={art(c.id)} alt={c.name} />
                <strong>{c.name}</strong>
                <small>{c.rarity}</small>
              </div>
            ))}
          </div>
          <button onClick={() => setStage("sealed")}>Open Another Pack</button>
        </>
      )}
      <details>
        <summary>
          Your Card Album · {Object.keys(collection).length} discoveries
        </summary>
        <div className="card-album">
          {Object.values(collection).map((c) => (
            <div key={`${c.id}-${c.rarity}`}>
              <img src={art(c.id)} alt="" loading="lazy" />
              <strong>
                {c.name} ×{c.quantity}
              </strong>
              <small>{c.rarity}</small>
            </div>
          ))}
        </div>
      </details>
      <small className="activity-note">
        Fan-made mini game · Pokémon character sprites: PokeAPI / Nintendo,
        Creatures, GAME FREAK. No purchases or official cards.
      </small>
    </section>
  );
}
