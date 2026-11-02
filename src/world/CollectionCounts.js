// Storage contains quantities, while discovery progress counts distinct IDs.
// Legacy bug saves were ID arrays; migrate each discovered species to quantity one.
export function cleanCounts(saved, validIds) {
  const value = Array.isArray(saved)
    ? Object.fromEntries(saved.map((id) => [id, 1]))
    : saved;
  return Object.fromEntries(
    [...validIds].flatMap((id) =>
      Number.isSafeInteger(value?.[id]) && value[id] > 0
        ? [[id, Math.min(999999, value[id])]]
        : [],
    ),
  );
}
export function changeCount(saved, id, amount, validIds) {
  const clean = cleanCounts(saved, validIds);
  if (!validIds.has(id)) return clean;
  const count = Math.max(0, Math.min(999999, (clean[id] || 0) + amount));
  if (count) clean[id] = count;
  else delete clean[id];
  return clean;
}
export const totalResidents = (counts) =>
  Object.values(counts).reduce((sum, n) => sum + n, 0);
// Discovery belongs to the guide; releasing the last resident must not relock it.
export function readDiscoveries(key, current, validIds) {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(key) || "{}");
  } catch {}
  const known = {
    ...cleanCounts(saved, validIds),
    ...cleanCounts(current, validIds),
  };
  return Object.fromEntries(Object.keys(known).map((id) => [id, 1]));
}
export function rememberDiscoveries(key, current, validIds) {
  const known = readDiscoveries(key, current, validIds);
  try {
    localStorage.setItem(key, JSON.stringify(known));
  } catch {}
  return known;
}
// Only eight creatures are drawn, regardless of saved quantity. Increasing groups
// become smaller and occupy fixed separated lanes; counters always show the total.
export function residentLayout(quantity) {
  const count = Math.min(8, Math.max(0, quantity)),
    scale = count === 1 ? 1 : count <= 3 ? 0.72 : count <= 5 ? 0.57 : 0.46;
  return Array.from({ length: count }, (_, i) => ({
    left: count === 1 ? 50 : count <= 3 ? 22 + i * 28 : 18 + (i % 4) * 21,
    top:
      count === 1
        ? 50
        : count <= 3
          ? 42 + (i % 2) * 17
          : 32 + Math.floor(i / 4) * 31,
    scale,
    hue: [0, 5, -5, 9, -8, 3, -3, 7][i],
    delay: -i * 0.47,
  }));
}

export function collectionProgress(
  species,
  count,
  discovered = (id) => count(id) > 0,
) {
  const found = species.filter((s) => discovered(s.id)).length;
  const groups = [...new Set(species.map((s) => s.category || "Other"))];
  return {
    found,
    possible: species.length,
    remaining: species.length - found,
    residents: species.reduce((sum, s) => sum + count(s.id), 0),
    groups: groups.map((name) => {
      const entries = species.filter((s) => (s.category || "Other") === name);
      return {
        name,
        found: entries.filter((s) => discovered(s.id)).length,
        possible: entries.length,
      };
    }),
  };
}
