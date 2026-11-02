import { useState } from "react";
import HabitatResidents from "./HabitatResidents";
import SpritePose from "./SpritePose";
import { fishSpecies, fishHabitats } from "./Fish";
// Aquarium cards render the same animated atlas awarded by fishing. Counts are
// owned by the engine/store; this view never invents catches or resets progress.
export default function Aquariums({ caught, onRelease, onGuide }) {
  const [inspect, setInspect] = useState(null),
    [filter, setFilter] = useState("All"),
    [paused, setPaused] = useState(false),
    [selected, setSelected] = useState(null);
  const collected = fishSpecies.filter((f) => caught[f.id]);
  const visible = collected.filter(
    (f) => filter === "All" || filter === f.rarity,
  );
  const resident = visible.find((f) => f.id === selected) || visible[0];
  return (
    <div className={"aquariums" + (paused ? " is-paused" : "")}>
      <p>
        Your aquatic finds, with a little room to explore. {collected.length} /{" "}
        {fishSpecies.length} types discovered.
      </p>
      {onGuide && <button onClick={onGuide}>Open field guide</button>}
      {!collected.length ? (
        <div className="spider-empty">
          Cast a line at the pond or pier to begin your aquariums. Successful
          catches are saved here automatically.
        </div>
      ) : (
        <>
          <label className="aquarium-filter">
            Show{" "}
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {[
                "All",
                "Common",
                "Uncommon",
                "Rare",
                "Very rare",
                "Super rare",
              ].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <div className="collection-picker" aria-label="Choose an aquarium">
            {visible.map((f) => (
              <button
                key={f.id}
                aria-pressed={resident?.id === f.id}
                onClick={() => {
                  setSelected(f.id);
                  setInspect(null);
                }}
              >
                <SpritePose
                  asset={f.art}
                  scale={1.2}
                  playing={false}
                  label={f.name}
                />
                <span>
                  {f.name} ×{caught[f.id]}
                </span>
              </button>
            ))}
          </div>
          {!visible.length && <p>No fish of this rarity caught yet.</p>}
          <div className="aquarium-grid">
            {(resident ? [resident] : []).map((f) => (
              <article key={f.id} data-rarity={f.rarity}>
                <button
                  className={
                    "aquarium-tank " + (inspect === f.id ? "is-close" : "")
                  }
                  aria-label={"Inspect " + f.name}
                  aria-pressed={inspect === f.id}
                  onClick={() => setInspect(inspect === f.id ? null : f.id)}
                >
                  <span
                    className="tank-scenery"
                    style={{
                      backgroundImage: "url(/world/collections/aquarium.webp)",
                    }}
                  />
                  <HabitatResidents
                    species={f}
                    quantity={caught[f.id]}
                    paused={paused}
                    aquatic
                  />
                  <span className="habitat-zoom">
                    {inspect === f.id ? "− Back to aquarium" : "+ Look closer"}
                  </span>
                  <i className="tank-bubble" />
                  <i className="tank-bubble second" />
                </button>
                <h3>{f.name}</h3>
                <span className="collection-rarity" data-rarity={f.rarity}>
                  {f.rarity}
                </span>
                <p>{caught[f.id]} in this aquarium</p>
                <p>{fishHabitats[f.habitat]}</p>
                {onRelease && (
                  <button onClick={() => onRelease(f.id)}>
                    Release one to the{" "}
                    {f.habitat === "freshwater" ? "pond" : "sea"}
                  </button>
                )}
                {caught[f.id] > 8 && (
                  <small>
                    Showing 8 residents · all {caught[f.id]} are saved.
                  </small>
                )}
              </article>
            ))}
          </div>
        </>
      )}
      {!!collected.length && (
        <button onClick={() => setPaused(!paused)}>
          {paused ? "Let them swim" : "Pause to look closely"}
        </button>
      )}
      <p className="activity-note">
        Catches are saved on this device. One super-rare find waits among{" "}
        {fishSpecies.length} aquatic types.
      </p>
    </div>
  );
}
