import { useLayoutEffect, useRef, useState } from "react";
import GameLibrary from "../components/GameLibrary";
import GamePlayer from "../components/GamePlayer";
import "./RoomArcade.css";

// The Lodge pauses the world while a cartridge is open. Going back or closing
// the room panel unmounts its player, including downloads and game input.
export default function RoomArcade() {
  const [selected, setSelected] = useState(null);
  const view = useRef(null);
  useLayoutEffect(() => {
    // A cartridge selected near the bottom of the shelf must open at the top,
    // with keyboard focus on the return control instead of a removed button.
    const panel = view.current?.closest(".world-dialog");
    if (panel) panel.scrollTop = 0;
    if (selected)
      view.current?.querySelector("button")?.focus({ preventScroll: true });
  }, [selected]);
  return (
    <div ref={view}>
      {selected ? (
        <div className="room-arcade">
          <div className="room-arcade-return">
            <button onClick={() => setSelected(null)}>← All cartridges</button>
            <h3>{selected.name}</h3>
          </div>
          <div className="room-cartridge-player">
            <GamePlayer game={selected} />
          </div>
        </div>
      ) : (
        <GameLibrary
          title={null}
          onOpen={setSelected}
          description="A treasure chest full of games. Choose a cartridge to play, then return to the shelf whenever you like."
        />
      )}
    </div>
  );
}
