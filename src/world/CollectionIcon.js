import CollectionSprite from "./CollectionSprite";
// One image well for every collection entry. Intrinsic artwork never changes a
// card's size; the full frame fits inside it, including wings and antennae.
export default function CollectionIcon({ asset, label }) {
  return (
    <span className="collection-icon">
      <CollectionSprite asset={asset} label={label} paused />
    </span>
  );
}
