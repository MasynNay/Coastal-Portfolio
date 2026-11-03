import { useState } from "react";
import HabitatResidents from "./HabitatResidents";
import HabitatView from "./HabitatView";
import SpritePose from "./SpritePose";
import CollectingHelp from "./CollectingHelp";
import { fishSpecies, fishHabitats } from "./Fish";
// Aquarium cards render the same animated atlas awarded by fishing. Counts are
// owned by the engine/store; this view never invents catches or resets progress.
export default function Aquariums({ caught, onRelease }) {
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
      <CollectingHelp kind="fish" expanded={!collected.length} />
      {!collected.length ? (
        <div className="spider-empty">
          No residents yet. Successful catches are saved here automatically.
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
          <div className="collection-picker" role="region" tabIndex={0} aria-label="Choose an aquarium">
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
                <HabitatView
                  name={f.name}
                  aquatic
                  inspecting={inspect === f.id}
                  paused={paused}
                  onInspect={() => setInspect(inspect === f.id ? null : f.id)}
                  onRelease={onRelease ? () => onRelease(f.id) : undefined}
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
                  <i className="tank-bubble" />
                  <i className="tank-bubble second" />
                </HabitatView>
                <h3>{f.name}</h3>
                <span className="collection-rarity" data-rarity={f.rarity}>
                  {f.rarity}
                </span>
                <p>{caught[f.id]} in this aquarium</p>
                <p>{fishHabitats[f.habitat]}</p>
                {caught[f.id] > 8 && (
                  <small>
                    Showing 8 residents · all {caught[f.id]} are saved.
                  </small>
                )}
                <div className="habitat-actions">
                  <button onClick={() => setPaused(!paused)}>
                    {paused ? "Let them swim" : "Pause to look closely"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <p className="activity-note">
        Catches are saved on this device. One super-rare find waits among{" "}
        {fishSpecies.length} aquatic types.
      </p>
    </div>
  );
}
