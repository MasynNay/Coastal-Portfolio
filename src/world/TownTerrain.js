import { beach, beachOutline, pierDeck } from "./Coast";
import { drawShore } from "./BeachScene";
import { drawFence } from "./Fence";
import { streets, privateStreet, pond, isOcean } from "./TownLayout";
import { buildings } from "./config";
import terrain from "./TerrainArt.json";
// The static town is painted once into a small cached map. Walking only composites
// this image and a few animated water highlights; there is no per-frame tile generation.
export function createTownTerrain(imageFor) {
  let cache = null,
    version = null,
    groundVersion = null,
    seaPattern = null,
    seaImage = null;
  const S = 32,
    ORIGIN = 34;
  function build(tile, ground) {
    if (cache && version === tile && groundVersion === ground) return cache;
    const c = document.createElement("canvas");
    c.width = c.height = 68 * S;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    function fill(x, z, w, d, index, fallback) {
      ctx.save();
      ctx.beginPath();
      ctx.rect((x + ORIGIN) * S, (z + ORIGIN) * S, w * S, d * S);
      ctx.clip();
      if (tile && terrain.tiles) {
        const groundIndex = {
          0: 0,
          1: 1,
          3: 2,
          8: 3,
        }[index];
        const source = ground && groundIndex !== undefined ? ground : tile;
        const columns = source === ground ? 2 : 4;
        const sourceIndex = source === ground ? groundIndex : index;
        const cw = source.width / columns,
          ch = source.height / columns;
        const step = source === ground && index < 2 ? 6 : 2;
        for (let tz = Math.floor(z / step) * step; tz < z + d; tz += step)
          for (let tx = Math.floor(x / step) * step; tx < x + w; tx += step) {
            // Mirrored organic tiles meet at identical edges: no dark horizontal
            // seams in the pond and less obvious repetition in the lawns.
            const organic = index === 5;
            ctx.save();
            ctx.translate(
              (tx + ORIGIN + step / 2) * S,
              (tz + ORIGIN + step / 2) * S,
            );
            if (organic)
              ctx.scale(
                Math.floor(tx / 2) % 2 ? -1 : 1,
                Math.floor(tz / 2) % 2 ? -1 : 1,
              );
            ctx.drawImage(
              source,
              (sourceIndex % columns) * cw,
              Math.floor(sourceIndex / columns) * ch,
              cw,
              ch,
              (-step * S) / 2,
              (-step * S) / 2,
              step * S,
              step * S,
            );
            ctx.restore();
          }
      } else {
        ctx.fillStyle = fallback;
        ctx.fillRect((x + ORIGIN) * S, (z + ORIGIN) * S, w * S, d * S);
      }
      if (ground && index === 0) {
        ctx.fillStyle = "#71c9c533";
        ctx.fillRect((x + ORIGIN) * S, (z + ORIGIN) * S, w * S, d * S);
      }
      ctx.restore();
    }
    ctx.clearRect(0, 0, c.width, c.height);
    // The dry beach shares its outline with walking and surfing. Paint it
    // before the pier so the wooden deck remains continuous above the sand.
    ctx.save();
    ctx.beginPath();
    beachOutline.forEach((p, i) => {
      const x = (p.x + ORIGIN) * S,
        y = (p.z + ORIGIN) * S;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.clip();
    fill(
      beach.left - 0.3,
      beach.back - 0.3,
      beach.right - beach.left + 0.6,
      beach.front - beach.back + 1,
      6,
      "#d7c49d",
    );
    ctx.restore();
    fill(-28.5, -29.5, 57, 49.5, 0, "#72a95a");
    // Dark slate streets, with a narrow joined curb instead of unrelated
    // gray rectangles. The grass courtyards keep each home in its own plot.
    for (const r of streets)
      fill(r.x - 0.16, r.z - 0.16, r.w + 0.32, r.d + 0.32, 8, "#86928b");
    for (const r of streets) fill(r.x, r.z, r.w, r.d, 3, "#dbd2b6");
    for (const b of buildings) {
      const front = b.z + 2.9,
        end = privateStreet(b);
      fill(b.x - 1.35, front, 2.7, Math.max(0.3, end - front), 3, "#dbd2b6");
      fill(b.x - 5, front - 0.2, 2.3, 0.7, 14, "#ab8061");
      fill(b.x + 2.7, front - 0.2, 2.3, 0.7, 14, "#ab8061");
    }
    // A sandy play garden fits inside the open eastern courtyard. Rounded edges
    // keep it a landscaped place rather than another block pasted on the floor.
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(
      (11.1 + ORIGIN) * S,
      (-8 + ORIGIN) * S,
      14.5 * S,
      12.2 * S,
      0.8 * S,
    );
    ctx.clip();
    fill(11.1, -8, 14.5, 12.2, 6, "#d7c49d");
    ctx.restore();
    // Ocean promenade, breakwater, and an unobstructed wooden pier.
    fill(-28.5, 19.7, 25.8, 0.3, 8, "#718b91");
    fill(2.7, 19.7, 25.8, 0.3, 8, "#718b91");
    fill(-28.5, -29.5, 0.7, 49.5, 8, "#718b91");
    fill(-28.5, -29.5, 57, 0.5, 8, "#718b91");
    fill(27.9, -29.5, 0.6, 49.5, 8, "#718b91");
    fill(pierDeck.x, pierDeck.z, pierDeck.w, pierDeck.d, 11, "#b99965");
    fill(-3.5, 30.5, 7, 1.3, 10, "#b99965");
    // Pond is clipped out of the grass so art and the elliptical collision match exactly.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      (pond.x + ORIGIN) * S,
      (pond.z + ORIGIN) * S,
      (pond.rx + pond.bank) * S,
      (pond.rz + pond.bank) * S,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "#d1d2a1";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      (pond.x + ORIGIN) * S,
      (pond.z + ORIGIN) * S,
      pond.rx * S,
      pond.rz * S,
      0,
      0,
      Math.PI * 2,
    );
    ctx.clip();
    fill(
      pond.x - pond.rx,
      pond.z - pond.rz,
      pond.rx * 2,
      pond.rz * 2,
      5,
      "#6eb6bd",
    );
    ctx.restore();
    drawFence(
      ctx,
      (x, z) => ({
        x: (x + ORIGIN) * S,
        y: (z + ORIGIN) * S,
      }),
      S,
    );
    cache = c;
    version = tile;
    groundVersion = ground;
    return c;
  }
  return {
    draw(ctx, at, unit, time) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      const tile = imageFor("terrain-tiles");
      if (tile && seaImage !== tile) {
        const c = document.createElement("canvas");
        c.width = c.height = 128;
        const t = c.getContext("2d");
        for (let row = 0; row < 2; row++)
          for (let column = 0; column < 2; column++) {
            t.save();
            t.translate(column * 64 + 32, row * 64 + 32);
            t.scale(column ? -1 : 1, row ? -1 : 1);
            t.drawImage(
              tile,
              0,
              tile.height / 4,
              tile.width / 4,
              tile.height / 4,
              -32,
              -32,
              64,
              64,
            );
            t.restore();
          }
        seaPattern = ctx.createPattern(c, "repeat");
        seaImage = tile;
      }
      // The entire viewport is ocean first, including beyond the playable island's edges.
      const anchor = at(0, 0),
        scale = (unit * 3) / 64,
        dx = (time * 0.006) % 64,
        dy = Math.sin(time / 2200) * 5;
      ctx.save();
      ctx.translate(anchor.x + dx * scale, anchor.y + dy * scale);
      ctx.scale(scale, scale);
      ctx.fillStyle = seaPattern || "#3b849f";
      ctx.fillRect(
        -anchor.x / scale - dx - 64,
        -anchor.y / scale - dy - 64,
        ctx.canvas.width / scale + 128,
        ctx.canvas.height / scale + 128,
      );
      ctx.restore();
      // Keep the painted terrain on a return visit while its tiles reload.
      const image = build(
          tile || version,
          imageFor("garden-tiles") || groundVersion,
        ),
        p = at(-34, -34);
      ctx.drawImage(image, p.x, p.y, 68 * unit, 68 * unit);
      ctx.fillStyle = "#b2e0d866";
      for (let i = 0; i < 45; i++) {
        const x = -29 + ((i * 7.31) % 62),
          z = 22 + ((i * 3.17) % 11);
        if (Math.abs(x) < 3.5 || !isOcean(x, z)) continue;
        const a = at(x + Math.sin(time / 1800 + i) * 0.15, z);
        ctx.fillRect(a.x, a.y, unit * 0.65, Math.max(1, unit * 0.035));
      }
      drawShore(ctx, at, unit, time);
      for (let i = 0; i < 12; i++) {
        const a = at(
          pond.x + Math.sin(i * 3.7) * 3.5 + Math.sin(time / 1600 + i) * 0.1,
          pond.z + Math.cos(i * 6.1) * 2.5,
        );
        ctx.fillRect(a.x, a.y, unit * 0.4, Math.max(1, unit * 0.025));
      }
      ctx.restore();
    },
    dispose() {
      cache = null;
      version = null;
      groundVersion = null;
    },
  };
}
