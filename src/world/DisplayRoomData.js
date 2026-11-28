import { collectionIds } from "./CollectionPreferences";
export const displayRoomKey = "island-display-room";
export const roomThemes = {
  coast: "Coastal Study",
  moon: "Moonlit Library",
  fern: "Fern Conservatory",
};
export function cleanDisplayRoom(value) {
  return {
    theme: Object.hasOwn(roomThemes, value?.theme) ? value.theme : "coast",
    slots: Array.from({ length: 6 }, (_, i) => {
      const item = value?.slots?.[i];
      return collectionIds[item?.kind]?.has(item.id)
        ? { kind: item.kind, id: item.id }
        : null;
    }),
  };
}
export function readDisplayRoom() {
  try {
    return cleanDisplayRoom(JSON.parse(localStorage.getItem(displayRoomKey)));
  } catch {
    return cleanDisplayRoom(null);
  }
}
export function saveDisplayRoom(value) {
  const clean = cleanDisplayRoom(value);
  try {
    localStorage.setItem(displayRoomKey, JSON.stringify(clean));
    return true;
  } catch {
    return false;
  }
}
