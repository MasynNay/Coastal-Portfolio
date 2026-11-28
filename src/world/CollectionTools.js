// Shared collection controls keep the same touch targets in both habitat screens.
export default function CollectionTools({
  favorite,
  onFavorite,
  onlyFavorites,
  onOnlyFavorites,
  sort,
  onSort,
}) {
  return (
    <div className="collection-tools">
      {onFavorite && (
        <button aria-pressed={favorite} onClick={onFavorite}>
          {favorite ? "★ Favorite" : "☆ Add Favorite"}
        </button>
      )}
      <button
        aria-pressed={onlyFavorites}
        onClick={() => onOnlyFavorites(!onlyFavorites)}
      >
        Favorites Only
      </button>
      <label>
        Sort By
        <select value={sort} onChange={(e) => onSort(e.target.value)}>
          <option>Name</option>
          <option>Rarity</option>
        </select>
      </label>
    </div>
  );
}
