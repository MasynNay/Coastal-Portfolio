import { shoreRuns, shoreReach } from "./Shore";
import { beachStations } from "./BeachActivities";
import { oceanBounds, pierDeck } from "./Coast";
import { artwork } from "./art";
import { authoredFrameTime } from "./animation";
import { ropeGrip } from "./RopeAnchors";
import { personHeight } from "./Movement";
import { playerPose } from "./PlayerPose";

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
// Eight illustrated construction steps: foundation, mould, three towers,
// carved walls, doorway and flags. Each mould is revealed from the base
// upward, without stretching or fading two different castle silhouettes.
export function castleConstruction(progress) {
  const steps = Math.max(0, Math.min(8, progress * 8));
  if (steps === 8)
    return { art: "castle-stage-7", previous: null, reveal: 1, stage: 7 };
  const stage = Math.floor(steps);
  const fraction = Math.min(1, Math.max(0, (steps - stage - 0.16) / 0.64));
  return {
    art: `castle-stage-${stage}`,
    previous: stage ? `castle-stage-${stage - 1}` : null,
    reveal: fraction * fraction * (3 - 2 * fraction),
    stage,
  };
}

export function castleWorkTime(sheet, building) {
  const sequence = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1];
  const fraction = (building.progress * 8) % 1;
  return authoredFrameTime(
    sheet,
    sequence[Math.floor(fraction * sequence.length)],
  );
}

export function drawCastleConstruction(ctx, at, unit, castle, sprite) {
  const { art, previous, reveal } = castle;
  const paint = (id) => sprite(id, castle.x, castle.z, castle.h);
  if (reveal >= 1 || (!previous && reveal === 0)) {
    if (reveal >= 1) paint(art);
    return;
  }
  if (reveal === 0) {
    paint(previous);
    return;
  }
  const p = at(castle.x, castle.z),
    extent = castle.h * unit * 1.15;
  const split = p.y - extent * reveal;
  const left = p.x - extent,
    width = extent * 2;
  const clipped = (id, y, height) => {
    if (!id) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, y, width, height);
    ctx.clip();
    paint(id);
    ctx.restore();
  };
  // Keep only the old part above the construction edge; draw the new part
  // beneath it. Each pixel belongs to exactly one fully opaque stage.
  clipped(previous, p.y - extent - 1, split - (p.y - extent - 1));
  clipped(art, split, p.y + 2 - split);
}

export function beachSprites(state) {
  const progress = state.beach?.castle || 0;
  const building = state.beach?.building;
  return [
    ...(progress > 0
      ? [
          {
            ...beachStations[0],
            ...castleConstruction(progress),
            castle: true,
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
      t = (state.worldTime - activity.building.started) / 1000;
    sprite("beach-bucket", site.x + 2.4, site.z + 0.5, 0.9, 0, false, 0);
    const asset = playerPose(state),
      sheet = artwork[asset];
    if (!sheet) return;
    const hand = ropeGrip(
      at,
      unit,
      {
        asset,
        direction: state.direction,
        moving: true,
        time: castleWorkTime(sheet, activity.building),
        height: personHeight(state.character),
        ...state.position,
      },
      artwork,
    );
    const construction = castleConstruction(activity.building.progress);
    const target = at(
      site.x + 0.45,
      site.z - [0.5, 0.65, 1.5, 1.5, 1.9, 2, 2.65, 2.9][construction.stage],
    );
    ctx.save();
    // Each short shower travels from the builder toward the current top of
    // the structure. No unrelated particles orbit the completed castle.
    ctx.fillStyle = "#d5ad6c";
    for (let i = 0; i < 5; i++) {
      const flight = (t * 2.4 + i * 0.09) % 1;
      ctx.globalAlpha = Math.sin(Math.PI * flight) * 0.85;
      const p = {
        x: hand.x + (target.x - hand.x) * flight + i * unit * 0.025,
        y:
          hand.y +
          (target.y - hand.y) * flight -
          Math.sin(Math.PI * flight) * unit * 0.22,
      };
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
