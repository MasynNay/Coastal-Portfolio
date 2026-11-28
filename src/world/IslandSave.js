import { cleanCounts } from "./CollectionCounts";
import { cleanAquariums } from "./Fish";
import {
  collectionIds,
  cleanPreferences,
  preferenceKey,
} from "./CollectionPreferences";
import { cleanDisplayRoom, displayRoomKey } from "./DisplayRoomData";
import { normalizeCardCollection, cleanCards } from "./CardCollection";
import { buildings } from "./config";
import { islandSecrets } from "./IslandJournal";
import { glassFloats } from "./FloatHunt";
import { bugHomes } from "./BugHomes";

const progressKey = "masyn-world-v1";
const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const unique = (values, valid) => [
  ...new Set(
    (Array.isArray(values) ? values : []).filter((id) => valid.has(id)),
  ),
];
const number = (v) =>
  Math.min(999999999, Math.max(0, Math.floor(Number(v) || 0)));
const count = (ids) => (v) => cleanCounts(v, ids);
// This explicit registry deliberately excludes credentials, emulator saves and
// unrelated browser data. A backup can write only these island-owned keys.
export const saveRegistry = {
  [progressKey]: (v) => ({
    visited: unique(v?.visited, new Set(buildings.map((b) => b.id))),
    secrets: unique(v?.secrets, new Set(islandSecrets.map((s) => s.id))),
  }),
  "world-spiders": count(collectionIds.bugs),
  "world-aquariums": cleanAquariums,
  "world-shells": count(collectionIds.shells),
  "world-bug-discoveries": count(collectionIds.bugs),
  "world-fish-discoveries": count(collectionIds.fish),
  "world-shell-discoveries": count(collectionIds.shells),
  "world-bug-homes": (v) =>
    Object.fromEntries(
      Object.entries(object(v) ? v : {}).filter(
        ([id, home]) =>
          collectionIds.bugs.has(id) && Object.hasOwn(bugHomes, home),
      ),
    ),
  "island-card-collection-v2": (v) => {
    const clean = normalizeCardCollection(v);
    if (!clean) throw Error("The card collection is not a supported save.");
    return clean;
  },
  "island-card-packs-v1": cleanCards,
  "world-glass-floats": (v) => {
    const ids = new Set(glassFloats.map((f) => f.id));
    const positions = (Array.isArray(v?.positions) ? v.positions : [])
      .filter(
        (p) =>
          object(p) &&
          Number.isFinite(p.x) &&
          Number.isFinite(p.z) &&
          Math.abs(p.x) < 34 &&
          p.z > -34 &&
          p.z < 25,
      )
      .map((p) => ({ x: p.x, z: p.z }));
    return {
      active: !!v?.active,
      found: unique(v?.found, ids),
      discovered: unique(v?.discovered || v?.found, ids),
      positions: positions.length === 20 ? positions : [],
    };
  },
  "island-no-face-gold": number,
  "masyn-axolotl-drift-best": number,
  "element-runner-best": number,
  [preferenceKey]: cleanPreferences,
  [displayRoomKey]: cleanDisplayRoom,
  "island-audio-settings": (v) => ({
    enabled: !!v?.enabled,
    volume: Math.max(0, Math.min(1, Number(v?.volume) || 0)),
  }),
};
export function createIslandBackup(storage = localStorage) {
  const entries = {};
  for (const key of Object.keys(saveRegistry)) {
    const raw = storage.getItem(key);
    if (raw === null) {
      entries[key] = null;
      continue;
    }
    try {
      entries[key] = saveRegistry[key](JSON.parse(raw));
    } catch {
      throw Error(
        `Could not read ${key}. Your current save has not been changed.`,
      );
    }
  }
  return {
    format: "windfall-coast-save",
    version: 1,
    savedAt: new Date().toISOString(),
    entries,
  };
}
export function parseIslandBackup(text) {
  if (typeof text !== "string" || text.length > 2 * 1024 * 1024)
    throw Error("Choose an island backup smaller than 2 MB.");
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw Error("This file is not valid JSON.");
  }
  if (
    value?.format !== "windfall-coast-save" ||
    value.version !== 1 ||
    !object(value.entries)
  )
    throw Error("This is not a supported Windfall Coast backup.");
  const entries = {};
  for (const [key, data] of Object.entries(value.entries)) {
    if (!Object.hasOwn(saveRegistry, key))
      throw Error("The backup contains an unrecognized setting.");
    if (
      data !== null &&
      !object(data) &&
      ![
        "island-no-face-gold",
        "masyn-axolotl-drift-best",
        "element-runner-best",
      ].includes(key) &&
      !Array.isArray(data)
    )
      throw Error("The backup contains invalid collection data.");
    entries[key] = data === null ? null : saveRegistry[key](data);
  }
  if (!Object.hasOwn(entries, progressKey))
    throw Error("The backup is missing island progress.");
  return {
    format: value.format,
    version: 1,
    savedAt: typeof value.savedAt === "string" ? value.savedAt : null,
    entries,
  };
}
// Roll back every touched key if quota/private-storage blocks any write. Import
// is a deliberate replacement of the previewed keys, never a silent merge.
export function restoreIslandBackup(backup, storage = localStorage) {
  const checked = parseIslandBackup(JSON.stringify(backup));
  const before = Object.fromEntries(
    Object.keys(checked.entries).map((k) => [k, storage.getItem(k)]),
  );
  try {
    for (const [key, data] of Object.entries(checked.entries)) {
      if (data === null) storage.removeItem(key);
      else storage.setItem(key, JSON.stringify(data));
    }
  } catch {
    for (const [key, raw] of Object.entries(before)) {
      try {
        if (raw === null) storage.removeItem(key);
        else storage.setItem(key, raw);
      } catch {}
    }
    throw Error(
      "The backup could not be restored. Your previous save was kept; check device storage and try again.",
    );
  }
}
export function backupSummary(backup) {
  const e = backup.entries;
  return {
    homes: e[progressKey]?.visited?.length || 0,
    bugs: Object.keys(e["world-spiders"] || {}).length,
    fish: Object.keys(e["world-aquariums"] || {}).length,
    cards: Object.keys(e["island-card-collection-v2"]?.cards || {}).length,
  };
}
export function downloadIslandBackup(backup) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `windfall-coast-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
