import { beachOutline } from "./Coast";
import { buildings } from "./config";
import { pond, streets, privateStreet } from "./TownLayout";
import { buildingHeight } from "./WorldLayout";
import places from "./PlaceArt.json";
import { rideStops } from "./Riding";

// Every element uses the same unrotated world projection: x goes right, z down.
// Bounds include the ocean edge and the whole pier; icons aren't spaced by hand.
export const miniBounds = { x: -38, z: -38, width: 76, height: 76 };
export function miniPoint(point) {
  return {
    left: ((point.x - miniBounds.x) / miniBounds.width) * 100,
    top: ((point.z - miniBounds.z) / miniBounds.height) * 100,
  };
}
export function miniHome(id) {
  const b = buildings.find((b) => b.id === id);
  if (!b) return null;
  const art = places["building-" + id];
  const height = buildingHeight(b);
  return {
    ...miniPoint({ x: b.x, z: b.z + 3.1 }),
    width: ((height * art.width) / art.height / miniBounds.width) * 100,
    height: (height / miniBounds.height) * 100,
  };
}
export function MiniMapTerrain() {
  return (
    <svg className="mini-terrain" viewBox="-38 -38 76 76" aria-hidden="true">
      <rect x="-38" y="-38" width="76" height="76" fill="#173f50" />
      <polygon
        points={beachOutline.map((p) => `${p.x},${p.z}`).join(" ")}
        fill="#d7c49d"
      />
      <rect
        x="-28.5"
        y="-29.5"
        width="57"
        height="49.5"
        rx=".4"
        fill="#476d58"
        stroke="#b5c8ab"
        strokeWidth=".5"
      />
      {streets.map((r, i) => (
        <rect key={i} x={r.x} y={r.z} width={r.w} height={r.d} fill="#798482" />
      ))}
      {buildings.map((b) => (
        <rect
          key={b.id}
          x={b.x - 1.35}
          y={b.z + 2.9}
          width="2.7"
          height={Math.max(0.3, privateStreet(b) - b.z - 2.9)}
          fill="#798482"
        />
      ))}
      <rect x="11.1" y="-8" width="14.5" height="12.2" rx=".8" fill="#a0936b" />
      <rect x="-3" y="20" width="6" height="12" fill="#b09265" />
      <rect x="-3.5" y="30.5" width="7" height="1.3" fill="#cab381" />
      <ellipse
        cx={pond.x}
        cy={pond.z}
        rx={pond.rx + 0.5}
        ry={pond.rz + 0.5}
        fill="#b2c298"
      />
    </svg>
  );
}

// One map supplies both the desktop HUD and the mobile map panel. Marker
// positions always use world coordinates; the parent owns travel and pausing.
export function VillageMap({ room, playerRef, onTravel, onRide }) {
  return (
    <nav className="world-mini-map" aria-label="Island map">
      <MiniMapTerrain />
      <i
        data-room={room ? "inside" : "outside"}
        className="mini-player"
        ref={playerRef}
        aria-label="Your position"
      />
      {buildings.map((b) => (
        <button
          key={b.id}
          title={b.title}
          aria-label={`Fly to ${b.title}`}
          style={{
            left: `${miniHome(b.id).left}%`,
            top: `${miniHome(b.id).top}%`,
            width: `${miniHome(b.id).width}%`,
            height: `${miniHome(b.id).height}%`,
          }}
          onClick={() => onTravel(b.id)}
        >
          <img src={places["building-" + b.id].src} alt="" />
        </button>
      ))}
      {rideStops
        .filter((stop) => stop.icon)
        .map((stop) => (
          <button
            key={stop.id}
            className="mini-ride"
            disabled={!!room}
            style={{
              left: miniPoint(stop.mapPosition || stop).left + "%",
              top: miniPoint(stop.mapPosition || stop).top + "%",
            }}
            aria-label={"Walk to " + stop.title}
            title={"Walk to " + stop.title}
            onClick={() => onRide(stop.id)}
          >
            <img src={"/world/sprites/" + stop.icon + "-icon.png"} alt="" />
          </button>
        ))}
      <button
        className="mini-pond"
        style={{
          left: `${miniPoint(pond).left}%`,
          top: `${miniPoint(pond).top}%`,
          width: `${((pond.rx * 2) / miniBounds.width) * 100}%`,
          height: `${((pond.rz * 2) / miniBounds.height) * 100}%`,
        }}
        aria-label="Fly to pond and surf"
        title="Fly to the pond · surf"
        onClick={() => onTravel("pond")}
      >
        <img src="/world/sprites/pond-icon.png" alt="" />
      </button>
    </nav>
  );
}
