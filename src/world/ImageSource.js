// A changed atlas gets a new URL, so browser caches cannot hide an artwork update.
export const imageSource = (asset) =>
  asset.src + (asset.revision ? "?v=" + asset.revision : "");
