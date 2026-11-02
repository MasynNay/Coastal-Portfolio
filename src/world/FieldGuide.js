import { shellSpecies, discoveredShells } from "./Shells";
import { useState } from "react";
import { bugSpecies, discoveredBugs } from "./Bugs";
import { fishSpecies, discoveredFish } from "./Fish";
import CollectionGuide from "./CollectionGuide";
// One discovery book, separate from the habitats where caught residents live.
export default function FieldGuide({
  bugs,
  fish,
  shells = {},
  initialSection = "bugs",
}) {
  const [section, setSection] = useState(initialSection);
  const groups = [
    {
      id: "bugs",
      title: "Bugs & spiders",
      species: bugSpecies,
      counts: bugs,
      known: discoveredBugs(bugs),
    },
    {
      id: "fish",
      title: "Aquatic life",
      species: fishSpecies,
      counts: fish,
      known: discoveredFish(fish),
    },
    {
      id: "shells",
      title: "Seashells",
      species: shellSpecies,
      counts: shells,
      known: discoveredShells(shells),
      noun: "shells",
    },
  ];
  const current = groups.find((g) => g.id === section);
  return (
    <div className="island-field-guide">
      <p>
        Your island discoveries, all in one place. Repeat catches count once
        toward completion.
      </p>
      <nav className="field-guide-sections" aria-label="Field guide sections">
        {groups.map((g) => {
          const found = g.species.filter((s) => g.known[s.id] > 0).length;
          return (
            <button
              key={g.id}
              aria-pressed={section === g.id}
              onClick={() => setSection(g.id)}
            >
              <strong>{g.title}</strong>
              <span>
                {found} / {g.species.length} discovered
              </span>
              <progress
                value={found}
                max={g.species.length}
                aria-label={`${g.title} completion`}
              />
            </button>
          );
        })}
      </nav>
      <CollectionGuide
        key={section}
        title={current.title}
        species={current.species}
        count={(id) => current.counts[id] || 0}
        discovered={(id) => current.known[id] > 0}
        noun={current.noun}
        initialOpen
      />
    </div>
  );
}
