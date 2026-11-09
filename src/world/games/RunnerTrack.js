// Stone slabs, bridge rails and approaching objects use the same camera.
// Geometry moves in world space instead of sampling a texture in scanlines.
export const runnerCamera = { horizon: 210, feet: 590, near: 13, center: 300 };
export function projectRunner(lane, ahead = 0) {
  const { horizon, feet, near, center } = runnerCamera,
    scale = near / Math.max(near * 0.6, ahead + near);
  return {
    x: center + (lane - 1) * 176 * scale,
    y: horizon + scale * (feet - horizon),
    scale,
  };
}

// A single projected curve keeps tiles, pickups and hazards in their lanes.
const pathCenter = (at) => 2.3 * Math.sin(at / 37) + 0.52 * Math.sin(at / 15);

export function runnerView(distance, visualLane) {
  const origin = pathCenter(distance);
  const follow = (visualLane - 1) * 47;
  // Adjacent slabs share depth samples, so compute the curve once per sample.
  const centers = new Map();
  return (lane, ahead = 0) => {
    if (!centers.has(ahead)) {
      const curve = pathCenter(distance + ahead) - origin;
      centers.set(ahead, projectRunner(1 + curve, ahead));
    }
    const { x, y, scale } = centers.get(ahead);
    return { x: x + (lane - 1) * 176 * scale - follow, y, scale };
  };
}

const stone = ["#637771", "#596f69", "#667e76", "#526964"];
const curb = ["#9a8371", "#ac9380"];
const stride = 5;
const roadLeft = -0.84;
const roadRight = 2.84;

function slab(ctx, project, left, right, near, far, color) {
  const a = project(left, far),
    b = project(right, far);
  const c = project(right, near),
    d = project(left, near);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fill();
}

export function drawRunnerTrack(ctx, distance, project) {
  const cutoff = -3;
  const start = Math.floor((distance + cutoff) / stride);
  const end = Math.floor((distance + 95) / stride);

  for (let row = end; row >= start; row--) {
    const near = Math.max(cutoff, row * stride - distance);
    const far = (row + 1) * stride - distance;
    if (far - near <= 0.08) continue;
    slab(ctx, project, roadLeft, roadRight, near, far + 0.06, "#303d42");
    for (let lane = 0; lane < 3; lane++) {
      const tint =
        (((row * 7 + lane * 5) % stone.length) + stone.length) % stone.length;
      slab(
        ctx,
        project,
        lane - 0.49,
        lane + 0.49,
        near,
        far - 0.08,
        stone[tint],
      );
      if (near < 35 && far - near > 0.36) {
        // Broad bevels stay readable close to the camera without a fine grain
        // that aliases at the horizon.
        slab(
          ctx,
          project,
          lane - 0.47,
          lane + 0.47,
          far - 0.28,
          far - 0.08,
          "#a4b0a54d",
        );
        slab(
          ctx,
          project,
          lane - 0.46,
          lane - 0.41,
          near,
          far - 0.28,
          "#b4c1b731",
        );
      }
    }
    const edge = curb[Math.abs(row) % curb.length];
    slab(ctx, project, roadLeft, -0.51, near, far - 0.06, edge);
    slab(ctx, project, 2.51, roadRight, near, far - 0.06, edge);
    if (near < 55) {
      slab(ctx, project, -0.81, -0.78, near, far - 0.06, "#d3b883");
      slab(ctx, project, 2.78, 2.81, near, far - 0.06, "#d3b883");
    }
  }

  // Paired edge posts give a stronger motion cue than repeating floor grain.
  // A post has a planted base, a shaded shaft and a warm top marker.
  for (let row = end; row >= start; row--) {
    if (row % 2) continue;
    const ahead = row * stride - distance;
    if (ahead < cutoff || ahead > 92) continue;
    for (const lane of [-0.73, 2.73]) {
      const { x, y, scale: s } = project(lane, ahead);
      const tall = row % 6 === 0;
      const h = (tall ? 87 : 39) * s;
      ctx.fillStyle = "#573f37";
      ctx.fillRect(x - 9 * s, y - h, 18 * s, h);
      ctx.fillStyle = "#b28968";
      ctx.fillRect(x - 9 * s, y - h, 5 * s, h - 5 * s);
      ctx.fillStyle = "#f4d28a";
      ctx.fillRect(x - 11 * s, y - h - 4 * s, 22 * s, 5 * s);
      if (tall) {
        const side = lane < 1 ? -1 : 1;
        ctx.fillStyle = "#c96740";
        ctx.beginPath();
        ctx.moveTo(x, y - h + 5 * s);
        ctx.lineTo(x + side * 39 * s, y - h + 8 * s);
        ctx.lineTo(x + side * 31 * s, y - h + 37 * s);
        ctx.lineTo(x, y - h + 29 * s);
        ctx.fill();
        ctx.fillStyle = "#f8dda4";
        ctx.fillRect(x + side * 15 * s - 3 * s, y - h + 14 * s, 6 * s, 9 * s);
      }
    }
  }
}
