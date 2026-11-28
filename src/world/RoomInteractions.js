import places from "./PlaceArt.json";
import { roomBounds } from "./WorldLayout";

// Interior artwork is drawn at the room's full width, preserving its aspect.
// Convert an object's source-image foot position into the same world space so
// interaction targets stay attached to the real chests/light at every zoom.
function artPoint(room, x, y) {
  const scale = (roomBounds.halfWidth * 2) / places[`interior-${room}`].width;
  return {
    x: -roomBounds.halfWidth + x * scale,
    z: roomBounds.back + y * scale,
  };
}
export const lodgeChests = {
  ...artPoint("lodge", 1000, 272),
  id: "lodge-arcade",
  type: "room-arcade",
  label: "Open game cartridges",
};
// The back-left workstation in the Pokémon house, just in front of its
// painted stool. Its floor position is reachable without walking into a wall.
export const asciiComputer = {
  ...artPoint("portfolio", 360, 220),
  id: "portfolio-ascii",
  type: "room-ascii",
  label: "Open ASCII Studio",
};
export const loveLight = {
  ...artPoint("home", 1094, 228),
  id: "love-letter",
  type: "love-letter",
  label: "A Message For My Love",
};
// The cabinet occupies the former far-right bookcase. The interaction is
// placed on the clear floor in front of the cabinet's threshold.
export const wizardWardrobe = {
  ...artPoint("resume", places["interior-resume"].width * 0.867, 277),
  id: "wizard-wardrobe",
  type: "room-wardrobe",
  label: "Open Wardrobe",
};
export const wardrobeFootprint = {
  x: wizardWardrobe.x,
  z: wizardWardrobe.z - 0.93,
  w: 1.62,
  d: 0.68,
};

export function isLoveOffering(room, actor, effect) {
  if (room !== "home" || actor.id !== "mi-shell" || effect?.kind !== "money")
    return false;
  const dx = loveLight.x - actor.x,
    dz = loveLight.z - actor.z;
  const distance = Math.hypot(dx, dz);
  if (distance > 2.6) return false;
  // Accept standing at the light, or throwing toward it from either aisle.
  const angle = (actor.direction * Math.PI) / 4;
  return (
    distance < 0.35 ||
    (dx * Math.sin(angle) + dz * Math.cos(angle)) / distance >= 0.1
  );
}

export function createRoomInteractions(savedSecrets = []) {
  let unlocked = savedSecrets.includes(loveLight.id);
  return {
    points(room) {
      if (room === "lodge") return [lodgeChests];
      if (room === "portfolio") return [asciiComputer];
      if (room === "resume") return [wizardWardrobe];
      if (room === "home" && unlocked) return [loveLight];
      return [];
    },
    revealLove() {
      if (unlocked) return false;
      unlocked = true;
      return true;
    },
  };
}
