import { rarities } from "./Rarity";
import CollectionProgress from "./CollectionProgress";
import { useState } from "react";
import SpritePose from "./SpritePose";
import { artwork } from "./art";
import { fishHabitats } from "./Fish";

// Both collections share a searchable guide. Closed guides mount no sprite
// previews, and the island never loads the larger inspection images for them.
export default function CollectionGuide({
  title,
  noun = "residents",
  species,
  count,
  discovered = (id) => count(id) > 0,
  initialOpen = false,
}) {
  const [open, setOpen] = useState(initialOpen),
    [query, setQuery] = useState(""),
    [rarity, setRarity] = useState("All"),
    [category, setCategory] = useState("All"),
    [habitat, setHabitat] = useState("All"),
    [page, setPage] = useState(0);
  const groups = [...new Set(species.map((s) => s.category).filter(Boolean))];
  const habitats = [...new Set(species.map((s) => s.habitat).filter(Boolean))];
  const owned = species.filter((s) => discovered(s.id)).length;
  const visible = species.filter(
    (s) =>
      (rarity === "All" || s.rarity === rarity) &&
      (category === "All" || s.category === category) &&
      (habitat === "All" || s.habitat === habitat) &&
      `${s.name} ${s.design || ""} ${s.category || ""} ${fishHabitats[s.habitat] || ""}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  // Mount only a page of small previews. A 500-species guide must not decode
  // hundreds of sprite images when someone opens Inventory on a phone.
  const pageSize = 40;
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(visible.length / pageSize) - 1),
  );
  const start = currentPage * pageSize;
  const entries = visible.slice(start, start + pageSize);
  return (
    <details
      className="collection-guide"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        {title} · {owned} / {species.length} found
      </summary>
      {open && (
        <>
          <CollectionProgress
            noun={noun}
            species={species}
            count={count}
            discovered={discovered}
          />
          <div className="collection-filters">
            {habitats.length > 1 && (
              <label>
                Water
                <select
                  value={habitat}
                  onChange={(e) => {
                    setHabitat(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value="All">All waters</option>
                  {habitats.map((id) => (
                    <option value={id} key={id}>
                      {fishHabitats[id]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Find a species
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search by name or markings"
              />
            </label>
            <label>
              Rarity
              <select
                value={rarity}
                onChange={(e) => {
                  setRarity(e.target.value);
                  setPage(0);
                }}
              >
                {["All", ...rarities].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            {groups.length > 1 && (
              <label>
                Type
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(0);
                  }}
                >
                  {["All", ...groups].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="species-guide">
            {entries.map((s) => (
              <article
                className="species-card"
                data-discovered={!!discovered(s.id)}
                key={s.id}
                title={s.description || s.design}
              >
                <span className="species-portrait">
                  <SpritePose
                    asset={s.art}
                    playing={false}
                    scale={42 / (artwork[s.art]?.bodyHeight || 32)}
                    label={
                      discovered(s.id)
                        ? s.name
                        : "Undiscovered species silhouette"
                    }
                  />
                  {!discovered(s.id) && (
                    <span className="species-lock" aria-hidden="true">
                      ?
                    </span>
                  )}
                </span>
                <strong>{s.name}</strong>
                {s.habitat && <small>{fishHabitats[s.habitat]}</small>}
                <small className="collection-rarity" data-rarity={s.rarity}>
                  {s.rarity}
                </small>
                <small>
                  {count(s.id)
                    ? `In your collection · ${count(s.id)}`
                    : discovered(s.id)
                      ? "Discovered · released"
                      : "Not discovered"}
                </small>
              </article>
            ))}
          </div>
          {visible.length > pageSize && (
            <nav className="collection-pages" aria-label={`${title} pages`}>
              <button
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>
              <span aria-live="polite">
                {start + 1}–{Math.min(start + pageSize, visible.length)} of{" "}
                {visible.length}
              </span>
              <button
                disabled={start + pageSize >= visible.length}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </nav>
          )}
          {!visible.length && (
            <p>No matching species. Try a different search.</p>
          )}
        </>
      )}
    </details>
  );
}
