import { shoreRuns, shoreReach } from "./Shore";
import { beachStations } from "./BeachActivities";
import { oceanBounds, pierDeck } from "./Coast";

// Reuse tide samples rather than allocating coast geometry each animation frame.
const shoreReaches = shoreRuns.map((coast) => new Float32Array(coast.length));

// The wash is a filled ribbon anchored offshore, not an inland stroke. Every
// layer joins the ocean, so receding waves never expose a second dry sand line
// behind the foam. Collision and the minimap retain the shared fixed shoreline.
export function drawShore(ctx, at, unit, time) {
  ctx.save();
  const origin = at(0, 0);
  ctx.translate(origin.x, origin.y);
  ctx.scale(unit, unit);
  // Wash reaches the wood on both sides, without painting water over the deck.
  ctx.beginPath();
  ctx.rect(
    oceanBounds.left,
    oceanBounds.back,
    oceanBounds.right - oceanBounds.left,
    oceanBounds.front - oceanBounds.back,
  );
  ctx.rect(pierDeck.x, pierDeck.z, pierDeck.w, pierDeck.d);
  ctx.clip("evenodd");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let run = 0; run < shoreRuns.length; run++) {
    const coast = shoreRuns[run],
      reaches = shoreReaches[run];
    for (let i = 0; i < coast.length; i++)
      reaches[i] = shoreReach(coast[i], time);
    // Overlapping low-opacity ribbons soften the water-to-sand transition.
    // Each shares the same offshore edge, including while the tide retreats.
    for (let band = 0; band < 5; band++) {
      const fraction = 1 - band * 0.15;
      ctx.beginPath();
      for (let i = 0; i < coast.length; i++) {
        const p = coast[i],
          x = p.x - p.nx * 0.25,
          z = p.z - p.nz * 0.25;
        if (i === 0) ctx.moveTo(x, z);
        else ctx.lineTo(x, z);
      }
      for (let i = coast.length - 1; i >= 0; i--) {
        const p = coast[i],
          distance = reaches[i] * fraction;
        ctx.lineTo(p.x + p.nx * distance, p.z + p.nz * distance);
      }
      ctx.closePath();
      ctx.fillStyle =
        band === 0 ? "rgba(99,181,184,.34)" : "rgba(32,137,187,.17)";
      ctx.fill();
    }
    // One coherent leading edge follows the same front as the filled wash.
    ctx.beginPath();
    for (let i = 0; i < coast.length; i++) {
      const p = coast[i],
        distance = reaches[i],
        x = p.x + p.nx * distance,
        z = p.z + p.nz * distance;
      if (i === 0) ctx.moveTo(x, z);
      else ctx.lineTo(x, z);
    }
    ctx.strokeStyle = "rgba(240,252,239,.6)";
    ctx.lineWidth = Math.max(1 / unit, 0.065);
    ctx.stroke();
  }
  ctx.restore();
}
export function drawFootprints(ctx, at, unit, state) {
  ctx.save();
  for (const step of state.beach?.footprints || []) {
    const age = state.worldTime - step.time;
    const angle = (-step.direction * Math.PI) / 4;
    const p = at(
      step.x + Math.cos(angle) * step.side * 0.12,
      step.z + Math.sin(angle) * step.side * 0.12,
    );
    ctx.fillStyle = `rgba(119,89,54,${Math.max(0, 1 - age / 14000) * 0.32})`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, unit * 0.075, unit * 0.14, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
export function beachSprites(state) {
  const progress = state.beach?.castle || 0;
  const building = state.beach?.building;
  return [
    ...(progress > 0.07
      ? [
          {
            ...beachStations[0],
            art: `castle-stage-${Math.min(7, Math.floor(progress * 8))}`,
            h: 3.15,
          },
        ]
      : []),
    ...(!building && progress === 0
      ? [{ ...beachStations[0], art: "beach-bucket", h: 1.05 }]
      : []),
    ...(!state.beach?.kite
      ? [{ ...beachStations[1], art: "beach-kite", h: 1.75 }]
      : []),
    ...(state.shells || []),
    ...(state.glassFloats || [])
      .filter(
        (f) =>
          state.worldTime - (state.floatHunt?.started ?? -Infinity) >=
          f.index * 45,
      )
      .map((f) => ({
        ...f,
        lift: 0.06 + Math.sin(state.worldTime / 850 + f.index) * 0.04,
      })),
  ];
}
// The spool anchors the beach activity. Its kite follows the current character,
// so every costume can fly it without substituting another person's body sheet.
export function drawBeachActivities(ctx, at, unit, state, sprite) {
  const activity = state.beach;
  if (!activity) return;
  if (activity.building) {
    const site = beachStations[0],
      t = state.worldTime / 250;
    sprite("beach-bucket", site.x + 1.2, site.z + 0.5, 0.9, 0, false, 0);
    ctx.save();
    ctx.fillStyle = "#e1bc7a";
    for (let i = 0; i < 9; i++) {
      const p = at(
        site.x + 0.7 + Math.sin(t + i) * 0.35,
        site.z - 0.15 - Math.abs(Math.sin(t + i * 0.7)) * 0.55,
      );
      ctx.beginPath();
      ctx.ellipse(
        p.x,
        p.y,
        Math.max(1, unit * 0.025),
        Math.max(1, unit * 0.018),
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }
  if (activity.kite) {
    const t = (state.worldTime - activity.kite.started) / 1000;
    const hand = at(state.position.x + 0.25, state.position.z - 0.9);
    const direction = activity.kite.direction || 0;
    const kite = {
      x:
        state.position.x +
        (activity.kite.dx || 0) * 2.1 +
        Math.sin(t * 0.9) * 0.2,
      z:
        state.position.z -
        3.4 +
        (activity.kite.dz || 0) * 1.5 +
        Math.sin(t * 1.4) * 0.15,
    };
    const end = at(kite.x, kite.z - 0.8);
    ctx.save();
    ctx.strokeStyle = "#f6e7b9";
    ctx.lineWidth = Math.max(1, unit * 0.025);
    ctx.beginPath();
    ctx.moveTo(hand.x, hand.y);
    ctx.quadraticCurveTo(
      (hand.x + end.x) / 2,
      hand.y - 0.4 * unit,
      end.x,
      end.y,
    );
    ctx.stroke();
    ctx.restore();
    sprite("beach-kite", kite.x, kite.z, 2.8, direction, true, state.worldTime);
  }
}
