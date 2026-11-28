import { useState, useRef, useEffect } from "react";
import { fishSpecies } from "./Fish";
import { terrariumSpecies } from "./Bugs";
import { shellSpecies } from "./Shells";
import { cardCatalog } from "./CardCatalog";
import { readCardCollection } from "./CardCollection";
import { PokemonCard } from "./CardPacks";
import HabitatResidents from "./HabitatResidents";
import CollectionIcon from "./CollectionIcon";
import { bugHomeFor, readBugHomes } from "./BugHomes";
import {
  cleanDisplayRoom,
  readDisplayRoom,
  saveDisplayRoom,
  roomThemes,
} from "./DisplayRoomData";
import { passportMilestones } from "./Passport";
import { readFloatHunt } from "./FloatHunt";
import "./IslandLife.css";

// A personal gallery uses references to owned items, never cloned catches.
// Releasing the last resident leaves an empty shelf, keeping the save honest.
export default function DisplayRoom({ bugs, fish, shells, progress, onBack }) {
  const [room, setRoom] = useState(readDisplayRoom),
    [editing, setEditing] = useState(null),
    [notice, setNotice] = useState(""),
    [pickerKind, setPickerKind] = useState("cards"),
    [search, setSearch] = useState(""),
    [limit, setLimit] = useState(24);
  const picker = useRef(null),
    returnTo = useRef(null);
  useEffect(() => {
    if (editing !== null) {
      picker.current?.focus();
      picker.current?.scrollIntoView?.({ block: "start" });
    } else returnTo.current?.focus();
  }, [editing]);
  const cards = readCardCollection().cards,
    homes = readBugHomes();
  const ownedCards = new Map();
  Object.values(cards).forEach((c) => {
    if (!ownedCards.has(c.id)) ownedCards.set(c.id, c);
  });
  const options = {
    cards: cardCatalog.filter((c) => ownedCards.has(c.id)),
    fish: fishSpecies.filter((s) => fish[s.id]),
    bugs: terrariumSpecies.filter((s) => bugs[s.id]),
    shells: shellSpecies.filter((s) => shells[s.id]),
  };
  const milestones = passportMilestones({
    progress,
    bugs,
    fish,
    shells,
    cards,
    floats: readFloatHunt().discovered,
  });
  const unlocked = {
    coast: true,
    moon: milestones.find((m) => m.id === "visitor").complete,
    fern: milestones.find((m) => m.id === "naturalist").complete,
  };
  const effectiveTheme = unlocked[room.theme] ? room.theme : "coast";
  function change(next) {
    const clean = cleanDisplayRoom(next);
    setRoom(clean);
    setNotice(
      saveDisplayRoom(clean)
        ? "Display saved on this device."
        : "Displayed for this visit. Device storage is unavailable.",
    );
  }
  function place(kind, id) {
    change({
      ...room,
      slots: room.slots.map((s, i) =>
        i === editing ? (id ? { kind, id } : null) : s,
      ),
    });
    setEditing(null);
  }
  function swap(index, step) {
    const slots = [...room.slots],
      other = (index + step + slots.length) % slots.length;
    [slots[index], slots[other]] = [slots[other], slots[index]];
    change({ ...room, slots });
  }
  return (
    <div className="display-room-app">
      <button onClick={onBack}>Inventory</button>
      <h3>My Little Collection Room</h3>
      <p>
        Choose six favorites to display. Move them between shelves and make the
        room your own.
      </p>
      <label className="display-theme">
        Room Style
        <select
          value={effectiveTheme}
          onChange={(e) => change({ ...room, theme: e.target.value })}
        >
          {Object.entries(roomThemes).map(([id, name]) => (
            <option key={id} value={id} disabled={!unlocked[id]}>
              {name}
              {!unlocked[id]
                ? id === "moon"
                  ? " · Visit All Homes"
                  : " · Discover 10 Bugs"
                : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="display-room" data-theme={effectiveTheme}>
        <div className="display-window" aria-hidden="true" />
        <div className="display-shelves">
          {room.slots.map((item, index) => {
            const resident =
              item && options[item.kind]?.find((s) => s.id === item.id);
            return (
              <article className="display-shelf" key={index}>
                <button
                  className="display-object"
                  onClick={(e) => {
                    returnTo.current = e.currentTarget;
                    setEditing(index);
                  }}
                  aria-label={`Choose display ${index + 1}${resident ? `: ${resident.name}` : " · empty"}`}
                >
                  {!resident ? (
                    <span className="display-empty">
                      <b>＋</b>Choose a Favorite
                    </span>
                  ) : item.kind === "cards" ? (
                    <PokemonCard card={ownedCards.get(item.id)} />
                  ) : item.kind === "shells" ? (
                    <CollectionIcon
                      asset={resident.art}
                      label={resident.name}
                    />
                  ) : (
                    <div className={`display-habitat ${item.kind}`}>
                      <span
                        style={{
                          backgroundImage: `url(/world/collections/${item.kind === "fish" ? "aquarium" : bugHomeFor(resident, homes)}.webp)`,
                        }}
                      />
                      <HabitatResidents
                        species={resident}
                        quantity={1}
                        paused={false}
                        aquatic={item.kind === "fish"}
                        home={bugHomeFor(resident, homes)}
                      />
                    </div>
                  )}
                </button>
                <strong>{resident?.name || `Display ${index + 1}`}</strong>
                <div className="display-reorder">
                  <button
                    onClick={() => swap(index, -1)}
                    aria-label={`Move display ${index + 1} left`}
                  >
                    Move Left
                  </button>
                  <button
                    onClick={() => swap(index, 1)}
                    aria-label={`Move display ${index + 1} right`}
                  >
                    Move Right
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      {editing !== null && (
        <section
          className="display-picker"
          ref={picker}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              setEditing(null);
            }
          }}
          aria-label={`Choose item for display ${editing + 1}`}
        >
          <div className="island-life-actions">
            <h3>Choose a Collection Item</h3>
            <button onClick={() => setEditing(null)}>Cancel</button>
            <button onClick={() => place(null, null)}>Clear Display</button>
          </div>
          <div
            className="island-life-actions"
            role="group"
            aria-label="Display collection"
          >
            {Object.keys(options).map((kind) => (
              <button
                key={kind}
                aria-pressed={kind === pickerKind}
                onClick={() => {
                  setPickerKind(kind);
                  setSearch("");
                  setLimit(24);
                }}
              >
                {
                  {
                    cards: "Cards",
                    fish: "Aquatic Life",
                    bugs: "Bugs & Spiders",
                    shells: "Seashells",
                  }[kind]
                }
              </button>
            ))}
          </div>
          <label className="display-search">
            Find an Item
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setLimit(24);
              }}
              placeholder="Search your collection"
            />
          </label>
          <div className="display-options">
            {options[pickerKind]
              .filter((s) =>
                s.name.toLowerCase().includes(search.toLowerCase()),
              )
              .slice(0, limit)
              .map((s) => (
                <button key={s.id} onClick={() => place(pickerKind, s.id)}>
                  {pickerKind === "cards" ? (
                    <img src={s.thumbnail} alt="" loading="lazy" />
                  ) : (
                    <CollectionIcon asset={s.art} label={s.name} />
                  )}
                  <span>{s.name}</span>
                </button>
              ))}
          </div>
          {!options[pickerKind].some((s) =>
            s.name.toLowerCase().includes(search.toLowerCase()),
          ) && <p>No collected items match this selection.</p>}
          {options[pickerKind].filter((s) =>
            s.name.toLowerCase().includes(search.toLowerCase()),
          ).length > limit && (
            <button onClick={() => setLimit((n) => n + 24)}>
              Show More Items
            </button>
          )}
        </section>
      )}
      <p role="status">{notice}</p>
    </div>
  );
}
