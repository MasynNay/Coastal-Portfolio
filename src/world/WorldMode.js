import { playWindSong } from "./WindStatue";
import IslandGames from "./games/IslandGames";
import { gameTitles } from "./games/GameLocations";
import IslandJournal, { islandSecrets } from "./IslandJournal";
import { readShells } from "./Shells";
import BrandMark from "../components/BrandMark";
import AxolotlGame from "./AxolotlGame";
import { characterAbility } from "./Abilities";
import Aquariums from "./Aquariums";
import CollectingHelp from "./CollectingHelp";
import FieldGuide from "./FieldGuide";
import { readAquariums, fishSpecies } from "./Fish";
import Welcome from "./Welcome";
import {
  DogMenu,
  DuckMenu,
  BugEncounter,
  Terrariums,
  Inventory,
  MailboxMessage,
} from "./Activities";
import { readTerrariums } from "./Bugs";
import { VillageMap, miniPoint } from "./MiniMap";
import { propMessages } from "./Interactions";
import { outfits } from "./Wardrobe";
import SpritePose from "./SpritePose";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bag,
  PersonCircle,
  QuestionCircle,
  Map as MapIcon,
} from "react-bootstrap-icons";
import { createWorld } from "./engine";
import { doorArrival } from "./WorldLayout";
import { buildings, characters } from "./config";
import { GAME_PORTALS, FRIENDS_TRIVIA } from "./legacySecrets";
import RoomContent from "./RoomContent";
import Dialog from "./WorldDialog";
import "./world.css";

// Only recognized IDs survive a storage/version mismatch; corrupt saved data cannot break the UI.
function readProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem("masyn-world-v1"));
    return {
      visited: [
        ...new Set(
          (Array.isArray(saved?.visited) ? saved.visited : []).filter((id) =>
            buildings.some((b) => b.id === id),
          ),
        ),
      ],
      secrets: [
        ...new Set(
          (Array.isArray(saved?.secrets) ? saved.secrets : []).filter((id) =>
            islandSecrets.some((secret) => secret.id === id),
          ),
        ),
      ],
    };
  } catch {
    return {
      visited: [],
      secrets: [],
    };
  }
}
function Trivia() {
  const [index, setIndex] = useState(0),
    [answer, setAnswer] = useState(null),
    [score, setScore] = useState(0);
  const q = FRIENDS_TRIVIA[index % FRIENDS_TRIVIA.length];
  return (
    <>
      <small>
        QUESTION {index + 1} / {FRIENDS_TRIVIA.length} · {score} CORRECT
      </small>
      <h3>{q.q}</h3>
      <div className="world-answers">
        {q.c.map((choice) => (
          <button
            key={choice}
            disabled={answer !== null}
            onClick={() => {
              setAnswer(choice);
              if (choice === q.a) setScore((n) => n + 1);
            }}
          >
            {choice}
          </button>
        ))}
      </div>
      {answer !== null && (
        <>
          <p role="status">
            {answer === q.a ? "That’s right!" : `The answer is ${q.a}.`}
          </p>
          <button
            onClick={() => {
              setIndex((n) => n + 1);
              setAnswer(null);
            }}
          >
            Next question →
          </button>
        </>
      )}
    </>
  );
}
// Room changes remount the town labels after the engine publishes their positions.
// Keep the latest positions so newly mounted buttons never stack at the page origin.
function placeLabel(node, p) {
  node.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-100%)`;
  node.hidden = !p.visible;
}
function FishingResult({ result, onClose, onAgain, onAquariums }) {
  const species = fishSpecies.find((f) => f.id === result.fishId);
  return (
    <div className="family-encounter fishing-result">
      <span
        className={
          "fishing-result-icon " + (result.caught ? "has-fish" : "has-ripple")
        }
        style={
          result.caught
            ? {
                backgroundImage: "url(/world/sprites/fish.webp)",
              }
            : undefined
        }
        aria-hidden="true"
      >
        {result.caught ? "" : "〰"}
      </span>
      <h3>{result.caught ? "You caught a fish!" : "It got away!"}</h3>
      <p>
        {result.caught
          ? `You reeled in ${result.fish}. Added to your aquariums.`
          : "A little splash, an empty hook. There are plenty more fish out there."}
      </p>
      {species && (
        <>
          <SpritePose asset={species.art} scale={3} label={species.name} />
          <span className="collection-rarity" data-rarity={species.rarity}>
            {species.rarity}
          </span>
          <button onClick={onAquariums}>View aquariums</button>
        </>
      )}
      <div className="world-camera-options">
        <button onClick={onAgain}>Cast again</button>
        <button onClick={onClose}>Keep exploring</button>
      </div>
    </div>
  );
}
// A lighthearted encounter is exclusive to Mi Shell. No combat or losing state.
function FamilyEncounter({ onClose }) {
  const [turn, setTurn] = useState(0);
  return (
    <div className="family-encounter">
      <div className="encounter-stage">
        <SpritePose
          asset="mi-shell-emote"
          scale={3}
          playing={false}
          frame={turn === 0 ? 0 : turn < 3 ? 2 : 3}
          label="Mi Shell"
        />
        <strong>Mi Shell appeared! ♥</strong>
      </div>
      <p role="status">
        {turn === 0
          ? "A familiar face wants a word…"
          : turn < 3
            ? `Mi Shell used Arguing! (${turn}/3)`
            : "Mi Shell learned Loving! It was super effective. ♥"}
      </p>
      {turn < 3 ? (
        <button onClick={() => setTurn(turn + 1)}>Listen</button>
      ) : (
        <button onClick={onClose}>Loving ♥ — return to the village</button>
      )}
    </div>
  );
}
// Dialog names live together rather than inside a nested render expression.
// Room and secret titles still come from the shared world definitions.
function panelTitle(dialog) {
  const titles = {
    "axolotl-game": "Axolotl Drift",
    "race-result": "We have a winner!",
    bug: "A tiny garden friend",
    mailbox: "You’ve got island mail",
    "fishing-result": "A moment by the water",
    encounter: "A familiar encounter",
    trivia: "The one with the trivia",
  };
  if (dialog.type === "island-game") return gameTitles[dialog.id];
  if (dialog.type === "dog" || dialog.type === "duck")
    return `Play with ${dialog.name}`;
  return (
    titles[dialog.type] ||
    (dialog.type === "secret"
      ? GAME_PORTALS[dialog.id]?.title
      : buildings.find((b) => b.id === dialog.id)?.title) ||
    "Explore"
  );
}

export default function WorldMode() {
  const miniPlayer = useRef(null),
    popupPlayer = useRef(null),
    pendingRide = useRef(null);
  const mapLocation = useRef({
    position: { x: 0, z: 9 },
    surfing: false,
    room: null,
  });
  // The popup mounts while the simulation is paused. Retain the last map
  // snapshot so its position marker is correct immediately, without a new frame.
  const syncMapPlayer = useCallback((node) => {
    if (!node) return;
    const { position, surfing, room } = mapLocation.current;
    const home = buildings.find((b) => b.id === room);
    const point = miniPoint(home ? doorArrival(home) : position);
    node.style.left = `${point.left}%`;
    node.style.top = `${point.top}%`;
    node.dataset.mode = surfing ? "surf" : "walk";
  }, []);
  const mountPopupPlayer = useCallback(
    (node) => {
      popupPlayer.current = node;
      syncMapPlayer(node);
    },
    [syncMapPlayer],
  );
  const host = useRef(null),
    engine = useRef(null),
    labelRefs = useRef({}),
    labelPositions = useRef({}),
    toastTimer = useRef(null);
  // Each new visit opens with the animation, including reloads and mode changes.
  const [intro, setIntro] = useState(true),
    [caught, setCaught] = useState(readTerrariums);
  const [aquariums, setAquariums] = useState(readAquariums);
  const [shells, setShells] = useState(readShells);
  const [guideSection, setGuideSection] = useState("bugs");
  function openGuide(section = "bugs") {
    setGuideSection(section);
    setMenu("field-guide");
  }
  const closeIntro = useCallback(() => {
    setIntro(false);
  }, []);
  const [status, setStatus] = useState({
      character: "masyn",
      loading: true,
      position: {
        x: 0,
        z: 9,
      },
      floatCount: 0,
      foundFloats: [],
    }),
    [dialog, setDialog] = useState(null),
    [menu, setMenu] = useState(null),
    [toast, setToast] = useState(""),
    [error, setError] = useState(null),
    [progress, setProgress] = useState(readProgress);
  const ability =
    status.character === "masyn" && status.outfit === "panem"
      ? characterAbility(status.character, status.outfit, status.surfing)
      : status.surfingBoard
        ? status.surfTransitioning
          ? null
          : { label: "Trick", verb: "Do a surfing trick" }
        : status.race
          ? null
          : (status.skateboarding && !status.skateReturning) ||
              (["jetski", "boat"].includes(status.watercraft) &&
                !status.waterReturning)
            ? { label: "Trick", verb: "Do a riding trick" }
            : status.watercraft || status.skateboarding
              ? null
              : characterAbility(
                  status.character,
                  status.outfit,
                  status.surfing,
                );
  const announce = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  }, []);

  function beginFloatSearch(restart = false) {
    engine.current?.startHunt(restart);
    setDialog(null);
    setMenu(null);
    if (status.room) engine.current?.enter(null);
    announce(
      restart
        ? "A fresh set of 20 glass floats is hidden around the island and beaches. Good luck!"
        : "The glass-float search is on. Look for colored glass around town and along every beach!",
    );
  }
  function flyTo(id) {
    setMenu(null);
    engine.current?.travel(id);
    announce(
      id === "pond"
        ? "Flying to the pond. Your axolotl will meet you there."
        : `Flying to ${buildings.find((home) => home.id === id)?.title}`,
    );
  }
  function walkToRide(id) {
    if (menu) {
      pendingRide.current = id;
      setMenu(null);
    } else if (engine.current?.walkToRide(id)) {
      announce(
        id === "skateboard"
          ? "Walking to the skateboard"
          : "Walking to your ride. Use its action button when you arrive.",
      );
    }
  }
  useEffect(() => {
    const title = document.title;
    document.title = "Game Mode · Masyn Nay";
    try {
      engine.current = createWorld(host.current, {
        onStatus: setStatus,
        onCollection: setCaught,
        onAquariums: setAquariums,
        onShells: setShells,
        onMap: (position, surfing, room) => {
          mapLocation.current = { position: { ...position }, surfing, room };
          syncMapPlayer(miniPlayer.current);
          syncMapPlayer(popupPlayer.current);
        },
        onError: (error) => {
          console.error(error);
          setError(
            "Some of the original artwork could not load. Please refresh to try again.",
          );
        },
        onLabels: (labels) =>
          labels.forEach((p) => {
            labelPositions.current[p.id] = p;
            const node = labelRefs.current[p.id];
            if (node) placeLabel(node, p);
          }),
        onVisit: (id) => {
          if (id)
            setProgress((p) => ({
              ...p,
              visited: [...new Set([...p.visited, id])],
            }));
        },
        onEvent: (event) => {
          if (event.type === "wind-song") {
            playWindSong();
            announce("A little melody carries across the sea. ♫");
            return;
          }
          if (event.type === "notice") {
            announce(event.message);
            return;
          }
          if (event.type === "duck-finished") {
            if (event.kind === "chase")
              announce(
                `${event.name} ${event.id === "goose-pair" ? "head" : "heads"} back to exploring. ♥`,
              );
            else
              setDialog({
                ...event,
                type: "duck",
              });
            return;
          }
          if (event.type === "fishing-result") {
            setDialog(event);
            return;
          }
          if (event.type === "animal") {
            announce(
              event.kind === "dog"
                ? `${event.name} enjoyed the pets. ♥`
                : `${event.name} says hello.`,
            );
            return;
          }
          if (event.type === "affection") {
            announce("A hug and a kiss for Mi Shell. ♥");
            return;
          }
          if (event.type === "town-prop") {
            announce(propMessages[event.id]);
            return;
          }
          if (event.type === "person") {
            announce(
              event.id === "mi-shell"
                ? "A little heart for Mi Shell. ♥"
                : `Hello, ${characters.find((c) => c.id === event.id).name}!`,
            );
            return;
          }
          if (event.type === "float") {
            announce(
              event.count === 20
                ? "All 20 glass floats found! Your collection is complete."
                : `${event.name} found! ${event.count} / 20 collected.`,
            );
            return;
          }
          if (["secret", "trivia"].includes(event.type))
            setProgress((p) => ({
              ...p,
              secrets: [
                ...new Set([
                  ...p.secrets,
                  event.type === "trivia" ? "trivia" : event.id,
                ]),
              ],
            }));
          setDialog(event);
        },
      });
    } catch (e) {
      console.error(e);
      setError(
        "The town could not start in this browser. Your regular portfolio is still available.",
      );
    }
    return () => {
      engine.current?.dispose();
      clearTimeout(toastTimer.current);
      document.title = title;
    };
  }, [announce, syncMapPlayer]);
  useEffect(() => {
    const paused = !!dialog || !!menu || intro;
    engine.current?.freeze(paused);
    // Closing a panel unfreezes and clears movement first. Queue rental walks
    // after that step so the new route isn't immediately canceled by unfreezing.
    if (!paused && pendingRide.current) {
      const id = pendingRide.current;
      pendingRide.current = null;
      if (engine.current?.walkToRide(id))
        announce(
          id === "skateboard"
            ? "Walking to the skateboard"
            : "Walking to your ride. Use its action button when you arrive.",
        );
      else announce("Step onto land outside to walk to your ride.");
    }
  }, [dialog, menu, intro, announce]);
  useEffect(() => {
    try {
      localStorage.setItem("masyn-world-v1", JSON.stringify(progress));
    } catch {
      /* Private browsing may disable storage; exploration still works. */
    }
  }, [progress]);
  useEffect(() => {
    function close(e) {
      if (e.key === "Escape") setMenu(null);
    }
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const current = buildings.find((b) => b.id === status.room);
  return (
    <main className={"world-mode" + (status.race ? " is-racing" : "")}>
      <div className="world-viewport" ref={host} />
      <div
        className="world-hud"
        inert={dialog || menu || intro ? "" : undefined}
      >
        {!status.room && (
          <div className="world-labels">
            {buildings.map((b) => (
              <button
                key={b.id}
                ref={(node) => {
                  labelRefs.current[b.id] = node;
                  if (node) {
                    const p = labelPositions.current[b.id];
                    if (p) placeLabel(node, p);
                    else node.hidden = true;
                  }
                }}
                onClick={() => {
                  engine.current?.travel(b.id);
                  announce(
                    `Arrived outside ${b.title}. Walk through the doorway to enter.`,
                  );
                }}
              >
                <span>{b.subtitle}</span>
                {b.title}
                <i>↗</i>
              </button>
            ))}
          </div>
        )}
        <VillageMap
          room={status.room}
          playerRef={miniPlayer}
          onTravel={flyTo}
          onRide={walkToRide}
        />
        <header className="world-top">
          <Link
            className="world-brand"
            to="/design/glass"
            aria-label="Masyn Nay home"
          >
            <BrandMark size="world" framed decorative />
            <div>
              MASYN NAY<small>THE COASTAL COLLECTION</small>
            </div>
          </Link>
          <nav aria-label="Portfolio modes">
            <Link to="/design/glass">Website</Link>
            <Link to="/design/desktop">Mac Mode</Link>
            <span aria-current="page">Game mode</span>
          </nav>
        </header>
        <aside className={`world-intro ${status.room ? "world-in-room" : ""}`}>
          <small>EXPLORE AT YOUR OWN PACE</small>
          <h1>{current ? current.title : "Masyn’s world."}</h1>
          <p>
            {current
              ? "Walk to the desk to explore this part of the portfolio. There may be more than meets the eye."
              : "IT, automation, and a creative detour. Wander through my work, meet the family, and find a few secrets."}
          </p>
          <button
            className="world-progress"
            aria-label="Open island journal"
            aria-haspopup="dialog"
            aria-expanded={menu === "journal"}
            onClick={() => setMenu("journal")}
          >
            {progress.visited.length} / 6 places visited <span>•</span>{" "}
            {progress.secrets.length} secrets found
          </button>
          {current && (
            <button
              className="world-room-read"
              onClick={() =>
                setDialog({
                  type: "content",
                  id: current.id,
                })
              }
            >
              Open {current.title} →
            </button>
          )}
          {status.hunt && (
            <p className="world-hunt">
              Glass floats: {status.floatCount || 0} / 20
            </p>
          )}
        </aside>
        <div className="world-tools">
          <button aria-label="Zoom in" onClick={() => engine.current?.zoom(-3)}>
            ＋
          </button>
          <button aria-label="Zoom out" onClick={() => engine.current?.zoom(3)}>
            −
          </button>
          <button
            onClick={() => setMenu("characters")}
            aria-label="Choose character"
          >
            <PersonCircle size={17} aria-hidden="true" />
            <span>
              {characters.find((c) => c.id === status.character)?.name}
            </span>
          </button>
          <button
            onClick={() => setMenu("inventory")}
            aria-label="Open inventory"
          >
            <Bag size={17} aria-hidden="true" /> <span>Inventory</span>
          </button>
          <button
            className="world-map-toggle"
            onClick={() => setMenu("travel")}
            aria-label="Open island map"
            aria-haspopup="dialog"
          >
            <MapIcon size={17} aria-hidden="true" />
            <span>Map</span>
          </button>
          <button
            onClick={() => setMenu("help")}
            aria-label="Open game controls"
          >
            <QuestionCircle size={17} aria-hidden="true" /> <span>Help</span>
          </button>
        </div>
        {status.room && (
          <button
            className="world-room-exit"
            onClick={() => engine.current?.enter(null)}
          >
            ← Return to town
          </button>
        )}
        <div className="world-bottom">
          {ability && (
            <button
              className="world-ability-button"
              aria-label={ability.verb}
              onClick={() => engine.current?.ability()}
            >
              <kbd>Q</kbd>
              <span>{ability.label}</span>
            </button>
          )}

          {status.canFish && !status.fishingPhase && (
            <button
              className="world-fish-button"
              onClick={() => engine.current?.fish()}
            >
              Fish
            </button>
          )}
          <button
            className="world-interact"
            disabled={
              !status.prompt ||
              !!status.fishingPhase ||
              status.interactionBusy ||
              status.surfingBoard
            }
            onClick={() => engine.current?.interact()}
          >
            <kbd>
              {["building", "exit"].includes(status.promptType) ? "Walk" : "E"}
            </kbd>
            {status.prompt || "Explore the island"}
          </button>
        </div>
      </div>
      {status.race && (
        <div className="world-race-status" role="status" aria-live="polite">
          <small>AXOLOTL DASH</small>
          <strong>
            {status.race.phase === "countdown"
              ? status.race.countdown
              : status.race.phase === "finished"
                ? "Finish!"
                : "Go, little swimmers!"}
          </strong>
          <span>Five familiar faces. One seaside finish.</span>
        </div>
      )}
      {intro && (
        <Welcome ready={!status.loading || !!error} onClose={closeIntro} />
      )}
      {status.fishingPhase && (
        <>
          <div
            className="world-fishing-dialogue"
            role="status"
            aria-live="polite"
          >
            <span>
              {status.fishingPhase === "casting"
                ? "You cast your line…"
                : status.fishingPhase === "waiting"
                  ? ". . ."
                  : "Oh! A nibble!"}
            </span>
            <small>
              {status.fishingPhase === "waiting"
                ? "Waiting for a bite"
                : "A quiet moment by the water"}
            </small>
          </div>
          <div
            className={
              "world-fishing-fade " +
              (status.fishingPhase === "fade" ? "is-visible" : "")
            }
            aria-hidden="true"
          />
        </>
      )}
      {toast && (
        <div className="world-toast" role="status">
          {toast}
        </div>
      )}
      {error && (
        <div className="world-error">
          <p>{error}</p>
          <Link to="/design/glass">Return to website</Link>
        </div>
      )}
      {menu && (
        <Dialog
          wide={["aquariums", "terrariums", "field-guide"].includes(menu)}
          className={
            menu === "travel"
              ? "world-map-panel"
              : ["aquariums", "terrariums"].includes(menu)
                ? "world-collection-dialog"
                : ""
          }
          title={
            menu === "journal"
              ? "Island journal"
              : menu === "field-guide"
                ? "Island Field Guide"
                : menu === "travel"
                  ? "Island map"
                  : menu === "characters"
                    ? "Who’s exploring today?"
                    : menu === "aquariums"
                      ? "Aquariums"
                      : menu === "inventory"
                        ? "Inventory"
                        : menu === "terrariums"
                          ? "Terrariums"
                          : "Make yourself at home"
          }
          onClose={() => setMenu(null)}
        >
          {menu === "journal" ? (
            <IslandJournal
              progress={progress}
              hunt={status.hunt}
              foundFloats={status.foundFloats}
              discoveries={status.floatDiscoveries}
              onHunt={beginFloatSearch}
              onGuide={() => openGuide()}
            />
          ) : menu === "field-guide" ? (
            <>
              <button
                className="inventory-back"
                onClick={() => setMenu("inventory")}
              >
                ← Inventory
              </button>
              <FieldGuide
                bugs={caught}
                fish={aquariums}
                shells={shells}
                initialSection={guideSection}
              />
            </>
          ) : menu === "travel" ? (
            <>
              <p>
                Choose a destination for your duck. From inside a home, you’ll
                land inside the next room.
              </p>
              <VillageMap
                room={status.room}
                playerRef={mountPopupPlayer}
                onTravel={flyTo}
                onRide={walkToRide}
              />
              <p className="world-map-note">
                Tap a home to fly there, or the pond to arrive surfing. Ride
                markers walk you to their boarding spots when you’re outside on
                land.
              </p>
            </>
          ) : menu === "aquariums" ? (
            <>
              <div className="collection-toolbar">
              <button
                className="inventory-back"
                onClick={() => setMenu("inventory")}
              >
                ← Inventory
              </button>
                <button onClick={() => openGuide("fish")}>Open field guide</button>
              </div>
              <Aquariums
                caught={aquariums}
                onRelease={(id) => engine.current?.releaseFish(id)}
              />
            </>
          ) : menu === "inventory" ? (
            <Inventory
              caught={caught}
              fish={aquariums}
              onFieldGuide={() => openGuide()}
              onAquariums={() => setMenu("aquariums")}
              onTerrariums={() => setMenu("terrariums")}
            />
          ) : menu === "terrariums" ? (
            <>
              <div className="collection-toolbar">
              <button
                className="inventory-back"
                onClick={() => setMenu("inventory")}
              >
                ← Inventory
              </button>
                <button onClick={() => openGuide("bugs")}>Open field guide</button>
              </div>
              <Terrariums
                caught={caught}
                onRelease={(id) => engine.current?.releaseBug(id)}
              />
            </>
          ) : menu === "characters" ? (
            <div className="world-wardrobe">
              <p>
                Choose someone to explore with. Masyn’s outfits stay on until
                you pick another or enter a different home.
              </p>
              <div className="world-character-grid">
                {characters.map((c) => (
                  <button
                    key={c.id}
                    aria-pressed={status.character === c.id}
                    onClick={() => {
                      engine.current?.setCharacter(c.id);
                      setMenu(null);
                    }}
                  >
                    <SpritePose
                      asset={c.id}
                      scale={2}
                      playing={false}
                      label={c.name}
                    />
                    <strong>{c.name}</strong>
                  </button>
                ))}
              </div>
              <h3>Costumes · Masyn & the kids</h3>
              <div className="world-character-grid world-outfit-grid">
                {outfits.map((outfit) => (
                  <button
                    key={outfit.id}
                    disabled={outfit.available === false}
                    aria-pressed={
                      status.character === outfit.character &&
                      (status.outfit || "everyday") === outfit.id
                    }
                    onClick={() => {
                      engine.current?.setCharacter("outfit:" + outfit.id);
                      setMenu(null);
                    }}
                  >
                    <SpritePose
                      asset={
                        outfit.available === false
                          ? outfit.character
                          : outfit.asset
                      }
                      scale={2}
                      playing={false}
                      label={outfit.name}
                    />
                    <strong>
                      {outfit.name}
                      {outfit.available === false ? " · coming soon" : ""}
                    </strong>
                  </button>
                ))}
              </div>
              <Link className="world-sprite-link" to="/world/sprites">
                Explore every sprite and action ↗
              </Link>
            </div>
          ) : (
            <>
              <h3>The beach & island journal</h3>
              <p>
                Tap or click the places / secrets counter to review discoveries and the
                glass-float hunt. On the beach beside the pier, walk close to
                shells, the sandcastle bucket or the dragon kite, then press E
                or tap the action button. Footprints fade from the sand; collect
                50 shell varieties in the Field Guide. Start the 20-float hunt
                inside Windfall lodge.
              </p>
              <h3>Mobile & tablet</h3>
              <p>
                The chimes open Element Runner: swipe left/right to change
                lanes, up to jump and down to slide, or use its touch buttons.
                At the windmill, drag or swipe the 2048 board. Tap neighboring
                balls in Poké Ball Match, tap cards in Wizard Memory, and tap
                the running orcs in Orc Hunt. Axolotl Drift uses taps or its
                Rise button.
              </p>
              <p>
                Tap clear ground to walk there. Double-tap the same spot to run.
                Your character follows a route to that spot; tap another spot to
                change direction. Pinch with two fingers or use + / − to zoom.
                Pinching also stops your current route.
              </p>
              <p>
                Tap the action button beside the water to surf, then tap land to
                walk ashore. Fish casts your rod. Tap your costume’s ability
                button for its special action or Trick while riding. Open Map in
                the top toolbar, then tap a home or the pond to fast travel. The
                map is tucked away while you explore. Characters, inventory,
                animal menus, bikes, bugs, mailboxes and room panels all work by
                touch; use each panel’s × to close it.
              </p>
              <p>
                The action button at the bottom changes as you approach
                something you can use. Tap that label to interact; you do not
                need a keyboard for E or Q actions. Shake tree, Catch, Fish,
                animal activities and costume abilities all have on-screen
                controls.
              </p>
              <h3>Keyboard & mouse</h3>
              <p>
                At the boat on the pier's left side, use E or the action button
                to start wakeboarding. Another family member drives while you
                ride behind. Q / Trick performs a flip; the tour returns you to
                the same spot. The jet ski is on the right: steer with
                directions or tap open ocean, and use Q / Trick while moving.
              </p>
              <p>
                The skateboard is beside the bikes. Its board icon on the
                minimap walks you there. Steer with directions or tap land; Q /
                Trick works while riding. Return skateboard takes you back to
                its rack.
              </p>
              <p>
                The checkered START banner at the end of the pier begins an
                axolotl race. Press E or tap Start an axolotl race: all five
                family members race in their everyday clothes, and anyone can
                win. Press E or Leave the race to return early.
              </p>
              <p>Shift + scroll, or the + / − buttons, zooms the village.</p>
              <p>
                Use WASD or the arrow keys to walk. Space stops immediately.
                Hold Shift to run, or click a clear spot on the ground and your
                character will find a route. Press Q as Ezra or Fitzgerald to
                shoot a web, or as Fallyn to throw and retrieve her yo-yo. Each
                of Masyn’s themed costumes also has a Q action on land: glide in
                a circle as an airbender, play the ocarina, throw a returning
                trident, cast a wand spell, throw a Poké Ball, or shoot an
                arrow. Panem Tribute raises a three-finger salute. Mi Shell’s
                Q tosses a few dollar bills.
              </p>
              <p>
                Try the wand, Poké Ball or bow near another person for a small
                surprise. The woodland archer shoots an apple off their head.
                Play the ocarina outside to watch a day pass. Everyone returns
                to their normal routine afterward.
              </p>
              <p>
                Walk through a front door to enter. Press E near a desk, a
                person, or a curious little object. Escape closes panels. Select
                a home on the minimap to fly to its front door. Indoors, fly
                straight into another room. The center shortcut takes you
                surfing on the pond.
              </p>
              <p>
                Masyn’s original outfit changes for each room. Select a family
                member to explore as someone else, or choose any of Masyn’s
                costumes. Pet Rosie and Millie, visit the pond, and inspect the
                details inside each room.
              </p>
              <p>
                Press E at the water’s edge to surf on your axolotl. Return to
                land to dismount. Choose Fish to cast, wait for a nibble, and
                discover what you caught.
              </p>
              <h3>Collecting bugs & aquatic life</h3>
              <CollectingHelp kind="bugs" expanded />
              <CollectingHelp kind="fish" expanded />
              <p>
                The Acro and Mach bikes beside the playground take you on a
                guided pond lap and return you to the starting spot. Approach a
                bike and press E or tap its Ride action to begin.
              </p>
              <p>
                Visits and discovered room secrets are saved on this device. No
                account is needed.
              </p>
              <div className="world-camera-options">
                <button
                  onClick={() => {
                    setMenu(null);
                    setIntro(true);
                  }}
                >
                  Replay welcome
                </button>
                <button onClick={() => engine.current?.zoom(-3)}>
                  Zoom in
                </button>
                <button onClick={() => engine.current?.zoom(3)}>
                  Zoom out
                </button>
                <button
                  onClick={() => {
                    engine.current?.reset();
                    setMenu(null);
                  }}
                >
                  Return to plaza
                </button>
              </div>
            </>
          )}
        </Dialog>
      )}
      {dialog && (
        <Dialog
          wide={dialog.type === "axolotl-game"}
          className={
            dialog.type === "axolotl-game"
              ? "world-arcade-dialog"
              : dialog.type === "island-game" && dialog.id === "chimes"
                ? "world-runner-dialog"
                : ""
          }
          title={panelTitle(dialog)}
          onClose={() => setDialog(null)}
        >
          {dialog.type === "island-game" ? (
            <IslandGames
              id={dialog.id}
              character={status.character}
              outfit={status.outfit}
            />
          ) : dialog.type === "axolotl-game" ? (
            <AxolotlGame character={status.character} outfit={status.outfit} />
          ) : dialog.type === "race-result" ? (
            <div className="world-race-result">
              <span className="world-race-winner">
                <svg
                  className="world-winner-crown"
                  viewBox="0 0 48 32"
                  role="img"
                  aria-label="Winner’s crown"
                >
                  <path
                    d="M5 8 15 17 24 3 33 17 43 8 39 28H9Z"
                    fill="#e4b74d"
                    stroke="#765423"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 24H39L38 29H10Z"
                    fill="#f5d982"
                    stroke="#765423"
                    strokeWidth="2"
                  />
                  <path
                    d="m24 13 4 6-4 5-4-5Z"
                    fill="#68b7ba"
                    stroke="#795c29"
                  />
                  <path
                    d="M7 9 15 18 24 5"
                    fill="none"
                    stroke="#fff0bc"
                    strokeWidth="2"
                  />
                </svg>
                <SpritePose
                  asset={dialog.winner.id + "-surf"}
                  label={dialog.winner.name + " on their axolotl"}
                />
              </span>
              <p className="world-lead">
                The winner of this race is{" "}
                <strong>{dialog.winner.name}!</strong>
              </p>
              <ol aria-label="Race finishing order">
                {dialog.order.map((person) => (
                  <li key={person.id}>{person.name}</li>
                ))}
              </ol>
              <button
                onClick={() => {
                  setDialog(null);
                  engine.current?.freeze(false);
                  engine.current?.interact();
                }}
              >
                Race again
              </button>
              <button onClick={() => setDialog(null)}>Back to the pier</button>
            </div>
          ) : dialog.type === "dog" ? (
            <DogMenu
              dog={dialog}
              onClose={() => setDialog(null)}
              onPlay={(kind) => {
                setDialog(null);
                engine.current?.freeze(false);
                if (!engine.current?.playDog(dialog.id, kind))
                  announce("Find a little more space to play nearby.");
              }}
            />
          ) : dialog.type === "duck" ? (
            <DuckMenu
              duck={dialog}
              onClose={() => setDialog(null)}
              onPlay={(kind) => {
                setDialog(null);
                engine.current?.freeze(false);
                if (!engine.current?.playDuck(dialog.id, kind))
                  announce("Find a little more open space for a chase nearby.");
              }}
            />
          ) : dialog.type === "bug" ? (
            <BugEncounter
              id={dialog.id}
              onClose={() => setDialog(null)}
              onCatch={() => {
                engine.current?.catchBug(dialog.id);
                setDialog(null);
                setMenu("terrariums");
              }}
            />
          ) : dialog.type === "mailbox" ? (
            <MailboxMessage
              key={dialog.id}
              id={dialog.home}
              onOpen={() =>
                setProgress((p) => ({
                  ...p,
                  secrets: [...new Set([...p.secrets, dialog.id])],
                }))
              }
            >
              {GAME_PORTALS["game-" + dialog.home] && (
                <SecretGame
                  portal={GAME_PORTALS["game-" + dialog.home]}
                  onDiscover={() =>
                    setProgress((p) => ({
                      ...p,
                      secrets: [
                        ...new Set([...p.secrets, "game-" + dialog.home]),
                      ],
                    }))
                  }
                />
              )}
            </MailboxMessage>
          ) : dialog.type === "fishing-result" ? (
            <FishingResult
              result={dialog}
              onAquariums={() => {
                setDialog(null);
                setMenu("aquariums");
              }}
              onClose={() => setDialog(null)}
              onAgain={() => {
                setDialog(null);
                engine.current?.freeze(false);
                engine.current?.fish();
              }}
            />
          ) : dialog.type === "encounter" ? (
            <FamilyEncounter onClose={() => setDialog(null)} />
          ) : dialog.type === "secret" ? (
            <>
              <p>
                An ad-free cartridge from the island’s shared GBA library. It
                starts only when you choose to load it.
              </p>
              <SecretGame portal={GAME_PORTALS[dialog.id]} />
            </>
          ) : dialog.type === "trivia" ? (
            <Trivia />
          ) : (
            <RoomContent
              id={dialog.id}
              huntActive={status.hunt}
              onHunt={beginFloatSearch}
            />
          )}
        </Dialog>
      )}
    </main>
  );
}
function SecretGame({ portal, onDiscover }) {
  const [started, setStarted] = useState(false);
  return started ? (
    <>
      <p>{portal.controls}</p>
      <iframe
        className="world-game-frame"
        src={portal.src}
        title={portal.title}
        allowFullScreen
        allow="fullscreen; gamepad"
      />
      <a href={portal.src} target="_blank" rel="noreferrer">
        Open game separately ↗
      </a>
    </>
  ) : (
    <button
      className="world-primary"
      onClick={() => {
        setStarted(true);
        onDiscover?.();
      }}
    >
      Load hidden game
    </button>
  );
}
