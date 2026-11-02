import { Book } from "react-bootstrap-icons";
import { useState } from "react";
import HabitatResidents from "./HabitatResidents";
import { totalResidents } from "./CollectionCounts";
import SpritePose from "./SpritePose";
import { artwork } from "./art";
import { fishSpecies } from "./Fish";
import { bugSpecies, terrariumSpecies } from "./Bugs";
import { mailboxLetters } from "./Mailboxes";
import "./activities.css";
const previewScale = (asset, height) =>
  height / (artwork[asset]?.bodyHeight || artwork[asset]?.ch || 64);

// Activity menus call the engine; only the engine moves actors or changes the collection.
export function DogMenu({ dog, onPlay, onClose }) {
  return (
    <div className="world-activity">
      <SpritePose
        asset={dog.id}
        scale={previewScale(dog.id, 92)}
        label={dog.name}
      />
      <p>A little time with {dog.name}?</p>
      <div className="activity-actions">
        <button onClick={() => onPlay("fetch")}>Throw a tennis ball</button>
        <button onClick={() => onPlay("walk")}>Take a Walk</button>
        <button onClick={() => onPlay("pet")}>Give some pets ♥</button>
        <button onClick={onClose}>Exit</button>
      </div>
      <small>Fetch and walks bring you back to this menu.</small>
    </div>
  );
}
export function BugEncounter({ id, onCatch, onClose }) {
  const spider = bugSpecies.find((s) => s.id === id);
  return (
    <div className="world-activity">
      <SpritePose
        asset={spider?.art || "spider"}
        scale={previewScale(spider?.art || "spider", 110)}
        label="A little island bug"
      />
      <span className="collection-rarity" data-rarity={spider?.rarity}>
        {spider?.rarity}
      </span>
      <p>{spider?.description}</p>
      <div className="activity-actions">
        <button onClick={onCatch}>Gently catch {spider?.name}</button>
        <button onClick={onClose}>Leave them exploring</button>
      </div>
    </div>
  );
}
export function Terrariums({ caught, onRelease, onGuide }) {
  const [inspecting, setInspecting] = useState(null),
    [paused, setPaused] = useState(false),
    [selected, setSelected] = useState(null);
  const spiders = terrariumSpecies.filter((s) => !!caught[s.id]);
  const resident = spiders.find((s) => s.id === selected) || spiders[0];
  return (
    <div className="spider-home">
      <p>
        Shake a tree with E to discover three little visitors. Each kind of bug
        has a home of its own. Click a habitat to look closer.
      </p>
      {spiders.some((s) => s.legacy) && (
        <p className="activity-note">
          Your earlier island discoveries are still here. The current field
          guide has 100 species in each bug group.
        </p>
      )}
      {!spiders.length && (
        <div className="spider-empty">
          No residents yet. Walk up to a tree and press E to shake it, then
          approach a fallen bug and press E to catch it.
        </div>
      )}
      {onGuide && <button onClick={onGuide}>Open field guide</button>}
      {!!spiders.length && (
        <div className="collection-picker" aria-label="Choose a terrarium">
          {spiders.map((s) => (
            <button
              key={s.id}
              aria-pressed={resident?.id === s.id}
              onClick={() => {
                setSelected(s.id);
                setInspecting(null);
              }}
            >
              <SpritePose
                asset={s.art}
                scale={1}
                playing={false}
                label={s.name}
              />
              <span>
                {s.name} ×{caught[s.id]}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="habitat-grid">
        {(resident ? [resident] : []).map((s) => (
          <article key={s.id} data-rarity={s.rarity}>
            <button
              className={
                "spider-habitat " +
                (inspecting === s.id ? "is-close " : "") +
                (paused ? "is-paused" : "")
              }
              aria-label={"Inspect " + s.name}
              aria-pressed={inspecting === s.id}
              onClick={() => setInspecting(inspecting === s.id ? null : s.id)}
            >
              <span
                className="habitat-scenery"
                style={{
                  backgroundImage: `url(/world/collections/${s.category && s.category !== "Spiders" ? "habitat-" + s.category.toLowerCase() : "terrarium"}.webp)`,
                }}
              />
              <HabitatResidents
                species={s}
                quantity={caught[s.id]}
                paused={paused}
              />
              <span className="habitat-reflection" />
              <span className="habitat-zoom">
                {inspecting === s.id ? "− Back to habitat" : "+ Look closer"}
              </span>
            </button>
            <h3>{s.name}</h3>
            <span className="collection-rarity" data-rarity={s.rarity}>
              {s.rarity}
            </span>
            <p>
              {s.description} · {caught[s.id]} in this terrarium
            </p>
            {caught[s.id] > 8 && (
              <small>Showing 8 residents · all {caught[s.id]} are saved.</small>
            )}
            <button onClick={() => onRelease(s.id)}>
              Release one to the garden
            </button>
          </article>
        ))}
      </div>
      {!!spiders.length && (
        <button onClick={() => setPaused(!paused)}>
          {paused ? "Let them explore" : "Pause to look closely"}
        </button>
      )}
      <p className="activity-note">Your terrariums are saved on this device.</p>
    </div>
  );
}
export function MailboxMessage({ id, children, onOpen }) {
  const [opened, setOpened] = useState(false);
  const letter = mailboxLetters[id];
  if (!letter) return null;
  return (
    <div className="mailbox-letter">
      <small>ISLAND POST · {id.toUpperCase()}</small>
      <h3>{letter.title}</h3>
      {!opened ? (
        <>
          <p>{letter.teaser}</p>
          {letter.openOnUnseal ? (
            <a
              className="world-primary"
              href={letter.reward.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setOpened(true);
                onOpen();
              }}
            >
              Unseal the letter ✉
            </a>
          ) : (
            <button
              className="world-primary"
              onClick={() => {
                setOpened(true);
                onOpen();
              }}
            >
              Unseal the letter ✉
            </button>
          )}
        </>
      ) : (
        <>
          <p className="letter-joke">{letter.joke}</p>
          {letter.reward && (
            <p>
              <a href={letter.reward.url} target="_blank" rel="noreferrer">
                {letter.reward.label}
              </a>
            </p>
          )}
          {children && (
            <div className="mailbox-bonus">
              <h4>There’s something else in the envelope…</h4>
              {children}
            </div>
          )}
        </>
      )}
    </div>
  );
}
export function Inventory({
  caught,
  onTerrariums,
  fish = {},
  onAquariums,
  onFieldGuide,
}) {
  const ids = Object.keys(caught);
  const rare = ids.filter((id) =>
    ["Rare", "Very rare", "Super rare"].includes(
      terrariumSpecies.find((s) => s.id === id)?.rarity,
    ),
  ).length;
  return (
    <div className="world-inventory">
      <p>A home for the little things you find along the way.</p>
      <button className="inventory-folder" onClick={onFieldGuide}>
        <Book size={56} aria-hidden="true" />
        <span>
          <strong>Island Field Guide</strong>
          <small>
            {bugSpecies.filter((s) => caught[s.id]).length} /{" "}
            {bugSpecies.length} bugs ·{" "}
            {fishSpecies.filter((s) => fish[s.id]).length} /{" "}
            {fishSpecies.length} aquatic species
          </small>
          <small>
            Bugs, spiders and aquatic life · species, rarities and completion.
          </small>
        </span>
        <span aria-hidden="true">→</span>
      </button>
      <button className="inventory-folder" onClick={onAquariums}>
        <SpritePose asset="fish-harbor" scale={2.5} label="Fish collection" />
        <span>
          <strong>Aquariums</strong>
          <small>
            {Object.keys(fish).length} / {fishSpecies.length} types ·{" "}
            {Object.values(fish).reduce((sum, n) => sum + n, 0)} catches
          </small>
          <small>Watch your fish swim and look for rare discoveries.</small>
        </span>
        <span aria-hidden="true">→</span>
      </button>
      <button className="inventory-folder" onClick={onTerrariums}>
        <SpritePose
          asset="spider"
          scale={previewScale("spider", 60)}
          playing={false}
          label="Bug collection"
        />
        <span>
          <strong>Terrariums</strong>
          <small>
            {totalResidents(caught)} residents · {ids.length} types · {rare}{" "}
            rare find
            {rare === 1 ? "" : "s"}
          </small>
          <small>
            Spiders, mantises, butterflies, ladybugs and dragonflies.
          </small>
        </span>
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
export function DuckMenu({ duck, onPlay, onClose }) {
  const birds = duck.members || [{ id: duck.id, art: "duck", name: duck.name }];
  return (
    <div className="world-activity">
      <div className="waterfowl-portraits">
        {birds.map((bird) => (
          <SpritePose
            key={bird.id}
            asset={bird.art || "duck"}
            scale={previewScale(bird.art || "duck", 92)}
            label={bird.name}
          />
        ))}
      </div>
      <p>A little pond-side time with {duck.name}?</p>
      <div className="activity-actions">
        <button onClick={() => onPlay("feed")}>Feed some peas</button>
        <button onClick={() => onPlay("pet")}>Give some pets ♥</button>
        <button onClick={() => onPlay("chase")}>Play chase · 5 seconds</button>
        <button onClick={onClose}>Exit</button>
      </div>
      <small>
        {birds.length > 1
          ? "Feed, pet or chase both geese together. They return to their shared swim afterward."
          : "Feeding and pets return to this menu. After a chase, your duck goes back to exploring."}
      </small>
    </div>
  );
}
