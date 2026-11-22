import { useEffect, useRef, useState } from "react";

// Visual care is intentionally separate from collecting: feeding never creates
// discoveries, consumes a resident, or changes a saved rarity. One short-lived
// effect feeds every visible resident and cleans up when a habitat closes.
export function habitatFood(species, aquatic = false) {
  if (aquatic) {
    if (/shark|piranha|moray|octopus|cuttlefish/i.test(species.name))
      return { label: "Fish bites", kind: "bites" };
    if (/shrimp|snail|turtle|pleco|crayfish/i.test(species.name))
      return { label: "Algae wafers", kind: "leaf" };
    if (/frog|axolotl|newt/i.test(species.name))
      return { label: "Aquatic invertebrates", kind: "bites" };
    return { label: "Fish food", kind: "flakes" };
  }
  return (
    {
      Spiders: { label: "Fruit flies", kind: "flies" },
      Mantises: { label: "Small flies", kind: "flies" },
      Butterflies: { label: "Flower nectar", kind: "nectar" },
      Ladybugs: { label: "Aphids", kind: "aphids" },
      Dragonflies: { label: "Small flies", kind: "flies" },
    }[species.category] || { label: "Small flies", kind: "flies" }
  );
}
export default function HabitatCare({ species, quantity, aquatic = false }) {
  const [effect, setEffect] = useState(null),
    [message, setMessage] = useState("");
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const food = habitatFood(species, aquatic);
  function care(kind) {
    clearTimeout(timer.current);
    setEffect({ kind, key: Date.now() });
    setMessage(
      kind === "food"
        ? quantity === 1
          ? `${food.label} for ${species.name}.`
          : `${food.label} for all ${quantity} ${species.name} residents.`
        : aquatic
          ? "Fresh, conditioned water added gently to the aquarium."
          : "A light mist leaves tiny drinking droplets on the habitat plants.",
    );
    timer.current = setTimeout(() => setEffect(null), 3200);
  }
  return (
    <div className="habitat-care">
      {effect && (
        <span
          key={effect.key}
          aria-hidden="true"
          className={`habitat-care-particles ${effect.kind === "water" ? "is-water" : "is-" + food.kind}`}
        >
          {Array.from({ length: 16 }, (_, i) => (
            <i
              key={i}
              style={{
                "--drop-x": `${8 + ((i * 31) % 84)}%`,
                "--drop-delay": `${i * 65}ms`,
                "--drift": `${((i % 3) - 1) * 24}px`,
              }}
            />
          ))}
        </span>
      )}
      <div className="habitat-care-buttons">
        <button onClick={() => care("food")} disabled={!!effect}>
          Feed All <small>{food.label}</small>
        </button>
        <button onClick={() => care("water")} disabled={!!effect}>
          {aquatic ? "Refresh Water" : "Mist Habitat"}
          <small>
            {aquatic ? "A gentle water change" : "Drinking droplets"}
          </small>
        </button>
      </div>
      <p role="status" className="habitat-care-status">
        {message || "A little care for everyone in this habitat."}
      </p>
    </div>
  );
}
