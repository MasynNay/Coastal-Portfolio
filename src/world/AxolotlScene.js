import { flightSize, flightRules } from "./AxolotlFlight";
import { drawSprite } from "./art";
import { movementDirection } from "./animation";
import eelArt from "./EelArt.json";

// Canvas artwork is separate from the React dialog, input handlers and physics.
// The renderer reads the same immutable round snapshot on every device.
export function createAxolotlScene(ctx, { images, getRider, sheet, ratio }) {
  const { width: w, height: h, floor } = flightSize;
  function eel(x, tip, upper, time) {
    const width = flightRules.eelWidth,
      headH = 78;
    const length = upper ? tip : floor - tip;
    ctx.save();
    ctx.translate(x + width / 2, tip);
    if (upper) ctx.scale(1, -1);
    if (images.body) {
      ctx.drawImage(
        images.body,
        -width * 0.29,
        headH - 5,
        width * 0.58,
        Math.max(0, length - headH + 5),
      );
    }
    if (images.heads) {
      const cell = eelArt.heads;
      const column = Math.floor(time / 180) % cell.columns;
      ctx.drawImage(
        images.heads,
        column * cell.cw,
        0,
        cell.cw,
        cell.ch,
        -width / 2,
        0,
        width,
        headH,
      );
    }
    ctx.restore();
  }
  function paint(state, time) {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#123d59");
    bg.addColorStop(1, "#277b83");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    if (images.background) {
      ctx.globalAlpha = 0.32;
      ctx.drawImage(images.background, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }
    // Slow bubbles give depth without masking the obstacle openings.
    ctx.strokeStyle = "#dcfff34a";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 16; i++) {
      const x = (i * 137 + Math.sin(time / 1700 + i) * 7) % w;
      const y = h - ((time / 40 + i * 57) % h);
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 4), 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const obstacle of state.eels) {
      eel(obstacle.x, obstacle.center - flightRules.gap / 2, true, time);
      eel(obstacle.x, obstacle.center + flightRules.gap / 2, false, time);
    }
    // Reuse the town's actual rippled-sand tile. Mirrored neighbors meet at
    // matching edges; the scrolling distance follows play and stops on pause.
    const tileSize = 96;
    const offset = state.distance * 0.4;
    const first = Math.floor(offset / tileSize);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, floor, w, h - floor);
    ctx.clip();
    if (images.sand) {
      const cellW = images.sand.width / 4,
        cellH = images.sand.height / 4;
      for (let i = 0, x = -(offset % tileSize); x < w; i++, x += tileSize) {
        ctx.save();
        ctx.translate(x + tileSize / 2, floor);
        if ((first + i) % 2) ctx.scale(-1, 1);
        ctx.drawImage(
          images.sand,
          cellW * 2,
          cellH,
          cellW,
          cellH,
          -tileSize / 2,
          0,
          tileSize,
          tileSize,
        );
        ctx.restore();
      }
    }
    const waterline = ctx.createLinearGradient(0, floor, 0, floor + 9);
    waterline.addColorStop(0, "#246c7866");
    waterline.addColorStop(1, "#246c7800");
    ctx.fillStyle = waterline;
    ctx.fillRect(0, floor, w, 9);
    ctx.restore();
    const rider = getRider();
    if (rider && sheet) {
      ctx.save();
      ctx.translate(146, state.y);
      ctx.rotate(Math.max(-0.16, Math.min(0.25, state.velocity / 1600)));
      // The same selected, mounted family sprite as the overworld, facing
      // toward the eels. No second character/costume implementation exists.
      drawSprite(
        ctx,
        rider,
        sheet,
        0,
        15,
        (54 * sheet.ch) / sheet.bodyHeight,
        movementDirection(1, 0),
        true,
        time,
      );
      ctx.restore();
    }
  }

  return paint;
}
