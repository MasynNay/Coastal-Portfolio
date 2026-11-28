import { buildings } from "./config";
import { bugSpecies, discoveredBugs } from "./Bugs";
import { fishSpecies, discoveredFish } from "./Fish";
import { shellSpecies, discoveredShells } from "./Shells";
import { checklistProgress } from "./CardCatalog";
import { readCardCollection } from "./CardCollection";
import { readFloatHunt } from "./FloatHunt";
import { useFavorites } from "./CollectionPreferences";
import CollectionIcon from "./CollectionIcon";
import "./IslandLife.css";

// Milestones are derived from existing saves. Releasing a resident does not
// erase its discovery stamp, and visiting a page can never award fake progress.
export function passportMilestones({
  progress,
  bugs,
  fish,
  shells,
  cards,
  floats,
}) {
  const count = (catalog, known) => catalog.filter((s) => known[s.id]).length;
  const b = count(bugSpecies, discoveredBugs(bugs)),
    f = count(fishSpecies, discoveredFish(fish)),
    s = count(shellSpecies, discoveredShells(shells));
  const c = checklistProgress(cards).found;
  return [
    {
      id: "visitor",
      name: "Island Neighbor",
      detail: "Visit every home",
      value: buildings.filter((h) => progress.visited.includes(h.id)).length,
      goal: buildings.length,
      reward: "Moonlit display room",
    },
    {
      id: "naturalist",
      name: "Little Naturalist",
      detail: "Discover 10 bugs",
      value: b,
      goal: 10,
      reward: "Fern display room",
    },
    {
      id: "angler",
      name: "Coastal Collector",
      detail: "Discover 10 aquatic species",
      value: f,
      goal: 10,
    },
    {
      id: "shells",
      name: "Beachcomber",
      detail: "Discover 10 seashells",
      value: s,
      goal: 10,
    },
    {
      id: "cards",
      name: "Binder Beginning",
      detail: "Collect 25 card printings",
      value: c,
      goal: 25,
    },
    {
      id: "floats",
      name: "Glass Treasure",
      detail: "Discover all 20 float colors",
      value: new Set(floats).size,
      goal: 20,
    },
  ].map((m) => ({ ...m, complete: m.value >= m.goal }));
}
export default function Passport({
  progress,
  bugs,
  fish,
  shells,
  onJournal,
  onRoom,
  onBackup,
}) {
  const cards = readCardCollection(),
    floats = readFloatHunt();
  const milestones = passportMilestones({
    progress,
    bugs,
    fish,
    shells,
    cards: cards.cards,
    floats: floats.discovered,
  });
  const bugFavorites = useFavorites("bugs"),
    fishFavorites = useFavorites("fish");
  const favorites = [
    ...bugSpecies.filter(
      (s) => bugs[s.id] && bugFavorites.favorites.includes(s.id),
    ),
    ...fishSpecies.filter(
      (s) => fish[s.id] && fishFavorites.favorites.includes(s.id),
    ),
  ];
  return (
    <div className="island-passport">
      <div className="passport-cover">
        <small>WINDFALL COAST</small>
        <h3>Your Island Passport</h3>
        <p>
          A little record of everywhere you’ve been and everything you’ve found.
        </p>
        <span>
          {milestones.filter((m) => m.complete).length} / {milestones.length}{" "}
          Milestones
        </span>
      </div>
      <h3>Home Stamps</h3>
      <div className="passport-stamps">
        {buildings.map((h) => (
          <div key={h.id} data-earned={progress.visited.includes(h.id)}>
            <span aria-hidden="true">
              {progress.visited.includes(h.id) ? "✓" : "○"}
            </span>
            <strong>{h.title}</strong>
            <small>
              {progress.visited.includes(h.id) ? "Visited" : "Not Visited"}
            </small>
          </div>
        ))}
      </div>
      <h3>Collection Milestones</h3>
      <div className="passport-milestones">
        {milestones.map((m) => (
          <article key={m.id} data-earned={m.complete}>
            <strong>
              {m.complete ? "✓ " : ""}
              {m.name}
            </strong>
            <p>{m.detail}</p>
            <progress
              value={Math.min(m.value, m.goal)}
              max={m.goal}
              aria-label={m.name}
            />
            <span>
              {Math.min(m.value, m.goal)} / {m.goal}
            </span>
            {m.reward && (
              <small>
                {m.complete ? "Unlocked: " : "Reward: "}
                {m.reward}
              </small>
            )}
          </article>
        ))}
      </div>
      {favorites.length > 0 && (
        <>
          <h3>Favorite Finds</h3>
          <div className="passport-favorites">
            {favorites.slice(0, 8).map((s) => (
              <div key={s.id}>
                <CollectionIcon asset={s.art} label={s.name} />
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="island-life-actions">
        <button onClick={onRoom}>My Display Room</button>
        <button onClick={onJournal}>Discoveries & Secrets</button>
        <button onClick={onBackup}>Save Backup</button>
      </div>
    </div>
  );
}
