import { outfits } from "./Wardrobe";
import { useState } from "react";
import { Link } from "react-router-dom";
import { characters } from "./config";
import sheets from "./SpriteSheets.json";
import SpritePose from "./SpritePose";
import { characterAbility } from "./Abilities";
import "./sprites.css";
const actions = [
  ["walk", "Walk"],
  ["run", "Run"],
  ["salute", "Three-finger salute"],
  ["fish", "Fish"],
  ["fish-surf", "Fish · axolotl"],
  ["surf", "Surf"],
  ["call", "Call / turn"],
  ["ride", "Fly"],
  ["land", "Land"],
  ["emote", "Expressions"],
  ["ability", "Outfit action"],
  ["water-ride", "Boat / jet ski"],
  ["board-ride", "Skateboard"],
  ["board-trick", "Board trick"],
  ["wake-ride", "Wakeboard"],
  ["bike-acro", "Acro bike"],
  ["bike-mach", "Mach bike"],
];
// The workshop reads the same outfit and ability definitions as the island.
// Adding a costume/action in one place also makes its real artwork inspectable here.
const abilityArt = (person) => {
  const outfit = outfits.find((o) => o.asset === person);
  return characterAbility(outfit?.character || person, outfit?.id)?.asset;
};
const actionArt = (person, action) =>
  action === "walk"
    ? person
    : action === "ability"
      ? abilityArt(person)
      : person + "-" + action;
export default function SpriteStudio() {
  const [person, setPerson] = useState("masyn"),
    [action, setAction] = useState("walk"),
    [direction, setDirection] = useState(0),
    [playing, setPlaying] = useState(true);
  const asset = actionArt(person, action),
    sheet = sheets[asset] || sheets[person];
  const options = [
    ...characters,
    ...outfits.map((o) => ({
      id: o.asset,
      name: o.character === "masyn" ? "Masyn · " + o.name : o.name,
    })),
  ].filter(
    (c, i, all) =>
      sheets[c.id] && all.findIndex((entry) => entry.id === c.id) === i,
  );
  return (
    <main className="sprite-studio">
      <header>
        <Link to="/world">← Back to the village</Link>
        <span>THE SPRITE WORKSHOP</span>
      </header>
      <section className="sprite-studio-main">
        <div>
          <p className="sprite-eyebrow">A LITTLE WORLD. FAMILIAR FACES.</p>
          <h1>
            Every little
            <br />
            step, drawn.
          </h1>
          <p>
            New handheld-style artwork for the whole family. Turn a character,
            play an action, or take a closer look at the sheet.
          </p>
          <label>
            Character
            <select
              value={person}
              onChange={(e) => {
                setPerson(e.target.value);
                setAction("walk");
              }}
            >
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="sprite-action-buttons">
            {actions
              .filter(([id]) => sheets[actionArt(person, id)])
              .map(([id, name]) => (
                <button
                  key={id}
                  aria-pressed={action === id}
                  onClick={() => setAction(id)}
                >
                  {name}
                </button>
              ))}
          </div>
          <label>
            Facing
            <select
              value={direction}
              onChange={(e) => setDirection(Number(e.target.value))}
            >
              {[
                "South",
                "South-east",
                "East",
                "North-east",
                "North",
                "North-west",
                "West",
                "South-west",
              ].map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <button onClick={() => setPlaying(!playing)}>
            {playing ? "Pause animation" : "Play animation"}
          </button>
          <a href={sheet.src} download>
            Download this sprite sheet ↗
          </a>
        </div>
        <div className="sprite-display">
          <SpritePose
            asset={sheet.id}
            direction={direction}
            playing={playing}
            scale={5}
            label={person + " " + action + " preview"}
          />
          <p>
            {actions.find(([id]) => id === action)?.[1]} ·{" "}
            {sheet.rows * (sheet.columns || 4)} poses
          </p>
        </div>
      </section>
      <section className="sprite-family" aria-label="Family sprite lineup">
        {options.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setPerson(c.id);
              setAction("walk");
            }}
          >
            <SpritePose asset={c.id} scale={2} label={c.name} />
            <span>{c.name}</span>
          </button>
        ))}
      </section>
    </main>
  );
}
