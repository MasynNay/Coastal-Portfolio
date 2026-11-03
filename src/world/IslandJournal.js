import { buildings } from "./config";
import { mailboxLetters } from "./Mailboxes";
import { GAME_PORTALS } from "./RoomGames";
import { glassFloats } from "./FloatHunt";
import SpritePose from "./SpritePose";

// These IDs are also used to validate saved discoveries and count the HUD badge.
export const islandSecrets = [
  ...Object.entries(mailboxLetters).map(([home, letter]) => ({
    id: `mail-${home}`,
    title: letter.title,
    home,
    kind: "Mailbox letter",
    detail: letter.joke || letter.teaser,
  })),
  ...Object.entries(GAME_PORTALS).map(([id, portal]) => ({
    id,
    title: portal.title,
    home: id.replace("game-", ""),
    kind: "Hidden game",
    detail: "An arcade game tucked inside this home's mailbox.",
  })),
  {
    id: "trivia",
    title: "Friends trivia",
    home: "home",
    kind: "Room secret",
    detail: "A familiar television quiz in the About room.",
  },
];
export default function IslandJournal({
  progress,
  foundFloats = [],
  hunt,
  onGuide,
  onHunt,
  discoveries = [],
}) {
  return (
    <div className="island-journal">
      <p>
        Your visits and discoveries are saved on this device. The secrets
        counter tracks opened mailbox letters, hidden games and room trivia.
        Costume surprises and the glass-float collection have their own
        adventures.
      </p>
      <h3>
        Places visited · {progress.visited.length} / {buildings.length}
      </h3>
      <ul className="journal-places">
        {buildings.map((home) => (
          <li key={home.id} data-found={progress.visited.includes(home.id)}>
            <strong>
              {progress.visited.includes(home.id) ? "✓" : "○"} {home.title}
            </strong>
            <span>
              {progress.visited.includes(home.id)
                ? "Visited"
                : "Walk through the front door"}
            </span>
          </li>
        ))}
      </ul>
      <h3>
        Secrets discovered · {progress.secrets.length} / {islandSecrets.length}
      </h3>
      <ul className="journal-secrets">
        {islandSecrets.map((secret) => {
          const known = progress.secrets.includes(secret.id),
            home = buildings.find((b) => b.id === secret.home);
          return (
            <li key={secret.id} data-found={known}>
              <strong>{known ? secret.title : "Undiscovered secret"}</strong>
              <small>
                {secret.kind} · {home.title}
              </small>
              <p>
                {known
                  ? secret.detail
                  : secret.kind === "Mailbox letter"
                    ? "Find the mailbox beside the front door and open its letter."
                    : secret.kind === "Hidden game"
                      ? "Look inside this home's mailbox for something playable."
                      : "Explore the objects inside the room."}
              </p>
            </li>
          );
        })}
      </ul>
      <h3>Glass floats · {foundFloats.length} / 20</h3>
      <p>
        {hunt
          ? "The floats are out! Look for colored, swirled glass balls around the island and along the beach. Walk close and press E or tap Collect. Locations change with each fresh hunt, including the beaches on every side. Your current search resumes after reloading."
          : "Visit Windfall lodge and start the glass-float hunt. Twenty colorful blown-glass fishing floats will appear outside, ready to find. They are visible objects, rather than invisible search points."}
      </p>
      <div className="world-camera-options">
        <button onClick={() => onHunt(false)}>
          {hunt ? "Continue searching" : "Start searching"}
        </button>
        {hunt && (
          <button onClick={() => onHunt(true)}>
            Hide a fresh set of 20 floats
          </button>
        )}
      </div>
      <p>Lifetime collection: {discoveries.length} / 20 colors discovered.</p>
      <div className="journal-floats">
        {glassFloats.map((float) => (
          <div key={float.id} data-found={foundFloats.includes(float.id)}>
            <SpritePose
              asset={float.art}
              playing={false}
              scale={0.32}
              label={float.name}
            />
            <span>{float.name.replace(" glass float", "")}</span>
            <small>
              {foundFloats.includes(float.id) ? "Found ✓" : "Still hidden"}
            </small>
          </div>
        ))}
      </div>
      <button onClick={onGuide}>Open the island field guide</button>
    </div>
  );
}
