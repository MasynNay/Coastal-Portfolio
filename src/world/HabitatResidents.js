import CollectionSprite from "./CollectionSprite";
import { residentLayout } from "./CollectionCounts";
import { bugMotionStyle } from "./WildlifeMotion";
// Species retain their rarity and base markings. Small hue differences distinguish
// residents without turning common catches into rare discoveries.
export default function HabitatResidents({
  species,
  quantity,
  paused,
  aquatic = false,
}) {
  return (
    <span
      className={
        "habitat-residents " + (aquatic ? "is-aquatic" : "is-terrestrial")
      }
      aria-label={`${quantity} ${species.name} residents`}
    >
      {residentLayout(quantity).map((r, i) => (
        <span
          key={i}
          className={"habitat-resident " + (paused ? "is-paused" : "")}
          data-motion={aquatic ? "swim" : bugMotionStyle(species.category)}
          style={{
            left: r.left + "%",
            top: r.top + "%",
            "--resident-scale": r.scale,
            "--resident-delay": r.delay + "s",
            filter: `hue-rotate(${r.hue}deg)`,
          }}
        >
          <CollectionSprite
            asset={species.art}
            paused={paused}
            label={`${species.name} ${i + 1}`}
          />
        </span>
      ))}
    </span>
  );
}
