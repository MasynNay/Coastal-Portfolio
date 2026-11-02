import { collectionProgress } from "./CollectionCounts";
// The field guide tracks discoveries separately from duplicate resident counts.
export default function CollectionProgress({
  species,
  count,
  discovered,
  noun = "residents",
}) {
  const p = collectionProgress(species, count, discovered);
  return (
    <details className="collection-progress">
      <summary>
        Collection progress · {p.found} / {p.possible} species
      </summary>
      <dl className="collection-totals">
        <div>
          <dt>Different species found</dt>
          <dd>
            {p.found} / {p.possible}
          </dd>
        </div>
        <div>
          <dt>Total {noun}</dt>
          <dd>{p.residents}</dd>
        </div>
        <div>
          <dt>Still to discover</dt>
          <dd>{p.remaining}</dd>
        </div>
      </dl>
      <div className="collection-category-progress">
        {p.groups.map((g) => (
          <div key={g.name}>
            <span>{g.name}</span>
            <meter
              min="0"
              max={g.possible}
              value={g.found}
              aria-label={`${g.name} species found`}
            />
            <strong>
              {g.found} / {g.possible}
            </strong>
          </div>
        ))}
      </div>
      <p className="activity-note">
        Duplicate finds increase the quantity in your collection. Each species
        counts once toward discovery progress.
      </p>
    </details>
  );
}
