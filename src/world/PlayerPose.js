import { glideVisual } from "./Glide";
import { abilityActive } from "./Abilities";
import sheets from "./SpriteSheets.json";
import { characterAsset, activityAsset } from "./Wardrobe";
// Mounted fishing is its own pose. Never fall back to a standing body on water,
// including while an optional/custom character's action sheet is unavailable.
export function playerPose(state) {
  if (state.salute && !state.surfing && !state.bikeRide)
    return activityAsset(state.character, state.outfit, "salute", sheets);
  if (state.rest)
    return activityAsset(state.character, state.outfit, "water-ride", sheets);
  if (state.beach?.building)
    return activityAsset(state.character, state.outfit, "board-trick", sheets);
  if (state.grove?.playerFrame != null)
    return activityAsset(state.character, state.outfit, "board-trick", sheets);
  if (state.bikeRide?.phase === "riding") {
    return activityAsset(
      state.character,
      state.outfit,
      "bike-" + state.bikeRide.id,
      sheets,
    );
  }
  const glide = glideVisual(state.abilityEffect, state.worldTime);
  if (glide && sheets[glide.asset]) return glide.asset;
  if (
    !state.surfing &&
    abilityActive(state.abilityEffect, state.worldTime) &&
    sheets[state.abilityEffect.asset]
  )
    return state.abilityEffect.asset;
  const base = characterAsset(state.character, state.outfit);
  if (state.action === "fish") {
    return activityAsset(
      state.character,
      state.outfit,
      state.surfing ? "fish-surf" : "fish",
      sheets,
    );
  }
  if (state.surfing)
    return activityAsset(state.character, state.outfit, "surf", sheets);
  const action = state.action
    ? activityAsset(state.character, state.outfit, state.action, sheets)
    : state.running && state.moving
      ? base + "-run"
      : null;
  return action && sheets[action] ? action : base;
}
