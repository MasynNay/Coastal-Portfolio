import { useRef, useState } from "react";
import Bloom from "../bloom/Bloom";
import Aquarium from "./Aquarium";
import "./AsciiApp.css";
import { aquariumStyles } from "./Worlds";
import { bouquetStyles } from "../bloom/Bouquet";

// One dock window owns the terminal menu. Keep opened modes mounted so a trip
// back to the menu preserves the selected bouquet, habitat, and pause setting.
export default function AsciiApp({ active = true }) {
  const [mode, setMode] = useState(null);
  const [visited, setVisited] = useState({});
  const heading = useRef(null);
  function open(next) {
    if (next) setVisited((current) => ({ ...current, [next]: true }));
    setMode(next);
    heading.current?.focus({ preventScroll: true });
  }
  return (
    <div className={`ascii-app ${mode ? `ascii-mode-${mode}` : ""}`}>
      <header className="ascii-toolbar">
        <p ref={heading} tabIndex={-1}>
          <span>masyn@mac</span> <span className="ascii-muted">~ %</span>{" "}
          {mode
            ? `ascii --${mode === "aquarium" ? "worlds" : mode}`
            : "ascii --explore"}
          <span className="ascii-cursor" aria-hidden="true">
            _
          </span>
        </p>
        {mode && <button onClick={() => open(null)}>Modes</button>}
      </header>
      {!mode && (
        <section className="ascii-menu" aria-label="Choose an ASCII mode">
          <span className="ascii-eyebrow">
            A LITTLE CHARACTER GOES A LONG WAY
          </span>
          <h2>
            Small worlds.
            <br />
            Made of text.
          </h2>
          <p>Choose somewhere to linger.</p>
          <div className="ascii-mode-list">
            <button onClick={() => open("bouquet")}>
              <pre aria-hidden="true">
                {
                  "    @@@   @@@\n  @@@@@ @@@@@\n    \\ | /\n     \\|/\n     /_\\"
                }
              </pre>
              <span>
                <strong>Bouquets</strong>
                <span>
                  {bouquetStyles.length} arrangements. One very special person.
                </span>
                <small>For Mi Shell ♥</small>
              </span>
            </button>
            <button onClick={() => open("aquarium")}>
              <pre aria-hidden="true">
                {
                  "  o       .\n    ><(((o>\n  <o)))><\n  /|  /|  /|\n ~~~~~~~~~~~"
                }
              </pre>
              <span>
                <strong>Aquariums & Worlds</strong>
                <span>
                  {aquariumStyles.length} animated scenes. Feed the fish,
                  explore a garden, or drift into space.
                </span>
                <small>Reefs, Pokémon, fireflies & more</small>
              </span>
            </button>
          </div>
          <p className="ascii-menu-note">No downloads. Just a little wonder.</p>
        </section>
      )}
      {visited.bouquet && (
        <div className="ascii-mode-panel" hidden={mode !== "bouquet"}>
          <Bloom active={active && mode === "bouquet"} embedded />
        </div>
      )}
      {visited.aquarium && (
        <div className="ascii-mode-panel" hidden={mode !== "aquarium"}>
          <Aquarium active={active && mode === "aquarium"} />
        </div>
      )}
    </div>
  );
}
