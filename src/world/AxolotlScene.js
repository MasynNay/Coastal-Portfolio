import { flightSize, flightRules } from "./AxolotlFlight";
import { drawSprite } from "./art";
import { movementDirection } from "./animation";
import { drawEelGate } from "./EelGate";

// Canvas artwork is separate from the React dialog, input handlers and physics.
// The renderer reads the same immutable round snapshot on every device.
export function createAxolotlScene(ctx, { images, getRider, sheet, ratio }) {
  const { width: w, height: h, floor } = flightSize;
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
      const cropWidth = (images.background.height * w) / h;
      ctx.drawImage(
        images.background,
        (images.background.width - cropWidth) / 2,
        0,
        cropWidth,
        images.background.height,
        0,
        0,
        w,
        h,
      );
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
      const upperTip = obstacle.center - flightRules.gap / 2;
      const lowerTip = obstacle.center + flightRules.gap / 2;
      drawEelGate(
        ctx,
        images.eels,
        obstacle.x,
        upperTip,
        flightRules.eelWidth,
        upperTip,
        true,
        time,
      );
      drawEelGate(
        ctx,
        images.eels,
        obstacle.x,
        lowerTip,
        flightRules.eelWidth,
        floor - lowerTip,
        false,
        time,
      );
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
          cellW * 2 + 1,
          cellH + 1,
          cellW - 2,
          cellH - 2,
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
